"use client";
/**
 * Pricing (21st.dev), rebuilt in the lab: monthly/annual toggle with confetti, animated prices
 * (NumberFlow) and a 3-card layout where the side cards tilt back in 3D on desktop.
 *
 * LAB changes vs the original (prompt 20):
 * - Confetti colors: the original passed `hsl(var(--primary))`; canvas-confetti draws on a canvas and
 *   can't read CSS variables, so those were invalid. Now `confettiColors` (hex) or resolved brand vars.
 *   Confetti respects reduced motion (`disableForReducedMotion`).
 * - Mobile bug: cards started at y:50 and mobile `whileInView` was `{}`, so they stayed 50px low forever.
 * - Valid HTML: no label-in-label; the toggle is the lab's Kernel Switch (piece 04, role=switch) with
 *   its visible label. No Radix label/switch/slot dependencies.
 * - The side-card tilt now actually happens: motion's inline transform overrode the Tailwind rotate-y/
 *   translate-z classes (in the original too), so rotateY/z are animated by motion.
 * - Real `tabular-nums` (the original used an invalid class), removed `sm:2`, added the `perspective`
 *   the 3D tilt needs (rotate-y/translate-z had no effect without it).
 * - No missing `@/hooks/use-media-query`: an SSR-safe matchMedia read after mount.
 * - Copy via props (`labels`), currency via props, `period` shown when given.
 */
import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Star } from "lucide-react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface PricingPlan {
  name: string;
  price: number;
  yearlyPrice: number;
  /** e.g. "per month" / "al mes". Omit to hide. */
  period?: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular?: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
  currency?: string;
  locale?: string;
  /** Hex colors for the confetti burst. */
  confettiColors?: string[];
  labels?: { annual?: string; save?: string; monthlyNote?: string; annualNote?: string; popular?: string };
  className?: string;
}

function useIsDesktop(query = "(min-width: 768px)") {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const u = () => setOn(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, [query]);
  return on;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
  currency = "USD",
  locale = "en-US",
  confettiColors = ["#111111", "#555555", "#999999", "#dddddd"],
  labels = {},
  className,
}: PricingProps) {
  const L = { annual: "Annual billing", save: "(Save 20%)", monthlyNote: "billed monthly", annualNote: "billed annually", popular: "Popular", ...labels };
  const [annual, setAnnual] = React.useState(false);
  const isDesktop = useIsDesktop();
  const switchRef = React.useRef<HTMLButtonElement>(null);

  const onToggle = (checked: boolean) => {
    setAnnual(checked);
    if (!checked || !switchRef.current) return;
    const r = switchRef.current.getBoundingClientRect();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
      colors: confettiColors,
      ticks: 200,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 30,
      shapes: ["circle"],
      disableForReducedMotion: true,
    });
  };

  return (
    <div className={cn("container mx-auto px-6 py-20", className)}>
      <div className="mb-12 space-y-4 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
        <p className="whitespace-pre-line text-lg text-muted-foreground">{description}</p>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="inline-flex">
          <Switch ref={switchRef} checked={annual} onCheckedChange={onToggle}>
            <span className="font-semibold">
              {L.annual} <span className="text-primary">{L.save}</span>
            </span>
          </Switch>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" style={{ perspective: "1200px" }}>
        {plans.map((plan, index) => {
          const side = plans.length === 3 && (index === 0 || index === 2);
          return (
            <motion.div
              key={plan.name}
              initial={{ y: 50, opacity: 1 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.isPopular ? -20 : 0,
                      opacity: 1,
                      x: index === 2 ? -30 : index === 0 ? 30 : 0,
                      scale: side ? 0.94 : 1,
                      // The tilt lives here: motion writes an inline transform that overrides Tailwind's rotate-y/translate-z classes.
                      rotateY: index === 0 ? 10 : index === 2 ? -10 : 0,
                      z: side ? -50 : 0,
                    }
                  : { y: 0, opacity: 1 }
              }
              viewport={{ once: true }}
              transition={{ duration: 1.6, type: "spring", stiffness: 100, damping: 30, delay: 0.4, opacity: { duration: 0.5 } }}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-background p-6 text-center lg:justify-center",
                plan.isPopular ? "border-2 border-primary" : "border-border",
                !plan.isPopular && "mt-5",
                side ? "z-0" : "z-10",
                index === 0 && "origin-right",
                index === 2 && "origin-left",
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 flex items-center rounded-tr-xl rounded-bl-xl bg-primary px-2 py-0.5">
                  <Star className="size-4 fill-current text-primary-foreground" aria-hidden />
                  <span className="ml-1 font-semibold text-primary-foreground">{L.popular}</span>
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <p className="text-base font-semibold text-muted-foreground">{plan.name}</p>
                <div className="mt-6 flex items-center justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-foreground tabular-nums">
                    <NumberFlow
                      value={annual ? plan.yearlyPrice : plan.price}
                      locales={locale}
                      format={{ style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                      transformTiming={{ duration: 500, easing: "ease-out" }}
                      willChange
                    />
                  </span>
                  {plan.period ? <span className="text-sm leading-6 font-semibold tracking-wide text-muted-foreground">/ {plan.period}</span> : null}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{annual ? L.annualNote : L.monthlyNote}</p>
                <ul className="mt-5 flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                      <span className="text-left">{feature}</span>
                    </li>
                  ))}
                </ul>
                <hr className="my-4 w-full" />
                <Link
                  href={plan.href}
                  className={cn(
                    "inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border text-lg font-semibold tracking-tighter transition-all duration-300 ease-out",
                    "hover:bg-primary hover:text-primary-foreground hover:ring-2 hover:ring-primary hover:ring-offset-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    plan.isPopular ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground",
                  )}
                >
                  {plan.buttonText}
                </Link>
                <p className="mt-6 text-xs leading-5 text-muted-foreground">{plan.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Pricing;
