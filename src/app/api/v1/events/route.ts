import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { ADMIN_ROLES } from '@/lib/auth';
import { getEventBus } from '@/microservices';

export const dynamic = 'force-dynamic';

/** GET /api/v1/events — trazabilidad distribuida (X-Correlation-ID) y circuit breakers (admins). */
export async function GET(req: NextRequest) {
  const g = requireSession(req, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;

  const bus = getEventBus();
  const correlationId = req.nextUrl.searchParams.get('correlationId');
  const events = correlationId ? bus.traceByCorrelation(correlationId) : bus.trace();

  return NextResponse.json({
    success: true,
    events: events.map((e) => ({
      id: e.id,
      correlationId: e.correlationId,
      name: e.name,
      source: e.source,
      actorId: e.actorId,
      role: e.role,
      timestampUtc: e.timestampUtc,
      payload: e.payload,
      signature: e.signature,
    })),
    breakers: bus.breakerStats(),
  }, { headers: { 'cache-control': 'no-store' } });
}
