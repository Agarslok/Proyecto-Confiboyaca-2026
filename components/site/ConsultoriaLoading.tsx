"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";

const DURATION_MS = 5600;
const ENTER_MS = 950;
const EXIT_MS = 800;
const LINES = [
  "Interpretando tu sector y actividad…",
  "Generando con inteligencia artificial…",
  "Contrastando prioridades del negocio…",
  "Sintetizando señales de consultoría…",
  "Preparando tu informe y la solución web…",
];

interface BirdPose {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity: number;
}

interface ConsultoriaLoadingProps {
  companyName: string;
  onComplete: () => void;
  note?: string;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function markCenter(): { x: number; y: number } {
  const el = document.querySelector(".colibri");
  if (!el) {
    return { x: window.innerWidth - 76, y: window.innerHeight - 76 };
  }
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function viewportCenter(): { x: number; y: number } {
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };
}

export function ConsultoriaLoading({ companyName, onComplete, note }: ConsultoriaLoadingProps) {
  useScrollLock(true);

  const [progress, setProgress] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [pose, setPose] = useState<BirdPose | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const mark = document.querySelector(".colibri");
    const start = markCenter();
    setPose({ x: start.x, y: start.y, scale: 1, rotate: 0, opacity: 1 });
    mark?.classList.add("is-hidden");
    return () => {
      mark?.classList.remove("is-hidden", "consultoria-bird-home");
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onCompleteRef.current();
      return;
    }

    const workEnd = DURATION_MS - EXIT_MS;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(pct);
      setLineIndex(Math.min(LINES.length - 1, Math.floor((elapsed / DURATION_MS) * LINES.length)));

      const center = viewportCenter();
      const home = markCenter();

      if (elapsed < ENTER_MS) {
        const t = easeInOut(elapsed / ENTER_MS);
        setPose({
          x: lerp(home.x, center.x, t),
          y: lerp(home.y, center.y, t),
          scale: lerp(1, 1.2, t),
          rotate: lerp(-8, 0, t),
          opacity: 1,
        });
      } else if (elapsed < workEnd) {
        const drift = elapsed - ENTER_MS;
        setPose({
          x: center.x + Math.sin(drift / 520) * 10,
          y: center.y + Math.cos(drift / 640) * 8,
          scale: 1.16 + Math.sin(drift / 380) * 0.04,
          rotate: Math.sin(drift / 700) * 5,
          opacity: 1,
        });
      } else if (elapsed < DURATION_MS) {
        const t = easeInOut((elapsed - workEnd) / EXIT_MS);
        setPose({
          x: lerp(center.x, home.x, t),
          y: lerp(center.y, home.y, t),
          scale: lerp(1.16, 1, t),
          rotate: lerp(0, 0, t),
          opacity: t < 0.92 ? 1 : lerp(1, 0, (t - 0.92) / 0.08),
        });
      }

      if (elapsed >= DURATION_MS) {
        const mark = document.querySelector(".colibri");
        mark?.classList.remove("is-hidden");
        mark?.classList.add("consultoria-bird-home");
        onCompleteRef.current();
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      {pose ? (
        <div
          className="consultoria-load-bird consultoria-load-bird--flight"
          aria-hidden="true"
          style={{
            left: pose.x,
            top: pose.y,
            transform: `translate(-50%, -50%) scale(${pose.scale}) rotate(${pose.rotate}deg)`,
            opacity: pose.opacity,
          }}
        >
          <img src="/colibri.webp" alt="" width={112} height={112} />
          <span className="consultoria-load-trail" />
        </div>
      ) : null}

      <section className="wrap consultoria-load" aria-live="polite" aria-busy="true">
        <div className="consultoria-load-stage">
          <div className="consultoria-load-card card">
            <p className="micro accent">Consultoría · simulación</p>
            <h1 className="consultoria-load-title">
              <span className="consultoria-report-kicker">Consultoría para</span>
              <span className="consultoria-report-name display">{companyName || "Tu empresa"}</span>
            </h1>
            <p className="consultoria-load-status">{LINES[lineIndex]}</p>
            <div
              className="consultoria-load-bar"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className="consultoria-load-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="fine consultoria-load-note">
              {note ?? "Proceso demostrativo: no se envían datos a servicios externos."}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
