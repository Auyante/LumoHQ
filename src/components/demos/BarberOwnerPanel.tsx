'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ArrowLeft,
  MessageSquare,
  DollarSign,
  TrendingUp,
  XCircle,
  RefreshCw,
  Send,
  X,
  MessageCircle,
} from 'lucide-react';

export interface BarberAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  price: number;
  status: 'Confirmada' | 'En atención' | 'Completada' | 'Cancelada';
  createdAt: string;
}

interface BarberOwnerPanelProps {
  appointments: BarberAppointment[];
  onUpdateStatus: (id: string, newStatus: BarberAppointment['status']) => void;
  onBackToClient: () => void;
}

export function BarberOwnerPanel({
  appointments,
  onUpdateStatus,
  onBackToClient,
}: BarberOwnerPanelProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<BarberAppointment | null>(
    appointments[0] || null
  );
  const [smsModalApt, setSmsModalApt] = useState<BarberAppointment | null>(null);
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  const totalRevenue = appointments
    .filter((a) => a.status !== 'Cancelada')
    .reduce((acc, curr) => acc + curr.price, 0);

  const confirmedCount = appointments.filter((a) => a.status === 'Confirmada').length;
  const inServiceCount = appointments.filter((a) => a.status === 'En atención').length;
  const nextAppointment = appointments.find((a) => a.status === 'Confirmada') || appointments[0];

  const handleSimulateSms = () => {
    if (!smsModalApt) return;
    setSmsSentNotice(`Recordatorio SMS enviado con éxito a ${smsModalApt.clientName} (${smsModalApt.clientPhone})`);
    setTimeout(() => {
      setSmsModalApt(null);
      setSmsSentNotice(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-20">
      {/* Top Banner */}
      <div className="bg-lumo-noche text-white border-b border-lumo-ambar/40 px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToClient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-lumo-brillo text-xs font-bold transition-transform active:scale-95 min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Vista Cliente</span>
            </button>
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-lumo-ambar" />
              <h2 className="text-sm font-black font-heading tracking-wide">
                Barbería Los Compadres · Panel del Dueño
              </h2>
            </div>
          </div>
          <div className="text-xs text-gray-300">
            Agenda del Día · <span className="text-emerald-400 font-bold">Square / Booksy Sync Activo</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-lumo-niebla shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-lumo-pizarra font-semibold block">Citas de Hoy</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-lumo-noche">{appointments.length}</span>
                <span className="text-xs text-lumo-pizarra font-medium">({confirmedCount} confirmadas)</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl">
              <Calendar className="w-6 h-6 text-lumo-ambar" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-lumo-niebla shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-lumo-pizarra font-semibold block">Ingreso Estimado</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-emerald-700">${totalRevenue}</span>
                <span className="text-xs text-lumo-pizarra font-semibold">USD</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-lumo-niebla shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-lumo-pizarra font-semibold block">Próxima Cita</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-700">{nextAppointment ? nextAppointment.time : 'Sin citas'}</span>
                {nextAppointment && (
                  <span className="text-xs text-lumo-pizarra truncate max-w-[110px]">{nextAppointment.clientName}</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Main Content: Appointments List & Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of Appointments (Left) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-lumo-niebla shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-lumo-niebla">
              <h3 className="text-sm font-black text-lumo-noche uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-lumo-ambar" />
                <span>Citas Programadas para Hoy</span>
              </h3>
              <span className="text-xs text-lumo-pizarra font-bold">
                {appointments.length} Citas
              </span>
            </div>

            <div className="space-y-3">
              {appointments.map((apt) => {
                const isSelected = selectedAppointment?.id === apt.id;
                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-lumo-ambar ring-2 ring-lumo-ambar/20 bg-amber-50/40'
                        : 'border-lumo-niebla bg-white'
                    }`}
                  >
                    <div
                      onClick={() => setSelectedAppointment(apt)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-lumo-noche">{apt.clientName}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                apt.status === 'Confirmada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : apt.status === 'En atención'
                                  ? 'bg-blue-100 text-blue-800'
                                  : apt.status === 'Completada'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-xs text-lumo-pizarra mt-1">
                            {apt.service} (${apt.price} USD) · <span className="font-semibold text-lumo-noche">{apt.barber}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            {apt.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick 1-Touch Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          onUpdateStatus(apt.id, 'Confirmada');
                        }}
                        className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-bold border transition-transform active:scale-95 ${
                          apt.status === 'Confirmada'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 hover:bg-emerald-50 text-emerald-700 border-slate-200'
                        }`}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          onUpdateStatus(apt.id, 'Completada');
                        }}
                        className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-bold border transition-transform active:scale-95 ${
                          apt.status === 'Completada'
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Completar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          onUpdateStatus(apt.id, 'Cancelada');
                        }}
                        className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-bold border transition-transform active:scale-95 ${
                          apt.status === 'Cancelada'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-slate-50 hover:bg-red-50 text-red-600 border-slate-200'
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => setSmsModalApt(apt)}
                        className="min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-transform active:scale-95 flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3 text-amber-700" />
                        <span>SMS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Appointment Detail & Controls (Right) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedAppointment ? (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-lumo-niebla shadow-sm space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-lumo-pizarra uppercase">
                      Detalle de Reserva
                    </span>
                    <h3 className="text-lg font-black text-lumo-noche">
                      {selectedAppointment.clientName}
                    </h3>
                  </div>
                  <a
                    href={`tel:${selectedAppointment.clientPhone.replace(/[^0-9]/g, '')}`}
                    className="min-h-touch flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lumo-noche text-white text-xs font-bold shadow-xs active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 text-lumo-brillo" />
                    <span>Llamar</span>
                  </a>
                </div>

                {/* Details Table */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-lumo-pizarra">Teléfono:</span>
                    <span className="font-bold text-lumo-noche">{selectedAppointment.clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lumo-pizarra">Servicio:</span>
                    <span className="font-bold text-lumo-noche">{selectedAppointment.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lumo-pizarra">Barbero:</span>
                    <span className="font-bold text-lumo-noche">{selectedAppointment.barber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lumo-pizarra">Fecha & Hora:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedAppointment.date} · {selectedAppointment.time}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <span>Monto en local:</span>
                    <span className="text-sm font-black text-lumo-noche">
                      ${selectedAppointment.price}.00 USD
                    </span>
                  </div>
                </div>

                {/* Action button for SMS preview */}
                <button
                  type="button"
                  onClick={() => setSmsModalApt(selectedAppointment)}
                  className="w-full min-h-touch py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-lumo-noche font-black text-xs transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Recordatorio SMS al Cliente</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-lumo-niebla text-center text-lumo-pizarra text-xs">
                Selecciona una cita de la lista para ver su detalle.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Enviar Recordatorio SMS */}
      {smsModalApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-lumo-niebla shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-lumo-niebla">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-lumo-ambar" />
                <h3 className="font-heading font-black text-base text-lumo-noche">
                  Recordatorio SMS para {smsModalApt.clientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSmsModalApt(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-lumo-pizarra">
                Texto del Mensaje (Square / Twilio SMS Ready):
              </label>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-lumo-noche font-mono leading-relaxed">
                &ldquo;Hola {smsModalApt.clientName.split(' ')[0]}, te recordamos tu cita hoy a las {smsModalApt.time} en Barbería Los Compadres Midland. Responde SI para confirmar.&rdquo;
              </div>
              <p className="text-[11px] text-lumo-pizarra">
                Destino: <span className="font-bold text-lumo-noche">{smsModalApt.clientPhone}</span>
              </p>
            </div>

            {smsSentNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{smsSentNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleSimulateSms}
                className="min-h-touch py-3 px-4 rounded-xl bg-lumo-noche text-white font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4 text-lumo-brillo" />
                <span>Simular Envío SMS</span>
              </button>
              <a
                href={`sms:${smsModalApt.clientPhone.replace(/[^0-9]/g, '')}?body=${encodeURIComponent(
                  `Hola ${smsModalApt.clientName.split(' ')[0]}, te recordamos tu cita hoy a las ${smsModalApt.time} en Barbería Los Compadres Midland. Responde SI para confirmar.`
                )}`}
                className="min-h-touch py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir App de Mensajes</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
