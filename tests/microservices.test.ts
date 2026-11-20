import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { EVENT_PAYLOAD_SCHEMAS, getEventBus, microservices } from '@/microservices';
import { crmStore } from '@/lib/crm';

/**
 * Suite de microservicios: comunicación por eventos, precisión de la cascada, idempotencia,
 * circuit breaker, TCPA, WAF y RBAC. Corre aislada en su propio worker (vitest), así que muta el
 * estado en memoria de este proceso sin tocar los otros archivos de prueba.
 */

const bus = getEventBus();

const NO_SIGNALS = {
  scoreReviews: false, scoreWebsite: false, scorePhotos: false, scoreHours: false,
  scoreDescription: false, scoreReviewResponse: false, scoreBooking: false, scoreSpanish: false,
} as const;

const makeLead = (n: number) => ({
  businessName: `Negocio Prueba ${n}`,
  ownerName: `Dueño ${n}`,
  phone: `(432) 555-01${String(n).padStart(2, '0')}`,
  city: 'Midland' as const,
  category: 'Barbería',
  source: 'BARBARA' as const,
  batchNumber: 1,
  signals: { ...NO_SIGNALS, scoreReviews: true, scoreSpanish: true },
});

beforeEach(() => bus.reset());

describe('EventBus tipado: integridad, correlación e idempotencia', () => {
  it('firma HMAC cada evento y lo verifica (rechaza firmas alteradas)', () => {
    const ctx = { actorId: 'usr-test', role: 'SUPER_ADMIN', source: 'svc-crm-sales' as const };
    const pub = bus.publish('crm.lead.created', { leadId: 'l1', businessName: 'B', city: 'Midland', priority: 'P1' }, ctx);
    expect(bus.verify(pub.envelope).ok).toBe(true);

    const tampered = { ...pub.envelope, payload: { ...pub.envelope.payload, businessName: 'HACKED' } };
    expect(bus.verify(tampered).reason).toBe('bad-signature');
  });

  it('propaga el X-Correlation-ID y permite trazarlo de punta a punta', () => {
    const correlationId = randomUUID();
    bus.publish('crm.lead.created', { leadId: 'l2', businessName: 'B', city: 'Odessa', priority: 'P2' },
      { actorId: 'a', role: 'r', source: 'svc-crm-sales', correlationId });
    const trace = bus.traceByCorrelation(correlationId);
    expect(trace).toHaveLength(1);
    expect(trace[0].correlationId).toBe(correlationId);
  });

  it('deduplica con Idempotency-Key (no procesa dos veces el mismo evento)', () => {
    const payload = { leadId: 'l3', businessName: 'B', city: 'Midland', priority: 'P1' } as const;
    const first = bus.publish('crm.lead.created', payload, { actorId: 'a', role: 'r', source: 'svc-crm-sales', idempotencyKey: 'ik-1' });
    const second = bus.publish('crm.lead.created', payload, { actorId: 'a', role: 'r', source: 'svc-crm-sales', idempotencyKey: 'ik-1' });
    expect(first.skipped).toBe('no-subscribers');
    expect(second.skipped).toBe('duplicate');
    expect(bus.trace()).toHaveLength(1);
  });

  it('abre el circuit breaker tras fallos repetidos de un subscriptor', () => {
    let calls = 0;
    const off = bus.subscribe('crm.lead.created', () => {
      calls++;
      throw new Error('boom');
    }, 'test-thrower');
    const ctx = { actorId: 'a', role: 'r', source: 'svc-crm-sales' as const };
    const payload = { leadId: 'l4', businessName: 'B', city: 'Midland', priority: 'P1' } as const;
    for (let i = 0; i < 4; i++) bus.publish('crm.lead.created', payload, ctx);
    expect(calls).toBe(3); // el 4.º se salta: circuito abierto
    expect(bus.breakerStats().some((b) => b.key.includes('test-thrower') && b.open)).toBe(true);
    off();
  });
});

describe('Cadena EDA: CRM -> Billing -> Ops + Finance', () => {
  it('cierra un lead y propaga contrato, producción y asiento contable', () => {
    const correlationId = randomUUID();
    const lead = microservices.crm.createLead(makeLead(1), { actorId: 'usr-test', role: 'SUPER_ADMIN', correlationId });

    const conv = microservices.crm.convertLead(lead.id, { actorId: 'usr-test', role: 'SUPER_ADMIN', correlationId });
    expect(conv.ok).toBe(true);
    const { clientNumber, packageType } = conv.ok ? conv.value : { clientNumber: 0, packageType: 'BASE' as const };

    // billing generó el contrato automáticamente al escuchar crm.lead.converted
    const contract = microservices.billing.listContracts().find((c) => c.leadId === lead.id);
    expect(contract).toBeTruthy();
    expect(contract!.depositAmount).toBe(packageType === 'FOUNDER' ? 125 : 250);

    // confirmar el anticipo dispara ops (Día 0) y finanzas (cascada)
    const deposit = microservices.billing.confirmDeposit({
      contractId: contract!.id,
      amount: contract!.depositAmount,
      stripePaymentIntentId: 'pi_flow_1',
      idempotencyKey: 'ik-flow-1',
    }, { actorId: 'usr-test', role: 'SUPER_ADMIN', correlationId });
    expect(deposit.ok).toBe(true);

    const project = microservices.ops.listProduction().find((p) => p.contractId === contract!.id);
    expect(project).toBeTruthy();
    expect(project!.currentDay).toBe(0);
    expect(project!.clockStatus).toBe('CLOCK_PAUSED_MISSING_DAY1');

    const tx = microservices.finance.listTransactions().find((t) => t.stripePaymentIntentId === 'pi_flow_1');
    expect(tx).toBeTruthy();
    expect(tx!.waterfall!.grossAmount).toBe(packageType === 'FOUNDER' ? 250 : 500);
    expect(tx!.waterfall!.carlosShare).toBeCloseTo(clientNumber <= 2 ? 90.5 : 202.5, 2);

    // trazabilidad: todos los saltos comparten el mismo correlationId y verifican la firma
    const names = bus.traceByCorrelation(correlationId).map((e) => e.name);
    expect(names).toContain('crm.lead.converted');
    expect(names).toContain('billing.contract.generated');
    expect(names).toContain('billing.deposit.paid');
    expect(names).toContain('erp.ops.production.started');
    expect(names).toContain('erp.finance.ledger.posted');
    for (const e of bus.traceByCorrelation(correlationId)) expect(bus.verify(e).ok).toBe(true);

    // cada payload emitido valida contra su esquema Zod
    for (const e of bus.traceByCorrelation(correlationId)) {
      const schema = EVENT_PAYLOAD_SCHEMAS[e.name];
      expect(schema.safeParse(e.payload).success).toBe(true);
    }
  });

  it('no duplica el asiento contable ante un depósito idempotente', () => {
    const correlationId = randomUUID();
    const lead = microservices.crm.createLead(makeLead(2), { actorId: 'usr-test', role: 'SUPER_ADMIN', correlationId });
    microservices.crm.convertLead(lead.id, { actorId: 'usr-test', role: 'SUPER_ADMIN', correlationId });
    const contract = microservices.billing.listContracts().find((c) => c.leadId === lead.id)!;

    const args = {
      contractId: contract.id,
      amount: contract.depositAmount,
      stripePaymentIntentId: 'pi_idem_1',
      idempotencyKey: 'ik-idem-1',
    };
    microservices.billing.confirmDeposit(args, { actorId: 'usr-test', role: 'SUPER_ADMIN', correlationId });
    microservices.billing.confirmDeposit(args, { actorId: 'usr-test', role: 'SUPER_ADMIN', correlationId: randomUUID() });

    expect(microservices.finance.listTransactions().filter((t) => t.stripePaymentIntentId === 'pi_idem_1')).toHaveLength(1);
  });
});

describe('Cascada financiera (Doc 04) y gobernanza', () => {
  it('calcula al centavo fundador, regular 3-5, regular 6-30 y tope de Bárbara', () => {
    const q = microservices.finance.quoteWaterfall;

    expect(q(1, true, true, 0)).toMatchObject({ barbaraCommission: 25, businessFund8pct: 16, carlosShare: 90.5, luisShare: 90.5, luisTaxReserve: 25 });
    expect(q(3, false, true, 50)).toMatchObject({ barbaraCommission: 25, businessFund8pct: 35, carlosShare: 202.5, luisShare: 202.5, luisTaxReserve: 60 });
    expect(q(6, false, true, 125)).toMatchObject({ barbaraCommission: 15, businessFund8pct: 36, carlosShare: 207, luisShare: 207 });
    expect(q(25, false, true, 500)).toMatchObject({ barbaraCommission: 0, carlosShare: 214, luisShare: 214 });
  });

  it('bloquea gastos > $100 hasta la doble firma de Luis y Carlos', () => {
    const exp = microservices.finance.createExpense('Herramienta mayor', 180, 'ADMIN_LUIS');
    expect(exp.status).toBe('PENDING_APPROVAL');
    microservices.finance.approveExpense(exp.id, 'ADMIN_CARLOS');
    expect(microservices.finance.listExpenses().find((e) => e.id === exp.id)!.status).toBe('APPROVED');
  });
});

describe('Guardia legal TCPA, WAF y RBAC', () => {
  it('bloquea el 3.er seguimiento (TCPA) sobre el prospecto seed', () => {
    const seed = crmStore.getAll().find((p) => p.followUpCount >= 3)!;
    const res = crmStore.incrementFollowUp(seed.id);
    expect(res.success).toBe(false);
    expect(res.error).toContain('TCPA');
  });

  it('detecta SQLi, XSS y path traversal con el WAF', () => {
    expect(microservices.iam.detectAttack("' OR 1=1 --")).toBe('SQLI');
    expect(microservices.iam.detectAttack('<script>alert(1)</script>')).toBe('XSS');
    expect(microservices.iam.detectAttack('../../etc/passwd')).toBe('PATH_TRAVERSAL');
    expect(microservices.iam.detectAttack('Tacos & Más, un negocio normal')).toBeNull();
  });

  it('aplica RBAC por rol (Bárbara fuera de finanzas, dentro de CRM)', () => {
    expect(microservices.iam.canAccessRoute('SALES_BARBARA', '/admin/finanzas')).toBe(false);
    expect(microservices.iam.canAccessRoute('SALES_BARBARA', '/admin/crm')).toBe(true);
    expect(microservices.iam.canAccessRoute('SUPER_ADMIN', '/api/v1/finance/waterfall')).toBe(true);
    expect(microservices.iam.canAccessRoute('SALES_BARBARA', '/api/v1/finance/waterfall')).toBe(false);
  });
});
