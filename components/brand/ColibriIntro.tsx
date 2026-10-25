"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const BIRD = 380;
const INTRO_MS = 2600;
const REVEAL_AT = 0.58;
const REVEAL_MS = 780;
const SRC = "/colibri.webp";

interface ColibriIntroProps {
  shellRef: RefObject<HTMLDivElement | null>;
  markRef: RefObject<HTMLButtonElement | null>;
  onDone: () => void;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadImage(src: string, timeout = 900): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    image.onload = () => done(true);
    image.onerror = () => done(false);
    window.setTimeout(() => done(false), timeout);
    image.src = src;
  });
}

function keyframe(
  x: number,
  y: number,
  scale: number,
  rotation: number,
  opacity: number,
  offset: number,
  easing?: string,
): Keyframe {
  return {
    transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale.toFixed(3)})`,
    opacity,
    offset,
    easing,
  };
}

function flightFrames(width: number, height: number, target: DOMRect | null, imageOk: boolean) {
  const centerX = width / 2;
  const centerY = height * 0.46;
  const radius = Math.min(width, height) * 0.17;
  const near = Math.min(1, (Math.min(width, height) * 0.58) / BIRD);
  const land = target ? target.width / BIRD : 0.5;
  const targetX = target ? target.left + target.width / 2 : width - 76;
  const targetY = target ? target.top + target.height / 2 : height - 76;
  return {
    center: [centerX, centerY] as const,
    frames: [
      keyframe(-0.1 * width, height * 0.86, near * 0.18, -16, 0, 0, "cubic-bezier(.3,0,.25,1)"),
      keyframe(0.24 * width, height * 0.64, near * 0.42, -9, 1, 0.17, "cubic-bezier(.45,0,.2,1)"),
      keyframe(centerX, centerY, near, 0, 1, 0.38, "ease-in-out"),
      keyframe(centerX, centerY - 6, near * 0.94, 2, 1, 0.47, "cubic-bezier(.45,0,.55,1)"),
      keyframe(centerX + radius, centerY - radius * 0.3, near * 0.62, 16, 1, 0.58, "linear"),
      keyframe(centerX, centerY - radius, near * 0.5, 0, 1, 0.67, "linear"),
      keyframe(centerX - radius, centerY - radius * 0.3, near * 0.5, -16, 1, 0.76, "linear"),
      keyframe(centerX, centerY + radius * 0.3, near * 0.52, 0, 1, 0.84, "cubic-bezier(.5,0,.2,1)"),
      imageOk
        ? keyframe(targetX, targetY, land, 0, 0.38, 1)
        : keyframe(targetX, targetY, land * 0.4, 0, 0, 1),
    ],
  };
}

function BirdBody({ imageOk }: { imageOk: boolean }) {
  if (!imageOk) return <span className="bird-orb" />;
  return (
    // The flight moves this element with the Web Animations API.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={SRC} alt="" width={BIRD} height={BIRD} decoding="async" />
  );
}

export function ColibriIntro({ shellRef, markRef, onDone }: ColibriIntroProps) {
  const birdRef = useRef<HTMLDivElement>(null);
  const ghostOne = useRef<HTMLDivElement>(null);
  const ghostTwo = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  const finishRef = useRef<() => void>(() => onDone());
  const [imageOk, setImageOk] = useState(false);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const animations: Animation[] = [];
    done.current = false;

    const finish = () => {
      if (cancelled || done.current) return;
      done.current = true;
      animations.forEach((animation) => {
        try {
          animation.cancel();
        } catch {
          /* La animación ya terminó. */
        }
      });
      if (shellRef.current) shellRef.current.style.clipPath = "";
      onDone();
    };
    finishRef.current = finish;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);

    const shell = shellRef.current;
    const bird = birdRef.current;
    if (!shell || !bird || typeof bird.animate !== "function") {
      finish();
      return () => window.removeEventListener("keydown", onKey);
    }

    if (prefersReducedMotion()) {
      shell.style.clipPath = "";
      const fade = backgroundRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        fill: "forwards",
      });
      if (!fade) {
        finish();
      } else {
        animations.push(fade);
        fade.onfinish = finish;
      }
      return () => {
        cancelled = true;
        window.removeEventListener("keydown", onKey);
        animations.forEach((animation) => animation.cancel());
      };
    }

    const play = (ok: boolean) => {
      if (cancelled || done.current) return;
      setFlying(true);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const target = markRef.current?.getBoundingClientRect() ?? null;
      const { center, frames } = flightFrames(width, height, target, ok);
      const [centerX, centerY] = center;
      const reach = Math.hypot(Math.max(centerX, width - centerX), Math.max(centerY, height - centerY)) + 24;
      const flight = bird.animate(frames, { duration: INTRO_MS, fill: "forwards" });
      animations.push(flight);
      [ghostOne, ghostTwo].forEach((ghost, index) => {
        const node = ghost.current;
        if (!node) return;
        const fade = [0.22, 0.1][index];
        const ghostFrames = frames.map((item, frameIndex) => ({
          ...item,
          opacity: frameIndex === frames.length - 1 ? 0 : Number(item.opacity ?? 1) * fade,
        }));
        animations.push(
          node.animate(ghostFrames, { duration: INTRO_MS, delay: 55 * (index + 1), fill: "forwards" }),
        );
      });
      if (barRef.current) {
        animations.push(
          barRef.current.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
            duration: INTRO_MS,
            easing: "linear",
            fill: "forwards",
          }),
        );
      }
      animations.push(
        shell.animate(
          [
            { clipPath: `circle(0px at ${centerX}px ${centerY}px)` },
            { clipPath: `circle(${reach}px at ${centerX}px ${centerY}px)` },
          ],
          { duration: REVEAL_MS, delay: INTRO_MS * REVEAL_AT, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" },
        ),
      );
      if (chromeRef.current) {
        animations.push(
          chromeRef.current.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 260,
            delay: INTRO_MS * REVEAL_AT + REVEAL_MS * 0.5,
            fill: "forwards",
          }),
        );
      }
      flight.onfinish = finish;
    };

    loadImage(SRC).then((ok) => {
      if (cancelled) return;
      setImageOk(ok);
      window.requestAnimationFrame(() => play(ok));
    });

    return () => {
      cancelled = true;
      done.current = false;
      window.removeEventListener("keydown", onKey);
      animations.forEach((animation) => animation.cancel());
    };
  }, [markRef, onDone, shellRef]);

  return (
    <>
      <div ref={backgroundRef} className="intro-bg" aria-hidden="true">
        <div className="intro-mark">
          <span className="logo intro-logo" />
          <span>Departamento de Matemáticas</span>
        </div>
      </div>
      <div className={flying ? "intro-fg flying" : "intro-fg"} role="dialog" aria-modal="true" aria-label="Apertura">
        <div ref={ghostOne} className="bird ghost" aria-hidden="true">
          <BirdBody imageOk={imageOk} />
        </div>
        <div ref={ghostTwo} className="bird ghost" aria-hidden="true">
          <BirdBody imageOk={imageOk} />
        </div>
        <div ref={birdRef} className="bird" aria-hidden="true">
          <div className="bird-hover">
            <BirdBody imageOk={imageOk} />
          </div>
        </div>
        <div ref={chromeRef} className="intro-chrome">
          <div className="intro-bar" aria-hidden="true">
            <span ref={barRef} />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          Abriendo el generador. Pulse Escape para continuar.
        </p>
      </div>
    </>
  );
}
