"use client";
/**
 * Interactive starfield (extracted + rebuilt from a 21st.dev pricing section, prompt 21).
 * Stars twinkle and are pulled toward the pointer by springs, then spring back.
 *
 * Rebuilt for performance/correctness vs the original:
 * - ONE canvas and one rAF loop. The original set React state on every mousemove at the section level,
 *   re-rendering 150 star components (each with its own effect) per event.
 * - Deterministic, seeded positions: the original used Math.random() in useState (server ≠ client →
 *   hydration mismatch) and Math.random() for size/duration on EVERY render.
 * - Color from CSS `color` (currentColor), so it follows the theme; DPR capped at 2.
 * - Pauses off-screen / hidden tab; reduced motion = static stars, no pull.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type Star = { x: number; y: number; r: number; speed: number; phase: number; dx: number; dy: number; vx: number; vy: number };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StarfieldProps {
  count?: number;
  /** Radius of magnetic influence, px. */
  radius?: number;
  /** Share of the distance a star travels toward the pointer at the center of influence. */
  pull?: number;
  seed?: number;
  className?: string;
}

export function Starfield({ count = 150, radius = 600, pull = 0.5, seed = 7, className }: StarfieldProps) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rand = mulberry32(seed);
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: rand(), y: rand(), r: 0.5 + rand(), speed: 0.2 + rand() * 0.3, phase: rand() * Math.PI * 2, dx: 0, dy: 0, vx: 0, vy: 0,
    }));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, on: false };
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0;

    const size = () => {
      const r = host.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      draw(performance.now(), 0);
    };

    function draw(now: number, dt: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = getComputedStyle(canvas!).color;
      const t = now / 1000;
      const k = 100, c = 15; // spring stiffness / damping, mass 0.1 (the original's motion spring)
      for (const s of stars) {
        const sx = s.x * w, sy = s.y * h;
        let tx = 0, ty = 0;
        if (pointer.on && !reduced.matches) {
          const ddx = pointer.x - sx, ddy = pointer.y - sy;
          const d = Math.hypot(ddx, ddy);
          if (d < radius) {
            const f = 1 - d / radius;
            tx = ddx * f * pull;
            ty = ddy * f * pull;
          }
        }
        if (dt > 0) {
          // mass 0.1 → ×10. Damping 150/s is stiff: sub-step at 240 Hz so semi-implicit Euler stays stable.
          const steps = Math.ceil(dt * 240), h = dt / steps;
          for (let i = 0; i < steps; i++) {
            s.vx += (k * (tx - s.dx) - c * s.vx) * 10 * h;
            s.vy += (k * (ty - s.dy) - c * s.vy) * 10 * h;
            s.dx += s.vx * h;
            s.dy += s.vy * h;
          }
        }
        const alpha = reduced.matches ? 0.6 : 0.5 + 0.5 * Math.sin(t * s.speed * Math.PI + s.phase);
        ctx!.globalAlpha = Math.max(0, alpha);
        ctx!.beginPath();
        ctx!.arc(sx + s.dx, sy + s.dy, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    const loop = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
      last = now;
      draw(now, dt);
      if (visible && !document.hidden && !reduced.matches) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && visible && !document.hidden && !reduced.matches) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on = true;
    };
    const leave = () => (pointer.on = false);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    const ro = new ResizeObserver(size);
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(host);
    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);
    reduced.addEventListener("change", onVis);
    size();
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", onVis);
      reduced.removeEventListener("change", onVis);
    };
  }, [count, radius, pull, seed]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} />;
}

export default Starfield;
