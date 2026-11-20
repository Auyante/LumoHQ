import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { STAFF_ROLES } from '@/lib/auth';
import { microservices } from '@/microservices';

export const dynamic = 'force-dynamic';

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** GET /api/v1/ops/production — expedientes de producción (staff). */
export async function GET(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  return NextResponse.json({ success: true, production: microservices.ops.listProduction() }, { headers: { 'cache-control': 'no-store' } });
}

/** POST /api/v1/ops/production — completar Día 1 (desbloquea el reloj de 5 días). */
export async function POST(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;

  let body: { productionId?: unknown };
  try { body = await req.json(); } catch { return bad('Solicitud inválida.'); }
  if (typeof body.productionId !== 'string' || !body.productionId) return bad('productionId es obligatorio.');

  const res = microservices.ops.completeDay1(body.productionId, g.session.id, g.session.role);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ success: true, production: res.value });
}
