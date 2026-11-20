'use client';

/**
 * Live media for the "Qué incluye" feature panel (catalog piece 18).
 * Small, real UI instead of stock pictures. Example business, labeled.
 */
import { useState } from 'react';
import { CalendarCheck, Clock, Globe, MapPin, MessageSquareText, Phone, QrCode, Star } from 'lucide-react';
import type { Locale } from '@/lib/types';

const T = {
  es: {
    example: 'Negocio de ejemplo',
    open: 'Abierto · Cierra a las 7 p. m.',
    cat: 'Barbería · Midland, TX',
    call: 'Llamar', route: 'Cómo llegar', site: 'Sitio web',
    pageLine: 'Cortes, barba y diseños. Hablamos español e inglés.',
    hours: 'Lun a Sáb, 9 a. m. a 7 p. m.',
    text: 'Mandar texto', book: 'Reservar',
    calling: 'Llamando a Barbería El Rey…', texting: 'Hola, ¿tienen espacio hoy?', booked: 'Reservado hoy a las 4:30',
    qrTitle: 'Escanea y déjanos tu reseña',
    qrNote: 'Solo clientes reales. Nunca compramos reseñas.',
    reviews: 'reseñas',
  },
  en: {
    example: 'Example business',
    open: 'Open · Closes 7 PM',
    cat: 'Barber shop · Midland, TX',
    call: 'Call', route: 'Directions', site: 'Website',
    pageLine: 'Cuts, beards and designs. We speak English and Spanish.',
    hours: 'Mon to Sat, 9 AM to 7 PM',
    text: 'Send a text', book: 'Book',
    calling: 'Calling El Rey Barber Shop…', texting: 'Hi, any openings today?', booked: 'Booked today at 4:30',
    qrTitle: 'Scan and leave us a review',
    qrNote: 'Real customers only. We never buy reviews.',
    reviews: 'reviews',
  },
};

const PHOTO = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=900&q=70&auto=format&fit=crop';

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{children}</span>;
}

export function GooglePanel({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#E6E8EE] p-5">
      <Tag>{t.example}</Tag>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-[#1B2130] shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote example photo in a live mock */}
        <img src={PHOTO} alt="" className="h-36 w-full object-cover" />
        <div className="p-4">
          <p className="font-heading text-xl font-extrabold">Barbería El Rey</p>
          <p className="mt-1 flex items-center gap-1 text-sm">
            <span className="font-bold">4.8</span>
            {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-3.5 fill-[#F2A33A] text-[#F2A33A]" aria-hidden />)}
            <span className="text-[#5B6375]">(37)</span>
          </p>
          <p className="mt-1 text-sm text-[#5B6375]">{t.cat}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#1E7F4F]"><Clock className="size-3.5" aria-hidden />{t.open}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px] font-semibold text-[#1a5fb4]">
            {[[Phone, t.call], [MapPin, t.route], [Globe, t.site]].map(([I, l]) => {
              const Icon = I as typeof Phone;
              return (
                <span key={l as string} className="flex flex-col items-center gap-1">
                  <span className="grid size-10 place-items-center rounded-full border border-[#DCDFE6]"><Icon className="size-4" aria-hidden /></span>
                  {l as string}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PagePanel({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [lang, setLang] = useState<'es' | 'en'>(locale);
  const line = T[lang];
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#1B2130] p-5">
      <Tag>{t.example}</Tag>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#FFF7EC] text-[#1B2130] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <span className="text-[12px] font-semibold text-[#5B6375]">barberiaelrey.com</span>
          <div className="flex rounded-full bg-[#1B2130]/10 p-0.5" role="group" aria-label="Idioma de la página de ejemplo">
            {(['es', 'en'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`min-h-[32px] min-w-[40px] rounded-full text-[12px] font-bold ${lang === l ? 'bg-[#1B2130] text-[#FFF7EC]' : 'text-[#5B6375]'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote example photo in a live mock */}
        <img src={PHOTO} alt="" className="h-32 w-full object-cover" />
        <div className="p-4">
          <p className="font-heading text-2xl font-extrabold leading-tight">Barbería El Rey</p>
          <p className="mt-2 text-sm text-[#5B6375]">{line.pageLine}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm"><Clock className="size-3.5" aria-hidden />{line.hours}</p>
        </div>
      </div>
    </div>
  );
}

export function ContactPanel({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [msg, setMsg] = useState<string | null>(null);
  const buttons: [typeof Phone, string, string][] = [[Phone, t.call, t.calling], [MessageSquareText, t.text, t.texting], [CalendarCheck, t.book, t.booked]];
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#E6E8EE] p-5">
      <Tag>{t.example}</Tag>
      <div className="w-60 rounded-[2.2rem] border-[6px] border-[#07090E] bg-[#1B2130] p-4 pt-8 text-[#FFF7EC] shadow-2xl">
        <p className="text-center font-heading text-lg font-extrabold">Barbería El Rey</p>
        <p className="mt-1 text-center text-[12px] text-[#B7BDCB]">{t.open}</p>
        <div className="mt-5 grid gap-2">
          {buttons.map(([I, l, m], i) => (
            <button key={l} type="button" onClick={() => setMsg(m)} className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${i === 0 ? 'bg-[#F2A33A] text-[#1B2130] hover:bg-[#F7B75A]' : 'bg-white/10 hover:bg-white/15'}`}>
              <I className="size-4" aria-hidden />{l}
            </button>
          ))}
        </div>
        <p className="mt-4 min-h-[40px] rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] text-[#FFD27A]" aria-live="polite">{msg ?? ' '}</p>
      </div>
    </div>
  );
}

export function ReviewsPanel({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#FFF7EC] p-5">
      <Tag>{t.example}</Tag>
      <div className="w-full max-w-xs rounded-2xl border-2 border-dashed border-[#D9C8A9] bg-white p-6 text-center text-[#1B2130] shadow-xl">
        <p className="font-heading text-xl font-extrabold leading-tight">{t.qrTitle}</p>
        <div className="mx-auto mt-4 grid size-36 place-items-center rounded-xl bg-[#1B2130]">
          <QrCode className="size-28 text-[#FFF7EC]" aria-hidden strokeWidth={1.3} />
        </div>
        <p className="mt-4 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-5 fill-[#F2A33A] text-[#F2A33A]" aria-hidden />)}
        </p>
        <p className="mt-3 text-[13px] text-[#5B6375]">{t.qrNote}</p>
      </div>
    </div>
  );
}
