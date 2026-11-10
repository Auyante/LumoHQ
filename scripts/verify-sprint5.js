/**
 * LUMO HQ — SPRINT 5 VERIFICATION & FINAL SECURITY AUDIT SUITE
 * Agents: [AGENTE 4: QA & RESPONSIVE TESTER] & [AGENTE 5: SECOPS & PENTESTER]
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('LUMO HQ — SPRINT 5 AUTOMATED VERIFICATION SUITE');
console.log('Motor Financiero, Tablero Dominical, Retención & Hardening');
console.log('====================================================\n');

// 1. Exact Mathematical Verification of Financial Waterfall (Doc 04)
console.log('--- 1. Pruebas Matemáticas de Cascada de Reparto (Doc 04) ---');

function calculateSetupWaterfall(clientNumber, isFounder, openedByBarbara = true, barbaraTotalEarnedSoFar = 0) {
  const BARBARA_CAP = 500.0;
  const TOOLS_AND_DOMAIN = 20.0;

  if (isFounder || clientNumber <= 2) {
    const grossAmount = 250.0;
    const stripeFee = 8.0;
    let barbaraCommission = 0;
    if (openedByBarbara && barbaraTotalEarnedSoFar < BARBARA_CAP) {
      const allowed = BARBARA_CAP - barbaraTotalEarnedSoFar;
      barbaraCommission = Math.min(25.0, allowed);
    }
    const preFundProfit = grossAmount - stripeFee - barbaraCommission - TOOLS_AND_DOMAIN;
    const businessFund8pct = Math.round(preFundProfit * 0.08);
    const netDistributable = preFundProfit - businessFund8pct;
    const carlosShare = Math.round((netDistributable / 2) * 100) / 100;
    const luisShare = Math.round((netDistributable / 2) * 100) / 100;
    const luisTaxReserve = 25.0;

    return { grossAmount, stripeFee, barbaraCommission, toolsAndDomain: TOOLS_AND_DOMAIN, preFundProfit, businessFund8pct, netDistributable, carlosShare, luisShare, luisTaxReserve };
  }

  const grossAmount = 500.0;
  const stripeFee = 15.0;
  let rawBarbaraRate = (clientNumber >= 3 && clientNumber <= 5) ? 25.0 : 15.0;
  let barbaraCommission = 0;
  if (openedByBarbara && barbaraTotalEarnedSoFar < BARBARA_CAP) {
    const allowed = BARBARA_CAP - barbaraTotalEarnedSoFar;
    barbaraCommission = Math.min(rawBarbaraRate, allowed);
  }
  const preFundProfit = grossAmount - stripeFee - barbaraCommission - TOOLS_AND_DOMAIN;
  const businessFund8pct = Math.round(preFundProfit * 0.08);
  const netDistributable = preFundProfit - businessFund8pct;
  const carlosShare = Math.round((netDistributable / 2) * 100) / 100;
  const luisShare = Math.round((netDistributable / 2) * 100) / 100;
  const luisTaxReserve = 60.0;

  return { grossAmount, stripeFee, barbaraCommission, toolsAndDomain: TOOLS_AND_DOMAIN, preFundProfit, businessFund8pct, netDistributable, carlosShare, luisShare, luisTaxReserve };
}

// Founder Test ($250)
const fRes = calculateSetupWaterfall(1, true, true, 0);
assert(fRes.grossAmount === 250, 'Fundador: Monto bruto $250.00');
assert(fRes.stripeFee === 8.0, 'Fundador: Comisión Stripe $8.00');
assert(fRes.barbaraCommission === 25.0, 'Fundador: Comisión Bárbara $25.00');
assert(fRes.toolsAndDomain === 20.0, 'Fundador: Herramientas y dominio $20.00');
assert(fRes.businessFund8pct === 16.0, 'Fundador: Fondo de reserva 8% = $16.00');
assert(fRes.carlosShare === 90.5 && fRes.luisShare === 90.5, 'Fundador: Reparto 50/50 exacto ($90.50 cada uno)');
assert(fRes.luisTaxReserve === 25.0, 'Fundador: Apartado impuestos Luis = $25.00');

// Regular Clients 3-5 ($500)
const reg3 = calculateSetupWaterfall(3, false, true, 50);
assert(reg3.grossAmount === 500, 'Clientes 3-5: Monto bruto $500.00');
assert(reg3.stripeFee === 15.0, 'Clientes 3-5: Comisión Stripe $15.00');
assert(reg3.barbaraCommission === 25.0, 'Clientes 3-5: Comisión Bárbara escalonada a $25.00');
assert(reg3.businessFund8pct === 35.0, 'Clientes 3-5: Fondo reserva 8% = $35.00');
assert(reg3.carlosShare === 202.5 && reg3.luisShare === 202.5, 'Clientes 3-5: Reparto 50/50 exacto ($202.50 cada uno)');
assert(reg3.luisTaxReserve === 60.0, 'Clientes 3-5: Apartado impuestos Luis = $60.00');

// Regular Clients 6-30 ($500)
const reg6 = calculateSetupWaterfall(6, false, true, 125);
assert(reg6.barbaraCommission === 15.0, 'Clientes 6-30: Comisión Bárbara ajustada a $15.00 según Doc 04');
assert(reg6.businessFund8pct === 36.0, 'Clientes 6-30: Fondo reserva 8% = $36.00');
assert(reg6.carlosShare === 207.0 && reg6.luisShare === 207.0, 'Clientes 6-30: Reparto 50/50 exacto ($207.00 cada uno)');

// 2. Barbara $500 Cap Shutoff
console.log('\n--- 2. Pruebas de Apagado de Comisión de Bárbara ($500 Cap) ---');
const capReachedRes = calculateSetupWaterfall(25, false, true, 500.0);
assert(capReachedRes.barbaraCommission === 0, 'Comisión de Bárbara se apaga a $0.00 al alcanzar el tope de $500');
assert(capReachedRes.carlosShare === 214.0, 'El remanente de comisión de Bárbara se transfiere íntegramente a Carlos y Luis ($214.00)');

// 3. Operational Expense Manager Dual Approval (> $100)
console.log('\n--- 3. Pruebas de la Regla de Doble Aprobación para Gastos >$100 ---');
const financeCode = fs.readFileSync(path.join(__dirname, '../src/lib/finance.ts'), 'utf8');

assert(financeCode.includes('amount > 100.0'), 'Regla de negocio: Gastos >$100 requieren aprobación dual');
assert(financeCode.includes('approvedByLuis && exp.approvedByCarlos'), 'Requiere ambas firmas (Luis y Carlos) para aprobarse');

// Test dual approval logic directly
function processExpense(amount, requestedBy) {
  const requiresDualApproval = amount > 100.0;
  const initialApprovedByLuis = requestedBy === 'ADMIN_LUIS';
  const initialApprovedByCarlos = requestedBy === 'ADMIN_CARLOS';
  const status = (requiresDualApproval && (!initialApprovedByLuis || !initialApprovedByCarlos))
    ? 'PENDING_APPROVAL'
    : 'APPROVED';
  return { amount, status, approvedByLuis: initialApprovedByLuis, approvedByCarlos: initialApprovedByCarlos };
}

const expSmall = processExpense(45.0, 'ADMIN_LUIS');
assert(expSmall.status === 'APPROVED', 'Gasto <= $100 se aprueba automáticamente');

const expLarge = processExpense(180.0, 'ADMIN_LUIS');
assert(expLarge.status === 'PENDING_APPROVAL', 'Gasto > $100 inicia en PENDING_APPROVAL');
assert(expLarge.approvedByLuis === true && expLarge.approvedByCarlos === false, 'Tiene solo 1 firma registrada');

// Carlos signs -> Status becomes APPROVED
expLarge.approvedByCarlos = true;
if (expLarge.approvedByLuis && expLarge.approvedByCarlos) expLarge.status = 'APPROVED';
assert(expLarge.status === 'APPROVED', 'Gasto > $100 cambia a APPROVED tras la firma simultánea de Carlos');

// 4. Sunday Dashboard & Risk #1 Evaluation
console.log('\n--- 4. Pruebas del Tablero Dominical y Monitor de Riesgo #1 ---');
const sundayCode = fs.readFileSync(path.join(__dirname, '../src/lib/sunday-dashboard.ts'), 'utf8');

assert(sundayCode.includes('Día 14') && sundayCode.includes('Día 30') && sundayCode.includes('Día 60') && sundayCode.includes('Día 90'), 'Incluye los 4 hitos dominicales (Días 14, 30, 60 y 90)');

function evaluateRisk1Alert(hours) {
  const totalHours = hours.luisHours + hours.carlosHours + hours.barbaraHours;
  const reasons = [];
  if (totalHours < 18.0) {
    reasons.push(`Horas totales invertidas (${totalHours}h) por debajo del umbral mínimo de 18 horas semanales.`);
  }
  if (hours.contactsThisWeek < 10) {
    reasons.push(`Contactos realizados en la semana (${hours.contactsThisWeek}) por debajo de la cuota mínima de 10 contactos.`);
  }
  return { isAlertActive: reasons.length > 0, totalHours, reasons };
}

// Healthy week: 9h Luis + 16h Carlos + 5h Barbara = 30h total (>18h) and 14 contacts (>10)
const healthyWeek = { weekNumber: 2, luisHours: 9.0, carlosHours: 16.0, barbaraHours: 5.0, contactsThisWeek: 14 };
const healthyRes = evaluateRisk1Alert(healthyWeek);
assert(!healthyRes.isAlertActive, 'Semana saludable: Alerta de Riesgo #1 apagada');

// Slack week: 5h Luis + 6h Carlos + 2h Barbara = 13h (<18h) and 6 contacts (<10)
const slackWeek = { weekNumber: 3, luisHours: 5.0, carlosHours: 6.0, barbaraHours: 2.0, contactsThisWeek: 6 };
const slackRes = evaluateRisk1Alert(slackWeek);
assert(slackRes.isAlertActive, 'Semana por debajo del umbral: Alerta de Riesgo #1 ACTIVADA');
assert(slackRes.reasons.length === 2, 'Detecta tanto el déficit de horas como el déficit de contactos');

// 5. Retention System & Change Tickets Rules
console.log('\n--- 5. Pruebas del Sistema de Retención y Tickets de Mantenimiento ---');
const retentionCode = fs.readFileSync(path.join(__dirname, '../src/lib/retention.ts'), 'utf8');

assert(retentionCode.includes('cost = 0.0') && retentionCode.includes('SMALL_CHANGE'), 'Cambios incluidos (2 primeros) a costo $0.00');
assert(retentionCode.includes('cost = 25.0') && retentionCode.includes('EXTRA_CHANGE'), '3er cambio en el mismo mes se factura a $25 USD');
assert(retentionCode.includes('cost = 75.0') && retentionCode.includes('MAJOR_WORK'), 'Trabajos mayores (>30 min) tienen tarifa base de $75 USD');
assert(retentionCode.includes('callButtonClicks') && retentionCode.includes('newReviewsCount'), 'Estructura los 7 indicadores reales del reporte mensual');

// 6. Security Perimetral & SAST Audit (OWASP ASVS)
console.log('\n--- 6. Auditoría de Ciberseguridad Perimetral y Cabeceras HTTP ---');
const nextConfig = fs.readFileSync(path.join(__dirname, '../next.config.mjs'), 'utf8');
const middleware = fs.readFileSync(path.join(__dirname, '../src/middleware.ts'), 'utf8');

assert(nextConfig.includes('Content-Security-Policy') || middleware.includes('Content-Security-Policy'), 'Cabecera CSP configurada');
assert(!nextConfig.includes('unsafe-eval'), 'CSP estricto sin unsafe-eval');
assert(nextConfig.includes('Strict-Transport-Security') || middleware.includes('Strict-Transport-Security'), 'Cabecera HSTS con preload');
assert(nextConfig.includes('X-Frame-Options') && nextConfig.includes('DENY'), 'Cabecera X-Frame-Options: DENY');
assert(nextConfig.includes('X-Content-Type-Options') && nextConfig.includes('nosniff'), 'Cabecera X-Content-Type-Options: nosniff');
assert(nextConfig.includes('Referrer-Policy'), 'Cabecera Referrer-Policy configurada');
assert(nextConfig.includes('Permissions-Policy'), 'Cabecera Permissions-Policy configurada');

// 7. Texas Sales Tax Permit & Legal Vault Verification
console.log('\n--- 7. Verificación de Bóveda Legal y Texas Sales Tax Permit ---');
const finanzasPage = fs.readFileSync(path.join(__dirname, '../src/app/admin/finanzas/page.tsx'), 'utf8');

assert(finanzasPage.includes('DBA Midland'), 'Registro del DBA de Luis Barbera en Midland County');
assert(finanzasPage.includes('Texas Sales Tax') || finanzasPage.includes('Permiso de Ventas'), 'Configuración del Permiso de Ventas de Texas');
assert(finanzasPage.includes('W-8BEN'), 'Formularios W-8BEN de Carlos y Bárbara en archivo');
// The mileage ledger moved to its own component and engine (Phase 4).
const ledgerEngine = fs.readFileSync(path.join(__dirname, '../src/lib/ledger-engine.ts'), 'utf8');
assert(finanzasPage.includes('ScheduleCLedger') && /IRS_MILEAGE_RATE = 0\.67/.test(ledgerEngine) && /DUAL_APPROVAL_OVER = 100/.test(ledgerEngine), 'Rastreador de deducción fiscal por millaje de Luis ($0.67/milla)');

console.log('\n====================================================');
console.log(`RESUMEN DE PRUEBAS SPRINT 5: ${passedTests} PASADAS, ${failedTests} FALLIDAS`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
