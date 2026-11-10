import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, MessageCircle, ArrowRight, Languages } from 'lucide-react';
import { crmStore, type ProspectItem } from '@/lib/crm';
import { verifyDiagnosisKey } from '@/lib/auth';
import { CONTACT } from '@/components/talonario/copy';
import { PrintButton } from './PrintButton';

/**
 * Public 1-page diagnosis for one business. Rendered on the server: the browser receives only this
 * business's diagnosis, never the CRM. The link must carry the signed key from the CRM; without it the
 * page shows nothing. Owner name and phone are never printed here.
 */

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Diagnóstico · Lumo HQ', robots: { index: false, follow: false } };

type Lang = 'es' | 'en';
type Key = keyof ProspectItem['signals'];

/** Signals 1-7 in the order an owner should fix them: what stops a customer from calling comes first. */
const ITEMS: { key: Key; es: [string, string, string]; en: [string, string, string] }[] = [
  { key: 'scoreBooking', es: ['Botón para reservar o pedir', 'Falta el botón para reservar o pedir.', 'Tus clientes reservan o piden en un clic.'], en: ['Book or order button', 'There is no button to book or order.', 'Customers can book or order in one tap.'] },
  { key: 'scoreHours', es: ['Horario', 'El horario está vacío o incompleto.', 'Tu horario está completo.'], en: ['Hours', 'Your hours are missing or incomplete.', 'Your hours are complete.'] },
  { key: 'scorePhotos', es: ['Fotos', 'Hay pocas fotos o son viejas.', 'Tienes fotos recientes de tu trabajo.'], en: ['Photos', 'Few photos, or old ones.', 'You have recent photos of your work.'] },
  { key: 'scoreWebsite', es: ['Página web', 'No hay página web, o está rota.', 'Tu página web funciona.'], en: ['Website', 'No website, or it is broken.', 'Your website works.'] },
  { key: 'scoreReviews', es: ['Reseñas', 'Menos de 20 reseñas, o la última tiene más de 3 meses.', 'Tus reseñas están al día.'], en: ['Reviews', 'Under 20 reviews, or the latest is over 3 months old.', 'Your reviews are up to date.'] },
  { key: 'scoreReviewResponse', es: ['Respuestas a reseñas', 'Hay reseñas sin respuesta tuya.', 'Respondes tus reseñas.'], en: ['Review replies', 'Some reviews have no reply from you.', 'You reply to your reviews.'] },
  { key: 'scoreDescription', es: ['Descripción y servicios', 'Falta la descripción, los servicios o la categoría correcta.', 'Tu descripción y servicios están completos.'], en: ['Description and services', 'Missing description, services or the right category.', 'Your description and services are complete.'] },
];

const T = {
  es: {
    title: 'Diagnóstico de tu negocio en Google', prepared: 'Preparado por Lumo HQ', date: 'Fecha',
    score: (n: number) => `${n} de 7 puntos que hoy te pueden hacer perder clientes`,
    fixFirst: 'Lo que conviene arreglar primero', allGood: 'En orden', spanish: 'Tus clientes hablan español: tu perfil y tu página deben estar en inglés y en español.',
    why: 'Por qué importa: cuando alguien te recomienda, la otra persona te busca en Google antes de llamarte. Si ve renglones vacíos, duda y llama al de al lado.',
    honest: 'No prometemos el primer lugar en Google ni un número de clientes. Esto es solo lo que vimos en tu perfil público.',
    meet: 'Agendar 15 minutos', meetNote: 'Contesta el mensaje donde te llegó este diagnóstico y te explicamos cada punto en 15 minutos.',
    hire: 'Ver precios y contratar', print: 'Imprimir o guardar PDF', other: 'English',
    invalidT: 'Este enlace no es válido', invalidP: 'Pide a quien te lo mandó un enlace nuevo.',
  },
  en: {
    title: 'Your business on Google: diagnosis', prepared: 'Prepared by Lumo HQ', date: 'Date',
    score: (n: number) => `${n} of 7 things that can cost you customers today`,
    fixFirst: 'What to fix first', allGood: 'In order', spanish: 'Your customers speak Spanish: your profile and page should be in both English and Spanish.',
    why: 'Why it matters: when someone recommends you, the other person looks you up on Google before calling. If they see blank lines, they hesitate and call the place next door.',
    honest: 'We do not promise the top spot on Google or a number of customers. This is only what we saw on your public profile.',
    meet: 'Book 15 minutes', meetNote: 'Reply to the message this diagnosis came in and we will walk you through each point in 15 minutes.',
    hire: 'See pricing and get started', print: 'Print or save as PDF', other: 'Español',
    invalidT: 'This link is not valid', invalidP: 'Ask whoever sent it for a new link.',
  },
} as const;

export default async function DiagnosisPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string; lang?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const lang: Lang = sp.lang === 'en' ? 'en' : 'es';
  const t = T[lang];
  const lead = verifyDiagnosisKey(id, sp.k) ? crmStore.getById(id) : undefined;

  if (!lead) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-100 px-4">
        <div className="max-w-sm text-center bg-white rounded-3xl p-8 border border-lumo-niebla">
          <h1 className="text-xl font-black font-heading text-lumo-noche">{t.invalidT}</h1>
          <p className="text-sm text-lumo-pizarra mt-2">{t.invalidP}</p>
        </div>
      </main>
    );
  }

  const failing = ITEMS.filter((i) => lead.signals[i.key]);
  const passing = ITEMS.filter((i) => !lead.signals[i.key]);
  const otherHref = `/diagnostico/${encodeURIComponent(id)}?k=${encodeURIComponent(sp.k!)}${lang === 'es' ? '&lang=en' : ''}`;
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const wa = CONTACT.phone ? `https://wa.me/${CONTACT.phone.replace(/\D/g, '')}?text=${encodeURIComponent(lang === 'es' ? `Hola, recibí el diagnóstico de ${lead.businessName}. ¿Cuándo nos vemos 15 minutos?` : `Hi, I got the diagnosis for ${lead.businessName}. When can we meet for 15 minutes?`)}` : null;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 print:bg-white print:p-0" lang={lang}>
      <div className="max-w-3xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={otherHref} className="min-h-touch inline-flex items-center gap-2 px-4 rounded-xl bg-white border border-slate-300 text-sm font-bold">
          <Languages className="w-4 h-4" aria-hidden="true" />{t.other}
        </Link>
        <PrintButton label={t.print} />
      </div>

      <main className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-lumo-niebla print:border-0 print:rounded-none print:p-0">
        <header className="flex items-start justify-between gap-4 pb-4 border-b-2 border-lumo-noche">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-lumo-pizarra">{t.prepared}</p>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-lumo-noche leading-tight mt-1">{t.title}</h1>
            <p className="text-lg font-bold text-lumo-noche mt-2 break-words">{lead.businessName}</p>
            <p className="text-sm text-lumo-pizarra">{lead.city}, TX · {lead.category}</p>
          </div>
          <div className="text-right shrink-0">
            <svg viewBox="-28 -28 604 216" className="h-7 w-auto ml-auto" aria-label="Lumo HQ" role="img">
              <path d="M12 12V148M60 72V110A38 38 0 0 0 136 110M136 72V148M184 72V148M184 106A34 34 0 0 1 252 106V148M252 106A34 34 0 0 1 320 106V148" fill="none" stroke="#1B2130" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="400" cy="110" r="38" fill="none" stroke="#F2A33A" strokeWidth="24" /><circle cx="400" cy="110" r="11" fill="#F2A33A" />
            </svg>
            <p className="text-xs text-lumo-pizarra mt-2">{t.date}: {today}</p>
          </div>
        </header>

        <section className="mt-6" aria-labelledby="score-h">
          <h2 id="score-h" className="text-lg font-black text-lumo-noche">{t.score(failing.length)}</h2>
          <p className="text-sm text-slate-700 mt-1 max-w-prose">{t.why}</p>
        </section>

        {failing.length > 0 && (
          <section className="mt-6" aria-labelledby="fix-h">
            <h2 id="fix-h" className="text-xs font-black uppercase tracking-widest text-red-800 mb-2">{t.fixFirst}</h2>
            <ol className="space-y-2">
              {failing.map((i, n) => (
                <li key={i.key} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 break-inside-avoid">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-red-700 text-white grid place-items-center text-sm font-black tabular-nums">{n + 1}</span>
                  <div><p className="font-bold text-red-900">{i[lang][0]}</p><p className="text-sm text-red-900/90">{i[lang][1]}</p></div>
                  <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 ml-auto mt-0.5" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </section>
        )}

        {passing.length > 0 && (
          <section className="mt-6" aria-labelledby="ok-h">
            <h2 id="ok-h" className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-2">{t.allGood}</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {passing.map((i) => (
                <li key={i.key} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />{i[lang][2]}
                </li>
              ))}
            </ul>
          </section>
        )}

        {lead.signals.scoreSpanish && <p className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950">{t.spanish}</p>}

        <section className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="min-h-touch inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-lumo-ambar text-lumo-noche font-black">
              <MessageCircle className="w-5 h-5" aria-hidden="true" />{t.meet}
            </a>
          ) : (
            <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950"><strong className="block">{t.meet}</strong>{t.meetNote}</p>
          )}
          <Link href={`/checkout?package=${lead.category.toLowerCase().includes('contratista') || lead.category.toLowerCase().includes('roof') ? 'PREMIUM' : 'BASE'}&biz=${encodeURIComponent(lead.businessName)}`}
            className="min-h-touch inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-lumo-noche text-white font-black">
            {t.hire}<ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </section>

        <p className="mt-6 text-xs text-lumo-pizarra">{t.honest}</p>
      </main>
    </div>
  );
}
