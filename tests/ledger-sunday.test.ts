import { describe, it, expect } from 'vitest';
import {
  mileageDeduction, expenseStatus, canSign, missingSignatures, partnerFor, ledgerTotals, ledgerCsv, deductiblePart,
  type Expense, type Trip,
} from '../src/lib/ledger-engine';
import { evaluateRisk1Alert, metricsFromFunnel, progressPct, mondayOf } from '../src/lib/sunday-dashboard';
import { canAccessRoute } from '../src/lib/route-policy';

const trip = (miles: number, date = '2026-11-03', client = 'Barbería El Rey'): Trip =>
  ({ id: `t${miles}${date}`, date, client, purpose: '', city: 'Midland', miles, createdBy: 'Luis', createdAt: date });
const exp = (amount: number, over: Partial<Expense> = {}): Expense =>
  ({ id: `e${amount}`, date: '2026-11-04', concept: 'Stickers', category: 'Materiales (QR, stickers)', amount, createdBy: 'Luis', createdAt: '', signatures: {}, ...over });
const sig = { by: 'x', at: '' };

describe('IRS Schedule C ledger', () => {
  it('mileage at $0.67 per mile, to the cent', () => {
    expect(mileageDeduction(10)).toBe(6.7);
    expect(mileageDeduction(15)).toBe(10.05);
    expect(mileageDeduction(25)).toBe(16.75);
    expect(mileageDeduction(12.3)).toBe(8.24);
  });

  it('$100 or less is approved at once; over $100 needs Luis and Carlos', () => {
    expect(expenseStatus(exp(100))).toBe('APROBADO');
    expect(expenseStatus(exp(100.01))).toBe('PENDIENTE');
    expect(expenseStatus(exp(180, { signatures: { luis: sig } }))).toBe('PENDIENTE');
    expect(missingSignatures(exp(180, { signatures: { luis: sig } }))).toEqual(['carlos']);
    expect(expenseStatus(exp(180, { signatures: { luis: sig, carlos: sig } }))).toBe('APROBADO');
    expect(expenseStatus(exp(180, { rejected: { ...sig, partner: 'carlos' } }))).toBe('RECHAZADO');
  });

  it('only the two partners sign, each once; super admin and sales cannot', () => {
    expect(partnerFor('ADMIN_LUIS')).toBe('luis');
    expect(partnerFor('ADMIN_CARLOS')).toBe('carlos');
    expect(partnerFor('SUPER_ADMIN')).toBeNull();
    expect(partnerFor('SUPER_ADMIN', 'Carlos@LumoHQ.com')).toBe('carlos');
    expect(partnerFor('SALES_BARBARA', 'carlos@lumohq.com')).toBeNull();
    expect(partnerFor('ADMIN_LUIS', 'carlos@lumohq.com')).toBe('carlos');
    expect(partnerFor('SALES_BARBARA')).toBeNull();
    const e = exp(250, { signatures: { luis: sig } });
    expect(canSign(e, 'luis').ok).toBe(false);
    expect(canSign(e, 'carlos').ok).toBe(true);
    expect(canSign(e, null).ok).toBe(false);
    expect(canSign(exp(50), 'carlos').ok).toBe(false);
  });

  it('totals count only approved expenses; meals at 50%; tax saving ~25%', () => {
    const t = ledgerTotals(
      [trip(10), trip(15), trip(100, '2025-12-30')],
      [exp(40), exp(200), exp(300, { signatures: { luis: sig, carlos: sig } }), exp(60, { category: 'Comidas de negocio (50%)' })],
      2026,
    );
    expect(t.miles).toBe(25);
    expect(t.mileageDeduction).toBe(16.75);
    expect(deductiblePart(exp(60, { category: 'Comidas de negocio (50%)' }))).toBe(30);
    expect(t.approvedExpenses).toBe(370);
    expect(t.pendingExpenses).toBe(200);
    expect(t.totalDeductible).toBe(386.75);
    expect(t.estimatedTaxSaving).toBe(96.69);
  });

  it('CSV for the accountant: formula-safe, pending expenses deduct $0', () => {
    const csv = ledgerCsv([trip(10, '2026-11-03', '=HYPERLINK("http://x")')], [exp(200)]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csv).toContain('"6.70"');
    expect(csv).toMatch(/"Gasto".*"200\.00","0\.00","Pendiente de firma"/);
  });
});

describe('Sunday board', () => {
  it('risk #1 fires under 18 h or under 10 contacts', () => {
    expect(evaluateRisk1Alert({ weekNumber: 1, luisHours: 9, carlosHours: 8, barbaraHours: 1, contactsThisWeek: 12 }).isAlertActive).toBe(false);
    const low = evaluateRisk1Alert({ weekNumber: 1, luisHours: 5, carlosHours: 5, barbaraHours: 2, contactsThisWeek: 4 });
    expect(low.isAlertActive).toBe(true);
    expect(low.reasons).toHaveLength(2);
  });
  it('progress is capped 0-100 and a $0 target counts as met', () => {
    expect(progressPct(12, 10)).toBe(100);
    expect(progressPct(5, 10)).toBe(50);
    expect(progressPct(0, 0)).toBe(100);
  });
  it('CRM funnel becomes the week metrics, MRR at $100 per client', () => {
    expect(metricsFromFunnel([30, 20, 9, 4, 2])).toEqual({ contacts: 20, diagnoses: 9, meetings: 4, closedClients: 2, mrr: 200 });
  });
  it('weeks start on Monday', () => {
    expect(mondayOf(new Date(2026, 10, 15))).toBe('2026-11-09'); // Sunday
    expect(mondayOf(new Date(2026, 10, 9))).toBe('2026-11-09');
  });
});

describe('Route policy shared by middleware and menu', () => {
  it('developer reads the Sunday board API but not the ledger; Bárbara gets neither', () => {
    expect(canAccessRoute('DEVELOPER', '/api/admin/sunday')).toBe(true);
    expect(canAccessRoute('DEVELOPER', '/api/admin/ledger')).toBe(false);
    expect(canAccessRoute('SALES_BARBARA', '/api/admin/sunday')).toBe(false);
    expect(canAccessRoute('SALES_BARBARA', '/admin/finanzas')).toBe(false);
    expect(canAccessRoute('ADMIN_CARLOS', '/api/admin/ledger')).toBe(true);
  });
});
