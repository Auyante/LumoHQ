import { NextResponse, type NextRequest } from 'next/server';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { STAFF_ROLES } from '@/lib/auth';
import { microservices } from '@/microservices';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/crm/leads/[id] — un prospecto (staff). */
export async function GET(req: NextRequest, ctx: Ctx) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  const { id } = await ctx.params;
  const lead = microservices.crm.getLead(id);
  if (!lead) return NextResponse.json({ error: 'Prospecto no encontrado.' }, { status: 404 });
  return NextResponse.json({ success: true, lead }, { headers: { 'cache-control': 'no-store' } });
}

/** PATCH /api/v1/crm/leads/[id] — cerrar/convertir (emite crm.lead.converted al ERP). */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  const { id } = await ctx.params;
  const res = microservices.crm.convertLead(id, { actorId: g.session.id, role: g.session.role });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ success: true, lead: res.value.lead, clientNumber: res.value.clientNumber, packageType: res.value.packageType });
}
