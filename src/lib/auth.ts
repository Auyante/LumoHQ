import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_LUIS' | 'SALES_BARBARA' | 'DEVELOPER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hash: string;
  salt: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  exp: number; // Unix timestamp in seconds
}

import { getSessionSecret } from './session-secret';

function requireSecret(): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error('SESSION_SECRET (32+ chars) is required in production.');
  return secret;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Hash a password using PBKDF2 with SHA-512 and 100,000 iterations.
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a plain text password against stored hash and salt.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const { hash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Create a signed HMAC-SHA256 session token valid for 7 days.
 */
export function createSessionToken(user: { id: string; name: string; email: string; role: UserRole }): string {
  const payload: SessionPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf-8').toString('base64url');
  const signature = crypto.createHmac('sha256', requireSecret()).update(payloadB64).digest('hex');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify HMAC-SHA256 session token.
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: SessionPayload } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', requireSecret()).update(payloadB64).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return { valid: false };
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as SessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * Read all users from disk (with in-memory fallback).
 */
export function getAllUsers(): User[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return initializeDefaultUsers();
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (err) {
    console.error('Error reading users file:', err);
    return initializeDefaultUsers();
  }
}

function saveUsers(users: User[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users file:', err);
  }
}

/**
 * Seed password: taken from env, or generated once and printed to the server console.
 * Never hardcode passwords in source.
 */
function seedPassword(envVar: string, email: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 12) return fromEnv;
  const generated = generateSecurePassword();
  console.warn(`[auth] ${envVar} not set. Generated one-time password for ${email}: ${generated}`);
  return generated;
}

function initializeDefaultUsers(): User[] {
  const carlos = hashPassword(seedPassword('ADMIN_CARLOS_PASSWORD', 'carlos@lumohq.com'));
  const luis = hashPassword(seedPassword('ADMIN_LUIS_PASSWORD', 'luis@lumohq.com'));
  const barbara = hashPassword(seedPassword('SALES_BARBARA_PASSWORD', 'barbara@lumohq.com'));

  const defaultUsers: User[] = [
    {
      id: 'usr-carlos',
      name: 'Carlos Gómez',
      email: 'carlos@lumohq.com',
      role: 'SUPER_ADMIN',
      hash: carlos.hash,
      salt: carlos.salt,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-luis',
      name: 'Luis Barbera',
      email: 'luis@lumohq.com',
      role: 'ADMIN_LUIS',
      hash: luis.hash,
      salt: luis.salt,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-barbara',
      name: 'Bárbara',
      email: 'barbara@lumohq.com',
      role: 'SALES_BARBARA',
      hash: barbara.hash,
      salt: barbara.salt,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];

  saveUsers(defaultUsers);
  return defaultUsers;
}

export function getUserByEmail(email: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function updateUserLastLogin(id: string): void {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index].lastLoginAt = new Date().toISOString();
    saveUsers(users);
  }
}

export function updateUserPassword(id: string, newPlainPassword: string): boolean {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;

  const { hash, salt } = hashPassword(newPlainPassword);
  users[index].hash = hash;
  users[index].salt = salt;
  saveUsers(users);
  return true;
}

export function toggleUserStatus(id: string): { success: boolean; active?: boolean } {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return { success: false };

  users[index].active = !users[index].active;
  saveUsers(users);
  return { success: true, active: users[index].active };
}

export function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';

  let pwd = '';
  pwd += upper.charAt(crypto.randomInt(upper.length));
  pwd += upper.charAt(crypto.randomInt(upper.length));
  pwd += lower.charAt(crypto.randomInt(lower.length));
  pwd += lower.charAt(crypto.randomInt(lower.length));
  pwd += digits.charAt(crypto.randomInt(digits.length));
  pwd += digits.charAt(crypto.randomInt(digits.length));
  pwd += symbols.charAt(crypto.randomInt(symbols.length));
  pwd += symbols.charAt(crypto.randomInt(symbols.length));

  // Add random characters to make it 14 chars long
  const allChars = upper + lower + digits + symbols;
  for (let i = 0; i < 6; i++) {
    pwd += allChars.charAt(crypto.randomInt(allChars.length));
  }

  // Fisher-Yates shuffle with a CSPRNG
  const chars = pwd.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function createUser(
  name: string,
  email: string,
  role: UserRole,
  customPassword?: string
): { success: boolean; user?: Omit<User, 'hash' | 'salt'>; generatedPassword?: string; error?: string } {
  const users = getAllUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Ya existe un usuario con este correo electrónico.' };
  }

  const generatedPassword = customPassword || generateSecurePassword();
  const { hash, salt } = hashPassword(generatedPassword);

  const newUser: User = {
    id: `usr-${Date.now().toString(36)}`,
    name,
    email: email.toLowerCase().trim(),
    role,
    hash,
    salt,
    active: true,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: newUser.active,
      createdAt: newUser.createdAt,
    },
    generatedPassword: customPassword ? undefined : generatedPassword,
  };
}

/**
 * Role-Based Access Control checker.
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN_LUIS') {
    return true;
  }

  if (role === 'SALES_BARBARA') {
    // Bárbara cannot access financial management
    if (pathname.startsWith('/admin/finanzas')) {
      return false;
    }
    return true;
  }

  if (role === 'DEVELOPER') {
    if (pathname.startsWith('/admin/finanzas')) {
      return false;
    }
    return true;
  }

  return false;
}

