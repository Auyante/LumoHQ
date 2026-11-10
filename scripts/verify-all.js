/**
 * LUMO HQ — MASTER SUITE VERIFICATION RUNNER (ALL SPRINTS 1 TO 5)
 */

const { execSync } = require('child_process');

console.log('================================================================');
console.log('       LUMO HQ — EJECUCIÓN MAESTRA DE TODAS LAS PRUEBAS         ');
console.log('             SPRINT 1 AL SPRINT 5 (100% BLINDADO)               ');
console.log('================================================================\n');

const suites = [
  { name: 'SPRINT 1: Infraestructura, Landing Page & Ciberseguridad', script: 'node scripts/verify-sprint1.js' },
  { name: 'SPRINT 2: Motor de Plantillas, Demos y Kit de Reseñas', script: 'node scripts/verify-sprint2.js' },
  { name: 'SPRINT 3: Stripe Checkout, Contratos Criptográficos & UETA', script: 'node scripts/verify-sprint3.js' },
  { name: 'SPRINT 4: CRM de 8 Señales, Portal del Cliente & Línea 5 Días', script: 'node scripts/verify-sprint4.js' },
  { name: 'SPRINT 5: Motor Financiero, Tablero Dominical & Hardening', script: 'node scripts/verify-sprint5.js' },
];

let allPassed = true;

for (const suite of suites) {
  console.log(`\n>>> EJECUTANDO: ${suite.name} ...`);
  try {
    const output = execSync(suite.script, { stdio: 'inherit' });
    console.log(`>>> [ÉXITO] ${suite.name}`);
  } catch (err) {
    console.error(`>>> [ERROR] Falló ${suite.name}`);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n================================================================');
  console.log('  ¡TODOS LOS SPRINTS 1, 2, 3, 4 Y 5 HAN SIDO CERTIFICADOS AL 100%! ');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('\n>>> ERROR: Alguna prueba ha fallado.');
  process.exit(1);
}

