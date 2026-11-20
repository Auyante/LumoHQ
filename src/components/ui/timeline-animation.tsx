"use client";
/**
 * TimelineContent: sequential scroll reveal (written for prompt 23, whose import had no source).
 * Every element sharing a `timelineRef` animates when that container scrolls into view, ordered by
 * `animationNum` (custom index → variants can delay by it). Default: blur(10px) + y -20 → sharp.
 * Reduced motion: renders the final state (opacity only, no blur/transform).
 */
import * as React from "react";
import { motion, useInView, type Variants } from "motion/react";

type Tag = "div" | "span" | "p" | "h1" | "h2" | "h3" | "h4" | "li" | "ul" | "section" | "figure";

const DEFAULT: Variants = {
  hidden: { opacity: 0, y: -20, filter: "blur(10px)" },
  visible: (i: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: i * 0.15, duration: 0.5 } }),
};
// Must reset filter/y explicitly: the element may already carry the default hidden blur(10px)
// from the first (pre-mount) render, and an opacity-only variant would leave it blurred forever.
const REDUCED: Variants = {
  hidden: { opacity: 0, y: 0, filter: "blur(0px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.2 } },
};

export function TimelineContent({
  as = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  children,
  once = true,
}: {
  as?: Tag;
  animationNum?: number;
  timelineRef: React.RefObject<HTMLElement | null>;
  customVariants?: Variants;
  className?: string;
  children?: React.ReactNode;
  once?: boolean;
}) {
  const inView = useInView(timelineRef, { once, amount: 0.15 });
  // Read reduced motion after mount (SSR-safe: first render must match the server).
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      custom={animationNum}
      variants={reduced ? REDUCED : customVariants ?? DEFAULT}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export default TimelineContent;
