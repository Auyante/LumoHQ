'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, QrCode, Copy, Check, Download, ShieldCheck } from 'lucide-react';
import type { Locale } from '@/lib/types';

interface ReviewQrCardProps {
  businessName: string;
  shortLink: string;
  rating: number;
  reviewCount: number;
  locale: Locale;
}

export function ReviewQrCard({
  businessName,
  shortLink,
  rating,
  reviewCount,
  locale,
}: ReviewQrCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-3xl bg-white border border-lumo-niebla p-6 sm:p-8 shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-lumo-niebla pb-4">
        <div>
          <span className="text-xs font-bold text-lumo-ambar uppercase tracking-wider block">
            {locale === 'es' ? 'SISTEMA DE RESEÑAS EN MOSTRADOR' : 'IN-STORE REVIEW SYSTEM'}
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-lumo-noche font-heading">
            {locale === 'es' ? 'Kit Físico QR para Mostrador' : 'Physical QR Countertop Kit'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{locale === 'es' ? '100% Cumplimiento FTC' : '100% FTC Compliant'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* QR Sticker Visual Mockup */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-lumo-arena/60 border border-lumo-niebla text-center">
          <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-md border-2 border-lumo-noche bg-white mb-3">
            <Image
              src="/images/sticker_resenas_1200x1200.png"
              alt="Sticker QR Reseñas Google"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 240px"
            />
          </div>
          <span className="text-[11px] font-bold text-lumo-pizarra">
            {locale === 'es' ? 'Sticker impreso 1200x1200px listo para caja' : 'Printed 1200x1200px sticker ready for register'}
          </span>
        </div>

        {/* Instructions & Short Link */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-extrabold text-sm text-lumo-noche">
              {rating.toFixed(1)} ({reviewCount} {locale === 'es' ? 'reseñas de clientes reales' : 'real customer reviews'})
            </span>
          </div>

          <p className="text-xs sm:text-sm text-lumo-pizarra leading-relaxed">
            {locale === 'es'
              ? 'Tus clientes apuntan con la cámara de su teléfono al sticker de acrílico en el mostrador y se les abre directamente la pantalla de 5 estrellas en Google Maps en 2 segundos.'
              : 'Customers point their phone camera at the acrylic counter sticker and Google Maps review screen opens in 2 seconds.'}
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-lumo-pizarra">
              {locale === 'es' ? 'Enlace corto oficial de Google:' : 'Official Google short link:'}
            </span>
            <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300">
              <span className="text-xs font-mono text-lumo-noche truncate">{shortLink}</span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="min-h-touch min-w-touch flex items-center gap-1 px-2.5 py-1 rounded-md bg-lumo-arena hover:bg-lumo-niebla text-xs font-bold text-lumo-noche transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
            <strong>Regla FTC:</strong> Nunca se ofrecen descuentos ni regalos a cambio de reseñas. El sticker facilita que tus clientes satisfechos opinen de forma natural y auténtica.
          </div>
        </div>
      </div>
    </div>
  );
}

