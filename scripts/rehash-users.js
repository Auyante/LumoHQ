const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let out = '';
  for (let i = 0; i < 18; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

// Passwords come from env vars or are generated here and printed once. Never hardcode them.
const passwords = {
  carlos: process.env.ADMIN_CARLOS_PASSWORD || generatePassword(),
  luis: process.env.ADMIN_LUIS_PASSWORD || generatePassword(),
  barbara: process.env.SALES_BARBARA_PASSWORD || generatePassword(),
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

const users = [
  {
    id: 'usr-carlos',
    name: 'Carlos Gómez',
    email: 'carlos@lumohq.com',
    role: 'SUPER_ADMIN',
    ...hashPassword(passwords.carlos),
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-luis',
    name: 'Luis Barbera',
    email: 'luis@lumohq.com',
    role: 'ADMIN_LUIS',
    ...hashPassword(passwords.luis),
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-barbara',
    name: 'Bárbara',
    email: 'barbara@lumohq.com',
    role: 'SALES_BARBARA',
    ...hashPassword(passwords.barbara),
    active: true,
    createdAt: new Date().toISOString()
  }
];

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
console.log('users.json rehashed. Store these passwords in a password manager now:');
console.log(`  carlos@lumohq.com   ${passwords.carlos}`);
console.log(`  luis@lumohq.com     ${passwords.luis}`);
console.log(`  barbara@lumohq.com  ${passwords.barbara}`);

