import { describe, it, expect } from 'vitest';
import type { ProspectItem } from '../src/lib/crm';
import {
  nextAction, canSend, buildScript, contactLinks, phoneDigits, funnel, commissionLedger, batchProjection,
  csvCell, toCsv, parseCsv, rowsFromCsv, byUrgency,
} from '../src/lib/crm-engine';

const H = 3_600_000, D = 24 * H;
const NOW = Date.parse('2026-11-10T15:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const NO = { scoreReviews: false, scoreWebsite: false, scorePhotos: false, scoreHours: false, scoreDescription: false, scoreReviewResponse: false, scoreBooking: false, scoreSpanish: false };

let n = 0;
function lead(over: Partial<ProspectItem> = {}): ProspectItem {
  n++;
  return {
    id: `l${n}`, batchNumber: 1, businessName: `Negocio ${n}`, ownerName: 'José Ramírez', phone: '(432) 555-0144', city: 'Midland',
    category: 'Barbería', stage: 'LISTED', source: 'BARBARA', signals: { ...NO }, totalScore: 0, priority: 'DISCARD',
    followUpCount: 0, createdAt: iso(NOW - 10 * D), ...over,
  };
}

describe('Cadence engine and TCPA clock (Doc 03)', () => {
  it('LISTED: first contact is due', () => {
    expect(nextAction(lead(), NOW).label).toBe('Toca primer contacto');
  });
  it('CONTACTED: diagnosis due 24 h after contact, then overdue', () => {
    expect(nextAction(lead({ stage: 'CONTACTED', contactedAt: iso(NOW - 20 * H) }), NOW).label).toBe('Diagnóstico vence en 4\u00a0h');
    const late = nextAction(lead({ stage: 'CONTACTED', contactedAt: iso(NOW - 30 * H) }), NOW);
    expect(late.urgency).toBe('overdue');
    expect(late.label).toMatch(/^Diagnóstico vencido hace/);
  });
  it('DIAGNOSED: follow-ups at 2, 5 and 7 days after the diagnosis', () => {
    const at = (days: number, sent: number) => nextAction(lead({ stage: 'DIAGNOSED', diagnosedAt: iso(NOW - days * D), followUpCount: sent }), NOW);
    expect(at(2, 0)).toMatchObject({ moment: 'seguimiento1', label: 'Toca seguimiento hoy' });
    expect(at(1, 0)).toMatchObject({ moment: 'seguimiento1', urgency: 'soon' });
    expect(at(5, 1)).toMatchObject({ moment: 'seguimiento2', label: 'Toca seguimiento hoy' });
    expect(at(7, 2)).toMatchObject({ moment: 'seguimiento3', label: 'Toca seguimiento hoy' });
    expect(at(9, 2).urgency).toBe('overdue');
  });
  it('3 follow-ups sent: blocked by TCPA, and no message can be sent', () => {
    const p = lead({ stage: 'FOLLOW_UP', diagnosedAt: iso(NOW - 20 * D), followUpCount: 3 });
    expect(nextAction(p, NOW)).toMatchObject({ urgency: 'blocked', label: 'Bloqueado por TCPA: 3/3 enviados' });
    expect(canSend(p, 'seguimiento3').ok).toBe(false);
  });
  it('opt-out blocks everything, at any stage', () => {
    const p = lead({ stage: 'CONTACTED', optedOut: true });
    expect(nextAction(p, NOW).urgency).toBe('blocked');
    expect(canSend(p, 'primerContacto').ok).toBe(false);
    expect(canSend(p, 'propuesta').ok).toBe(false);
  });
  it('MET: proposal is due the same day; CLOSED needs nothing', () => {
    expect(nextAction(lead({ stage: 'MET', metAt: iso(NOW - H) }), NOW).label).toBe('Mandar propuesta hoy');
    expect(nextAction(lead({ stage: 'CLOSED' }), NOW).urgency).toBe('done');
  });
  it('work queue puts overdue first', () => {
    const late = lead({ stage: 'CONTACTED', contactedAt: iso(NOW - 40 * H) });
    const fresh = lead({ stage: 'DIAGNOSED', diagnosedAt: iso(NOW - H) });
    expect([fresh, late].sort((a, b) => byUrgency(a, b, NOW))[0]).toBe(late);
  });
});

describe('Scripts and one-tap launcher', () => {
  it('interpolates name, business, type and the #1 missing item', () => {
    const p = lead({ businessName: 'Barbería La Frontera', signals: { ...NO, scoreBooking: true, scorePhotos: true } });
    const first = buildScript(p, 'primerContacto');
    expect(first).toContain('Hola José');
    expect(first).toContain('Barbería La Frontera no tiene botón para reservar');
    expect(buildScript(p, 'seguimiento1')).toContain('arreglar es el botón para reservar');
    expect(buildScript(p, 'seguimiento2')).toContain('buscamos otra vez barbería');
    expect(buildScript(p, 'seguimiento3')).toContain('no le molestamos más');
  });
  it('builds wa.me, sms and tel links with the message pre-loaded', () => {
    const l = contactLinks('(432) 555-0144', 'Hola José & cía')!;
    expect(l.whatsapp).toBe('https://wa.me/14325550144?text=Hola%20Jos%C3%A9%20%26%20c%C3%ADa');
    expect(l.sms.startsWith('sms:+14325550144?&body=')).toBe(true);
    expect(l.call).toBe('tel:+14325550144');
  });
  it('rejects numbers that are not US numbers', () => {
    expect(phoneDigits('555-0144')).toBeNull();
    expect(contactLinks('12', 'x')).toBeNull();
    expect(phoneDigits('+1 432 555 0144')).toBe('14325550144');
  });
});

describe('Funnel, commissions and projection', () => {
  it('funnel counts how many reached each step and the % from the previous one', () => {
    const list = [lead(), lead({ stage: 'CONTACTED' }), lead({ stage: 'DIAGNOSED' }), lead({ stage: 'FOLLOW_UP' }), lead({ stage: 'MET' }), lead({ stage: 'CLOSED' })];
    const f = funnel(list);
    expect(f.map((s) => s.reached)).toEqual([6, 5, 4, 2, 1]);
    expect(f[1].pctFromPrev).toBe(83);
    expect(f[4].pctFromPrev).toBe(50);
  });
  it('Bárbara: $25 on clients 1-5, $15 on 6-30, $0 for referrals and Luis, $500 cap', () => {
    const closed = (i: number, source: ProspectItem['source'] = 'BARBARA') => lead({ stage: 'CLOSED', source, closedAt: iso(NOW - (100 - i) * H) });
    const list = [1, 2, 3, 4, 5, 6, 7].map((i) => closed(i));
    list.push(closed(8, 'REFERRAL'), closed(9, 'LUIS'));
    const l = commissionLedger(list);
    expect(l.lines.map((x) => x.barbara)).toEqual([25, 25, 25, 25, 25, 15, 15, 0, 0]);
    expect(l.lines[0].founder && l.lines[1].founder && !l.lines[2].founder).toBe(true);
    expect(l.barbaraTotal).toBe(155);
    const many = Array.from({ length: 40 }, (_, i) => closed(i));
    expect(commissionLedger(many).barbaraTotal).toBe(500);
  });
  it('projection: closed so far plus what meetings would add, no invented rates', () => {
    const list = [lead({ stage: 'CLOSED', closedAt: iso(NOW - D) }), lead({ stage: 'MET' }), lead({ stage: 'MET', optedOut: true })];
    const p = batchProjection(list, 1);
    expect(p.closedCount).toBe(1);
    expect(p.meetingCount).toBe(1);
    expect(p.closed.luis).toBeGreaterThan(0);
    expect(p.ifMeetingsClose.luis).toBeGreaterThan(0);
  });
});

describe('CSV import and export', () => {
  it('neutralizes spreadsheet formulas on export', () => {
    expect(csvCell('=HYPERLINK("http://evil","x")')).toBe(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(csvCell('+1 432')).toBe(`"'+1 432"`);
    expect(csvCell('Tacos & Más')).toBe('"Tacos & Más"');
    expect(toCsv([lead({ businessName: '@SUM(A1)' })], NOW)).toContain(`"'@SUM(A1)"`);
  });
  it('parses quotes, commas and newlines inside fields, and ; delimiters', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"']]);
    expect(parseCsv('a;b\r\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a\n"line1\nline2"')).toEqual([['a'], ['line1\nline2']]);
  });
  it('maps Spanish or English headers and reports bad rows instead of guessing', () => {
    const csv = 'Negocio,Dueño,Teléfono,Ciudad,Giro,Origen,Lote\n' +
      'Barbería El Rey,Ramiro,(432) 555-0101,Midland,Barbería,Bárbara,2\n' +
      'Taller Sin Tel,,123,Odessa,Taller,Luis,\n' +
      'Lejos,,(432) 555-0102,Austin,Taller,,\n' +
      'Taquería Los Compadres,,432-555-0103,odessa,Taquería,referido,\n';
    const r = rowsFromCsv(csv, 3);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({ businessName: 'Barbería El Rey', city: 'Midland', source: 'BARBARA', batchNumber: 2 });
    expect(r.rows[1]).toMatchObject({ city: 'Odessa', source: 'REFERRAL', batchNumber: 3 });
    expect(r.errors.map((e) => e.line)).toEqual([3, 4]);
    expect(rowsFromCsv('nombre_raro\nx', 1).errors[0].error).toMatch(/negocio/);
  });
});
