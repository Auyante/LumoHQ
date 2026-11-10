'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { ArrowRight, CheckCircle2, Sparkles, MapPin, ShieldCheck, Clock } from 'lucide-react';

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-lumo-arena/60 via-white to-white pt-8 pb-14 sm:pt-14 sm:pb-20 border-b border-lumo-niebla">
      {/* Background soft ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-lumo-brillo/20 to-lumo-ambar/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Master Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-heading text-lumo-noche mb-4 sm:mb-6 tracking-tight leading-tight sm:leading-tight">
            {t.hero.titleStart}
            <span className="inline text-lumo-noche underline decoration-lumo-ambar decoration-wavy decoration-from-font decoration-2">
              {t.hero.titleHighlight}
            </span>
            {t.hero.titleEnd}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-lumo-pizarra max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
            {t.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center w-full max-w-md sm:max-w-xl mx-auto gap-3 mb-10 sm:mb-12">
            <Link
              href="#diagnostico"
              className="min-h-touch w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:bg-[#c97e1e] text-lumo-noche font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>

            <Link
              href="#demos"
              className="min-h-touch w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-lumo-arena border border-lumo-niebla text-lumo-noche font-bold text-sm sm:text-base transition-colors duration-150 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-lumo-ambar shrink-0" />
              <span>{t.hero.ctaSecondary}</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 max-w-3xl mx-auto pt-6 border-t border-lumo-niebla/80 text-left">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-lumo-noche bg-white sm:bg-transparent py-2.5 px-3 rounded-xl border border-lumo-niebla/60 sm:border-0 shadow-2xs sm:shadow-none">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.hero.guarantee1}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-lumo-noche bg-white sm:bg-transparent py-2.5 px-3 rounded-xl border border-lumo-niebla/60 sm:border-0 shadow-2xs sm:shadow-none">
              <Clock className="w-4 h-4 text-lumo-ambar shrink-0" />
              <span>{t.hero.guarantee2}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-lumo-noche bg-white sm:bg-transparent py-2.5 px-3 rounded-xl border border-lumo-niebla/60 sm:border-0 shadow-2xs sm:shadow-none">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.hero.guarantee3}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
