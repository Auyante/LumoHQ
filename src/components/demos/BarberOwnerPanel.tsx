'use client';

import React from 'react';
import { Phone, MessageSquare, Check, CheckCheck, X, CalendarClock } from 'lucide-react';
import { DEMO_KEYS, useDemoList, type DemoAppointment, type AppointmentStatus } from '@/lib/demo-store';
import { SEED_APPOINTMENTS } from './demo-seeds';
import { OwnerHeader, Stat, money, since, useMinuteClock } from './OwnerKit';

/** "3:30 PM" → minutes after midnight, for sorting the day. */
function minutes(t: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return 9999;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

const CHIP: Record<AppointmentStatus, string> = {
  Pendiente: 'bg-amber-100 text-amber-900',
  Confirmada: 'bg-emerald-100 text-emerald-900',
  Completada: 'bg-slate-200 text-slate-700',
  Cancelada: 'bg-red-100 text-red-800 line-through',
};

export function BarberOwnerPanel({ businessName }: { businessName: string }) {
  const [list, update, reset] = useDemoList<DemoAppointment>(DEMO_KEYS.citas, SEED_APPOINTMENTS);
  const now = useMinuteClock();

  const set = (id: string, patch: Partial<DemoAppointment>) => update((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const day = [...list].sort((a, b) => minutes(a.time) - minutes(b.time));
  const live = day.filter((a) => a.status !== 'Cancelada');
  const pending = day.filter((a) => a.status === 'Pendiente').length;
  const expected = live.reduce((s, a) => s + a.price, 0);
  const next = day.find((a) => a.status === 'Pendiente' || a.status === 'Confirmada');

  const reminder = (a: DemoAppointment) =>
    `Hola ${a.clientName.split(' ')[0]}, te recordamos tu cita hoy a las ${a.time} con ${a.barber} en ${businessName}. Responde SI para confirmar.`;

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <OwnerHeader
        eyebrow="Vista del dueño · Agenda en vivo"
        title={`Citas de hoy en ${businessName}`}
        hint="Así le llegan al dueño las citas de su página. Cambia a la vista del cliente, agenda una cita de prueba y aparece aquí al instante."
        onReset={reset}
      />

      <section aria-label="Resumen del día" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Citas hoy" value={live.length} note={pending ? `${pending} por confirmar` : 'Todas confirmadas'} />
        <Stat label="Ingreso esperado" value={money(expected)} note="Se cobra en el local" />
        <Stat label="Próxima cita" value={next ? next.time : 'Ninguna'} note={next ? `${next.clientName} · ${next.barber}` : undefined} />
      </section>

      <section aria-labelledby="agenda-h" className="bg-white rounded-3xl border border-lumo-niebla">
        <h2 id="agenda-h" className="px-4 md:px-5 py-3 border-b border-lumo-niebla text-sm font-black text-lumo-noche flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-lumo-ambar" aria-hidden="true" />Agenda
        </h2>
        {day.length === 0 ? (
          <p className="p-6 text-sm text-lumo-pizarra">No hay citas. Agenda una desde la vista del cliente.</p>
        ) : (
          <ol aria-live="polite" className="divide-y divide-lumo-niebla">
            {day.map((a) => {
              const fresh = a.fromDemo && now !== null && now - Date.parse(a.createdAt) < 10 * 60_000;
              const open = a.status === 'Pendiente' || a.status === 'Confirmada';
              const digits = a.clientPhone.replace(/\D/g, '');
              return (
                <li key={a.id} className={`p-4 md:px-5 ${fresh ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex gap-3 md:gap-4">
                    <p className="w-[4.5rem] shrink-0 font-black text-lumo-noche tabular-nums text-sm pt-0.5">{a.time}</p>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-bold text-lumo-noche">{a.clientName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${CHIP[a.status]}`}>{a.status}</span>
                        {fresh && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-lumo-ambar text-lumo-noche">Nueva · {since(a.createdAt, now)}</span>}
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5">{a.service} · {money(a.price)}</p>
                      <p className="text-xs text-lumo-pizarra mt-0.5">
                        Con {a.barber} · {a.clientPhone} ·{' '}
                        <span className={a.smsReminder === 'enviado' ? 'text-emerald-800 font-semibold' : ''}>
                          Recordatorio SMS {a.smsReminder === 'enviado' ? 'enviado' : 'programado'}
                        </span>
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {a.status === 'Pendiente' && (
                          <button type="button" onClick={() => set(a.id, { status: 'Confirmada' })}
                            className="min-h-touch inline-flex items-center gap-1.5 px-3 rounded-xl bg-lumo-noche text-white text-sm font-bold">
                            <Check className="w-4 h-4" aria-hidden="true" />Confirmar
                          </button>
                        )}
                        {a.status === 'Confirmada' && (
                          <button type="button" onClick={() => set(a.id, { status: 'Completada' })}
                            className="min-h-touch inline-flex items-center gap-1.5 px-3 rounded-xl bg-lumo-noche text-white text-sm font-bold">
                            <CheckCheck className="w-4 h-4" aria-hidden="true" />Completar
                          </button>
                        )}
                        {open && digits.length >= 10 && (
                          <>
                            <a href={`sms:+1${digits.slice(-10)}?&body=${encodeURIComponent(reminder(a))}`} onClick={() => set(a.id, { smsReminder: 'enviado' })}
                              className="min-h-touch inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-300 text-sm font-bold text-lumo-noche hover:bg-slate-50">
                              <MessageSquare className="w-4 h-4" aria-hidden="true" />Recordatorio
                            </a>
                            <a href={`tel:+1${digits.slice(-10)}`} className="min-h-touch inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-300 text-sm font-bold text-lumo-noche hover:bg-slate-50">
                              <Phone className="w-4 h-4" aria-hidden="true" />Llamar
                            </a>
                          </>
                        )}
                        {open && (
                          <button type="button" onClick={() => set(a.id, { status: 'Cancelada' })}
                            className="min-h-touch inline-flex items-center gap-1.5 px-3 rounded-xl text-sm font-bold text-red-700 hover:bg-red-50">
                            <X className="w-4 h-4" aria-hidden="true" />Cancelar
                          </button>
                        )}
                        {!open && (
                          <button type="button" onClick={() => set(a.id, { status: 'Confirmada' })} className="min-h-touch px-3 rounded-xl text-sm font-bold text-lumo-pizarra hover:bg-slate-50">
                            Deshacer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <p className="text-xs text-lumo-pizarra">Demostración: las citas se guardan solo en este navegador. No se envía ningún SMS real.</p>
    </main>
  );
}
