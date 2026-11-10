import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_ROLES, getAllUsers, revokeSessions } from '@/lib/auth';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { audit, readAudit, listBlocks, unblockIp, clearAccountLock } from '@/lib/security/store';

/** Security operations center data: audit log (with chain integrity), IP blocks, user sessions. */

export async function GET(request: NextRequest) {
  const g = requireSession(request, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  const log = readAudit(300);
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const last24 = log.entries.filter((e) => Date.parse(e.ts) > since);
  const count = (types: string[]) => last24.filter((e) => types.includes(e.type)).length;
  return NextResponse.json({
    integrity: { intact: log.intact, brokenAt: log.brokenAt, total: log.total },
    stats: {
      loginOk: count(['LOGIN_OK']),
      loginFail: count(['LOGIN_FAIL', 'LOGIN_LOCKED']),
      attacks: count(['WAF_BLOCK', 'HONEYPOT', 'TAMPERING', 'WEBHOOK_REJECTED', 'UPLOAD_REJECTED']),
      denied: count(['ACCESS_DENIED', 'SESSION_INVALID']),
    },
    blocks: listBlocks(),
    entries: log.entries,
    users: getAllUsers().map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, lastLoginAt: u.lastLoginAt, sessionVersion: u.sessionVersion ?? 0 })),
  }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const g = requireSession(request, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }); }

  if (body.action === 'unblock-ip' && typeof body.ip === 'string') {
    const ok = unblockIp(body.ip.slice(0, 45), g.session.email, g.ip);
    return NextResponse.json({ success: ok });
  }
  // A partner locked out after 5 failed logins can be let back in by another admin (the lock otherwise grows with each strike).
  if (body.action === 'unlock-account' && typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase().slice(0, 120);
    const ok = clearAccountLock(email);
    if (ok) audit('ACCOUNT_UNLOCKED', 'WARN', g.ip, `unlocked ${email}`, g.session.email);
    return NextResponse.json({ success: ok });
  }
  if (body.action === 'purge-sessions') {
    // Everyone, including the person pressing the button, has to sign in again.
    const users = getAllUsers();
    users.forEach((u) => revokeSessions(u.id));
    audit('SESSIONS_REVOKED', 'CRITICAL', g.ip, `all sessions purged (${users.length} users)`, g.session.email);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 });
}
