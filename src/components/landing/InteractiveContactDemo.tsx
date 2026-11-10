'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import type { ExtraChannel } from '@/lib/types';
import {
  Phone,
  MessageSquare,
  Calendar,
  Instagram,
  MessageCircle,
  Check,
  Sparkles,
  Smartphone,
  PhoneCall,
  PhoneOff,
  Send,
  ArrowRight,
  Scissors,
  Utensils,
  Star,
  CheckCircle2,
  Clock,
  ChevronLeft,
} from 'lucide-react';

type SimulatorScreen = 'idle' | 'call' | 'sms' | 'booking' | 'meta' | 'whatsapp';

export function InteractiveContactDemo() {
  const { t } = useI18n();
  const [selectedChannel, setSelectedChannel] = useState<ExtraChannel>('booking');
  const [activeScreen, setActiveScreen] = useState<SimulatorScreen>('idle');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleOpenChannel = () => {
    if (selectedChannel === 'booking') setActiveScreen('booking');
    else if (selectedChannel === 'meta') setActiveScreen('meta');
    else if (selectedChannel === 'whatsapp') setActiveScreen('whatsapp');
  };

  return (
    <section id="demos" className="py-16 md:py-24 bg-lumo-arena/40 border-b border-lumo-niebla">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-ambar/15 text-lumo-noche text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
            <span>{t.demoInteractive.badge}</span>
          </div>
          <h2 className="text-fluid-h2 text-lumo-noche mb-4">
            {t.demoInteractive.title}
          </h2>
          <p className="text-base sm:text-lg text-lumo-pizarra">
            {t.demoInteractive.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Channel Selectors (Left side) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Always included banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lumo-niebla shadow-xs">
              <span className="text-xs font-bold text-lumo-pizarra uppercase tracking-wider block mb-3">
                {t.demoInteractive.includedAlways}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-lumo-arena/80 border border-lumo-ambar/30 text-lumo-noche font-semibold text-sm">
                  <div className="w-8 h-8 rounded-full bg-lumo-noche text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-lumo-brillo" />
                  </div>
                  <div>
                    <span className="block font-bold">{t.demoInteractive.btnCall}</span>
                    <span className="text-xs text-lumo-pizarra font-normal">En 1 toque desde móvil</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-lumo-arena/80 border border-lumo-ambar/30 text-lumo-noche font-semibold text-sm">
                  <div className="w-8 h-8 rounded-full bg-lumo-noche text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-lumo-brillo" />
                  </div>
                  <div>
                    <span className="block font-bold">{t.demoInteractive.btnSms}</span>
                    <span className="text-xs text-lumo-pizarra font-normal">SMS nativo directo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector Title */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-lumo-noche mb-3">
                {t.demoInteractive.chooseExtra}
              </h3>

              {/* Channel Tabs */}
              <div className="space-y-3">
                {/* 1. Square Booking */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('booking');
                    setActiveScreen('booking');
                  }}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer min-h-touch ${selectedChannel === 'booking'
                      ? 'bg-white border-lumo-ambar ring-2 ring-lumo-ambar/30 shadow-md'
                      : 'bg-white/70 hover:bg-white border-lumo-niebla'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-lumo-noche">
                          {t.demoInteractive.channels.booking.title}
                        </h4>
                        <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                          {t.demoInteractive.channels.booking.bestFor}
                        </p>
                      </div>
                    </div>
                    {selectedChannel === 'booking' && (
                      <span className="w-6 h-6 rounded-full bg-lumo-ambar text-lumo-noche flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-lumo-pizarra mt-2.5 leading-relaxed pl-13">
                    {t.demoInteractive.channels.booking.desc}
                  </p>
                </button>

                {/* 2. Meta Business */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('meta');
                    setActiveScreen('meta');
                  }}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer min-h-touch ${selectedChannel === 'meta'
                      ? 'bg-white border-lumo-ambar ring-2 ring-lumo-ambar/30 shadow-md'
                      : 'bg-white/70 hover:bg-white border-lumo-niebla'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-lumo-noche">
                          {t.demoInteractive.channels.meta.title}
                        </h4>
                        <p className="text-xs font-semibold text-purple-700 mt-0.5">
                          {t.demoInteractive.channels.meta.bestFor}
                        </p>
                      </div>
                    </div>
                    {selectedChannel === 'meta' && (
                      <span className="w-6 h-6 rounded-full bg-lumo-ambar text-lumo-noche flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-lumo-pizarra mt-2.5 leading-relaxed pl-13">
                    {t.demoInteractive.channels.meta.desc}
                  </p>
                </button>

                {/* 3. WhatsApp Business */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('whatsapp');
                    setActiveScreen('whatsapp');
                  }}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer min-h-touch ${selectedChannel === 'whatsapp'
                      ? 'bg-white border-lumo-ambar ring-2 ring-lumo-ambar/30 shadow-md'
                      : 'bg-white/70 hover:bg-white border-lumo-niebla'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-lumo-noche">
                          {t.demoInteractive.channels.whatsapp.title}
                        </h4>
                        <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                          {t.demoInteractive.channels.whatsapp.bestFor}
                        </p>
                      </div>
                    </div>
                    {selectedChannel === 'whatsapp' && (
                      <span className="w-6 h-6 rounded-full bg-lumo-ambar text-lumo-noche flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-lumo-pizarra mt-2.5 leading-relaxed pl-13">
                    {t.demoInteractive.channels.whatsapp.desc}
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Phone Mockup (Right side) */}
          <div className="lg:col-span-5 flex flex-col items-center w-full">
            <span className="text-xs font-bold text-lumo-pizarra uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-lumo-ambar shrink-0" />
              <span>{t.demoInteractive.previewTitle}</span>
            </span>

            {/* Mobile device shell */}
              <div className="relative w-full max-w-[310px] sm:max-w-[340px] rounded-[36px] sm:rounded-[40px] bg-lumo-noche p-2 sm:p-3 shadow-2xl border-2 sm:border-4 border-lumo-noche ring-2 sm:ring-8 ring-lumo-niebla mx-auto">
                {/* Speaker / Notch */}
                <div className="w-28 h-4 bg-lumo-noche rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-12 h-1 bg-lumo-pizarra/40 rounded-full" />
                </div>

                {/* Phone screen */}
                  <div className="relative bg-white rounded-[26px] sm:rounded-[28px] overflow-hidden min-h-[480px] sm:min-h-[520px] flex flex-col justify-between border border-lumo-niebla">
                    {/* 1. IDLE SCREEN (Normal mobile page) */}
                    {activeScreen === 'idle' && (
                      <>
                        <div className="p-4 border-b border-lumo-niebla bg-lumo-arena/60">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold tracking-wider text-lumo-pizarra uppercase">Midland, TX</span>
                              <h5 className="font-bold text-sm text-lumo-noche leading-tight">Barbería El Rey / Taquería Los Compadres</h5>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-lumo-ambar/20 flex items-center justify-center text-xs font-bold text-lumo-noche">
                              HQ
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-3 grow flex flex-col justify-center text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 mx-auto px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Abierto hoy · 9:00 AM - 7:00 PM</span>
                          </div>
                          <p className="text-xs text-lumo-pizarra flex items-center justify-center gap-1">
                            <span>Perfil verificado</span>
                            <Star className="w-3.5 h-3.5 text-lumo-ambar fill-lumo-ambar shrink-0 inline-block" />
                            <span className="font-bold text-lumo-noche">4.9</span>
                            <span>(48 reseñas)</span>
                          </p>
                          <p className="text-[11px] text-lumo-pizarra italic mt-2">
                            {t.demoInteractive.previewNote}
                          </p>
                        </div>

                        {/* Bottom action buttons */}
                        <div className="p-3 bg-white/95 backdrop-blur-md border-t border-lumo-niebla shadow-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveScreen('call')}
                              className="min-h-touch flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-lumo-noche hover:bg-black active:scale-95 text-white text-xs font-bold transition-transform cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5 text-lumo-brillo shrink-0" />
                              <span>{t.demoInteractive.btnCall}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveScreen('sms');
                                setSmsSent(false);
                              }}
                              className="min-h-touch flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-lumo-noche active:scale-95 text-lumo-noche text-xs font-bold transition-transform cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
                              <span>{t.demoInteractive.btnSms}</span>
                            </button>
                          </div>

                          {/* 3rd Channel button */}
                          <div>
                            {selectedChannel === 'booking' && (
                              <button
                                type="button"
                                onClick={handleOpenChannel}
                                className="min-h-touch w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:scale-95 text-lumo-noche text-xs font-bold shadow-md transition-transform cursor-pointer"
                              >
                                <Calendar className="w-4 h-4 shrink-0" />
                                <span>{t.demoInteractive.channels.booking.buttonText}</span>
                              </button>
                            )}
                            {selectedChannel === 'meta' && (
                              <button
                                type="button"
                                onClick={handleOpenChannel}
                                className="min-h-touch w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md transition-transform cursor-pointer"
                              >
                                <Instagram className="w-4 h-4 shrink-0" />
                                <span>{t.demoInteractive.channels.meta.buttonText}</span>
                              </button>
                            )}
                            {selectedChannel === 'whatsapp' && (
                              <button
                                type="button"
                                onClick={handleOpenChannel}
                                className="min-h-touch w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white text-xs font-bold shadow-md transition-transform cursor-pointer"
                              >
                                <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                                <span>{t.demoInteractive.channels.whatsapp.buttonText}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* 2. CALL SIMULATOR SCREEN */}
                    {activeScreen === 'call' && (
                      <div className="flex flex-col h-full grow p-6 bg-gradient-to-b from-lumo-noche to-slate-900 text-white justify-between animate-in fade-in duration-200">
                        <div className="text-center pt-8 space-y-2">
                          <div className="w-20 h-20 rounded-full bg-white/10 mx-auto flex items-center justify-center border-2 border-lumo-ambar/50 shadow-lg">
                            <PhoneCall className="w-10 h-10 text-lumo-ambar animate-pulse" />
                          </div>
                          <h4 className="text-lg font-bold">Barbería El Rey</h4>
                          <p className="text-sm text-gray-300">(432) 555-0199</p>
                          <span className="inline-block text-xs text-emerald-400 font-medium">Llamando... (00:03)</span>
                        </div>

                        <div className="space-y-3 pb-4">
                          <a
                            href="tel:4325550199"
                            className="min-h-touch w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-transform"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Probar llamada real en tu teléfono</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setActiveScreen('idle')}
                            className="min-h-touch w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
                          >
                            <PhoneOff className="w-4 h-4" />
                            <span>Colgar / Volver</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. SMS SIMULATOR SCREEN */}
                    {activeScreen === 'sms' && (
                      <div className="flex flex-col h-full grow bg-slate-50 justify-between animate-in fade-in duration-200">
                        {/* SMS Header */}
                        <div className="p-3 bg-white border-b border-lumo-niebla flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveScreen('idle')}
                            className="p-1 rounded-lg text-lumo-pizarra hover:bg-slate-100"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div className="grow text-center pr-6">
                            <span className="block text-xs font-bold text-lumo-noche">Barbería El Rey</span>
                            <span className="text-[10px] text-lumo-pizarra">(432) 555-0199</span>
                          </div>
                        </div>

                        {/* Chat Bubble Thread */}
                        <div className="p-4 space-y-3 grow flex flex-col justify-end text-xs">
                          <div className="bg-white p-3 rounded-2xl rounded-tl-xs max-w-[85%] border border-lumo-niebla text-lumo-noche shadow-xs">
                            ¡Hola! Gracias por contactar a Barbería El Rey en Midland. ¿En qué horario deseas tu cita?
                          </div>

                          {smsSent && (
                            <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-xs max-w-[85%] self-end shadow-xs animate-in slide-in-from-bottom-2 duration-150">
                              Hola, me gustaría agendar un corte clásico hoy a las 4:00 PM.
                            </div>
                          )}
                        </div>

                        {/* SMS Input & Actions */}
                        <div className="p-3 bg-white border-t border-lumo-niebla space-y-2">
                          {!smsSent ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value="Hola, me gustaría agendar un corte hoy a las 4:00 PM."
                                className="w-full text-xs bg-slate-100 p-2.5 rounded-xl border border-lumo-niebla text-slate-700 outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => setSmsSent(true)}
                                className="p-2.5 rounded-xl bg-blue-600 text-white active:scale-95"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-xs text-emerald-700 font-bold py-1">
                              Mensaje enviado al negocio
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveScreen('idle')}
                            className="w-full py-2 rounded-xl bg-slate-200 text-lumo-noche text-xs font-bold active:scale-95"
                          >
                            Volver a la vista del teléfono
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 4. BOOKING SIMULATOR SCREEN */}
                    {activeScreen === 'booking' && (
                      <div className="flex flex-col h-full grow bg-white justify-between animate-in fade-in duration-200">
                        <div className="p-3 bg-blue-600 text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-bold">Square / Booksy Simulator</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveScreen('idle');
                              setBookingConfirmed(false);
                            }}
                            className="text-xs underline text-blue-100"
                          >
                            Cerrar
                          </button>
                        </div>

                        <div className="p-4 space-y-3 grow text-left">
                          {!bookingConfirmed ? (
                            <>
                              <h5 className="font-bold text-sm text-lumo-noche">Elige Servicio y Hora:</h5>
                              <div className="space-y-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 font-bold text-blue-900 flex justify-between">
                                  <span>Corte Clásico + Barba</span>
                                  <span>$35 USD</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex justify-between">
                                  <span>Barbero: Carlos</span>
                                  <span className="text-emerald-700 font-bold">Disponible</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex justify-between">
                                  <span>Horario: Hoy 4:30 PM</span>
                                  <span className="text-blue-700 font-bold">Seleccionado</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-8 space-y-3 animate-in zoom-in duration-150">
                              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                              <h5 className="font-bold text-sm text-lumo-noche">¡Cita Agendada en 1 Clic!</h5>
                              <p className="text-xs text-lumo-pizarra">
                                Se envió la confirmación y el recordatorio automático por SMS al cliente.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-lumo-niebla space-y-2">
                          {!bookingConfirmed ? (
                            <button
                              type="button"
                              onClick={() => setBookingConfirmed(true)}
                              className="min-h-touch w-full py-3 rounded-xl bg-lumo-ambar text-lumo-noche font-bold text-xs shadow-md active:scale-95"
                            >
                              Confirmar Cita Demo (1 Clic)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveScreen('idle');
                                setBookingConfirmed(false);
                              }}
                              className="w-full py-2 rounded-xl bg-lumo-noche text-white font-bold text-xs active:scale-95"
                            >
                              Volver al Teléfono
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. WHATSAPP SIMULATOR SCREEN */}
                    {activeScreen === 'whatsapp' && (
                      <div className="flex flex-col h-full grow bg-[#E5DDD5] justify-between animate-in fade-in duration-200">
                        <div className="p-3 bg-[#075E54] text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <div>
                              <span className="block text-xs font-bold leading-tight">Barbería El Rey</span>
                              <span className="text-[10px] text-emerald-200">Cuenta de Empresa Verificada</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveScreen('idle')}
                            className="text-xs underline text-emerald-200"
                          >
                            Cerrar
                          </button>
                        </div>

                        <div className="p-4 space-y-3 grow flex flex-col justify-end text-xs">
                          <div className="bg-white p-3 rounded-2xl rounded-tl-xs max-w-[90%] shadow-xs text-slate-800 space-y-1.5">
                            <p className="font-bold text-emerald-800">Mensaje Automático de Bienvenida:</p>
                            <p>
                              ¡Hola! Bienvenido a Barbería El Rey en Midland, TX. Puedes consultar nuestro catálogo de cortes, precios y agendar tu visita directa por aquí.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-white border-t border-lumo-niebla space-y-2">
                          <a
                            href="https://wa.me/14325550199"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-touch w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-md active:scale-95"
                          >
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <span>Abrir Chat Real de WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setActiveScreen('idle')}
                            className="w-full py-2 rounded-xl bg-slate-200 text-lumo-noche text-xs font-bold active:scale-95"
                          >
                            Volver al Teléfono
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 6. META / INSTAGRAM SIMULATOR SCREEN */}
                    {activeScreen === 'meta' && (
                      <div className="flex flex-col h-full grow bg-white justify-between animate-in fade-in duration-200">
                        <div className="p-3 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            <div>
                              <span className="block text-xs font-bold leading-tight">elreybarbershop_tx</span>
                              <span className="text-[10px] text-white/80">Meta Business Auto-Reply</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveScreen('idle')}
                            className="text-xs underline text-white"
                          >
                            Cerrar
                          </button>
                        </div>

                        <div className="p-4 space-y-3 grow flex flex-col justify-end text-xs">
                          <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-xs max-w-[90%] text-slate-800 space-y-1">
                            <p className="font-bold text-purple-800">Respuesta Inmediata Automatizada:</p>
                            <p>
                              ¡Hola! Gracias por escribir a Barbería El Rey. Atendemos de Mar a Sáb 9:00 AM a 7:00 PM en Midland, TX. Para citas en 1 toque entra a nuestro perfil web.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-lumo-niebla">
                          <button
                            type="button"
                            onClick={() => setActiveScreen('idle')}
                            className="w-full py-2.5 rounded-xl bg-lumo-noche text-white text-xs font-bold active:scale-95"
                          >
                            Volver a la vista del teléfono
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Demo Opening Buttons Underneath Simulated Phone */}
                  <div className="mt-6 w-full max-w-[310px] sm:max-w-[340px] space-y-2.5 mx-auto">
                    <Link
                      href="/demo/barberia"
                      className="min-h-touch w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-lumo-noche hover:bg-black active:bg-black text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.98]"
                    >
                      <Scissors className="w-4 h-4 text-lumo-ambar shrink-0" />
                      <span>Abrir Demo Completa: Barbería El Rey</span>
                      <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
                    </Link>

                    <Link
                      href="/demo/taqueria"
                      className="min-h-touch w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white hover:bg-lumo-arena active:bg-lumo-arena border-2 border-lumo-noche text-lumo-noche font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.98]"
                    >
                      <Utensils className="w-4 h-4 text-lumo-ambar shrink-0" />
                      <span>Abrir Demo Completa: Taquería Los Compadres</span>
                      <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          );
}
