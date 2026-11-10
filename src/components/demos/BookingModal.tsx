'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import type { Locale } from '@/lib/types';
import { DEMO_BARBERS } from './demo-seeds';

interface ServiceItem {
  id: string;
  nameEs: string;
  nameEn: string;
  price: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  locale: Locale;
  businessName: string;
  /** Called when the visitor confirms; the demo page saves it for the owner view. */
  onBooked?: (b: { service: string; price: number; barber: string; time: string; clientName: string; clientPhone: string }) => void;
}

export function BookingModal({
  isOpen,
  onClose,
  services,
  locale,
  businessName,
  onBooked,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(services[0] || null);
  const [selectedBarber, setSelectedBarber] = useState<string>(DEMO_BARBERS[0].name);
  const [formError, setFormError] = useState('');
  const [selectedTime, setSelectedTime] = useState('3:30 PM');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  if (!isOpen) return null;

  const barbers = DEMO_BARBERS.map((b) => ({ name: b.name, role: locale === 'es' ? b.roleEs : b.roleEn }));

  const confirm = () => {
    const digits = clientPhone.replace(/\D/g, '');
    if (clientName.trim().length < 2) { setFormError(locale === 'es' ? 'Escribe tu nombre.' : 'Enter your name.'); return; }
    if (digits.length < 10 || digits.length > 11) { setFormError(locale === 'es' ? 'Escribe un teléfono de 10 dígitos.' : 'Enter a 10-digit phone number.'); return; }
    setFormError('');
    onBooked?.({
      service: (locale === 'es' ? selectedService?.nameEs : selectedService?.nameEn) || '',
      price: selectedService?.price ?? 0, barber: selectedBarber, time: selectedTime,
      clientName: clientName.trim(), clientPhone: clientPhone.trim(),
    });
    setStep(4);
  };

  const timeSlots = ['10:00 AM', '11:30 AM', '1:00 PM', '2:15 PM', '3:30 PM', '4:45 PM', '6:00 PM'];

  const resetAndClose = () => {
    setStep(1);
    setClientName('');
    setClientPhone('');
    setFormError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-lumo-niebla shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-lumo-niebla bg-lumo-arena/60">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-lumo-pizarra uppercase">
              <Calendar className="w-3.5 h-3.5 text-lumo-ambar" />
              <span>Square Appointments / Booksy Integration</span>
            </div>
            <h4 className="font-extrabold text-base sm:text-lg text-lumo-noche font-heading">
              {locale === 'es' ? 'Reservar Cita en 1 Clic' : '1-Click Appointment Booking'}
            </h4>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="min-h-touch min-w-touch p-2 rounded-full hover:bg-lumo-niebla/80 text-lumo-noche flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 grow">
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-lumo-noche">
                1. {locale === 'es' ? 'Selecciona tu servicio:' : 'Select your service:'}
              </div>
              <div className="space-y-2.5">
                {services.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedService(srv)}
                    className={`min-h-touch w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
                      selectedService?.id === srv.id
                        ? 'border-lumo-ambar bg-lumo-arena/50 ring-2 ring-lumo-ambar/30 font-bold'
                        : 'border-lumo-niebla bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block text-sm text-lumo-noche">
                        {locale === 'es' ? srv.nameEs : srv.nameEn}
                      </span>
                      <span className="text-xs text-lumo-pizarra">30 – 45 min</span>
                    </div>
                    <span className="text-sm font-black text-lumo-noche">${srv.price}.00</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-touch w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-lumo-noche text-white font-bold text-sm shadow-md hover:bg-black active:scale-98 transition-all"
              >
                <span>{locale === 'es' ? 'Continuar: Elegir Barbero' : 'Next: Choose Barber'}</span>
                <ChevronRight className="w-4 h-4 text-lumo-brillo" />
              </button>
            </div>
          )}

          {/* STEP 2: Select Specialist */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-lumo-noche">
                2. {locale === 'es' ? '¿Con quién te gustaría atenderte?' : 'Who would you like to book with?'}
              </div>
              <div className="space-y-2.5">
                {barbers.map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBarber(b.name)}
                    className={`min-h-touch w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
                      selectedBarber === b.name
                        ? 'border-lumo-ambar bg-lumo-arena/50 ring-2 ring-lumo-ambar/30 font-bold'
                        : 'border-lumo-niebla bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-lumo-noche text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-5 h-5 text-lumo-brillo" />
                    </div>
                    <div>
                      <span className="block text-sm text-lumo-noche">{b.name}</span>
                      <span className="text-xs text-lumo-pizarra font-normal">{b.role}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-touch px-4 py-3 rounded-xl border border-lumo-niebla text-lumo-noche text-sm font-bold hover:bg-lumo-arena"
                >
                  {locale === 'es' ? 'Atrás' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-touch grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lumo-noche text-white font-bold text-sm shadow-md hover:bg-black active:scale-98 transition-all"
                >
                  <span>{locale === 'es' ? 'Continuar: Elegir Hora' : 'Next: Pick Time'}</span>
                  <ChevronRight className="w-4 h-4 text-lumo-brillo" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Time & Contact Info */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-lumo-noche">
                3. {locale === 'es' ? 'Horas disponibles hoy / mañana:' : 'Available times today / tomorrow:'}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((time, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`min-h-touch py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      selectedTime === time
                        ? 'border-lumo-ambar bg-lumo-ambar text-lumo-noche shadow-xs'
                        : 'border-lumo-niebla bg-white text-lumo-pizarra hover:bg-slate-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-lumo-niebla space-y-3">
                <div>
                  <label className="block text-xs font-bold text-lumo-noche mb-1">
                    {locale === 'es' ? 'Tu Nombre:' : 'Your Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Roberto Garza"
                    className="min-h-touch w-full px-3 py-2.5 rounded-xl border border-lumo-niebla text-sm text-lumo-noche focus:border-lumo-ambar outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-lumo-noche mb-1">
                    {locale === 'es' ? 'Teléfono Móvil (para recordatorio por SMS):' : 'Mobile Phone (for SMS reminder):'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(432) 555-0199"
                    className="min-h-touch w-full px-3 py-2.5 rounded-xl border border-lumo-niebla text-sm text-lumo-noche focus:border-lumo-ambar outline-hidden"
                  />
                </div>
              </div>

              {formError && <p role="alert" className="text-xs font-bold text-red-700">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-touch px-4 py-3 rounded-xl border border-lumo-niebla text-lumo-noche text-sm font-bold hover:bg-lumo-arena"
                >
                  {locale === 'es' ? 'Atrás' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className="min-h-touch grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:bg-[#c97e1e] text-lumo-noche font-black text-sm shadow-md transition-all"
                >
                  <Clock className="w-4 h-4" />
                  <span>{locale === 'es' ? 'Confirmar Cita Ahora' : 'Confirm Appointment Now'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-extrabold text-lumo-noche font-heading">
                {locale === 'es' ? '¡Cita Reservada con Éxito!' : 'Appointment Confirmed!'}
              </h4>
              <div className="p-4 rounded-2xl bg-lumo-arena/60 border border-lumo-niebla max-w-sm mx-auto text-left text-xs sm:text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-lumo-pizarra">{locale === 'es' ? 'Negocio:' : 'Business:'}</span>
                  <span className="font-bold text-lumo-noche">{businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-lumo-pizarra">{locale === 'es' ? 'Servicio:' : 'Service:'}</span>
                  <span className="font-bold text-lumo-noche">
                    {locale === 'es' ? selectedService?.nameEs : selectedService?.nameEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-lumo-pizarra">{locale === 'es' ? 'Barbero:' : 'Barber:'}</span>
                  <span className="font-bold text-lumo-noche">{selectedBarber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-lumo-pizarra">{locale === 'es' ? 'Horario:' : 'Time:'}</span>
                  <span className="font-bold text-emerald-700">Hoy · {selectedTime}</span>
                </div>
                <div className="flex justify-between border-t border-lumo-niebla pt-1.5 mt-1.5">
                  <span className="text-lumo-pizarra">{locale === 'es' ? 'A pagar en local:' : 'Pay at shop:'}</span>
                  <span className="font-black text-lumo-noche">${selectedService?.price}.00 USD</span>
                </div>
              </div>
              <p className="text-xs text-lumo-pizarra max-w-xs mx-auto">
                {locale === 'es'
                  ? 'Te llegará un recordatorio por SMS antes de tu cita. Es una demostración: abre la Vista del Dueño arriba para ver cómo le llega la cita al negocio.'
                  : 'You will get an SMS reminder before your appointment. This is a demo: open the Owner View above to see how the shop receives it.'}
              </p>
              <button
                type="button"
                onClick={resetAndClose}
                className="min-h-touch px-6 py-2.5 rounded-full bg-lumo-noche text-white font-bold text-xs"
              >
                {locale === 'es' ? 'Cerrar demostración' : 'Close demo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

