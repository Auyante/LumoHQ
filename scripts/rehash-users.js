/**
 * Regenerate data/users.json for the 3 team accounts with fresh passwords.
 * Passwords come from env vars or are generated here (CSPRNG). They are written ONCE to
 * data/INITIAL-PASSWORDS.txt (gitignored, mode 600) and never printed: read it, store the
 * passwords in a password manager, then delete the file.
 * Hashing matches src/lib/auth.ts: PBKDF2-SHA512, 210,000 iterations, 32-byte random salt.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

const ITER = 210000;

function generatePassword(length = 18) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*-_=+'];
  const all = sets.join('');
  const chars = sets.map((s) => s[crypto.randomInt(s.length)]);
  while (chars.length < length) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITER, 64, 'sha512').toString('hex');
  return { hash, salt, iter: ITER };
}

const team = [
  { id: 'usr-carlos', name: 'Carlos Gómez', email: 'carlos@lumohq.com', role: 'SUPER_ADMIN', env: 'ADMIN_CARLOS_PASSWORD' },
  { id: 'usr-luis', name: 'Luis Barbera', email: 'luis@lumohq.com', role: 'ADMIN_LUIS', env: 'ADMIN_LUIS_PASSWORD' },
  { id: 'usr-barbara', name: 'Bárbara', email: 'barbara@lumohq.com', role: 'SALES_BARBARA', env: 'SALES_BARBARA_PASSWORD' },
];

const now = new Date().toISOString();
const lines = [];
const users = team.map((t) => {
  const fromEnv = process.env[t.env];
  const pw = fromEnv && fromEnv.length >= 12 ? fromEnv : generatePassword();
  if (!fromEnv) lines.push(`${t.email.padEnd(22)} ${pw}`);
  return { id: t.id, name: t.name, email: t.email, role: t.role, ...hashPassword(pw), active: true, sessionVersion: 0, createdAt: now, passwordChangedAt: now };
});

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2), { encoding: 'utf8', mode: 0o600 });
if (lines.length) {
  const file = path.join(dataDir, 'INITIAL-PASSWORDS.txt');
  fs.writeFileSync(file, `Lumo HQ team passwords (generated ${now}).\nMove them to a password manager and DELETE this file.\n\n${lines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
  console.log(`users.json regenerated. New passwords written to ${file} (not shown here).`);
} else {
  console.log('users.json regenerated with the passwords from the environment.');
}
