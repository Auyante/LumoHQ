import { z } from 'zod';
import { registerService } from './service';
import {
  SESSION_TTL_S,
  createSessionToken,
  createUser,
  dummyVerify,
  generateSecurePassword,
  getAllUsers,
  getUserByEmail,
  hashPassword,
  passwordProblem,
  revokeSessions,
  setUserActive,
  setUserRole,
  toPublic,
  updateUserPassword,
  verifyPassword,
  verifySessionToken,
  type PublicUser,
} from '@/lib/auth';
import { ROLES, canAccessRoute, isRole, type UserRole } from '@/lib/route-policy';
import { detectAttack, scanJson } from '@/lib/security/waf';

/**
 * svc-iam-gateway — Seguridad Zero-Trust, IAM, WAF y SOC.
 * Facada sobre el módulo de autenticación (PBKDF2-SHA512, sesión HMAC) y el WAF local. Es la única
 * puerta de entrada criptográfica: ningún otro microservicio verifica credenciales por su cuenta.
 */

export const LoginSchema = z.object({
  email: z.string().trim().max(120).email('Correo no válido'),
  password: z.string().min(1).max(256),
});

const roleEnum = z.enum([...ROLES] as [UserRole, ...UserRole[]]);

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(120).email('Correo no válido'),
  role: roleEnum,
  password: z.string().min(12).max(128).optional(),
});

export const RotatePasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(12).max(128),
});

export const SetRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleEnum,
});

export interface IamSession {
  token: string;
  user: PublicUser;
  ttlSeconds: number;
}

export const iamGatewayService = {
  name: 'svc-iam-gateway' as const,

  /* --- criptografía --- */
  hashPassword,
  passwordProblem,
  generateSecurePassword,

  /* --- WAF --- */
  detectAttack,
  scanJson,

  /* --- RBAC --- */
  roles: ROLES,
  isRole,
  canAccessRoute(role: UserRole, pathname: string): boolean {
    return canAccessRoute(role, pathname);
  },

  /* --- autenticación --- */
  verifyCredentials(email: string, password: string, userAgent: string | null): IamSession | null {
    const user = getUserByEmail(email);
    const okCredential = user
      ? verifyPassword(password, user.hash, user.salt, user.iter)
      : (dummyVerify(password), false);
    if (!okCredential || !user || !user.active) return null;
    return { token: createSessionToken(user, userAgent), user: toPublic(user), ttlSeconds: SESSION_TTL_S };
  },

  verifySession(token: string, userAgent?: string | null) {
    return verifySessionToken(token, userAgent);
  },

  /* --- gestión de usuarios --- */
  listUsers(): PublicUser[] {
    return getAllUsers().map(toPublic);
  },

  createUser(input: z.infer<typeof CreateUserSchema>) {
    return createUser(input.name, input.email, input.role, input.password);
  },

  rotatePassword(userId: string, newPassword: string): boolean {
    if (passwordProblem(newPassword)) return false;
    return updateUserPassword(userId, newPassword);
  },

  revokeSessions(userId: string): boolean {
    return revokeSessions(userId);
  },

  setRole(userId: string, role: UserRole): boolean {
    if (!isRole(role)) return false;
    return setUserRole(userId, role);
  },

  setActive(userId: string, active: boolean): boolean {
    return setUserActive(userId, active);
  },

  schemas: { LoginSchema, CreateUserSchema, RotatePasswordSchema, SetRoleSchema },
};

registerService({
  name: 'svc-iam-gateway',
  description: 'Zero-Trust IAM: PBKDF2-SHA512, sesión HMAC, RBAC y WAF.',
  subscribesTo: [],
  emits: [],
});
