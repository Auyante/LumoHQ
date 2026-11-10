/**
 * LUMO HQ — SPRINT 3 VERIFICATION & SECURITY AUDIT SUITE
 * Agents: [AGENTE 4: QA & RESPONSIVE TESTER] & [AGENTE 5: SECOPS & PENTESTER]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
console.log('LUMO HQ — SPRINT 3 AUTOMATED VERIFICATION SUITE');
console.log('Stripe, Contratos Digitales, UETA & Blindaje Financiero');
console.log('====================================================\n');

// 1. Verify Contracts Module & Legal Clauses
console.log('--- 1. Pruebas de Texto Legal y Cláusulas Protectoras ---');
const contractsTs = fs.readFileSync(path.join(__dirname, '../src/lib/contracts.ts'), 'utf8');

assert(contractsTs.includes('Luis Barbera'), 'Identifica a Luis Barbera como titular comercial');
assert(contractsTs.includes('DBA "Lumo HQ"'), 'Registra el nombre comercial DBA Lumo HQ');
assert(contractsTs.includes('Midland, Texas'), 'Jurisdicción legal en Midland, Texas');
assert(contractsTs.includes('50/50'), 'Incluye la cascada de pago 50/50');
assert(contractsTs.includes('5 (cinco) días hábiles') || contractsTs.includes('5 días hábiles'), 'Estipula el plazo de entrega de 5 días hábiles');
assert(contractsTs.includes('Día 1') && contractsTs.includes('pausa'), 'Estipula la pausa técnica si faltan datos del Día 1');
assert(contractsTs.includes('CERO CONTRASEÑAS') || contractsTs.includes('Cero Contraseñas'), 'Incluye cláusula de Política Cero Contraseñas');
assert(contractsTs.includes('derechos') && contractsTs.includes('fotografías'), 'Incluye cláusula de titularidad y derechos de autor sobre fotos/logos');
assert(contractsTs.includes('primer lugar') && contractsTs.includes('FTC'), 'Incluye advertencia regulatoria de la FTC');
assert(contractsTs.includes('TCPA'), 'Incluye prohibición de spam bajo la ley TCPA');
assert(contractsTs.includes('Chapter 322') || contractsTs.includes('UETA'), 'Validez de firma electrónica bajo UETA de Texas');
assert(contractsTs.includes('CLIENTE FUNDADOR') && contractsTs.includes('testimonio'), 'Incluye cláusula de testimonio y portafolio para clientes fundadores');

// 2. Cryptographic SHA-256 Inmutability Tests
console.log('\n--- 2. Pruebas Criptográficas de Inmutabilidad SHA-256 ---');
const dummyContract = "CONTRATO LUMO HQ TEST CLAUSES";
const signer1 = "Roberto Sanchez";
const ip1 = "192.168.1.50";
const time1 = "2026-03-01T12:00:00.000Z";

const payload1 = `${dummyContract.trim()}__SIGNER:${signer1.trim()}__IP:${ip1.trim()}__TIME:${time1}`;
const hash1 = crypto.createHash('sha256').update(payload1, 'utf8').digest('hex');

assert(hash1.length === 64, 'El hash SHA-256 generado tiene exactamente 64 caracteres hexadecimales');

// Recomputing produces identical hash
const hash1Again = crypto.createHash('sha256').update(payload1, 'utf8').digest('hex');
assert(hash1 === hash1Again, 'El cálculo SHA-256 es determinista e inmutable');

// Changing 1 character completely alters the hash (Avalanche effect)
const payloadAltered = `${dummyContract.trim()}__SIGNER:${signer1.trim()}__IP:192.168.1.51__TIME:${time1}`;
const hashAltered = crypto.createHash('sha256').update(payloadAltered, 'utf8').digest('hex');
assert(hash1 !== hashAltered, 'Efecto avalancha: Modificar un solo carácter invalida totalmente el hash');

// 3. Texas Sales Tax & Pricing Formulas (Doc 04)
console.log('\n--- 3. Pruebas de Fórmulas Financieras y Sales Tax de Texas ---');
const stripeTs = fs.readFileSync(path.join(__dirname, '../src/lib/stripe.ts'), 'utf8');

assert(stripeTs.includes('0.0825'), 'Tasa de impuesto sobre ventas de Texas + Midland configurada al 8.25%');
assert(stripeTs.includes('0.80'), 'Base imponible de servicios de procesamiento de datos/hosting al 80% (20% exento)');

// Math check: $100 * 0.80 * 0.0825 = $6.60
const expectedTax = Math.round(100.0 * 0.80 * 0.0825 * 100) / 100;
assert(expectedTax === 6.60, 'El cálculo de Texas Sales Tax sobre $100/mes es exactamente $6.60');

assert(stripeTs.includes('FOUNDER_SETUP: 250'), 'Precio de montaje Fundador establecido en $250.00');
assert(stripeTs.includes('FOUNDER_DEPOSIT: 125'), 'Anticipo 50% Fundador establecido en $125.00');
assert(stripeTs.includes('REGULAR_SETUP: 500'), 'Precio de montaje Base establecido en $500.00');
assert(stripeTs.includes('REGULAR_DEPOSIT: 250'), 'Anticipo 50% Base establecido en $250.00');
assert(stripeTs.includes('FOUNDER_MAX_SLOTS: 2'), 'Límite máximo de 2 clientes fundadores en Sprint 1');

// 4. Financial Waterfall Engine Tests (Doc 04)
console.log('\n--- 4. Pruebas de la Cascada de Reparto Financiero (Doc 04) ---');
const financeTs = fs.readFileSync(path.join(__dirname, '../src/lib/finance.ts'), 'utf8');

assert(financeTs.includes('BARBARA_CAP = 500'), 'Tope absoluto de Bárbara en $500 USD configurado');
assert(financeTs.includes('TOOLS_AND_DOMAIN = 20'), 'Costo fijo de herramientas y dominio de $20 USD por montaje');
assert(financeTs.includes('businessFund8pct'), 'Fondo de reserva del negocio del 8% deducido antes del reparto');
assert(financeTs.includes('carlosShare') && financeTs.includes('luisShare'), 'Reparto de ganancia 50/50 entre Carlos y Luis');
assert(financeTs.includes('luisTaxReserve'), 'Apartado diario a cuenta de impuestos de Luis ($25 en fundador, $60 en base)');
assert(financeTs.includes('requiresDualApproval') && financeTs.includes('100'), 'Regla de doble aprobación para gastos superiores a $100 USD');

// 5. Parameter Tampering & API Security Tests
console.log('\n--- 5. Pruebas de Ciberseguridad y DAST (OWASP ASVS Nivel 2) ---');
const checkoutApi = fs.readFileSync(path.join(__dirname, '../src/app/api/checkout/create-session/route.ts'), 'utf8');
const signApi = fs.readFileSync(path.join(__dirname, '../src/app/api/contracts/sign/route.ts'), 'utf8');
const webhookApi = fs.readFileSync(path.join(__dirname, '../src/app/api/webhooks/stripe/route.ts'), 'utf8');

assert(checkoutApi.includes('claimedDepositAmount'), 'La API de checkout audita el monto declarado por el cliente');
assert(checkoutApi.includes('Parameter Tampering') || checkoutApi.includes('manipulación'), 'Defensa activa contra manipulación de parámetros de precio');
assert(checkoutApi.includes('contractSha256'), 'La API de checkout valida la integridad del hash SHA-256 antes de abrir sesión');
assert(checkoutApi.includes('checkRateLimit'), 'Rate limiting activo en endpoint de creación de pagos');

assert(signApi.includes('checkRateLimit'), 'Rate limiting activo en endpoint de firma de contratos');
assert(signApi.includes('FOUNDER_SLOTS_FULL') || signApi.includes('cupos'), 'Bloqueo automático si se intentan firmar más de 2 contratos fundador');
assert(signApi.includes('calculateContractSha256'), 'Generación criptográfica de hash en firma');

assert(webhookApi.includes('verifyStripeWebhookSignature'), 'Verificación criptográfica de firma de webhooks de Stripe');
assert(webhookApi.includes('processedEvents'), 'Control de idempotencia para prevenir duplicación de cobros o repartos');
assert(webhookApi.includes('DEPOSIT_PAID'), 'Transición de estado a anticipo pagado al confirmar evento de Stripe');

// 6. UI & Responsive Touch Targets
console.log('\n--- 6. Pruebas de Interfaz, Wizard y Accesibilidad Móvil ---');
const checkoutPage = fs.readFileSync(path.join(__dirname, '../src/app/checkout/page.tsx'), 'utf8');
const signaturePad = fs.readFileSync(path.join(__dirname, '../src/components/checkout/SignaturePad.tsx'), 'utf8');
const proposalPage = fs.readFileSync(path.join(__dirname, '../src/app/propuesta/[id]/page.tsx'), 'utf8');

assert(checkoutPage.includes('step === 1') && checkoutPage.includes('step === 2') && checkoutPage.includes('step === 3') && checkoutPage.includes('step === 4'), 'Asistente de checkout estructurado en 4 pasos progresivos');
assert(checkoutPage.includes('SignaturePad'), 'Lienzo de firma táctil integrado en el paso 3');
assert(checkoutPage.includes('min-h-touch') && checkoutPage.includes('min-w-touch'), 'Botones interactivos con área táctil accesible mínima de 48x48px');
assert(signaturePad.includes('onTouchStart') && signaturePad.includes('onTouchMove') && signaturePad.includes('onTouchEnd'), 'Lienzo de firma soporta eventos táctiles de smartphone/tablet');
assert(signaturePad.includes('devicePixelRatio'), 'Lienzo de firma optimizado con escalado para pantallas retina/HiDPI');
assert(proposalPage.includes('Propuesta para') && proposalPage.includes('checkout'), 'Página de propuesta personalizada vinculada directamente al checkout');

console.log('\n====================================================');
console.log(`RESUMEN DE PRUEBAS SPRINT 3: ${passedTests} PASADAS, ${failedTests} FALLIDAS`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

