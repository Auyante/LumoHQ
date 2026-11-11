"use client";
/**
 * Animated hero (21st.dev): a headline whose last words rotate with a spring slide.
 *
 * LAB changes vs the original (prompt 19):
 * - "use client" (it uses hooks), motion/react instead of framer-motion.
 * - Props for all copy and CTAs (were hard-coded); CTAs are real links, 48px tall.
 * - Screen readers: the original kept all 5 words in the DOM, so they were read in a row. Now the
 *   rotating words are aria-hidden and a sr-only sentence states the headline once.
 * - Reduced motion: no rotation (first word shown). Rotation pauses off-screen / hidden tab.
 * - Dropped the undefined `text-spektr-cyan-50` class.
 */
import * as React from "react";
import { motion } from "motion/react";
import { MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Cta = { label: string; href: string; icon?: React.ReactNode };

export interface AnimatedHeroProps {
  badge?: Cta;
  prefix?: string;
  words?: string[];
  description?: string;
  primary?: Cta;
  secondary?: Cta;
  /** ms each word stays. */
  interval?: number;
  /** Class for the rotating word (color, weight). */
  wordClassName?: string;
  /** Replaces the default CTA links (Lumo adaptation: liquid glass buttons). */
  actions?: React.ReactNode;
  className?: string;
}

export function Hero({
  badge = { label: "Read our launch article", href: "#" },
  prefix = "This is something",
  words = ["amazing", "new", "wonderful", "beautiful", "smart"],
  description = "Managing a small business today is already tough. Avoid further complications by ditching outdated, tedious trade methods. Our goal is to streamline SMB trade, making it easier and faster than ever.",
  primary = { label: "Sign up here", href: "#" },
  secondary,
  interval = 2000,
  wordClassName,
  actions,
  className,
}: AnimatedHeroProps) {
  const [index, setIndex] = React.useState(0);
  const [canAnimate, setCanAnimate] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;
    const update = () => setCanAnimate(onScreen && !document.hidden && !reduced.matches);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(el);
    update();
    reduced.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      reduced.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  React.useEffect(() => {
    if (!canAnimate || words.length < 2) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearTimeout(t);
  }, [index, canAnimate, interval, words.length]);

  const linkBase =
    "inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center gap-8 py-20 lg:py-40">
          {badge ? (
            <a href={badge.href} className="inline-flex min-h-[36px] items-center gap-3 rounded-full bg-secondary px-4 text-sm text-secondary-foreground transition-colors hover:bg-secondary/80">
              {badge.label} {badge.icon ?? <MoveRight className="size-4" aria-hidden />}
            </a>
          ) : null}
          <div className="flex flex-col gap-4">
            <h1 className="max-w-3xl text-center text-5xl tracking-tighter md:text-7xl">
              <span className="sr-only">
                {prefix} {words[0]}
              </span>
              <span aria-hidden>{prefix}</span>
              <span aria-hidden className="relative flex w-full justify-center overflow-hidden text-center md:pt-1 md:pb-4">
                &nbsp;
                {words.map((word, i) => (
                  <motion.span
                    key={word}
                    className={cn("absolute font-semibold", wordClassName)}
                    initial={{ opacity: 0, y: -100 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={i === index ? { y: 0, opacity: 1 } : { y: index > i ? -150 : 150, opacity: 0 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </h1>
            <p className="max-w-2xl text-center text-lg leading-relaxed tracking-tight text-muted-foreground md:text-xl">{description}</p>
          </div>
          {actions ?? <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            {secondary ? (
              <a href={secondary.href} className={cn(linkBase, "border border-white/25 hover:bg-white/5")}>
                {secondary.label} {secondary.icon}
              </a>
            ) : null}
            {primary ? (
              <a href={primary.href} className={cn(linkBase, "bg-foreground text-background hover:opacity-90")}>
                {primary.label} {primary.icon ?? <MoveRight className="size-4" aria-hidden />}
              </a>
            ) : null}
          </div>}
        </div>
      </div>
    </div>
  );
}

export default Hero;
