"use client";
/**
 * Agency header (written for prompt 24: its `hero-01-utils/header` import had no source).
 * Sticky; gains a blurred surface once the page scrolls. Desktop nav with a hover/active pill
 * that slides between links (motion layoutId). Mobile: a disclosure panel (no Radix Sheet):
 * aria-expanded/controls, Escape closes and returns focus, closes on link click and at ≥768px.
 */
import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavigationSection {
  title: string;
  href: string;
  isActive?: boolean;
}

export default function Header({
  navigationData,
  brand = "Agency",
  logo,
  cta = { label: "Get in touch", href: "#" },
  menuLabel = "Menu",
  actions,
  className,
}: {
  navigationData: NavigationSection[];
  brand?: string;
  logo?: React.ReactNode;
  cta?: { label: string; href: string };
  menuLabel?: string;
  /** Extra controls before the CTA (e.g. a language toggle). Lumo adaptation. */
  actions?: React.ReactNode;
  className?: string;
}) {
  const uid = React.useId();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState<number | null>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const activeIndex = Math.max(0, navigationData.findIndex((n) => n.isActive));

  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const wide = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", key);
    mq.addEventListener("change", wide);
    return () => {
      window.removeEventListener("keydown", key);
      mq.removeEventListener("change", wide);
    };
  }, [open]);

  const pill = hover ?? activeIndex;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || open ? "bg-background/80 shadow-[0_1px_0_0_var(--color-border)] backdrop-blur-md" : "bg-transparent",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex min-h-[44px] items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          {logo ?? <span aria-hidden className="size-6 rounded-md" style={{ background: "var(--hero-accent, #FB923C)" }} />}
          {brand}
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center" onMouseLeave={() => setHover(null)}>
            {navigationData.map((item, i) => (
              <li key={item.title} className="relative">
                {pill === i && (
                  <motion.span
                    layoutId={`${uid}-nav-pill`}
                    className="absolute inset-0 rounded-full bg-muted"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Link
                  href={item.href}
                  aria-current={item.isActive ? "page" : undefined}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className={cn(
                    "relative flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                    item.isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {actions}
          <Link
            href={cta.href}
            className="hidden h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:inline-flex"
          >
            {cta.label}
          </Link>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={`${uid}-menu`}
            aria-label={menuLabel}
            onClick={() => setOpen((o) => !o)}
            className="grid size-11 place-items-center rounded-full text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id={`${uid}-menu`}
            aria-label="Main"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <ul className="flex flex-col px-4 py-3">
              {navigationData.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    aria-current={item.isActive ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn("flex min-h-[48px] items-center rounded-lg px-3 text-base font-medium", item.isActive ? "bg-muted text-foreground" : "text-muted-foreground")}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link href={cta.href} onClick={() => setOpen(false)} className="flex min-h-[48px] items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                  {cta.label}
                </Link>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
