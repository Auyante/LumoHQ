'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  FileText,
  TrendingUp,
  PhoneCall,
  MessageSquare,
  MapPin,
  Star,
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Printer,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  retentionStore,
  MonthlyReportData,
  ChangeTicket,
} from '@/lib/retention';

export default function AdminRetencionPage() {
  const [reports, setReports] = useState<MonthlyReportData[]>(retentionStore.getMonthlyReports());
  const [tickets, setTickets] = useState<ChangeTicket[]>(retentionStore.getAllTickets());

  // Ticket creation modal state
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketClientId, setTicketClientId] = useState('cli_elrey_01');
  const [ticketBizName, setTicketBizName] = useState('El Rey Barbershop');
  const [ticketDesc, setTicketDesc] = useState('');
  const [isMajorWork, setIsMajorWork] = useState(false);

  const selectedReport = reports[0];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDesc) return;

    retentionStore.createTicket(ticketClientId, ticketBizName, ticketDesc, isMajorWork);
    setTickets([...retentionStore.getAllTickets()]);
    setIsCreatingTicket(false);
    setTicketDesc('');
    setIsMajorWork(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-12 flex flex-col antialiased">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Title */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-lumo-ambar" />
              <span>Retención Mensual · Fuente de Verdad: Documento 03 & Documento 04</span>
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-lumo-noche">
              Reporte Mensual en 1 Página & Gestor de Tickets
            </h1>
            <p className="text-xs text-lumo-pizarra mt-1">
              Las 7 métricas reales sin humo y control de los 2 cambios mensuales incluidos ($100/mes).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingTicket(true)}
            className="min-h-touch px-4 py-2 bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ticket de Cambio</span>
          </button>
        </div>

        {/* 1-PAGE MONTHLY CLIENT REPORT (THE 7 REAL METRICS) */}
        {selectedReport && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-lumo-niebla gap-3">
              <div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Reporte Mensual para Cliente
                </span>
                <h2 className="text-xl font-heading font-bold text-lumo-noche mt-1">
                  {selectedReport.businessName} — {selectedReport.month}
                </h2>
                <p className="text-xs text-lumo-pizarra">
                  Enviado el día 1 de cada mes como justificación del valor de la suscripción de $100/mes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-touch px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Exportar PDF</span>
              </button>
            </div>

            {/* The 7 Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
              {/* Metric 1 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border text-center">
                <PhoneCall className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-slate-500 block text-[11px]">1. Clics en Llamar</span>
                <strong className="text-xl text-lumo-noche block mt-1">
                  {selectedReport.metrics.callButtonClicks}
                </strong>
              </div>

              {/* Metric 2 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border text-center">
                <MessageSquare className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-slate-500 block text-[11px]">2. Clics Mensajes</span>
                <strong className="text-xl text-lumo-noche block mt-1">
                  {selectedReport.metrics.messageButtonClicks}
                </strong>
              </div>

              {/* Metric 3 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border text-center">
                <MapPin className="w-4 h-4 text-red-600 mx-auto mb-1" />
                <span className="text-slate-500 block text-[11px]">3. Cómo Llegar</span>
                <strong className="text-xl text-lumo-noche block mt-1">
                  {selectedReport.metrics.directionsClicks}
                </strong>
              </div>

              {/* Metric 4 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border text-center">
                <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="text-slate-500 block text-[11px]">4. Visitas Web</span>
                <strong className="text-xl text-lumo-noche block mt-1">
                  {selectedReport.metrics.websiteViews}
                </strong>
              </div>

              {/* Metric 5 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border text-center col-span-2 sm:col-span-1">
                <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="text-slate-500 block text-[11px]">5. Búsquedas</span>
                <strong className="text-xs text-lumo-noche block mt-2 font-bold leading-tight">
                  {selectedReport.metrics.directVsDiscoveryRatio}
                </strong>
              </div>

              {/* Metric 6 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border text-center">
                <Star className="w-4 h-4 text-lumo-ambar mx-auto mb-1" />
                <span className="text-slate-500 block text-[11px]">6. Nuevas Reseñas</span>
                <strong className="text-xl text-lumo-noche block mt-1">
                  +{selectedReport.metrics.newReviewsCount}
                </strong>
              </div>

              {/* Metric 7 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border text-center">
                <Star className="w-4 h-4 text-yellow-500 mx-auto mb-1 fill-yellow-400" />
                <span className="text-slate-500 block text-[11px]">7. Promedio</span>
                <strong className="text-xl text-lumo-noche block mt-1">
                  {selectedReport.metrics.averageRating} / 5.0
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY CHANGE TICKETS MANAGER */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-heading font-bold text-lumo-noche flex items-center gap-2">
                <Clock className="w-5 h-5 text-lumo-ambar" />
                Gestor de Tickets de Cambios Mensuales
              </h2>
              <p className="text-xs text-lumo-pizarra mt-0.5">
                Regla comercial: 2 pequeños cambios incluidos al mes (&lt;30 min). El 3er cambio se factura a $25 USD. Trabajos mayores desde $75 USD.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lumo-noche text-sm">{t.businessName}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        t.cost === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.cost === 0 ? 'Incluido ($0 USD)' : `Facturable: $${t.cost} USD`}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{t.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Est: {t.estimatedMinutes} min</span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                      t.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status === 'COMPLETED' ? 'Completado' : 'En Progreso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {isCreatingTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTicket}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl text-xs"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-base font-heading font-bold text-lumo-noche">
                Nuevo Ticket de Cambio de Cliente
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingTicket(false)}
                className="text-slate-400 hover:text-lumo-noche p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-lumo-noche mb-1">Negocio del Cliente</label>
              <input
                type="text"
                disabled
                value={ticketBizName}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-lumo-noche mb-1">
                Descripción del Cambio Solicitado *
              </label>
              <textarea
                required
                rows={3}
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                placeholder="Ej: Modificar el precio del servicio de barba de $25 a $30..."
                className="w-full px-3 py-2 rounded-xl border border-lumo-niebla outline-none"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isMajorWork}
                onChange={(e) => setIsMajorWork(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
              />
              <span>
                <strong>¿Es un trabajo mayor? (&gt;30 minutos)</strong>
                <span className="block text-[11px] text-slate-500">
                  Aplica tarifa mínima de $75 USD sujeta a cotización previa.
                </span>
              </span>
            </label>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingTicket(false)}
                className="min-h-touch px-4 py-2 font-bold text-slate-600 hover:text-lumo-noche"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-touch px-6 py-2 bg-lumo-ambar text-lumo-noche font-bold rounded-xl shadow-sm hover:bg-lumo-brillo"
              >
                Crear Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

