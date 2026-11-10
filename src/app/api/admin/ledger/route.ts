import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_ROLES } from '@/lib/auth';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { audit } from '@/lib/security/store';
import { checkRateLimit } from '@/lib/rate-limit';
import { ledgerStore, partnerOf } from '@/lib/ledger';
import { CITIES, EXPENSE_CATEGORIES, ledgerTotals } from '@/lib/ledger-engine';

/** IRS Schedule C ledger. Admins only (middleware + this check). Signatures come from the session. */

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida.').refine((d) => {
  const t = Date.parse(d + 'T12:00:00Z');
  return Number.isFinite(t) && t <= Date.now() + 86_400_000 && t >= Date.parse('2020-01-01');
}, 'La fecha no puede ser futura.');
const text = (max: number) => z.string().trim().max(max);
const twoDecimals = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

const Post = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('trip'), date: day, client: text(100).min(2, 'Escribe a quién visitaste.'), purpose: text(200).default(''),
    city: z.enum(CITIES), miles: z.number().positive('Las millas deben ser más de 0.').max(500, 'Máximo 500 millas por viaje.')
      .refine((n) => Math.abs(Math.round(n * 10) - n * 10) < 1e-6, 'Usa a lo más un decimal.'),
  }).strict(),
  z.object({
    kind: z.literal('expense'), date: day, concept: text(120).min(3, 'Escribe el concepto.'), category: z.enum(EXPENSE_CATEGORIES),
    amount: z.number().positive('El monto debe ser más de $0.').max(50_000, 'Monto demasiado alto.').refine(twoDecimals, 'Máximo 2 decimales.'),
  }).strict(),
]);

const Patch = z.object({ action: z.enum(['sign', 'reject']), id: z.string().max(80) }).strict();
const Del = z.object({ id: z.string().max(80) }).strict();

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

function payload(s: { role: string; email: string }) {
  const book = ledgerStore.all();
  return { success: true, ...book, totals: ledgerTotals(book.trips, book.expenses), me: { partner: partnerOf(s) } };
}

async function guard(req: NextRequest) {
  const g = requireSession(req, ADMIN_ROLES);
  if (isGuardResponse(g)) return { res: g } as const;
  if (req.method !== 'GET' && !checkRateLimit(`ledger:${g.ip}`, 60, 60_000).allowed) return { res: bad('Demasiadas solicitudes.', 429) } as const;
  let body: unknown = null;
  if (req.method !== 'GET') {
    try { body = await req.json(); } catch { return { res: bad('Solicitud inválida.') } as const; }
  }
  return { g, body, actor: { name: g.session.name, role: g.session.role, email: g.session.email } } as const;
}

export async function GET(req: NextRequest) {
  const x = await guard(req);
  if ('res' in x) return x.res;
  return NextResponse.json(payload(x.g.session), { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const x = await guard(req);
  if ('res' in x) return x.res;
  const { g, actor } = x;
  const p = Post.safeParse(x.body);
  if (!p.success) return bad(p.error.issues[0]?.message || 'Datos no válidos.');
  if (p.data.kind === 'trip') {
    const { kind: _kind, ...trip } = p.data;
    const r = ledgerStore.addTrip(trip, actor);
    if (!r.ok) return bad(r.error, r.status);
    audit('LEDGER_TRIP', 'INFO', g.ip, `${trip.miles} mi · ${trip.client}`, g.session.email);
  } else {
    const { kind: _kind, ...exp } = p.data;
    const r = ledgerStore.addExpense(exp, actor);
    if (!r.ok) return bad(r.error, r.status);
    audit('LEDGER_EXPENSE', 'INFO', g.ip, `$${exp.amount.toFixed(2)} · ${exp.concept}`, g.session.email);
  }
  return NextResponse.json(payload(g.session), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const x = await guard(req);
  if ('res' in x) return x.res;
  const { g, actor } = x;
  const p = Patch.safeParse(x.body);
  if (!p.success) return bad('Datos no válidos.');
  const r = p.data.action === 'sign' ? ledgerStore.sign(p.data.id, actor) : ledgerStore.reject(p.data.id, actor);
  if (!r.ok) {
    if (r.status === 403) audit('ACCESS_DENIED', 'WARN', g.ip, `ledger ${p.data.action} by ${g.session.role}`, g.session.email);
    return bad(r.error, r.status);
  }
  audit(p.data.action === 'sign' ? 'LEDGER_SIGN' : 'LEDGER_REJECT', 'INFO', g.ip, `$${r.value.amount.toFixed(2)} · ${r.value.concept}`, g.session.email);
  return NextResponse.json(payload(g.session));
}

/** Delete a mileage trip entered by mistake. Expenses are never deleted: they are rejected instead. */
export async function DELETE(req: NextRequest) {
  const x = await guard(req);
  if ('res' in x) return x.res;
  const { g } = x;
  const p = Del.safeParse(x.body);
  if (!p.success) return bad('Datos no válidos.');
  const r = ledgerStore.removeTrip(p.data.id);
  if (!r.ok) return bad(r.error, r.status);
  audit('LEDGER_TRIP', 'WARN', g.ip, `borrado: ${r.value.miles} mi · ${r.value.client}`, g.session.email);
  return NextResponse.json(payload(g.session));
}
