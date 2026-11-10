/**
 * IRS Schedule C ledger: business mileage and deductible expenses (pure functions, unit-tested).
 * Rules (Doc 04): mileage at $0.67/mile; any expense over $100 needs both Luis and Carlos to sign;
 * estimated tax saving shown at ~25¢ per deductible dollar. Only approved expenses count.
 */

import { csvCell } from './crm-engine';

export const IRS_MILEAGE_RATE = 0.67;
export const TAX_SAVING_RATE = 0.25;
export const DUAL_APPROVAL_OVER = 100;
export const QUICK_MILES = [10, 15, 25] as const;
export const CITIES = ['Midland', 'Odessa', 'Midland-Odessa'] as const;
export const EXPENSE_CATEGORIES = ['Publicidad', 'Herramientas y software', 'Teléfono e internet', 'Materiales (QR, stickers)', 'Comidas de negocio (50%)', 'Otro'] as const;

export type City = (typeof CITIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type Partner = 'luis' | 'carlos';

export interface Trip {
  id: string;
  date: string;          // YYYY-MM-DD
  client: string;        // client or prospect visited
  purpose: string;
  city: City;
  miles: number;
  createdBy: string;     // user name
  createdAt: string;
}

export interface Signature { by: string; at: string }

export interface Expense {
  id: string;
  date: string;
  concept: string;
  category: ExpenseCategory;
  amount: number;
  createdBy: string;
  createdAt: string;
  signatures: Partial<Record<Partner, Signature>>;
  rejected?: Signature & { partner: Partner };
}

export type ExpenseStatus = 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';

const cents = (n: number) => Math.round(n * 100) / 100;

export const mileageDeduction = (miles: number) => cents(miles * IRS_MILEAGE_RATE);
export const needsDualApproval = (amount: number) => amount > DUAL_APPROVAL_OVER;

/** Meals are 50% deductible under Schedule C; everything else in this list counts in full. */
export const deductiblePart = (e: Pick<Expense, 'amount' | 'category'>) =>
  cents(e.category === 'Comidas de negocio (50%)' ? e.amount * 0.5 : e.amount);

export const DEFAULT_PARTNER_EMAILS: Record<Partner, string> = { luis: 'luis@lumohq.com', carlos: 'carlos@lumohq.com' };
const ADMIN = ['SUPER_ADMIN', 'ADMIN_LUIS', 'ADMIN_CARLOS'];

/**
 * Which partner a signed-in user signs as. The account's email decides (Carlos's account is SUPER_ADMIN);
 * the partner roles are the fallback. Anyone else, including other admins, cannot sign.
 */
export function partnerFor(role: string, email = '', emails: Record<Partner, string> = DEFAULT_PARTNER_EMAILS): Partner | null {
  if (!ADMIN.includes(role)) return null;
  const e = email.trim().toLowerCase();
  if (e && e === emails.luis.toLowerCase()) return 'luis';
  if (e && e === emails.carlos.toLowerCase()) return 'carlos';
  if (role === 'ADMIN_LUIS') return 'luis';
  if (role === 'ADMIN_CARLOS') return 'carlos';
  return null;
}

export function expenseStatus(e: Expense): ExpenseStatus {
  if (e.rejected) return 'RECHAZADO';
  if (!needsDualApproval(e.amount)) return 'APROBADO';
  return e.signatures.luis && e.signatures.carlos ? 'APROBADO' : 'PENDIENTE';
}

/** What is still missing before an expense counts. */
export function missingSignatures(e: Expense): Partner[] {
  if (expenseStatus(e) !== 'PENDIENTE') return [];
  return (['luis', 'carlos'] as const).filter((p) => !e.signatures[p]);
}

export type SignCheck = { ok: true } | { ok: false; reason: string };

export function canSign(e: Expense, partner: Partner | null): SignCheck {
  if (!partner) return { ok: false, reason: 'Solo Luis o Carlos pueden firmar gastos.' };
  if (e.rejected) return { ok: false, reason: 'El gasto fue rechazado.' };
  if (!needsDualApproval(e.amount)) return { ok: false, reason: 'Este gasto no necesita firmas.' };
  if (e.signatures[partner]) return { ok: false, reason: 'Ya firmaste este gasto.' };
  return { ok: true };
}

export interface LedgerTotals {
  miles: number;
  mileageDeduction: number;
  approvedExpenses: number;     // deductible part of approved expenses
  pendingExpenses: number;      // amount waiting for signatures
  totalDeductible: number;
  estimatedTaxSaving: number;
}

export function ledgerTotals(trips: Trip[], expenses: Expense[], year?: number): LedgerTotals {
  const inYear = (d: string) => year === undefined || d.startsWith(String(year));
  const t = trips.filter((x) => inYear(x.date));
  const ex = expenses.filter((x) => inYear(x.date));
  const miles = cents(t.reduce((s, x) => s + x.miles, 0));
  const md = mileageDeduction(miles);
  const approved = cents(ex.filter((x) => expenseStatus(x) === 'APROBADO').reduce((s, x) => s + deductiblePart(x), 0));
  const pending = cents(ex.filter((x) => expenseStatus(x) === 'PENDIENTE').reduce((s, x) => s + x.amount, 0));
  const total = cents(md + approved);
  return { miles, mileageDeduction: md, approvedExpenses: approved, pendingExpenses: pending, totalDeductible: total, estimatedTaxSaving: cents(total * TAX_SAVING_RATE) };
}

const STATUS_LABEL: Record<ExpenseStatus, string> = { APROBADO: 'Aprobado', PENDIENTE: 'Pendiente de firma', RECHAZADO: 'Rechazado' };

/** One CSV for the accountant: trips and expenses, every text cell formula-safe. */
export function ledgerCsv(trips: Trip[], expenses: Expense[]): string {
  const head = ['Tipo', 'Fecha', 'Cliente / Concepto', 'Propósito / Categoría', 'Ciudad', 'Millas', 'Monto USD', 'Deducible USD', 'Estado', 'Firmas', 'Registró'];
  const rows: string[][] = [];
  for (const t of [...trips].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push(['Millaje', t.date, t.client, t.purpose, t.city, String(t.miles), '', mileageDeduction(t.miles).toFixed(2), 'Aprobado', '', t.createdBy].map(csvCell));
  }
  for (const e of [...expenses].sort((a, b) => a.date.localeCompare(b.date))) {
    const st = expenseStatus(e);
    const sig = (['luis', 'carlos'] as const).filter((p) => e.signatures[p]).map((p) => e.signatures[p]!.by).join(' + ');
    rows.push(['Gasto', e.date, e.concept, e.category, '', '', e.amount.toFixed(2), st === 'APROBADO' ? deductiblePart(e).toFixed(2) : '0.00', STATUS_LABEL[st], sig, e.createdBy].map(csvCell));
  }
  const tot = ledgerTotals(trips, expenses);
  rows.push([]);
  rows.push(['Total', '', '', '', '', String(tot.miles), '', tot.totalDeductible.toFixed(2), '', '', ''].map(csvCell));
  return '﻿' + [head.map(csvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n') + '\r\n';
}
