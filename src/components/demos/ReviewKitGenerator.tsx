'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Download,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface TemplateMessage {
  id: string;
  title: string;
  text: string;
}

export function ReviewKitGenerator() {
  const [businessName, setBusinessName] = useState('Barbería Los Compadres');
  const [googleInput, setGoogleInput] = useState('https://g.page/r/los-compadres-midland/review');
  const [shortLink, setShortLink] = useState('https://g.page/r/los-compadres-midland/review');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateMessage[]>([
    {
      id: '1',
      title: 'Mensaje 1: Después de atender a un cliente satisfecho (WhatsApp/SMS)',
      text: '¡Hola! Muchas gracias por visitarnos en Barbería Los Compadres. Nos ayuda muchísimo una opinión en Google para que más vecinos nos conozcan. Si tienes 30 segundos, nos dejas tu reseña aquí: https://g.page/r/los-compadres-midland/review — ¡Te lo agradecemos mucho!',
    },
    {
      id: '2',
      title: 'Mensaje 2: Para clientes habituales o al entregar un trabajo',
      text: '¡Hola! ¿Qué tal quedó todo en Barbería Los Compadres? Tu opinión nos ayuda a seguir mejorando. ¿Nos apoyarías con una calificación rápida en Google? Solo toca aquí: https://g.page/r/los-compadres-midland/review ¡Muchas gracias por tu preferencia!',
    },
    {
      id: '3',
      title: 'Mensaje 3: Bilingüe (Inglés y Español)',
      text: 'Thank you for visiting Barbería Los Compadres! Please leave us a quick review on Google: https://g.page/r/los-compadres-midland/review / ¡Gracias por tu visita! Si te gustó el servicio, déjanos tu reseña en Google: https://g.page/r/los-compadres-midland/review',
    },
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/reviews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, googleUrlOrPlaceId: googleInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar kit');
      setShortLink(data.shortReviewLink);
      setTemplates(data.templates);
    } catch (err: any) {
      alert(err.message || 'Error al generar');
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
    <div className="space-y-6">
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
              placeholder="Ej. Barbería Los Compadres"
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
    </div>
  );
}
export default ReviewKitGenerator;

