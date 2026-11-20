"use client";
/**
 * Liquid glass button: catalog piece 06a (from the contour hero), extracted as its own component.
 * Layered gradient pill, inset highlights, a radial sheen, a 1px glint, a springy hover, and in
 * Chromium `backdrop-filter: blur(4px) url(#lumo-liquid)` (SVG turbulence displacement) so whatever
 * moves behind it looks refracted. Elsewhere it falls back to plain frosted glass.
 * Lumo adaptation: `tone="amber"` for the primary action, rendered as a link (≥48px).
 */
import * as React from "react";
import { cn } from "@/lib/utils";

const css = `
.lq-btn{position:relative;isolation:isolate;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 30px;border-radius:999px;font-size:1rem;font-weight:700;letter-spacing:.005em;color:#FFF7EC;text-decoration:none;
  background:linear-gradient(165deg,rgba(255,255,255,.14),rgba(255,255,255,.03) 55%,rgba(255,255,255,.09));
  -webkit-backdrop-filter:blur(10px) saturate(1.9) brightness(1.15);backdrop-filter:blur(10px) saturate(1.9) brightness(1.15);
  box-shadow:inset 1px 1px 0 rgba(255,255,255,.6),inset -1px -1px 0 rgba(255,255,255,.22),inset 0 0 22px rgba(255,255,255,.07),inset 0 -10px 16px -10px rgba(255,255,255,.35),0 12px 32px rgba(0,0,0,.45);
  transition:transform .35s cubic-bezier(.3,1.5,.5,1),box-shadow .3s}
.lq-btn::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;
  background:radial-gradient(120% 90% at 18% 0%,rgba(255,255,255,.34),transparent 46%),radial-gradient(90% 70% at 85% 110%,rgba(255,255,255,.18),transparent 50%)}
.lq-btn::after{content:"";position:absolute;left:22px;right:38%;top:3px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);z-index:-1;pointer-events:none}
.lq-btn.amber{color:#1B2130;background:linear-gradient(165deg,rgba(255,214,140,.95),rgba(242,163,58,.92) 55%,rgba(247,183,90,.95))}
.lq-btn:hover{transform:translateY(-2px) scale(1.02);box-shadow:inset 1px 1px 0 rgba(255,255,255,.75),inset -1px -1px 0 rgba(255,255,255,.3),inset 0 0 26px rgba(255,255,255,.12),inset 0 -10px 16px -10px rgba(255,255,255,.45),0 18px 40px rgba(0,0,0,.5)}
.lq-btn:active{transform:scale(.97)}
.lq-btn:focus-visible{outline:2px solid #FFD27A;outline-offset:3px}
.lq-liquid .lq-btn:not(.amber){-webkit-backdrop-filter:blur(4px) url(#lumo-liquid) saturate(1.9) brightness(1.15);backdrop-filter:blur(4px) url(#lumo-liquid) saturate(1.9) brightness(1.15)}
@media(prefers-reduced-motion:reduce){.lq-btn{transition:none}}
`;

/** Mount once per page section that holds liquid buttons: the style, the SVG filter, and the Chromium flag. */
export function LiquidDefs() {
  React.useEffect(() => {
    if (/Chrome\//.test(navigator.userAgent)) document.documentElement.classList.add("lq-liquid");
  }, []);
  return (
    <>
      <style>{css}</style>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="lumo-liquid" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves={2} seed={3} result="n" />
          <feGaussianBlur in="n" stdDeviation="2" result="b" />
          <feDisplacementMap in="SourceGraphic" in2="b" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </>
  );
}

export function LiquidButton({ href, tone = "glass", className, children }: { href: string; tone?: "glass" | "amber"; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} className={cn("lq-btn", tone === "amber" && "amber", className)}>
      {children}
    </a>
  );
}

export default LiquidButton;
