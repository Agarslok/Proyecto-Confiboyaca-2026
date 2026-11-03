"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import QRCode from "qrcode";

/* ============================================================================
   Piezas visuales del pitch: texto que golpea, letrero gigante, red neuronal,
   barras isométricas, contador animado y QR. Todo respeta
   prefers-reduced-motion desde la hoja de estilos.
   ========================================================================== */

/** Palabras que entran una por una con escala y desenfoque. */
export function Slam({ text, on, accent, className = "", delay = 0 }: { text: string; on: boolean; accent?: string; className?: string; delay?: number }) {
  const accentWords = new Set((accent ?? "").split(" ").filter(Boolean));
  return (
    <span className={`ps-slam${on ? " on" : ""} ${className}`.trim()} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true">
          <span className={`w${accentWords.has(word) ? " ps-mint" : ""}`} style={{ "--i": i, "--d": `${delay}ms` } as CSSProperties}>
            {word}
          </span>{" "}
        </span>
      ))}
    </span>
  );
}

/** Letrero gigante que cruza la pantalla, lento para que se alcance a leer. */
export function Marquee({ text, reverse = false, outline = false, seconds = 22 }: { text: string; reverse?: boolean; outline?: boolean; seconds?: number }) {
  const row = `${text} · `.repeat(4);
  return (
    <div className={`ps-marquee${outline ? " ps-outline" : ""}`} aria-hidden="true">
      <div className="ps-marquee-track" style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? "reverse" : "normal" }}>
        <span>{row}</span>
        <span>{row}</span>
      </div>
    </div>
  );
}

/** Corre una función por cuadro mientras «active» sea verdadero. */
function useFrame(active: boolean, draw: (time: number) => void) {
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const start = performance.now();
    const loop = (now: number) => {
      drawRef.current((now - start) / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const outCubic = (x: number) => 1 - (1 - x) ** 3;

/**
 * Red neuronal: entradas → dos capas → salidas. «level» enciende capas
 * (0 = solo entradas … 3 = todo) y por las conexiones viajan impulsos.
 */
export function NeuralNet({ active, level, inputs, outputs }: { active: boolean; level: number; inputs: string[]; outputs: string[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef([0, 0, 0, 0]);
  const LAYERS = [inputs.length, 6, 6, outputs.length];
  const W = 1000, H = 560;
  const xs = [140, 380, 620, 860];
  const node = (l: number, i: number) => ({ x: xs[l], y: 50 + (i * (H - 100)) / Math.max(1, LAYERS[l] - 1) });

  useFrame(active, (t) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    shown.current = shown.current.map((v, l) => v + ((l <= level ? 1 : 0) - v) * 0.08);
    ctx.clearRect(0, 0, W, H);
    for (let l = 0; l < 3; l++) {
      const lit = shown.current[l + 1];
      for (let i = 0; i < LAYERS[l]; i++) for (let j = 0; j < LAYERS[l + 1]; j++) {
        const a = node(l, i), b = node(l + 1, j);
        const w = ((i * 3 + j * 5) % 7) / 7;
        ctx.strokeStyle = `rgba(${51 + 100 * lit},${153 + 99 * lit},${140 + 75 * lit},${0.1 + 0.32 * lit * (0.4 + w)})`;
        ctx.lineWidth = 1 + lit * w * 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (lit > 0.6 && (i + j + l) % 2 === 0) {
          const k = (t * 0.9 + w + i * 0.17) % 1;
          ctx.fillStyle = `rgba(210,255,240,${0.9 * (1 - Math.abs(k - 0.5) * 1.6)})`;
          ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 4.5, 0, 6.283); ctx.fill();
        }
      }
    }
    for (let l = 0; l < 4; l++) for (let i = 0; i < LAYERS[l]; i++) {
      const n = node(l, i);
      const on = shown.current[l];
      ctx.shadowColor = "rgba(151,252,215,.9)";
      ctx.shadowBlur = 26 * on * (0.7 + 0.3 * Math.sin(t * 5 + i));
      ctx.fillStyle = on > 0.5 ? "#97fcd7" : "#23524c";
      ctx.strokeStyle = on > 0.5 ? "#e6fff6" : "#33998c";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, l === 3 ? 17 : 12, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div className="ps-net">
      <canvas ref={canvas} width={W} height={H} />
      {inputs.map((label, i) => (
        <span key={label} className={`ps-net-label in${level >= 0 ? " on" : ""}`} style={{ left: `${(xs[0] / W) * 100}%`, top: `${(node(0, i).y / H) * 100}%` }}>{label}</span>
      ))}
      {outputs.map((label, i) => (
        <span key={label} className={`ps-net-label out${level >= 3 ? " on" : ""}`} style={{ left: `${(xs[3] / W) * 100}%`, top: `${(node(3, i).y / H) * 100}%` }}>{label}</span>
      ))}
    </div>
  );
}

/** Campo de barras isométricas que crecen en ola: los datos ya ordenados. */
export function IsoBars({ active, on }: { active: boolean; on: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const grow = useRef(0);
  const W = 1100, H = 640;
  useFrame(active, (t) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    grow.current += ((on ? 1 : 0) - grow.current) * 0.05;
    ctx.clearRect(0, 0, W, H);
    const N = 10, M = 7, cw = 46, ch = 26, ox = 560, oy = 210;
    for (let s = 0; s < N + M; s++) for (let i = 0; i < N; i++) {
      const j = s - i;
      if (j < 0 || j >= M) continue;
      const rise = clamp(grow.current * 1.6 - (i + j) * 0.04);
      const wave = 0.75 + 0.25 * Math.sin(t * 2.6 - i * 0.55 - j * 0.35);
      const h = outCubic(rise) * wave * (0.3 + 0.7 * (i / N)) * 230 * (0.6 + 0.4 * ((i * 7 + j * 3) % 5) / 5);
      const x = ox + (i - j) * cw, y = oy + (i + j) * ch;
      const lit = h > 140;
      const face = (pts: number[][], color: string) => {
        ctx.fillStyle = color; ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.fill();
      };
      face([[x - cw, y], [x, y + ch], [x, y + ch - h], [x - cw, y - h]], lit ? "#2fb39c" : "#1f6e62");
      face([[x + cw, y], [x, y + ch], [x, y + ch - h], [x + cw, y - h]], lit ? "#3fd6b8" : "#2a8b7b");
      face([[x, y - ch - h], [x + cw, y - h], [x, y + ch - h], [x - cw, y - h]], lit ? "#97fcd7" : "#4fb7a4");
    }
  });
  return <canvas ref={canvas} className="ps-iso" width={W} height={H} aria-hidden="true" />;
}

/** Número que sube o baja suavemente hasta «value». */
export function Counter({ value, format = (n) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    let id = 0;
    const start = performance.now();
    const a = from.current;
    const step = (now: number) => {
      const k = outCubic(clamp((now - start) / 900));
      const v = a + (value - a) * k;
      from.current = v;
      setShown(v);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return <>{format(shown)}</>;
}

/** URL pública del stand: la de despliegue si está configurada, si no la de este navegador. */
export function standUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_STAND_URL?.trim().replace(/\/$/, "");
  return `${base || window.location.origin}${path}`;
}

export function Qr({ path, caption }: { path: string; caption?: ReactNode }) {
  const [src, setSrc] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = standUrl(path);
    void QRCode.toDataURL(next, { margin: 1, width: 520, errorCorrectionLevel: "M", color: { dark: "#04201d", light: "#ffffff" } }).then((data) => {
      setSrc(data);
      setUrl(next);
    });
  }, [path]);
  return (
    <figure className="ps-qr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={`Código QR a ${url}`} /> : <span className="ps-qr-wait" />}
      <figcaption>
        {caption}
        <span className="ps-qr-url">{url.replace(/^https?:\/\//, "")}</span>
      </figcaption>
    </figure>
  );
}

export function PainIcon({ kind }: { kind: "notebook" | "chat" | "sheet" }) {
  if (kind === "notebook") {
    return (
      <svg viewBox="0 0 120 140" aria-hidden="true"><rect x="8" y="4" width="104" height="132" rx="10" fill="#f3ecd9" /><rect x="8" y="4" width="18" height="132" rx="6" fill="#e4d6b4" />
        <g stroke="#7d8db8" strokeWidth="4" strokeLinecap="round"><path d="M38 34h60M38 56h52M38 78h60M38 100h40" /></g></svg>
    );
  }
  if (kind === "chat") {
    return (
      <svg viewBox="0 0 140 120" aria-hidden="true"><rect x="4" y="4" width="104" height="56" rx="18" fill="#25d366" /><path d="M24 60 14 80l30-20z" fill="#25d366" />
        <rect x="32" y="66" width="104" height="50" rx="18" fill="#e9f5ee" /><g fill="#0d3a34"><circle cx="66" cy="91" r="6" /><circle cx="84" cy="91" r="6" /><circle cx="102" cy="91" r="6" /></g>
        <g fill="#fff"><rect x="20" y="20" width="70" height="8" rx="4" /><rect x="20" y="36" width="46" height="8" rx="4" /></g></svg>
    );
  }
  return (
    <svg viewBox="0 0 140 120" aria-hidden="true"><rect x="4" y="4" width="132" height="112" rx="10" fill="#eef3f1" /><rect x="4" y="4" width="132" height="22" rx="10" fill="#1d6f42" />
      <g stroke="#b8c7c2" strokeWidth="2"><path d="M4 50h132M4 74h132M4 98h132M50 26v90M94 26v90" /></g>
      <g fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700" fill="#c0392b"><text x="12" y="44">#¡REF!</text><text x="60" y="68">???</text><text x="100" y="92">yuca</text></g></svg>
  );
}
