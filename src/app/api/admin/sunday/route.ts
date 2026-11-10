import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_ROLES } from '@/lib/auth';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { audit } from '@/lib/security/store';
import { checkRateLimit } from '@/lib/rate-limit';
import { crmStore } from '@/lib/crm';
import { funnel } from '@/lib/crm-engine';
import { metricsFromFunnel } from '@/lib/sunday-dashboard';
import { sundayStore } from '@/lib/sunday-store';

/** Sunday review. Admins and the developer can read it; only admins can change it. */

const READ_ROLES = [...ADMIN_ROLES, 'DEVELOPER'] as const;
const count = (max: number) => z.number().int().min(0).max(max);
const hours = z.number().min(0).max(80).refine((n) => Math.abs(Math.round(n * 2) - n * 2) < 1e-6, 'Horas en medios: 1, 1.5, 2…');

const Review = z.object({
  milestone: z.union([z.literal(14), z.literal(30), z.literal(60), z.literal(90)]),
  hours: z.object({ luisHours: hours, carlosHours: hours, barbaraHours: hours, contactsThisWeek: count(1000) }).strict(),
  metrics: z.object({ contacts: count(10_000), diagnoses: count(10_000), meetings: count(10_000), closedClients: count(1000), mrr: count(1_000_000) }).strict(),
  notes: z.string().trim().max(1000),
}).strict();

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), review: Review }).strict(),
  z.object({ action: z.literal('close_week') }).strict(),
]);

function payload() {
  return { success: true, ...sundayStore.get(), fromCrm: metricsFromFunnel(funnel(crmStore.getAll()).map((s) => s.reached)) };
}

export async function GET(req: NextRequest) {
  const g = requireSession(req, READ_ROLES);
  if (isGuardResponse(g)) return g;
  return NextResponse.json({ ...payload(), canEdit: ADMIN_ROLES.includes(g.session.role) }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const g = requireSession(req, ADMIN_ROLES);
  if (isGuardResponse(g)) return g;
  if (!checkRateLimit(`sunday:${g.ip}`, 30, 60_000).allowed) return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }); }
  const p = Body.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || 'Datos no válidos.' }, { status: 400 });
  if (p.data.action === 'save') sundayStore.saveCurrent(p.data.review, g.session.name);
  else sundayStore.closeWeek(g.session.name);
  audit('SUNDAY_SAVE', 'INFO', g.ip, p.data.action, g.session.email);
  return NextResponse.json({ ...payload(), canEdit: true });
}
