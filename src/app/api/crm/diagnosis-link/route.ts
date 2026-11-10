import { NextResponse, type NextRequest } from 'next/server';
import { STAFF_ROLES, diagnosisKey } from '@/lib/auth';
import { crmStore } from '@/lib/crm';
import { requireSession, isGuardResponse } from '@/lib/security/guard';

/** Staff get the signed, shareable link to one business's 1-page diagnosis. */
export async function GET(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!crmStore.getById(id)) return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
  const url = `${req.nextUrl.origin}/diagnostico/${encodeURIComponent(id)}?k=${diagnosisKey(id)}`;
  return NextResponse.json({ url }, { headers: { 'cache-control': 'no-store' } });
}
