import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { ADMIN_ROLES } from '@/lib/auth';
import { microservices } from '@/microservices';

export const dynamic = 'force-dynamic';

/** GET /api/v1/finance/waterfall — cotización exacta de la cascada del Documento 04 (admins). */
export async function GET(req: NextRequest) {
  const g = requireSession(req, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;

  const q = req.nextUrl.searchParams;
  const clientNumber = Number(q.get('clientNumber') || '1');
  const isFounder = q.get('isFounder') === 'true';
  const openedByBarbara = q.get('openedByBarbara') !== 'false';
  const barbaraEarned = Number(q.get('barbaraEarned') || '0');

  const waterfall = microservices.finance.quoteWaterfall(
    Number.isFinite(clientNumber) ? clientNumber : 1,
    isFounder,
    openedByBarbara,
    Number.isFinite(barbaraEarned) ? barbaraEarned : 0,
  );

  return NextResponse.json({
    success: true,
    waterfall,
    barbara: microservices.finance.getBarbaraCapStatus(),
    monthly: microservices.finance.monthlyWaterfall(microservices.finance.listTransactions().filter((t) => t.type === 'MONTHLY_SUBSCRIPTION').length),
  }, { headers: { 'cache-control': 'no-store' } });
}
