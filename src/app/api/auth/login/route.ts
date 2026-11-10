import { NextResponse, type NextRequest } from 'next/server';
import { getUserByEmail, verifyPassword, dummyVerify, createSessionToken, recordLogin, SESSION_TTL_S } from '@/lib/auth';
import { getClientIp } from '@/lib/security/client-ip';
import { audit, blockIp, recordFailure, clearFailures, accountLockedUntil, lockAccount, clearAccountLock } from '@/lib/security/store';
import { honeypotTripped, sessionCookie } from '@/lib/security/guard';

const GENERIC = 'Correo o contraseña incorrectos.';
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }); }

  const trap = honeypotTripped(request, body, 'login');
  if (trap) return NextResponse.json({ error: GENERIC }, { status: 401 });

  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim().slice(0, 120) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
  if (!email || !password) return NextResponse.json({ error: 'Escribe tu correo y tu contraseña.' }, { status: 400 });

  // Account lockout: checked before the password so a locked account cannot be probed.
  const lockedUntil = accountLockedUntil(email);
  if (lockedUntil) {
    audit('LOGIN_LOCKED', 'WARN', ip, `attempt on locked account`, email);
    const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
    return NextResponse.json({ error: `Demasiados intentos. Intenta de nuevo en ${mins} min.` }, { status: 429 });
  }

  const user = getUserByEmail(email);
  const ok = user ? verifyPassword(password, user.hash, user.salt, user.iter) : (dummyVerify(password), false);

  if (!ok || !user || !user.active) {
    const ipFails = recordFailure(`login-ip:${ip}`, WINDOW_MS);
    const accFails = recordFailure(`login-acc:${email}`, WINDOW_MS);
    audit('LOGIN_FAIL', ipFails >= 3 ? 'WARN' : 'INFO', ip, user && !user.active ? 'suspended account' : 'bad credentials', email);
    if (ipFails >= MAX_FAILS) { blockIp(ip, `${ipFails} failed logins`); clearFailures(`login-ip:${ip}`); }
    if (accFails >= MAX_FAILS) {
      const until = lockAccount(email);
      clearFailures(`login-acc:${email}`);
      audit('LOGIN_LOCKED', 'CRITICAL', ip, `account locked until ${new Date(until).toISOString()}`, email);
    }
    // Same message and status for unknown, wrong and suspended: no account enumeration.
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  clearFailures(`login-ip:${ip}`);
  clearFailures(`login-acc:${email}`);
  clearAccountLock(email);
  recordLogin(user.id, password);
  audit('LOGIN_OK', 'INFO', ip, `role ${user.role}`, user.email);

  const token = createSessionToken(user, request.headers.get('user-agent'));
  const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set(sessionCookie(token, SESSION_TTL_S));
  res.headers.set('cache-control', 'no-store');
  return res;
}
