'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AlertTriangle, CheckCircle2, Minus, Plus, RefreshCw, Save, CalendarCheck, Loader2 } from 'lucide-react';
import {
  SUNDAY_MILESTONES, HOUR_TARGETS, MIN_WEEKLY_HOURS, MIN_WEEKLY_CONTACTS, METRIC_KEYS,
  evaluateRisk1Alert, progressPct, targetFor,
  type SundayReview, type SundayMetrics,
} from '@/lib/sunday-dashboard';

interface Board { current: SundayReview; history: SundayReview[]; fromCrm: SundayMetrics; canEdit: boolean }

const METRIC_LABEL: Record<keyof SundayMetrics, string> = {
  contacts: 'Contactos', diagnoses: 'Diagnósticos', meetings: 'Reuniones de 15 min', closedClients: 'Clientes cerrados', mrr: 'Ingreso mensual (MRR)',
};
const isMoney = (k: keyof SundayMetrics) => k === 'mrr';
const fmt = (k: keyof SundayMetrics, n: number) => (isMoney(k) ? `$${n.toLocaleString('en-US')}` : n.toLocaleString('en-US'));
const weekLabel = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('es-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const field = 'min-h-touch w-full px-3 rounded-xl border border-slate-300 bg-white text-lumo-noche tabular-nums focus:outline-none focus:ring-2 focus:ring-lumo-ambar disabled:bg-slate-50 disabled:text-slate-500';

function Stepper({ id, value, step, min = 0, max, disabled, onChange, label }: { id: string; value: number; step: number; min?: number; max: number; disabled?: boolean; onChange: (n: number) => void; label: string }) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, Math.round(n / step) * step)));
  return (
    <div className="flex items-stretch gap-1.5">
      <button type="button" disabled={disabled || value <= min} onClick={() => set(value - step)} aria-label={`Restar ${step} a ${label}`}
        className="min-h-touch min-w-touch grid place-items-center rounded-xl border border-slate-300 bg-white text-lumo-noche disabled:opacity-40">
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>
      <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={Number.isFinite(value) ? value : 0} disabled={disabled}
        onChange={(e) => set(Number(e.target.value) || 0)} className={`${field} text-center text-lg font-black min-w-0`} />
      <button type="button" disabled={disabled || value >= max} onClick={() => set(value + step)} aria-label={`Sumar ${step} a ${label}`}
        className="min-h-touch min-w-touch grid place-items-center rounded-xl border border-slate-300 bg-white text-lumo-noche disabled:opacity-40">
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function SundayDashboardPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [draft, setDraft] = useState<SundayReview | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<'save' | 'close' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/sunday', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d: Board = await r.json();
        setBoard(d);
        // A week nobody has saved yet starts from what the CRM already counts.
        if (!d.current.savedAt && d.canEdit) {
          setDraft({ ...d.current, metrics: d.fromCrm });
          setDirty(true);
          setMsg({ ok: true, text: 'Números traídos del CRM. Ajusta lo que haga falta y guarda.' });
        } else setDraft(d.current);
      })
      .catch(() => setMsg({ ok: false, text: 'No se pudo cargar el tablero.' }));
  }, []);

  // Warn before leaving with unsaved numbers.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const edit = (fn: (d: SundayReview) => SundayReview) => { setDraft((d) => (d ? fn(d) : d)); setDirty(true); setMsg(null); };

  async function post(body: object, kind: 'save' | 'close') {
    setBusy(kind);
    try {
      const r = await fetch('/api/admin/sunday', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setMsg({ ok: false, text: d.error || 'No se pudo guardar.' });
      setBoard(d); setDraft(d.current); setDirty(false);
      setMsg({ ok: true, text: kind === 'save' ? 'Guardado.' : 'Semana cerrada. Empieza la siguiente con las mismas metas.' });
    } catch {
      setMsg({ ok: false, text: 'Sin conexión. Los números siguen en pantalla; intenta guardar otra vez.' });
    } finally {
      setBusy(null);
    }
  }

  const save = () => draft && post({ action: 'save', review: { milestone: draft.milestone, hours: draft.hours, metrics: draft.metrics, notes: draft.notes } }, 'save');
  const closeWeek = () => {
    if (dirty) return setMsg({ ok: false, text: 'Guarda los cambios antes de cerrar la semana.' });
    if (window.confirm('¿Cerrar esta semana? Queda en el historial y las horas vuelven a 0.')) post({ action: 'close_week' }, 'close');
  };

  const risk = useMemo(() => (draft ? evaluateRisk1Alert({ weekNumber: 0, ...draft.hours }) : null), [draft]);
  const milestone = SUNDAY_MILESTONES.find((m) => m.day === draft?.milestone) ?? SUNDAY_MILESTONES[0];
  const ro = !board?.canEdit;

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-16">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-lumo-pizarra">Revisión de 15 minutos · Doc 04</p>
            <h1 className="text-2xl md:text-3xl font-black font-heading leading-tight mt-1">
              Domingo{draft ? `, semana del ${weekLabel(draft.weekOf)}` : ''}
            </h1>
            <p className="text-sm text-lumo-pizarra mt-1" aria-live="polite">
              {!board ? 'Cargando…' : dirty ? 'Cambios sin guardar.' : draft?.savedAt ? `Guardado por ${draft.savedBy} el ${new Date(draft.savedAt).toLocaleString('es-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.` : 'Aún no se guarda esta semana.'}
              {ro && board ? ' Solo lectura.' : ''}
            </p>
          </div>
          {!ro && board && (
            <div className="grid grid-cols-2 md:flex gap-2">
              <button type="button" onClick={() => edit((d) => ({ ...d, metrics: board.fromCrm }))}
                className="col-span-2 md:col-auto min-h-touch inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-slate-300 bg-white text-sm font-bold">
                <RefreshCw className="w-4 h-4" aria-hidden="true" />Traer números del CRM
              </button>
              <button type="button" onClick={closeWeek} disabled={!!busy}
                className="min-h-touch inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-slate-300 bg-white text-sm font-bold disabled:opacity-60">
                {busy === 'close' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CalendarCheck className="w-4 h-4" aria-hidden="true" />}Cerrar semana
              </button>
              <button type="button" onClick={save} disabled={!!busy || !dirty}
                className="min-h-touch inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-lumo-ambar text-lumo-noche text-sm font-black disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Guardar
              </button>
            </div>
          )}
        </header>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm font-bold ${msg.ok ? 'text-emerald-800' : 'text-red-700'}`}>{msg.text}</p>}

        {draft && risk && (
          <>
            {/* Risk #1 */}
            <section aria-labelledby="risk-h" className={`rounded-3xl border p-5 md:p-6 ${risk.isAlertActive ? 'bg-red-50 border-red-200' : 'bg-white border-lumo-niebla'}`}>
              <div className="flex items-start gap-3">
                {risk.isAlertActive
                  ? <AlertTriangle className="w-6 h-6 text-red-700 shrink-0" aria-hidden="true" />
                  : <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />}
                <div className="min-w-0">
                  <h2 id="risk-h" className={`text-lg font-black ${risk.isAlertActive ? 'text-red-900' : 'text-emerald-900'}`}>
                    Riesgo #1: {risk.isAlertActive ? 'el ritmo está bajo esta semana' : 'el ritmo va bien'}
                  </h2>
                  <p className="text-sm text-slate-700 mt-0.5">
                    <span className="tabular-nums font-bold">{risk.totalHours}</span> de {MIN_WEEKLY_HOURS}&nbsp;h mínimas ·{' '}
                    <span className="tabular-nums font-bold">{draft.hours.contactsThisWeek}</span> de {MIN_WEEKLY_CONTACTS} contactos mínimos
                  </p>
                  {risk.reasons.length > 0 && <ul className="mt-2 text-sm text-red-900 list-disc pl-5 space-y-0.5">{risk.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
                </div>
              </div>
            </section>

            {/* Hours */}
            <section aria-labelledby="hours-h" className="bg-white rounded-3xl border border-lumo-niebla p-5 md:p-6">
              <h2 id="hours-h" className="text-lg font-black font-heading">Horas de la semana</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(HOUR_TARGETS) as (keyof typeof HOUR_TARGETS)[]).map((k) => {
                  const t = HOUR_TARGETS[k];
                  const v = draft.hours[k];
                  const state = v < t.min ? { c: 'text-red-700', l: 'Debajo de la meta' } : v > t.max ? { c: 'text-amber-800', l: 'Arriba del rango' } : { c: 'text-emerald-800', l: 'En rango' };
                  return (
                    <div key={k} className="min-w-0">
                      <label htmlFor={`h-${k}`} className="block text-sm font-bold">{t.name}</label>
                      <p className="text-xs text-lumo-pizarra mb-1.5">Meta {t.min}–{t.max}&nbsp;h · <span className={`font-bold ${state.c}`}>{state.l}</span></p>
                      <Stepper id={`h-${k}`} label={`horas de ${t.name}`} value={v} step={0.5} max={80} disabled={ro}
                        onChange={(n) => edit((d) => ({ ...d, hours: { ...d.hours, [k]: n } }))} />
                    </div>
                  );
                })}
                <div className="min-w-0">
                  <label htmlFor="h-contacts" className="block text-sm font-bold">Contactos esta semana</label>
                  <p className="text-xs text-lumo-pizarra mb-1.5">Mínimo {MIN_WEEKLY_CONTACTS}</p>
                  <Stepper id="h-contacts" label="contactos" value={draft.hours.contactsThisWeek} step={1} max={1000} disabled={ro}
                    onChange={(n) => edit((d) => ({ ...d, hours: { ...d.hours, contactsThisWeek: n } }))} />
                </div>
              </div>
            </section>

            {/* Milestones */}
            <section aria-labelledby="ms-h" className="bg-white rounded-3xl border border-lumo-niebla p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="ms-h" className="text-lg font-black font-heading">Meta contra real</h2>
                  <p className="text-sm text-lumo-pizarra mt-0.5">{milestone.name}</p>
                </div>
                <div role="radiogroup" aria-label="Hito" className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 md:w-auto">
                  {SUNDAY_MILESTONES.map((m) => (
                    <button key={m.day} type="button" role="radio" aria-checked={draft.milestone === m.day} disabled={ro && draft.milestone !== m.day}
                      onClick={() => edit((d) => ({ ...d, milestone: m.day }))}
                      className={`min-h-[40px] px-3 rounded-lg text-sm font-bold whitespace-nowrap ${draft.milestone === m.day ? 'bg-white shadow-sm text-lumo-noche' : 'text-slate-600'}`}>
                      Día {m.day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {METRIC_KEYS.map((k) => {
                  const cur = draft.metrics[k];
                  const target = targetFor(milestone, k);
                  const pct = progressPct(cur, target);
                  const crm = board?.fromCrm[k];
                  return (
                    <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 min-w-0 flex flex-col gap-2">
                      <label htmlFor={`m-${k}`} className="text-sm font-bold leading-snug">{METRIC_LABEL[k]}</label>
                      <p className="text-xs text-lumo-pizarra -mt-1.5">Meta: <span className="font-bold tabular-nums">{fmt(k, target)}</span></p>
                      <Stepper id={`m-${k}`} label={METRIC_LABEL[k]} value={cur} step={isMoney(k) ? 100 : 1} max={isMoney(k) ? 1_000_000 : 10_000} disabled={ro}
                        onChange={(n) => edit((d) => ({ ...d, metrics: { ...d.metrics, [k]: n } }))} />
                      <div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${METRIC_LABEL[k]}: ${pct}% de la meta`}>
                          <div className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${pct >= 100 ? 'bg-emerald-600' : pct >= 50 ? 'bg-lumo-ambar' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 flex justify-between text-xs tabular-nums">
                          <span className="text-lumo-pizarra">{crm !== undefined && crm !== cur ? `CRM: ${fmt(k, crm)}` : ' '}</span>
                          <span className="font-bold">{pct}%</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Notes */}
            <section className="bg-white rounded-3xl border border-lumo-niebla p-5 md:p-6">
              <label htmlFor="notes" className="text-lg font-black font-heading">Acuerdos de la semana</label>
              <textarea id="notes" rows={3} maxLength={1000} value={draft.notes} disabled={ro}
                onChange={(e) => edit((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Qué se decidió y quién lo hace antes del próximo domingo."
                className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lumo-ambar disabled:bg-slate-50" />
            </section>

            {/* History */}
            {board && board.history.length > 0 && (
              <section aria-labelledby="hist-h" className="bg-white rounded-3xl border border-lumo-niebla p-5 md:p-6">
                <h2 id="hist-h" className="text-lg font-black font-heading">Semanas anteriores</h2>
                <ul className="mt-3 divide-y divide-slate-100">
                  {board.history.slice(0, 12).map((h) => {
                    const r = evaluateRisk1Alert({ weekNumber: 0, ...h.hours });
                    return (
                      <li key={h.weekOf} className="py-2.5 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-0.5 text-sm tabular-nums">
                        <span className="font-bold">Semana del {weekLabel(h.weekOf)}</span>
                        <span className={r.isAlertActive ? 'text-red-700 font-bold' : 'text-emerald-800 font-bold'}>{r.isAlertActive ? 'Ritmo bajo' : 'Ritmo sano'}</span>
                        <span>{r.totalHours}&nbsp;h · {h.hours.contactsThisWeek} contactos</span>
                        <span>{h.metrics.closedClients} clientes</span>
                        <span>${h.metrics.mrr.toLocaleString('en-US')}/mes</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
