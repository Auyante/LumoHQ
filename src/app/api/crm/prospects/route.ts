import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { crmStore, type ProspectItem } from '@/lib/crm';
import { SIGNAL_KEYS, STAGES, SOURCES, rowsFromCsv } from '@/lib/crm-engine';
import { checkRateLimit } from '@/lib/rate-limit';
import { STAFF_ROLES, ADMIN_ROLES } from '@/lib/auth';
import { requireSession, isGuardResponse } from '@/lib/security/guard';
import { audit } from '@/lib/security/store';

/** Staff only (middleware + this second check). Every body is validated; unknown fields are dropped. */

const text = (max: number) => z.string().trim().max(max);
const phone = z.string().trim().min(10).max(20).regex(/^[+0-9\s().-]+$/, 'Teléfono no válido');
const signals = z.object(Object.fromEntries(SIGNAL_KEYS.map((k) => [k, z.boolean()])) as Record<(typeof SIGNAL_KEYS)[number], z.ZodBoolean>);
const city = z.enum(['Midland', 'Odessa']);
const source = z.enum(SOURCES as [ProspectItem['source'], ...ProspectItem['source'][]]);
const batch = z.number().int().min(1).max(5);

const CreateSchema = z.object({
  businessName: text(100).min(2),
  ownerName: text(80).optional(),
  phone,
  address: text(120).optional(),
  city: city.default('Midland'),
  category: text(60).default('Servicios Locales'),
  source: source.default('BARBARA'),
  batchNumber: batch.default(1),
  signals: signals.optional(),
});

const DetailsSchema = z.object({
  businessName: text(100).min(2), ownerName: text(80), phone, address: text(120), city,
  googleMapsUrl: z.string().url().max(300).refine((u) => /^https:\/\//.test(u), 'Solo enlaces https'),
  category: text(60), source, batchNumber: batch,
  preferredChannel: z.enum(['WhatsApp', 'Llamada', 'Presencial']),
  questionSource: text(200), questionMissedCalls: text(200),
}).partial().strict();

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('update_stage'), id: z.string(), stage: z.enum(STAGES as [ProspectItem['stage'], ...ProspectItem['stage'][]]) }),
  z.object({ action: z.literal('follow_up'), id: z.string(), note: text(300).optional() }),
  z.object({ action: z.literal('add_note'), id: z.string(), note: text(300).min(1) }),
  z.object({ action: z.literal('update_signals'), id: z.string(), signals }),
  z.object({ action: z.literal('update_details'), id: z.string(), details: DetailsSchema }),
  z.object({ action: z.literal('opt_out'), id: z.string(), optedOut: z.boolean() }),
]);

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const firstIssue = (e: z.ZodError) => e.issues[0]?.message || 'Datos no válidos.';

export async function GET(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  return NextResponse.json({ success: true, prospects: crmStore.getAll() }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  if (!checkRateLimit(`crm-create:${g.ip}`, 20, 60_000).allowed) return bad('Demasiadas solicitudes.', 429);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return bad('Solicitud inválida.'); }

  // Bulk CSV import (admins only, max one batch of 30 per request)
  if (body.action === 'import_csv') {
    if (!ADMIN_ROLES.includes(g.session.role)) return bad('Solo administradores pueden importar.', 403);
    const csv = typeof body.csv === 'string' ? body.csv : '';
    if (csv.length > 200_000) return bad('El archivo es demasiado grande.');
    const defaultBatch = batch.safeParse(body.batchNumber).success ? (body.batchNumber as number) : 1;
    const { rows, errors } = rowsFromCsv(csv, defaultBatch);
    if (rows.length > 30) return bad('Máximo 30 negocios por importación (un lote).');
    const res = crmStore.importMany(rows);
    audit('CRM_IMPORT', 'INFO', g.ip, `${res.created.length} created, ${res.skipped.length} skipped, ${errors.length} invalid rows`, g.session.email);
    return NextResponse.json({ success: true, created: res.created.length, skipped: res.skipped, errors });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return bad(firstIssue(parsed.error));
  const d = parsed.data;
  const item = crmStore.create({
    ...d,
    stage: 'LISTED',
    signals: d.signals ?? Object.fromEntries(SIGNAL_KEYS.map((k) => [k, false])) as ProspectItem['signals'],
    followUpCount: 0,
    contactNotes: [],
  });
  return NextResponse.json({ success: true, prospect: item }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  let body: unknown;
  try { body = await req.json(); } catch { return bad('Solicitud inválida.'); }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return bad(firstIssue(parsed.error));
  const b = parsed.data;
  if (!crmStore.getById(b.id)) return bad('Prospecto no encontrado', 404);
  const ok = (prospect: unknown) => NextResponse.json({ success: true, prospect });

  switch (b.action) {
    case 'update_stage':
      crmStore.updateStage(b.id, b.stage);
      return ok(crmStore.getById(b.id));
    case 'follow_up': {
      const res = crmStore.incrementFollowUp(b.id, b.note ? `${b.note} (${g.session.name})` : `Seguimiento enviado por ${g.session.name}`);
      if (!res.success) return NextResponse.json({ error: res.error, count: res.count }, { status: 409 });
      return ok(crmStore.getById(b.id));
    }
    case 'add_note': {
      const item = crmStore.getById(b.id)!;
      item.contactNotes = [`[${new Date().toLocaleDateString('es-US')}] (${g.session.name}): ${b.note}`, ...(item.contactNotes ?? [])].slice(0, 200);
      return ok(item);
    }
    case 'update_signals':
      return ok(crmStore.updateSignals(b.id, b.signals));
    case 'update_details':
      return ok(crmStore.updateDetails(b.id, b.details));
    case 'opt_out': {
      const item = crmStore.setOptOut(b.id, b.optedOut);
      audit('CRM_OPT_OUT', 'INFO', g.ip, `${item?.businessName}: ${b.optedOut ? 'no contactar' : 'contacto reactivado'}`, g.session.email);
      return ok(item);
    }
  }
}
