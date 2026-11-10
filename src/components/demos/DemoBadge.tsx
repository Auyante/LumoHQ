'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Globe, LayoutDashboard, ArrowRight } from 'lucide-react';
import type { Locale } from '@/lib/types';

interface DemoBadgeProps {
  businessName: string;
  locale: Locale;
  onToggleLocale: () => void;
  /** Two-view switch: the public site vs. what the owner sees. */
  ownerToggle?: {
    view: 'client' | 'owner';
    ownerLabel: string;
    count?: number;
    onChange: (view: 'client' | 'owner') => void;
  };

}

export function DemoBadge({ businessName, locale, onToggleLocale, ownerToggle }: DemoBadgeProps) {
  return (
    <div className="sticky top-0 z-50 bg-lumo-noche text-white border-b border-lumo-ambar/40 px-3 py-2 text-xs font-semibold shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-lumo-brillo transition-colors min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver a</span> Lumo HQ
          </Link>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-lumo-ambar text-lumo-noche font-black text-[10px] tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            DEMO OFICIAL
          </span>
          <span className="hidden lg:inline text-gray-300">
            {locale === 'es'
              ? `Página modelo para mostrar a dueños en Midland-Odessa`
              : `Sample live preview for local Midland-Odessa businesses`}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {ownerToggle && (
            <div role="group" aria-label={locale === 'es' ? 'Cambiar de vista' : 'Switch view'}
              className="order-last md:order-none w-full md:w-auto grid grid-cols-2 p-0.5 rounded-lg bg-white/10">
              {(['client', 'owner'] as const).map((v) => {
                const on = ownerToggle.view === v;
                return (
                  <button key={v} type="button" aria-pressed={on} onClick={() => ownerToggle.onChange(v)}
                    className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 rounded-md text-xs font-bold transition-colors ${on ? 'bg-white text-lumo-noche' : 'text-white/80 hover:text-white'}`}>
                    {v === 'client' ? <Globe className="w-3.5 h-3.5" aria-hidden="true" /> : <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />}
                    <span>{v === 'client' ? (locale === 'es' ? 'Vista del cliente' : 'Customer view') : ownerToggle.ownerLabel}</span>
                    {v === 'owner' && ownerToggle.count !== undefined && (
                      <span className={`min-w-5 h-5 px-1 rounded-full text-[11px] grid place-items-center tabular-nums ${on ? 'bg-lumo-ambar text-lumo-noche' : 'bg-white/20'}`}>{ownerToggle.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <Link
            href="/#diagnostico"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs transition-colors min-h-[36px] shadow-xs active:scale-95"
          >
            <span className="hidden sm:inline">Solicitar Mi Web con Reservas</span>
            <span className="sm:hidden">Solicitar Web</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={onToggleLocale}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors min-h-[36px]"
            aria-label="Cambiar idioma"
          >
            <Globe className="w-3.5 h-3.5 text-lumo-ambar" />
            <span>{locale === 'es' ? 'EN' : 'ES'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
