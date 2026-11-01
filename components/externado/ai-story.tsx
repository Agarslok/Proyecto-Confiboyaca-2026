"use client";

import { useEffect, useRef, useState } from "react";

const NET = { layers: [4, 5, 3, 1], w: 520, h: 380 };
const INPUTS = ["Día de la semana", "Promociones", "Clima", "Ventas pasadas"];
const STORY = [
  {
    k: "datos",
    title: "Todo empieza con datos",
    text: "Ventas, inventario, mensajes de clientes. Tu empresa ya produce información todos los días, aunque esté en cuadernos u hojas de cálculo.",
    tip: "Estas son las entradas: lo que la IA observa.",
  },
  {
    k: "aprende",
    title: "La IA aprende de ejemplos",
    text: "Como un empleado nuevo que aprende viendo casos, la IA revisa muchos ejemplos del pasado y nota qué suele repetirse.",
    tip: "Las líneas son conexiones. Se refuerzan con cada ejemplo.",
  },
  {
    k: "patrones",
    title: "Encuentra patrones",
    text: "Cada círculo combina señales. Algunas pesan más que otras: por ejemplo, que los viernes se venda más pan que los martes.",
    tip: "Las líneas gruesas son las señales que más pesan.",
  },
  {
    k: "sugiere",
    title: "Te da una recomendación",
    text: 'Al final entrega una respuesta concreta y fácil de usar, como "conviene pedir más harina para el viernes".',
    tip: "La salida: una sugerencia, no una orden.",
  },
  {
    k: "prueba",
    title: "Pruébalo tú",
    text: "Activa o desactiva las señales y mira cómo cambia la predicción de ventas. Así decide una red neuronal: suma señales con distinto peso.",
    tip: "",
  },
];
const WEIGHTS = { viernes: 2, promo: 1.5, lluvia: -1.2, historial: 0.6 };

type Signals = { viernes: boolean; promo: boolean; lluvia: boolean; historial: boolean };

/** Suma de señales con su peso: lo mismo que hace la red, en una línea. */
function predict(signals: Signals): { score: number; level: "Altas" | "Normales" | "Bajas" } {
  const score =
    WEIGHTS.historial * (signals.historial ? 1 : 0) +
    (signals.viernes ? WEIGHTS.viernes : 0) +
    (signals.promo ? WEIGHTS.promo : 0) +
    (signals.lluvia ? WEIGHTS.lluvia : 0);
  return { score, level: score >= 2.2 ? "Altas" : score >= 0.8 ? "Normales" : "Bajas" };
}

function netLayout() {
  const { layers, w, h } = NET;
  const xs = layers.map((_, i) => 160 + i * ((w - 160) / (layers.length - 1)));
  return layers.map((n, li) =>
    Array.from({ length: n }, (_, k) => ({
      x: xs[li],
      y: n === 1 ? h / 2 : 40 + k * ((h - 80) / (n - 1)),
    })),
  );
}

const NODES = netLayout();
const EDGES = (() => {
  const out: { l: number; i: number; j: number; a: { x: number; y: number }; b: { x: number; y: number }; w: number }[] = [];
  for (let l = 0; l < NODES.length - 1; l++) {
    NODES[l].forEach((a, i) =>
      NODES[l + 1].forEach((b, j) => {
        const weight = Math.abs(Math.sin((l + 1) * 12.9898 + i * 78.233 + j * 37.719));
        out.push({ l, i, j, a, b, w: weight });
      }),
    );
  }
  return out;
})();

function NeuralNet({ step, signals }: { step: number; signals: Signals }) {
  const k = STORY[step].k;
  const play = k === "prueba";
  const activeInputs = play
    ? [signals.viernes, signals.promo, signals.lluvia, signals.historial]
    : [true, true, true, true];
  const { level } = predict(signals);
  const lit = (layer: number) => {
    if (k === "datos") return layer === 0;
    if (k === "aprende") return layer <= 1;
    if (k === "patrones") return layer <= 2;
    return true;
  };
  const edgeOn = (e: { l: number; i: number }) => {
    if (k === "datos") return false;
    if (k === "aprende") return e.l === 0;
    if (k === "patrones") return e.l <= 1;
    if (play) return e.l > 0 || activeInputs[e.i];
    return true;
  };
  const strong = (e: { w: number }) => (k === "patrones" || k === "sugiere" || play) && e.w > 0.62;

  return (
    <svg
      viewBox={`0 0 ${NET.w + 215} ${NET.h}`}
      className={`net step-${k}`}
      role="img"
      aria-label={
        play
          ? `Red neuronal de ejemplo. Predicción: ventas ${level.toLowerCase()}.`
          : `Red neuronal de ejemplo, paso: ${STORY[step].title}.`
      }
    >
      <g className="edges">
        {EDGES.map((e, n) => (
          <line
            key={n}
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            className={`edge${edgeOn(e) ? " on" : ""}${strong(e) ? " strong" : ""}`}
            style={{ animationDelay: `${(n % 9) * -0.17}s` }}
          />
        ))}
      </g>
      {NODES.map((layer, li) =>
        layer.map((p, ni) => {
          const on = lit(li) && (li !== 0 || activeInputs[ni]);
          return (
            <circle
              key={`${li}-${ni}`}
              cx={p.x}
              cy={p.y}
              r={li === NODES.length - 1 ? 22 : 13}
              className={`node l${li}${on ? " on" : ""}`}
              style={{ transitionDelay: `${li * 0.09}s` }}
            />
          );
        }),
      )}
      {NODES[0].map((p, i) => (
        <text
          key={`t${i}`}
          x={p.x - 24}
          y={p.y + 4}
          textAnchor="end"
          className={`net-label${activeInputs[i] ? " on" : ""}`}
        >
          {INPUTS[i]}
        </text>
      ))}
      <g className={`out${k === "sugiere" || play ? " show" : ""}`}>
        <text x={NODES[3][0].x + 36} y={NODES[3][0].y - 6} className="net-out-k">Resultado</text>
        <text x={NODES[3][0].x + 36} y={NODES[3][0].y + 16} className="net-out">
          {play ? `Ventas ${level.toLowerCase()}` : "Pedir más harina"}
        </text>
        {!play ? (
          <text x={NODES[3][0].x + 36} y={NODES[3][0].y + 36} className="net-out-s">para el viernes</text>
        ) : null}
      </g>
      <text x={NODES[1][0].x} y={NET.h - 6} textAnchor="middle" className="net-cap">
        Entradas → capas ocultas → salida
      </text>
    </svg>
  );
}

function reduceMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AIStory() {
  const [step, setStep] = useState(0);
  const [signals, setSignals] = useState<Signals>({
    viernes: true,
    promo: false,
    lluvia: false,
    historial: true,
  });
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const prediction = predict(signals);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.i));
        });
      },
      { rootMargin: "-52% 0px -38% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggles: [keyof Signals, string][] = [
    ["viernes", "Es viernes"],
    ["promo", "Hay promoción"],
    ["lluvia", "Está lloviendo"],
    ["historial", "Hay historial de ventas"],
  ];

  return (
    <div className="story">
      <div className="story-stage">
        <div className="stage-card">
          <div className="stage-top">
            <span className="tag">Lee el ejemplo · panadería</span>
            <ol className="stage-dots" aria-label="Pasos de la explicación">
              {STORY.map((s, i) => (
                <li key={s.k}>
                  <button
                    type="button"
                    className={`dot${i === step ? " on" : ""}`}
                    aria-label={`Paso ${i + 1}: ${s.title}`}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() =>
                      stepRefs.current[i]?.scrollIntoView({
                        behavior: reduceMotion() ? "auto" : "smooth",
                        block: "center",
                      })
                    }
                  />
                </li>
              ))}
            </ol>
          </div>
          <div className="stage-progress" aria-hidden="true">
            <span style={{ width: `${((step + 1) / STORY.length) * 100}%` }} />
          </div>
          <NeuralNet step={step} signals={signals} />
          {STORY[step].k === "prueba" ? (
            <div className="stage-play">
              <div className="toggles" role="group" aria-label="Señales de entrada">
                {toggles.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`toggle${signals[key] ? " on" : ""}`}
                    aria-pressed={signals[key]}
                    onClick={() => setSignals((prev) => ({ ...prev, [key]: !prev[key] }))}
                  >
                    <span className="sw" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="stage-meter" aria-live="polite">
                <span>Ventas previstas: <strong>{prediction.level.toLowerCase()}</strong></span>
                <span className="stage-meter-bar"><span style={{ width: `${Math.max(6, Math.min(100, ((prediction.score + 1.2) / 5.3) * 100))}%` }} /></span>
              </div>
            </div>
          ) : (
            <p className="stage-tip" aria-live="polite">{STORY[step].tip || "La IA sugiere; las personas deciden."}</p>
          )}
        </div>
      </div>
      <div className="story-steps">
        {STORY.map((s, i) => (
          <article
            key={s.k}
            data-i={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className={`story-step${i === step ? " on" : ""}`}
          >
            <p className="story-n">{String(i + 1).padStart(2, "0")}</p>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {s.k === "prueba" ? <p className="story-hint">Use los interruptores de la tarjeta.</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
