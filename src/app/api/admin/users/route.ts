import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_ROLES, isRole, getAllUsers, getUserById, createUser, updateUserPassword, revokeSessions,
  setUserActive, setUserRole, countActiveAdmins, generateSecurePassword, passwordProblem, toPublic,
} from '@/lib/auth';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { audit } from '@/lib/security/store';

/** Users and passwords: Carlos and Luis (admin roles) only. */

export async function GET(request: NextRequest) {
  const g = requireSession(request, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  return NextResponse.json({ users: getAllUsers().map(toPublic) }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const g = requireSession(request, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }); }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 120) : '';
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Escribe un nombre y un correo válidos.' }, { status: 400 });
  }
  if (!isRole(body.role)) return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 });
  let custom: string | undefined;
  if (typeof body.password === 'string' && body.password) {
    const problem = passwordProblem(body.password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    custom = body.password;
  }
  const result = createUser(name, email, body.role, custom);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  audit('USER_CREATED', 'WARN', g.ip, `${email} as ${body.role}`, g.session.email);
  return NextResponse.json({ success: true, user: result.user, generatedPassword: result.generatedPassword }, { headers: { 'cache-control': 'no-store' } });
}

type Action = 'rotate-password' | 'set-password' | 'revoke-sessions' | 'suspend' | 'reactivate' | 'set-role' | 'toggle-status' | 'change-password';

export async function PATCH(request: NextRequest) {
  const g = requireSession(request, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }); }

  const userId = typeof body.userId === 'string' ? body.userId : '';
  const action = body.action as Action;
  const target = getUserById(userId);
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  const actor = g.session.email;
  const isSelf = target.id === g.session.id;
  const removesAdmin = ADMIN_ROLES.includes(target.role) && target.active;

  switch (action) {
    case 'rotate-password': {
      const pw = generateSecurePassword();
      updateUserPassword(target.id, pw);
      audit('PASSWORD_ROTATED', 'WARN', g.ip, `generated for ${target.email}`, actor);
      return NextResponse.json({ success: true, generatedPassword: pw }, { headers: { 'cache-control': 'no-store' } });
    }
    case 'set-password':
    case 'change-password': {
      const problem = passwordProblem(body.newPassword as string);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
      updateUserPassword(target.id, body.newPassword as string);
      audit('PASSWORD_ROTATED', 'WARN', g.ip, `set for ${target.email}`, actor);
      return NextResponse.json({ success: true });
    }
    case 'revoke-sessions':
      revokeSessions(target.id);
      audit('SESSIONS_REVOKED', 'WARN', g.ip, `all sessions of ${target.email}`, actor);
      return NextResponse.json({ success: true });
    case 'suspend':
    case 'reactivate':
    case 'toggle-status': {
      const next = action === 'toggle-status' ? !target.active : action === 'reactivate';
      if (!next && isSelf) return NextResponse.json({ error: 'No puedes suspender tu propia cuenta.' }, { status: 400 });
      if (!next && removesAdmin && countActiveAdmins() <= 1) return NextResponse.json({ error: 'Debe quedar al menos un administrador activo.' }, { status: 400 });
      setUserActive(target.id, next);
      audit(next ? 'USER_REACTIVATED' : 'USER_SUSPENDED', 'WARN', g.ip, target.email, actor);
      return NextResponse.json({ success: true, active: next });
    }
    case 'set-role': {
      if (!isRole(body.role)) return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 });
      if (isSelf) return NextResponse.json({ error: 'No puedes cambiar tu propio rol.' }, { status: 400 });
      if (removesAdmin && !ADMIN_ROLES.includes(body.role) && countActiveAdmins() <= 1) {
        return NextResponse.json({ error: 'Debe quedar al menos un administrador activo.' }, { status: 400 });
      }
      setUserRole(target.id, body.role);
      audit('ROLE_CHANGED', 'WARN', g.ip, `${target.email}: ${target.role} -> ${body.role}`, actor);
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 });
  }
}
