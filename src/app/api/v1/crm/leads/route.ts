import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { STAFF_ROLES } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { microservices } from '@/microservices';

export const dynamic = 'force-dynamic';

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** GET /api/v1/crm/leads — listar prospectos (staff). */
export async function GET(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  return NextResponse.json({ success: true, leads: microservices.crm.listLeads() }, { headers: { 'cache-control': 'no-store' } });
}

/** POST /api/v1/crm/leads — crear prospecto (staff). */
export async function POST(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  if (!checkRateLimit(`v1-crm-create:${g.ip}`, 20, 60_000).allowed) return bad('Demasiadas solicitudes.', 429);

  let body: unknown;
  try { body = await req.json(); } catch { return bad('Solicitud inválida.'); }
  const parsed = microservices.crm.schemas.CreateLeadSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message || 'Datos no válidos.');

  const lead = microservices.crm.createLead(parsed.data, { actorId: g.session.id, role: g.session.role });
  return NextResponse.json({ success: true, lead }, { status: 201 });
}
