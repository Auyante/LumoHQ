'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Check, Flame, ArrowRight, ShieldCheck } from 'lucide-react';

export function PackagesSection() {
  const { t } = useI18n();
  const [founderSlots] = useState(2); // Dynamic founder counter

  return (
    <section id="paquetes" className="py-16 md:py-24 bg-white border-b border-lumo-niebla">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-arena border border-lumo-niebla text-lumo-noche text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-lumo-ambar" />
            {t.packages.badge}
          </div>
          <h2 className="text-fluid-h2 text-lumo-noche mb-4">
            {t.packages.title}
          </h2>
          <p className="text-base sm:text-lg text-lumo-pizarra">
            {t.packages.subtitle}
          </p>
        </div>

        {/* 1. Founder Client Special Offer Banner */}
        <div className="mb-14 rounded-3xl bg-gradient-to-r from-lumo-noche via-[#252E42] to-lumo-noche p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden border border-lumo-ambar/30">
          {/* Subtle amber gradient halo */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-lumo-ambar/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lumo-ambar text-lumo-noche text-xs font-extrabold uppercase tracking-wider">
                <Flame className="w-4 h-4 fill-lumo-noche text-lumo-noche animate-bounce" />
                <span>{t.packages.founder.tag} · {t.packages.founder.slotsLeft}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-heading">
                {t.packages.founder.title}: <span className="text-lumo-brillo">{t.packages.founder.price} USD</span> de Montaje
              </h3>

              <p className="text-xs sm:text-sm text-lumo-brillo font-bold">
                {t.packages.founder.priceDetail} · {t.packages.founder.monthly}
              </p>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                {t.packages.founder.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {t.packages.founder.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-gray-200">
                    <Check className="w-4 h-4 text-lumo-ambar shrink-0 stroke-[3]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
              <div className="text-xs uppercase tracking-wider text-gray-300 font-bold mb-1">
                Cupos Disponibles Sprint 1
              </div>
              <div className="text-5xl font-extrabold text-lumo-brillo font-heading my-2">
                {founderSlots} <span className="text-xl text-gray-300 font-normal">/ 2</span>
              </div>
              <p className="text-xs text-gray-300 mb-6">
                Al agotarse los 2 cupos, el precio cambia al paquete base normal de $500.
              </p>

              <Link
                href="#diagnostico"
                className="min-h-touch w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:bg-[#c97e1e] text-lumo-noche font-bold text-sm shadow-lg transition-transform transform active:scale-95"
              >
                <span>{t.packages.founder.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Regular Base & Premium Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Base Package Card */}
          <div className="rounded-3xl bg-white border-2 border-lumo-ambar p-6 sm:p-8 shadow-lg flex flex-col justify-between relative hover:shadow-xl transition-shadow">
            <div className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-lumo-ambar text-lumo-noche text-xs font-black uppercase tracking-wider shadow-xs">
              {t.packages.base.tag}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-4 mt-2">
                <div>
                  <h3 className="text-2xl font-extrabold text-lumo-noche font-heading">
                    {t.packages.base.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    {t.packages.base.target}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 p-4 rounded-2xl bg-lumo-arena/60 border border-lumo-niebla">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-lumo-noche font-heading">
                    {t.packages.base.price}
                  </span>
                  <span className="text-xs font-bold text-lumo-pizarra uppercase">USD montaje</span>
                </div>
                <div className="text-xs font-bold text-lumo-noche mt-1">
                  {t.packages.base.priceDetail}
                </div>
                <div className="text-xs text-lumo-pizarra mt-0.5">
                  {t.packages.base.monthly}
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-3 mb-8">
                {t.packages.base.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-lumo-noche">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="#diagnostico"
              className="min-h-touch w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-lumo-noche hover:bg-black active:scale-95 text-white font-bold text-sm shadow-md transition-all text-center"
            >
              <span>{t.packages.base.cta}</span>
              <ArrowRight className="w-4 h-4 text-lumo-brillo" />
            </Link>
          </div>

          {/* Premium Package Card (Contractors) */}
          <div className="rounded-3xl bg-white border border-lumo-niebla p-6 sm:p-8 shadow-sm flex flex-col justify-between relative hover:border-lumo-pizarra transition-colors">
            <div className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-lumo-niebla text-lumo-noche text-xs font-bold uppercase tracking-wider">
              {t.packages.premium.tag}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-4 mt-2">
                <div>
                  <h3 className="text-2xl font-extrabold text-lumo-noche font-heading">
                    {t.packages.premium.title}
                  </h3>
                  <p className="text-xs font-semibold text-blue-700 mt-1">
                    {t.packages.premium.target}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-lumo-noche font-heading">
                    {t.packages.premium.price}
                  </span>
                  <span className="text-xs font-bold text-lumo-pizarra uppercase">USD montaje</span>
                </div>
                <div className="text-xs font-bold text-lumo-noche mt-1">
                  {t.packages.premium.priceDetail}
                </div>
                <div className="text-xs text-lumo-pizarra mt-0.5">
                  {t.packages.premium.monthly}
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-3 mb-8">
                {t.packages.premium.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-lumo-noche">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="#diagnostico"
              className="min-h-touch w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-white hover:bg-lumo-arena border-2 border-lumo-noche active:scale-95 text-lumo-noche font-bold text-sm shadow-xs transition-all text-center"
            >
              <span>{t.packages.premium.cta}</span>
              <ArrowRight className="w-4 h-4 text-lumo-ambar" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

