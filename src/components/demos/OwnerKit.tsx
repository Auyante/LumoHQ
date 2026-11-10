'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

/** Small shared pieces for the demo owner views. */

export function useMinuteClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function since(iso: string, now: number | null): string {
  if (!now) return '';
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

export function OwnerHeader({ eyebrow, title, hint, onReset }: { eyebrow: string; title: string; hint: string; onReset: () => void }) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-lumo-pizarra">{eyebrow}</p>
        <h1 className="text-2xl md:text-3xl font-black font-heading text-lumo-noche leading-tight mt-1 break-words">{title}</h1>
        <p className="text-sm text-lumo-pizarra mt-1 max-w-prose">{hint}</p>
      </div>
      <button type="button" onClick={onReset}
        className="self-start md:self-auto min-h-touch inline-flex items-center gap-2 px-4 rounded-xl border border-slate-300 bg-white text-sm font-bold text-lumo-noche hover:bg-slate-50">
        <RotateCcw className="w-4 h-4" aria-hidden="true" />Reiniciar demo
      </button>
    </header>
  );
}

export function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-lumo-niebla p-4 min-w-0">
      <p className="text-xs font-bold text-lumo-pizarra">{label}</p>
      <p className="text-2xl font-black text-lumo-noche tabular-nums mt-1 truncate">{value}</p>
      {note && <p className="text-xs text-lumo-pizarra mt-0.5">{note}</p>}
    </div>
  );
}

export const money = (n: number) => `$${n.toFixed(n % 1 ? 2 : 0)}`;
