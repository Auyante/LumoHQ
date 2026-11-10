'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Globe, CalendarCheck, LayoutDashboard, ArrowRight } from 'lucide-react';
import type { Locale } from '@/lib/types';

interface DemoBadgeProps {
  businessName: string;
  locale: Locale;
  onToggleLocale: () => void;
  ownerToggle?: {
    isOwnerView: boolean;
    appointmentCount?: number;
    onToggle: () => void;
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

        <div className="flex items-center flex-wrap gap-2">
          {ownerToggle && (
            <button
              type="button"
              onClick={ownerToggle.onToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-transform active:scale-95 min-h-[36px] ${ownerToggle.isOwnerView
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                }`}
            >
              {ownerToggle.isOwnerView ? (
                <>
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Vista Cliente (Web Pública)</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 text-lumo-ambar" />
                  <span>
                    Vista Dueño: Agenda ({ownerToggle.appointmentCount ?? 3})
                  </span>
                </>
              )}
            </button>
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
