"use client";

/* Capturas y logo estáticos del pitch: no necesitan optimización de next/image. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { Caveat } from "next/font/google";
import { NicheIcon, type NicheIconName } from "@/components/externado/niche-icons";
import { before } from "@/components/externado/solution-showcase";
import { SolutionDemo } from "@/components/radar/SolutionSpotlight";
import { pitchCustomCourseTopics, pitchMentorshipOffers } from "@/features/pitch/content/deck";
import { PLANS, SIZES, type PlanId } from "@/lib/radar/bank";
import { estimateEffort } from "@/lib/radar/effort";
import { SOLUTIONS, solutionHeadline, type SolutionKind } from "@/lib/radar/solution";
import type { IndustryId, OptionKey, SizeId } from "@/lib/radar/types";
import { AI_IS, BUILDS, CLOSING_QUOTE, FAILURES, FAIR_STEPS, NOTEBOOK, PAINS, ROUTE } from "./deck";
import { Counter, IsoBars, Marquee, NeuralNet, PainIcon, Qr, Slam } from "./fx";

const hand = Caveat({ subsets: ["latin"], weight: ["600"] });

export interface DeckControls {
  hands: number;
  addHand: (delta: number) => void;
  withAI: boolean;
  setWithAI: (value: boolean) => void;
  /** La diapositiva del video registra aquí su elemento, para que Espacio lo pause. */
  registerVideo: (video: HTMLVideoElement | null) => void;
}

export interface ShowSlideProps {
  step: number;
  active: boolean;
  deck: DeckControls;
}

/** Clase de un elemento que aparece en el paso «beat». */
const b = (step: number, beat: number, extra = "") => `ps-b${step >= beat ? " on" : ""}${extra ? ` ${extra}` : ""}`;
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Lockup({ className = "" }: { className?: string }) {
  return <img className={`ps-lockup ${className}`} src="/pitch/externado-dept-lockup-transparent.png" alt="Universidad Externado de Colombia · Departamento de Matemáticas" width={1024} height={275} />;
}

function Kicker({ children, on = true }: { children: string; on?: boolean }) {
  return <p className={`ps-kicker${on ? " on" : ""}`}>{children}</p>;
}

/* 1 · Apertura: punto → letrero naranja → frase central */
export function SlideApertura({ step }: ShowSlideProps) {
  return (
    <div className="ps-open">
      <div className={`ps-open-dot${step >= 1 ? " gone" : ""}`} aria-hidden="true"><span className="ring" /><span className="dot" /></div>
      <p className={`ps-open-q${step === 0 ? " on" : ""}`}>¿Quieres usar IA en tu empresa?</p>
      <div className={`ps-open-coral${step === 1 ? " on" : ""}`} aria-hidden={step !== 1}>
        <Marquee text="SIN MORIR" seconds={18} />
        <Marquee text="EN EL INTENTO" reverse outline seconds={20} />
      </div>
      <div className={`ps-open-title${step >= 2 ? " on" : ""}`}>
        <Lockup />
        <h1 className="ps-h1"><Slam text="Cómo implementar la IA" on={step >= 2} /></h1>
        <h1 className="ps-h1 ps-mint"><Slam text="sin morir en el intento" on={step >= 2} delay={420} /></h1>
        <p className={b(step, 3, "ps-lead")}>Una ruta en 5 pasos para pymes · con el Radar IA del Departamento de Matemáticas</p>
      </div>
    </div>
  );
}

/* 2 · Video con voz */
export const PITCH_SHOW_VIDEO = process.env.NEXT_PUBLIC_PITCH_VIDEO_SRC?.trim() || "/pitch/radar-ia-video.mp4";

export function SlideVideo({ active, deck }: ShowSlideProps) {
  const [paused, setPaused] = useState(true);
  const video = useRef<HTMLVideoElement | null>(null);
  const { registerVideo } = deck;
  useEffect(() => {
    const el = video.current;
    if (!el || !active) return;
    el.currentTime = 0;
    void el.play().catch(() => setPaused(true));
    return () => el.pause();
  }, [active]);
  return (
    <div className="ps-video">
      <video
        ref={(el) => {
          video.current = el;
          registerVideo(el);
        }}
        src={PITCH_SHOW_VIDEO}
        playsInline
        preload="auto"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        aria-label="Video: cómo implementar la IA sin morir en el intento"
      />
      {paused ? (
        <button type="button" className="ps-video-play" onClick={() => void video.current?.play()}>
          <span aria-hidden="true">▶</span> Reproducir <small>o espacio</small>
        </button>
      ) : null}
    </div>
  );
}

/* 3 · ¿Te suena? — dolores y manos arriba */
export function SlideRealidad({ step, deck }: ShowSlideProps) {
  return (
    <div className="ps-wrap ps-real">
      <Kicker>La realidad de muchas pymes</Kicker>
      <h2 className="ps-h2"><Slam text="¿Te suena?" on /></h2>
      <div className="ps-pains">
        {PAINS.map((pain, i) => (
          <article key={pain.title} className={b(step, i + 1, "ps-pain")} style={{ "--r": `${[-4, 3, -2][i]}deg` } as CSSProperties}>
            <span className="ps-pain-icon"><PainIcon kind={pain.icon} /></span>
            <h3>{pain.title}</h3>
            <p>{pain.text}</p>
          </article>
        ))}
      </div>
      <div className={b(step, 4, "ps-hands")}>
        <p className="ps-hands-q">Levanta la mano si te pasa ✋</p>
        <div className="ps-hands-count">
          <button type="button" onClick={() => deck.addHand(-1)} aria-label="Restar una mano">−</button>
          <span className="ps-hands-num"><Counter value={deck.hands} /></span>
          <button type="button" onClick={() => deck.addHand(1)} aria-label="Sumar una mano">+</button>
        </div>
        <p className="ps-fine">{deck.hands === 1 ? "mano arriba" : "manos arriba"} · tecla H para sumar</p>
      </div>
    </div>
  );
}

/* 4 · Qué es la IA, sin humo */
function useLevel(target: number, active: boolean) {
  const [level, setLevel] = useState(-1);
  useEffect(() => {
    if (!active) return;
    const timers = [0, 1, 2, 3].map((l) => window.setTimeout(() => setLevel(l <= target ? l : -1), 350 + l * 650));
    return () => timers.forEach(clearTimeout);
  }, [target, active]);
  return target < 0 ? -1 : level;
}

export function SlideQueEs({ step, active }: ShowSlideProps) {
  const level = useLevel(step >= 1 ? 3 : -1, active);
  return (
    <div className="ps-wrap ps-whatis">
      <Kicker>Concepto</Kicker>
      <h2 className="ps-h2"><Slam text="La IA, sin humo" on accent="humo" /></h2>
      <p className={b(step, 1, "ps-lead")}>Aprende de ejemplos y te propone un siguiente paso.</p>
      <div className={b(step, 1, "ps-whatis-net")}>
        <NeuralNet active={active} level={level} inputs={["Ventas", "Pedidos", "Mensajes", "Inventario"]} outputs={["Patrón", "Propuesta"]} />
      </div>
      <div className="ps-isnt">
        {AI_IS.map((item, i) => (
          <article key={item.title} className={b(step, 2, "ps-isnt-card")} style={d(i * 140)}>
            <span className="ps-x" aria-hidden="true">✕</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <p className={b(step, 3, "ps-quote-line")}>No conoce tu empresa <span className="ps-mint">si nadie le cuenta su situación.</span></p>
    </div>
  );
}

/* 5 · Por qué se muere en el intento */
export function SlideMorir({ step }: ShowSlideProps) {
  const fixed = step >= 4;
  return (
    <div className="ps-wrap ps-fail">
      <Kicker>{fixed ? "Así lo evitamos" : "Por qué fallan"}</Kicker>
      <h2 className="ps-h2">
        {fixed ? <Slam key="fix" text="Cómo no morir en el intento" on accent="no morir" /> : <Slam key="fail" text="¿Por qué tantas empresas mueren en el intento?" on accent="mueren" />}
      </h2>
      <div className="ps-fail-grid">
        {FAILURES.map((item, i) => (
          <div key={item.fail} className={b(step, i + 1, `ps-flip${fixed ? " flipped" : ""}`)} style={d(fixed ? i * 160 : 0)}>
            <article className="ps-flip-face ps-flip-front">
              <span className="ps-crack" aria-hidden="true" />
              <span className="ps-x" aria-hidden="true">✕</span>
              <p className="ps-fine">Error {i + 1}</p>
              <h3>{item.fail}</h3>
            </article>
            <article className="ps-flip-face ps-flip-back">
              <span className="ps-check" aria-hidden="true">✓</span>
              <p className="ps-fine">Nuestro paso</p>
              <h3>{item.fix}</h3>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 6 · La ruta en 5 pasos */
export function SlideRuta({ step }: ShowSlideProps) {
  const path = "M160 330 C 340 330, 340 130, 550 160 S 770 380, 940 300 S 1220 90, 1370 170 S 1560 330, 1720 250";
  const nodes = [[160, 330], [550, 160], [940, 300], [1370, 170], [1720, 250]];
  return (
    <div className="ps-wrap ps-route">
      <Kicker>El mapa</Kicker>
      <h2 className="ps-h2"><Slam text="La ruta: 5 pasos, sin morir en el intento" on accent="5 pasos," /></h2>
      <div className="ps-route-map">
        <svg viewBox="0 0 1880 460" aria-hidden="true">
          <path d={path} className="ps-route-base" />
          <path d={path} className="ps-route-fill" pathLength={100} style={{ strokeDashoffset: 100 - (Math.min(step, 5) / 5) * 100 } as CSSProperties} />
          {nodes.map(([x, y], i) => (
            <g key={i} className={`ps-route-node${step >= i + 1 ? " on" : ""}`} transform={`translate(${x} ${y})`}>
              <circle r="46" className="halo" />
              <circle r="34" />
              <text y="12" textAnchor="middle">{i + 1}</text>
            </g>
          ))}
        </svg>
        {ROUTE.map((item, i) => (
          <div key={item.title} className={b(step, i + 1, "ps-route-label")} style={{ left: `${(nodes[i][0] / 1880) * 100}%`, top: `${((nodes[i][1] + (i % 2 ? -160 : 70)) / 460) * 100}%` }}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 7 · Paso 1: construimos tus datos */
export function SlideDatos({ step, active }: ShowSlideProps) {
  return (
    <div className="ps-wrap ps-data">
      <Kicker>Paso 1</Kicker>
      <h2 className="ps-h2"><Slam text="Construimos tus datos" on accent="datos" /></h2>
      <div className={`ps-data-stage${step >= 2 ? " bars" : ""}`}>
        <figure className={`ps-notebook ${hand.className}${step >= 1 ? " sent" : ""}`}>
          {NOTEBOOK.map((row, i) => <p key={row[0]} style={d(i * 160)}>{`${row[0]} · ${row[2]} ${row[1].toLowerCase()} · ${row[3]}`}</p>)}
          <p className="ps-nb-red">¿se acabó la harina??</p>
        </figure>
        <div className={`ps-table${step >= 1 ? " on" : ""}`}>
          <div className="ps-tr head"><span>Día</span><span>Producto</span><span>Cantidad</span><span>Cliente</span></div>
          {NOTEBOOK.map((row, i) => (
            <div key={row[0]} className="ps-tr" style={d(300 + i * 260)}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>
          ))}
        </div>
        <div className="ps-data-iso"><IsoBars active={active} on={step >= 2} /></div>
      </div>
      <p className={b(step, 2, "ps-lead ps-data-caption")}>Del cuaderno a una tabla, y de la tabla a cifras que <span className="ps-mint">puedes ver crecer.</span></p>
      <p className={b(step, 3, "ps-banner")}><Slam text="¿No tienes datos? Te enseñamos a construirlos." on={step >= 3} accent="construirlos." /></p>
    </div>
  );
}

/* 8 · Paso 2: el diagnóstico */
const DIMS: [string, number][] = [["Negocio", 50], ["Datos", 11], ["Tecnología", 67], ["Analítica", 33], ["Equipo", 33], ["Estrategia", 50]];

function useGrow(on: boolean) {
  const [k, setK] = useState(0);
  useEffect(() => {
    let id = 0;
    const start = performance.now();
    const from = on ? 0 : 1;
    const loop = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      const e = 1 - (1 - p) ** 3;
      setK(on ? from + (1 - from) * e : 0);
      if (p < 1 && on) id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [on]);
  return k;
}

function Radar({ k }: { k: number }) {
  const R = 210;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    return [Math.cos(a) * R * v, Math.sin(a) * R * v];
  };
  return (
    <svg className="ps-radar" viewBox="-330 -290 660 580" aria-label="Radar de madurez en datos e IA (ejemplo)">
      {[0.25, 0.5, 0.75, 1].map((g) => <polygon key={g} points={DIMS.map((_, i) => pt(i, g).join(",")).join(" ")} className="grid" />)}
      {DIMS.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={0} y1={0} x2={x} y2={y} className="grid" />; })}
      <polygon points={DIMS.map(([, v], i) => pt(i, (v / 100) * k).join(",")).join(" ")} className="shape" />
      {DIMS.map(([name, v], i) => {
        const [x, y] = pt(i, (v / 100) * k);
        const [lx, ly] = pt(i, 1.27);
        const hot = name === "Datos" && k > 0.95;
        return (
          <g key={name}>
            <circle cx={x} cy={y} r={hot ? 11 : 8} className={hot ? "dot hot" : "dot"} />
            <text x={lx} y={ly} textAnchor="middle" className={hot ? "label hot" : "label"}>{name} {Math.round(v * k)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function SlideDiagnostico({ step }: ShowSlideProps) {
  const k = useGrow(step >= 1);
  const g = useGrow(step >= 2);
  return (
    <div className="ps-wrap ps-diag">
      <Kicker>Paso 2</Kicker>
      <h2 className="ps-h2"><Slam text="Un diagnóstico que entiende tu negocio" on accent="entiende tu negocio" /></h2>
      <div className={`ps-diag-grid${step >= 3 ? " with-qr" : ""}`}>
        <div className={b(step, 1, "ps-diag-radar")}><Radar k={k} /></div>
        <div className={b(step, 2, "ps-gauge")}>
          <svg viewBox="-260 -250 520 280" aria-hidden="true">
            <path d="M-210 0 A210 210 0 0 1 210 0" className="track" />
            <path d="M-210 0 A210 210 0 0 1 210 0" className="arc" pathLength={100} style={{ strokeDasharray: `${37 * g} 100` }} />
          </svg>
          <p className="ps-gauge-num">{Math.round(37 * g)}<small>/100</small></p>
          <p className="ps-pill ps-pill-coral">Problema central: tus datos</p>
          <p className="ps-fine">Ejemplo: Panadería Carlitos, microempresa</p>
        </div>
        <div className={b(step, 3, "ps-diag-qr")}>
          <Qr path="/diagnostico" caption={<><strong>Hazlo tú ahora</strong> unos 6 minutos, desde tu celular</>} />
        </div>
      </div>
    </div>
  );
}

/* 9 · Sin IA / Con IA, en vivo */
const EXAMPLES: { id: IndustryId; label: string; icon: NicheIconName }[] = [
  { id: "alimentos", label: "Panadería", icon: "bakery" },
  { id: "turismo", label: "Hotel", icon: "hotel-demo" },
  { id: "mineria", label: "Mina", icon: "mine-demo" },
];
const KINDS: { kind: SolutionKind; problem: string }[] = [
  { kind: "registro", problem: "Todo en cuadernos" },
  { kind: "solicitudes", problem: "Pedidos perdidos en el chat" },
  { kind: "inventario", problem: "No sé qué se agota" },
  { kind: "clientes", problem: "No conozco a mis clientes" },
  { kind: "merma", problem: "Sobra o falta producto" },
  { kind: "indicadores", problem: "Decido a ojo" },
];

export function SlideAntesDespues({ deck }: ShowSlideProps) {
  const [industry, setIndustry] = useState<IndustryId>("alimentos");
  const [kind, setKind] = useState<SolutionKind>("registro");
  const [drag, setDrag] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  /* posición de la cortina: 100 = todo «Sin IA», 0 = todo «Con IA» */
  const pos = drag ?? (deck.withAI ? 0 : 100);

  function dragTo(event: ReactPointerEvent) {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    setDrag(Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100)));
  }

  return (
    <div className="ps-wrap ps-ba">
      <div className="ps-ba-head">
        <div>
          <Kicker>En vivo</Kicker>
          <h2 className="ps-h2">
            <span className={deck.withAI ? "ps-dim" : "ps-coral"}>Sin IA</span> <span className="ps-vs">vs.</span>{" "}
            <span className={deck.withAI ? "ps-mint" : "ps-dim"}>Con IA</span>
          </h2>
        </div>
        <button type="button" className={`ps-switch${deck.withAI ? " on" : ""}`} onClick={() => deck.setWithAI(!deck.withAI)} aria-pressed={deck.withAI}>
          <span className="knob" /> <span>{deck.withAI ? "Con IA" : "Sin IA"}</span> <small>tecla T</small>
        </button>
      </div>
      <div className="ps-ba-controls">
        <div className="ps-chips" role="radiogroup" aria-label="Negocio">
          {EXAMPLES.map((ex) => (
            <button key={ex.id} type="button" role="radio" aria-checked={industry === ex.id} className={industry === ex.id ? "ps-chip on" : "ps-chip"} onClick={() => setIndustry(ex.id)}>
              <span className="ps-chip-icon"><NicheIcon name={ex.icon} /></span>{ex.label}
            </button>
          ))}
        </div>
        <div className="ps-chips" role="tablist" aria-label="Problema">
          {KINDS.map((item) => (
            <button key={item.kind} type="button" role="tab" aria-selected={kind === item.kind} className={kind === item.kind ? "ps-chip ps-chip-sm on" : "ps-chip ps-chip-sm"} onClick={() => setKind(item.kind)}>
              «{item.problem}»
            </button>
          ))}
        </div>
      </div>
      <div className="ps-ba-stage" ref={stage}>
        <div className="ps-ba-after">
          <p className="ps-ba-tag ps-mint">Con IA · {SOLUTIONS[kind].name}</p>
          <h3>{solutionHeadline(kind, industry)}</h3>
          <SolutionDemo key={`${industry}-${kind}`} kind={kind} industryId={industry} />
        </div>
        <div className="ps-ba-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)`, transition: drag === null ? "clip-path .8s cubic-bezier(.7,0,.2,1)" : "none" }}>
          <p className="ps-ba-tag ps-coral">Sin IA · así se hace hoy</p>
          <figure className={`ps-notebook ps-notebook-lg ${hand.className}`}>
            {before(kind, industry).map((line) => <p key={line}>{line}</p>)}
          </figure>
          <div className="ps-chaos" aria-hidden="true">
            {["?", "!", "¿?", "…"].map((s, i) => <span key={i} style={d(i * 300)}>{s}</span>)}
          </div>
        </div>
        <div
          className="ps-ba-handle"
          style={{ left: `${pos}%`, transition: drag === null ? "left .8s cubic-bezier(.7,0,.2,1)" : "none" }}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragTo(event); }}
          onPointerMove={(event) => { if (drag !== null) dragTo(event); }}
          onPointerUp={() => { if (drag !== null) deck.setWithAI(drag < 50); setDrag(null); }}
          role="slider"
          aria-label="Cortina entre sin IA y con IA"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(100 - pos)}
        >
          <span>⇆</span>
        </div>
      </div>
    </div>
  );
}

/* 10 · Paso 3: la página */
export function SlidePagina({ step }: ShowSlideProps) {
  return (
    <div className="ps-wrap ps-page">
      <div className="ps-page-text">
        <Kicker>Paso 3</Kicker>
        <h2 className="ps-h2"><Slam text="Tu solución, funcionando en una página web" on accent="funcionando" /></h2>
        <p className="ps-lead">Con tu nombre, tus productos y el problema central resuelto.</p>
        <p className={b(step, 2, "ps-lead")}>Y un <span className="ps-mint">código QR</span> para llevártela en el celular.</p>
      </div>
      <div className={`ps-fan${step >= 2 ? " open" : ""}`}>
        <div className="ps-frame ps-fan-back l"><div className="bar"><i /><i /><i /><b>Tu diagnóstico</b></div><img src="/pitch/shots/resultado.webp" alt="" /></div>
        <div className="ps-frame ps-fan-back r"><div className="bar"><i /><i /><i /><b>Radar IA</b></div><img src="/pitch/shots/hero.webp" alt="" /></div>
        <div className="ps-frame ps-fan-main">
          <div className="bar"><i /><i /><i /><b>panaderia-carlitos · página de muestra</b></div>
          <div className="view">
            
            <img className={step >= 1 ? "up" : ""} src="/pitch/shots/sitio.webp" alt="Página de muestra de Panadería Carlitos" />
            
            <img className={step >= 1 ? "in" : "below"} src="/pitch/shots/sitio_solucion.webp" alt="Registro digital de pedidos dentro de la página" />
          </div>
          <span className={`ps-cursor${step >= 1 ? " go" : ""}`} aria-hidden="true" />
          <span className={`ps-toast${step >= 1 ? " on" : ""}`}>✓ Pedido registrado · Pan de yuca × 12</span>
        </div>
      </div>
    </div>
  );
}

/* 11 · Paso 4: implementamos y tu equipo aprende */
function BuildViz({ id }: { id: string }) {
  if (id === "asistente") {
    return <div className="ps-viz ps-viz-mail"><i /><i /><i /><i /><b>✓ Resumen</b><b>✓ Pendientes</b><b className="go">✓ Respuesta lista</b></div>;
  }
  if (id === "flujos") {
    return <div className="ps-viz ps-viz-flow"><span>✉</span><span>▦</span><span className="end">🔔</span><em /></div>;
  }
  if (id === "limpios") {
    return <div className="ps-viz ps-viz-clean">{[" pan yuca", "PAN DE YUCA", "Pan de Yuca ", "pan-de-yuca"].map((m, i) => <span key={m} style={d(600 + i * 450)} data-clean="Pan de yuca ✓">{m}</span>)}</div>;
  }
  return <div className="ps-viz ps-viz-bars">{[42, 55, 50, 72, 92].map((h, i) => <span key={i} style={{ "--h": `${h}%`, "--d": `${300 + i * 120}ms` } as CSSProperties} />)}<b>+18%</b></div>;
}

export function SlideImplementa({ step }: ShowSlideProps) {
  const grouped = step >= 2;
  return (
    <div className="ps-wrap ps-impl">
      <Kicker>Paso 4</Kicker>
      <h2 className="ps-h2">
        <Slam text="Lo implementamos contigo" on />{" "}
        <span className="ps-h2-sub"><Slam text="y tu equipo aprende a usarla" on accent="y tu equipo aprende a usarla" delay={500} /></span>
      </h2>
      <div className={`ps-builds${grouped ? " grouped" : ""}`}>
        {BUILDS.map((build, i) => (
          <article key={build.id} className={b(step, 1, `ps-build g-${build.group}`)} style={d(i * 160)}>
            <div className="txt"><p className="k">{build.k}</p><h3>{build.title}</h3><p>{build.text}</p></div>
            {step >= 1 ? <BuildViz id={build.id} /> : null}
          </article>
        ))}
      </div>
      <div className={`ps-offers${grouped ? " on" : ""}`}>
        {pitchMentorshipOffers.map((offer, i) => (
          <article key={offer.title} className="ps-offer" style={d(i * 200)}>
            <p className="k">Mentoría {i + 1}</p>
            <h3>{offer.title}</h3>
            <p className="sub">{offer.subtitle}</p>
            <ul>
              {BUILDS.filter((build) => build.group === offer.icon).map((build) => <li key={build.id}>{build.title}</li>)}
              {offer.outcomes.slice(0, 2).map((outcome) => <li key={outcome} className="soft">{outcome}</li>)}
            </ul>
          </article>
        ))}
      </div>
      <div className={b(step, 3, "ps-topics")}>
        <p className="ps-fine">¿Tu reto no encaja? <strong>Cursos a la medida:</strong></p>
        <div className="ps-chips">{pitchCustomCourseTopics.map((topic, i) => <span key={topic.label} className="ps-chip ps-chip-sm on" style={d(i * 90)}>{topic.label}</span>)}</div>
      </div>
    </div>
  );
}

/* 12 · Paso 5: horas, calculadora en vivo */
const RECORDS: { key: OptionKey; label: string }[] = [
  { key: "A", label: "Cuaderno" },
  { key: "B", label: "Excel suelto" },
  { key: "C", label: "Un programa" },
  { key: "D", label: "Todo integrado" },
];
const PLAN_IDS: PlanId[] = ["arranque", "orden", "crecer"];
const SIZE_LIST: SizeId[] = ["micro", "pequena", "mediana", "grande"];

export function SlideHoras({ step }: ShowSlideProps) {
  const [plan, setPlan] = useState<PlanId>("arranque");
  const [size, setSize] = useState<SizeId>("micro");
  const [record, setRecord] = useState<OptionKey>("A");
  const effort = estimateEffort(plan, { size, choices: { "datos-registro": record } });
  const max = Math.max(...effort.phases.map((phase) => phase.hours));
  return (
    <div className="ps-wrap ps-hours">
      <Kicker>Paso 5 · Acompañamiento por horas</Kicker>
      <h2 className="ps-h2"><Slam text="Tú eliges hasta dónde llegar" on accent="dónde llegar" /></h2>
      <div className="ps-stairs">
        {PLAN_IDS.map((id, i) => (
          <button key={id} type="button" className={`ps-stair s${i}${plan === id ? " on" : ""}`} onClick={() => setPlan(id)} aria-pressed={plan === id}>
            <span className="k">{["Para empezar", "Para ordenar", "Para crecer"][i]}</span>
            <span className="name">{PLANS[id].name.replace("Plan ", "")}</span>
            <span className="promise">{PLANS[id].promise}</span>
          </button>
        ))}
      </div>
      <div className={b(step, 1, "ps-calc")}>
        <div className="ps-calc-inputs">
          <p className="ps-fine">Tamaño</p>
          <div className="ps-chips">{SIZE_LIST.map((id) => <button key={id} type="button" className={size === id ? "ps-chip ps-chip-sm on" : "ps-chip ps-chip-sm"} onClick={() => setSize(id)}>{SIZES[id].detail}</button>)}</div>
          <p className="ps-fine">¿Cómo registras hoy?</p>
          <div className="ps-chips">{RECORDS.map((r) => <button key={r.key} type="button" className={record === r.key ? "ps-chip ps-chip-sm on" : "ps-chip ps-chip-sm"} onClick={() => setRecord(r.key)}>{r.label}</button>)}</div>
        </div>
        <div className="ps-calc-out">
          <p className="ps-calc-num"><Counter value={effort.total} /><small>horas</small></p>
          <p className="ps-fine">Entre {effort.range[0]} y {effort.range[1]} h · unas {effort.weeks} semanas · {effort.visits} visitas a tu negocio</p>
          <ul className="ps-phases">
            {effort.phases.map((phase) => (
              <li key={phase.name}><span className="name">{phase.name}</span><span className="bar"><i style={{ width: `${(phase.hours / max) * 100}%` }} /></span><span className="h">{phase.hours} h</span></li>
            ))}
          </ul>
          <p className="ps-fine">Estimación del Radar IA; el número final sale del diagnóstico.</p>
        </div>
      </div>
    </div>
  );
}

/* 13 · En la feria */
export function SlideFeria({ step }: ShowSlideProps) {
  return (
    <div className="ps-wrap ps-fair">
      <Kicker>Solo en la feria</Kicker>
      <h2 className="ps-h2"><Slam text="Tu siguiente paso, hoy" on accent="hoy" /></h2>
      <div className="ps-fair-grid">
        <ol className="ps-fair-steps">
          {FAIR_STEPS.map((item, i) => (
            <li key={item.title} className={b(step, 1)} style={d(i * 180)}><span>0{i + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>
          ))}
        </ol>
        <div className={b(step, 1, "ps-clock")}>
          <svg viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="96" className="track" /><circle cx="110" cy="110" r="96" className="arc" pathLength={100} /></svg>
          <p className="ps-clock-num">12 h</p>
          <p className="ps-fine">ventana de condiciones de feria</p>
        </div>
      </div>
      <div className={b(step, 2, "ps-fair-offer")}>
        {["Visual Analytics Ejecutivo", "IA con Copilot", "Cursos a la medida", "Acompañamiento por horas"].map((item, i) => <span key={item} className="ps-pill" style={d(i * 120)}>{item}</span>)}
      </div>
    </div>
  );
}

/* 14 · Cierre */
export function SlideCierre({ step }: ShowSlideProps) {
  return (
    <div className="ps-close">
      <div className={`ps-close-mint${step === 0 ? " on" : ""}`} aria-hidden={step !== 0}>
        <Marquee text="VEN AL STAND" seconds={20} />
        <Marquee text="RADAR IA" reverse outline seconds={22} />
      </div>
      <div className={`ps-close-final${step >= 1 ? " on" : ""}`}>
        <div className="ps-close-text">
          <p className="ps-kicker on">Te esperamos en el stand</p>
          <h1 className="ps-h1"><Slam text="Cómo implementar la IA" on={step >= 1} /></h1>
          <h1 className="ps-h1 ps-mint"><Slam text="sin morir en el intento" on={step >= 1} delay={420} /></h1>
          <blockquote className={b(step, 1, "ps-close-quote")}>«{CLOSING_QUOTE.text}» <cite>— {CLOSING_QUOTE.author}</cite></blockquote>
          <div className={b(step, 2, "ps-close-actions")}>
            <Link className="ps-btn solid" href="/diagnostico">Hacer mi diagnóstico</Link>
            <Link className="ps-btn" href="/consultoria">Abrir el stand</Link>
          </div>
          <Lockup className="ps-close-lockup" />
        </div>
        <div className={b(step, 2, "ps-close-qr")}><Qr path="/diagnostico" caption={<strong>Escanea y empieza</strong>} /></div>
      </div>
    </div>
  );
}

export const SHOW_VIEWS = [
  SlideApertura, SlideVideo, SlideRealidad, SlideQueEs, SlideMorir, SlideRuta, SlideDatos,
  SlideDiagnostico, SlideAntesDespues, SlidePagina, SlideImplementa, SlideHoras, SlideFeria, SlideCierre,
] as const;
