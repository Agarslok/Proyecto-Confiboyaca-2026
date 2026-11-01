"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { pitchDeck } from "@/features/pitch/content/deck";
import { slideViews } from "@/features/pitch/components/slide-views";

const NAV_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
]);

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

type DeckState = {
  index: number;
  steps: number[];
};

export function PitchDeck() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const nodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const animations = useRef<Animation[]>([]);
  const generation = useRef(0);
  const deckRef = useRef<DeckState>({ index: 0, steps: pitchDeck.map(() => 0) });

  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<number[]>(() => pitchDeck.map(() => 0));
  const [visible, setVisible] = useState<number[]>([0]);
  const [visits, setVisits] = useState<number[]>(() => pitchDeck.map(() => 0));

  deckRef.current = { index, steps };

  const slide = pitchDeck[index];
  const total = pitchDeck.length;
  const isVideoSlide = slide.id === "video";

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
    const incoming = slideRefs.current[to];
    const outgoing = slideRefs.current[from];
    if (!incoming || !outgoing || reduced) {
      setVisible([to]);
      return;
    }

    const duration = 720;
    const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

    incoming.style.zIndex = "3";
    outgoing.style.zIndex = "2";
    incoming.style.opacity = "0";

    const fadeIn = incoming.animate(
      [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration, easing, fill: "both" },
    );
    const fadeOut = outgoing.animate([{ opacity: 1 }, { opacity: 0.35 }], {
      duration: duration + 120,
      easing,
      fill: "both",
    });

    animations.current = [fadeIn, fadeOut];
    let settled = false;

    const finish = () => {
      if (settled || token !== generation.current) return;
      settled = true;
      incoming.style.zIndex = "";
      incoming.style.opacity = "";
      incoming.style.transform = "";
      outgoing.style.zIndex = "";
      outgoing.style.opacity = "";
      outgoing.style.filter = "";
      if (ringRef.current) ringRef.current.hidden = true;
      animations.current = [];
      setVisible([to]);
    };
    fadeIn.onfinish = finish;
    fadeIn.oncancel = () => {
      if (token === generation.current) finish();
    };
  }

  const go = useCallback(
    (to: number, back?: boolean) => {
      const { index: fromIndex } = deckRef.current;
      if (to < 0 || to >= total || to === fromIndex) return;
      const isBack = back ?? to < fromIndex;
      generation.current += 1;
      cancelMotion();
      setSteps((current) => {
        const nextSteps = [...current];
        nextSteps[to] = isBack ? pitchDeck[to].beats : 0;
        return nextSteps;
      });
      setVisits((current) => current.map((value, item) => (item === to ? value + 1 : value)));
      setIndex(to);
      setVisible([fromIndex, to]);
      const token = generation.current;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (token !== generation.current) return;
          playTransition(fromIndex, to, isBack);
        });
      });
    },
    [total, reduced],
  );

  const next = useCallback(() => {
    const { index: i, steps: s } = deckRef.current;
    const currentSlide = pitchDeck[i];
    cancelMotion();
    if (s[i] < currentSlide.beats) {
      setSteps((current) => current.map((value, item) => (item === i ? value + 1 : value)));
      return;
    }
    if (i < total - 1) go(i + 1, false);
  }, [go, total]);

  const prev = useCallback(() => {
    const { index: i, steps: s } = deckRef.current;
    cancelMotion();
    if (s[i] > 0) {
      setSteps((current) => current.map((value, item) => (item === i ? value - 1 : value)));
      return;
    }
    if (i > 0) go(i - 1, true);
  }, [go]);

  const toggleVideoPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }, []);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, [index, steps]);

  useEffect(() => {
    if (!isVideoSlide && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isVideoSlide]);

  useEffect(() => {
    const nextFn = next;
    const prevFn = prev;
    const toggleVideo = toggleVideoPlayback;

    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key;
      const { index: i } = deckRef.current;

      if (key === "Escape" && document.fullscreenElement) {
        event.preventDefault();
        void document.exitFullscreen();
        return;
      }

      if (pitchDeck[i]?.id === "video" && key === " ") {
        event.preventDefault();
        toggleVideo();
        return;
      }

      const isNav = NAV_KEYS.has(key);
      if (!isNav) return;

      event.preventDefault();
      event.stopPropagation();

      if (key === "ArrowRight" || key === "ArrowDown" || key === "PageDown") {
        nextFn();
      } else {
        prevFn();
      }
    }

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [next, prev, toggleVideoPlayback]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const blockScroll = (event: Event) => {
      const scrollHost = root.querySelector(".pd-inner.pd-story.pd-story--compact");
      if (scrollHost instanceof HTMLElement && scrollHost.scrollHeight > scrollHost.clientHeight + 8) {
        if (event.target instanceof Node && scrollHost.contains(event.target)) {
          const wheel = event as WheelEvent;
          const down = wheel.deltaY > 0;
          const atTop = scrollHost.scrollTop <= 0;
          const atBottom = scrollHost.scrollTop + scrollHost.clientHeight >= scrollHost.scrollHeight - 2;
          if ((down && !atBottom) || (!down && !atTop)) return;
        }
      }
      event.preventDefault();
    };
    root.addEventListener("wheel", blockScroll, { passive: false });
    root.addEventListener("touchmove", blockScroll, { passive: false });
    return () => {
      root.removeEventListener("wheel", blockScroll);
      root.removeEventListener("touchmove", blockScroll);
    };
  }, []);

  const progressUnits = pitchDeck.reduce((sum, item) => sum + Math.max(1, item.beats + 1), 0);
  let progressDone = 0;
  for (let i = 0; i < index; i++) progressDone += Math.max(1, pitchDeck[i].beats + 1);
  progressDone += (steps[index] + 1) / Math.max(1, pitchDeck[index].beats + 1);
  const progress = progressUnits ? progressDone / progressUnits : 1;

  return (
    <div
      className={`pd-root${isVideoSlide ? " pd-root--cinema" : ""}`}
      ref={rootRef}
      tabIndex={0}
      role="application"
      aria-label="Presentación del pitch. Use las flechas para avanzar."
    >
      <div className="pd-top-progress" aria-hidden="true">
        <span className="pd-top-progress-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        {pitchDeck.map((item, itemIndex) => (
          <span
            key={item.id}
            ref={(node) => {
              nodeRefs.current[itemIndex] = node;
            }}
            className="pd-top-progress-node"
            style={{ left: total <= 1 ? "50%" : `${(itemIndex / (total - 1)) * 100}%` }}
          />
        ))}
      </div>
      <p className="pd-sr" id="pd-slide-title">
        {slide.label}
      </p>
      <div className="pd-stage" ref={stageRef}>
        {pitchDeck.map((item, itemIndex) => {
          const View = slideViews[itemIndex];
          const active = itemIndex === index;
          const retainVideo = item.id === "video" && visits[itemIndex] > 0;
          if (!visible.includes(itemIndex) && !retainVideo) return null;
          const parked = retainVideo && !visible.includes(itemIndex);
          return (
            <section
              key={item.id === "video" ? item.id : `${item.id}-${visits[itemIndex]}`}
              ref={(node) => {
                slideRefs.current[itemIndex] = node;
              }}
              className={active ? "pd-slide is-on" : parked ? "pd-slide pd-slide-parked" : "pd-slide"}
              aria-hidden={!active}
              aria-labelledby={active ? "pd-slide-title" : undefined}
              inert={parked}
            >
              <View
                step={steps[itemIndex] ?? 0}
                videoRef={item.id === "video" ? videoRef : undefined}
                videoActive={item.id === "video" && active && !parked}
              />
            </section>
          );
        })}
        <div className="pd-ring" ref={ringRef} hidden aria-hidden="true" />
      </div>

      <Link href="/" className="pd-back-fab" aria-label="Volver a elegir Pitch o Stand">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M14.5 5.5 8 12l6.5 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}
