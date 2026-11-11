"use client";
/**
 * Cinematic "curtain reveal" footer (21st.dev, prompt 27), rebuilt in the lab.
 * The wrapper sits in normal flow with a clip-path; the footer inside is position:fixed, so the page
 * content above scrolls away like a curtain and uncovers it. GSAP ScrollTrigger scrubs a giant
 * outline word up and fades the heading/links in; glass pills are magnetic.
 *
 * LAB changes vs the original:
 * - Magnetic jitter fixed: the pills had `transition: all`, so CSS transitioned `transform` while GSAP
 *   wrote it every frame (they fought). Now only colors/shadow transition; motion uses gsap.quickTo
 *   (no new tween per mousemove) + transformPerspective so the tilt is visible.
 * - No render-blocking `@import` font; inherits the page font.
 * - Infinite CSS animations (aurora breathe, marquee, heartbeat) pause while the footer is covered
 *   or the tab is hidden, and stop under reduced motion (which also skips ScrollTrigger and magnetism).
 * - 100svh instead of h-screen (mobile browser bars); no emoji (lucide Heart/Sparkle);
 *   back-to-top has a label; ≥44px targets; typed (no `any`).
 * - All copy via props (the original hard-coded another product's brand).
 */
import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp, Heart, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const STYLES = `
.cf{--pill-bg-1:color-mix(in oklch,var(--foreground) 3%,transparent);--pill-bg-2:color-mix(in oklch,var(--foreground) 1%,transparent);--pill-shadow:color-mix(in oklch,var(--background) 50%,transparent);--pill-hl:color-mix(in oklch,var(--foreground) 10%,transparent);--pill-inset:color-mix(in oklch,var(--background) 80%,transparent);--pill-border:color-mix(in oklch,var(--foreground) 8%,transparent);-webkit-font-smoothing:antialiased}
.cf[data-paused] *{animation-play-state:paused!important}
@keyframes cf-breathe{0%{transform:translate(-50%,-50%) scale(1);opacity:.6}100%{transform:translate(-50%,-50%) scale(1.1);opacity:1}}
@keyframes cf-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes cf-beat{0%,100%{transform:scale(1)}15%,45%{transform:scale(1.2)}30%{transform:scale(1)}}
.cf-breathe{animation:cf-breathe 8s ease-in-out infinite alternate}
.cf-marquee{animation:cf-marquee 40s linear infinite}
.cf-beat{animation:cf-beat 2s cubic-bezier(.25,1,.5,1) infinite}
.cf-grid{background-size:60px 60px;background-image:linear-gradient(to right,color-mix(in oklch,var(--foreground) 3%,transparent) 1px,transparent 1px),linear-gradient(to bottom,color-mix(in oklch,var(--foreground) 3%,transparent) 1px,transparent 1px);mask-image:linear-gradient(to bottom,transparent,#000 30%,#000 70%,transparent)}
.cf-aurora{background:radial-gradient(circle at 50% 50%,color-mix(in oklch,var(--cf-accent,var(--primary)) 18%,transparent) 0%,color-mix(in oklch,var(--cf-accent-2,var(--secondary)) 15%,transparent) 40%,transparent 70%)}
.cf-pill{background:linear-gradient(145deg,var(--pill-bg-1),var(--pill-bg-2));box-shadow:0 10px 30px -10px var(--pill-shadow),inset 0 1px 1px var(--pill-hl),inset 0 -1px 2px var(--pill-inset);border:1px solid var(--pill-border);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:background .4s cubic-bezier(.16,1,.3,1),border-color .4s,box-shadow .4s,color .2s}
.cf-pill:hover,.cf-pill:focus-visible{--pill-bg-1:color-mix(in oklch,var(--foreground) 8%,transparent);--pill-bg-2:color-mix(in oklch,var(--foreground) 2%,transparent);border-color:color-mix(in oklch,var(--foreground) 20%,transparent);color:var(--foreground)}
.cf-pill:focus-visible{outline:2px solid var(--foreground);outline-offset:3px}
.cf-giant{font-size:26vw;line-height:.75;font-weight:900;letter-spacing:-.05em;color:transparent;-webkit-text-stroke:1px color-mix(in oklch,var(--foreground) 6%,transparent);background:linear-gradient(180deg,color-mix(in oklch,var(--foreground) 10%,transparent) 0%,transparent 60%);-webkit-background-clip:text;background-clip:text}
.cf-glow{background:linear-gradient(180deg,var(--foreground) 0%,color-mix(in oklch,var(--foreground) 45%,transparent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px color-mix(in oklch,var(--foreground) 15%,transparent))}
@media (prefers-reduced-motion:reduce){.cf-breathe,.cf-marquee,.cf-beat{animation:none}}
`;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Magnetic pull + tilt on pointer move, elastic return. Fine pointers only, off in reduced motion. */
function useMagnetic<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    gsap.set(el, { transformPerspective: 600 });
    const opts = { duration: 0.4, ease: "power2.out" };
    const qx = gsap.quickTo(el, "x", opts);
    const qy = gsap.quickTo(el, "y", opts);
    const qrx = gsap.quickTo(el, "rotationX", opts);
    const qry = gsap.quickTo(el, "rotationY", opts);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      qx(x * 0.35);
      qy(y * 0.35);
      qrx(-y * 0.15);
      qry(x * 0.15);
      gsap.to(el, { scale: 1.05, duration: 0.3, overwrite: "auto" });
    };
    const leave = () => gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, duration: 1.2, ease: "elastic.out(1, 0.3)", overwrite: true });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
    };
  }, []);
  return ref;
}

function MagneticLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const ref = useMagnetic<HTMLAnchorElement>();
  return (
    <a ref={ref} href={href} className={cn("cf-pill inline-flex items-center", className)}>
      {children}
    </a>
  );
}

function MagneticButton({ onClick, label, className, children }: { onClick: () => void; label: string; className?: string; children: React.ReactNode }) {
  const ref = useMagnetic<HTMLButtonElement>();
  return (
    <button ref={ref} type="button" aria-label={label} onClick={onClick} className={cn("cf-pill", className)}>
      {children}
    </button>
  );
}

export interface FooterLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export function CinematicFooter({
  giantText = "STUDIO",
  heading = "Ready to begin?",
  marquee = ["Design that works", "Fast and accessible", "Built to last", "Clear pricing", "Real support"],
  primaryLinks = [],
  links = [],
  copyright = `© ${new Date().getFullYear()} Studio. All rights reserved.`,
  credit = { prefix: "Crafted with", by: "by", name: "Studio" },
  backToTopLabel = "Back to top",
  accent,
  className,
}: {
  giantText?: string;
  heading?: React.ReactNode;
  marquee?: string[];
  primaryLinks?: FooterLink[];
  links?: FooterLink[];
  copyright?: React.ReactNode;
  credit?: { prefix: string; by: string; name: string } | null;
  backToTopLabel?: string;
  /** Aurora colors (CSS colors); defaults to --primary / --secondary. */
  accent?: [string, string];
  className?: string;
}) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLElement>(null);
  const giantRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const linksRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const wrap = wrapperRef.current;
    const footer = footerRef.current;
    if (!wrap || !footer) return;

    // Pause the infinite CSS animations while the curtain still covers the footer / tab hidden.
    let visible = false;
    const sync = () => (visible && !document.hidden ? footer.removeAttribute("data-paused") : footer.setAttribute("data-paused", ""));
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(wrap);
    document.addEventListener("visibilitychange", sync);
    sync();

    let ctx: gsap.Context | undefined;
    if (!reducedMotion()) {
      ctx = gsap.context(() => {
        gsap.fromTo(giantRef.current, { y: "10vh", scale: 0.8, opacity: 0 }, {
          y: "0vh", scale: 1, opacity: 1, ease: "power1.out",
          scrollTrigger: { trigger: wrap, start: "top 80%", end: "bottom bottom", scrub: 1 },
        });
        gsap.fromTo([headingRef.current, linksRef.current], { y: 50, opacity: 0 }, {
          y: 0, opacity: 1, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: wrap, start: "top 40%", end: "bottom bottom", scrub: 1 },
        });
      }, wrap);
    }
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      ctx?.revert();
    };
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
  const ticker = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex items-center gap-12 px-6">
      {marquee.map((m, i) => (
        <React.Fragment key={`${m}-${i}`}>
          <span>{m}</span>
          <Sparkle aria-hidden className={cn("size-3", i % 2 ? "text-secondary-foreground/50" : "text-primary/60")} />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div ref={wrapperRef} className="relative h-svh w-full" style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
        <footer
          ref={footerRef}
          className={cn("cf fixed bottom-0 left-0 flex h-svh w-full flex-col justify-between overflow-hidden bg-background text-foreground", className)}
          style={accent ? ({ "--cf-accent": accent[0], "--cf-accent-2": accent[1] } as React.CSSProperties) : undefined}
        >
          <div aria-hidden className="cf-aurora cf-breathe pointer-events-none absolute top-1/2 left-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[80px]" />
          <div aria-hidden className="cf-grid pointer-events-none absolute inset-0 z-0" />
          <div ref={giantRef} aria-hidden className="cf-giant pointer-events-none absolute -bottom-[5vh] left-1/2 z-0 -translate-x-1/2 whitespace-nowrap select-none">
            {giantText}
          </div>

          {marquee.length > 0 && (
            <div className="absolute top-12 left-0 z-10 w-full -rotate-2 scale-110 overflow-hidden border-y border-border/50 bg-background/60 py-4 shadow-2xl backdrop-blur-md">
              <div className="cf-marquee flex w-max text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase md:text-sm">
                {ticker(false)}
                {ticker(true)}
              </div>
            </div>
          )}

          <div className="relative z-10 mx-auto mt-20 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6">
            <h2 ref={headingRef} className="cf-glow mb-12 text-center text-5xl font-black tracking-tighter md:text-8xl">
              {heading}
            </h2>
            <div ref={linksRef} className="flex w-full flex-col items-center gap-6">
              {primaryLinks.length > 0 && (
                <div className="flex w-full flex-wrap justify-center gap-4">
                  {primaryLinks.map((l) => (
                    <MagneticLink key={l.label} href={l.href} className="group min-h-[56px] gap-3 rounded-full px-8 text-sm font-bold text-foreground md:px-10 md:text-base">
                      {l.icon ? <span aria-hidden className="text-muted-foreground transition-colors group-hover:text-foreground [&_svg]:size-6">{l.icon}</span> : null}
                      {l.label}
                    </MagneticLink>
                  ))}
                </div>
              )}
              {links.length > 0 && (
                <nav aria-label="Footer" className="mt-2 flex w-full flex-wrap justify-center gap-3 md:gap-6">
                  {links.map((l) => (
                    <MagneticLink key={l.label} href={l.href} className="min-h-[44px] rounded-full px-6 text-xs font-medium text-muted-foreground md:text-sm">
                      {l.label}
                    </MagneticLink>
                  ))}
                </nav>
              )}
            </div>
          </div>

          <div className="relative z-20 flex w-full flex-col items-center justify-between gap-6 px-6 pb-8 md:flex-row md:px-12">
            <p className="order-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase md:order-1 md:text-xs">{copyright}</p>
            {credit ? (
              <p className="cf-pill order-1 flex items-center gap-2 rounded-full px-6 py-3 md:order-2">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase md:text-xs">{credit.prefix}</span>
                <Heart aria-label="love" className="cf-beat size-4 fill-current text-destructive" />
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase md:text-xs">{credit.by}</span>
                <span className="ml-1 text-xs font-black text-foreground md:text-sm">{credit.name}</span>
              </p>
            ) : null}
            <MagneticButton onClick={toTop} label={backToTopLabel} className="group order-3 grid size-12 place-items-center rounded-full text-muted-foreground">
              <ArrowUp aria-hidden className="size-5 transition-transform duration-300 group-hover:-translate-y-1" />
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CinematicFooter;
