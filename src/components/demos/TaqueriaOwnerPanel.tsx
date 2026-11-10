'use client';

import React from 'react';
import { MessageCircle, ShoppingBag, Car, X } from 'lucide-react';
import { DEMO_KEYS, useDemoList, type DemoOrder, type OrderStatus } from '@/lib/demo-store';
import { SEED_ORDERS } from './demo-seeds';
import { OwnerHeader, Stat, money, since, useMinuteClock } from './OwnerKit';

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  Nueva: { to: 'En preparación', label: 'Aceptar y preparar' },
  'En preparación': { to: 'Lista', label: 'Marcar lista' },
  Lista: { to: 'Entregada', label: 'Entregada' },
};

const CHIP: Record<OrderStatus, string> = {
  Nueva: 'bg-lumo-ambar text-lumo-noche',
  'En preparación': 'bg-sky-100 text-sky-900',
  Lista: 'bg-emerald-100 text-emerald-900',
  Entregada: 'bg-slate-200 text-slate-700',
  Cancelada: 'bg-red-100 text-red-800 line-through',
};

const OPEN: OrderStatus[] = ['Nueva', 'En preparación', 'Lista'];

export function TaqueriaOwnerPanel({ businessName }: { businessName: string }) {
  const [list, update, reset] = useDemoList<DemoOrder>(DEMO_KEYS.pedidos, SEED_ORDERS);
  const now = useMinuteClock();
  const set = (id: string, status: OrderStatus) => update((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const open = list.filter((o) => OPEN.includes(o.status));
  const done = list.filter((o) => !OPEN.includes(o.status));
  const sold = list.filter((o) => o.status !== 'Cancelada').reduce((s, o) => s + o.total, 0);
  const paid = list.filter((o) => o.status !== 'Cancelada').length;

  const card = (o: DemoOrder) => {
    const step = NEXT[o.status];
    const isOpen = OPEN.includes(o.status);
    return (
      <li key={o.id} className={`p-4 md:px-5 ${o.status === 'Nueva' ? 'bg-amber-50/70' : ''}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-bold text-lumo-noche">{o.customerName}</p>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${CHIP[o.status]}`}>{o.status}</span>
          <span className="inline-flex items-center gap-1 text-xs text-lumo-pizarra">
            {o.type === 'delivery' ? <Car className="w-3.5 h-3.5" aria-hidden="true" /> : <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />}
            {o.type === 'delivery' ? 'A domicilio' : 'Para recoger'}
          </span>
          <span className="ml-auto text-xs text-lumo-pizarra">{since(o.createdAt, now)}</span>
        </div>
        <ul className="mt-2 text-sm text-slate-700 space-y-0.5">
          {o.lines.map((l, i) => (
            <li key={i} className="flex gap-2"><span className="font-bold tabular-nums w-7 shrink-0">{l.qty}×</span><span className="flex-1 min-w-0">{l.name}</span><span className="tabular-nums">{money(l.qty * l.price)}</span></li>
          ))}
        </ul>
        <div className="mt-2 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-sm">
          <span className="text-lumo-pizarra">Total</span><span className="font-black text-lumo-noche tabular-nums">{money(o.total)}</span>
        </div>
        {isOpen && (
          <div className="mt-3 flex flex-wrap gap-2">
            {step && (
              <button type="button" onClick={() => set(o.id, step.to)} className="min-h-touch px-4 rounded-xl bg-lumo-noche text-white text-sm font-bold">{step.label}</button>
            )}
            <button type="button" onClick={() => set(o.id, 'Cancelada')} className="min-h-touch inline-flex items-center gap-1.5 px-3 rounded-xl text-sm font-bold text-red-700 hover:bg-red-50">
              <X className="w-4 h-4" aria-hidden="true" />Cancelar
            </button>
          </div>
        )}
      </li>
    );
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <OwnerHeader
        eyebrow="Vista del dueño · Comandas de WhatsApp"
        title={`Pedidos de hoy en ${businessName}`}
        hint="Así le llegan al dueño los pedidos que salen de su menú. Cambia a la vista del cliente, arma un pedido por WhatsApp y aparece aquí como comanda."
        onReset={reset}
      />

      <section aria-label="Resumen del día" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Comandas abiertas" value={open.length} note={`${open.filter((o) => o.status === 'Nueva').length} nuevas sin aceptar`} />
        <Stat label="Vendido hoy" value={money(sold)} note={`${paid} pedidos`} />
        <Stat label="Ticket promedio" value={paid ? money(Math.round((sold / paid) * 100) / 100) : '—'} />
      </section>

      <section aria-labelledby="open-h" className="bg-white rounded-3xl border border-lumo-niebla">
        <h2 id="open-h" className="px-4 md:px-5 py-3 border-b border-lumo-niebla text-sm font-black text-lumo-noche flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-700" aria-hidden="true" />En cocina
        </h2>
        {open.length === 0
          ? <p className="p-6 text-sm text-lumo-pizarra">No hay comandas abiertas. Haz un pedido desde la vista del cliente.</p>
          : <ol aria-live="polite" className="divide-y divide-lumo-niebla">{open.map(card)}</ol>}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="done-h" className="bg-white rounded-3xl border border-lumo-niebla">
          <h2 id="done-h" className="px-4 md:px-5 py-3 border-b border-lumo-niebla text-sm font-black text-lumo-noche">Cerradas</h2>
          <ol className="divide-y divide-lumo-niebla">{done.map(card)}</ol>
        </section>
      )}
      <p className="text-xs text-lumo-pizarra">Demostración: los pedidos se guardan solo en este navegador.</p>
    </main>
  );
}
