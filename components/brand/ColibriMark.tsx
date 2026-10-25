"use client";

import { useState, type RefObject } from "react";

interface ColibriMarkProps {
  buttonRef: RefObject<HTMLButtonElement | null>;
  hidden: boolean;
}

export function ColibriMark({ buttonRef, hidden }: ColibriMarkProps) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={hidden ? "colibri is-hidden" : open ? "colibri is-open" : "colibri"}
      aria-label="Universidad Externado de Colombia. Enlace disponible próximamente"
      aria-expanded={open}
      tabIndex={hidden ? -1 : 0}
      onClick={() => setOpen((value) => !value)}
    >
      {failed ? (
        <span className="colibri-fallback" aria-hidden="true">
          <span>Externado</span>
        </span>
      ) : (
        // The mark is the same local asset as the flight, including its error fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/colibri.webp"
          alt=""
          width={120}
          height={120}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      <span className="colibri-tip" aria-hidden="true">
        {open ? "Enlace aún no conectado" : "Próximamente"}
      </span>
      <span className="sr-only" role="status">
        {open ? "El enlace institucional todavía no está conectado." : ""}
      </span>
    </button>
  );
}
