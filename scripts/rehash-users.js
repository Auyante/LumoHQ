/**
 * Regenera los hashes PBKDF2-SHA512 de los 3 usuarios del equipo.
 * Lee las contraseñas desde .env.local para nunca tener texto plano en el código.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Leer .env.local
const envPath = path.join(ROOT, '.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)=(.+)$/);
    if (m) envVars[m[1].trim()] = m[2].trim();
  });
}

const USERS = [
  { id: 'usr-carlos', name: 'Carlos', email: 'carlos@lumohp.com', role: 'SUPER_ADMIN',   password: envVars.ADMIN_CARLOS_PASSWORD },
  { id: 'usr-luis',   name: 'Luis',   email: 'luis@lumohp.com',   role: 'ADMIN_LUIS',    password: envVars.ADMIN_LUIS_PASSWORD   },
  { id: 'usr-barbara',name: 'Bárbara',email: 'barbara@lumohp.com',role: 'SALES_BARBARA', password: envVars.SALES_BARBARA_PASSWORD },
];

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

const now = new Date().toISOString();
const result = USERS.map(u => {
  if (!u.password) {
    console.error(`ERROR: No se encontró la contraseña para ${u.email} en .env.local`);
    process.exit(1);
  }
  const { hash, salt } = hashPassword(u.password);
  console.log(`✓ Hash generado para ${u.email}`);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    hash,
    salt,
    iter: 210000,
    active: true,
    sessionVersion: 0,
    createdAt: now,
    passwordChangedAt: now,
    lastLoginAt: null,
    failedAttempts: 0,
    lockedUntil: null,
  };
});

const dataDir = path.join(ROOT, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(result, null, 2), { mode: 0o600 });
console.log('\n✅ data/users.json regenerado con hashes frescos.');
console.log('   Reinicia el servidor para que tome efecto.\n');
