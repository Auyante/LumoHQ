'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  QrCode,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface TemplateMessage {
  id: string;
  title: string;
  text: string;
}

export default function ReviewKitGeneratorPage() {
  const [businessName, setBusinessName] = useState('Barbería El Rey');
  const [googleInput, setGoogleInput] = useState('https://g.page/r/el-rey-barbershop-midland/review');
  const [shortLink, setShortLink] = useState('https://g.page/r/el-rey-barbershop-midland/review');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateMessage[]>([
    {
      id: '1',
      title: 'Mensaje 1: Después de atender a un cliente satisfecho (WhatsApp/SMS)',
      text: 'Hola! Muchas gracias por visitarnos en Barbería El Rey. Nos ayuda muchísimo una opinión en Google para que más vecinos nos conozcan. Si tienes 30 segundos, nos dejas tu reseña aquí: https://g.page/r/el-rey-barbershop-midland/review — Te lo agradecemos mucho!',
    },
    {
      id: '2',
      title: 'Mensaje 2: Para clientes habituales o al entregar un trabajo',
      text: 'Hola! Qué tal quedó todo en Barbería El Rey? Tu opinión nos ayuda a seguir mejorando. Nos apoyarías con una calificación rápida en Google? Solo toca aquí: https://g.page/r/el-rey-barbershop-midland/review Muchas gracias por tu preferencia!',
    },
    {
      id: '3',
      title: 'Mensaje 3: Bilingüe (Inglés y Español)',
      text: 'Thank you for visiting Barbería El Rey! Please leave us a quick review on Google: https://g.page/r/el-rey-barbershop-midland/review / Gracias por tu visita! Si te gustó el servicio, déjanos tu reseña en Google: https://g.page/r/el-rey-barbershop-midland/review',
    },
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/reviews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          googleUrlOrPlaceId: googleInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar el kit');

      setShortLink(data.shortReviewLink);
      setTemplates(data.templates);
    } catch (err) {
      alert((err instanceof Error ? err.message : '') || 'Error al generar kit');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 grow w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-lumo-pizarra hover:text-lumo-noche transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la página principal</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-arena border border-lumo-niebla text-lumo-noche text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-4 h-4 text-lumo-ambar" />
            <span>KIT DE RESEÑAS GOOGLE · DIGITAL & IMPRIMIBLE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black font-heading text-lumo-noche">
            Generador Oficial de Kit de Reseñas QR
          </h1>

          <p className="text-sm sm:text-base text-lumo-pizarra max-w-3xl leading-relaxed">
            Genera en segundos el enlace corto verificado de Google Reviews, los guiones oficiales aprobados para clientes reales y el diseño imprimible del Sticker para Mostrador (1200×1200px).
          </p>
        </div>

        {/* Input Configuration Card */}
        <div className="rounded-3xl bg-white border border-lumo-niebla p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-lumo-noche mb-1.5">
                Nombre del Negocio Local:
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Barbería El Rey / Taquería Los Compadres"
                className="min-h-touch w-full px-4 py-3 rounded-xl border border-lumo-niebla text-sm focus:border-lumo-ambar outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-lumo-noche mb-1.5">
                  Enlace Oficial de Google Reviews o Place ID:
                </label>
                <input
                  type="text"
                  required
                  value={googleInput}
                  onChange={(e) => setGoogleInput(e.target.value)}
                  placeholder="https://g.page/r/... o Place ID"
                  className="min-h-touch w-full px-4 py-3 rounded-xl border border-lumo-niebla text-sm focus:border-lumo-ambar outline-hidden"
                />
              </div>

              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-touch w-full md:w-auto px-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:scale-95 text-lumo-noche font-black text-sm shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Generando...' : 'Generar Kit'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Generated Deliverables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Printable Sticker Mockup (1200x1200px) */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-lumo-niebla p-6 sm:p-8 shadow-md space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-lumo-niebla pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-lumo-noche">
                Arte Oficial de Impresión
              </span>
              <span className="text-[11px] font-bold text-lumo-ambar bg-lumo-arena px-2 py-0.5 rounded-full border border-lumo-niebla">
                1200 × 1200 px
              </span>
            </div>

            <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-lumo-noche bg-white">
              <Image
                src="/images/sticker_resenas_1200x1200.png"
                alt="Sticker QR Imprimible"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 256px, 320px"
              />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-lumo-noche">{businessName}</h4>
              <p className="text-xs text-lumo-pizarra">
                Listo para imprimir en vinilo autoadhesivo o tarjeta de mostrador acrílica en Office Depot de Midland.
              </p>
            </div>

            <a
              href="/images/sticker_resenas_1200x1200.png"
              download={`sticker_resenas_${businessName.toLowerCase().replace(/\s+/g, '_')}.png`}
              className="min-h-touch w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lumo-noche hover:bg-black text-white font-bold text-xs shadow-md transition-transform active:scale-95"
            >
              <Download className="w-4 h-4 text-lumo-brillo" />
              <span>Descargar Imagen PNG Alta Resolución</span>
            </a>
          </div>

          {/* Short Link & Text Message Templates */}
          <div className="lg:col-span-7 space-y-6">
            {/* Short Link Box */}
            <div className="rounded-3xl bg-white border border-lumo-niebla p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold text-lumo-pizarra uppercase tracking-wider block">
                Enlace Corto para Compartir:
              </span>
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-lumo-arena/60 border border-lumo-niebla">
                <span className="font-mono text-xs text-lumo-noche truncate">{shortLink}</span>
                <button
                  type="button"
                  onClick={() => copyText('shortlink', shortLink)}
                  className="min-h-touch px-3 py-1.5 rounded-lg bg-lumo-noche text-white text-xs font-bold flex items-center gap-1.5 shrink-0 hover:bg-black"
                >
                  {copiedId === 'shortlink' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'shortlink' ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Approved Message Templates */}
            <div className="rounded-3xl bg-white border border-lumo-niebla p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-lumo-niebla pb-3">
                <h3 className="font-extrabold text-base text-lumo-noche font-heading">
                  Guiones Oficiales para Enviar a Clientes Reales
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Documento 03
                </span>
              </div>

              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-2xl border border-lumo-niebla bg-slate-50/70 hover:bg-white hover:border-lumo-ambar/50 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-lumo-noche">{tpl.title}</span>
                      <button
                        type="button"
                        onClick={() => copyText(tpl.id, tpl.text)}
                        className="min-h-touch px-2.5 py-1 rounded-md bg-white border border-lumo-niebla hover:bg-lumo-arena text-xs font-semibold text-lumo-noche flex items-center gap-1 shrink-0"
                      >
                        {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === tpl.id ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-lumo-pizarra leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-mono select-all">
                      {tpl.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strict FTC Reminder Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Cumplimiento de la FTC:</strong> Los guiones deben enviarse uno a uno de forma personalizada por WhatsApp o SMS tras brindar el servicio. Queda terminantemente prohibido el envío masivo en frío (TCPA) o condicionar incentivos a cambio de una valoración positiva.
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

