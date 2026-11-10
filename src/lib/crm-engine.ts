/**
 * LUMO HQ — CRM engine (pure functions, no I/O). Source of truth: Doc 03 (LUMO-SOP-003).
 * Shared by the admin CRM (browser), the CRM API (server) and the test suite, so the cadence,
 * the TCPA limit, the scripts and the commissions are computed the same way everywhere.
 */
import type { ProspectItem } from './crm';
import { OFFICIAL_SCRIPTS } from './crm';
import { calculateSetupWaterfall } from './finance';

export type Stage = ProspectItem['stage'];
export type SignalKey = keyof ProspectItem['signals'];

export const SIGNAL_KEYS: SignalKey[] = [
  'scoreReviews', 'scoreWebsite', 'scorePhotos', 'scoreHours',
  'scoreDescription', 'scoreReviewResponse', 'scoreBooking', 'scoreSpanish',
];
export const STAGES: Stage[] = ['LISTED', 'CONTACTED', 'DIAGNOSED', 'MET', 'CLOSED', 'FOLLOW_UP'];
export const SOURCES: ProspectItem['source'][] = ['BARBARA', 'LUIS', 'REFERRAL'];
export const MAX_FOLLOW_UPS = 3;
export const BATCH_SIZE = 30;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/* ---------------------------------------------------------------- cadence */

/** Doc 03: diagnosis within 24 h of first contact; follow-ups at 2, 5 and 7 days after the diagnosis. */
export const CADENCE = { diagnosisWithinMs: 24 * HOUR, followUpDays: [2, 5, 7] } as const;

export type Moment = 'primerContacto' | 'envioDiagnostico' | 'seguimiento1' | 'seguimiento2' | 'seguimiento3' | 'propuesta';
export const MOMENT_LABEL: Record<Moment, string> = {
  primerContacto: 'Primer contacto',
  envioDiagnostico: 'Envío del diagnóstico',
  seguimiento1: 'Seguimiento 1 (2 días)',
  seguimiento2: 'Seguimiento 2 (5 días)',
  seguimiento3: 'Seguimiento 3 (7 días, último)',
  propuesta: 'Propuesta (mismo día)',
};
export const FOLLOW_UP_MOMENTS: Moment[] = ['seguimiento1', 'seguimiento2', 'seguimiento3'];

export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'blocked' | 'done';

export interface NextAction {
  moment: Moment | null;
  dueAt: number | null;
  urgency: Urgency;
  label: string;
}

const t = (iso?: string) => (iso ? Date.parse(iso) : NaN);
const firstValid = (...xs: number[]) => xs.find((x) => Number.isFinite(x)) ?? Date.now();

function endOfDay(ms: number): number {
  const d = new Date(ms); d.setHours(23, 59, 59, 999); return d.getTime();
}
function sameDay(a: number, b: number) {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
function humanSpan(ms: number): string {
  const abs = Math.abs(ms);
  // non-breaking spaces: "4 h" never splits across lines in a narrow badge
  if (abs < HOUR) return `${Math.max(1, Math.round(abs / 60000))}\u00a0min`;
  if (abs < 2 * DAY) return `${Math.round(abs / HOUR)}\u00a0h`;
  return `${Math.round(abs / DAY)}\u00a0días`;
}

function urgencyFor(dueAt: number, now: number): Urgency {
  if (dueAt < now && !sameDay(dueAt, now)) return 'overdue';
  if (sameDay(dueAt, now) || dueAt < now) return 'today';
  if (dueAt - now < 2 * DAY) return 'soon';
  return 'later';
}

/** What the team owes this business next, when, and how urgent. */
export function nextAction(p: ProspectItem, now = Date.now()): NextAction {
  if (p.optedOut) return { moment: null, dueAt: null, urgency: 'blocked', label: 'No contactar: pidió no recibir mensajes' };

  switch (p.stage) {
    case 'CLOSED':
      return { moment: null, dueAt: null, urgency: 'done', label: 'Cliente cerrado' };

    case 'LISTED': {
      const due = firstValid(t(p.createdAt));
      return { moment: 'primerContacto', dueAt: due, urgency: urgencyFor(due, now), label: 'Toca primer contacto' };
    }

    case 'CONTACTED': {
      const due = firstValid(t(p.contactedAt), t(p.lastContactedAt), t(p.createdAt)) + CADENCE.diagnosisWithinMs;
      const left = due - now;
      return {
        moment: 'envioDiagnostico', dueAt: due,
        urgency: left < 0 ? 'overdue' : left < 6 * HOUR ? 'today' : 'soon',
        label: left < 0 ? `Diagnóstico vencido hace ${humanSpan(left)}` : `Diagnóstico vence en ${humanSpan(left)}`,
      };
    }

    case 'MET': {
      const met = firstValid(t(p.metAt), t(p.lastContactedAt), t(p.createdAt));
      const due = endOfDay(met);
      return { moment: 'propuesta', dueAt: due, urgency: urgencyFor(due, now), label: due < now ? 'Propuesta atrasada' : 'Mandar propuesta hoy' };
    }

    case 'DIAGNOSED':
    case 'FOLLOW_UP': {
      const sent = Math.min(p.followUpCount, MAX_FOLLOW_UPS);
      if (sent >= MAX_FOLLOW_UPS) {
        return { moment: null, dueAt: null, urgency: 'blocked', label: `Bloqueado por TCPA: ${sent}/${MAX_FOLLOW_UPS} enviados` };
      }
      const anchor = firstValid(t(p.diagnosedAt), t(p.lastContactedAt), t(p.createdAt));
      const due = anchor + CADENCE.followUpDays[sent] * DAY;
      const u = urgencyFor(due, now);
      const n = sent + 1;
      const label =
        u === 'overdue' ? `Seguimiento ${n} atrasado ${humanSpan(now - due)}`
        : u === 'today' ? 'Toca seguimiento hoy'
        : `Seguimiento ${n} en ${humanSpan(due - now)}`;
      return { moment: FOLLOW_UP_MOMENTS[sent], dueAt: due, urgency: u, label };
    }
  }
}

const URGENCY_RANK: Record<Urgency, number> = { overdue: 0, today: 1, soon: 2, later: 3, blocked: 4, done: 5 };
/** Work queue order: overdue first, then due today, then by due time. */
export function byUrgency(a: ProspectItem, b: ProspectItem, now = Date.now()): number {
  const x = nextAction(a, now), y = nextAction(b, now);
  return URGENCY_RANK[x.urgency] - URGENCY_RANK[y.urgency] || (x.dueAt ?? Infinity) - (y.dueAt ?? Infinity);
}

/** Whether a message for this moment may be sent at all (TCPA: max 3 follow-ups, never after opt-out). */
export function canSend(p: ProspectItem, moment: Moment): { ok: boolean; reason?: string } {
  if (p.optedOut) return { ok: false, reason: 'El negocio pidió no recibir mensajes.' };
  if (FOLLOW_UP_MOMENTS.includes(moment) && p.followUpCount >= MAX_FOLLOW_UPS) {
    return { ok: false, reason: `Límite TCPA: ya se enviaron ${MAX_FOLLOW_UPS} seguimientos.` };
  }
  return { ok: true };
}

/* ---------------------------------------------------------------- scripts */

/** What is missing, phrased two ways: as a predicate ("Vi que X ...") and as a noun ("arreglar ..."). */
const MISSING: Partial<Record<SignalKey, { predicate: string; noun: string }>> = {
  scoreBooking: { predicate: 'no tiene botón para reservar', noun: 'el botón para reservar' },
  scoreHours: { predicate: 'sale sin el horario completo', noun: 'el horario' },
  scorePhotos: { predicate: 'sale con pocas fotos', noun: 'las fotos' },
  scoreWebsite: { predicate: 'no tiene página web', noun: 'la página web' },
  scoreReviews: { predicate: 'tiene pocas reseñas recientes', noun: 'las reseñas' },
  scoreReviewResponse: { predicate: 'tiene reseñas sin responder', noun: 'las respuestas a las reseñas' },
  scoreDescription: { predicate: 'sale sin descripción ni servicios', noun: 'la descripción y los servicios' },
};
/** Priority of what to mention first: what blocks a customer from contacting them comes first. */
const MISSING_ORDER: SignalKey[] = ['scoreBooking', 'scoreHours', 'scorePhotos', 'scoreWebsite', 'scoreReviews', 'scoreReviewResponse', 'scoreDescription'];

export function topMissing(p: Pick<ProspectItem, 'signals'>): { predicate: string; noun: string } | null {
  const key = MISSING_ORDER.find((k) => p.signals?.[k]);
  return key ? MISSING[key]! : null;
}

const firstName = (full?: string) => (full || '').trim().split(/\s+/)[0] || undefined;
const kind = (category: string) => category.split('/')[0].trim().toLowerCase();

/** The official Doc 03 script for a moment, filled in with this business's data. */
export function buildScript(p: ProspectItem, moment: Moment): string {
  const nombre = firstName(p.ownerName);
  const miss = topMissing(p);
  const S = OFFICIAL_SCRIPTS;
  switch (moment) {
    case 'primerContacto': return S.primerContacto({ nombre, negocio: p.businessName, queLeFalta: miss?.predicate });
    case 'envioDiagnostico': return S.envioDiagnostico({ nombre });
    case 'seguimiento1': return S.seguimiento1({ nombre, punto1: miss?.noun });
    case 'seguimiento2': return S.seguimiento2({ nombre, tipoDeNegocio: kind(p.category) });
    case 'seguimiento3': return S.seguimiento3({ nombre, negocio: p.businessName });
    case 'propuesta': return S.propuesta({ nombre });
  }
}

/* ---------------------------------------------------------------- contact links */

/** US numbers to E.164 digits ("(432) 555-0144" -> "14325550144"). Null when it is not a valid number. */
export function phoneDigits(raw: string): string | null {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 10) return '1' + d;
  if (d.length === 11 && d.startsWith('1')) return d;
  return null;
}

export function contactLinks(phone: string, text: string): { whatsapp: string; sms: string; call: string } | null {
  const d = phoneDigits(phone);
  if (!d) return null;
  const body = encodeURIComponent(text);
  return {
    whatsapp: `https://wa.me/${d}?text=${body}`,
    sms: `sms:+${d}?&body=${body}`, // "?&body=" works on both iOS and Android
    call: `tel:+${d}`,
  };
}

/* ---------------------------------------------------------------- funnel */

/** How far along each stage is. FOLLOW_UP sits with DIAGNOSED: the diagnosis went out, no meeting yet. */
const RANK: Record<Stage, number> = { LISTED: 0, CONTACTED: 1, DIAGNOSED: 2, FOLLOW_UP: 2, MET: 3, CLOSED: 4 };
export const FUNNEL_STEPS = ['Listados', 'Contactados', 'Diagnóstico', 'Reunión', 'Cerrados'] as const;

export function funnel(list: ProspectItem[]): { step: string; reached: number; pctFromPrev: number | null }[] {
  return FUNNEL_STEPS.map((step, i) => {
    const reached = list.filter((p) => RANK[p.stage] >= i).length;
    const prev = i === 0 ? null : list.filter((p) => RANK[p.stage] >= i - 1).length;
    return { step, reached, pctFromPrev: prev === null ? null : prev === 0 ? 0 : Math.round((reached / prev) * 100) };
  });
}

/* ---------------------------------------------------------------- commissions */

export interface CommissionLine { id: string; businessName: string; clientNumber: number; founder: boolean; source: ProspectItem['source']; barbara: number; carlos: number; luis: number; fund: number }

/**
 * Every closed client in close order, run through the official waterfall (finance.ts):
 * founders (#1-2) $250, then $500; Bárbara $25 on #1-5 and $15 on #6-30 for leads she opened,
 * $0 on referrals and Luis's own leads, cut off at the $500 cap.
 */
export function commissionLedger(all: ProspectItem[]): { lines: CommissionLine[]; barbaraTotal: number; cap: number } {
  const closed = all
    .filter((p) => p.stage === 'CLOSED')
    .sort((a, b) => firstValid(t(a.closedAt), t(a.createdAt)) - firstValid(t(b.closedAt), t(b.createdAt)));
  let barbaraTotal = 0;
  const lines = closed.map((p, i) => {
    const n = i + 1;
    const w = calculateSetupWaterfall(n, n <= 2, p.source === 'BARBARA', barbaraTotal);
    barbaraTotal += w.barbaraCommission;
    return { id: p.id, businessName: p.businessName, clientNumber: n, founder: n <= 2, source: p.source, barbara: w.barbaraCommission, carlos: w.carlosShare, luis: w.luisShare, fund: w.businessFund8pct };
  });
  return { lines, barbaraTotal, cap: 500 };
}

/**
 * Batch projection without invented conversion rates: what the batch has already closed, and what it
 * would add if every business now at the meeting stage signed (as the next client numbers).
 */
export function batchProjection(all: ProspectItem[], batch: number) {
  const ledger = commissionLedger(all);
  const inBatch = new Set(all.filter((p) => p.batchNumber === batch).map((p) => p.id));
  const closed = ledger.lines.filter((l) => inBatch.has(l.id));
  const sum = (ls: { carlos: number; luis: number; barbara: number }[]) => ({
    carlos: round2(ls.reduce((s, l) => s + l.carlos, 0)),
    luis: round2(ls.reduce((s, l) => s + l.luis, 0)),
    barbara: round2(ls.reduce((s, l) => s + l.barbara, 0)),
  });
  const atMeeting = all.filter((p) => p.batchNumber === batch && p.stage === 'MET' && !p.optedOut);
  let barbaraRun = ledger.barbaraTotal;
  let n = ledger.lines.length;
  const ifClosed = atMeeting.map((p) => {
    n++;
    const w = calculateSetupWaterfall(n, n <= 2, p.source === 'BARBARA', barbaraRun);
    barbaraRun += w.barbaraCommission;
    return { carlos: w.carlosShare, luis: w.luisShare, barbara: w.barbaraCommission };
  });
  return { closedCount: closed.length, closed: sum(closed), meetingCount: atMeeting.length, ifMeetingsClose: sum(ifClosed) };
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/* ---------------------------------------------------------------- CSV */

export const CSV_COLUMNS = ['negocio', 'dueño', 'teléfono', 'ciudad', 'giro', 'dirección', 'origen', 'lote'] as const;

/** Quote a cell, and neutralize spreadsheet formulas (=, +, -, @, tab, CR) so a business name cannot run code in Excel. */
export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(list: ProspectItem[], now = Date.now()): string {
  const head = ['id', ...CSV_COLUMNS, 'etapa', 'prioridad', 'puntaje', 'seguimientos', 'siguiente_paso', 'no_contactar'];
  const rows = list.map((p) => {
    const na = nextAction(p, now);
    return [p.id, p.businessName, p.ownerName ?? '', p.phone, p.city, p.category, p.address ?? '', p.source, p.batchNumber,
      p.stage, p.priority, p.totalScore, p.followUpCount, na.label, p.optedOut ? 'sí' : 'no'].map(csvCell).join(',');
  });
  return '﻿' + [head.map(csvCell).join(','), ...rows].join('\r\n');
}

/** RFC 4180 parser: quoted fields, escaped quotes, commas and newlines inside quotes, ; or , delimiter. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], field = '', q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const HEADER_ALIASES: Record<string, (typeof CSV_COLUMNS)[number]> = {
  negocio: 'negocio', business: 'negocio', businessname: 'negocio', nombre: 'negocio',
  dueno: 'dueño', owner: 'dueño', ownername: 'dueño', contacto: 'dueño',
  telefono: 'teléfono', phone: 'teléfono', tel: 'teléfono', celular: 'teléfono',
  ciudad: 'ciudad', city: 'ciudad',
  giro: 'giro', categoria: 'giro', category: 'giro', tipo: 'giro',
  direccion: 'dirección', address: 'dirección',
  origen: 'origen', source: 'origen', fuente: 'origen',
  lote: 'lote', batch: 'lote',
};

export interface ImportRow { businessName: string; ownerName?: string; phone: string; city: 'Midland' | 'Odessa'; category: string; address?: string; source: ProspectItem['source']; batchNumber: number }

/** Map a parsed CSV to prospects, reporting every row it cannot use instead of guessing. */
export function rowsFromCsv(text: string, defaultBatch: number): { rows: ImportRow[]; errors: { line: number; error: string }[] } {
  const table = parseCsv(text);
  const errors: { line: number; error: string }[] = [];
  if (table.length < 2) return { rows: [], errors: [{ line: 1, error: 'El archivo no tiene filas de datos.' }] };
  const map = table[0].map((h) => HEADER_ALIASES[norm(h)]);
  if (!map.includes('negocio') || !map.includes('teléfono')) {
    return { rows: [], errors: [{ line: 1, error: 'Faltan las columnas "negocio" y "teléfono" en el encabezado.' }] };
  }
  const rows: ImportRow[] = [];
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (k: (typeof CSV_COLUMNS)[number]) => (cells[map.indexOf(k)] ?? '').trim().replace(/^'(?=[=+\-@])/, '');
    const businessName = get('negocio').slice(0, 100);
    const phone = get('teléfono').slice(0, 20);
    if (businessName.length < 2) return errors.push({ line, error: 'Falta el nombre del negocio.' });
    if (!phoneDigits(phone)) return errors.push({ line, error: `Teléfono no válido: "${phone}".` });
    const cityRaw = norm(get('ciudad'));
    const city = cityRaw.startsWith('odes') ? 'Odessa' : cityRaw === '' || cityRaw.startsWith('mid') ? 'Midland' : null;
    if (!city) return errors.push({ line, error: `Ciudad fuera de Midland-Odessa: "${get('ciudad')}".` });
    const src = norm(get('origen'));
    const source: ProspectItem['source'] = src.startsWith('lui') ? 'LUIS' : src.startsWith('ref') ? 'REFERRAL' : 'BARBARA';
    const lote = parseInt(get('lote'), 10);
    const batchNumber = Number.isInteger(lote) && lote >= 1 && lote <= 5 ? lote : defaultBatch;
    rows.push({ businessName, ownerName: get('dueño').slice(0, 80) || undefined, phone, city, category: get('giro').slice(0, 60) || 'Servicios Locales', address: get('dirección').slice(0, 120) || undefined, source, batchNumber });
  });
  return { rows, errors };
}
