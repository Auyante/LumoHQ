import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_ROLES, clientAccessKey } from '@/lib/auth';
import { clientProjectStore } from '@/lib/client-portal';
import { requireSession, isGuardResponse } from '@/lib/security/guard';

/** Admins get each client's private portal link (client id + access key). */
export async function GET(request: NextRequest) {
  const g = requireSession(request, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  const origin = request.nextUrl.origin;
  const links = clientProjectStore.getAll().map((p) => ({
    clientId: p.id,
    businessName: p.businessName,
    url: `${origin}/portal?client_id=${encodeURIComponent(p.id)}&k=${clientAccessKey(p.id)}`,
  }));
  return NextResponse.json({ links }, { headers: { 'cache-control': 'no-store' } });
}
