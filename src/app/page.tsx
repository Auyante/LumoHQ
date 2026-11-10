import { Check, ChevronDown, X } from "lucide-react";
import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { LumoBento } from "@/components/lumo/LumoBento";
import { COPY } from "@/components/talonario/copy";
import { HomeRequest } from "@/components/lumo/HomeRequest";

const t = COPY.es;
/** The diagnosis form, at the end of this page. */
const CTA = "#diagnostico";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=75&auto=format&fit=crop`;

const IMAGES = [
  { src: unsplash("1585747860715-2ba37e788b70"), alt: "Barbería con sillones de cuero" },
  { src: unsplash("1551504734-5ee1c4a1479b"), alt: "Plato de tacos" },
  { src: unsplash("1509440159596-0249088772ff"), alt: "Pan recién horneado" },
  { src: unsplash("1521590832167-7bcbfaa6381f"), alt: "Salón de belleza" },
  { src: unsplash("1555396273-367ea4eb4db5"), alt: "Café de barrio" },
  { src: unsplash("1503951914875-452162b0f3f1"), alt: "Barbero afeitando a un cliente" },
  { src: unsplash("1565299585323-38d6b0865b47"), alt: "Tacos con salsa" },
  { src: unsplash("1486262715619-67b85e0b08d3"), alt: "Motor en un taller mecánico" },
  { src: unsplash("1504754524776-8f4f37790ca0"), alt: "Desayuno en un café" },
  { src: unsplash("1560066984-138dadb4c035"), alt: "Interior de un salón" },
];

function Logo() {
  return (
    <span className="font-heading text-[22px] font-extrabold tracking-tight text-lumo-arena">
      lum
      <span className="relative inline-block size-[0.62em] translate-y-[0.02em] rounded-full border-[0.14em] border-lumo-ambar align-baseline">
        <span className="absolute left-1/2 top-1/2 size-[0.16em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lumo-ambar" />
      </span>
      <span className="ml-1 text-[0.7em] text-lumo-ambar">HQ</span>
    </span>
  );
}

function SectionHead({ kicker, title, lede, dark }: { kicker: string; title: string; lede?: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={`text-[13px] font-bold uppercase tracking-[0.08em] ${dark ? "text-lumo-ambar" : "text-[#9A5B0B]"}`}>{kicker}</p>
      <h2 className={`mt-2 text-balance font-heading text-[clamp(1.9rem,5vw,3.1rem)] font-extrabold leading-[1.05] tracking-[-0.02em] ${dark ? "text-lumo-arena" : "text-lumo-noche"}`}>
        {title}
      </h2>
      {lede && <p className={`mt-4 max-w-xl text-[17px] leading-relaxed ${dark ? "text-[#C3C8D4]" : "text-lumo-pizarra"}`}>{lede}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-lumo-noche text-lumo-arena">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-lumo-noche/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6" aria-label="Principal">
          <a href="#top" aria-label="Lumo HQ, inicio">
            <Logo />
          </a>
          <div className="hidden items-center gap-6 text-[14px] font-semibold text-[#C3C8D4] md:flex">
            <a href="#panel" className="hover:text-lumo-arena">Tu reporte</a>
            <a href="#precios" className="hover:text-lumo-arena">Precios</a>
            <a href="#preguntas" className="hover:text-lumo-arena">Preguntas</a>
          </div>
          <a href={CTA} className="inline-flex min-h-[44px] items-center rounded-full bg-lumo-ambar px-5 text-[14px] font-bold text-lumo-noche transition-colors hover:bg-lumo-brillo">
            {t.navCta}
          </a>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <TiltedGridHero images={IMAGES} axis={60} tileHeight={24} className="h-[min(760px,100svh)] min-h-[600px] w-full bg-lumo-noche">
          <div className="relative z-10 mx-auto flex h-full max-w-[1180px] flex-col items-center justify-between px-4 pb-10 pt-12 text-center sm:pt-16">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-lumo-ambar">{t.tagline}</p>
              <h1 className="mt-4 text-balance font-heading text-[clamp(2.6rem,7.4vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.03em]">
                {t.h1a}
                <br />
                <span className="text-lumo-ambar">{t.h1b}</span>
              </h1>
            </div>
            <div className="flex flex-col items-center gap-5">
              <p className="max-w-xl text-balance text-[17px] leading-relaxed text-[#D5D9E2]">{t.heroLede}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={CTA} className="inline-flex min-h-[48px] items-center rounded-full bg-lumo-ambar px-6 text-[15px] font-bold text-lumo-noche transition-colors hover:bg-lumo-brillo">
                  {t.navCta}
                </a>
                <a href="#panel" className="inline-flex min-h-[48px] items-center rounded-full border border-white/20 px-6 text-[15px] font-semibold text-lumo-arena transition-colors hover:border-white/40">
                  Ver un reporte de ejemplo
                </a>
              </div>
            </div>
          </div>
        </TiltedGridHero>

        {/* Monthly report bento */}
        <section id="panel" className="dark scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHead
              dark
              kicker="Reporte mensual"
              title="Cada mes, una hoja con lo que pasó."
              lede="Cuánta gente te vio en Google, cuántos te llamaron, te escribieron o reservaron. Así se ve, con un negocio de ejemplo."
            />
            <LumoBento className="mt-10" ctaHref={CTA} />
            <p className="mt-4 text-[12px] text-[#A9B0C0]">{t.calcFine}</p>
          </div>
        </section>

        {/* Pricing */}
        <section id="precios" className="scroll-mt-16 bg-lumo-arena px-4 py-20 text-lumo-noche sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHead kicker="Precios" title={t.priceTitle} lede={t.priceLede} />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                { name: t.base, for: t.baseFor, setup: t.r6a, monthly: "$100/mes", rows: [true, true, true, false, true], r2: t.r2a, go: t.goBase, featured: true },
                { name: t.prem, for: t.premFor, setup: `${t.r6b} · ${t.r6bs}`, monthly: "$150–200/mes", rows: [true, true, true, true, true], r2: t.r2b, go: t.goPrem, featured: false },
              ].map((p) => (
                <article
                  key={p.name}
                  className={`flex flex-col rounded-[22px] border p-6 sm:p-8 ${p.featured ? "border-lumo-noche bg-white" : "border-[#E4D9C6] bg-transparent"}`}
                >
                  <h3 className="font-heading text-[28px] font-extrabold">{p.name}</h3>
                  <p className="mt-1 text-[15px] text-lumo-pizarra">{p.for}</p>
                  <p className="mt-6 font-heading text-[40px] font-extrabold leading-none tabular-nums">{p.monthly}</p>
                  <p className="mt-2 text-[14px] text-lumo-pizarra">
                    {t.r6}: {p.setup}
                  </p>
                  <ul className="mt-6 space-y-3 border-t border-[#E4D9C6] pt-6 text-[15px]">
                    {t.rows.map((row, i) => (
                      <li key={row} className={`flex gap-3 ${p.rows[i] ? "" : "text-[#8A90A0] line-through decoration-[#C9CEDA]"}`}>
                        <Check className={`mt-0.5 size-5 shrink-0 ${p.rows[i] ? "text-[#9A5B0B]" : "opacity-0"}`} aria-hidden />
                        <span>
                          {i === 1 ? `${row} · ${p.r2}` : row}
                          {!p.rows[i] && <span className="sr-only"> ({t.notIncl})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={CTA}
                    className={`mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-[15px] font-bold transition-colors ${
                      p.featured ? "bg-lumo-noche text-lumo-arena hover:bg-[#2A3245]" : "border border-lumo-noche text-lumo-noche hover:bg-lumo-noche hover:text-lumo-arena"
                    }`}
                  >
                    {p.go}
                  </a>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-[22px] bg-lumo-ambar p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
              <p className="max-w-2xl text-[16px] font-medium leading-relaxed">{t.fText}</p>
              <a href={CTA} className="mt-4 inline-flex min-h-[48px] shrink-0 items-center rounded-full bg-lumo-noche px-6 text-[15px] font-bold text-lumo-ambar md:mt-0">
                {t.fGo}
              </a>
            </div>
            <p className="mt-4 text-[13px] text-lumo-pizarra">{t.taxNote}</p>
          </div>
        </section>

        {/* Promises */}
        <section className="bg-white px-4 py-20 text-lumo-noche sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHead kicker="Compromiso" title={t.promTitle} />
            <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
              {t.prom.map(([q, a]) => (
                <li key={q} className="border-t-2 border-lumo-noche pt-4">
                  <p className="flex items-start gap-2 font-heading text-[19px] font-extrabold text-lumo-noche">
                    <X className="mt-1 size-5 shrink-0 text-[#B4231B]" strokeWidth={3} aria-label="Nunca:" />
                    <span>{q}</span>
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-lumo-pizarra">{a}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="scroll-mt-16 bg-lumo-arena px-4 py-20 text-lumo-noche sm:px-6 sm:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1fr_1.4fr]">
            <SectionHead kicker="Preguntas" title={t.faqTitle} />
            <div className="divide-y divide-[#E4D9C6] border-y border-[#E4D9C6]">
              {t.faq.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                  </summary>
                  <p className="pb-5 pr-8 text-[16px] leading-relaxed text-lumo-pizarra">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Diagnosis form (shared with /talonario, styled by talonario.css under .tal) */}
        <HomeRequest className="pt-16 sm:pt-24" />
      </main>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-[1180px] text-[13px] text-[#A9B0C0]">
          <Logo />
          <p className="mt-3">{t.foot}</p>
          <p className="mt-4 max-w-3xl">
            <strong className="text-lumo-arena">{t.ftcTitle}</strong> {t.ftc}
          </p>
        </div>
      </footer>
    </div>
  );
}
