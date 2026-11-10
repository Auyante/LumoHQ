import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';

export async function GET(request: NextRequest) {
  const g = requireSession(request);
  if (isGuardResponse(g)) return NextResponse.json({ authenticated: false }, { status: 401 });
  const { id, name, email, role, exp } = g.session;
  return NextResponse.json({ authenticated: true, user: { id, name, email, role }, expiresAt: exp });
}
