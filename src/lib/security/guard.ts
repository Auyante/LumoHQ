import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, verifyClientKey, type SessionPayload, type UserRole } from '@/lib/auth';
import { getClientIp } from './client-ip';
import { audit, blockIp } from './store';

export const SESSION_COOKIE = 'lumo_session';

/** Cookie options for the session: HttpOnly, SameSite=Strict, Path=/, Secure in production. */
export const sessionCookie = (value: string, maxAge: number) => ({
  name: SESSION_COOKIE, value, httpOnly: true, sameSite: 'strict' as const, path: '/',
  secure: process.env.NODE_ENV === 'production', maxAge,
});

/**
 * Route-level check, a second wall behind the middleware: every protected handler calls it.
 * Returns the session or a ready 401/403 response.
 */
export function requireSession(req: NextRequest, roles?: readonly UserRole[]): { session: SessionPayload; ip: string } | NextResponse {
  const ip = getClientIp(req.headers);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  const v = verifySessionToken(token, req.headers.get('user-agent'));
  if (!v.valid || !v.payload) {
    audit('SESSION_INVALID', 'WARN', ip, `${req.nextUrl.pathname} · ${v.reason}`);
    const res = NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
    res.cookies.set(sessionCookie('', 0));
    return res;
  }
  if (roles && !roles.includes(v.payload.role)) {
    audit('ACCESS_DENIED', 'WARN', ip, `${req.method} ${req.nextUrl.pathname} as ${v.payload.role}`, v.payload.email);
    return NextResponse.json({ error: 'No tienes permiso para esta sección.' }, { status: 403 });
  }
  return { session: v.payload, ip };
}

/** Client portal calls must carry the client's access key from their portal link. */
export function requireClientKey(req: NextRequest, clientId: unknown, key: unknown): NextResponse | null {
  if (verifyClientKey(clientId, key)) return null;
  const ip = getClientIp(req.headers);
  audit('TAMPERING', 'CRITICAL', ip, `client portal call without a valid key for ${String(clientId).slice(0, 40)}`);
  return NextResponse.json({ error: 'Enlace de portal inválido.' }, { status: 403 });
}

/**
 * Honeypot: a field people never see. If it holds anything, a bot filled the form.
 * Blocks the IP and returns a fake success so the bot learns nothing.
 */
export function honeypotTripped(req: NextRequest, body: unknown, form: string): NextResponse | null {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>).website : undefined;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const ip = getClientIp(req.headers);
  audit('HONEYPOT', 'CRITICAL', ip, `honeypot filled on ${form}`);
  blockIp(ip, `honeypot ${form}`);
  return NextResponse.json({ success: true });
}

export const isGuardResponse = (x: unknown): x is NextResponse => x instanceof NextResponse;
