import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getSessionSecret } from './session-secret';

/* ---------- roles and route policy ---------- */

export { ROLES, ADMIN_ROLES, STAFF_ROLES, isRole, ROUTE_POLICY, canAccessRoute } from './route-policy';
export type { UserRole } from './route-policy';
import type { UserRole } from './route-policy';
import { ROLES, ADMIN_ROLES, STAFF_ROLES, isRole } from './route-policy';

/* ---------- users ---------- */

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hash: string;
  salt: string;
  /** PBKDF2 iterations used for this hash; older hashes are upgraded on next login. */
  iter?: number;
  active: boolean;
  /** Bumped on password rotation, suspension or "revoke sessions": every older token dies. */
  sessionVersion?: number;
  createdAt: string;
  lastLoginAt?: string;
  passwordChangedAt?: string;
}

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sv: number;   // session version
  fp: string;   // user-agent fingerprint
  iat: number;
  exp: number;  // Unix seconds
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/** OWASP 2023 guidance for PBKDF2-HMAC-SHA512. */
export const PBKDF2_ITERATIONS = 210_000;
const LEGACY_ITERATIONS = 100_000;
export const SESSION_TTL_S = 12 * 60 * 60;

function requireSecret(): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error('SESSION_SECRET (32+ chars) is required in production.');
  return secret;
}

/** PBKDF2-SHA512 with a random 32-byte salt. */
export function hashPassword(password: string, existingSalt?: string, iterations = PBKDF2_ITERATIONS): { hash: string; salt: string; iter: number } {
  const salt = existingSalt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return { hash, salt, iter: iterations };
}

export function verifyPassword(password: string, storedHash: string, salt: string, iterations = LEGACY_ITERATIONS): boolean {
  try {
    const { hash } = hashPassword(password, salt, iterations);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

/** Burn the same time as a real check, so a missing account is not detectable by timing. */
const DUMMY = hashPassword('lumo-timing-equalizer', 'a'.repeat(64));
export function dummyVerify(password: string): void {
  verifyPassword(password, DUMMY.hash, DUMMY.salt, PBKDF2_ITERATIONS);
}

export function fingerprint(userAgent: string | null): string {
  return crypto.createHash('sha256').update(userAgent || 'no-ua').digest('base64url').slice(0, 22);
}

/** HMAC-SHA256 signed session, bound to the browser's user agent and the user's session version. */
export function createSessionToken(user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'sessionVersion'>, userAgent: string | null): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    id: user.id, name: user.name, email: user.email, role: user.role,
    sv: user.sessionVersion ?? 0, fp: fingerprint(userAgent), iat: now, exp: now + SESSION_TTL_S,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto.createHmac('sha256', requireSecret()).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

/**
 * Full check: signature, expiry, user-agent fingerprint, account still active, session version current.
 * `reason` is for the audit log only; never show it to the visitor.
 */
export function verifySessionToken(token: string, userAgent?: string | null): { valid: boolean; payload?: SessionPayload; reason?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false, reason: 'malformed' };
    const [payloadB64, signature] = parts;
    const expected = crypto.createHmac('sha256', requireSecret()).update(payloadB64).digest('hex');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
      return { valid: false, reason: 'bad-signature' };
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'expired' };
    if (userAgent !== undefined && payload.fp !== fingerprint(userAgent)) return { valid: false, reason: 'fingerprint-mismatch' };
    const user = getUserById(payload.id);
    if (!user || !user.active) return { valid: false, reason: 'user-inactive' };
    if ((user.sessionVersion ?? 0) !== payload.sv) return { valid: false, reason: 'revoked' };
    if (user.role !== payload.role) return { valid: false, reason: 'role-changed' };
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'error' };
  }
}

/* ---------- storage ---------- */

export function getAllUsers(): User[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return initializeDefaultUsers();
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as User[];
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

function saveUsers(users: User[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2), { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tmp, USERS_FILE);
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
  const seed = (id: string, name: string, email: string, role: UserRole, envVar: string): User => {
    const h = hashPassword(seedPassword(envVar, email));
    return { id, name, email, role, hash: h.hash, salt: h.salt, iter: h.iter, active: true, sessionVersion: 0, createdAt: new Date().toISOString() };
  };
  const users = [
    seed('usr-carlos', 'Carlos Gómez', 'carlos@lumohq.com', 'SUPER_ADMIN', 'ADMIN_CARLOS_PASSWORD'),
    seed('usr-luis', 'Luis Barbera', 'luis@lumohq.com', 'ADMIN_LUIS', 'ADMIN_LUIS_PASSWORD'),
    seed('usr-barbara', 'Bárbara', 'barbara@lumohq.com', 'SALES_BARBARA', 'SALES_BARBARA_PASSWORD'),
  ];
  saveUsers(users);
  return users;
}

export function getUserByEmail(email: string): User | null {
  const e = email.toLowerCase().trim();
  return getAllUsers().find((u) => u.email.toLowerCase() === e) || null;
}

export function getUserById(id: string): User | null {
  return getAllUsers().find((u) => u.id === id) || null;
}

function mutate(id: string, fn: (u: User) => void): User | null {
  const users = getAllUsers();
  const u = users.find((x) => x.id === id);
  if (!u) return null;
  fn(u);
  saveUsers(users);
  return u;
}

/** Record a login and upgrade an old hash to the current iteration count while we have the password. */
export function recordLogin(id: string, plainPassword: string): void {
  mutate(id, (u) => {
    u.lastLoginAt = new Date().toISOString();
    if ((u.iter ?? LEGACY_ITERATIONS) < PBKDF2_ITERATIONS || u.salt.length < 64) {
      const h = hashPassword(plainPassword);
      u.hash = h.hash; u.salt = h.salt; u.iter = h.iter;
    }
  });
}

export function updateUserPassword(id: string, newPlainPassword: string): boolean {
  return !!mutate(id, (u) => {
    const h = hashPassword(newPlainPassword);
    u.hash = h.hash; u.salt = h.salt; u.iter = h.iter;
    u.passwordChangedAt = new Date().toISOString();
    u.sessionVersion = (u.sessionVersion ?? 0) + 1; // a new password logs out every other session
  });
}

export function revokeSessions(id: string): boolean {
  return !!mutate(id, (u) => { u.sessionVersion = (u.sessionVersion ?? 0) + 1; });
}

export function setUserActive(id: string, active: boolean): boolean {
  return !!mutate(id, (u) => { u.active = active; u.sessionVersion = (u.sessionVersion ?? 0) + 1; });
}

export function toggleUserStatus(id: string): { success: boolean; active?: boolean } {
  const u = getUserById(id);
  if (!u) return { success: false };
  setUserActive(id, !u.active);
  return { success: true, active: !u.active };
}

export function setUserRole(id: string, role: UserRole): boolean {
  return !!mutate(id, (u) => { u.role = role; u.sessionVersion = (u.sessionVersion ?? 0) + 1; });
}

export function countActiveAdmins(): number {
  return getAllUsers().filter((u) => u.active && ADMIN_ROLES.includes(u.role)).length;
}

/** 18 characters from a CSPRNG over a 70-symbol alphabet (about 110 bits). */
export function generateSecurePassword(length = 18): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*-_=+'];
  const all = sets.join('');
  const chars = sets.map((s) => s[crypto.randomInt(s.length)]);
  while (chars.length < length) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export type PublicUser = Omit<User, 'hash' | 'salt' | 'iter'>;
export const toPublic = ({ hash: _h, salt: _s, iter: _i, ...rest }: User): PublicUser => rest;

export function createUser(
  name: string,
  email: string,
  role: UserRole,
  customPassword?: string
): { success: boolean; user?: PublicUser; generatedPassword?: string; error?: string } {
  const users = getAllUsers();
  const cleanEmail = email.toLowerCase().trim();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Ya existe un usuario con este correo electrónico.' };
  }
  const password = customPassword || generateSecurePassword();
  const h = hashPassword(password);
  const newUser: User = {
    id: `usr-${crypto.randomBytes(6).toString('hex')}`,
    name: name.trim(), email: cleanEmail, role,
    hash: h.hash, salt: h.salt, iter: h.iter,
    active: true, sessionVersion: 0, createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { success: true, user: toPublic(newUser), generatedPassword: customPassword ? undefined : password };
}

/** Password policy for anything a person types: 12+ chars, at least 3 of 4 character classes. */
export function passwordProblem(pw: string): string | null {
  if (typeof pw !== 'string' || pw.length < 12) return 'La contraseña debe tener al menos 12 caracteres.';
  if (pw.length > 128) return 'La contraseña es demasiado larga.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes < 3) return 'Usa al menos 3 de: minúsculas, mayúsculas, números y símbolos.';
  return null;
}

/* ---------- client portal access keys ---------- */

/**
 * Clients have no password: their portal link carries a key derived from their id with the
 * server secret. Knowing or guessing a client id is no longer enough to act on that project.
 */
export function clientAccessKey(clientId: string): string {
  return crypto.createHmac('sha256', requireSecret()).update(`client-portal:${clientId}`).digest('base64url').slice(0, 32);
}
export function verifyClientKey(clientId: unknown, key: unknown): boolean {
  if (typeof clientId !== 'string' || typeof key !== 'string' || key.length !== 32) return false;
  const expected = clientAccessKey(clientId);
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected));
}

/* ---------- 1-page diagnosis share keys ---------- */

/** The diagnosis link sent to a business carries this key. Without it the page shows nothing. */
export function diagnosisKey(prospectId: string): string {
  return crypto.createHmac('sha256', requireSecret()).update(`diagnosis:${prospectId}`).digest('base64url').slice(0, 24);
}
export function verifyDiagnosisKey(prospectId: string, key: unknown): boolean {
  if (typeof key !== 'string' || key.length !== 24) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(diagnosisKey(prospectId)));
}
