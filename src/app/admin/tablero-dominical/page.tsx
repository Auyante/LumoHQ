'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Users,
  ShieldAlert,
  Smartphone,
  ChevronRight,
  Edit3,
  Plus,
  Minus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  SUNDAY_MILESTONES,
  evaluateRisk1Alert,
  WeeklyTeamHours,
} from '@/lib/sunday-dashboard';

export default function SundayDashboardPage() {
  const [selectedMilestone, setSelectedMilestone] = useState<14 | 30 | 60 | 90>(14);

  // Current weekly hours tracking
  const [currentWeekHours, setCurrentWeekHours] = useState<WeeklyTeamHours>({
    weekNumber: 2,
    luisHours: 9.5,
    carlosHours: 16.0,
    barbaraHours: 5.0,
    contactsThisWeek: 14,
    notes: 'Buen ritmo en Lote 1 de Midland. Visitas presenciales completadas.',
  });

  // Actual Metrics (Live editable)
  const [actualMetrics, setActualMetrics] = useState({
    contacts: 30,
    diagnoses: 12,
    meetings: 4,
    closedClients: 2,
    mrr: 0,
  });

  const [editingMetric, setEditingMetric] = useState<{
    key: keyof typeof actualMetrics;
    label: string;
    value: number;
  } | null>(null);

  const risk1 = evaluateRisk1Alert(currentWeekHours);
  const activeMilestoneTarget = SUNDAY_MILESTONES.find((m) => m.day === selectedMilestone)!;

  const metricCards = [
    {
      key: 'contacts' as const,
      label: 'Contactos Realizados',
      current: actualMetrics.contacts,
      target: activeMilestoneTarget.targetContacts,
      unit: 'contactos',
      color: 'bg-amber-500',
    },
    {
      key: 'diagnoses' as const,
      label: 'Diagnósticos 24h',
      current: actualMetrics.diagnoses,
      target: activeMilestoneTarget.targetDiagnoses,
      unit: 'diagnósticos',
      color: 'bg-purple-500',
    },
    {
      key: 'meetings' as const,
      label: 'Reuniones 15 Min',
      current: actualMetrics.meetings,
      target: activeMilestoneTarget.targetMeetings,
      unit: 'reuniones',
      color: 'bg-blue-500',
    },
    {
      key: 'closedClients' as const,
      label: 'Clientes Cerrados',
      current: actualMetrics.closedClients,
      target: activeMilestoneTarget.targetClosedClients,
      unit: 'clientes',
      color: 'bg-emerald-500',
    },
    {
      key: 'mrr' as const,
      label: 'MRR Recurrente',
      current: actualMetrics.mrr,
      target: activeMilestoneTarget.targetMrr,
      unit: 'USD/mes',
      isCurrency: true,
      color: 'bg-indigo-500',
    },
  ];

  const handleUpdateMetric = (delta: number) => {
    if (!editingMetric) return;
    const newVal = Math.max(0, editingMetric.value + delta);
    setEditingMetric({ ...editingMetric, value: newVal });
    setActualMetrics((prev) => ({ ...prev, [editingMetric.key]: newVal }));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-16 flex flex-col antialiased">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6 grow w-full">
        {/* Title Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 mb-2">
              <Calendar className="w-3.5 h-3.5 text-lumo-ambar" />
              <span>GOBERNANZA & GATES · DOCUMENTO 04 SECCIÓN 4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-lumo-noche">
              Revisión Semanal de 15 Minutos (Domingos)
            </h1>
            <p className="text-xs sm:text-sm text-lumo-pizarra mt-1">
              Luis Barbera & Carlos Gómez · Comparativa Objetivo vs Real y Vigilancia Estricta de Horas.
            </p>
          </div>

          <div className="text-xs text-lumo-pizarra bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
            Próxima revisión: <strong className="text-lumo-noche">Este Domingo 8:00 PM CST</strong>
          </div>
        </div>

        {/* 1. TOP METRICS IN 3 CARDS (grid-cols-1 sm:grid-cols-3 gap-4) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Gate 0 Hours Status */}
          <div className="bg-white rounded-2xl p-5 border border-lumo-niebla shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-lumo-pizarra">
                Compromiso de Horas (Gate 0)
              </span>
              <span className="p-2 bg-emerald-50 rounded-xl">
                <Clock className="w-4 h-4 text-emerald-600" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">{risk1.totalHours}h</span>
                <span className="text-xs text-lumo-pizarra font-bold">/ 18h mínimas semanales</span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                Umbral mínimo cumplido (Luis {currentWeekHours.luisHours}h + Carlos {currentWeekHours.carlosHours}h)
              </p>
            </div>
          </div>

          {/* Card 2: Risk #1 Alert Monitor */}
          <div
            className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between ${
              risk1.isAlertActive
                ? 'bg-red-50 border-red-200 text-red-950'
                : 'bg-white border-lumo-niebla text-lumo-noche'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-lumo-pizarra">
                Monitor de Riesgo #1
              </span>
              <span className={`p-2 rounded-xl ${risk1.isAlertActive ? 'bg-red-100' : 'bg-emerald-50'}`}>
                {risk1.isAlertActive ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black">
                  {risk1.isAlertActive ? 'Alerta Activa' : 'Ritmo Sano'}
                </span>
                <span className="text-xs text-lumo-pizarra">({currentWeekHours.contactsThisWeek} contactos)</span>
              </div>
              <p className="text-xs text-lumo-pizarra mt-1">
                {risk1.isAlertActive
                  ? risk1.reasons[0]
                  : 'Bárbara (5h) + Luis y Carlos en ritmo operativo nominal.'}
              </p>
            </div>
          </div>

          {/* Card 3: Fortnightly eSIM Maintenance */}
          <div className="bg-white rounded-2xl p-5 border border-lumo-niebla shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-lumo-pizarra">
                eSIM & WhatsApp Boost
              </span>
              <span className="p-2 bg-amber-50 rounded-xl">
                <Smartphone className="w-4 h-4 text-lumo-ambar" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-900">Activo / Al Día</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Mantenimiento quincenal de recargas y proxy SMS activo para Midland-Odessa.
              </p>
            </div>
          </div>
        </div>

        {/* 2. MILESTONE BUTTONS (H1 a H4) IN grid-cols-2 sm:flex gap-2 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-black text-lumo-noche flex items-center gap-2">
                <Target className="w-5 h-5 text-lumo-ambar" />
                <span>Comparativa Semanal: Objetivo vs Real por Hito</span>
              </h2>
              <p className="text-xs text-lumo-pizarra mt-0.5">
                Evaluación directa contra los acuerdos de Gate del Documento 02 y Documento 04.
              </p>
            </div>

            {/* Responsive Milestone Selector: grid-cols-2 sm:flex gap-2 */}
            <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
              {[
                { day: 14 as const, label: 'H1: Día 14' },
                { day: 30 as const, label: 'H2: Día 30' },
                { day: 60 as const, label: 'H3: Día 60' },
                { day: 90 as const, label: 'H4: Día 90' },
              ].map((m) => (
                <button
                  key={m.day}
                  type="button"
                  onClick={() => setSelectedMilestone(m.day)}
                  className={`min-h-touch px-4 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 ${
                    selectedMilestone === m.day
                      ? 'bg-lumo-noche text-white shadow-xs ring-2 ring-lumo-ambar'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900">
            Hito Seleccionado: {activeMilestoneTarget.name}
          </div>

          {/* 3. THE 5 METRIC CARDS (grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {metricCards.map((card) => {
              const percentage = Math.min(100, Math.round((card.current / (card.target || 1)) * 100));
              return (
                <div
                  key={card.key}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-600 leading-tight">
                      {card.label}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingMetric({
                          key: card.key,
                          label: card.label,
                          value: card.current,
                        })
                      }
                      className="p-1.5 text-gray-400 hover:text-lumo-noche rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Editar métrica en vivo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-lumo-noche">
                        {card.isCurrency ? `$${card.current}` : card.current}
                      </span>
                      <span className="text-xs text-lumo-pizarra font-semibold">
                        / {card.isCurrency ? `$${card.target}` : card.target} meta
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`${card.color} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-bold">
                      <span>Progreso</span>
                      <span>{percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Quick Edit Metric Modal */}
      {editingMetric && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-lumo-niebla shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-lumo-niebla">
              <h3 className="font-heading font-black text-sm text-lumo-noche">
                Ajustar Métrica: {editingMetric.label}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMetric(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 py-4">
              <button
                type="button"
                onClick={() => handleUpdateMetric(-1)}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-lumo-noche font-black text-xl flex items-center justify-center transition-transform active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center">
                <span className="text-3xl font-black text-lumo-noche block">
                  {editingMetric.value}
                </span>
                <span className="text-[10px] text-lumo-pizarra uppercase font-bold">Valor Actual</span>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateMetric(1)}
                className="w-12 h-12 rounded-2xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xl flex items-center justify-center transition-transform active:scale-95 shadow-xs"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditingMetric(null)}
              className="w-full min-h-touch py-3 rounded-xl bg-lumo-noche text-white font-black text-xs transition-transform active:scale-95"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
