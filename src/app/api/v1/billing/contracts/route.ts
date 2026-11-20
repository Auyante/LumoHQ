import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { ADMIN_ROLES } from '@/lib/auth';
import { microservices } from '@/microservices';

export const dynamic = 'force-dynamic';

/** GET /api/v1/billing/contracts — contratos generados (solo administradores). */
export async function GET(req: NextRequest) {
  const g = requireSession(req, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  return NextResponse.json({ success: true, contracts: microservices.billing.listContracts() }, { headers: { 'cache-control': 'no-store' } });
}
