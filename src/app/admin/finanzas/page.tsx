'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Users,
  PiggyBank,
  Receipt,
  Car,
  Landmark,
  Plus,
  Lock,
  Download,
  MapPin,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';
import {
  financialStore,
  calculateSetupWaterfall,
  calculateMonthlyWaterfall,
  ExpenseRecord,
} from '@/lib/finance';
import { PRICING_CONSTANTS } from '@/lib/stripe';

interface MileageTrip {
  id: string;
  date: string;
  client: string;
  purpose: string;
  miles: number;
  city: 'Midland' | 'Odessa' | 'Midland-Odessa';
}

const initialTrips: MileageTrip[] = [
  {
    id: 'trip-1',
    date: '2026-11-03',
    client: 'Panadería San Juan',
    purpose: 'Entrega física de Kit de Reseñas QR y capacitación de dueña',
    miles: 15,
    city: 'Midland',
  },
  {
    id: 'trip-2',
    date: '2026-11-05',
    client: 'Barbería El Rey',
    purpose: 'Reunión presencial de 15 min y firma de anticipo 50/50',
    miles: 10,
    city: 'Midland',
  },
  {
    id: 'trip-3',
    date: '2026-11-06',
    client: 'Plomería Hermanos Vega',
    purpose: 'Prospección presencial y diagnóstico de perfil Google',
    miles: 25,
    city: 'Odessa',
  },
  {
    id: 'trip-4',
    date: '2026-11-07',
    client: 'Taquería El Primo',
    purpose: 'Visita de diagnóstico con teléfono en mano',
    miles: 10,
    city: 'Midland',
  },
];

export default function AdminFinanzasPage() {
  const [activeRole, setActiveRole] = useState<'ADMIN_LUIS' | 'ADMIN_CARLOS'>('ADMIN_LUIS');
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(financialStore.getExpenses());
  const [transactions, setTransactions] = useState(financialStore.getTransactions());

  // New Expense Modal State
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [expConcept, setExpConcept] = useState('');
  const [expAmount, setExpAmount] = useState<number>(50);

  // Barbara Cap Status
  const barbaraCap = financialStore.getBarbaraCapStatus();

  // Mileage Tracker State (Luis Barbera)
  const [trips, setTrips] = useState<MileageTrip[]>(initialTrips);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [tripClient, setTripClient] = useState('');
  const [tripPurpose, setTripPurpose] = useState('');
  const [tripMiles, setTripMiles] = useState<number>(15);
  const [tripCity, setTripCity] = useState<'Midland' | 'Odessa' | 'Midland-Odessa'>('Midland');

  // Totals
  const recordedMiles = trips.reduce((sum, t) => sum + t.miles, 0);
  const irsMileageRate = 0.67; // $0.67/milla deducción IRS 2026
  const mileageDeduction = Math.round(recordedMiles * irsMileageRate * 100) / 100;
  const estimatedTaxSavings = Math.round(mileageDeduction * 0.25 * 100) / 100; // ~25% effective bracket

  const businessFundTotal = financialStore.getFundTotal() || 51;
  const luisTaxReserveTotal = financialStore.getLuisTaxReserveTotal() || 85;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expConcept || expAmount <= 0) return;

    financialStore.createExpense(expConcept, expAmount, activeRole);
    setExpenses([...financialStore.getExpenses()]);
    setIsCreatingExpense(false);
    setExpConcept('');
    setExpAmount(50);
  };

  const handleApproveExpense = (id: string) => {
    financialStore.approveExpense(id, activeRole);
    setExpenses([...financialStore.getExpenses()]);
  };

  const handleQuickAddMiles = (milesToAdd: number, cityLabel: 'Midland' | 'Odessa' | 'Midland-Odessa', label: string) => {
    const newTrip: MileageTrip = {
      id: `trip-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      client: label,
      purpose: 'Visita de prospección presencial y seguimiento de clientes',
      miles: milesToAdd,
      city: cityLabel,
    };
    setTrips([newTrip, ...trips]);
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripClient || tripMiles <= 0) return;
    const newTrip: MileageTrip = {
      id: `trip-${Date.now()}`,
      date: tripDate,
      client: tripClient,
      purpose: tripPurpose || 'Visita presencial de negocios',
      miles: tripMiles,
      city: tripCity,
    };
    setTrips([newTrip, ...trips]);
    setIsCreatingTrip(false);
    setTripClient('');
    setTripPurpose('');
    setTripMiles(15);
  };

  const handleExportMileageCsv = () => {
    const headers = ['Fecha', 'Cliente / Negocio', 'Propósito del Viaje', 'Ciudad', 'Millas', 'Deducción USD ($0.67/mi)'];
    const rows = trips.map((t) => [
      t.date,
      `"${t.client.replace(/"/g, '""')}"`,
      `"${t.purpose.replace(/"/g, '""')}"`,
      t.city,
      t.miles,
      (t.miles * irsMileageRate).toFixed(2),
    ]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `LumoHQ_IRS_Schedule_C_Mileage_Luis_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveRole('ADMIN_LUIS')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeRole === 'ADMIN_LUIS'
                    ? 'bg-lumo-noche text-white shadow-xs'
                    : 'text-slate-600 hover:text-lumo-noche'
                }`}
              >
                Luis (DBA Midland)
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('ADMIN_CARLOS')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeRole === 'ADMIN_CARLOS'
                    ? 'bg-lumo-ambar text-lumo-noche shadow-xs'
                    : 'text-slate-600 hover:text-lumo-noche'
                }`}
              >
                Carlos (Co-operador)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingExpense(true)}
              className="min-h-touch px-4 py-2 bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gasto Operativo</span>
            </button>
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

        {/* GESTOR ESPECIALIZADO DE MILLAJE Y DEDUCCIONES FISCALES IRS DE LUIS BARBERA */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                <span>IRS SCHEDULE C · TASA OFICIAL $0.67 USD / MILLA</span>
              </div>
              <h2 className="text-xl font-heading font-black text-lumo-noche">
                Gestor de Millaje y Deducción Fiscal de Luis Barbera
              </h2>
              <p className="text-xs text-lumo-pizarra mt-0.5">
                Registro de visitas comerciales presenciales en el Permian Basin para deducción fiscal legítima ante el IRS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMileageCsv}
                className="min-h-touch inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold shadow-xs transition-transform active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar Schedule C</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingTrip(true)}
                className="min-h-touch inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lumo-noche hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-lumo-ambar" />
                <span>Registrar Trayecto</span>
              </button>
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-lumo-pizarra block">
              Registro Rápido a 1 Toque (Rutas Típicas en Midland-Odessa):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickAddMiles(10, 'Midland', 'Visita Local Midland')}
                className="min-h-touch p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-lumo-ambar text-left transition-all active:scale-98 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-lumo-noche block">+10 millas (Midland local)</span>
                  <span className="text-[11px] text-slate-500">Loop 250 / Big Spring / Downtown</span>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  +$6.70
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAddMiles(15, 'Odessa', 'Ruta Comercial Odessa')}
                className="min-h-touch p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-lumo-ambar text-left transition-all active:scale-98 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-lumo-noche block">+15 millas (Ruta Odessa)</span>
                  <span className="text-[11px] text-slate-500">I-20 Oeste / 42nd St / Andrews Hwy</span>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  +$10.05
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAddMiles(25, 'Midland-Odessa', 'Ruta Combinada Midland-Odessa')}
                className="min-h-touch p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-lumo-ambar text-left transition-all active:scale-98 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-lumo-noche block">+25 millas (Ruta combinada)</span>
                  <span className="text-[11px] text-slate-500">Midland ↔ Odessa ida y vuelta</span>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  +$16.75
                </span>
              </button>
            </div>
          </div>

          {/* Live Counters Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <div>
              <span className="text-xs text-emerald-900 font-semibold block uppercase">Total Millas Registradas</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-emerald-950">{recordedMiles}</span>
                <span className="text-xs text-emerald-700 font-bold">millas en el año</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-emerald-900 font-semibold block uppercase">Deducción Fiscal Acumulada</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-emerald-700">${mileageDeduction}</span>
                <span className="text-xs text-emerald-600 font-bold">USD (@ $0.67/mi)</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-emerald-900 font-semibold block uppercase">Ahorro Estimado de Impuestos</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-blue-900">~${estimatedTaxSavings}</span>
                <span className="text-xs text-blue-700 font-bold">USD (~25% bracket)</span>
              </div>
            </div>
          </div>

          {/* Trips Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-lumo-noche flex justify-between items-center">
              <span>Últimos Trayectos Comerciales ({trips.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">Bitácora oficial IRS Schedule C</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-50 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lumo-noche text-sm">{trip.client}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {trip.city}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{trip.purpose}</p>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <span className="text-slate-500 text-[11px]">{trip.date}</span>
                    <div>
                      <span className="font-black text-lumo-noche block text-sm">{trip.miles} mi</span>
                      <span className="text-[10px] font-bold text-emerald-700">
                        +${(trip.miles * irsMileageRate).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Expense Manager with Dual Approval (> $100) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-heading font-black text-lumo-noche flex items-center gap-2">
                <Receipt className="w-5 h-5 text-lumo-ambar" />
                <span>Control de Gastos Operativos y Regla de Doble Aprobación</span>
              </h2>
              <p className="text-xs text-lumo-pizarra mt-0.5">
                Regla obligatoria de Gobernanza: Todo gasto mayor a $100 USD requiere la aprobación simultánea de Luis y Carlos.
              </p>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
              No hay gastos operativos pendientes registrados.
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-lumo-noche">{exp.concept}</span>
                      <span className="text-xs font-black text-lumo-noche bg-white px-2 py-0.5 rounded border">
                        ${exp.amount}.00 USD
                      </span>
                      {exp.amount > 100 && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Requiere Doble Aprobación (&gt;$100)
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Registrado por: <strong>{exp.requestedBy}</strong> · Aprobado por Luis:{' '}
                      {exp.approvedByLuis ? 'Sí' : 'No'} · Aprobado por Carlos:{' '}
                      {exp.approvedByCarlos ? 'Sí' : 'No'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                        exp.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {exp.status === 'APPROVED' ? 'Aprobado' : 'Pendiente Doble Firma'}
                    </span>

                    {exp.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleApproveExpense(exp.id)}
                        className="min-h-touch px-3 py-1.5 bg-lumo-noche text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-transform active:scale-95"
                      >
                        Firmar Aprobación como {activeRole === 'ADMIN_LUIS' ? 'Luis' : 'Carlos'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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

      {/* MODAL: REGISTRAR TRAYECTO DE MILLAJE */}
      {isCreatingTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTrip}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-lumo-niebla shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs"
          >
            <div className="flex justify-between items-center pb-3 border-b border-lumo-niebla">
              <h3 className="font-heading font-black text-base text-lumo-noche">
                Registrar Trayecto Comercial (Luis)
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingTrip(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-lumo-noche mb-1">Fecha del Viaje *</label>
              <input
                type="date"
                required
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="min-h-touch w-full px-3 py-2 rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
              />
            </div>

            <div>
              <label className="block font-bold text-lumo-noche mb-1">Cliente o Negocio Visitado *</label>
              <input
                type="text"
                required
                value={tripClient}
                onChange={(e) => setTripClient(e.target.value)}
                placeholder="Ej. Barbería Los Compadres"
                className="min-h-touch w-full px-3 py-2 rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-lumo-noche mb-1">Ciudad *</label>
                <select
                  value={tripCity}
                  onChange={(e) => setTripCity(e.target.value as any)}
                  className="min-h-touch w-full px-3 py-2 rounded-xl border border-lumo-niebla outline-none bg-white"
                >
                  <option value="Midland">Midland, TX</option>
                  <option value="Odessa">Odessa, TX</option>
                  <option value="Midland-Odessa">Ambas</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-lumo-noche mb-1">Millas Recorridas *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={tripMiles}
                  onChange={(e) => setTripMiles(Number(e.target.value))}
                  className="min-h-touch w-full px-3 py-2 rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-lumo-noche mb-1">Propósito Comercial</label>
              <input
                type="text"
                value={tripPurpose}
                onChange={(e) => setTripPurpose(e.target.value)}
                placeholder="Ej. Diagnóstico presencial y entrega de QR"
                className="min-h-touch w-full px-3 py-2 rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex justify-between items-center">
              <span>Deducción calculada:</span>
              <span>+${(tripMiles * irsMileageRate).toFixed(2)} USD</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full min-h-touch py-3 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs transition-transform active:scale-95 shadow-md"
              >
                Guardar Trayecto en Bitácora
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE EXPENSE MODAL */}
      {isCreatingExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateExpense}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl text-xs"
          >
            <div className="flex justify-between items-start pb-3 border-b border-lumo-niebla">
              <h3 className="font-heading font-black text-base text-lumo-noche">
                Registrar Gasto del Negocio
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingExpense(false)}
                className="p-1 text-slate-400 hover:text-lumo-noche"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-lumo-noche mb-1">Concepto del Gasto:</label>
              <input
                type="text"
                required
                value={expConcept}
                onChange={(e) => setExpConcept(e.target.value)}
                placeholder="Ej. Stickers físicos de reseñas / Recarga eSIM"
                className="min-h-touch w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
              />
            </div>

            <div>
              <label className="block font-bold text-lumo-noche mb-1">Monto en USD ($):</label>
              <input
                type="number"
                min="1"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                className="min-h-touch w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
              />
              {expAmount > 100 && (
                <p className="text-[11px] text-amber-700 font-bold mt-1">
                  Nota: Gastos &gt; $100 USD requieren aprobación doble de Luis y Carlos.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full min-h-touch py-3 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs transition-transform active:scale-95 shadow-md"
              >
                Guardar Solicitud de Gasto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
