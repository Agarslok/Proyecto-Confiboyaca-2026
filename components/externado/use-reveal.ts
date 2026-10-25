"use client";

import { useEffect } from "react";

function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Aparición con zoom al desplazarse (mismo comportamiento que el prototipo Vite). */
export function useReveal(deps: readonly unknown[] = []) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || reduceMotion()) return;
    const els = [...document.querySelectorAll(".reveal")];
    const vh = window.innerHeight;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add("pre");
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("pre");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps control re-scan like the Vite app
  }, deps);
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}
