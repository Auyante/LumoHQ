import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  canSign, expenseStatus, partnerFor, needsDualApproval, DEFAULT_PARTNER_EMAILS,
  type Trip, type Expense, type City, type ExpenseCategory,
} from './ledger-engine';

/**
 * Server-side IRS ledger store (data/ledger.json, owner-only file). Signatures come from the session,
 * never from the browser, so one person cannot sign as both partners.
 * Before deploying to serverless, move this to the database: the data folder is not durable there.
 */

const FILE = path.join(process.cwd(), 'data', 'ledger.json');
const MAX_ROWS = 5000;

interface Book { trips: Trip[]; expenses: Expense[] }

const SEED: Book = {
  trips: [
    { id: 'trip_seed_1', date: '2026-11-03', client: 'Panadería San Juan', purpose: 'Entrega del kit de reseñas QR y capacitación', city: 'Midland', miles: 15, createdBy: 'Luis Barbera', createdAt: '2026-11-03T18:00:00Z' },
    { id: 'trip_seed_2', date: '2026-11-05', client: 'Barbería El Rey', purpose: 'Reunión de 15 minutos y firma del anticipo', city: 'Midland', miles: 10, createdBy: 'Luis Barbera', createdAt: '2026-11-05T18:00:00Z' },
    { id: 'trip_seed_3', date: '2026-11-06', client: 'Plomería Hermanos Vega', purpose: 'Diagnóstico presencial del perfil de Google', city: 'Odessa', miles: 25, createdBy: 'Luis Barbera', createdAt: '2026-11-06T18:00:00Z' },
  ],
  expenses: [
    { id: 'exp_seed_1', date: '2026-11-02', concept: 'Stickers QR de reseñas (lote de 50)', category: 'Materiales (QR, stickers)', amount: 42, createdBy: 'Luis Barbera', createdAt: '2026-11-02T18:00:00Z', signatures: {} },
    { id: 'exp_seed_2', date: '2026-11-07', concept: 'Plan anual de herramienta de reseñas', category: 'Herramientas y software', amount: 180, createdBy: 'Carlos Gómez', createdAt: '2026-11-07T18:00:00Z', signatures: { carlos: { by: 'Carlos Gómez', at: '2026-11-07T18:00:00Z' } } },
  ],
};

let cache: Book | null = null;

function load(): Book {
  if (cache) return cache;
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (Array.isArray(raw?.trips) && Array.isArray(raw?.expenses)) cache = raw as Book;
  } catch { /* first run */ }
  if (!cache) cache = structuredClone(SEED);
  return cache;
}

function save(b: Book) {
  cache = b;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(b, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, FILE);
}

const id = (p: string) => `${p}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
const byDateDesc = <T extends { date: string; createdAt: string }>(a: T, b: T) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export interface Actor { name: string; role: string; email: string }

/** Partner emails can be changed without code: LEDGER_LUIS_EMAIL / LEDGER_CARLOS_EMAIL. */
const PARTNER_EMAILS = {
  luis: process.env.LEDGER_LUIS_EMAIL || DEFAULT_PARTNER_EMAILS.luis,
  carlos: process.env.LEDGER_CARLOS_EMAIL || DEFAULT_PARTNER_EMAILS.carlos,
};
export const partnerOf = (a: Pick<Actor, 'role' | 'email'>) => partnerFor(a.role, a.email, PARTNER_EMAILS);

export type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

export const ledgerStore = {
  all(): Book {
    const b = load();
    return { trips: [...b.trips].sort(byDateDesc), expenses: [...b.expenses].sort(byDateDesc) };
  },

  addTrip(input: { date: string; client: string; purpose: string; city: City; miles: number }, actor: Actor): Result<Trip> {
    const b = load();
    if (b.trips.length >= MAX_ROWS) return { ok: false, status: 409, error: 'La bitácora está llena.' };
    const trip: Trip = { id: id('trip'), ...input, createdBy: actor.name, createdAt: new Date().toISOString() };
    save({ ...b, trips: [trip, ...b.trips] });
    return { ok: true, value: trip };
  },

  removeTrip(tripId: string): Result<Trip> {
    const b = load();
    const t = b.trips.find((x) => x.id === tripId);
    if (!t) return { ok: false, status: 404, error: 'No existe ese viaje.' };
    save({ ...b, trips: b.trips.filter((x) => x.id !== tripId) });
    return { ok: true, value: t };
  },

  addExpense(input: { date: string; concept: string; category: ExpenseCategory; amount: number }, actor: Actor): Result<Expense> {
    const b = load();
    if (b.expenses.length >= MAX_ROWS) return { ok: false, status: 409, error: 'El registro está lleno.' };
    const now = new Date().toISOString();
    const partner = partnerOf(actor);
    // Whoever registers a big expense signs it as theirs; the other partner still has to sign.
    const signatures = partner && needsDualApproval(input.amount) ? { [partner]: { by: actor.name, at: now } } : {};
    const exp: Expense = { id: id('exp'), ...input, createdBy: actor.name, createdAt: now, signatures };
    save({ ...b, expenses: [exp, ...b.expenses] });
    return { ok: true, value: exp };
  },

  sign(expenseId: string, actor: Actor): Result<Expense> {
    const b = load();
    const e = b.expenses.find((x) => x.id === expenseId);
    if (!e) return { ok: false, status: 404, error: 'No existe ese gasto.' };
    const partner = partnerOf(actor);
    const check = canSign(e, partner);
    if (!check.ok) return { ok: false, status: partner ? 409 : 403, error: check.reason };
    const next: Expense = { ...e, signatures: { ...e.signatures, [partner!]: { by: actor.name, at: new Date().toISOString() } } };
    save({ ...b, expenses: b.expenses.map((x) => (x.id === e.id ? next : x)) });
    return { ok: true, value: next };
  },

  reject(expenseId: string, actor: Actor): Result<Expense> {
    const b = load();
    const e = b.expenses.find((x) => x.id === expenseId);
    if (!e) return { ok: false, status: 404, error: 'No existe ese gasto.' };
    const partner = partnerOf(actor);
    if (!partner) return { ok: false, status: 403, error: 'Solo Luis o Carlos pueden rechazar gastos.' };
    if (expenseStatus(e) !== 'PENDIENTE') return { ok: false, status: 409, error: 'Solo se rechazan gastos pendientes de firma.' };
    const next: Expense = { ...e, rejected: { by: actor.name, at: new Date().toISOString(), partner } };
    save({ ...b, expenses: b.expenses.map((x) => (x.id === e.id ? next : x)) });
    return { ok: true, value: next };
  },

  /** Test hook: forget the in-memory copy so the file is read again. */
  _reload() { cache = null; },
};
