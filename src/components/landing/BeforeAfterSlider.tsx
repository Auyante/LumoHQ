'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { Sparkles, ArrowLeftRight, Check, X, Star } from 'lucide-react';

export function BeforeAfterSlider() {
  const { locale } = useI18n();
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current) return;
      handleMove(e.touches[0].clientX);
    },
    [handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    },
    [handleMove]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <section className="py-16 md:py-24 bg-white border-b border-lumo-niebla">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-arena border border-lumo-niebla text-lumo-noche text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-lumo-ambar" />
            <span>{locale === 'es' ? 'RESULTADO VERIFICABLE' : 'VERIFIED RESULTS'}</span>
          </div>
          <h2 className="text-fluid-h2 text-lumo-noche mb-4">
            {locale === 'es' ? 'El "Antes y Después" en Midland-Odessa' : 'The "Before and After" in Midland-Odessa'}
          </h2>
          <p className="text-base sm:text-lg text-lumo-pizarra">
            {locale === 'es'
              ? 'Desliza el control táctil para comparar cómo luce un negocio sin optimizar frente al estándar entregado por Lumo HQ.'
              : 'Slide the touch handle to compare an unoptimized business listing versus the professional Lumo HQ standard.'}
          </p>

          {/* Quick preset toggle buttons for mobile & fast comparison */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => setSliderPosition(100)}
              className={`min-h-touch px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                sliderPosition > 70
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-lumo-arena border border-lumo-niebla text-lumo-pizarra hover:text-lumo-noche'
              }`}
            >
              {locale === 'es' ? 'Ver Estado Inicial (Antes)' : 'View Initial State (Before)'}
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(50)}
              className={`min-h-touch px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                sliderPosition >= 30 && sliderPosition <= 70
                  ? 'bg-lumo-noche text-white shadow-xs'
                  : 'bg-lumo-arena border border-lumo-niebla text-lumo-pizarra hover:text-lumo-noche'
              }`}
            >
              {locale === 'es' ? 'Comparar 50/50' : 'Compare 50/50'}
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(0)}
              className={`min-h-touch px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                sliderPosition < 30
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-lumo-arena border border-lumo-niebla text-lumo-pizarra hover:text-lumo-noche'
              }`}
            >
              {locale === 'es' ? 'Ver Con Lumo HQ (Después)' : 'View With Lumo HQ (After)'}
            </button>
          </div>
        </div>

        {/* Comparison Container */}
        <div
          ref={containerRef}
          onMouseDown={() => (isDragging.current = true)}
          onTouchStart={() => (isDragging.current = true)}
          style={{ touchAction: 'pan-y' }}
          className="relative w-full min-h-[640px] sm:min-h-[490px] h-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-lumo-noche select-none cursor-ew-resize pb-8"
        >
          {/* AFTER (Full background) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B2130] to-[#252E42] text-white p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/40">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{locale === 'es' ? 'DESPUÉS: CON LUMO HQ' : 'AFTER: WITH LUMO HQ'}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mb-2">
                Barbería Los Compadres · Midland, TX
              </h3>
              <p className="text-sm text-lumo-brillo font-bold mb-4 flex items-center">
                <Star className="w-4 h-4 text-lumo-ambar fill-lumo-ambar inline-block mr-1 shrink-0" />
                <span>4.9 (48 reseñas) · Abierto ahora · Enlace web oficial</span>
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-200 max-w-md">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lumo-ambar shrink-0" />
                  <span>Perfil de Google al 100% con horarios, servicios y fotos HD</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lumo-ambar shrink-0" />
                  <span>Página web bilingüe con botón de llamada y reservas en 1 toque</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lumo-ambar shrink-0" />
                  <span>Sticker QR de mostrador capturando reseñas de clientes reales</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lumo-ambar shrink-0" />
                  <span>Cero llamadas perdidas · Reporte mensual transparente</span>
                </li>
              </ul>
            </div>
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs text-xs text-emerald-300 font-semibold flex items-center gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{locale === 'es' ? 'Resultado: Clientes nuevos llamando y reservando cada semana' : 'Result: New customers calling and booking every week'}</span>
            </div>
          </div>

          {/* BEFORE (Clipped on top) */}
          <div
            className="absolute inset-0 bg-slate-100 text-slate-800 p-6 sm:p-10 flex flex-col justify-between overflow-hidden"
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-4 border border-red-200">
                <X className="w-3.5 h-3.5 stroke-[3]" />
                <span>{locale === 'es' ? 'ANTES: DESATENDIDO' : 'BEFORE: UNATTENDED'}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mb-2">
                Barbería Los Compadres
              </h3>
              <p className="text-sm text-red-600 font-bold mb-4">
                Sin horario disponible · Sin página web · Sin botón de llamada
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 max-w-md">
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <span>3 reseñas viejas de hace 8 meses sin responder</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Solo 2 fotos oscuras subidas por clientes</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Teléfono desactualizado o sin botón de llamada</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Los clientes que buscan en Google se van con la competencia</span>
                </li>
              </ul>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2 mt-6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span>{locale === 'es' ? 'Diagnóstico inicial: 7 de 8 señales de alerta detectadas' : 'Initial audit: 7 of 8 warning signals detected'}</span>
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-lumo-ambar z-30"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-lumo-ambar text-lumo-noche shadow-xl flex items-center justify-center border-2 border-white ring-4 ring-black/20">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Helper subtitle below slider */}
        <p className="text-center text-xs text-lumo-pizarra mt-4 italic">
          {locale === 'es' ? '← Arrastra hacia la izquierda o derecha →' : '← Drag left or right →'}
        </p>
      </div>
    </section>
  );
}

