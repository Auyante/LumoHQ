/**
 * Roles and route policy. Pure module (no Node APIs) so the admin menu can hide links with the same
 * rules the middleware enforces. Hiding a link is a convenience; the server is the authority.
 */

export const ROLES = ['SUPER_ADMIN', 'ADMIN_LUIS', 'ADMIN_CARLOS', 'SALES_BARBARA', 'DEVELOPER', 'CLIENT'] as const;
export type UserRole = (typeof ROLES)[number];
export const ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN_LUIS', 'ADMIN_CARLOS'];
export const STAFF_ROLES: readonly UserRole[] = [...ADMIN_ROLES, 'SALES_BARBARA', 'DEVELOPER'];
export const isRole = (r: unknown): r is UserRole => typeof r === 'string' && (ROLES as readonly string[]).includes(r);

/**
 * Which roles may open each admin area. Anything under /admin not listed here is admin-only.
 * Bárbara (SALES_BARBARA): CRM and Day 1 collection (production) only. Finance, users, security,
 * retention and the Sunday board answer 403.
 */
export const ROUTE_POLICY: { prefix: string; roles: readonly UserRole[] }[] = [
  { prefix: '/admin/crm', roles: STAFF_ROLES },
  { prefix: '/admin/produccion', roles: STAFF_ROLES },
  { prefix: '/admin/retencion', roles: [...ADMIN_ROLES, 'DEVELOPER'] },
  { prefix: '/admin/tablero-dominical', roles: [...ADMIN_ROLES, 'DEVELOPER'] },
  { prefix: '/admin/finanzas', roles: ADMIN_ROLES },
  { prefix: '/admin/usuarios', roles: ADMIN_ROLES },
  { prefix: '/admin/seguridad', roles: ADMIN_ROLES },
  { prefix: '/api/crm', roles: STAFF_ROLES },
  // Specific API rules first: the first matching prefix wins.
  { prefix: '/api/admin/sunday', roles: [...ADMIN_ROLES, 'DEVELOPER'] },
  { prefix: '/api/admin', roles: ADMIN_ROLES },
  { prefix: '/api/auth/me', roles: ROLES },
];

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const rule = ROUTE_POLICY.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
  if (rule) return rule.roles.includes(role);
  return ADMIN_ROLES.includes(role); // default deny to everyone but admins
}
