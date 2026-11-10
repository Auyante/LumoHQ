'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Car, Receipt, Download, Trash2, PenLine, X, Loader2 } from 'lucide-react';
import {
  IRS_MILEAGE_RATE, TAX_SAVING_RATE, DUAL_APPROVAL_OVER, QUICK_MILES, CITIES, EXPENSE_CATEGORIES,
  mileageDeduction, needsDualApproval, expenseStatus, missingSignatures, canSign, deductiblePart, ledgerCsv,
  type Trip, type Expense, type LedgerTotals, type Partner, type City, type ExpenseCategory,
} from '@/lib/ledger-engine';

interface Data { trips: Trip[]; expenses: Expense[]; totals: LedgerTotals; me: { partner: Partner | null } }

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const PARTNER_NAME: Record<Partner, string> = { luis: 'Luis', carlos: 'Carlos' };
const CITY_LABEL: Record<City, string> = { Midland: 'Midland', Odessa: 'Odessa', 'Midland-Odessa': 'Las dos' };
const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const inputBase = 'min-h-touch px-3 rounded-xl border border-slate-300 bg-white text-sm text-lumo-noche focus:outline-none focus:ring-2 focus:ring-lumo-ambar';
const input = `${inputBase} w-full`;
const label = 'block text-xs font-bold text-lumo-noche mb-1';

/** IRS Schedule C mileage and expense ledger (server-backed; signatures come from the session). */
export function ScheduleCLedger() {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [prospects, setProspects] = useState<string[]>([]);

  // trip form
  const [tDate, setTDate] = useState(localDay);
  const [tClient, setTClient] = useState('');
  const [tPurpose, setTPurpose] = useState('');
  const [tCity, setTCity] = useState<City>('Midland');
  const [tMiles, setTMiles] = useState('');
  const [tMsg, setTMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // expense form
  const [eDate, setEDate] = useState(localDay);
  const [eConcept, setEConcept] = useState('');
  const [eCategory, setECategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [eAmount, setEAmount] = useState('');
  const [eMsg, setEMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/ledger', { cache: 'no-store' })
      .then(async (r) => (r.ok ? setData(await r.json()) : setLoadError('No se pudo cargar el libro.')))
      .catch(() => setLoadError('No se pudo cargar el libro.'));
    fetch('/api/crm/prospects', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.prospects && setProspects(Array.from(new Set<string>(d.prospects.map((p: { businessName: string }) => p.businessName))).slice(0, 200)))
      .catch(() => { /* suggestions are optional */ });
  }, []);

  async function send(method: 'POST' | 'PATCH' | 'DELETE', body: object, tag: string): Promise<string | null> {
    setBusy(tag);
    try {
      const r = await fetch('/api/admin/ledger', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return d.error || 'No se pudo guardar.';
      setData(d);
      return null;
    } catch {
      return 'Sin conexión. Intenta de nuevo.';
    } finally {
      setBusy(null);
    }
  }

  const miles = Number(tMiles);
  const amount = Number(eAmount);

  async function addTrip(e: React.FormEvent) {
    e.preventDefault();
    const err = await send('POST', { kind: 'trip', date: tDate, client: tClient, purpose: tPurpose, city: tCity, miles }, 'trip');
    if (err) return setTMsg({ ok: false, text: err });
    setTMsg({ ok: true, text: `Guardado: ${miles} millas, ${usd(mileageDeduction(miles))} deducibles.` });
    setTClient(''); setTPurpose(''); setTMiles('');
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const err = await send('POST', { kind: 'expense', date: eDate, concept: eConcept, category: eCategory, amount }, 'expense');
    if (err) return setEMsg({ ok: false, text: err });
    setEMsg({ ok: true, text: needsDualApproval(amount) ? 'Guardado. Falta la firma del otro socio para que cuente.' : 'Guardado y aprobado.' });
    setEConcept(''); setEAmount('');
  }

  async function act(action: 'sign' | 'reject', id: string) {
    const err = await send('PATCH', { action, id }, `${action}:${id}`);
    setActionMsg(err || (action === 'sign' ? 'Firma guardada.' : 'Gasto rechazado.'));
  }

  async function removeTrip(t: Trip) {
    if (!window.confirm(`¿Borrar el viaje a ${t.client} (${t.miles} millas)?`)) return;
    const err = await send('DELETE', { id: t.id }, `del:${t.id}`);
    setActionMsg(err || 'Viaje borrado.');
  }

  function exportCsv() {
    if (!data) return;
    const blob = new Blob([ledgerCsv(data.trips, data.expenses)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `LumoHQ_Schedule_C_${localDay()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const pending = useMemo(() => (data?.expenses ?? []).filter((x) => expenseStatus(x) === 'PENDIENTE'), [data]);
  const partner = data?.me.partner ?? null;

  if (loadError) return <section className="bg-white rounded-3xl p-6 border border-red-200 text-sm text-red-800" role="alert">{loadError}</section>;

  return (
    <section aria-labelledby="ledger-h" className="bg-white rounded-3xl border border-lumo-niebla">
      <header className="p-5 md:p-6 border-b border-lumo-niebla flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-lumo-pizarra">IRS Schedule C · ${IRS_MILEAGE_RATE.toFixed(2)} por milla</p>
          <h2 id="ledger-h" className="text-xl md:text-2xl font-black font-heading text-lumo-noche mt-1">Libro de millas y gastos deducibles</h2>
          <p className="text-sm text-lumo-pizarra mt-1 max-w-prose">
            Viajes de negocio en Midland-Odessa y gastos del negocio. Un gasto de más de ${DUAL_APPROVAL_OVER} cuenta solo cuando Luis y Carlos lo firman.
          </p>
        </div>
        <button type="button" onClick={exportCsv} disabled={!data}
          className="self-start md:self-auto min-h-touch inline-flex items-center gap-2 px-4 rounded-xl border border-slate-300 text-sm font-bold text-lumo-noche hover:bg-slate-50 disabled:opacity-50">
          <Download className="w-4 h-4" aria-hidden="true" />CSV para el contador
        </button>
      </header>

      {/* Totals */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 border-b border-lumo-niebla">
        {[
          { k: 'Millas registradas', v: data ? data.totals.miles.toLocaleString('en-US') : '…' },
          { k: 'Deducción por millas', v: data ? usd(data.totals.mileageDeduction) : '…' },
          { k: 'Gastos aprobados', v: data ? usd(data.totals.approvedExpenses) : '…', n: data && data.totals.pendingExpenses ? `${usd(data.totals.pendingExpenses)} esperan firma` : undefined },
          { k: 'Ahorro estimado de impuestos', v: data ? usd(data.totals.estimatedTaxSaving) : '…', n: `~${Math.round(TAX_SAVING_RATE * 100)}¢ por dólar deducible`, strong: true },
        ].map((x, i) => (
          <div key={x.k} className={`p-4 md:p-5 min-w-0 ${i % 2 ? 'border-l' : ''} ${i >= 2 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} border-lumo-niebla ${x.strong ? 'bg-emerald-50' : ''}`}>
            <dt className="text-xs font-bold text-lumo-pizarra">{x.k}</dt>
            <dd className={`text-xl md:text-2xl font-black tabular-nums mt-1 ${x.strong ? 'text-emerald-800' : 'text-lumo-noche'}`}>{x.v}</dd>
            {x.n && <dd className="text-xs text-lumo-pizarra mt-0.5">{x.n}</dd>}
          </div>
        ))}
      </dl>

      {/* Waiting for signatures */}
      {pending.length > 0 && (
        <div className="p-5 md:p-6 border-b border-lumo-niebla bg-amber-50/60">
          <h3 className="text-sm font-black text-amber-950 flex items-center gap-2"><PenLine className="w-4 h-4" aria-hidden="true" />Por firmar ({pending.length})</h3>
          <ul className="mt-3 space-y-2">
            {pending.map((x) => {
              const check = canSign(x, partner);
              const missing = missingSignatures(x).map((p) => PARTNER_NAME[p]).join(' y ');
              return (
                <li key={x.id} className="p-3 rounded-2xl bg-white border border-amber-200 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lumo-noche break-words">{x.concept} <span className="tabular-nums">· {usd(x.amount)}</span></p>
                    <p className="text-xs text-lumo-pizarra">{x.date} · {x.category} · registró {x.createdBy} · falta {missing}</p>
                  </div>
                  {partner ? (
                    <div className="flex gap-2 shrink-0">
                      {check.ok && (
                        <button type="button" onClick={() => act('sign', x.id)} disabled={!!busy}
                          className="min-h-touch inline-flex items-center gap-1.5 px-4 rounded-xl bg-lumo-noche text-white text-sm font-bold disabled:opacity-60">
                          {busy === `sign:${x.id}` ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <PenLine className="w-4 h-4" aria-hidden="true" />}Firmar como {PARTNER_NAME[partner]}
                        </button>
                      )}
                      {!check.ok && <span className="self-center text-xs font-bold text-amber-900">Ya firmaste</span>}
                      <button type="button" onClick={() => act('reject', x.id)} disabled={!!busy}
                        className="min-h-touch inline-flex items-center gap-1.5 px-3 rounded-xl text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60">
                        <X className="w-4 h-4" aria-hidden="true" />Rechazar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-lumo-pizarra">Solo Luis o Carlos firman.</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {actionMsg && <p role="status" className="px-5 md:px-6 pt-3 text-sm font-bold text-lumo-noche">{actionMsg}</p>}

      {/* Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-lumo-niebla">
        <form onSubmit={addTrip} className="p-5 md:p-6 space-y-3" aria-labelledby="trip-h">
          <h3 id="trip-h" className="text-sm font-black text-lumo-noche flex items-center gap-2"><Car className="w-4 h-4 text-lumo-ambar" aria-hidden="true" />Registrar viaje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label htmlFor="t-date" className={label}>Fecha</label><input id="t-date" type="date" required max={localDay()} value={tDate} onChange={(e) => setTDate(e.target.value)} className={input} /></div>
            <div>
              <label htmlFor="t-client" className={label}>Cliente o prospecto</label>
              <input id="t-client" required minLength={2} maxLength={100} list="ledger-prospects" value={tClient} onChange={(e) => setTClient(e.target.value)} placeholder="Barbería El Rey" className={input} />
              <datalist id="ledger-prospects">{prospects.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
          </div>
          <fieldset>
            <legend className={label}>Ciudad</legend>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100">
              {CITIES.map((c) => (
                <label key={c} className={`min-h-[40px] grid place-items-center rounded-lg text-sm font-bold cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lumo-ambar ${tCity === c ? 'bg-white text-lumo-noche shadow-sm' : 'text-slate-600'}`}>
                  <input type="radio" name="t-city" value={c} checked={tCity === c} onChange={() => setTCity(c)} className="sr-only" />{CITY_LABEL[c]}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="t-miles" className={label}>Millas (ida y vuelta)</label>
            <div className="flex gap-2">
              <input id="t-miles" type="number" inputMode="decimal" required min={0.1} max={500} step={0.1} value={tMiles} onChange={(e) => setTMiles(e.target.value)} className={`${inputBase} w-24 shrink-0 tabular-nums`} />
              {QUICK_MILES.map((m) => (
                <button key={m} type="button" onClick={() => setTMiles(String(Math.round(((Number(tMiles) || 0) + m) * 10) / 10))}
                  className="min-h-touch flex-1 min-w-0 rounded-xl border border-slate-300 text-sm font-bold text-lumo-noche hover:bg-slate-50 tabular-nums" aria-label={`Sumar ${m} millas`}>
                  +{m}
                </button>
              ))}
            </div>
          </div>
          <div><label htmlFor="t-purpose" className={label}>Motivo de negocio</label><input id="t-purpose" maxLength={200} value={tPurpose} onChange={(e) => setTPurpose(e.target.value)} placeholder="Diagnóstico presencial y entrega del QR" className={input} /></div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-sm text-lumo-pizarra">Deducción: <strong className="text-lumo-noche tabular-nums">{usd(miles > 0 ? mileageDeduction(miles) : 0)}</strong></p>
            <button type="submit" disabled={busy === 'trip'} className="min-h-touch px-5 rounded-xl bg-lumo-ambar text-lumo-noche text-sm font-black disabled:opacity-60">Guardar viaje</button>
          </div>
          {tMsg && <p role={tMsg.ok ? 'status' : 'alert'} className={`text-sm font-bold ${tMsg.ok ? 'text-emerald-800' : 'text-red-700'}`}>{tMsg.text}</p>}
        </form>

        <form onSubmit={addExpense} className="p-5 md:p-6 space-y-3" aria-labelledby="exp-h">
          <h3 id="exp-h" className="text-sm font-black text-lumo-noche flex items-center gap-2"><Receipt className="w-4 h-4 text-lumo-ambar" aria-hidden="true" />Registrar gasto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label htmlFor="e-date" className={label}>Fecha</label><input id="e-date" type="date" required max={localDay()} value={eDate} onChange={(e) => setEDate(e.target.value)} className={input} /></div>
            <div><label htmlFor="e-amount" className={label}>Monto (USD)</label><input id="e-amount" type="number" inputMode="decimal" required min={0.01} max={50000} step={0.01} value={eAmount} onChange={(e) => setEAmount(e.target.value)} className={`${input} tabular-nums`} /></div>
          </div>
          <div><label htmlFor="e-concept" className={label}>Concepto</label><input id="e-concept" required minLength={3} maxLength={120} value={eConcept} onChange={(e) => setEConcept(e.target.value)} placeholder="Stickers QR para 20 negocios" className={input} /></div>
          <div>
            <label htmlFor="e-cat" className={label}>Categoría</label>
            <select id="e-cat" value={eCategory} onChange={(e) => setECategory(e.target.value as ExpenseCategory)} className={input}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {amount > DUAL_APPROVAL_OVER && (
            <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950">
              Más de ${DUAL_APPROVAL_OVER}: necesita la firma de Luis y de Carlos.{partner ? ` Tu firma (${PARTNER_NAME[partner]}) va incluida al guardarlo.` : ''}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-sm text-lumo-pizarra">Deducible: <strong className="text-lumo-noche tabular-nums">{usd(amount > 0 ? deductiblePart({ amount, category: eCategory }) : 0)}</strong></p>
            <button type="submit" disabled={busy === 'expense'} className="min-h-touch px-5 rounded-xl bg-lumo-ambar text-lumo-noche text-sm font-black disabled:opacity-60">Guardar gasto</button>
          </div>
          {eMsg && <p role={eMsg.ok ? 'status' : 'alert'} className={`text-sm font-bold ${eMsg.ok ? 'text-emerald-800' : 'text-red-700'}`}>{eMsg.text}</p>}
        </form>
      </div>

      {/* History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-lumo-niebla divide-y lg:divide-y-0 lg:divide-x divide-lumo-niebla">
        <div className="p-5 md:p-6">
          <h3 className="text-sm font-black text-lumo-noche">Viajes ({data?.trips.length ?? 0})</h3>
          <ul className="mt-2 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {(data?.trips ?? []).map((t) => (
              <li key={t.id} className="py-2.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-lumo-noche break-words">{t.client}</p>
                  <p className="text-xs text-lumo-pizarra">{t.date} · {CITY_LABEL[t.city]}{t.purpose ? ` · ${t.purpose}` : ''}</p>
                </div>
                <p className="text-right shrink-0 tabular-nums">
                  <span className="block text-sm font-black text-lumo-noche">{t.miles} mi</span>
                  <span className="block text-xs text-emerald-800 font-bold">{usd(mileageDeduction(t.miles))}</span>
                </p>
                <button type="button" onClick={() => removeTrip(t)} disabled={!!busy} aria-label={`Borrar viaje a ${t.client}`}
                  className="min-h-touch min-w-touch -my-2 grid place-items-center rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 md:p-6">
          <h3 className="text-sm font-black text-lumo-noche">Gastos ({data?.expenses.length ?? 0})</h3>
          <ul className="mt-2 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {(data?.expenses ?? []).map((x) => {
              const st = expenseStatus(x);
              return (
                <li key={x.id} className="py-2.5 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-lumo-noche break-words">{x.concept}</p>
                    <p className="text-xs text-lumo-pizarra">
                      {x.date} · {x.category}
                      {needsDualApproval(x.amount) && ` · firmas: ${(['luis', 'carlos'] as const).map((p) => `${PARTNER_NAME[p]} ${x.signatures[p] ? 'sí' : 'no'}`).join(', ')}`}
                    </p>
                  </div>
                  <p className="text-right shrink-0">
                    <span className="block text-sm font-black text-lumo-noche tabular-nums">{usd(x.amount)}</span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${st === 'APROBADO' ? 'bg-emerald-100 text-emerald-900' : st === 'PENDIENTE' ? 'bg-amber-100 text-amber-950' : 'bg-red-100 text-red-800'}`}>
                      {st === 'APROBADO' ? 'Aprobado' : st === 'PENDIENTE' ? 'Por firmar' : `Rechazado (${x.rejected?.by})`}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="px-5 md:px-6 pb-5 text-xs text-lumo-pizarra">
        Cálculo de referencia para tu contador, no es asesoría fiscal. Comidas de negocio cuentan al 50%. Guarda los recibos.
      </p>
    </section>
  );
}
