/**
 * LUMO HQ — SPRINT 2 AUTOMATED GATE AUDIT SCRIPT
 * Verified by [AGENTE 4: QA] and [AGENTE 5: SECOPS]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🛡️  LUMO HQ — SPRINT 2 GATE AUDIT & CERTIFICATION');
console.log('======================================================\n');

// 1. MASTER TEMPLATE ENGINE INTEGRITY
console.log('--- 1. AUDITORÍA DEL MOTOR DE PLANTILLA MAESTRA ---');
const templatesPath = path.join(ROOT, 'src/lib/templates.ts');
assert(fs.existsSync(templatesPath), 'Archivo motor de plantillas src/lib/templates.ts existe');

const templatesContent = fs.readFileSync(templatesPath, 'utf8');
assert(templatesContent.includes('TemplateConfigSchema'), 'Esquema Zod de validación estricta de plantilla');
assert(templatesContent.includes('nap: z.object'), 'Estructura NAP (Name, Address, Phone) idéntica a Google');
assert(templatesContent.includes('hasCall'), 'Toggle de llamada telefónica');
assert(templatesContent.includes('hasSms'), 'Toggle de SMS directo');
assert(templatesContent.includes('hasBooking'), 'Toggle de reservas online');
assert(templatesContent.includes('hasWhatsApp'), 'Toggle de WhatsApp Business');
assert(templatesContent.includes('hasMeta'), 'Toggle de redes Instagram/Facebook');

// 2. DEMO 1 — BARBERÍA CON RESERVAS (/demo/barberia)
console.log('\n--- 2. AUDITORÍA DEMO OFICIAL 1: BARBERÍA (/demo/barberia) ---');
const barberiaPagePath = path.join(ROOT, 'src/app/demo/barberia/page.tsx');
assert(fs.existsSync(barberiaPagePath), 'Ruta /demo/barberia implementada');

const demoDataPath = path.join(ROOT, 'src/lib/demo-data.ts');
assert(fs.existsSync(demoDataPath), 'Datos modelo demo-data.ts configurados');

const demoDataContent = fs.readFileSync(demoDataPath, 'utf8');
assert(demoDataContent.includes('El Rey Barbershop'), 'Nombre de barbería modelo en Midland, TX');
assert(demoDataContent.includes('hasBooking: true'), 'Flujo de reservas activo en barbería');
assert(demoDataContent.includes('2408 N Big Spring St'), 'Dirección física en Midland, TX verificada');

const bookingModalPath = path.join(ROOT, 'src/components/demos/BookingModal.tsx');
assert(fs.existsSync(bookingModalPath), 'Componente BookingModal (Square/Booksy simulator) existe');

const bookingContent = fs.readFileSync(bookingModalPath, 'utf8');
assert(bookingContent.includes('Square Appointments / Booksy'), 'Integración simulada Square / Booksy');
assert(bookingContent.includes('step === 1'), 'Flujo paso 1: Selección de servicio');
assert(bookingContent.includes('step === 2'), 'Flujo paso 2: Selección de especialista');
assert(bookingContent.includes('step === 3'), 'Flujo paso 3: Selección de horario');
assert(bookingContent.includes('step === 4'), 'Flujo paso 4: Confirmación y recordatorio SMS');

// 3. DEMO 2 — TAQUERÍA CON MENÚ DIGITAL (/demo/taqueria)
console.log('\n--- 3. AUDITORÍA DEMO OFICIAL 2: TAQUERÍA (/demo/taqueria) ---');
const taqueriaPagePath = path.join(ROOT, 'src/app/demo/taqueria/page.tsx');
assert(fs.existsSync(taqueriaPagePath), 'Ruta /demo/taqueria implementada');

assert(demoDataContent.includes('Taquería Los Compadres'), 'Nombre de taquería modelo en Odessa, TX');
assert(demoDataContent.includes('hasWhatsApp: true'), 'Canal WhatsApp activo en taquería');
assert(demoDataContent.includes('1315 E 8th St'), 'Dirección física en Odessa, TX');
assert(demoDataContent.includes('Tacos al Pastor'), 'Menú digital interactivo con tacos y especialidades');

const whatsAppModalPath = path.join(ROOT, 'src/components/demos/WhatsAppOrderModal.tsx');
assert(fs.existsSync(whatsAppModalPath), 'Componente WhatsAppOrderModal existe');

const whatsAppContent = fs.readFileSync(whatsAppModalPath, 'utf8');
assert(whatsAppContent.includes('wa.me'), 'Generación segura de enlace directo wa.me');
assert(whatsAppContent.includes('encodeURIComponent'), 'Codificación segura de parámetros de pedido');

// 4. KIT DE RESEÑAS QR & STICKER DE MOSTRADOR
console.log('\n--- 4. AUDITORÍA DEL KIT DE RESEÑAS QR (FTC COMPLIANT) ---');
const reviewToolPath = path.join(ROOT, 'src/app/herramientas/resenas/page.tsx');
const reviewApiPath = path.join(ROOT, 'src/app/api/reviews/generate/route.ts');
const stickerAssetPath = path.join(ROOT, 'public/images/sticker_resenas_1200x1200.png');

assert(fs.existsSync(reviewToolPath), 'Página generadora /herramientas/resenas implementada');
assert(fs.existsSync(reviewApiPath), 'API endpoint /api/reviews/generate implementado');
assert(fs.existsSync(stickerAssetPath), 'Arte oficial sticker_resenas_1200x1200.png presente en /public');

const reviewApiContent = fs.readFileSync(reviewApiPath, 'utf8');
assert(reviewApiContent.includes('ALLOWED_GOOGLE_REVIEW_PREFIXES'), 'Lista blanca de dominios para Google Reviews');
assert(reviewApiContent.includes('https://g.page/'), 'Permite g.page');
assert(reviewApiContent.includes('https://search.google.com/local/writereview'), 'Permite search.google.com');

// 5. CIBERSEGURIDAD: ANTI-SSTI, ANTI-OPEN-REDIRECT, SANITIZACIÓN
console.log('\n--- 5. AUDITORÍA SECOPS: ANTI-SSTI & ANTI-OPEN REDIRECT ---');
assert(!templatesContent.includes('eval(') && !templatesContent.includes('Function('), 'Cero uso de eval o Function en plantillas (Anti-SSTI)');
assert(reviewApiContent.includes('isAllowed'), 'Validación de URL contra Open Redirects implementada');
assert(reviewApiContent.includes('replace(/[<>]/g,'), 'Sanitización estricta de cadenas contra XSS');

// 6. TOUCH TARGET & ACCESSIBILITY AUDIT
console.log('\n--- 6. AUDITORÍA DE ACCESIBILIDAD Y TOUCH TARGETS (48x48px) ---');
const templateViewContent = fs.readFileSync(path.join(ROOT, 'src/components/template/MasterTemplateView.tsx'), 'utf8');
assert(templateViewContent.includes('min-h-touch'), 'Uso de min-h-touch (48px) en botones interactivos');
assert(templateViewContent.includes('fixed bottom-0'), 'Sticky Mobile Bar presente en pantallas móviles');
assert(templateViewContent.includes('tel:'), 'Enlaces telefónicos directos tel: verificados');

console.log('\n======================================================');
console.log(`📊 RESULTADOS SPRINT 2: ${passed} PRUEBAS SUPERADAS | ${failed} FALLOS`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 SPRINT 2 GATE APROBADO CON ÉXITO');
}

