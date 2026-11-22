/**
 * Limpia todos los bloqueos de IP y cuentas del sistema de seguridad.
 * Usar cuando la cuenta fue bloqueada por intentos fallidos de login.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BLOCK_FILE = path.join(DATA_DIR, 'security-blocks.json');

// Limpiar bloqueos de IP y cuentas
if (fs.existsSync(BLOCK_FILE)) {
  const blocks = JSON.parse(fs.readFileSync(BLOCK_FILE, 'utf8'));
  console.log('Bloqueos actuales:', JSON.stringify(blocks, null, 2));
  
  // Escribir objeto vacío — limpia todos los bloqueos
  fs.writeFileSync(BLOCK_FILE, JSON.stringify({ ips: {}, accounts: {}, failures: {} }, null, 2));
  console.log('\n✅ Todos los bloqueos limpiados.');
} else {
  // Crear archivo vacío limpio
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BLOCK_FILE, JSON.stringify({ ips: {}, accounts: {}, failures: {} }, null, 2));
  console.log('✅ Archivo de bloqueos creado limpio.');
}
