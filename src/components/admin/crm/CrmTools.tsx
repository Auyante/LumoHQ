'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlarmClock, Ban, Check, CheckCircle2, Clock, Copy, FileUp, MessageCircle, MessageSquareText,
  Phone, Search, ShieldOff, X,
} from 'lucide-react';
import type { ProspectItem } from '@/lib/crm';
import { OFFICIAL_SCRIPTS } from '@/lib/crm';
import {
  MOMENT_LABEL, FOLLOW_UP_MOMENTS, buildScript, byUrgency, canSend, commissionLedger, batchProjection,
  contactLinks, funnel, nextAction, rowsFromCsv, type Moment, type Urgency,
} from '@/lib/crm-engine';

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------ cadence badge */

const URGENCY_STYLE: Record<Urgency, string> = {
  overdue: 'bg-red-100 text-red-800 border-red-200',
  today: 'bg-amber-100 text-amber-900 border-amber-200',
  soon: 'bg-sky-50 text-sky-900 border-sky-200',
  later: 'bg-slate-100 text-slate-700 border-slate-200',
  blocked: 'bg-red-50 text-red-700 border-red-300',
  done: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};
const URGENCY_ICON: Record<Urgency, React.ComponentType<{ className?: string }>> = {
  overdue: AlarmClock, today: AlarmClock, soon: Clock, later: Clock, blocked: Ban, done: CheckCircle2,
};

export function CadenceBadge({ lead, now }: { lead: ProspectItem; now: number }) {
  const na = nextAction(lead, now);
  const Icon = URGENCY_ICON[na.urgency];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold leading-tight ${URGENCY_STYLE[na.urgency]}`}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {na.label}
    </span>
  );
}

/** Ticks once a minute so the "vence en 4 h" labels stay true while the page is open. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}

/* ------------------------------------------------------------ today's queue */

export function WorkQueue({ prospects, now, onOpen }: { prospects: ProspectItem[]; now: number; onOpen: (p: ProspectItem) => void }) {
  const due = useMemo(
    () => prospects.filter((p) => ['overdue', 'today'].includes(nextAction(p, now).urgency)).sort((a, b) => byUrgency(a, b, now)),
    [prospects, now]
  );
  return (
    <section className="bg-white rounded-2xl border border-lumo-niebla shadow-xs p-4" aria-labelledby="queue-h">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 id="queue-h" className="font-heading font-black text-base text-lumo-noche">Para hoy</h2>
        <span className="text-xs font-bold text-lumo-pizarra">{due.length} pendientes</span>
      </div>
      {due.length === 0 ? (
        <p className="text-xs text-slate-500">No hay nada atrasado ni que toque hoy en este lote.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {due.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onOpen(p)} className="w-full min-h-touch py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left hover:bg-slate-50 rounded-lg px-1">
                <span className="text-sm font-bold text-lumo-noche min-w-0 sm:w-56 truncate">{p.businessName}</span>
                <span className="text-xs text-lumo-pizarra sm:w-24">{p.city}</span>
                <CadenceBadge lead={p} now={now} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ contact launcher */

const MOMENTS: Moment[] = ['primerContacto', 'envioDiagnostico', 'seguimiento1', 'seguimiento2', 'seguimiento3', 'propuesta'];

/**
 * Pick the moment, see the Doc 03 script already filled in, then copy it or open it in WhatsApp,
 * SMS or the phone dialer of whoever is holding the device. Sending is recorded explicitly with
 * "Marcar como enviado", which is where the server enforces the TCPA limit.
 */
export function ContactLauncher({ lead, now, onSent, onOptOut }: {
  lead: ProspectItem; now: number;
  onSent: (moment: Moment) => Promise<string | null>;
  onOptOut: (optedOut: boolean) => void;
}) {
  const suggested = nextAction(lead, now).moment ?? 'primerContacto';
  const [moment, setMoment] = useState<Moment>(suggested);
  const [text, setText] = useState(() => buildScript(lead, suggested));
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // new lead or new moment: refill the script
  useEffect(() => { setMoment(suggested); setText(buildScript(lead, suggested)); setStatus(null); }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (m: Moment) => { setMoment(m); setText(buildScript(lead, m)); setStatus(null); };

  const gate = canSend(lead, moment);
  const links = contactLinks(lead.phone, text);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setStatus('No se pudo copiar. Selecciona el texto y cópialo.'); }
  };
  const markSent = async () => setStatus((await onSent(moment)) ?? 'Registrado.');
  const btn = 'min-h-touch inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors';
  const disabledLink = 'pointer-events-none opacity-40';

  return (
    <section className="space-y-3 pt-2 border-t border-slate-200" aria-labelledby="launch-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id="launch-h" className="text-xs font-black text-lumo-noche">Contactar con guion</h4>
        <CadenceBadge lead={lead} now={now} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5" role="group" aria-label="Momento del contacto">
        {MOMENTS.map((m) => (
          <button key={m} type="button" aria-pressed={moment === m} onClick={() => pick(m)}
            className={`min-h-[40px] px-2 py-1.5 rounded-lg border text-[11px] font-bold text-left leading-tight ${moment === m ? 'bg-lumo-noche text-white border-lumo-noche' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {MOMENT_LABEL[m]}{m === suggested && <span className="block text-[10px] font-semibold opacity-80">sugerido</span>}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="sr-only">Mensaje</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={1000}
          className="w-full p-3 rounded-xl border border-slate-200 text-sm leading-relaxed outline-none focus:border-lumo-ambar" />
      </label>

      {!gate.ok && (
        <p className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800" role="alert">
          <Ban className="w-4 h-4 shrink-0" aria-hidden="true" />{gate.reason}
        </p>
      )}
      {!links && <p className="text-xs font-bold text-red-700">El teléfono guardado no es un número de EE. UU. válido.</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button type="button" onClick={copy} className={`${btn} bg-slate-100 hover:bg-slate-200 text-lumo-noche`}>
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}{copied ? 'Copiado' : 'Copiar texto'}
        </button>
        <a href={gate.ok && links ? links.whatsapp : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!gate.ok || !links}
          className={`${btn} bg-[#1F7A4D] text-white hover:bg-[#186640] ${!gate.ok || !links ? disabledLink : ''}`}>
          <MessageCircle className="w-4 h-4" aria-hidden="true" />WhatsApp
        </a>
        <a href={gate.ok && links ? links.sms : undefined} aria-disabled={!gate.ok || !links}
          className={`${btn} bg-lumo-noche text-white hover:bg-black ${!gate.ok || !links ? disabledLink : ''}`}>
          <MessageSquareText className="w-4 h-4" aria-hidden="true" />SMS
        </a>
        <a href={!lead.optedOut && links ? links.call : undefined} aria-disabled={lead.optedOut || !links}
          className={`${btn} bg-lumo-ambar text-lumo-noche hover:bg-lumo-brillo ${lead.optedOut || !links ? disabledLink : ''}`}>
          <Phone className="w-4 h-4" aria-hidden="true" />Llamar
        </a>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <button type="button" onClick={markSent} disabled={!gate.ok}
          className={`${btn} border border-lumo-noche text-lumo-noche hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed`}>
          <Check className="w-4 h-4" aria-hidden="true" />
          Marcar como enviado{FOLLOW_UP_MOMENTS.includes(moment) ? ` (${Math.min(lead.followUpCount + 1, 3)}/3)` : ''}
        </button>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-red-800 cursor-pointer">
          <input type="checkbox" checked={!!lead.optedOut} onChange={(e) => onOptOut(e.target.checked)} className="w-4 h-4 accent-red-700" />
          <ShieldOff className="w-4 h-4" aria-hidden="true" />Pidió no recibir mensajes
        </label>
      </div>
      {status && <p className="text-xs font-semibold text-lumo-pizarra" role="status">{status}</p>}
    </section>
  );
}

/* ------------------------------------------------------------ objections finder */

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Type two letters of what the owner just said and the approved answer is right there. */
export function ObjectionFinder({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = OFFICIAL_SCRIPTS.objections;
  const hits = useMemo(() => {
    const f = fold(q.trim());
    if (!f) return list;
    const words = f.split(/\s+/);
    return list.filter((o) => { const hay = fold(o.objection + ' ' + o.rebuttal); return words.every((w) => hay.includes(w)); });
  }, [q, list]);
  const copy = async (id: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1500); } catch { /* manual copy */ } };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Lo que dijo el dueño: caro, tiempo, sobrino, adelantado…" aria-label="Buscar objeción"
          className="w-full min-h-touch pl-9 pr-9 rounded-xl border border-slate-200 text-sm outline-none focus:border-lumo-ambar" />
        {q && (
          <button type="button" onClick={() => { setQ(''); inputRef.current?.focus(); }} aria-label="Borrar búsqueda"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center text-slate-400 hover:text-lumo-noche">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {hits.length === 0 && <p className="text-xs text-slate-500">Ninguna de las 8 objeciones coincide. Prueba con otra palabra.</p>}
      <ul className={compact ? 'space-y-2 max-h-72 overflow-y-auto' : 'space-y-3'}>
        {hits.map((o) => {
          const n = list.indexOf(o) + 1;
          return (
            <li key={o.id} className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-lumo-niebla">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-lumo-noche"><span className="text-amber-800 mr-1.5 tabular-nums">{n}.</span>&ldquo;{o.objection}&rdquo;</p>
                <button type="button" onClick={() => copy(o.id, o.rebuttal)} aria-label={`Copiar respuesta a ${o.objection}`}
                  className="shrink-0 w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-lumo-noche">
                  {copied === o.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mt-1">{o.rebuttal}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ funnel + money */

export function FunnelAndMoney({ prospects, batch }: { prospects: ProspectItem[]; batch: number }) {
  const inBatch = prospects.filter((p) => p.batchNumber === batch);
  const steps = funnel(inBatch);
  const top = Math.max(1, steps[0].reached);
  const ledger = commissionLedger(prospects);
  const proj = batchProjection(prospects, batch);
  const pct = Math.min(100, (ledger.barbaraTotal / ledger.cap) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <section className="bg-white rounded-2xl border border-lumo-niebla shadow-xs p-4 lg:col-span-1" aria-labelledby="funnel-h">
        <h3 id="funnel-h" className="font-heading font-black text-base text-lumo-noche mb-3">Embudo del lote {batch}</h3>
        <ol className="space-y-2.5">
          {steps.map((s) => (
            <li key={s.step}>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-lumo-noche">{s.step}</span>
                <span className="text-lumo-pizarra tabular-nums">{s.reached}{s.pctFromPrev !== null && <span className="ml-1.5 text-slate-400">· {s.pctFromPrev}%</span>}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-lumo-ambar" style={{ width: `${(s.reached / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-slate-500 mt-3">El % es cuántos pasan desde la etapa anterior.</p>
      </section>

      <section className="bg-white rounded-2xl border border-lumo-niebla shadow-xs p-4" aria-labelledby="barb-h">
        <h3 id="barb-h" className="font-heading font-black text-base text-lumo-noche">Comisión de Bárbara</h3>
        <p className="text-2xl font-black text-lumo-noche mt-1 tabular-nums">{money(ledger.barbaraTotal)} <span className="text-xs font-semibold text-slate-500">de {money(ledger.cap)}</span></p>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Avance hacia el tope">
          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-600' : 'bg-lumo-ambar'}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-slate-500 mt-2">$25 por cliente del 1 al 5 y $15 del 6 al 30 que ella abrió. Referidos y clientes de Luis: $0.</p>
        <ul className="mt-3 divide-y divide-slate-100 max-h-40 overflow-y-auto">
          {ledger.lines.length === 0 && <li className="py-2 text-xs text-slate-500">Todavía no hay clientes cerrados.</li>}
          {ledger.lines.map((l) => (
            <li key={l.id} className="py-1.5 flex justify-between gap-2 text-xs">
              <span className="min-w-0 truncate"><span className="tabular-nums text-slate-500 mr-1">#{l.clientNumber}</span>{l.businessName}{l.founder && <span className="ml-1 text-amber-800 font-bold">fundador</span>}</span>
              <span className="font-bold tabular-nums shrink-0">{l.source === 'BARBARA' ? money(l.barbara) : l.source === 'REFERRAL' ? 'referido · $0' : 'Luis · $0'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-lumo-niebla shadow-xs p-4" aria-labelledby="proj-h">
        <h3 id="proj-h" className="font-heading font-black text-base text-lumo-noche">Neto del lote {batch} (montajes)</h3>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
            <dt className="text-lumo-pizarra">Cerrados ({proj.closedCount})</dt>
            <dd className="font-bold tabular-nums text-right">Luis {money(proj.closed.luis)} · Carlos {money(proj.closed.carlos)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-lumo-pizarra">Si firman los {proj.meetingCount} en reunión</dt>
            <dd className="font-bold tabular-nums text-right">+{money(proj.ifMeetingsClose.luis)} · +{money(proj.ifMeetingsClose.carlos)}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-slate-500 mt-3">Después de Stripe, comisión, herramientas y el 8% de reserva. No incluye mensualidades ni supone tasas de cierre.</p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ CSV import */

export function CsvImport({ batch, onClose, onDone }: { batch: number; onClose: () => void; onDone: () => void }) {
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: { businessName: string; reason: string }[]; errors: { line: number; error: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => (csv.trim() ? rowsFromCsv(csv, batch) : null), [csv, batch]);

  const readFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 200_000) { setError('El archivo es demasiado grande (máx. 200 KB).'); return; }
    const r = new FileReader();
    r.onload = () => { setCsv(String(r.result || '')); setResult(null); setError(null); };
    r.readAsText(f, 'utf-8');
  };
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/crm/prospects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import_csv', csv, batchNumber: batch }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo importar.');
      setResult(data); onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo importar.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="imp-h">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 id="imp-h" className="font-heading font-black text-lg text-lumo-noche">Importar prospectos al lote {batch}</h3>
            <p className="text-xs text-lumo-pizarra mt-0.5">Máximo 30 por archivo. Columnas: negocio, dueño, teléfono, ciudad, giro, dirección, origen, lote.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="min-h-touch min-w-touch grid place-items-center text-slate-400 hover:text-lumo-noche"><X className="w-5 h-5" /></button>
        </div>

        <label className="flex items-center justify-center gap-2 min-h-[64px] rounded-2xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
          <FileUp className="w-5 h-5 text-lumo-ambar" aria-hidden="true" />Elegir archivo .csv
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />
        </label>
        <textarea value={csv} onChange={(e) => { setCsv(e.target.value); setResult(null); }} rows={5}
          placeholder={'negocio,dueño,teléfono,ciudad,giro,origen\nBarbería El Rey,Ramiro,(432) 555-0101,Midland,Barbería,Bárbara'}
          aria-label="Contenido CSV" className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs outline-none focus:border-lumo-ambar" />

        {preview && !result && (
          <div className="text-xs space-y-1">
            <p className="font-bold text-lumo-noche">{preview.rows.length} filas listas para importar{preview.rows.length > 30 && <span className="text-red-700"> · supera el máximo de 30</span>}</p>
            {preview.errors.slice(0, 6).map((e) => <p key={e.line} className="text-red-700">Línea {e.line}: {e.error}</p>)}
            {preview.errors.length > 6 && <p className="text-red-700">y {preview.errors.length - 6} errores más.</p>}
          </div>
        )}
        {result && (
          <div className="text-xs space-y-1 p-3 rounded-xl bg-emerald-50 border border-emerald-200" role="status">
            <p className="font-bold text-emerald-900">{result.created} prospectos importados.</p>
            {result.skipped.map((s, i) => <p key={i} className="text-slate-700">{s.businessName}: {s.reason}</p>)}
            {result.errors.map((e) => <p key={e.line} className="text-red-700">Línea {e.line}: {e.error}</p>)}
          </div>
        )}
        {error && <p className="text-xs font-bold text-red-700" role="alert">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="min-h-touch flex-1 rounded-xl bg-slate-100 text-sm font-bold">{result ? 'Listo' : 'Cancelar'}</button>
          {!result && (
            <button type="button" onClick={submit} disabled={busy || !preview || preview.rows.length === 0 || preview.rows.length > 30}
              className="min-h-touch flex-1 rounded-xl bg-lumo-noche text-white text-sm font-bold disabled:opacity-40">
              {busy ? 'Importando…' : `Importar ${preview?.rows.length ?? 0}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
