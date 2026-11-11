'use client';

/**
 * Lumo HQ homepage, composed from the web catalog (lab-3d pieces):
 * 24a sticky header · 16 image-stream hero + 19 rotating headline · 12 container scroll
 * with the live 02 bento (LumoBento) · 18 features with live panels · 20 pricing over
 * 21a starfield · 25 FAQ (+ JSON-LD) · diagnosis form · 27 cinematic curtain footer.
 */
import { useState } from 'react';
import { ArrowRight, Check, MessageCircle, MessageSquareText, Phone, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { HOME_COPY, type HomeCopy } from './copy';
import { ContactPanel, GooglePanel, PagePanel, ReviewsPanel } from './panels';
import Header from '@/components/ui/hero-01-utils/header';
import Velaris from '@/components/ui/velaris';
import { LiquidHero, MOOD } from './LiquidHero';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { LumoBento } from '@/components/lumo/LumoBento';
import FeaturesWithPanel, { type FeatureItem } from '@/components/ui/features-with-panel';
import { Pricing, type PricingPlan } from '@/components/ui/pricing';
import { Starfield } from '@/components/ui/starfield';
import FAQAccordion from '@/components/ui/faq-accordion';
import { CinematicFooter } from '@/components/ui/motion-footer';
import '@/components/ui/switch-utils/kernel-tokens.css';


const AMBAR = '#F2A33A';

function Logo() {
  return (
    <span className="whitespace-nowrap font-heading text-[22px] font-extrabold tracking-tight text-[#FFF7EC]">
      <span className="sr-only">Lumo HQ</span>
      <span aria-hidden>lum</span>
      <span aria-hidden className="relative inline-block size-[0.62em] translate-y-[0.02em] rounded-full border-[0.14em] border-[#F2A33A] align-baseline">
        <span className="absolute left-1/2 top-1/2 size-[0.16em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2A33A]" />
      </span>
      <span aria-hidden className="ml-1 text-[0.7em] text-[#F2A33A]">HQ</span>
    </span>
  );
}

function LangToggle({ label }: { label: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex rounded-full bg-white/[0.07] p-1 ring-1 ring-white/10" role="group" aria-label={label}>
      {(['es', 'en'] as const).map((l) => (
        <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)} className={`min-h-[36px] min-w-[44px] rounded-full text-[12px] font-bold tracking-wide ${locale === l ? 'bg-[#FFF7EC] text-[#1B2130]' : 'text-[#B7BDCB] hover:text-white'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function SectionHead({ title, lede, light }: { title: string; lede?: string; light?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className={`text-balance font-heading text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em] ${light ? 'text-[#1B2130]' : 'text-[#FFF7EC]'}`}>{title}</h2>
      {lede && <p className={`mx-auto mt-4 max-w-2xl text-lg leading-relaxed ${light ? 'text-[#5B6375]' : 'text-[#B7BDCB]'}`}>{lede}</p>}
    </div>
  );
}

function Days({ t }: { t: HomeCopy }) {
  const [day, setDay] = useState(0);
  const cur = t.days[day];
  return (
    <section id="dias" className="bg-[#FFF7EC] py-24 text-[#1B2130] md:py-32" aria-labelledby="dias-title">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl">
          <h2 id="dias-title" className="text-balance font-heading text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t.daysTitle}</h2>
          <p className="mt-4 text-lg text-[#5B6375]">{t.daysLede}</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
          <ol className="relative grid gap-2" role="tablist" aria-label={t.daysTitle}>
            <span className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-[#E9DCC4]" aria-hidden />
            <span className="absolute left-[27px] top-6 w-0.5 bg-[#F2A33A] transition-[height] duration-500 ease-out" style={{ height: `calc((100% - 48px) * ${day / (t.days.length - 1)})` }} aria-hidden />
            {t.days.map((d, i) => (
              <li key={d.n} className="relative">
                <button
                  type="button"
                  role="tab"
                  aria-selected={i === day}
                  onClick={() => setDay(i)}
                  className={`flex min-h-[56px] w-full items-center gap-4 rounded-xl px-2 text-left transition-colors ${i === day ? 'bg-white shadow-[0_8px_24px_-12px_rgba(27,33,48,0.35)]' : 'hover:bg-white/60'}`}
                >
                  <span className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full font-heading text-base font-extrabold tabular-nums transition-colors ${i <= day ? 'bg-[#F2A33A] text-[#1B2130]' : 'bg-[#E9DCC4] text-[#69635A]'}`}>{d.n}</span>
                  <span className="font-semibold">{d.t}</span>
                  <span className="ml-auto pr-2 text-[13px] font-semibold text-[#8F520A]">{d.who}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl bg-[#1B2130] p-8 text-[#FFF7EC] md:sticky md:top-28" role="tabpanel" aria-live="polite">
            <p className="text-sm font-bold text-[#F2A33A] tabular-nums">{t.dayWord} {cur.n}</p>
            <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight">{cur.t}</p>
            <p className="mt-3 text-lg text-[#B7BDCB]">{cur.d}</p>
            <p className="mt-6 text-sm text-[#B7BDCB]"><span className="font-semibold text-white">{t.whoLabel}:</span> {cur.who}</p>
          </div>
        </div>
        <p className="mt-8 max-w-2xl text-[15px] text-[#5B6375]">{t.pause}</p>
      </div>
    </section>
  );
}

function Promises({ t }: { t: HomeCopy }) {
  return (
    <section className="bg-white py-24 text-[#1B2130] md:py-32" aria-labelledby="rules-title">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl">
          <h2 id="rules-title" className="font-heading text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t.rulesLede}</h2>
        </div>
        <ul className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {t.rules.map(([q, a]) => (
            <li key={q} className="border-t border-[#E6E8EE] pt-6">
              <p className="flex items-start gap-2 font-heading text-lg font-extrabold">
                <X className="mt-1 size-5 shrink-0 text-[#D4402F]" aria-hidden />{q}
              </p>
              <p className="mt-2 text-[#5B6375]">{a}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type Channel = 'whatsapp' | 'sms' | 'call';

function Request({ t }: { t: HomeCopy }) {
  const [f, setF] = useState({ ownerName: '', businessName: '', phone: '', preferredChannel: 'whatsapp' as Channel, sourceOfCustomers: '', currentContactMethod: '', tcpaConsent: false, website: '' });
  const [err, setErr] = useState<{ field?: string; msg: string } | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((p) => ({ ...p, [k]: v })); if (err?.field === k) setErr(null); };
  const chLabel = { whatsapp: t.chWhatsapp, sms: t.chSms, call: t.chCall };
  const chIcon = { whatsapp: MessageCircle, sms: MessageSquareText, call: Phone };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.ownerName.trim().length < 2) return setErr({ field: 'ownerName', msg: t.errName });
    if (f.businessName.trim().length < 2) return setErr({ field: 'businessName', msg: t.errBiz });
    if (f.phone.replace(/\D/g, '').length < 10) return setErr({ field: 'phone', msg: t.errPhone });
    if (!f.sourceOfCustomers || !f.currentContactMethod) return setErr({ field: 'qs', msg: t.errQs });
    if (!f.tcpaConsent) return setErr({ field: 'tcpaConsent', msg: t.errConsent });
    setState('sending');
    setErr(null);
    try {
      const res = await fetch('/api/diagnosis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.errNet);
      setState('sent');
    } catch (ex) {
      setState('idle');
      setErr({ msg: ex instanceof Error && ex.message ? ex.message : t.errNet });
    }
  };
  const field = 'min-h-[52px] w-full rounded-xl border bg-[#0E1119] px-4 text-[17px] text-[#FFF7EC] placeholder:text-[#7D8496] focus:border-[#F2A33A] focus:outline-none focus:ring-4 focus:ring-[#F2A33A]/20';
  const border = (k: string) => (err?.field === k ? 'border-[#FF7866]' : 'border-white/15 hover:border-white/30');
  const label = 'mb-2 block text-sm font-bold text-[#B7BDCB]';

  return (
    <section id="diagnostico" className="relative overflow-hidden bg-[#1B2130]" aria-labelledby="form-title">
      {/* 14 + 21a: the hero's Atardecer gradient returns behind the form. */}
      <Velaris bg={MOOD.bg} colors={[...MOOD.colors]} height="auto" speed={0.7} grain={0.06}>
      <Starfield className="text-white/50" count={110} radius={380} seed={9} />
      <div className="pointer-events-none absolute inset-0 bg-[#0E1119]/45" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-[1fr_1.15fr] md:px-8 md:py-32">
        <div>
          <h2 id="form-title" className="text-balance font-heading text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#FFF7EC]">{t.formHead}</h2>
          <p className="mt-4 text-lg text-[#B7BDCB]">{t.formLede}</p>
          <ul className="mt-8 grid gap-3 text-[#FFF7EC]">
            {t.units.map((x) => (
              <li key={x.title} className="flex items-center gap-3"><Check className="size-5 text-[#F2A33A]" aria-hidden />{x.title}</li>
            ))}
          </ul>
          <p className="mt-8 max-w-md text-sm text-[#8D94A5]"><span className="font-semibold text-[#B7BDCB]">{t.ftcTitle}.</span> {t.ftc}</p>
          {state === 'sent' && (
            <div className="mt-8 rounded-2xl bg-[#F2A33A]/15 p-5 ring-1 ring-[#F2A33A]/40" role="status">
              <p className="font-heading text-xl font-extrabold text-[#FFF7EC]">{t.sentTitle}</p>
              <p className="mt-1 text-[#B7BDCB]">{t.sentText}</p>
            </div>
          )}
        </div>
        <form onSubmit={submit} noValidate className="grid gap-5 rounded-3xl bg-[#141925]/80 p-6 ring-1 ring-white/15 backdrop-blur-xl md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div><label htmlFor="f-name" className={label}>{t.fmName}</label><input id="f-name" autoComplete="name" maxLength={80} value={f.ownerName} onChange={(e) => set('ownerName', e.target.value)} aria-invalid={err?.field === 'ownerName'} className={`${field} ${border('ownerName')}`} /></div>
            <div><label htmlFor="f-biz" className={label}>{t.fmBiz}</label><input id="f-biz" autoComplete="organization" maxLength={100} value={f.businessName} onChange={(e) => set('businessName', e.target.value)} aria-invalid={err?.field === 'businessName'} className={`${field} ${border('businessName')}`} /></div>
          </div>
          <div><label htmlFor="f-phone" className={label}>{t.fmPhone}</label><input id="f-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={f.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={err?.field === 'phone'} className={`${field} ${border('phone')}`} /></div>
          <div>
            <span id="ch-label" className={label}>{t.fmChannel}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="ch-label">
              {(['whatsapp', 'sms', 'call'] as Channel[]).map((k) => {
                const I = chIcon[k];
                const on = f.preferredChannel === k;
                return (
                  <button key={k} type="button" aria-pressed={on} onClick={() => set('preferredChannel', k)} className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-4 text-[15px] font-bold transition-colors ${on ? 'border-[#F2A33A] bg-[#F2A33A]/15 text-[#FFF7EC]' : 'border-white/15 text-[#B7BDCB] hover:border-white/30'}`}>
                    <I className={`size-4 ${on ? 'text-[#F2A33A]' : ''}`} aria-hidden />{chLabel[k]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 md:items-end">
            <div><label htmlFor="f-src" className={label}>{t.fmSource}</label>
              <select id="f-src" value={f.sourceOfCustomers} onChange={(e) => set('sourceOfCustomers', e.target.value)} className={`${field} ${err?.field === 'qs' && !f.sourceOfCustomers ? 'border-[#FF7866]' : 'border-white/15'}`}>
                <option value="">{t.choose}</option>{t.sourceOpts.map((o) => <option key={o}>{o}</option>)}
              </select></div>
            <div><label htmlFor="f-ct" className={label}>{t.fmContact}</label>
              <select id="f-ct" value={f.currentContactMethod} onChange={(e) => set('currentContactMethod', e.target.value)} className={`${field} ${err?.field === 'qs' && !f.currentContactMethod ? 'border-[#FF7866]' : 'border-white/15'}`}>
                <option value="">{t.choose}</option>{t.contactOpts.map((o) => <option key={o}>{o}</option>)}
              </select></div>
          </div>
          {/* Honeypot: hidden from people, bots fill it; the API drops those requests. */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="f-web">Website</label><input id="f-web" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></div>
          <label className="grid cursor-pointer grid-cols-[24px_1fr] gap-3 text-[15px] text-[#B7BDCB]">
            <input type="checkbox" checked={f.tcpaConsent} onChange={(e) => set('tcpaConsent', e.target.checked)} className="mt-0.5 size-[22px] accent-[#F2A33A]" />
            <span className={err?.field === 'tcpaConsent' ? 'text-[#FFB1A6]' : ''}>{t.consent}</span>
          </label>
          {err && <p className="font-semibold text-[#FFB1A6]" role="alert">{err.msg}</p>}
          <button type="submit" disabled={state !== 'idle'} className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-[#F2A33A] text-[17px] font-bold text-[#1B2130] transition-colors hover:bg-[#F7B75A] disabled:opacity-60">
            {state === 'sending' ? t.fmSending : t.footCta}<ArrowRight className="size-5" aria-hidden />
          </button>
        </form>
      </div>
      </Velaris>
    </section>
  );
}

export function LumoHome() {
  const { locale } = useI18n();
  const t = HOME_COPY[locale];

  const features: FeatureItem[] = [
    { title: t.units[0].title, description: t.units[0].text, type: 'node', content: <GooglePanel locale={locale} /> },
    { title: t.units[1].title, description: t.units[1].text, type: 'node', content: <PagePanel locale={locale} /> },
    { title: t.units[2].title, description: t.units[2].text, type: 'node', content: <ContactPanel locale={locale} /> },
    { title: t.units[3].title, description: t.units[3].text, type: 'node', content: <ReviewsPanel locale={locale} /> },
  ];

  const es = locale === 'es';
  const plans: PricingPlan[] = [
    { name: es ? 'Fundador · 2 cupos' : 'Founder · 2 spots', price: 250, yearlyPrice: 100, features: t.baseRows, description: t.setupFounder, buttonText: t.founderGo, href: '#diagnostico' },
    { name: t.base, price: 500, yearlyPrice: 100, features: t.baseRows, description: `${t.setupNormal}. ${t.baseFor}.`, buttonText: t.baseGo, href: '#diagnostico', isPopular: true },
    { name: t.prem, price: 1000, yearlyPrice: 150, features: t.premRows, description: es ? `Montaje ${t.premSetup}, mensualidad ${t.premMonthly}. ${t.premFor}.` : `Setup ${t.premSetup}, monthly ${t.premMonthly}. ${t.premFor}.`, buttonText: t.premGo, href: '#diagnostico' },
  ];

  return (
    <div className="bg-[#0E1119] font-sans text-[#FFF7EC]" lang={locale}>
      <div className="dark">
      <Header
        brand=""
        logo={<Logo />}
        navigationData={t.nav.filter(([h]) => h !== '#ruta').map(([href, title]) => ({ href, title }))}
        cta={{ label: t.navCta, href: '#diagnostico' }}
        menuLabel={es ? 'Menú' : 'Menu'}
        actions={<LangToggle label={t.langLabel} />}
      />
      </div>

      <main id="main">
        {/* 14 + 21a + 13 + 19 + 06a: a living gradient the visitor can touch and recolor. */}
        <LiquidHero t={t} />

        {/* 12 + 02: the monthly report tilts up into view, live inside the frame. */}
        <section id="plaza" className="dark bg-[#0E1119]" aria-label={t.reportTitle}>
          <ContainerScroll
            titleComponent={<SectionHead title={t.reportTitle} lede={t.reportLede} />}
            frameClassName="border-[#2B3142] bg-[#141925] md:h-[46rem] [&>div]:bg-[#1B2130] [&>div]:p-3 md:[&>div]:p-5"
          >
            <div className="h-full overflow-y-auto overscroll-contain pr-1">
              <LumoBento business="Barbería El Rey" ctaHref="#diagnostico" />
            </div>
          </ContainerScroll>
        </section>

        {/* 18: what you get, each item with a live mock in the sticky panel. */}
        <section id="incluye" className="bg-[#FFF7EC] py-20 text-[#1B2130] md:py-28" aria-labelledby="incluye-title">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2 id="incluye-title" className="sr-only">{t.includedTitle}</h2>
            <FeaturesWithPanel items={features} heading={t.includedTitle} autoAdvance={6000} className="text-[#1B2130] [&_h2]:font-heading [&_h2]:font-extrabold" />
          </div>
        </section>

        <Days t={t} />

        {/* 20 over 21a: prices on a night sky that leans toward your cursor. */}
        <section id="precios" className="dark relative overflow-hidden bg-[#0E1119] text-[#B7BDCB]" aria-label={t.priceTitle}>
          <Starfield className="text-[#F2A33A]/50" seed={11} count={160} />
          <div className="relative z-10 text-[#FFF7EC]">
            <Pricing
              plans={plans}
              title={t.priceTitle}
              description={t.priceLede}
              currency="USD"
              locale="en-US"
              confettiColors={[AMBAR, '#FFD27A', '#FFF7EC']}
              labels={es
                ? { annual: 'Ver mensualidad', save: '', monthlyNote: 'de montaje, mitad al empezar y mitad al aprobar', annualNote: 'al mes · cancelas con 30 días de aviso', popular: 'Más elegido' }
                : { annual: 'Show monthly fee', save: '', monthlyNote: 'setup, half to start and half on approval', annualNote: 'per month · cancel with 30 days’ notice', popular: 'Most chosen' }}
              className="[&_h2]:font-heading [&_h2]:font-extrabold [&_h2]:text-[#FFF7EC]"
            />
            <div className="mx-auto max-w-5xl px-6 pb-24">
              <dl className="grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
                {t.covers.map(([a, b]) => (
                  <div key={a}><dt className="font-bold text-[#FFF7EC]">{a}</dt><dd className="mt-1 text-[#B7BDCB]">{b}</dd></div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-[#8D94A5]">{t.taxNote}</p>
            </div>
          </div>
        </section>

        <Promises t={t} />

        {/* 25: native exclusive accordion + FAQPage JSON-LD. */}
        <section id="preguntas" className="bg-[#FFF7EC] text-[#1B2130]">
          <FAQAccordion
            title={t.faqTitle}
            description={t.faqDesc}
            data={t.faq.map(([question, answer]) => ({ question, answer }))}
            contact={{ label: t.navCta, href: '#diagnostico' }}
            layout="split"
            className="[&_h2]:font-heading [&_h2]:font-extrabold"
          />
        </section>

        <Request t={t} />
      </main>

      {/* 27: the page lifts away and uncovers the closing call to action. */}
      <div className="dark">
      <CinematicFooter
        giantText="LUMO"
        heading={t.footHeading}
        marquee={t.footMarquee}
        primaryLinks={[{ label: t.footCta, href: '#diagnostico' }]}
        links={t.footLinks.map(([href, label]) => ({ href, label }))}
        copyright={t.footCopy}
        credit={null}
        backToTopLabel={t.footTop}
        accent={[AMBAR, '#5B6375']}
        className="[&_h2]:font-heading [&_h2]:font-extrabold"
      />
      </div>
    </div>
  );
}
