'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/types';

/**
 * Hero phone: a real WebGL phone standing on the desk. Its screen is a canvas texture that
 * cycles through the four deliverables. Follows the pointer on desktop, drag/swipe to spin on
 * touch. Lazy-loads three.js, pauses off-screen, renders one still frame under reduced motion.
 */
type Props = { locale: Locale; screen: number; onScreen: (i: number) => void; fallback: string };

const C = { noche: '#1B2130', ambar: '#F2A33A', ambarInk: '#8F520A', arena: '#FFF7EC', pizarra: '#5B6375', niebla: '#E6E8EE', rule: '#E9DCC4', green: '#22663F', body: 0x2a3142 };

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function star(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  g.closePath(); g.fill();
}
function stars(g: CanvasRenderingContext2D, x: number, y: number, r: number, gap: number) { for (let i = 0; i < 5; i++) star(g, x + r + i * gap, y, r); }
function arrow(g: CanvasRenderingContext2D, x: number, y: number) {
  g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x + 10, y); g.moveTo(x + 2, y - 9); g.lineTo(x + 11, y); g.lineTo(x + 2, y + 9); g.stroke();
}

/** Lucide-style icons drawn as strokes on a 24-unit grid, scaled to size. */
function icon(g: CanvasRenderingContext2D, name: string, x: number, y: number, size: number) {
  g.save(); g.translate(x, y); g.scale(size / 24, size / 24); g.lineWidth = g.lineWidth * (24 / size);
  const P = (d: string) => g.stroke(new Path2D(d));
  if (name === 'search') { P('M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z'); P('M21 21l-4.3-4.3'); }
  if (name === 'clock') { P('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'); P('M12 6v6l4 2'); }
  if (name === 'pin') { P('M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z'); P('M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'); }
  if (name === 'scissors') { P('M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'); P('M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'); P('M20 4L8.12 15.88'); P('M14.47 14.48L20 20'); P('M8.12 8.12L12 12'); }
  if (name === 'globe') { P('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'); P('M2 12h20'); P('M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20'); }
  g.restore();
}

/** Illustrated sample "photos": the shop front, the chair, the tools. Drawn, labeled as example on the page. */
function photoTiles(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const big = Math.round(w * 0.6), sw = w - big - 12, sh = (h - 12) / 2;
  // shop front at dusk: awning, window glow, barber pole
  g.save(); rr(g, x, y, big, h, 22); g.clip();
  g.fillStyle = '#2C3550'; g.fillRect(x, y, big, h);
  g.fillStyle = '#3B4A6B'; g.fillRect(x, y + h * 0.62, big, h * 0.38);
  for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#FFF7EC' : '#F2A33A'; g.fillRect(x + 18 + k * ((big - 36) / 6), y + 30, (big - 36) / 6, 34); }
  g.fillStyle = '#FFD27A'; g.fillRect(x + 30, y + 84, big - 120, 92); g.fillStyle = 'rgba(27,33,48,.35)'; g.fillRect(x + 30 + (big - 120) / 2 - 2, y + 84, 4, 92);
  g.fillStyle = '#FFF7EC'; rr(g, x + big - 64, y + 76, 26, 110, 13); g.fill();
  g.strokeStyle = '#B8433A'; g.lineWidth = 6; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x + big - 64, y + 96 + k * 22); g.lineTo(x + big - 38, y + 82 + k * 22); g.stroke(); }
  g.restore();
  // barber chair
  const cx = x + big + 12;
  g.save(); rr(g, cx, y, sw, sh, 22); g.clip(); g.fillStyle = '#F2A33A'; g.fillRect(cx, y, sw, sh);
  g.fillStyle = '#1B2130'; rr(g, cx + sw * 0.3, y + 18, sw * 0.4, sh * 0.42, 10); g.fill(); rr(g, cx + sw * 0.22, y + sh * 0.52, sw * 0.56, 18, 8); g.fill();
  g.fillRect(cx + sw * 0.47, y + sh * 0.6, sw * 0.06, sh * 0.22); rr(g, cx + sw * 0.3, y + sh * 0.8, sw * 0.4, 10, 5); g.fill();
  g.restore();
  // comb and scissors
  const ty = y + sh + 12;
  g.save(); rr(g, cx, ty, sw, sh, 22); g.clip(); g.fillStyle = '#FFD27A'; g.fillRect(cx, ty, sw, sh);
  g.strokeStyle = '#1B2130'; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round'; icon(g, 'scissors', cx + sw / 2 - 30, ty + sh / 2 - 30, 60);
  g.restore();
}

function drawScreen(g: CanvasRenderingContext2D, i: number, L: Locale) {
  const w = 572, h = 1212, S = (a: string, b: string) => (L === 'es' ? a : b);
  const F = (wt: number, px: number, d?: boolean) => `${wt} ${px}px ${d ? "'Bricolage Grotesque',sans-serif" : 'Figtree,sans-serif'}`;
  g.clearRect(0, 0, w, h); g.fillStyle = '#2A3142'; g.fillRect(0, 0, w, h);
  g.save(); rr(g, 0, 0, w, h, 64); g.clip(); g.fillStyle = C.arena; g.fillRect(0, 0, w, h);
  g.fillStyle = C.noche; rr(g, w / 2 - 70, 18, 140, 36, 18); g.fill(); g.font = F(700, 22); g.fillText('9:41', 40, 46);
  const p = 36;
  g.textAlign = 'left';
  if (i === 0) {
    g.fillStyle = '#fff'; rr(g, p, 84, w - p * 2, 70, 35); g.fill(); g.strokeStyle = C.niebla; g.lineWidth = 3; g.stroke();
    g.strokeStyle = C.pizarra; g.lineWidth = 3.5; g.lineCap = 'round'; icon(g, 'search', p + 22, 102, 34);
    g.fillStyle = C.pizarra; g.font = F(500, 26); g.fillText(S('barbería en Midland', 'barber shop in Midland'), p + 70, 128);
    photoTiles(g, p, 180, w - p * 2, 240);
    g.fillStyle = C.noche; g.font = F(800, 42, true); g.fillText(S('Barbería El Rey', 'El Rey Barber Shop'), p, 486);
    g.fillStyle = C.ambarInk; stars(g, p, 524, 15, 34); g.fillStyle = C.pizarra; g.font = F(500, 26); g.fillText('4.9 · ' + S('Barbería', 'Barber shop'), p + 186, 533);
    ([['clock', S('Abierto · Cierra 7 p. m.', 'Open · Closes 7 PM'), C.green], ['pin', S('Dirección de ejemplo', 'Sample address'), C.noche], ['scissors', S('Cortes, barba y diseño', 'Cuts, beards, designs'), C.noche], ['globe', 'barberiaelrey.com', C.ambarInk]] as [string, string, string][])
      .forEach(([ic, t, c], k) => {
        const y = 576 + k * 70; g.fillStyle = C.niebla; rr(g, p, y, 44, 44, 12); g.fill();
        g.strokeStyle = C.noche; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round'; icon(g, ic, p + 8, y + 8, 28);
        g.fillStyle = c; g.font = F(600, 26); g.fillText(t, p + 62, y + 31);
      });
    [S('Llamar', 'Call'), S('Texto', 'Text'), S('Reservar', 'Book')].forEach((b, k) => {
      const bw = (w - p * 2 - 24) / 3, bx = p + k * (bw + 12);
      g.fillStyle = k === 2 ? C.ambar : '#fff'; rr(g, bx, 880, bw, 80, 40); g.fill(); g.strokeStyle = C.ambar; g.lineWidth = 3; g.stroke();
      g.fillStyle = C.noche; g.font = F(700, 26); g.textAlign = 'center'; g.fillText(b, bx + bw / 2, 929); g.textAlign = 'left';
    });
    // a review card fills the foot of the screen
    g.fillStyle = '#fff'; rr(g, p, 990, w - p * 2, 170, 22); g.fill(); g.strokeStyle = C.rule; g.lineWidth = 3; g.stroke();
    g.fillStyle = C.noche; g.beginPath(); g.arc(p + 44, 1036, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFD27A'; g.font = F(800, 22, true); g.textAlign = 'center'; g.fillText('MR', p + 44, 1044); g.textAlign = 'left';
    g.fillStyle = C.noche; g.font = F(700, 24); g.fillText(S('Reseña de ejemplo', 'Sample review'), p + 80, 1032);
    g.fillStyle = C.ambarInk; stars(g, p + 80, 1058, 10, 24);
    g.fillStyle = C.pizarra; g.font = F(500, 24);
    g.fillText(S('«Buen corte y me atendieron en', '“Great cut, and they helped me'), p + 24, 1106); g.fillText(S('español. Reservé en un minuto.»', 'in Spanish. Booked in a minute.”'), p + 24, 1138);
  } else if (i === 1) {
    g.fillStyle = C.noche; g.fillRect(0, 0, w, 520);
    g.fillStyle = C.arena; g.font = F(800, 30, true); g.fillText('El Rey', p, 120);
    const px = w - p - 160; g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, px, 86, 160, 52, 26); g.fill();
    g.fillStyle = C.ambar; rr(g, L === 'es' ? px + 4 : px + 80, 90, 76, 44, 22); g.fill();
    g.font = F(800, 22); g.fillStyle = L === 'es' ? C.noche : C.arena; g.fillText('ES', px + 26, 120); g.fillStyle = L === 'en' ? C.noche : C.arena; g.fillText('EN', px + 102, 120);
    g.fillStyle = C.arena; g.font = F(800, 60, true); (L === 'es' ? ['Tu corte,', 'a tu hora.'] : ['Your cut,', 'your time.']).forEach((s, k) => g.fillText(s, p, 262 + k * 68));
    g.fillStyle = C.ambar; rr(g, p, 404, 260, 72, 36); g.fill(); g.fillStyle = C.noche; g.font = F(800, 26); g.fillText(S('Reservar cita', 'Book now'), p + 44, 449);
    g.fillStyle = C.noche; g.font = F(800, 32, true); g.fillText(S('Servicios', 'Services'), p, 592);
    [[S('Corte clásico', 'Classic cut'), '$20'], [S('Corte + barba', 'Cut + beard'), '$30'], [S('Diseño', 'Design'), '$10']].forEach(([a, b], k) => {
      g.fillStyle = C.noche; g.font = F(600, 27); g.fillText(a, p, 652 + k * 60); g.textAlign = 'right'; g.fillText(b, w - p, 652 + k * 60); g.textAlign = 'left';
      g.fillStyle = C.rule; g.fillRect(p, 670 + k * 60, w - p * 2, 2);
    });
    g.fillStyle = C.rule; rr(g, p, 860, w - p * 2, 250, 24); g.fill();
    g.strokeStyle = C.arena; g.lineWidth = 14; g.beginPath(); g.moveTo(p, 960); g.lineTo(w - p, 1010); g.moveTo(p + 200, 860); g.lineTo(p + 260, 1110); g.stroke();
    g.fillStyle = C.ambar; g.beginPath(); g.arc(p + 236, 975, 22, 0, Math.PI * 2); g.fill(); g.fillStyle = C.noche; g.beginPath(); g.arc(p + 236, 975, 8, 0, Math.PI * 2); g.fill();
  } else if (i === 2) {
    g.fillStyle = C.noche; g.font = F(800, 46, true); g.fillText(S('¿Cómo quieres', 'How do you want'), p, 170); g.fillText(S('contactarnos?', 'to reach us?'), p, 224);
    ([[S('Llamar', 'Call'), C.ambar, C.noche], [S('Mandar texto', 'Send a text'), C.noche, C.arena], [S('Reservar cita', 'Book a visit'), '#fff', C.noche], ['WhatsApp', '#fff', C.noche], ['Instagram', '#fff', C.noche]] as [string, string, string][])
      .forEach(([label, bg, fg], k) => {
        const y = 300 + k * 150; g.fillStyle = bg; rr(g, p, y, w - p * 2, 118, 59); g.fill();
        if (bg === '#fff') { g.strokeStyle = C.rule; g.lineWidth = 3; g.stroke(); }
        g.fillStyle = fg; g.strokeStyle = fg; g.lineWidth = 4; g.lineCap = 'round'; g.font = F(800, 34); g.fillText(label, p + 50, y + 70); arrow(g, w - p - 56, y + 59);
      });
    g.fillStyle = C.pizarra; g.font = F(600, 24); g.fillText(S('Un toque. Sin buscar el número.', 'One tap. No hunting for a number.'), p, 1080);
  } else {
    g.textAlign = 'center'; g.fillStyle = C.noche; g.font = F(800, 44, true); g.fillText(S('¿Te gustó tu corte?', 'Liked your cut?'), w / 2, 170);
    g.font = F(500, 28); g.fillStyle = C.pizarra; g.fillText(S('Déjanos una reseña', 'Leave us a review'), w / 2, 220);
    const q = 25, sz = 400, cell = sz / q, ox = (w - sz) / 2, oy = 280;
    g.fillStyle = '#fff'; rr(g, ox - 30, oy - 30, sz + 60, sz + 60, 26); g.fill();
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    g.fillStyle = C.noche;
    for (let y = 0; y < q; y++) for (let x = 0; x < q; x++) {
      const f = (x < 8 && y < 8) || (x > q - 9 && y < 8) || (x < 8 && y > q - 9);
      if (!f && rnd() > 0.52) g.fillRect(ox + x * cell, oy + y * cell, cell + 0.5, cell + 0.5);
    }
    [[0, 0], [q - 7, 0], [0, q - 7]].forEach(([fx, fy]) => {
      g.fillStyle = C.noche; g.fillRect(ox + fx * cell, oy + fy * cell, cell * 7, cell * 7);
      g.fillStyle = '#fff'; g.fillRect(ox + (fx + 1) * cell, oy + (fy + 1) * cell, cell * 5, cell * 5);
      g.fillStyle = C.ambar; g.fillRect(ox + (fx + 2) * cell, oy + (fy + 2) * cell, cell * 3, cell * 3);
    });
    g.fillStyle = C.ambarInk; stars(g, w / 2 - 150, 800, 26, 60);
    g.fillStyle = C.noche; rr(g, p, 880, w - p * 2, 110, 22); g.fill(); g.fillStyle = C.arena; g.font = F(500, 24);
    g.fillText(S('«¡Gracias por venir! ¿Nos dejas', '“Thanks for coming in! Would you'), w / 2, 925); g.fillText(S('una reseña? Nos ayuda mucho.»', 'leave us a review? It helps a lot.”'), w / 2, 960);
    g.font = F(600, 22); g.fillStyle = C.pizarra; g.fillText(S('QR de ejemplo', 'Sample QR code'), w / 2, 1060); g.textAlign = 'left';
  }
  g.restore();
}

export function Phone3D({ locale, screen, onScreen, fallback }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ show: (i: number) => void; redraw: () => void } | null>(null);
  const localeRef = useRef(locale);
  const onScreenRef = useRef(onScreen);
  const [failed, setFailed] = useState(false);
  localeRef.current = locale;
  onScreenRef.current = onScreen;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false, raf = 0;
    const cleanups: (() => void)[] = [];

    (async () => {
      const THREE = await import('three');
      if (disposed) return;
      let r: import('three').WebGLRenderer;
      try {
        r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        setFailed(true);
        return;
      }
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputColorSpace = THREE.SRGBColorSpace; r.setClearColor(0, 0);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0, 15);
      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 8); scene.add(key);
      const rim = new THREE.PointLight(0xf2a33a, 40, 30); rim.position.set(-5, -2, -3); scene.add(rim);

      const W = 3.1, H = 6.3, R = 0.5, sh = new THREE.Shape();
      sh.moveTo(-W / 2 + R, -H / 2); sh.lineTo(W / 2 - R, -H / 2); sh.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R); sh.lineTo(W / 2, H / 2 - R);
      sh.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2); sh.lineTo(-W / 2 + R, H / 2); sh.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R); sh.lineTo(-W / 2, -H / 2 + R); sh.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 5, curveSegments: 20 }); geo.center();
      const phone = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: C.body, roughness: 0.3, metalness: 0.75 });
      phone.add(new THREE.Mesh(geo, bodyMat));

      const sc = document.createElement('canvas'); sc.width = 572; sc.height = 1212;
      const sg = sc.getContext('2d')!;
      const scrTex = new THREE.CanvasTexture(sc); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = 4;
      const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 6.06), new THREE.MeshBasicMaterial({ map: scrTex }));
      screenMesh.position.z = 0.21; phone.add(screenMesh);

      const bc = document.createElement('canvas'); bc.width = 256; bc.height = 256;
      const bg = bc.getContext('2d')!;
      bg.fillStyle = '#2A3142'; bg.fillRect(0, 0, 256, 256); bg.strokeStyle = C.ambar; bg.lineWidth = 26; bg.beginPath(); bg.arc(128, 128, 60, 0, Math.PI * 2); bg.stroke();
      bg.fillStyle = C.ambar; bg.beginPath(); bg.arc(128, 128, 18, 0, Math.PI * 2); bg.fill();
      const backTex = new THREE.CanvasTexture(bc); backTex.colorSpace = THREE.SRGBColorSpace;
      const back = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: backTex }));
      back.position.z = -0.21; back.rotation.y = Math.PI; phone.add(back);
      scene.add(phone);

      let shown = 0, pending: number | null = null, spin = 1, spinFrom = 0;
      const draw = (i: number) => { drawScreen(sg, i, localeRef.current); scrTex.needsUpdate = true; };
      const startSpin = (i: number) => { pending = i; if (spin >= 1) { spin = 0; spinFrom = performance.now(); } };
      api.current = {
        show: (i) => { if (reduced) { shown = i; draw(i); render(); } else startSpin(i); },
        redraw: () => { draw(shown); render(); },
      };
      draw(0);
      document.fonts?.ready.then(() => { if (!disposed) { draw(shown); render(); } });

      // input: drag to spin, pointer position tilts toward the cursor
      let drag: { x: number; r: number } | null = null, dRot = 0, dVel = 0, tiltX = 0, tiltY = 0, aimX = 0, aimY = 0;
      const down = (e: PointerEvent) => { drag = { x: e.clientX, r: dRot }; canvas.setPointerCapture(e.pointerId); };
      const move = (e: PointerEvent) => { if (!drag) return; const n = drag.r + (e.clientX - drag.x) * 0.012; dVel = n - dRot; dRot = n; };
      const up = () => { drag = null; };
      const aim = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const b = canvas.getBoundingClientRect();
        aimY = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (window.innerWidth / 2))) * 0.35;
        aimX = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / (window.innerHeight / 2))) * 0.18;
      };
      canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      window.addEventListener('pointermove', aim, { passive: true });
      cleanups.push(() => {
        canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
        canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up);
        window.removeEventListener('pointermove', aim);
      });

      let visible = true;
      const io = new IntersectionObserver((es) => es.forEach((e) => (visible = e.isIntersecting)), { rootMargin: '120px' });
      io.observe(canvas); cleanups.push(() => io.disconnect());

      const size = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
        const pr = r.getPixelRatio();
        if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) {
          r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
          cam.position.z = cam.aspect < 0.75 ? 13.5 / Math.max(0.45, cam.aspect / 0.75) : 12.5;
        }
      };
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
      const start = performance.now();
      function render() { size(); r.render(scene, cam); }

      // auto-advance through the four screens until the visitor picks one
      let auto = !reduced;
      const timer = window.setInterval(() => { if (auto && visible && !document.hidden) { const n = (shown + 1) % 4; startSpin(n); onScreenRef.current(n); } }, 4800);
      cleanups.push(() => clearInterval(timer));
      (api.current as { stopAuto?: () => void }).stopAuto = () => { auto = false; };

      if (reduced) { phone.rotation.set(-0.05, -0.22, 0); render(); return; }
      const frame = () => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) return;
        size();
        const t = (performance.now() - start) / 1000;
        let extra = 0;
        if (spin < 1) {
          spin = Math.min(1, (performance.now() - spinFrom) / 900); extra = ease(spin) * Math.PI * 2;
          if (spin > 0.5 && pending !== null && pending !== shown) { shown = pending; draw(shown); }
          if (spin >= 1 && pending !== null && pending !== shown) startSpin(pending);
        }
        if (!drag) { dVel *= 0.92; dRot += dVel; dRot *= 0.965; }
        tiltX += (aimX - tiltX) * 0.06; tiltY += (aimY - tiltY) * 0.06;
        phone.rotation.y = Math.sin(t * 0.6) * 0.2 + extra + dRot + tiltY;
        phone.rotation.x = Math.sin(t * 0.45) * 0.06 - 0.05 + tiltX;
        phone.position.y = Math.sin(t * 0.9) * 0.1;
        r.render(scene, cam);
      };
      frame();
      cleanups.push(() => { geo.dispose(); bodyMat.dispose(); scrTex.dispose(); backTex.dispose(); r.dispose(); });
    })().catch(() => setFailed(true));

    return () => { disposed = true; cancelAnimationFrame(raf); cleanups.forEach((f) => f()); api.current = null; };
  }, []);

  useEffect(() => { api.current?.show(screen); }, [screen]);
  useEffect(() => { api.current?.redraw(); }, [locale]);

  // a tab click from the caption stops the auto-advance
  useEffect(() => {
    const stop = () => (api.current as { stopAuto?: () => void } | null)?.stopAuto?.();
    const el = canvasRef.current?.parentElement?.parentElement;
    el?.addEventListener('click', stop);
    canvasRef.current?.addEventListener('pointerdown', stop);
    return () => el?.removeEventListener('click', stop);
  }, []);

  if (failed) return <div className="phone-fallback">{fallback}</div>;
  return <canvas ref={canvasRef} aria-hidden="true" />;
}
