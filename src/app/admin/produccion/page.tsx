'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  Layers,
  CheckCircle2,
  Clock,
  PauseCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Building2,
  FileText,
} from 'lucide-react';
import { clientProjectStore, ClientProject } from '@/lib/client-portal';

export default function AdminProduccionPage() {
  const [projects, setProjects] = useState<ClientProject[]>(clientProjectStore.getAll());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleToggleTask = (taskKey: keyof ClientProject['productionTasks']) => {
    if (!selectedProject) return;
    const current = selectedProject.productionTasks[taskKey];
    selectedProject.productionTasks[taskKey] = !current;
    clientProjectStore.save(selectedProject);
    setProjects([...clientProjectStore.getAll()]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-12 flex flex-col antialiased">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Title */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 mb-2">
              <Layers className="w-3.5 h-3.5 text-lumo-ambar" />
              <span>Operaciones de Montaje · Carlos Gómez (Técnico) & Luis Barbera</span>
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-lumo-noche">
              Línea de Producción de 5 Días Hábiles
            </h1>
            <p className="text-xs text-lumo-pizarra mt-1">
              Garantía de entrega en 5 días: Ningún reloj inicia sin 50% acreditado y datos del Día 1 completos.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-bold block">CLIENTES EN LÍNEA:</span>
            <span className="text-2xl font-extrabold text-lumo-noche">{projects.length} negocios</span>
          </div>
        </div>

        {/* Client Selector & Production Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Client List */}
          <div className="bg-white rounded-3xl p-4 border border-lumo-niebla shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-lumo-pizarra uppercase tracking-wider px-2">
              Negocios en Pipeline
            </h3>
            <div className="space-y-2">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                    selectedProjectId === proj.id
                      ? 'border-lumo-ambar bg-amber-50/50 shadow-sm ring-1 ring-lumo-ambar'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-lumo-noche">{proj.businessName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        proj.clock.isPaused
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {proj.clock.isPaused ? 'Pausado' : `Día ${proj.clock.currentDay}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {proj.city}, TX · Paquete: {proj.packageType}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: 5-Day Tasks for Selected Client */}
          {selectedProject && (
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-lumo-niebla">
                <div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    {selectedProject.packageType} · {selectedProject.extraChannel}
                  </span>
                  <h2 className="text-xl font-heading font-bold text-lumo-noche mt-1">
                    {selectedProject.businessName}
                  </h2>
                  <p className="text-xs text-lumo-pizarra">
                    Titular: {selectedProject.ownerName} · {selectedProject.phone}
                  </p>
                </div>

                <Link
                  href={`/portal?client_id=${selectedProject.id}`}
                  target="_blank"
                  className="min-h-touch px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <span>Ver Portal del Cliente</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Pause notice */}
              {selectedProject.clock.isPaused && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm">Producción en Pausa</strong>
                    <p className="mt-0.5">{selectedProject.clock.pauseReason}</p>
                  </div>
                </div>
              )}

              {/* The 5 Days Production Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-lumo-noche uppercase tracking-wider">
                  Tareas de los 5 Días Hábiles:
                </h3>

                {/* Day 0 */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProject.productionTasks.day0DepositAndContract}
                    onChange={() => handleToggleTask('day0DepositAndContract')}
                    className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <strong className="text-lumo-noche">Día 0: Anticipo 50% y Contrato Sellado con SHA-256</strong>
                      <span className="text-[11px] text-slate-500 font-bold">Responsable: Luis</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Depósito acreditado en Stripe y contrato legal archivado en bóveda.
                    </p>
                  </div>
                </label>

                {/* Day 1 */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProject.productionTasks.day1DataCollection}
                    onChange={() => handleToggleTask('day1DataCollection')}
                    className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <strong className="text-lumo-noche">Día 1: Recolección Completa (Fotos, Horarios y Accesos)</strong>
                      <span className="text-[11px] text-slate-500 font-bold">Responsable: Bárbara / Cliente</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      10 a 20 fotos legítimas, confirmación de derechos y horarios exactos de Midland-Odessa.
                    </p>
                  </div>
                </label>

                {/* Day 2 */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProject.productionTasks.day2TechnicalAssembly}
                    onChange={() => handleToggleTask('day2TechnicalAssembly')}
                    className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <strong className="text-lumo-noche">Día 2: Montaje Técnico en Next.js & Subida a Vercel</strong>
                      <span className="text-[11px] text-slate-500 font-bold">Responsable: Carlos</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Web de 1 página con botones de llamada/SMS fijos y canal extra configurado.
                    </p>
                  </div>
                </label>

                {/* Day 3 */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProject.productionTasks.day3SpeedAndAccessibility}
                    onChange={() => handleToggleTask('day3SpeedAndAccessibility')}
                    className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <strong className="text-lumo-noche">Día 3: Auditoría PageSpeed Móvil (&lt;1.5s) & Accesibilidad WCAG</strong>
                      <span className="text-[11px] text-slate-500 font-bold">Responsable: Carlos</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Optimización de imágenes WebP, contraste tipográfico y áreas táctiles de 48px.
                    </p>
                  </div>
                </label>

                {/* Day 4 */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProject.productionTasks.day4PreviewPresentation}
                    onChange={() => handleToggleTask('day4PreviewPresentation')}
                    className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <strong className="text-lumo-noche">Día 4: Demostración Interactiva Privada al Cliente</strong>
                      <span className="text-[11px] text-slate-500 font-bold">Responsable: Luis</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Luis muestra la web al cliente en su celular o videollamada y valida detalles de contacto.
                    </p>
                  </div>
                </label>

                {/* Day 5 */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProject.productionTasks.day5ClientApprovalAndHandover}
                    onChange={() => handleToggleTask('day5ClientApprovalAndHandover')}
                    className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <strong className="text-lumo-noche">Día 5: Aprobación por Escrito, 50% Restante y Entrega de Sticker</strong>
                      <span className="text-[11px] text-slate-500 font-bold">Responsable: Luis & Carlos</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Cobro del 50% final, suscripción de $100/mes activada y entrega de sticker físico de reseñas.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

