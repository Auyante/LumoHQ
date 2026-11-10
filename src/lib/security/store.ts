import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Security state: a hash-chained audit log, the IP blocklist and failure counters.
 * Stored as files under data/ (gitignored), like users.json. On a serverless host with an
 * ephemeral disk this state resets per instance: move it to a database before going live there.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'security-audit.jsonl');
const BLOCK_FILE = path.join(DATA_DIR, 'security-blocks.json');

export type Severity = 'INFO' | 'WARN' | 'CRITICAL';
export type AuditType =
  | 'LOGIN_OK' | 'LOGIN_FAIL' | 'LOGIN_LOCKED' | 'LOGOUT'
  | 'ACCESS_DENIED' | 'SESSION_INVALID'
  | 'WAF_BLOCK' | 'HONEYPOT' | 'IP_BLOCKED' | 'IP_UNBLOCKED' | 'ACCOUNT_UNLOCKED'
  | 'USER_CREATED' | 'PASSWORD_ROTATED' | 'USER_SUSPENDED' | 'USER_REACTIVATED' | 'SESSIONS_REVOKED' | 'ROLE_CHANGED'
  | 'CONTRACT_SIGNED' | 'TAMPERING' | 'WEBHOOK_REJECTED' | 'UPLOAD_REJECTED'
  | 'CRM_IMPORT' | 'CRM_OPT_OUT'
  | 'LEDGER_TRIP' | 'LEDGER_EXPENSE' | 'LEDGER_SIGN' | 'LEDGER_REJECT' | 'SUNDAY_SAVE';

export interface AuditEntry {
  seq: number;
  ts: string;
  type: AuditType;
  severity: Severity;
  ip: string;
  actor?: string;
  detail: string;
  prev: string;
  hash: string;
}

const GENESIS = '0'.repeat(64);

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function entryHash(e: Omit<AuditEntry, 'hash'>): string {
  return crypto.createHash('sha256').update(JSON.stringify([e.seq, e.ts, e.type, e.severity, e.ip, e.actor ?? '', e.detail, e.prev])).digest('hex');
}

/**
 * The last entry is always read from disk, never cached: the middleware and the route handlers are
 * separate module instances, so an in-memory "last hash" would go stale and fork the chain.
 * Read-tail-then-append runs synchronously, so nothing can interleave inside one Node process.
 */
function lastEntry(): { seq: number; hash: string } {
  let fd: number | null = null;
  try {
    fd = fs.openSync(AUDIT_FILE, 'r');
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, 8192);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    const lines = buf.toString('utf8').trimEnd().split('\n');
    const last = JSON.parse(lines[lines.length - 1]) as AuditEntry;
    return { seq: last.seq, hash: last.hash };
  } catch {
    return { seq: 0, hash: GENESIS };
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}

/** Append-only, hash-chained: editing or deleting any line breaks every hash after it. */
export function audit(type: AuditType, severity: Severity, ip: string, detail: string, actor?: string): void {
  try {
    ensureDir();
    const prev = lastEntry();
    const base = { seq: prev.seq + 1, ts: new Date().toISOString(), type, severity, ip, actor, detail: detail.slice(0, 500), prev: prev.hash };
    const entry: AuditEntry = { ...base, hash: entryHash(base) };
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', { encoding: 'utf8', mode: 0o600 });
    if (severity === 'CRITICAL') console.warn(`[security] ${type} ${ip} ${detail}`);
  } catch (err) {
    console.error('[security] audit write failed', err);
  }
}

export function readAudit(limit = 200): { entries: AuditEntry[]; intact: boolean; brokenAt?: number; total: number } {
  let lines: string[] = [];
  try { lines = fs.readFileSync(AUDIT_FILE, 'utf8').trimEnd().split('\n').filter(Boolean); } catch { /* empty log */ }
  let prev = GENESIS, intact = true, brokenAt: number | undefined;
  const all: AuditEntry[] = [];
  for (const line of lines) {
    let e: AuditEntry;
    try { e = JSON.parse(line); } catch { intact = false; brokenAt ??= all.length + 1; continue; }
    const { hash, ...rest } = e;
    if (e.prev !== prev || entryHash(rest) !== hash) { if (intact) brokenAt = e.seq; intact = false; }
    prev = hash;
    all.push(e);
  }
  return { entries: all.slice(-limit).reverse(), intact, brokenAt, total: all.length };
}

/* ---------- IP blocklist with exponential cooldown ---------- */

interface Block { until: number; strikes: number; reason: string; since: string }
type Blocks = Record<string, Block>;

const BASE_BLOCK_MS = 5 * 60 * 1000;
const MAX_BLOCK_MS = 24 * 60 * 60 * 1000;

function readBlocks(): Blocks {
  try { return JSON.parse(fs.readFileSync(BLOCK_FILE, 'utf8')) as Blocks; } catch { return {}; }
}
function writeBlocks(b: Blocks) {
  ensureDir();
  fs.writeFileSync(BLOCK_FILE, JSON.stringify(b, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function allowlisted(ip: string): boolean {
  return (process.env.SECURITY_ALLOWLIST_IPS || '').split(',').map((s) => s.trim()).filter(Boolean).includes(ip);
}

export function isBlocked(ip: string): Block | null {
  if (allowlisted(ip)) return null;
  const b = readBlocks()[ip];
  return b && b.until > Date.now() ? b : null;
}

/** Each new strike doubles the block: 5 min, 10, 20 ... capped at 24 h. */
export function blockIp(ip: string, reason: string): Block | null {
  if (allowlisted(ip)) return null;
  const blocks = readBlocks();
  const strikes = (blocks[ip]?.strikes ?? 0) + 1;
  const ms = Math.min(BASE_BLOCK_MS * 2 ** (strikes - 1), MAX_BLOCK_MS);
  const block = { until: Date.now() + ms, strikes, reason, since: new Date().toISOString() };
  blocks[ip] = block;
  writeBlocks(blocks);
  audit('IP_BLOCKED', 'CRITICAL', ip, `${reason} · ${Math.round(ms / 60000)} min · strike ${strikes}`);
  return block;
}

export function unblockIp(ip: string, actor: string, actorIp: string): boolean {
  const blocks = readBlocks();
  if (!blocks[ip]) return false;
  delete blocks[ip];
  writeBlocks(blocks);
  audit('IP_UNBLOCKED', 'WARN', actorIp, `unblocked ${ip}`, actor);
  return true;
}

export function listBlocks(): { ip: string; until: string; strikes: number; reason: string; since: string; active: boolean }[] {
  const now = Date.now();
  return Object.entries(readBlocks()).map(([ip, b]) => ({ ip, until: new Date(b.until).toISOString(), strikes: b.strikes, reason: b.reason, since: b.since, active: b.until > now }))
    .sort((a, b) => (a.since < b.since ? 1 : -1));
}

/* ---------- failure counters (login, bursts) ---------- */

const g = globalThis as unknown as { __lumoFails?: Map<string, { count: number; resetAt: number }> };
const fails = (g.__lumoFails ??= new Map());

/** Count a failure in a sliding window. Returns the count after this failure. */
export function recordFailure(key: string, windowMs: number): number {
  const now = Date.now();
  if (fails.size > 5000) for (const [k, v] of fails) if (v.resetAt < now) fails.delete(k); // bounded memory
  const rec = fails.get(key);
  if (!rec || rec.resetAt < now) { fails.set(key, { count: 1, resetAt: now + windowMs }); return 1; }
  rec.count++;
  return rec.count;
}
export function clearFailures(key: string) { fails.delete(key); }
export function failureCount(key: string): number {
  const rec = fails.get(key);
  return rec && rec.resetAt > Date.now() ? rec.count : 0;
}

/* ---------- account lockout (exponential, per account) ---------- */

const locks = ((globalThis as unknown as { __lumoLocks?: Map<string, { until: number; strikes: number }> }).__lumoLocks ??= new Map());

export function accountLockedUntil(email: string): number | null {
  const l = locks.get(email);
  return l && l.until > Date.now() ? l.until : null;
}
export function lockAccount(email: string): number {
  const strikes = (locks.get(email)?.strikes ?? 0) + 1;
  const until = Date.now() + Math.min(BASE_BLOCK_MS * 2 ** (strikes - 1), MAX_BLOCK_MS);
  locks.set(email, { until, strikes });
  return until;
}
export function clearAccountLock(email: string): boolean { return locks.delete(email.trim().toLowerCase()); }
/** Accounts locked right now, for the security center. */
export function listAccountLocks(): { email: string; until: number; strikes: number }[] {
  const now = Date.now();
  return [...locks.entries()].filter(([, l]) => l.until > now).map(([email, l]) => ({ email, ...l }));
}
