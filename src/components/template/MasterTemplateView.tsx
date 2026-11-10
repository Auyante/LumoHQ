'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TemplateConfig } from '@/lib/templates';
import { DemoBadge } from '@/components/demos/DemoBadge';
import { BookingModal } from '@/components/demos/BookingModal';
import { WhatsAppOrderModal } from '@/components/demos/WhatsAppOrderModal';
import { ReviewQrCard } from '@/components/demos/ReviewQrCard';
import type { Locale } from '@/lib/types';
import {
  Phone,
  MessageSquare,
  Calendar,
  MessageCircle,
  MapPin,
  Clock,
  Instagram,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface MasterTemplateViewProps {
  config: TemplateConfig;
  ownerToggle?: React.ComponentProps<typeof DemoBadge>['ownerToggle'];
  onBooked?: React.ComponentProps<typeof BookingModal>['onBooked'];
  onOrdered?: React.ComponentProps<typeof WhatsAppOrderModal>['onOrdered'];
  /** Controlled language (the demo shell keeps it when switching views). */
  locale?: Locale;
  onLocaleChange?: (l: Locale) => void;
}

export function MasterTemplateView({ config, ownerToggle, onBooked, onOrdered, locale: lockedLocale, onLocaleChange }: MasterTemplateViewProps) {
  const [ownLocale, setOwnLocale] = useState<Locale>('es');
  const locale = lockedLocale ?? ownLocale;
  const setLocale = (l: Locale) => (onLocaleChange ? onLocaleChange(l) : setOwnLocale(l));
  const [bookingOpen, setBookingOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);

  const toggleLocale = () => {
    setLocale(locale === 'es' ? 'en' : 'es');
  };

  const categories = Array.from(new Set(config.items.map((i) => i.category)));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-amber-200">
      {/* 1. Official DEMO Bar */}
      <DemoBadge
        businessName={config.name}
        locale={locale}
        onToggleLocale={toggleLocale}
        ownerToggle={ownerToggle}
      />

      {/* 2. Business Header & Hero Banner */}
      <header className="relative bg-lumo-noche text-white border-b border-lumo-niebla/20 py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-lumo-noche/90 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-ambar/20 text-lumo-brillo border border-lumo-ambar/40 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-lumo-ambar" />
                <span>{config.nap.city}, {config.nap.state} · Google Business Profile</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight text-white">
                {config.name}
              </h1>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {locale === 'es' ? config.taglineEs : config.taglineEn}
              </p>

              {/* Verified NAP Details */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-lumo-ambar shrink-0" />
                  <span>{config.nap.address}, {config.nap.city}, {config.nap.state} {config.nap.zipCode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-lumo-brillo shrink-0" />
                  <a href={`tel:${config.nap.phone.replace(/[^0-9]/g, '')}`} className="font-bold hover:underline">
                    {config.nap.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Action Box Desktop */}
            <div className="hidden lg:flex flex-col gap-2.5 w-64 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <span className="text-[11px] font-bold uppercase tracking-wider text-lumo-brillo text-center">
                {locale === 'es' ? 'Contacto Rápido' : 'Quick Contact'}
              </span>

              {config.buttons.hasCall && (
                <a
                  href={`tel:${config.nap.phone.replace(/[^0-9]/g, '')}`}
                  className="min-h-touch flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-lumo-noche font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  <Phone className="w-4 h-4 text-lumo-ambar" />
                  <span>{locale === 'es' ? 'Llamar al local' : 'Call store'}</span>
                </a>
              )}

              {config.buttons.hasBooking && (
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="min-h-touch flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:scale-95 text-lumo-noche font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{locale === 'es' ? 'Reservar Cita' : 'Book Appointment'}</span>
                </button>
              )}

              {config.buttons.hasWhatsApp && (
                <button
                  type="button"
                  onClick={() => setWhatsAppOpen(true)}
                  className="min-h-touch flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{locale === 'es' ? 'Pedir por WhatsApp' : 'Order via WhatsApp'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12 grow w-full">
        {/* Operating Hours & Texas Holidays Notice */}
        <section className="p-6 rounded-3xl bg-white border border-lumo-niebla shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-lumo-noche uppercase tracking-wider mb-4">
            <Clock className="w-4 h-4 text-lumo-ambar" />
            <span>{locale === 'es' ? 'Horario de Atención y Feriados' : 'Business Hours & Holidays'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-lumo-arena/60 border border-lumo-niebla">
              <span className="block font-bold text-lumo-noche">
                {locale === 'es' ? 'Lunes a Viernes' : 'Monday – Friday'}
              </span>
              <span className="text-lumo-pizarra font-semibold">{config.schedule.weekdays}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-lumo-arena/60 border border-lumo-niebla">
              <span className="block font-bold text-lumo-noche">
                {locale === 'es' ? 'Sábado' : 'Saturday'}
              </span>
              <span className="text-lumo-pizarra font-semibold">{config.schedule.saturday}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-lumo-arena/60 border border-lumo-niebla">
              <span className="block font-bold text-lumo-noche">
                {locale === 'es' ? 'Domingo' : 'Sunday'}
              </span>
              <span className="text-lumo-pizarra font-semibold">{config.schedule.sunday}</span>
            </div>
          </div>

          {config.schedule.holidaysNotice && (
            <p className="text-xs text-lumo-pizarra mt-3 pt-3 border-t border-lumo-niebla/60 italic">
              * {config.schedule.holidaysNotice}
            </p>
          )}
        </section>

        {/* Catalog / Menu Items List */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-lumo-niebla pb-3">
            <div>
              <span className="text-xs font-bold text-lumo-ambar uppercase tracking-wider block">
                {config.businessType === 'taqueria' || config.businessType === 'restaurante'
                  ? (locale === 'es' ? 'MENÚ Y ESPECIALIDADES' : 'MENU & SPECIALTIES')
                  : (locale === 'es' ? 'SERVICIOS Y TARIFAS' : 'SERVICES & PRICING')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-lumo-noche font-heading">
                {config.businessType === 'taqueria'
                  ? (locale === 'es' ? 'Nuestros Platillos' : 'Our Dishes')
                  : (locale === 'es' ? 'Catálogo de Cortes y Servicios' : 'Cuts & Services Catalog')}
              </h2>
            </div>

            {config.buttons.hasBooking && (
              <button
                type="button"
                onClick={() => setBookingOpen(true)}
                className="hidden sm:inline-flex min-h-touch items-center gap-1.5 px-4 py-2 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:scale-95 text-lumo-noche font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{locale === 'es' ? 'Reservar Cita' : 'Book Appointment'}</span>
              </button>
            )}

            {config.buttons.hasWhatsApp && (
              <button
                type="button"
                onClick={() => setWhatsAppOpen(true)}
                className="hidden sm:inline-flex min-h-touch items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>{locale === 'es' ? 'Ordenar por WhatsApp' : 'Order via WhatsApp'}</span>
              </button>
            )}
          </div>

          {/* Categorized Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.items.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white border border-lumo-niebla hover:border-lumo-ambar/60 transition-colors shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-extrabold text-base text-lumo-noche font-heading">
                      {locale === 'es' ? item.nameEs : item.nameEn}
                    </h3>
                    <span className="font-black text-lg text-lumo-noche shrink-0 font-heading">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-lumo-pizarra leading-relaxed mb-4">
                    {locale === 'es' ? item.descriptionEs : item.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-lumo-niebla/50">
                  <span className="text-[11px] font-bold text-lumo-pizarra uppercase">
                    {item.category}
                  </span>

                  {config.buttons.hasBooking && (
                    <button
                      type="button"
                      onClick={() => setBookingOpen(true)}
                      className="min-h-touch px-3 py-1.5 rounded-lg bg-lumo-arena hover:bg-lumo-ambar text-lumo-noche text-xs font-bold transition-colors cursor-pointer"
                    >
                      {locale === 'es' ? 'Elegir para cita' : 'Select for appointment'}
                    </button>
                  )}

                  {config.buttons.hasWhatsApp && (
                    <button
                      type="button"
                      onClick={() => setWhatsAppOpen(true)}
                      className="min-h-touch px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#25D366] text-emerald-800 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {locale === 'es' ? '+ Agregar al pedido' : '+ Add to order'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Counter Review QR Section */}
        <section>
          <ReviewQrCard
            businessName={config.name}
            shortLink={config.reviews.googleReviewShortLink}
            rating={config.reviews.rating}
            reviewCount={config.reviews.reviewCount}
            locale={locale}
          />
        </section>

        {/* Google Maps Location Embed */}
        <section className="rounded-3xl bg-white border border-lumo-niebla p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-lumo-noche uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-lumo-ambar" />
            <span>{locale === 'es' ? 'Ubicación y Cómo Llegar' : 'Location & Directions'}</span>
          </div>

          <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-lumo-niebla">
            <iframe
              title={`Mapa de ${config.name}`}
              src={config.nap.googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-lumo-pizarra pt-2">
            <div>
              <span className="font-bold text-lumo-noche">{config.nap.address}</span>, {config.nap.city}, {config.nap.state} {config.nap.zipCode}
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${config.nap.businessName} ${config.nap.address} ${config.nap.city} TX`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-touch inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lumo-noche text-white font-bold text-xs hover:bg-black transition-colors"
            >
              <span>{locale === 'es' ? 'Abrir en Google Maps' : 'Open in Google Maps'}</span>
            </a>
          </div>
        </section>
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-lumo-niebla py-8 text-center text-xs text-lumo-pizarra">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} {config.name}. {locale === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
          <p className="text-[11px] text-gray-400">
            {locale === 'es'
              ? 'Página modelo desarrollada por Lumo HQ ("Negocios Locales, Visibles") Midland, TX'
              : 'Sample page built by Lumo HQ ("Local Businesses, Visible") Midland, TX'}
          </p>
        </div>
      </footer>

      {/* 5. Sticky Bottom Bar on Mobile (< 1024px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-lumo-niebla p-3 shadow-2xl">
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          {config.buttons.hasCall && (
            <a
              href={`tel:${config.nap.phone.replace(/[^0-9]/g, '')}`}
              className="min-h-touch flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-lumo-noche active:bg-black text-white text-xs font-bold shadow-md"
            >
              <Phone className="w-3.5 h-3.5 text-lumo-brillo" />
              <span>{locale === 'es' ? 'Llamar' : 'Call'}</span>
            </a>
          )}

          {config.buttons.hasBooking && (
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="min-h-touch flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-lumo-ambar active:bg-[#c97e1e] text-lumo-noche text-xs font-black shadow-md cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{locale === 'es' ? 'Cita en 1 Clic' : 'Book Appointment'}</span>
            </button>
          )}

          {config.buttons.hasWhatsApp && (
            <button
              type="button"
              onClick={() => setWhatsAppOpen(true)}
              className="min-h-touch flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] active:bg-[#1EBE5D] text-white text-xs font-black shadow-md cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>{locale === 'es' ? 'Pedir por WhatsApp' : 'WhatsApp Order'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 6. Modals */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        services={config.items}
        locale={locale}
        businessName={config.name}
        onBooked={onBooked}
      />

      <WhatsAppOrderModal
        isOpen={whatsAppOpen}
        onClose={() => setWhatsAppOpen(false)}
        items={config.items}
        locale={locale}
        businessName={config.name}
        whatsAppNumber={config.buttons.whatsAppNumber || '14325550189'}
        onOrdered={onOrdered}
      />
    </div>
  );
}

