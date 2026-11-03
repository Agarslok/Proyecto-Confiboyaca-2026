"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import type { ShowSlide } from "./deck";
import type { DeckControls, ShowSlideProps } from "./slides";

/* ============================================================================
   Motor del pitch. Teclas (también sirven los controles de presentación):
     → ↓ Espacio AvPág   siguiente paso      ← ↑ RePág   paso anterior
     N notas y reloj     F pantalla completa   H suma una mano   T con/sin IA
   En la diapositiva del video, Espacio pausa o reanuda.
   ========================================================================== */

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown", " "]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp"]);
const LEAVE_MS = 950;

function mmss(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export interface ShowDeckProps {
  slides: ShowSlide[];
  views: readonly ComponentType<ShowSlideProps>[];
  /** Enlaces discretos a las otras versiones del pitch. */
  versions: { href: string; label: string }[];
}

export function ShowDeck({ slides, views, versions }: ShowDeckProps) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState<{ index: number; back: boolean } | null>(null);
  const [notes, setNotes] = useState(false);
  const [hands, setHands] = useState(0);
  const [withAI, setWithAI] = useState(false);
  const [clock, setClock] = useState({ start: 0, now: 0 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const registerVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
  }, []);
  /* Copia de la posición para los manejadores de teclado (se actualiza tras cada render). */
  const state = useRef({ index, step });
  useEffect(() => {
    state.current = { index, step };
  });

  const slide = slides[index];
  const totalMinutes = slides.reduce((sum, s) => sum + s.minutes, 0);

  const go = useCallback(
    (to: number, back: boolean) => {
      const from = state.current.index;
      if (to < 0 || to >= slides.length || to === from) return;
      setLeaving({ index: from, back });
      setIndex(to);
      const nextStep = back ? slides[to].beats : 0;
      setStep(nextStep);
      if (slides[to].id === "antes-despues") setWithAI(nextStep >= 1);
    },
    [slides],
  );

  const move = useCallback(
    (delta: 1 | -1) => {
      setClock((c) => (c.start ? c : { start: Date.now(), now: Date.now() }));
      const { index: i, step: s } = state.current;
      const next = s + delta;
      if (next >= 0 && next <= slides[i].beats) {
        setStep(next);
        if (slides[i].id === "antes-despues") setWithAI(next >= 1);
        return;
      }
      go(i + delta, delta < 0);
    },
    [go, slides],
  );

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    if (!notes || !clock.start) return;
    const timer = window.setInterval(() => setClock((c) => ({ ...c, now: Date.now() })), 1000);
    return () => window.clearInterval(timer);
  }, [notes, clock.start]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const onButton = Boolean(target?.closest("button, a"));
      const key = event.key;
      const current = slides[state.current.index].id;

      if (key === " " && current === "video") {
        event.preventDefault();
        const video = videoRef.current;
        if (video) void (video.paused ? video.play() : video.pause());
        return;
      }
      if ((key === " " || key === "Enter") && onButton) return;
      if (NEXT_KEYS.has(key)) { event.preventDefault(); move(1); return; }
      if (PREV_KEYS.has(key)) { event.preventDefault(); move(-1); return; }
      const lower = key.toLowerCase();
      if (lower === "n") setNotes((v) => !v);
      else if (lower === "f") void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
      else if (lower === "h" || key === "+") setHands((h) => h + 1);
      else if (key === "-") setHands((h) => Math.max(0, h - 1));
      else if (lower === "t" && current === "antes-despues") setWithAI((v) => !v);
      else if (key === "Home") go(0, true);
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [move, go, slides]);

  const deck: DeckControls = {
    hands,
    addHand: (delta) => setHands((h) => Math.max(0, h + delta)),
    withAI,
    setWithAI,
    registerVideo,
  };

  const units = slides.reduce((sum, s) => sum + s.beats + 1, 0);
  const done = slides.slice(0, index).reduce((sum, s) => sum + s.beats + 1, 0) + step + 1;
  const elapsed = clock.start ? (clock.now - clock.start) / 1000 : 0;
  const planned = slides.slice(0, index).reduce((sum, s) => sum + s.minutes, 0) * 60;

  return (
    <div className={`ps-root${slide.id === "video" ? " is-cinema" : ""}`} role="application" aria-roledescription="presentación" aria-label="Pitch: cómo implementar la IA sin morir en el intento">
      <div className="ps-bg" aria-hidden="true"><span /><span /><span /></div>
      <div className="ps-progress" aria-hidden="true"><i style={{ width: `${(done / units) * 100}%` }} /></div>
      <p className="ps-sr" aria-live="polite">{`Diapositiva ${index + 1} de ${slides.length}: ${slide.label}`}</p>

      <div className="ps-stage">
        {slides.map((item, i) => {
          const isActive = i === index;
          const isLeaving = leaving?.index === i;
          if (!isActive && !isLeaving) return null;
          const View = views[i];
          const enter = leaving && isActive ? (leaving.back ? "ps-in-back" : `ps-in-${item.transition}`) : "";
          return (
            <section key={item.id} className={`ps-slide ps-slide-${item.id}${isActive ? " is-active" : " is-leaving"} ${enter}`.trim()} aria-hidden={!isActive} inert={!isActive}>
              <View step={isActive ? step : item.beats} active={isActive} deck={deck} />
            </section>
          );
        })}
      </div>

      <nav className="ps-dots" aria-label="Diapositivas">
        {slides.map((item, i) => (
          <button key={item.id} type="button" className={i === index ? "on" : i < index ? "done" : ""} onClick={() => go(i, i < index)} aria-label={item.label} title={item.label} />
        ))}
      </nav>

      {notes ? (
        <aside className="ps-notes" aria-label="Notas del presentador">
          <p className="ps-notes-time">
            <strong>{mmss(elapsed)}</strong> transcurrido · plan {mmss(planned)} de {Math.round(totalMinutes)} min
          </p>
          <p className="ps-notes-title">{index + 1}. {slide.label} <small>paso {step + 1}/{slide.beats + 1} · ~{slide.minutes} min</small></p>
          <p>{slide.notes}</p>
          {slides[index + 1] ? <p className="ps-notes-next">Sigue: {slides[index + 1].label}</p> : null}
          <p className="ps-notes-keys">→ siguiente · ← atrás · F pantalla completa · H mano · T con/sin IA · N ocultar</p>
        </aside>
      ) : null}

      {/* Enlaces normales (carga completa): así también funcionan en la copia exportada para revisar. */}
      <nav className="ps-classic" aria-label="Otras versiones">
        {versions.map((version) => <a key={version.href} href={version.href}>{version.label}</a>)}
      </nav>
    </div>
  );
}
