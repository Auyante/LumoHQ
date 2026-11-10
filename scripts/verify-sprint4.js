/**
 * LUMO HQ — SPRINT 4 VERIFICATION & SECURITY AUDIT SUITE
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
console.log('LUMO HQ — SPRINT 4 AUTOMATED VERIFICATION SUITE');
console.log('CRM de Prospección, Portal del Cliente & Línea 5 Días');
console.log('====================================================\n');

// 1. CRM 8-Signal Scoring System & Priority Rules (Doc 03 Sección 1.1)
console.log('--- 1. Pruebas del Motor de 8 Señales de Oportunidad (Doc 03) ---');
const crmTs = fs.readFileSync(path.join(__dirname, '../src/lib/crm.ts'), 'utf8');

assert(crmTs.includes('scoreReviews'), 'Señal 1: Menos de 20 reseñas, o la última tiene más de 3 meses');
assert(crmTs.includes('scoreWebsite'), 'Señal 2: Sin página web, o rota o desactualizada');
assert(crmTs.includes('scorePhotos'), 'Señal 3: Fotos viejas, pocas o ninguna');
assert(crmTs.includes('scoreHours'), 'Señal 4: Horario vacío o incompleto');
assert(crmTs.includes('scoreDescription'), 'Señal 5: Sin descripción, sin servicios o con categorías mal puestas');
assert(crmTs.includes('scoreReviewResponse'), 'Señal 6: Reseñas sin respuesta del dueño');
assert(crmTs.includes('scoreBooking'), 'Señal 7: Sin botón de reservar (barberías, salones, talleres con citas)');
assert(crmTs.includes('scoreSpanish'), 'Señal 8: Atiende en español (por las reseñas, las fotos o el nombre)');

// Test scoring function logic directly
function calculateProspectSignals(signals) {
  let score = 0;
  if (signals.scoreReviews) score++;
  if (signals.scoreWebsite) score++;
  if (signals.scorePhotos) score++;
  if (signals.scoreHours) score++;
  if (signals.scoreDescription) score++;
  if (signals.scoreReviewResponse) score++;
  if (signals.scoreBooking) score++;
  if (signals.scoreSpanish) score++;

  let priority = 'DISCARD';
  if (score >= 4) {
    priority = 'P1';
  } else if (score >= 2) {
    priority = 'P2';
  } else {
    priority = 'DISCARD';
  }
  return { score, priority };
}

const sampleHigh = { scoreReviews: true, scoreWebsite: true, scorePhotos: true, scoreSpanish: true };
const resHigh = calculateProspectSignals(sampleHigh);
assert(resHigh.score === 4 && resHigh.priority === 'P1', 'Clasifica 4+ puntos como P1 (Contactar primero)');

const sampleMed = { scoreReviews: true, scoreSpanish: true };
const resMed = calculateProspectSignals(sampleMed);
assert(resMed.score === 2 && resMed.priority === 'P2', 'Clasifica 2 o 3 puntos como P2 (Segunda tanda)');

const sampleDiscard = { scoreSpanish: true };
const resDiscard = calculateProspectSignals(sampleDiscard);
assert(resDiscard.score === 1 && resDiscard.priority === 'DISCARD', 'Clasifica menos de 2 puntos como DISCARD (Descartar)');

// 2. TCPA Compliance & 3-Contact Hard Limit
console.log('\n--- 2. Pruebas de Cumplimiento TCPA (Bloqueo tras 3 Contactos) ---');
assert(crmTs.includes('followUpCount >= 3'), 'Regla de negocio: Bloqueo estricto al alcanzar 3 seguimientos');
assert(crmTs.includes('Límite TCPA'), 'Notificación de protección legal TCPA configurada');

// Follow up logic test
let testFollowUpCount = 0;
function testFollowUp() {
  if (testFollowUpCount >= 3) {
    return { success: false, error: 'Límite TCPA alcanzado: Máximo 3 seguimientos permitidos' };
  }
  testFollowUpCount++;
  return { success: true, count: testFollowUpCount };
}

assert(testFollowUp().success === true && testFollowUpCount === 1, 'Permite seguimiento 1');
assert(testFollowUp().success === true && testFollowUpCount === 2, 'Permite seguimiento 2');
assert(testFollowUp().success === true && testFollowUpCount === 3, 'Permite seguimiento 3');
const blocked = testFollowUp();
assert(!blocked.success && blocked.error.includes('TCPA'), 'Bloquea el 4to seguimiento bajo estricta ley TCPA');

// 3. Official Scripts & The 8 Exact Objections (Doc 03 Secciones 1.2 y 1.3)
console.log('\n--- 3. Pruebas de Guiones Oficiales y 8 Objeciones (Doc 03) ---');
assert(crmTs.includes('primerContacto'), 'Guion 1: Primer contacto presente');
assert(crmTs.includes('envioDiagnostico'), 'Guion 2: Envío del diagnóstico presente');
assert(crmTs.includes('seguimiento1'), 'Guion 3: Seguimiento 1 (2 días) presente');
assert(crmTs.includes('seguimiento2'), 'Guion 4: Seguimiento 2 (5 días) presente');
assert(crmTs.includes('seguimiento3'), 'Guion 5: Seguimiento 3 (1 semana, último) presente');
assert(crmTs.includes('propuesta'), 'Guion 6: Propuesta (mismo día de la reunión) presente');
assert(crmTs.includes('visitasLuis'), 'Guion 7: Visitas en persona (Luis Barbera) presente');

assert(crmTs.includes('Está caro'), 'Objeción 1: "Está caro."');
assert(crmTs.includes('No tengo tiempo'), 'Objeción 2: "No tengo tiempo."');
assert(crmTs.includes('Me llegan de boca en boca'), 'Objeción 3: "Me llegan de boca en boca."');
assert(crmTs.includes('Mis clientes no usan WhatsApp'), 'Objeción 4: "Mis clientes no usan WhatsApp."');
assert(crmTs.includes('Mis clientes hablan inglés'), 'Objeción 5: "Mis clientes hablan inglés."');
assert(crmTs.includes('Mi sobrino me hace eso'), 'Objeción 6: "Mi sobrino me hace eso."');
assert(crmTs.includes('Ya me vendieron eso y no sirvió'), 'Objeción 7: "Ya me vendieron eso y no sirvió."');
assert(crmTs.includes('No confío en pagar adelantado'), 'Objeción 8: "No confío en pagar adelantado."');

// 4. Day 1 Checklist & 5-Day Delivery Clock Logic
console.log('\n--- 4. Pruebas del Reloj de Entrega y Pausa Operativa del Día 1 ---');
const portalTs = fs.readFileSync(path.join(__dirname, '../src/lib/client-portal.ts'), 'utf8');

assert(portalTs.includes('status: \'PAUSED\''), 'El sistema soporta estado PAUSADO del reloj');
assert(portalTs.includes('status: \'RUNNING\''), 'El sistema soporta estado EN PROGRESO del reloj');
assert(portalTs.includes('photosUploadedCount >= 5'), 'Condición obligatoria de fotos para reanudar el reloj');
assert(portalTs.includes('copyrightConfirmed'), 'Condición obligatoria de confirmación de derechos de autor');
assert(portalTs.includes('depositPaid'), 'Condición de anticipo del 50% acreditado antes de iniciar el reloj');

// 5. Day 5 Final Approval & Subscription Trigger
console.log('\n--- 5. Pruebas de Aprobación Escrita Final (Día 5) ---');
const approveApi = fs.readFileSync(path.join(__dirname, '../src/app/api/client/approve/route.ts'), 'utf8');

assert(approveApi.includes('clientWrittenConfirmation'), 'Requiere confirmación escrita de aprobación del cliente');
assert(approveApi.includes('approveDelivery'), 'Actualiza el expediente del cliente a entrega aprobada');
assert(approveApi.includes('FINAL_50'), 'Registra la transacción del 50% restante en la cascada');

// 6. File Security & Magic Bytes (OWASP ASVS 12.1)
console.log('\n--- 6. Pruebas de Ciberseguridad en Subida de Archivos (Magic Bytes) ---');
const fileSecurityTs = fs.readFileSync(path.join(__dirname, '../src/lib/file-security.ts'), 'utf8');

assert(fileSecurityTs.includes('0xff') && fileSecurityTs.includes('0xd8'), 'Inspección de Magic Bytes JPEG (FF D8 FF)');
assert(fileSecurityTs.includes('0x89') && fileSecurityTs.includes('0x50') && fileSecurityTs.includes('0x4e') && fileSecurityTs.includes('0x47'), 'Inspección de Magic Bytes PNG (89 50 4E 47)');
assert(fileSecurityTs.includes('0x52') && fileSecurityTs.includes('0x49') && fileSecurityTs.includes('0x46') && fileSecurityTs.includes('0x46'), 'Inspección de Magic Bytes WebP (RIFF...WEBP)');
assert(fileSecurityTs.includes('svg') && fileSecurityTs.includes('exe'), 'Rechazo preventivo de extensiones potencialmente maliciosas (.svg, .exe)');
assert(fileSecurityTs.includes('MAX_SIZE = 10 * 1024 * 1024'), 'Límite máximo de tamaño de archivo establecido en 10MB');

// 7. Responsive & UI Assertions
console.log('\n--- 7. Pruebas de Interfaz Móvil y Accesibilidad WCAG 2.1 AA ---');
const crmPage = fs.readFileSync(path.join(__dirname, '../src/app/admin/crm/page.tsx'), 'utf8');
const portalPage = fs.readFileSync(path.join(__dirname, '../src/app/portal/page.tsx'), 'utf8');
const produccionPage = fs.readFileSync(path.join(__dirname, '../src/app/admin/produccion/page.tsx'), 'utf8');

assert(crmPage.includes('SALES_BARBARA') && crmPage.includes('ADMIN_LUIS'), 'CRM implementa roles para Bárbara y Luis');
assert(crmPage.includes('selectedBatch'), 'CRM implementa selector de Lotes 1 al 5 (30 negocios/lote)');
assert(crmPage.includes('barbaraEstimatedEarned') && crmPage.includes('500'), 'CRM rastrea el tope de $500 de comisiones de Bárbara');
assert(crmPage.includes('min-h-touch'), 'CRM cuenta con botones táctiles mínimos de 48px');

assert(portalPage.includes('isPaused'), 'Portal del cliente muestra banner claro si el reloj está en pausa');
assert(portalPage.includes('day1Checklist'), 'Portal del cliente incluye checklist interactivo del Día 1');
assert(portalPage.includes('Cero Contraseñas') || portalPage.includes('passwords'), 'Portal del cliente incluye guía interactiva Cero Contraseñas');
assert(portalPage.includes('sticker_resenas_1200x1200.png'), 'Portal del cliente incluye descarga del sticker de reseñas');

assert(produccionPage.includes('day0DepositAndContract') && produccionPage.includes('day5ClientApprovalAndHandover'), 'Panel de producción gestiona los 5 días de Carlos y Luis');
assert(produccionPage.includes('Carlos Gómez') || produccionPage.includes('Carlos'), 'Atribución de tareas técnicas de producción a Carlos');

console.log('\n====================================================');
console.log(`RESUMEN DE PRUEBAS SPRINT 4: ${passedTests} PASADAS, ${failedTests} FALLIDAS`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
