const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    ...hashPassword('LumoAdmin$2026!Carlos'),
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-luis',
    name: 'Luis Barbera',
    email: 'luis@lumohq.com',
    role: 'ADMIN_LUIS',
    ...hashPassword('LumoAdmin$2026!Luis'),
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-barbara',
    name: 'Bárbara',
    email: 'barbara@lumohq.com',
    role: 'SALES_BARBARA',
    ...hashPassword('LumoVentas$2026!Barb'),
    active: true,
    createdAt: new Date().toISOString()
  }
];

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
console.log('users.json rehashed successfully with exact literal passwords including $2026!');

