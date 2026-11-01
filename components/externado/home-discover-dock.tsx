"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/externado/icons";
import { HOME_SECTIONS } from "@/components/externado/team-config";

const TOP_SCROLL_MAX = 140;

interface HomeDiscoverDockProps {
  onSection: (id: string) => void;
  onStart: () => void;
  onReplay: () => void;
}

function DiscoverIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 12v8M4 8.5 12 12l8-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeDiscoverDock({ onSection, onStart, onReplay }: HomeDiscoverDockProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [atHero, setAtHero] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setAtHero(window.scrollY < TOP_SCROLL_MAX);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    if (atHero) return;
    setOpen(false);
  }, [atHero]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const goSection = (id: string) => {
    setOpen(false);
    onSection(id);
  };

  const goStart = () => {
    setOpen(false);
    onStart();
  };

  const goReplay = () => {
    setOpen(false);
    onReplay();
  };

  return (
    <div
      ref={rootRef}
      className={`home-discover${atHero ? "" : " is-hidden"}`}
      aria-hidden={!atHero}
    >
      <div className={`home-discover-panel${open ? " is-open" : ""}`} id={panelId} role="region" aria-label="Explorar el sitio">
        <p className="micro home-discover-kicker">Explorar</p>
        <ul className="home-discover-links">
          {HOME_SECTIONS.map((s) => (
            <li key={s.id}>
              <button type="button" className="home-discover-link" onClick={() => goSection(s.id)}>
                {s.label}
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="home-discover-link home-discover-link--cta" onClick={goStart}>
              Comenzar formulario <Icon.arrow />
            </button>
          </li>
          <li>
            <Link href="/encuestas" className="home-discover-link" onClick={() => setOpen(false)}>
              Encuestas por nicho
            </Link>
          </li>
          <li>
            <Link href="/" className="home-discover-link" onClick={() => setOpen(false)}>
              Elegir experiencia
            </Link>
          </li>
          <li>
            <button type="button" className="home-discover-link" onClick={goReplay}>
              Repetir apertura
            </button>
          </li>
          <li>
            <Link href="/consultor" className="home-discover-link" onClick={() => setOpen(false)}>
              Acceso para consultores
            </Link>
          </li>
        </ul>
      </div>
      <button
        type="button"
        className="home-discover-fab"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar menú Descubrir" : "Descubrir secciones del sitio"}
        onClick={() => setOpen((v) => !v)}
      >
        <DiscoverIcon />
        <span className="home-discover-fab-label">Descubrir</span>
      </button>
    </div>
  );
}
