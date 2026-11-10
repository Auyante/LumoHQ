'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { CheckCircle2, Sparkles, ArrowRight, Building2 } from 'lucide-react';
import { PRICING_CONSTANTS } from '@/lib/stripe';

interface ProposalPageProps {
  params: Promise<{ id: string }>;
}

export default function ProposalPage({ params }: ProposalPageProps) {
  const unwrappedParams = use(params);
  const proposalId = unwrappedParams.id;

  // Mock demo or lead-derived proposal details
  const isFounderOffer = !proposalId.includes('regular');
  const businessName = proposalId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Tu Negocio';

  const setupPrice = isFounderOffer ? PRICING_CONSTANTS.FOUNDER_SETUP : PRICING_CONSTANTS.REGULAR_SETUP;
  const depositPrice = isFounderOffer ? PRICING_CONSTANTS.FOUNDER_DEPOSIT : PRICING_CONSTANTS.REGULAR_DEPOSIT;
  const finalPrice = isFounderOffer ? PRICING_CONSTANTS.FOUNDER_FINAL : PRICING_CONSTANTS.REGULAR_FINAL;

  return (
    <div className="min-h-screen bg-slate-50 text-lumo-noche py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-4 border-b border-lumo-niebla">
          <Link href="/" className="font-heading font-extrabold text-xl tracking-tight text-lumo-noche">
            LUMO<span className="text-lumo-ambar">HQ</span>
          </Link>
          <span className="text-xs font-bold text-lumo-pizarra bg-slate-200 px-3 py-1 rounded-full">
            Propuesta Exclusiva · Midland-Odessa
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-lumo-niebla relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-lumo-ambar" />
            <span>Propuesta de Presencia Local & Conversión</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-lumo-noche">
            Propuesta para {businessName}
          </h1>
          <p className="text-sm text-lumo-pizarra mt-2">
            Preparada por Luis Barbera (Lumo HQ). Diseñada para que las personas que busquen tus servicios en Google en Midland-Odessa te encuentren de inmediato y te llamen o escriban en un solo clic.
          </p>
        </div>

        {/* What was diagnosed */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-lumo-niebla space-y-4">
          <h2 className="text-lg font-heading font-bold text-lumo-noche flex items-center gap-2">
            <Building2 className="w-5 h-5 text-lumo-ambar" />
            Diagnóstico de Oportunidad Detectado
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900">
              <p className="font-bold mb-1">Situación Actual:</p>
              <ul className="space-y-1 list-disc list-inside text-red-800">
                <li>Clientes batallan para encontrar tu número directo.</li>
                <li>Página lenta o inexistente desde teléfonos móviles.</li>
                <li>Pocas reseñas en Google respecto a tu clientela real.</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <p className="font-bold mb-1">Con el Sistema Lumo HQ:</p>
              <ul className="space-y-1 list-disc list-inside text-emerald-800">
                <li>Botones fijos de Llamada, SMS y WhatsApp en 1 toque.</li>
                <li>Web rápida optimizada que carga en menos de 1.5s.</li>
                <li>Kit físico con código QR para acumular reseñas reales.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-lumo-niebla space-y-4">
          <h2 className="text-lg font-heading font-bold text-lumo-noche">
            Todo lo Incluido en la Entrega (5 Días Hábiles)
          </h2>
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Optimización Total de Google Business:</strong> Horarios, categoría correcta, área de servicio en Midland-Odessa y fotos de alta calidad.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Página Web Transaccional de 1 Página:</strong> Creada con tu identidad visual, rápida, bilingüe y 100% responsiva para celulares.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Canal Extra Integrado:</strong> Sistema de reservas online o WhatsApp automatizado configurado a la medida.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Kit Físico de Reseñas:</strong> Tarjeta con código QR directo y sticker para tu mostrador para que clientes satisfechos te califiquen.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Garantía Cero Contraseñas:</strong> No te pedimos contraseñas personales; todo se gestiona con invitación de administrador.</span>
            </div>
          </div>
        </div>

        {/* Investment & 50/50 Payment Schedule */}
        <div className="bg-amber-50 rounded-3xl p-6 sm:p-8 border border-lumo-ambar/40 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-full">
                {isFounderOffer ? 'Precio Exclusivo Cliente Fundador' : 'Inversión de Montaje'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-lumo-noche mt-2">
                ${setupPrice} USD <span className="text-xs font-normal text-lumo-pizarra">montaje completo</span>
              </h3>
            </div>
            <div className="text-right text-xs">
              <span className="text-lumo-pizarra">Mantenimiento mensual:</span>
              <p className="font-bold text-lumo-noche text-sm">$100/mes (+ tax)</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-emerald-800">
              <span>1. Anticipo al firmar contrato hoy (50%):</span>
              <span>${depositPrice} USD</span>
            </div>
            <div className="flex justify-between text-lumo-pizarra">
              <span>2. Pago final al aprobar tu web en 5 días (50%):</span>
              <span>${finalPrice} USD</span>
            </div>
          </div>

          <p className="text-[11px] text-lumo-pizarra italic">
            * Protección total: si no estás 100% satisfecho con la vista previa de tu web en el Día 5, no pagas el 50% final.
          </p>

          <div className="pt-2">
            <Link
              href={`/checkout?package=${isFounderOffer ? 'FOUNDER' : 'BASE'}&biz=${encodeURIComponent(
                businessName
              )}`}
              className="min-h-touch min-w-touch w-full py-4 bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-heading font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-base"
            >
              <span>Aceptar Propuesta y Firmar Contrato Digital</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-lumo-pizarra space-y-1">
          <p>Lumo HQ · Luis Barbera (Midland, TX) · (432) 200-8800</p>
          <p className="text-[11px] text-slate-400">
            Conforme a las directrices de la FTC y la ley TCPA. Sin falsas promesas.
          </p>
        </div>
      </div>
    </div>
  );
}

