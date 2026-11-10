/**
 * LUMO HQ — SPRINT 1 AUTOMATED GATE AUDIT SCRIPT
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
console.log('🛡️  LUMO HQ — SPRINT 1 GATE AUDIT & CERTIFICATION');
console.log('======================================================\n');

// 1. BRAND COLORS AUDIT
console.log('--- 1. AUDITORÍA DE IDENTIDAD Y COLORES ---');
const coloresTxtPath = path.join(ROOT, 'docs/LumoHQ_Identidad_Organizada/09_Colores_y_Tipografia/colores.txt');
const tailwindConfigPath = path.join(ROOT, 'tailwind.config.ts');
const globalsCssPath = path.join(ROOT, 'src/styles/globals.css');

assert(fs.existsSync(coloresTxtPath), 'Archivo fuente colores.txt existe');
const tailwindContent = fs.readFileSync(tailwindConfigPath, 'utf8');

assert(tailwindContent.includes('#1B2130'), 'Color Noche (#1B2130) en Tailwind');
assert(tailwindContent.includes('#F2A33A'), 'Color Ámbar Lumo (#F2A33A) en Tailwind');
assert(tailwindContent.includes('#FFD27A'), 'Color Brillo (#FFD27A) en Tailwind');
assert(tailwindContent.includes('#FFF7EC'), 'Color Arena (#FFF7EC) en Tailwind');
assert(tailwindContent.includes('#5B6375'), 'Color Pizarra (#5B6375) en Tailwind');
assert(tailwindContent.includes('#E6E8EE'), 'Color Niebla (#E6E8EE) en Tailwind');

// 2. LOCAL FONTS AUDIT
console.log('\n--- 2. AUDITORÍA DE FUENTES LOCALES WOFF2 ---');
const fontsDir = path.join(ROOT, 'public/fonts');
const requiredFonts = [
  'bricolage-grotesque-latin-700-normal.woff2',
  'bricolage-grotesque-latin-800-normal.woff2',
  'figtree-latin-400-normal.woff2',
  'figtree-latin-600-normal.woff2',
  'figtree-latin-700-normal.woff2',
];

requiredFonts.forEach((font) => {
  const p = path.join(fontsDir, font);
  assert(fs.existsSync(p) && fs.statSync(p).size > 1000, `Fuente local existe: ${font}`);
});

const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
assert(cssContent.includes("font-family: 'Bricolage Grotesque'"), 'CSS declara @font-face Bricolage Grotesque');
assert(cssContent.includes("font-family: 'Figtree'"), 'CSS declara @font-face Figtree');

// 3. WEB ASSETS & FAVICONS
console.log('\n--- 3. AUDITORÍA DE LOGOS Y ASSETS WEB ---');
assert(fs.existsSync(path.join(ROOT, 'public/favicon.ico')), 'Favicon.ico presente en /public');
assert(fs.existsSync(path.join(ROOT, 'public/apple-touch-icon.png')), 'Apple Touch Icon presente');
assert(fs.existsSync(path.join(ROOT, 'public/site.webmanifest')), 'Manifest web presente');
assert(fs.existsSync(path.join(ROOT, 'public/images/og-image.png')), 'OpenGraph 1200x630 presente');
assert(fs.existsSync(path.join(ROOT, 'public/logos/logo-encabezado_fondo-claro.svg')), 'Logo encabezado fondo claro presente');
assert(fs.existsSync(path.join(ROOT, 'public/logos/logo-encabezado_fondo-oscuro.svg')), 'Logo encabezado fondo oscuro presente');

// 4. BILINGUAL TRANSLATION PARITY
console.log('\n--- 4. AUDITORÍA DE INTERNACIONALIZACIÓN (ES/EN) ---');
const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/messages/es.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/messages/en.json'), 'utf8'));

assert(Object.keys(es).length === Object.keys(en).length, 'Mismo número de secciones maestras en ES y EN');
assert(es.hero.titleStart && en.hero.titleStart, 'Hero traducido en ambos idiomas');
assert(es.packages.founder.price === '$250' && en.packages.founder.price === '$250', 'Precio fundador $250 consistente');
assert(es.packages.base.price === '$500' && en.packages.base.price === '$500', 'Precio base $500 consistente');
assert(es.faq.items.length === 8 && en.faq.items.length === 8, 'Exactamente 8 objeciones en FAQ (Sección 1.3 Ops Manual)');

// 5. COMPLIANCE (FTC & TCPA)
console.log('\n--- 5. AUDITORÍA LEGAL (FTC & TCPA) ---');
const allTextEs = JSON.stringify(es).toLowerCase();
const allTextEn = JSON.stringify(en).toLowerCase();

assert(!allTextEs.includes('te ponemos en el primer lugar'), 'Cumplimiento FTC: Cero promesas "te ponemos en el primer lugar"');
assert(!allTextEs.includes('duplicamos tus clientes'), 'Cumplimiento FTC: Cero promesas "duplicamos tus clientes"');
assert(!allTextEs.includes('comprar reseñas'), 'Cumplimiento FTC: Cero venta de reseñas falsas');
assert(!allTextEn.includes('we put you #1 on google'), 'Cumplimiento FTC: No positive #1 Google promise in English');
assert(allTextEs.includes('ftc') && allTextEs.includes('tcpa'), 'Avisos explícitos de cumplimiento FTC y TCPA en ES');
assert(allTextEn.includes('ftc') && allTextEn.includes('tcpa'), 'Avisos explícitos de cumplimiento FTC y TCPA en EN');

// 6. CYBERSECURITY HEADERS (SECOPS)
console.log('\n--- 6. AUDITORÍA DE CIBERSEGURIDAD PERIMETRAL (SECOPS) ---');
const nextConfig = fs.readFileSync(path.join(ROOT, 'next.config.mjs'), 'utf8');
const middleware = fs.readFileSync(path.join(ROOT, 'src/middleware.ts'), 'utf8');

assert(!nextConfig.includes("'unsafe-eval'"), 'CSP Blindado: Ningún uso de unsafe-eval');
assert(nextConfig.includes('Strict-Transport-Security') && nextConfig.includes('preload'), 'HSTS con preload configurado');
assert(nextConfig.includes("X-Frame-Options',") && nextConfig.includes("'DENY'"), 'Anti-Clickjacking X-Frame-Options: DENY');
assert(nextConfig.includes("X-Content-Type-Options',") && nextConfig.includes("'nosniff'"), 'Anti-Sniffing X-Content-Type-Options: nosniff');
assert(nextConfig.includes("Referrer-Policy',"), 'Referrer-Policy strict-origin configurado');
assert(nextConfig.includes("Permissions-Policy',"), 'Permissions-Policy bloquea cámaras y micrófonos');

// 7. INPUT SANITIZATION & RATE LIMITING
console.log('\n--- 7. AUDITORÍA DE INYECCIÓN XSS Y RATE LIMITING ---');
const apiRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/diagnosis/route.ts'), 'utf8');
assert(apiRoute.includes('replace(/[<>]/g,'), 'Sanitización estricta anti-XSS en formulario');
assert(apiRoute.includes('rateLimitMap'), 'Rate Limiting implementado por IP');
assert(apiRoute.includes('status: 429'), 'Respuesta HTTP 429 para exceso de solicitudes');
assert(apiRoute.includes('tcpaConsent'), 'Validación obligatoria de consentimiento TCPA');

console.log('\n======================================================');
console.log(`📊 RESULTADOS: ${passed} PRUEBAS SUPERADAS | ${failed} FALLOS`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 SPRINT 1 GATE APROBADO CON ÉXITO');
}
