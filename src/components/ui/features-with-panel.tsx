"use client";
/**
 * Features with panel (21st.dev), rebuilt in the lab. A numbered feature list on the left and a
 * sticky media panel on the right (desktop); on mobile the media expands under the active item.
 *
 * LAB changes vs the original (src/lab/originals/features-with-panel-original.tsx):
 * - Items via props (`items`, `heading`); the original hard-coded them.
 * - Keyboard + screen reader: each item is a real <button> (aria-expanded/aria-controls), arrow keys
 *   move between items. The original was a clickable <li> with no focus.
 * - The description (the original's `alt`) is shown under the active title, not only used as alt text.
 * - Media type is explicit (`type: "image" | "video" | "node"`), with regex sniffing as a fallback.
 * - Reduced motion (read after mount to keep SSR/CSR equal; MotionConfig reducedMotion="user" drops transforms): no autoplay for video (poster/first frame + controls), no slide animations.
 * - Optional `autoAdvance` (ms) that cycles items until the user interacts; pauses off-screen.
 */
import * as React from "react";
import { motion, AnimatePresence, MotionConfig, useReducedMotion, useInView } from "motion/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  title: string;
  description?: string;
  /** Image/video URL or any React node (live UI works great). */
  content: string | React.ReactNode;
  type?: "image" | "video" | "node";
  /** Alt text for images (defaults to the title). */
  alt?: string;
  poster?: string;
}

function FeatureMedia({ item, reduced }: { item: FeatureItem; reduced: boolean }) {
  const { content } = item;
  if (typeof content !== "string" || item.type === "node") return <div className="h-full w-full">{content}</div>;
  const type =
    item.type ?? (/\.(mp4|webm|ogg)(\?|$)/i.test(content) ? "video" : /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)|unsplash|images\./i.test(content) ? "image" : "text");
  if (type === "video")
    return (
      <video
        src={content}
        poster={item.poster}
        autoPlay={!reduced}
        controls={reduced}
        muted
        loop
        playsInline
        aria-label={item.alt ?? item.title}
        className="h-full w-full object-cover"
      />
    );
  if (type === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={content} alt={item.alt ?? item.title} className="h-full w-full object-cover" />;
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
    </div>
  );
}

export default function FeaturesWithPanel({
  items,
  heading = "Features.",
  autoAdvance,
  className,
}: {
  items: FeatureItem[];
  heading?: React.ReactNode;
  /** Milliseconds per item; stops at the first user interaction. */
  autoAdvance?: number;
  className?: string;
}) {
  const uid = React.useId();
  const [active, setActive] = React.useState(0);
  const [touched, setTouched] = React.useState(false);
  // Read reduced motion only after mount: useReducedMotion() is null on the server and true/false on
  // the client, and using it in the first render (initial props, video autoPlay) breaks hydration.
  const prefersReduced = useReducedMotion();
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => setReduced(!!prefersReduced), [prefersReduced]);
  const sectionRef = React.useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.3 });
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    if (!autoAdvance || touched || reduced || !inView) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % items.length), autoAdvance);
    return () => window.clearInterval(t);
  }, [autoAdvance, touched, reduced, inView, items.length]);

  const pick = (i: number) => {
    setTouched(true);
    setActive(i);
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = items.length;
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    pick(next);
    buttons.current[next]?.focus();
  };
  const ease = [0.4, 0, 0.2, 1] as const;
  const dur = reduced ? 0 : 0.35;

  return (
    <MotionConfig reducedMotion="user">
    <section ref={sectionRef} className={cn("relative w-full py-24", className)}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div>
            <h2 className="mb-10 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">{heading}</h2>
            <ul className="flex flex-col gap-1">
              {items.map((item, index) => {
                const on = active === index;
                return (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: dur, delay: index * 0.07, ease: "easeOut" }}
                    className={cn("rounded-xl ring-1 transition-shadow duration-200", on ? "ring-foreground" : "ring-transparent")}
                  >
                    <button
                      ref={(el) => {
                        buttons.current[index] = el;
                      }}
                      type="button"
                      aria-expanded={on}
                      aria-controls={`${uid}-panel`}
                      onClick={() => pick(index)}
                      onKeyDown={(e) => onKey(e, index)}
                      className="flex min-h-[48px] w-full items-start gap-4 rounded-xl px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors duration-200",
                          on ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className={cn("block text-sm font-medium transition-colors duration-200", on ? "text-foreground" : "text-muted-foreground")}>
                          {item.title}
                        </span>
                        <AnimatePresence initial={false}>
                          {on && item.description ? (
                            <motion.span
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: dur, ease }}
                              className="block overflow-hidden text-sm leading-relaxed text-muted-foreground"
                            >
                              <span className="block pt-1.5">{item.description}</span>
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </span>
                    </button>
                    {/* Mobile: media under the active item */}
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: dur, ease }}
                          className="w-full overflow-hidden px-4 pb-4 lg:hidden"
                        >
                          <Card className="relative aspect-[4/3] w-full gap-0 overflow-hidden p-0">
                            <div className="absolute inset-0">
                              <FeatureMedia item={item} reduced={reduced} />
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          <div className="sticky top-10 hidden lg:block" id={`${uid}-panel`} aria-live="polite">
            <Card className="relative aspect-[4/3] w-full gap-0 overflow-hidden p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: reduced ? 0.15 : 0.35, ease }}
                  className="absolute inset-0"
                >
                  <FeatureMedia item={items[active]} reduced={reduced} />
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}
