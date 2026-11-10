'use client';

import React from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { ScheduleCLedger } from '@/components/admin/finance/ScheduleCLedger';
import {
  DollarSign,
  ShieldCheck,
  Users,
  PiggyBank,
  Landmark,
} from 'lucide-react';
import {
  financialStore,
} from '@/lib/finance';

export default function AdminFinanzasPage() {
  // Barbara Cap Status
  const barbaraCap = financialStore.getBarbaraCapStatus();

  const businessFundTotal = financialStore.getFundTotal() || 51;
  const luisTaxReserveTotal = financialStore.getLuisTaxReserveTotal() || 85;

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-16 flex flex-col antialiased">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6 grow w-full">
        {/* Title Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 mb-2">
              <Landmark className="w-3.5 h-3.5 text-lumo-ambar" />
              <span>REGLAS DEL DINERO · DOCUMENTO 04 (LUMO-FIN-004)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-lumo-noche">
              Cascada de Reparto, Bóveda Legal e Impuestos
            </h1>
            <p className="text-xs sm:text-sm text-lumo-pizarra mt-1">
              Luis Barbera (DBA Midland, TX) · Reparto 50/50 con Carlos Gómez · Retención $0 vía W-8BEN.
            </p>
          </div>

        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Distributable Profit */}
          <div className="bg-white p-5 rounded-3xl border border-lumo-niebla shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
                Ganancia Repartible (50/50)
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              $414.00 <span className="text-xs font-normal text-slate-500">USD</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex justify-between font-bold">
              <span>Carlos: $207.00</span>
              <span>Luis: $207.00</span>
            </div>
          </div>

          {/* Business 8% Fund */}
          <div className="bg-white p-5 rounded-3xl border border-lumo-niebla shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
                Fondo de Reserva (8%)
              </span>
              <PiggyBank className="w-4 h-4 text-lumo-ambar" />
            </div>
            <div className="text-2xl font-black text-lumo-noche mt-2">
              ${businessFundTotal}.00 <span className="text-xs font-normal text-slate-500">USD</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Deducido antes de repartir ganancias para imprevistos y herramientas.
            </p>
          </div>

          {/* Luis US Tax Reserve */}
          <div className="bg-white p-5 rounded-3xl border border-lumo-niebla shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
                Apartado Impuestos Luis (EE. UU.)
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-2">
              ${luisTaxReserveTotal}.00 <span className="text-xs font-normal text-slate-500">USD</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              $25 por fundador, $60 por regular y $11/mes por cliente en cuenta separada.
            </p>
          </div>

          {/* Barbara $500 Cap */}
          <div className="bg-white p-5 rounded-3xl border border-lumo-niebla shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
                Tope Bárbara ($500 Max)
              </span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-lumo-noche mt-2">
              ${barbaraCap.totalEarned} <span className="text-xs font-normal text-slate-500">/ $500</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-lumo-ambar h-full rounded-full transition-all"
                style={{ width: `${(barbaraCap.totalEarned / 500) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {barbaraCap.capReached
                ? '¡Tope de $500 alcanzado! Comisión pasa a $0 automáticamente.'
                : `Margen restante disponible: $${barbaraCap.remainingAllowance} USD`}
            </p>
          </div>
        </div>

        <ScheduleCLedger />


        {/* Legal Vault & Tax Status (Texas Compliance) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs space-y-4">
          <h3 className="text-base font-heading font-black text-lumo-noche flex items-center gap-2">
            <Landmark className="w-5 h-5 text-lumo-ambar" />
            <span>Bóveda Legal & Licencias en Midland, Texas</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col justify-between">
              <div>
                <strong className="block text-lumo-noche text-sm mb-1">Nombre Comercial (DBA Midland)</strong>
                <span className="text-[11px] text-slate-500">Titular legal: Luis Barbera · DBA Midland County &ldquo;Lumo HQ&rdquo;</span>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] mt-3 inline-block w-fit">
                Activo
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col justify-between">
              <div>
                <strong className="block text-lumo-noche text-sm mb-1">Texas Sales Tax (Permiso de Ventas)</strong>
                <span className="text-[11px] text-slate-500">Tasa 8.25% sobre data hosting (20% exento = $6.60/$100)</span>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] mt-3 inline-block w-fit">
                Configurado
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col justify-between">
              <div>
                <strong className="block text-lumo-noche text-sm mb-1">Formularios W-8BEN (Exención Retención)</strong>
                <span className="text-[11px] text-slate-500">Carlos Gómez (Técnico) & Bárbara (Ventas) con W-8BEN firmado en archivo</span>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] mt-3 inline-block w-fit">
                Firmados
              </span>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
