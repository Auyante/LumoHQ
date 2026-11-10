"use client";

/**
 * Lumo monthly report, as a bento grid. Same tile system as
 * components/ui/web3-bento.tsx, rewritten for a local business:
 * contacts per day, contact channels, Google profile completeness,
 * profile views, opening hours, reviews and recent activity.
 *
 * Every number here is an EXAMPLE for a sample business. The section that
 * renders this must say so; Lumo never promises rankings or results.
 */

import * as React from "react";
import { CalendarCheck, Check, Info, MessageSquare, Phone, QrCode, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */

const AMBAR = "#F2A33A";
const BRILLO = "#FFD27A";
const NOCHE = "#1B2130";
const ARENA = "#FFF7EC";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ------------------------------------------------------------------ */
/*  Example data (deterministic, so server and client render alike)    */
/* ------------------------------------------------------------------ */

function seeded(seed: number) {
  let h = seed;
  return () => {
    h = (h * 16807) % 2147483647;
    return h / 2147483647;
  };
}

/** Contacts per day for the last 30 days. Weekends run busier. */
const DAILY = (() => {
  const r = seeded(19);
  return Array.from({ length: 30 }, (_, i) => {
    const weekend = i % 7 === 4 || i % 7 === 5;
    return Math.round(3 + r() * 6 + (weekend ? 4 : 0));
  });
})();

/** Weekly profile views from Search and from Maps, last 13 weeks. */
const VIEWS = (() => {
  const r = seeded(7);
  const search: number[] = [];
  const maps: number[] = [];
  let s = 120;
  let m = 90;
  for (let i = 0; i < 13; i++) {
    s = Math.max(60, s + (r() - 0.45) * 30);
    m = Math.max(40, m + (r() - 0.42) * 26);
    search.push(Math.round(s));
    maps.push(Math.round(m));
  }
  return { search, maps };
})();

const MIX = [
  { label: "Llamadas", value: 96, color: AMBAR },
  { label: "Textos", value: 58, color: BRILLO },
  { label: "Reservas", value: 31, color: "#C9CEDA" },
  { label: "Cómo llegar", value: 21, color: "#7F889C" },
  { label: "Sitio web", value: 8, color: "#4A5266" },
];

const PROFILE = [
  "Horario con feriados",
  "Fotos recientes",
  "Página en inglés y español",
  "Botón para reservar",
  "QR de reseñas",
  "Descripción y servicios",
];
/** Which lines a typical profile already has before Lumo. */
const BEFORE = [true, false, false, false, false, true];

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useReducedMotion() {
  const [r, setR] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setR(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);
  return r;
}

/** True once the grid scrolls into view, so entrances play where people see them. */
function useInView<T extends Element>() {
  const ref = React.useRef<T>(null);
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

function useCountUp(target: number, run: boolean, reduced: boolean, duration = 1200) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    if (reduced) return setV(target);
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, reduced, duration]);
  return v;
}

const Shown = React.createContext({ on: false, reduced: false });

/* ------------------------------------------------------------------ */
/*  Shell                                                              */
/* ------------------------------------------------------------------ */

function Tile({
  title,
  action,
  className,
  children,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-border bg-card p-5 text-card-foreground",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-[13px] font-semibold text-muted-foreground">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function Pills<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={o === value}
          onClick={() => onChange(o)}
          className={cn(
            "min-h-[32px] rounded-full px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            o === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const dayLabel = (i: number, total: number) => {
  const d = new Date();
  d.setDate(d.getDate() - (total - 1 - i));
  return d.toLocaleDateString("es-US", { day: "numeric", month: "short" });
};

/* ------------------------------------------------------------------ */
/*  Month: greeting, total contacts, 30-day strip                      */
/* ------------------------------------------------------------------ */

function MonthTile({ business }: { business: string }) {
  const { on, reduced } = React.useContext(Shown);
  const total = DAILY.reduce((s, v) => s + v, 0);
  const shown = useCountUp(total, on, reduced);
  const max = Math.max(...DAILY);
  const [hover, setHover] = React.useState<number | null>(null);
  // Dates only on the client: the server can't know the viewer's "today".
  const [labels, setLabels] = React.useState<string[] | null>(null);
  React.useEffect(() => setLabels(DAILY.map((_, i) => dayLabel(i, DAILY.length))), []);

  return (
    <Tile className="md:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-1">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="font-heading text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">
            Buenos días, <span style={{ color: AMBAR }}>{business}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Tu mes en Google, en una sola hoja.</p>
        </div>
        <div className="md:text-right">
          <p className="text-[12px] text-muted-foreground">Te contactaron</p>
          <p className="font-heading text-[40px] font-extrabold leading-none tabular-nums">{shown}</p>
          <p className="mt-1.5 text-[12px] text-muted-foreground">veces en 30 días</p>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <div className="flex flex-1 items-end gap-[3px]" style={{ minHeight: 72 }} onPointerLeave={() => setHover(null)}>
          {DAILY.map((d, i) => (
            <button
              key={i}
              type="button"
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${labels?.[i] ?? `Día ${i + 1}`}: ${d} contactos`}
              className="relative flex-1 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                height: on || reduced ? `${16 + (d / max) * 84}%` : "6%",
                background: AMBAR,
                opacity: hover === null ? 0.35 + (d / max) * 0.65 : hover === i ? 1 : 0.25,
                transition: reduced ? "none" : `height 900ms ${EASE} ${i * 18}ms, opacity 200ms ease`,
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>{labels?.[0] ?? ""}</span>
          <span className="text-foreground" aria-live="polite">
            {hover !== null ? `${labels?.[hover] ?? ""} · ${DAILY[hover]} contactos` : "Contactos por día"}
          </span>
          <span>Hoy</span>
        </div>
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Channels: stacked cards, tap one to bring it forward               */
/* ------------------------------------------------------------------ */

type Channel = {
  id: string;
  label: string;
  detail: string;
  count: number;
  icon: React.ReactNode;
  bg: string;
  bg2: string;
  ink: string;
};

const CHANNELS: Channel[] = [
  { id: "book", label: "Reservar", detail: "Apartan su hora solos", count: 31, icon: <CalendarCheck className="size-4" aria-hidden />, bg: "#3A4258", bg2: "#2A3142", ink: ARENA },
  { id: "text", label: "Mandar texto", detail: "Contestas desde tu celular", count: 58, icon: <MessageSquare className="size-4" aria-hidden />, bg: ARENA, bg2: "#F3E6D0", ink: NOCHE },
  { id: "call", label: "Llamar", detail: "(432) 555-0199", count: 96, icon: <Phone className="size-4" aria-hidden />, bg: BRILLO, bg2: AMBAR, ink: NOCHE },
];

function ChannelsTile() {
  const { on, reduced } = React.useContext(Shown);
  const [order, setOrder] = React.useState(() => CHANNELS.map((c) => c.id));
  const PEEK = 42;
  const depth = order.length - 1;
  const front = CHANNELS.find((c) => c.id === order[depth])!;

  return (
    <Tile title="Un toque y te contactan" className="lg:col-start-3 lg:row-start-1">
      <div className="relative -mx-5 -mb-5 flex flex-1 flex-col justify-end overflow-hidden pt-1">
        <div className="relative">
          {order.map((id, pos) => {
            const c = CHANNELS.find((x) => x.id === id)!;
            const fromFront = depth - pos;
            const isFront = fromFront === 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => !isFront && setOrder((o) => [...o.filter((x) => x !== id), id])}
                aria-label={`${c.label}${isFront ? ", al frente" : ", traer al frente"}`}
                aria-pressed={isFront}
                className="absolute left-1/2 block w-[calc(100%-32px)] max-w-[290px] rounded-[14px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  top: (depth - fromFront) * PEEK,
                  zIndex: pos + 1,
                  transform: `translateX(-50%) scale(${1 - fromFront * 0.055}) translateY(${on || reduced ? 0 : 18}px)`,
                  transformOrigin: "top center",
                  opacity: on || reduced ? 1 : 0,
                  color: c.ink,
                  boxShadow: "0 -10px 26px -14px rgb(0 0 0 / 0.7)",
                  transition: reduced
                    ? "none"
                    : `top 600ms cubic-bezier(0.34, 1.3, 0.64, 1), transform 600ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 450ms ease ${pos * 90}ms`,
                  cursor: isFront ? "default" : "pointer",
                }}
              >
                <span className="relative block w-full" style={{ paddingTop: "58%" }}>
                  <span
                    className="absolute inset-0 flex flex-col justify-between rounded-[14px] p-4"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${c.bg} 0%, ${c.bg2} 100%)`,
                      boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.35), inset 0 0 0 1px rgb(255 255 255 / 0.12)",
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 truncate text-[14px] font-bold">
                        {c.icon}
                        {c.label}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[12px] font-semibold tabular-nums opacity-80">{c.count} este mes</span>
                    </span>
                    <span className="text-[12px] font-medium opacity-75">{c.detail}</span>
                  </span>
                </span>
              </button>
            );
          })}
          <div aria-hidden className="invisible mx-auto w-[calc(100%-32px)] max-w-[290px]" style={{ marginTop: depth * PEEK }}>
            <div style={{ paddingTop: "28%" }} />
          </div>
        </div>

        <div
          className="relative z-10 flex shrink-0 items-end justify-between gap-3 px-5 pb-4"
          style={{
            height: 80,
            background: "color-mix(in srgb, var(--color-card) 78%, transparent)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid var(--color-border)",
          }}
          aria-live="polite"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold">{front.label}</p>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{front.detail}</p>
          </div>
          <p className="shrink-0 font-heading text-[22px] font-extrabold tabular-nums">{front.count}</p>
        </div>
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Google profile: completeness gauge, before vs with Lumo            */
/* ------------------------------------------------------------------ */

function ProfileTile() {
  const { on, reduced } = React.useContext(Shown);
  const [mode, setMode] = React.useState<"Hoy" | "Con Lumo">("Con Lumo");
  const done = mode === "Hoy" ? BEFORE.filter(Boolean).length : PROFILE.length;
  const t = on || reduced ? done / PROFILE.length : 0;
  const R = 62;
  const len = Math.PI * R;
  const missing = PROFILE.filter((_, i) => mode === "Hoy" && !BEFORE[i]);

  return (
    <Tile title="Perfil de Google" className="lg:col-start-4 lg:row-start-1">
      <div className="flex flex-1 flex-col items-center justify-center">
        <svg width="150" height="86" viewBox="0 0 150 86" aria-hidden>
          <path d="M 13 78 A 62 62 0 0 1 137 78" fill="none" strokeWidth="10" strokeLinecap="round" style={{ stroke: "var(--color-muted)" }} />
          <path
            d="M 13 78 A 62 62 0 0 1 137 78"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={len}
            style={{
              stroke: mode === "Hoy" ? "#7F889C" : AMBAR,
              strokeDashoffset: len * (1 - t),
              transition: reduced ? "none" : `stroke-dashoffset 900ms ${EASE}, stroke 300ms ease`,
            }}
          />
        </svg>
        <p className="-mt-1 font-heading text-[28px] font-extrabold leading-none tabular-nums">
          {done}
          <span className="text-[16px] text-muted-foreground"> de {PROFILE.length}</span>
        </p>
        <p className="mt-1 text-center text-[12px] text-muted-foreground" aria-live="polite">
          {missing.length ? `Faltan: ${missing.slice(0, 2).join(", ").toLowerCase()}…` : "Renglones completos"}
        </p>
      </div>
      <div className="mt-4 flex justify-center">
        <Pills label="Comparar perfil" value={mode} options={["Hoy", "Con Lumo"]} onChange={setMode} />
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile views: Search vs Maps                                      */
/* ------------------------------------------------------------------ */

type Range = "4 sem" | "13 sem";

function smooth(pts: ReadonlyArray<readonly [number, number]>) {
  return pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      const [px, py] = pts[i - 1];
      const m = (px + x) / 2;
      return `C ${m.toFixed(1)} ${py.toFixed(1)}, ${m.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function ViewsTile() {
  const { on, reduced } = React.useContext(Shown);
  const uid = React.useId().replace(/:/g, "");
  const [range, setRange] = React.useState<Range>("13 sem");
  const [hover, setHover] = React.useState<number | null>(null);
  const take = range === "4 sem" ? 4 : 13;
  const a = VIEWS.search.slice(-take);
  const b = VIEWS.maps.slice(-take);
  const W = 640;
  const H = 220;
  const lo = Math.min(...a, ...b) * 0.8;
  const hi = Math.max(...a, ...b) * 1.08;
  const y = (v: number) => H - 12 - ((v - lo) / (hi - lo)) * (H - 28);
  const pa = a.map((v, i) => [(i / (a.length - 1)) * W, y(v)] as const);
  const pb = b.map((v, i) => [(i / (b.length - 1)) * W, y(v)] as const);
  const idx = hover ?? a.length - 1;
  const left = `${(pa[idx][0] / W) * 100}%`;
  const weekLabel = (i: number) => (i === a.length - 1 ? "Esta semana" : `Hace ${a.length - 1 - i} sem`);

  return (
    <Tile
      title="Cuánta gente vio tu perfil"
      className="md:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-2"
      action={<Pills label="Periodo" value={range} options={["4 sem", "13 sem"]} onChange={setRange} />}
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <div>
          <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="h-[3px] w-4 rounded-full" style={{ background: AMBAR }} aria-hidden />
            Desde la Búsqueda
          </p>
          <p className="mt-1 font-heading text-[24px] font-extrabold tabular-nums">{a[idx]}</p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />
            Desde Google Maps
          </p>
          <p className="mt-1 font-heading text-[24px] font-extrabold tabular-nums text-muted-foreground">{b[idx]}</p>
        </div>
        <span className="ml-auto text-[12px] tabular-nums text-muted-foreground" aria-live="polite">
          {weekLabel(idx)}
        </span>
      </div>

      <div
        className="relative mt-4 flex-1 touch-pan-y"
        style={{ minHeight: 220 }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(a.length - 1, Math.round(((e.clientX - r.left) / r.width) * (a.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Vistas del perfil por semana: esta semana ${a[a.length - 1]} desde la Búsqueda y ${b[b.length - 1]} desde Maps`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id={`${uid}-f`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style={{ stopColor: AMBAR, stopOpacity: 0.26 }} />
              <stop offset="1" style={{ stopColor: AMBAR, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} vectorEffect="non-scaling-stroke" strokeDasharray="1 5" style={{ stroke: "var(--color-border)" }} />
          ))}
          <path d={`${smooth(pa)} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${uid}-f)`} style={{ opacity: on || reduced ? 1 : 0, transition: "opacity 900ms ease 400ms" }} />
          <path d={smooth(pb)} fill="none" strokeWidth={1.5} strokeDasharray="4 5" vectorEffect="non-scaling-stroke" style={{ stroke: "var(--color-muted-foreground)" }} />
          <path
            key={range}
            d={smooth(pa)}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            style={{
              stroke: AMBAR,
              strokeDasharray: 1,
              strokeDashoffset: on || reduced ? 0 : 1,
              transition: reduced ? "none" : `stroke-dashoffset 1300ms ${EASE}`,
            }}
          />
        </svg>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-border" style={{ left, opacity: hover !== null ? 1 : 0 }} />
        <span
          aria-hidden
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card"
          style={{ left, top: `${(pa[idx][1] / H) * 100}%`, background: AMBAR }}
        />
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-muted-foreground" aria-hidden>
        <span>{range === "4 sem" ? "Hace 3 semanas" : "Hace 3 meses"}</span>
        <span>Esta semana</span>
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact mix: segmented bar                                         */
/* ------------------------------------------------------------------ */

function MixTile() {
  const { on, reduced } = React.useContext(Shown);
  const total = MIX.reduce((s, m) => s + m.value, 0);
  const [hover, setHover] = React.useState<number | null>(null);

  return (
    <Tile title="Cómo te contactaron" className="lg:col-start-3 lg:row-start-2">
      <div className="flex h-9 gap-1" onPointerLeave={() => setHover(null)}>
        {MIX.map((m, i) => (
          <span
            key={m.label}
            onPointerEnter={() => setHover(i)}
            className="rounded-[8px]"
            style={{
              flexBasis: on || reduced ? `${(m.value / total) * 100}%` : `${100 / MIX.length}%`,
              background: m.color,
              opacity: hover === null || hover === i ? 1 : 0.3,
              transition: reduced ? "none" : `flex-basis 1000ms ${EASE} ${200 + i * 60}ms, opacity 200ms ease`,
            }}
            aria-hidden
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {MIX.map((m, i) => (
          <li
            key={m.label}
            className="flex items-center justify-between gap-2 text-[13px]"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: m.color }} aria-hidden />
              {m.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{m.value}</span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan: solid amber tile, the offer                                  */
/* ------------------------------------------------------------------ */

const DAYS = ["Firmas", "Nos cuentas", "Perfil y página", "Botones", "Revisión", "Apruebas"];

function PlanTile({ ctaHref }: { ctaHref: string }) {
  const { on, reduced } = React.useContext(Shown);
  const [day, setDay] = React.useState(0);
  React.useEffect(() => {
    if (!on || reduced) return;
    const id = window.setInterval(() => setDay((d) => (d + 1) % DAYS.length), 1400);
    return () => window.clearInterval(id);
  }, [on, reduced]);
  const shownDay = reduced ? DAYS.length - 1 : day;

  return (
    <section
      className="relative flex min-w-0 flex-col overflow-hidden rounded-[22px] p-5 md:col-span-2 lg:col-span-1 lg:col-start-4 lg:row-span-2 lg:row-start-2"
      style={{ background: AMBAR, color: NOCHE }}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold">Plan Base</h3>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "rgb(27 33 48 / 0.12)" }}>
          2 cupos fundadores
        </span>
      </header>

      <p className="mt-5 font-heading text-[52px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
        $100<span className="text-[20px]">/mes</span>
      </p>
      <p className="mt-1 text-[13px] font-semibold opacity-80">Montaje $500, en 2 pagos de $250</p>

      <div className="mt-5 rounded-2xl p-3" style={{ background: "rgb(27 33 48 / 0.1)" }}>
        <div className="flex flex-col gap-0.5 text-[12px] font-bold">
          <span className="opacity-75">Entrega en 5 días hábiles</span>
          <span className="whitespace-nowrap tabular-nums" aria-live="off">
            Día {shownDay} · {DAYS[shownDay]}
          </span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {DAYS.map((d, i) => (
            <span
              key={d}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: NOCHE, opacity: i <= shownDay ? 0.9 : 0.15, transition: "opacity 300ms ease" }}
            />
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-[13px] font-medium">
        {["Perfil de Google completo, ES / EN", "Página web bilingüe", "Llamar, texto y 1 canal extra", "QR para pedir reseñas"].map((t) => (
          <li key={t} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <p className="text-[12px] font-semibold opacity-75">Pagas la mitad al empezar y la otra mitad cuando apruebas.</p>
        <a
          href={ctaHref}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-2xl text-[15px] font-bold transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: NOCHE, color: AMBAR }}
        >
          Pedir diagnóstico gratis
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Hours: open range with a now marker                                */
/* ------------------------------------------------------------------ */

function HoursTile({ open = 9, close = 19 }: { open?: number; close?: number }) {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    const read = () => {
      const d = new Date();
      setNow(d.getHours() + d.getMinutes() / 60);
    };
    read();
    const id = window.setInterval(read, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const lo = 6;
  const hi = 22;
  const pos = (v: number) => ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100;
  const isOpen = now !== null && now >= open && now < close;
  const fmt = (h: number) => `${h > 12 ? h - 12 : h} ${h >= 12 ? "p. m." : "a. m."}`;

  return (
    <Tile
      title="Horario al día"
      className="lg:col-start-3 lg:row-start-3"
      action={
        now !== null && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ background: isOpen ? "rgb(242 163 58 / 0.18)" : "var(--color-muted)", color: isOpen ? AMBAR : "var(--color-muted-foreground)" }}
          >
            {isOpen ? "Abierto ahora" : "Cerrado ahora"}
          </span>
        )
      }
    >
      <p className="font-heading text-[22px] font-extrabold tabular-nums">
        {fmt(open)} – {fmt(close)}
      </p>
      <p className="text-[12px] text-muted-foreground">Lunes a sábado · con feriados</p>
      <div className="relative mt-6 h-10" role="img" aria-label={`Abierto de ${fmt(open)} a ${fmt(close)}`}>
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-10 -translate-y-1/2 rounded-[10px]"
          style={{
            left: `${pos(open)}%`,
            width: `${pos(close) - pos(open)}%`,
            background: "repeating-linear-gradient(135deg, rgb(242 163 58 / 0.26) 0 6px, rgb(242 163 58 / 0.12) 6px 12px)",
            boxShadow: "inset 0 0 0 1px rgb(242 163 58 / 0.55)",
          }}
        />
        {now !== null && (
          <div className="absolute top-1/2 h-14 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" style={{ left: `${pos(now)}%` }} />
        )}
      </div>
      <p className="mt-auto pt-4 text-[12px] text-muted-foreground">Si cambias de horario, lo actualizamos. Entra en tus 2 cambios del mes.</p>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Reviews                                                            */
/* ------------------------------------------------------------------ */

const STARS = [
  { n: 5, v: 41 },
  { n: 4, v: 7 },
  { n: 3, v: 2 },
  { n: 2, v: 0 },
  { n: 1, v: 1 },
];

function ReviewsTile() {
  const { on, reduced } = React.useContext(Shown);
  const total = STARS.reduce((s, r) => s + r.v, 0);
  const avg = STARS.reduce((s, r) => s + r.n * r.v, 0) / total;

  return (
    <Tile title="Reseñas de clientes reales" className="md:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-4">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <div>
          <p className="font-heading text-[40px] font-extrabold leading-none tabular-nums">{avg.toFixed(1)}</p>
          <p className="mt-1 flex gap-0.5" aria-label={`${avg.toFixed(1)} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="size-4" style={{ color: AMBAR, fill: i <= Math.round(avg) ? AMBAR : "transparent" }} aria-hidden />
            ))}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">{total} reseñas</p>
        </div>
        <ul className="min-w-[180px] flex-1 space-y-1.5" aria-label="Reseñas por estrellas">
          {STARS.map((r, i) => (
            <li key={r.n} className="flex items-center gap-2 text-[12px] tabular-nums">
              <span className="w-3 text-muted-foreground">{r.n}</span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: on || reduced ? `${(r.v / total) * 100}%` : "0%",
                    background: AMBAR,
                    transition: reduced ? "none" : `width 900ms ${EASE} ${i * 70}ms`,
                  }}
                />
              </span>
              <span className="w-6 text-right text-muted-foreground">{r.v}</span>
            </li>
          ))}
        </ul>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-3">
        {[
          ["QR escaneados", "38"],
          ["Reseñas nuevas", "9"],
          ["Respondidas", "9 de 9"],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 text-[15px] font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <QrCode className="size-3.5" aria-hidden />
        Las pides a tus clientes con el QR. Nunca compramos ni inventamos reseñas.
      </p>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity                                                           */
/* ------------------------------------------------------------------ */

const ACTIVITY = [
  { id: "1", icon: <Phone className="size-4" aria-hidden />, title: "Llamada", detail: "(432) 555-0142 · 3 min", time: "hace 5 min", tag: "Nueva" },
  { id: "2", icon: <CalendarCheck className="size-4" aria-hidden />, title: "Reserva · Corte + barba", detail: "Hoy a las 4:30 p. m.", time: "hace 20 min", tag: "Confirmada" },
  { id: "3", icon: <MessageSquare className="size-4" aria-hidden />, title: "Texto · ¿Tienen espacio hoy?", detail: "Contestado desde tu celular", time: "hace 1 h", tag: "Respondido" },
  { id: "4", icon: <Star className="size-4" aria-hidden />, title: "Reseña nueva · 5 estrellas", detail: "Llegó por el QR del mostrador", time: "ayer", tag: "Respondida" },
];

function ActivityTile() {
  const { on, reduced } = React.useContext(Shown);
  return (
    <Tile title="Lo último" className="md:col-span-2 lg:col-span-2 lg:col-start-3 lg:row-start-4">
      <ul className="-mx-2 -my-1">
        {ACTIVITY.map((a, i) => (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/50"
            style={{
              opacity: on || reduced ? 1 : 0,
              transform: on || reduced ? "none" : "translateY(6px)",
              transition: reduced ? "none" : `opacity 500ms ease ${300 + i * 70}ms, transform 500ms ${EASE} ${300 + i * 70}ms`,
            }}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">{a.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{a.title}</p>
              <p className="truncate text-[12px] text-muted-foreground">
                {a.detail} · {a.time}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-bold" style={{ color: a.tag === "Nueva" ? AMBAR : "var(--color-muted-foreground)" }}>
              {a.tag}
            </span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/*  Grid                                                               */
/* ------------------------------------------------------------------ */

export function LumoBento({
  business = "Barbería El Rey",
  ctaHref = "/diagnostico",
  className,
}: {
  business?: string;
  ctaHref?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [ref, on] = useInView<HTMLDivElement>();

  return (
    <Shown.Provider value={{ on, reduced }}>
      <div ref={ref} className={cn("w-full", className)}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Info className="size-3.5" aria-hidden />
            Negocio y números de ejemplo
          </span>
          <span className="rounded-full bg-foreground px-3 py-1.5 text-[12px] font-bold text-background">Reporte de este mes</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <MonthTile business={business} />
          <ChannelsTile />
          <ProfileTile />
          <ViewsTile />
          <MixTile />
          <PlanTile ctaHref={ctaHref} />
          <HoursTile />
          <ReviewsTile />
          <ActivityTile />
        </div>
      </div>
    </Shown.Provider>
  );
}

export default LumoBento;
