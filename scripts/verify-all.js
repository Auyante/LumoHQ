/**
 * LUMO HQ — MASTER SUITE VERIFICATION RUNNER (ALL SPRINTS 1 TO 5)
 */

const { execSync } = require('child_process');

console.log('================================================================');
console.log('       LUMO HQ — EJECUCIÓN MAESTRA DE TODAS LAS PRUEBAS         ');
console.log('                TIPOS, LINT, UNIDAD, SPRINTS 1-5 Y SEGURIDAD EN VIVO                 ');
console.log('================================================================\n');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const suites = [
  { name: 'TypeScript: 0 errores', script: 'npx tsc --noEmit -p .' },
  { name: 'ESLint: 0 errores y 0 advertencias', script: 'npx eslint . --max-warnings=0' },
  { name: 'Pruebas de unidad (login cifrado, RBAC, WAF, emojis, CRM, 3D/responsive, IRS, domingo)', script: 'npx vitest run' },
  { name: 'SPRINT 1: Infraestructura, Landing Page & Ciberseguridad', script: 'node scripts/verify-sprint1.js' },
  { name: 'SPRINT 2: Motor de Plantillas, Demos y Kit de Reseñas', script: 'node scripts/verify-sprint2.js' },
  { name: 'SPRINT 3: Stripe Checkout, Contratos Criptográficos & UETA', script: 'node scripts/verify-sprint3.js' },
  { name: 'SPRINT 4: CRM de 8 Señales, Portal del Cliente & Línea 5 Días', script: 'node scripts/verify-sprint4.js' },
  { name: 'SPRINT 5: Motor Financiero, Tablero Dominical & Hardening', script: 'node scripts/verify-sprint5.js' },
  { name: `Seguridad en vivo contra ${BASE} (necesita el servidor en marcha)`, script: 'node scripts/verify-security.js', env: { BASE_URL: BASE } },
];

let allPassed = true;

for (const suite of suites) {
  console.log(`\n>>> EJECUTANDO: ${suite.name} ...`);
  try {
    execSync(suite.script, { stdio: 'inherit', env: { ...process.env, ...(suite.env || {}) } });
    console.log(`>>> [ÉXITO] ${suite.name}`);
  } catch {
    console.error(`>>> [ERROR] Falló ${suite.name}`);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n================================================================');
  console.log('  TODO APROBADO: tipos, lint, unidad, sprints 1-5 y seguridad en vivo');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('\n>>> ERROR: Alguna prueba ha fallado.');
  process.exit(1);
}

