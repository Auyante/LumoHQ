'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Printer,
  ArrowLeft,
  Sparkles,
  Phone,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import type { ProspectItem } from '@/lib/crm';

const SIGNAL_LABELS = [
  { key: 'scoreReviews', label: 'Menos de 20 reseñas, o la última tiene más de 3 meses' },
  { key: 'scoreWebsite', label: 'Sin página web, o rota o desactualizada' },
  { key: 'scorePhotos', label: 'Fotos viejas, pocas o ninguna en Google Maps' },
  { key: 'scoreHours', label: 'Horario comercial vacío o incompleto' },
  { key: 'scoreDescription', label: 'Sin descripción clara o categorías mal puestas' },
  { key: 'scoreReviewResponse', label: 'Reseñas de clientes sin respuesta del dueño' },
  { key: 'scoreBooking', label: 'Sin botón directo para reservar citas o pedir por WhatsApp' },
  { key: 'scoreSpanish', label: 'Atiende a clientela en español pero su perfil está en inglés genérico' },
];

export default function DiagnosticoImprimiblePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const leadId = unwrappedParams.id;
  const [lead, setLead] = useState<ProspectItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLead() {
      try {
        const res = await fetch('/api/crm/prospects');
        if (res.ok) {
          const data = await res.json();
          const found = data.prospects?.find((p: ProspectItem) => p.id === leadId);
          if (found) {
            setLead(found);
          } else {
            // Sample fallback if ID not found
            setLead({
              id: leadId,
              businessName: 'Negocio Local Evaluado',
              ownerName: 'Dueño del Negocio',
              phone: '+1 (432) 555-0100',
              city: 'Midland',
              category: 'Servicios Locales',
              stage: 'DIAGNOSED',
              priority: 'P1',
              batchNumber: 1,
              source: 'BARBARA',
              followUpCount: 1,
              totalScore: 5,
              signals: {
                scoreReviews: true,
                scoreWebsite: true,
                scorePhotos: true,
                scoreHours: false,
                scoreDescription: true,
                scoreReviewResponse: false,
                scoreBooking: true,
                scoreSpanish: true,
              },
              createdAt: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Error fetching lead diagnosis:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [leadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm font-bold text-lumo-noche">
        Generando Ficha de Diagnóstico Oficial...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <p className="text-sm text-red-600 font-bold mb-4">No se encontró el prospecto.</p>
        <Link href="/admin/crm" className="px-4 py-2 bg-lumo-noche text-white rounded-xl text-xs font-bold">
          Volver al CRM
        </Link>
      </div>
    );
  }

  const estimatedLostMonthly = (lead.totalScore || 4) * 350;

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche py-6 px-4 sm:px-6 print:bg-white print:p-0 print:text-black">
      {/* Non-print Top Controls */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/admin/crm"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-lumo-pizarra hover:text-lumo-noche min-h-[36px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al CRM</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lumo-noche text-white font-bold text-xs hover:bg-slate-800 transition-transform active:scale-95 shadow-sm"
          >
            <Printer className="w-4 h-4 text-lumo-ambar" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>
      </div>

      {/* 1-PAGE PRINTABLE AUDIT SHEET */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-lumo-niebla print:border-none print:shadow-none print:p-6 print:rounded-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-lumo-niebla gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading font-black text-2xl tracking-tight text-lumo-noche">
                LUMO<span className="text-lumo-ambar">HQ</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-lumo-arena px-2 py-0.5 rounded border border-lumo-niebla">
                Midland-Odessa, Texas
              </span>
            </div>
            <h1 className="text-lg font-black font-heading text-lumo-noche">
              Ficha Oficial de Diagnóstico de Presencia Digital
            </h1>
            <p className="text-xs text-lumo-pizarra">
              Auditoría confidencial basada en el Estándar Operativo Lumo HQ (Documento 03)
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-lumo-pizarra space-y-0.5">
            <div>
              Fecha: <strong className="text-lumo-noche">{new Date().toLocaleDateString('es-US')}</strong>
            </div>
            <div>
              ID Auditoría: <span className="font-mono">{lead.id}</span>
            </div>
            <div>
              Consultor: <strong className="text-lumo-noche">Luis Barbera / Bárbara</strong>
            </div>
          </div>
        </div>

        {/* Business Info Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 p-4 rounded-2xl bg-amber-50/50 border border-lumo-ambar/30">
          <div>
            <span className="text-[10px] font-bold text-lumo-pizarra uppercase block">Negocio Auditado</span>
            <span className="text-base font-black text-lumo-noche block">{lead.businessName}</span>
            <span className="text-xs text-slate-600">{lead.category}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-lumo-pizarra uppercase block">Dueño / Responsable</span>
            <span className="text-sm font-bold text-lumo-noche block">{lead.ownerName || 'Dueño General'}</span>
            <span className="text-xs text-slate-600">{lead.phone}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-lumo-pizarra uppercase block">Ubicación</span>
            <span className="text-sm font-bold text-lumo-noche block">{lead.city}, Texas</span>
            <span className="text-xs text-emerald-700 font-bold">Mercado Local Petrolero</span>
          </div>
        </div>

        {/* 8 Signals Checklist */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-lumo-noche">
              Resultado de las 8 Señales de Calificación (Documento 03):
            </h2>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-lumo-arena border border-lumo-niebla text-lumo-noche">
              Puntaje: {lead.totalScore} / 8 Señales Críticas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SIGNAL_LABELS.map((item, idx) => {
              const hasIssue = Boolean((lead.signals as any)[item.key]);
              return (
                <div
                  key={item.key}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    hasIssue
                      ? 'bg-red-50/50 border-red-200 text-red-900'
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {hasIssue ? (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {idx + 1}. {hasIssue ? 'Problema Detectado' : 'Correcto / Optimizado'}
                    </span>
                    <span className="text-[11px] leading-tight text-slate-700">{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Impact & Solution Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-2">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Impacto Financiero Estimado</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-700">~${estimatedLostMonthly}</span>
              <span className="text-xs text-red-600 font-bold">USD / mes</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              Pérdida estimada en nuevos clientes que buscan en Google Maps pero llaman o visitan al competidor mejor posicionado.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Solución Inmediata Recomendada</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800">Paquete Base 50/50</span>
              <span className="text-xs text-emerald-600 font-bold">($500 USD)</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Perfil Google optimizado + Web rápida de 1 clic + QR físico para reseñas. Anticipo del 50% ($250) y saldo solo tras aprobación final.
            </p>
          </div>
        </div>

        {/* Printable Footer / Signoff */}
        <div className="pt-6 border-t border-lumo-niebla flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-lumo-pizarra gap-4">
          <div className="space-y-1">
            <span className="font-bold text-lumo-noche block">Lumo HQ · &ldquo;Negocios Locales, Visibles&rdquo;</span>
            <span>Midland-Odessa, Texas · Tel: +1 (432) 200-LUMO · info@lumohq.com</span>
          </div>

          <div className="print:hidden">
            <Link
              href={`/checkout?business=${encodeURIComponent(lead.businessName)}&phone=${encodeURIComponent(
                lead.phone
              )}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs shadow-md transition-all active:scale-95"
            >
              <span>Proceder al Contrato & Anticipo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

