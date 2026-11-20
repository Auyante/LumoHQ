"use client";
/**
 * Velaris (21st.dev): animated simplex-noise gradient background (3 noise layers blended into
 * 4 colors over a base, vignette, center glow, film grain). Shader unchanged.
 *
 * LAB changes vs the original (prompt 14):
 * - No GL leak: the original's effect depended on the `colors` array, so a parent passing an inline
 *   array rebuilt the whole WebGL program every render and never deleted shaders/program/buffer.
 *   Now GL is created once per mount and deleted on unmount; colors/bg/grain/speed live in refs and
 *   are uploaded only when they change.
 * - No per-frame allocations (the original converted hex and made a Float32Array every frame).
 * - Pauses off-screen and on hidden tabs; reduced motion renders one still frame.
 * - Shader compile/link checks; CSS gradient fallback when WebGL is missing or fails.
 * - Accepts #rgb and #rrggbb.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const vertexShaderGLSL = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderGLSL = `
precision highp float;
varying vec2 vUv;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3  u_colors[4];
uniform vec3  u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;
  float t = u_time * 0.1;
  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);
  vec3 col = u_bg;
  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);
  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);
  float glow = smoothstep(0.8, 0.0, dist) * 0.3;
  col += u_colors[1] * glow;
  col = mix(col * 0.2, col, vignette);
  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface VelarisProps {
  bg?: string;
  /** Up to 4 hex colors. */
  colors?: string[];
  speed?: number;
  grain?: number;
  height?: string;
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_COLORS = ["#86efac", "#4ade80", "#059669", "#000000"];

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.replace(/./g, "$&$&");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const Velaris = ({
  bg = "#000000",
  colors = DEFAULT_COLORS,
  speed = 2.0,
  grain = 0.3,
  height = "100vh",
  className,
  children,
}: VelarisProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  // Live parameters, read by the loop; `dirty` marks uniforms that need uploading.
  const colorKey = colors.slice(0, 4).join(",");
  const params = useRef({ bg, colorKey, speed, grain, dirty: true });
  const kick = useRef<() => void>(() => {});
  useEffect(() => {
    Object.assign(params.current, { bg, colorKey, speed, grain, dirty: true });
    kick.current();
  }, [bg, colorKey, speed, grain]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const gl = canvas.getContext("webgl", { antialias: false, depth: false, stencil: false });
    if (!gl) {
      setFailed(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, vertexShaderGLSL);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShaderGLSL);
    const program = gl.createProgram()!;
    if (!vs || !fs) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      res: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      grain: gl.getUniformLocation(program, "u_grain"),
      colors: gl.getUniformLocation(program, "u_colors"),
      bg: gl.getUniformLocation(program, "u_bg"),
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let clock = 0; // ms of animated time, paused time excluded
    let last = -1;

    const upload = () => {
      const p = params.current;
      if (!p.dirty) return;
      p.dirty = false;
      gl.uniform1f(locs.grain, p.grain);
      gl.uniform3f(locs.bg, ...hexToRgb(p.bg));
      const list = p.colorKey.split(",");
      while (list.length < 4) list.push(list[list.length - 1] ?? "#000000");
      gl.uniform3fv(locs.colors, new Float32Array(list.flatMap(hexToRgb)));
    };

    const draw = () => {
      upload();
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, clock * 0.001 * params.current.speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (now: number) => {
      raf = 0;
      if (last >= 0) clock += Math.min(now - last, 100);
      last = now;
      draw();
      if (visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = -1;
        raf = requestAnimationFrame(frame);
      }
    };
    kick.current = reduced ? draw : start;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.max(1, Math.round(container.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(container.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (reduced) draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(container);
    const onVisibility = () => start();
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      clock = 8000; // a pleasant still frame, not the t=0 one
      draw();
    } else start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      kick.current = () => {};
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  const fallback = failed
    ? {
        background: `radial-gradient(60% 60% at 40% 40%, ${colors[0] ?? "#86efac"}55, transparent 70%), radial-gradient(50% 50% at 65% 60%, ${colors[2] ?? "#059669"}66, transparent 70%), ${bg}`,
      }
    : undefined;

  return (
    <div ref={containerRef} style={{ height, ...fallback }} className={cn("relative w-full overflow-hidden", className)}>
      {!failed && <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default Velaris;
