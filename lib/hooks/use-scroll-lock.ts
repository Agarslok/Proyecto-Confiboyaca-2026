import { useEffect } from "react";

const BLOCKED_KEYS = new Set([
  " ",
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
]);

/**
 * Fija la ventana arriba y bloquea scroll hasta desmontar (p. ej. durante la carga de consultoría).
 */
export function useScrollLock(active = true): void {
  useEffect(() => {
    if (!active) return;

    window.scrollTo(0, 0);

    const html = document.documentElement;
    const body = document.body;
    html.classList.add("consultoria-scroll-lock");
    body.classList.add("consultoria-scroll-lock");

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (BLOCKED_KEYS.has(event.key)) {
        event.preventDefault();
      }
    };

    const onScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      html.classList.remove("consultoria-scroll-lock");
      body.classList.remove("consultoria-scroll-lock");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [active]);
}
