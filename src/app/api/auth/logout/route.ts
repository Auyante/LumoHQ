import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { getClientIp } from '@/lib/security/client-ip';
import { audit } from '@/lib/security/store';
import { SESSION_COOKIE, sessionCookie } from '@/lib/security/guard';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const v = verifySessionToken(token);
    if (v.payload) audit('LOGOUT', 'INFO', getClientIp(request.headers), 'logout', v.payload.email);
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(sessionCookie('', 0));
  return res;
}
