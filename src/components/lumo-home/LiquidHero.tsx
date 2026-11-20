'use client';

/**
 * Hero built from catalog pieces, all reacting to the visitor:
 * 14 Velaris living gradient (WebGL, Atardecer palette) · 21a magnetic starfield ·
 * 13 cursor spotlight · 19 rotating headline · 06a liquid glass buttons.
 */
import { ArrowRight } from 'lucide-react';
import Velaris from '@/components/ui/velaris';
import { Starfield } from '@/components/ui/starfield';
import { Spotlight } from '@/components/ui/spotlight';
import { Hero } from '@/components/ui/animated-hero';
import { LiquidButton, LiquidDefs } from '@/components/ui/liquid-button';
import type { HomeCopy } from './copy';

/** Velaris palettes from the lab, the brand one first. */
export const MOODS = [
  { id: 'ambar', bg: '#0d111b', colors: ['#FFD27A', '#F2A33A', '#1B2130', '#5B6375'], es: 'Ámbar', en: 'Amber' },
  { id: 'atardecer', bg: '#1a0c0a', colors: ['#fecaca', '#fb7185', '#9a3412', '#fde68a'], es: 'Atardecer', en: 'Sunset' },
  { id: 'violeta', bg: '#05030c', colors: ['#c4b5fd', '#8b5cf6', '#312e81', '#0ea5e9'], es: 'Violeta', en: 'Violet' },
  { id: 'menta', bg: '#020806', colors: ['#86efac', '#4ade80', '#059669', '#0d111b'], es: 'Menta', en: 'Mint' },
] as const;

/** The page's final palette, chosen by the owner on 2026-11-10. */
export const MOOD = MOODS[1];

export function LiquidHero({ t }: { t: HomeCopy }) {
  const m = MOOD;
  return (
    <section className="dark relative" aria-label={t.heroPrefix}>
      <LiquidDefs />
      <Velaris bg={m.bg} colors={[...m.colors]} height="calc(100svh - 4rem)" speed={1} className="min-h-[640px]">
        {/* Interaction layers: stars lean toward the pointer, a warm light follows it. */}
        <Starfield className="text-white/70" count={170} radius={420} pull={0.45} seed={5} />
        <Spotlight size={460} className="z-0" color="from-[#FFD27A]/35 via-[#F2A33A]/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(closest-side at 50% 50%, rgba(10,12,18,0.55), rgba(10,12,18,0) 100%)' }} aria-hidden />
        <div className="relative z-10 flex h-full flex-col items-center justify-center [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]">
          <Hero
            badge={{ label: t.heroBadge, href: '#diagnostico' }}
            prefix={t.heroPrefix}
            words={t.heroWords}
            description={t.heroLede2}
            interval={2200}
            wordClassName="text-[#FFD27A] font-extrabold"
            className="[&_h1]:font-heading [&_h1]:font-extrabold [&_h1]:text-[#FFF7EC] [&_p]:text-[#E6E8EE] [&_.lq-btn]:[text-shadow:none]"
            actions={
              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                <LiquidButton href="#precios">{t.heroSecondary}</LiquidButton>
                <LiquidButton href="#diagnostico" tone="amber">{t.heroCta}<ArrowRight className="size-4" aria-hidden /></LiquidButton>
              </div>
            }
          />
        </div>
      </Velaris>
    </section>
  );
}
