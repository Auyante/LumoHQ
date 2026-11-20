import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { ADMIN_ROLES } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { microservices } from '@/microservices';

export const dynamic = 'force-dynamic';

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * POST /api/v1/billing/deposit — confirmar anticipo (solo administradores).
 * Exige Idempotency-Key y valida el importe en el servidor (anti-tampering). Al confirmar emite
 * billing.deposit.paid, que despierta ops (Día 0) y finanzas (cascada).
 */
export async function POST(req: NextRequest) {
  const g = requireSession(req, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  if (!checkRateLimit(`v1-deposit:${g.ip}`, 10, 60_000).allowed) return bad('Demasiadas solicitudes.', 429);

  let body: unknown;
  try { body = await req.json(); } catch { return bad('Solicitud inválida.'); }
  const parsed = microservices.billing.schemas.ConfirmDepositSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message || 'Datos no válidos.');

  const res = microservices.billing.confirmDeposit(parsed.data, {
    actorId: g.session.id,
    role: g.session.role,
    idempotencyKey: parsed.data.idempotencyKey,
  });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ success: true, contract: res.value.contract, eventId: res.value.eventId });
}
