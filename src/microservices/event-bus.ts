import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  type EventContext,
  type EventEnvelope,
  type EventName,
  type EventPayloadMap,
} from './events';

/**
 * LUMO HQ — EVENT BUS INTERNO TIPADO (EDA)
 * Comunicación exclusiva entre microservicios. Cada evento va firmado con HMAC-SHA256, lleva un
 * X-Correlation-ID (UUID v4) para trazabilidad distribuida, timestamp UTC, actorId y rol. Los
 * endpoints transaccionales pasan un Idempotency-Key que el bus deduplica, y cada subscriptor queda
 * protegido por un circuit breaker para que un módulo caído no tumbe al resto.
 *
 * Node.js runtime only (usa crypto y fs). En producción la firma usa SESSION_SECRET/EVENT_BUS_SECRET
 * (32+ chars).
 */

const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 30_000;
const CLOCK_SKEW_MS = 5 * 60_000;
const MAX_LOG_ENTRIES = 500;
const LOG_FILE = path.join(process.cwd(), 'data', 'event-bus.jsonl');

type Handler = (env: EventEnvelope) => void;

export interface DispatchResult {
  subscriber: string;
  ok: boolean;
  error?: string;
  /** True when the circuit breaker skipped this delivery. */
  skipped?: boolean;
}

export interface PublishResult<K extends EventName> {
  envelope: EventEnvelope<EventPayloadMap[K]>;
  dispatched: boolean;
  skipped?: 'duplicate' | 'no-subscribers';
  results: DispatchResult[];
}

export interface VerifyResult {
  ok: boolean;
  reason?: 'malformed' | 'bad-signature' | 'stale' | 'future';
}

interface BreakerState {
  failures: number;
  openUntil: number;
}

const canonical = (env: Omit<EventEnvelope, 'signature'>): string =>
  JSON.stringify([env.id, env.correlationId, env.name, env.source, env.actorId, env.role, env.timestampUtc, env.payload]);

export class EventBus {
  private readonly secret: string;
  private readonly handlers = new Map<EventName, { id: string; fn: Handler }[]>();
  private readonly log: EventEnvelope[] = [];
  private readonly processed = new Set<string>();
  private readonly breakers = new Map<string, BreakerState>();
  private readonly persist: boolean;

  constructor(secret: string, persist = true) {
    if (secret.length < 32) throw new Error('EVENT_BUS_SECRET (32+ chars) is required.');
    this.secret = secret;
    this.persist = persist;
  }

  /* ------------------------------------------------ signing & verification */

  sign(envelope: Omit<EventEnvelope, 'signature'>): string {
    return crypto.createHmac('sha256', this.secret).update(canonical(envelope)).digest('hex');
  }

  verify(envelope: EventEnvelope): VerifyResult {
    if (!envelope || typeof envelope.signature !== 'string' || envelope.signature.length < 32) {
      return { ok: false, reason: 'malformed' };
    }
    const { signature, ...rest } = envelope;
    const expected = this.sign(rest);
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'bad-signature' };

    const ts = Date.parse(envelope.timestampUtc);
    if (!Number.isFinite(ts)) return { ok: false, reason: 'malformed' };
    if (ts < Date.now() - CLOCK_SKEW_MS) return { ok: false, reason: 'stale' };
    if (ts > Date.now() + CLOCK_SKEW_MS) return { ok: false, reason: 'future' };
    return { ok: true };
  }

  /* ------------------------------------------------ publish */

  publish<K extends EventName>(name: K, payload: EventPayloadMap[K], ctx: EventContext): PublishResult<K> {
    const correlationId = ctx.correlationId || crypto.randomUUID();

    if (ctx.idempotencyKey && this.processed.has(ctx.idempotencyKey)) {
      return {
        envelope: this.buildEnvelope(name, payload, ctx, correlationId),
        dispatched: false,
        skipped: 'duplicate',
        results: [],
      };
    }
    if (ctx.idempotencyKey) this.processed.add(ctx.idempotencyKey);

    const envelope = this.buildEnvelope(name, payload, ctx, correlationId);
    this.appendLog(envelope);

    const subs = this.handlers.get(name) || [];
    const results: DispatchResult[] = [];
    for (const sub of subs) results.push(this.deliver(sub, envelope));

    return {
      envelope,
      dispatched: results.some((r) => r.ok),
      skipped: subs.length === 0 ? 'no-subscribers' : undefined,
      results,
    };
  }

  private buildEnvelope<K extends EventName>(
    name: K,
    payload: EventPayloadMap[K],
    ctx: EventContext,
    correlationId: string,
  ): EventEnvelope<EventPayloadMap[K]> {
    const unsigned = {
      id: crypto.randomUUID(),
      correlationId,
      name,
      source: ctx.source,
      actorId: ctx.actorId,
      role: ctx.role,
      timestampUtc: new Date().toISOString(),
      payload,
    };
    return { ...unsigned, signature: this.sign(unsigned) };
  }

  private deliver(sub: { id: string; fn: Handler }, envelope: EventEnvelope): DispatchResult {
    const key = `${envelope.name}:${sub.id}`;
    const breaker = this.breakers.get(key);
    if (breaker && breaker.openUntil > Date.now()) {
      return { subscriber: sub.id, ok: false, skipped: true, error: 'circuit open' };
    }

    try {
      sub.fn(envelope);
      if (breaker) this.breakers.delete(key);
      return { subscriber: sub.id, ok: true };
    } catch (err) {
      const failures = (breaker?.failures ?? 0) + 1;
      const next: BreakerState = {
        failures,
        openUntil: failures >= BREAKER_THRESHOLD ? Date.now() + BREAKER_COOLDOWN_MS : breaker?.openUntil ?? 0,
      };
      this.breakers.set(key, next);
      return { subscriber: sub.id, ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /* ------------------------------------------------ subscription */

  subscribe<K extends EventName>(name: K, handler: (env: EventEnvelope<EventPayloadMap[K]>) => void, id?: string): () => void {
    const key = id ?? name;
    const list = this.handlers.get(name) || [];
    list.push({ id: key, fn: handler as unknown as Handler });
    this.handlers.set(name, list);
    return () => {
      const current = this.handlers.get(name) || [];
      this.handlers.set(name, current.filter((s) => s.id !== key));
    };
  }

  /* ------------------------------------------------ tracing & inspection */

  trace(): EventEnvelope[] {
    return [...this.log];
  }

  traceByCorrelation(correlationId: string): EventEnvelope[] {
    return this.log.filter((e) => e.correlationId === correlationId);
  }

  breakerStats(): { key: string; failures: number; open: boolean }[] {
    const now = Date.now();
    return [...this.breakers.entries()].map(([key, b]) => ({ key, failures: b.failures, open: b.openUntil > now }));
  }

  /**
   * Clears transient state (trace, idempotency keys, breakers) for tests. Subscriptions stay
   * registered: the services wire themselves once at module load.
   */
  reset(): void {
    this.log.length = 0;
    this.processed.clear();
    this.breakers.clear();
  }

  private appendLog(envelope: EventEnvelope): void {
    this.log.push(envelope);
    if (this.log.length > MAX_LOG_ENTRIES) this.log.shift();
    if (!this.persist) return;
    try {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
      fs.appendFileSync(LOG_FILE, JSON.stringify(envelope) + '\n', { encoding: 'utf8', mode: 0o600 });
    } catch {
      /* persistence is best-effort: the in-memory trace still works */
    }
  }
}

/* ------------------------------------------------ singleton */

const g = globalThis as unknown as { __lumoEventBus?: EventBus };

/** Shared instance across route-handler module bundles, like the other Lumo stores. */
export function getEventBus(): EventBus {
  if (g.__lumoEventBus) return g.__lumoEventBus;
  const secret = process.env.EVENT_BUS_SECRET || process.env.SESSION_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && (!secret || secret.length < 32)) {
    throw new Error('SESSION_SECRET or EVENT_BUS_SECRET (32+ chars) is required in production.');
  }
  const effectiveSecret = secret && secret.length >= 32 ? secret : 'dev-only-event-bus-secret-do-not-deploy';
  g.__lumoEventBus = new EventBus(effectiveSecret, process.env.NODE_ENV !== 'test');
  return g.__lumoEventBus;
}
