'use client';
/**
 * Spotlight (ibelick): a blurred radial light that follows the cursor inside its parent.
 * LAB fixes vs the original (prompt 13):
 * - Listener leak: the original removed `mouseenter`/`mouseleave` with NEW anonymous functions,
 *   which never match, so they stayed attached. Now named handlers are added and removed.
 * - motion/react instead of framer-motion (same API).
 * - `color` prop (gradient stops) instead of the fixed zinc; reduced motion hides it.
 * Note: it sets position:relative + overflow:hidden on its parent (as the original did).
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useTransform, useReducedMotion, type SpringOptions } from 'motion/react';
import { cn } from '@/lib/utils';

type SpotlightProps = {
  className?: string;
  size?: number;
  springOptions?: SpringOptions;
  /** Tailwind gradient stops. Default zinc whites. */
  color?: string;
};

export function Spotlight({
  className,
  size = 200,
  springOptions = { bounce: 0 },
  color = 'from-zinc-50 via-zinc-100 to-zinc-200',
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  // Read after mount: useReducedMotion() is null on the server, so using it in the first render breaks hydration.
  const prefersReduced = useReducedMotion();
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => setReduced(!!prefersReduced), [prefersReduced]);
  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);
  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`);
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    parent.style.position = 'relative';
    parent.style.overflow = 'hidden';
    const move = (event: MouseEvent) => {
      const { left, top } = parent.getBoundingClientRect();
      mouseX.set(event.clientX - left);
      mouseY.set(event.clientY - top);
    };
    const enter = () => setIsHovered(true);
    const leave = () => setIsHovered(false);
    parent.addEventListener('mousemove', move);
    parent.addEventListener('mouseenter', enter);
    parent.addEventListener('mouseleave', leave);
    return () => {
      parent.removeEventListener('mousemove', move);
      parent.removeEventListener('mouseenter', enter);
      parent.removeEventListener('mouseleave', leave);
    };
  }, [mouseX, mouseY]);

  if (reduced) return <div ref={containerRef} hidden />;
  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops),transparent_80%)] blur-xl transition-opacity duration-200',
        color,
        isHovered ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={{ width: size, height: size, left: spotlightLeft, top: spotlightTop }}
    />
  );
}

export default Spotlight;
