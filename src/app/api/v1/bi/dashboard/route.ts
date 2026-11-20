import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { ADMIN_ROLES } from '@/lib/auth';
import { microservices } from '@/microservices';

export const dynamic = 'force-dynamic';

const BI_ROLES = [...ADMIN_ROLES, 'DEVELOPER'] as const;

/** GET /api/v1/bi/dashboard — tablero ejecutivo (MRR, embudo, Gates y retención). */
export async function GET(req: NextRequest) {
  const g = requireSession(req, BI_ROLES);
  if (isGuardResponse(g)) return g;
  return NextResponse.json({
    success: true,
    dashboard: microservices.bi.dashboard(),
    retention: microservices.bi.retention(),
  }, { headers: { 'cache-control': 'no-store' } });
}
