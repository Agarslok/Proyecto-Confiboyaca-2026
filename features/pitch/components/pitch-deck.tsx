"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { TavusCviProvider } from "@/components/catch/TavusCviProvider";
import { pitchDeck } from "@/features/pitch/content/deck";
import { slideViews } from "@/features/pitch/components/slide-views";

function subscribeMotion(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function motionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function PitchDeck() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const nodeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const animations = useRef<Animation[]>([]);
  const generation = useRef(0);
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<number[]>(() => pitchDeck.map(() => 0));
  const [visible, setVisible] = useState<number[]>([0]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [visits, setVisits] = useState<number[]>(() => pitchDeck.map(() => 0));

  const slide = pitchDeck[index];
  const total = pitchDeck.length;

  function cancelMotion() {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    slideRefs.current.forEach((slideNode) => {
      if (!slideNode) return;
      slideNode.style.clipPath = "";
      slideNode.style.zIndex = "";
      const inner = slideNode.querySelector(".pd-inner");
      if (inner instanceof HTMLElement) {
        inner.style.transform = "";
        inner.style.filter = "";
      }
    });
    if (ringRef.current) ringRef.current.hidden = true;
  }

  function playTransition(from: number, to: number, back: boolean) {
    const token = generation.current;
    const stage = stageRef.current;
    const incoming = slideRefs.current[to];
    const outgoing = slideRefs.current[from];
    if (!stage || !incoming || !outgoing || reduced) {
      setVisible([to]);
      return;
    }

    const stageBox = stage.getBoundingClientRect();
    const node = nodeRefs.current[to]?.getBoundingClientRect();
    const x = node ? node.left + node.width / 2 - stageBox.left : stageBox.width / 2;
    const y = node ? node.top + node.height / 2 - stageBox.top : stageBox.height - 48;
    const radius = Math.hypot(Math.max(x, stageBox.width - x), Math.max(y, stageBox.height - y)) + 48;
    const closed = `circle(0px at ${x}px ${y}px)`;
    const opened = `circle(${radius}px at ${x}px ${y}px)`;
    const top = back ? outgoing : incoming;
    const bottom = back ? incoming : outgoing;
    const duration = 900;
    const easing = "cubic-bezier(.7,0,.2,1)";

    top.style.zIndex = "3";
    bottom.style.zIndex = "2";
    const reveal = top.animate(back ? [{ clipPath: opened }, { clipPath: closed }] : [{ clipPath: closed }, { clipPath: opened }], {
      duration,
      easing,
      fill: "both",
    });
    const inner = incoming.querySelector(".pd-inner");
    const depth = !back && inner instanceof HTMLElement
      ? inner.animate([{ transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: duration + 160, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" })
      : null;
    const bottomInner = bottom.querySelector(".pd-inner");
    const settle = bottomInner instanceof HTMLElement
      ? bottomInner.animate(
          [{ transform: "scale(1)", filter: "blur(0px)" }, { transform: back ? "scale(1)" : "scale(0.96)", filter: "blur(5px)" }],
          { duration, easing, fill: "both" },
        )
      : null;
    const ring = ringRef.current;
    let ringAnimation: Animation | null = null;
    if (ring) {
      ring.hidden = false;
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ringAnimation = ring.animate(
        back
          ? [{ transform: `scale(${radius / 90})`, opacity: 0 }, { transform: "scale(0.2)", opacity: 0.8 }]
          : [{ transform: "scale(0.2)", opacity: 0.8 }, { transform: `scale(${radius / 90})`, opacity: 0 }],
        { duration, easing, fill: "both" },
      );
    }
    animations.current = [reveal, depth, settle, ringAnimation].filter((item): item is Animation => item !== null);
    let settled = false;

    const finish = () => {
      if (settled || token !== generation.current) return;
      settled = true;
      top.style.clipPath = "";
      top.style.zIndex = "";
      bottom.style.zIndex = "";
      if (inner instanceof HTMLElement) inner.style.transform = "";
      if (bottomInner instanceof HTMLElement) {
        bottomInner.style.transform = "";
        bottomInner.style.filter = "";
      }
      if (ring) ring.hidden = true;
      animations.current = [];
      setVisible([to]);
    };
    reveal.onfinish = finish;
    reveal.oncancel = () => {
      if (token === generation.current) finish();
    };
  }

  function go(to: number, back?: boolean) {
    if (to < 0 || to >= total || to === index) return;
    const isBack = back ?? to < index;
    generation.current += 1;
    cancelMotion();
    setSteps((current) => {
      const nextSteps = [...current];
      nextSteps[to] = isBack ? pitchDeck[to].beats : 0;
      return nextSteps;
    });
    setVisits((current) => current.map((value, item) => (item === to ? value + 1 : value)));
    setIndex(to);
    setVisible([index, to]);
    const from = index;
    const token = generation.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== generation.current) return;
        playTransition(from, to, isBack);
      });
    });
  }

  function next() {
    cancelMotion();
    if (steps[index] < slide.beats) {
      setSteps((current) => current.map((value, item) => (item === index ? value + 1 : value)));
      return;
    }
    if (index < total - 1) go(index + 1, false);
  }

  function prev() {
    cancelMotion();
    if (steps[index] > 0) {
      setSteps((current) => current.map((value, item) => (item === index ? value - 1 : value)));
      return;
    }
    if (index > 0) go(index - 1, true);
  }

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key;
      if (notesOpen && key === "Escape") {
        event.preventDefault();
        setNotesOpen(false);
        return;
      }
      if (key === "Escape" && document.fullscreenElement) {
        event.preventDefault();
        void document.exitFullscreen();
        return;
      }
      if ((key === " " || key === "Enter") && event.target instanceof HTMLElement && event.target.closest("button, a")) return;
      if (key === "ArrowRight" || key === "ArrowDown" || key === " " || key === "PageDown") {
        event.preventDefault();
        next();
      } else if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp") {
        event.preventDefault();
        prev();
      } else if (key === "n" || key === "N") {
        event.preventDefault();
        setNotesOpen((open) => !open);
      } else if (key === "f" || key === "F") {
        event.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function toggleFullscreen() {
    const node = rootRef.current;
    if (!node) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (node.requestFullscreen) void node.requestFullscreen();
  }

  function onStageClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("a, button, input, textarea, select, .pd-avatar-live, .pd-avatar-side")) return;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    if ((event.clientX - bounds.left) / bounds.width < 0.22) prev();
    else next();
  }

  const progress = total === 1 ? 1 : index / (total - 1);

  return (
    <TavusCviProvider canStartTavus detached>
    <div className="pd-root" ref={rootRef} tabIndex={-1}>
      <div className="pd-stage" ref={stageRef} onClick={onStageClick}>
        {pitchDeck.map((item, itemIndex) => {
          const View = slideViews[itemIndex];
          const active = itemIndex === index;
          const retainAvatar = item.id === "avatar" && visits[itemIndex] > 0;
          if (!visible.includes(itemIndex) && !retainAvatar) return null;
          const parked = retainAvatar && !visible.includes(itemIndex);
          return (
            <section
              key={item.id === "avatar" ? item.id : `${item.id}-${visits[itemIndex]}`}
              ref={(node) => { slideRefs.current[itemIndex] = node; }}
              className={active ? "pd-slide is-on" : parked ? "pd-slide pd-slide-parked" : "pd-slide"}
              aria-hidden={!active}
              aria-labelledby={active ? "pd-slide-title" : undefined}
              inert={parked}
            >
              <View step={steps[itemIndex] ?? 0} />
            </section>
          );
        })}
        <div className="pd-ring" ref={ringRef} hidden aria-hidden="true" />
      </div>

      <footer className="pd-hud">
        <div className="pd-hud-meta">
          <p className="pd-hud-count">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true"> / {String(total).padStart(2, "0")}</span>
            <span className="pd-sr">Diapositiva {index + 1} de {total}</span>
          </p>
          <p className="pd-hud-label" id="pd-slide-title">{slide.label}</p>
        </div>
        <div className="pd-track" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
          <div className="pd-nodes">
            {pitchDeck.map((item, itemIndex) => {
              const state = itemIndex === index ? "is-current" : itemIndex < index ? "is-done" : "";
              return (
                <button
                  key={item.id}
                  ref={(node) => { nodeRefs.current[itemIndex] = node; }}
                  type="button"
                  className={`pd-node-btn ${state}`}
                  aria-current={itemIndex === index ? "step" : undefined}
                  aria-label={`${itemIndex + 1}. ${item.label}${itemIndex < index ? ", vista" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    go(itemIndex);
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="pd-hud-actions">
          <button type="button" onClick={prev} disabled={index === 0 && steps[index] === 0}>Anterior</button>
          <button type="button" onClick={next} disabled={index === total - 1 && steps[index] >= slide.beats}>Siguiente</button>
          <button type="button" aria-pressed={notesOpen} onClick={() => setNotesOpen((open) => !open)}>Notas</button>
          <button type="button" onClick={toggleFullscreen}>Pantalla</button>
          <Link href="/">Salir</Link>
        </div>
      </footer>
      <p className="pd-hint">Flechas para avanzar · N notas · F pantalla completa</p>
      {notesOpen ? (
        <aside className="pd-notes" aria-label="Notas del presentador">
          <p><b>Diapositiva {index + 1}. {slide.label}</b></p>
          <p>{slide.notes}</p>
        </aside>
      ) : null}
    </div>
    </TavusCviProvider>
  );
}
