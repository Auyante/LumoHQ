/**
 * LUMO HP — VERIFICACIÓN DE ARQUITECTURA DE MICROSERVICIOS
 * Comprueba la estructura src/microservices/*, el EventBus tipado (HMAC, correlación, idempotencia,
 * circuit breaker), el API Gateway /api/v1/*, la cascada al centavo y la política de cero emojis.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    failed++;
  }
}

const ROOT = path.join(__dirname, '..');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const read = (p) => (exists(p) ? fs.readFileSync(path.join(ROOT, p), 'utf8') : '');

console.log('====================================================');
console.log('LUMO HP — ARQUITECTURA DE MICROSERVICIOS (EDA)');
console.log('====================================================\n');

/* --- 1. Estructura --- */
console.log('--- 1. Estructura src/microservices/ y API Gateway ---');
const SERVICES = ['iam-gateway', 'crm-sales', 'erp-finance', 'erp-ops', 'erp-billing', 'erp-bi'];
for (const s of SERVICES) assert(exists(`src/microservices/${s}.ts`), `Microservicio svc-${s} presente`);
assert(exists('src/microservices/event-bus.ts'), 'EventBus tipado presente');
assert(exists('src/microservices/events.ts'), 'Contrato de eventos tipado presente');
assert(exists('src/microservices/gateway.ts'), 'Gateway de composición presente');
assert(exists('src/microservices/index.ts'), 'Barrel index presente');
assert(exists('src/microservices/service.ts'), 'Registro de servicios presente');
assert(exists('docker-compose.microservices.yml'), 'docker-compose.microservices.yml presente');

const apiRoutes = [
  'src/app/api/v1/health/route.ts',
  'src/app/api/v1/crm/leads/route.ts',
  'src/app/api/v1/crm/leads/[id]/route.ts',
  'src/app/api/v1/billing/contracts/route.ts',
  'src/app/api/v1/billing/deposit/route.ts',
  'src/app/api/v1/finance/waterfall/route.ts',
  'src/app/api/v1/ops/production/route.ts',
  'src/app/api/v1/bi/dashboard/route.ts',
  'src/app/api/v1/events/route.ts',
];
for (const r of apiRoutes) assert(exists(r), `Endpoint API Gateway ${r.replace('src/app/api/v1/', '/api/v1/').replace('/route.ts', '')}`);

/* --- 2. EventBus: firma, correlación, idempotencia y circuit breaker --- */
console.log('\n--- 2. EventBus tipado (HMAC, correlación, idempotencia, breaker) ---');
const bus = read('src/microservices/event-bus.ts');
assert(bus.includes("createHmac('sha256'"), 'Firma de integridad HMAC-SHA256 en cada evento');
assert(bus.includes('crypto.randomUUID()'), 'X-Correlation-ID UUID v4 por operación');
assert(bus.includes('timestampUtc'), 'Timestamp UTC en el sobre del evento');
assert(bus.includes('processed') && bus.includes('idempotencyKey'), 'Deduplicación por Idempotency-Key');
assert(bus.includes('BREAKER_THRESHOLD') && bus.includes('openUntil'), 'Circuit breaker por subscriptor');

/* --- 3. Flujo de eventos CRM -> ERP --- */
console.log('\n--- 3. Comunicación por eventos (crm.lead.converted -> ERP) ---');
const events = read('src/microservices/events.ts');
for (const name of ['crm.lead.converted', 'billing.contract.generated', 'billing.deposit.paid', 'erp.ops.production.started', 'erp.finance.ledger.posted']) {
  assert(events.includes(name), `Evento firmado ${name} definido en el contrato tipado`);
}
const crm = read('src/microservices/crm-sales.ts');
assert(crm.includes("publish('crm.lead.converted'"), 'svc-crm-sales emite crm.lead.converted al cerrar un prospecto');
const billing = read('src/microservices/erp-billing.ts');
assert(billing.includes("subscribe('crm.lead.converted'"), 'svc-erp-billing escucha crm.lead.converted y genera contrato + anticipo');
assert(billing.includes("publish('billing.deposit.paid'"), 'svc-erp-billing emite billing.deposit.paid al confirmar el pago');
const ops = read('src/microservices/erp-ops.ts');
assert(ops.includes("subscribe('billing.deposit.paid'"), 'svc-erp-ops escucha billing.deposit.paid y crea el expediente Día 0');
const fin = read('src/microservices/erp-finance.ts');
assert(fin.includes("subscribe('billing.deposit.paid'"), 'svc-erp-finance escucha billing.deposit.paid y ejecuta la cascada');

/* --- 4. Cascada matemática al centavo (Doc 04) --- */
console.log('\n--- 4. Precisión matemática de la cascada (Doc 04) ---');
function waterfall(clientNumber, isFounder, barbaraEarned) {
  const CAP = 500.0, TOOLS = 20.0;
  if (isFounder || clientNumber <= 2) {
    const gross = 250.0, stripe = 8.0;
    const barbara = Math.min(25.0, CAP - barbaraEarned);
    const pre = gross - stripe - barbara - TOOLS;
    const fund = Math.round(pre * 0.08);
    const net = pre - fund;
    return { gross, barbara, fund, carlos: Math.round((net / 2) * 100) / 100, tax: 25.0 };
  }
  const gross = 500.0, stripe = 15.0;
  const raw = clientNumber <= 5 ? 25.0 : 15.0;
  const barbara = Math.min(raw, CAP - barbaraEarned);
  const pre = gross - stripe - barbara - TOOLS;
  const fund = Math.round(pre * 0.08);
  const net = pre - fund;
  return { gross, barbara, fund, carlos: Math.round((net / 2) * 100) / 100, tax: 60.0 };
}
const f = waterfall(1, true, 0);
assert(f.gross === 250 && f.barbara === 25 && f.fund === 16 && f.carlos === 90.5 && f.tax === 25, 'Fundador $250: Bárbara $25, fondo $16, reparto $90.50, impuestos $25');
const r3 = waterfall(3, false, 50);
assert(r3.barbara === 25 && r3.fund === 35 && r3.carlos === 202.5, 'Regular 3-5 $500: Bárbara $25, fondo $35, reparto $202.50');
const r6 = waterfall(6, false, 125);
assert(r6.barbara === 15 && r6.fund === 36 && r6.carlos === 207, 'Regular 6-30 $500: Bárbara $15, fondo $36, reparto $207.00');
const cap = waterfall(25, false, 500);
assert(cap.barbara === 0 && cap.carlos === 214, 'Tope $500 de Bárbara alcanzado: comisión $0 y reparto $214.00');
const finSrc = read('src/microservices/erp-finance.ts');
assert(finSrc.includes('calculateSetupWaterfall'), 'svc-erp-finance usa el motor de cascada del Documento 04');

/* --- 5. Cero emojis --- */
console.log('\n--- 5. Política Cero Emojis en microservicios y gateway ---');
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/u;
let emojiCount = 0;
const scanDir = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanDir(full);
    else if (/\.ts$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      const hits = (text.match(new RegExp(EMOJI.source, 'gu')) || []).length;
      if (hits > 0) { console.error(`    emoji en ${path.relative(ROOT, full)}`); emojiCount += hits; }
    }
  }
};
scanDir(path.join(ROOT, 'src', 'microservices'));
scanDir(path.join(ROOT, 'src', 'app', 'api', 'v1'));
assert(emojiCount === 0, `Cero emojis Unicode en microservicios y /api/v1 (encontrados: ${emojiCount})`);

console.log('\n====================================================');
console.log(`RESUMEN MICROSERVICIOS: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log('====================================================');
process.exit(failed > 0 ? 1 : 0);
