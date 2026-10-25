"use client";

import { useEffect, useRef, useState } from "react";

interface RestartButtonProps {
  onConfirm: () => void;
  variant?: "ghost" | "dark";
  label?: string;
}

export function RestartButton({
  onConfirm,
  variant = "ghost",
  label = "Nueva empresa",
}: RestartButtonProps) {
  const [open, setOpen] = useState(false);
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && yesRef.current) yesRef.current.focus();
  }, [open]);

  return (
    <div className="restart" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <button type="button" className={`btn btn-${variant}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open ? (
        <div className="restart-pop" role="dialog" aria-label="Confirmar reinicio">
          <p>¿Empezar de nuevo? Se borrarán las respuestas actuales.</p>
          <div className="row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              ref={yesRef}
              className="btn btn-primary btn-sm"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Sí, reiniciar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
