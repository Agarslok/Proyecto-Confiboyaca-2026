"use client";

import { useEffect, useRef, useState } from "react";
import { ExtIcon, Icon } from "@/components/externado/icons";
import { RestartButton } from "@/components/externado/restart-button";
import { DEPT_URL, HOME_SECTIONS } from "@/components/externado/team-config";

interface SiteHeaderProps {
  inFlow: boolean;
  activeSection: string;
  onHome: () => void;
  onSection: (id: string) => void;
  onStart: () => void;
  onRestart: () => void;
}

export function SiteHeader({
  inFlow,
  activeSection,
  onHome,
  onSection,
  onStart,
  onRestart,
}: SiteHeaderProps) {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hl, setHl] = useState<{ left: number; width: number } | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector("button, a") as HTMLElement | null;
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
      if (e.key === "Tab" && drawerRef.current) {
        const f = drawerRef.current.querySelectorAll<HTMLElement>("button, a");
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      menuBtnRef.current?.focus({ preventScroll: true });
    };
  }, [drawer]);

  const moveHl = (el: HTMLElement) => {
    if (!listRef.current) return;
    const a = el.getBoundingClientRect();
    const b = listRef.current.getBoundingClientRect();
    setHl({ left: a.left - b.left, width: a.width });
  };

  const go = (id: string) => {
    setDrawer(false);
    onSection(id);
  };

  const isOn = (id: string) => !inFlow && activeSection === id;

  const links = (variant: "bar" | "drawer") => (
    <>
      {HOME_SECTIONS.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            className={`nav-link${isOn(s.id) ? " on" : ""}`}
            aria-current={isOn(s.id) ? "true" : undefined}
            onMouseEnter={variant === "bar" ? (e) => moveHl(e.currentTarget) : undefined}
            onFocus={variant === "bar" ? (e) => moveHl(e.currentTarget) : undefined}
            onClick={() => go(s.id)}
          >
            {s.label}
          </button>
        </li>
      ))}
      <li>
        <a
          className="nav-link ext"
          href={DEPT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={variant === "bar" ? (e) => moveHl(e.currentTarget) : undefined}
          onFocus={variant === "bar" ? (e) => moveHl(e.currentTarget) : undefined}
        >
          Departamento de Matemáticas <ExtIcon />
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </li>
    </>
  );

  return (
    <>
      <header className={`top${scrolled ? " scrolled" : ""}`}>
        <div className="top-in">
          <button
            ref={menuBtnRef}
            type="button"
            className="menu-btn"
            aria-expanded={drawer}
            aria-controls="drawer"
            onClick={() => setDrawer(true)}
          >
            <span className="sr-only">Abrir menú</span>
            <span className="burger" aria-hidden="true"><span /><span /><span /></span>
          </button>
          <button type="button" className="brand" onClick={onHome} aria-label="Universidad Externado de Colombia. Ir al inicio">
            <span className="logo logo-dark" aria-hidden="true" />
            <span className="brand-sep" aria-hidden="true" />
            <span className="brand-sub">Departamento de<br />Matemáticas</span>
          </button>
          <nav className="nav" aria-label="Secciones">
            <ul ref={listRef} onMouseLeave={() => setHl(null)}>
              <span
                className={`nav-hl${hl ? " show" : ""}`}
                style={hl ? { transform: `translateX(${hl.left}px)`, width: hl.width } : undefined}
                aria-hidden="true"
              />
              {links("bar")}
            </ul>
          </nav>
          <div className="top-actions">
            {inFlow ? (
              <RestartButton onConfirm={onRestart} variant="dark" label="Nueva encuesta" />
            ) : (
              <button type="button" className="btn btn-dark btn-cta" onClick={onStart}>
                <span>Comenzar<span className="cta-long"> formulario</span></span> <Icon.arrow />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`scrim${drawer ? " show" : ""}`} onClick={() => setDrawer(false)} aria-hidden="true" />
      <aside
        id="drawer"
        ref={drawerRef}
        className={`drawer${drawer ? " open" : ""}`}
        aria-label="Menú"
        aria-hidden={!drawer}
        {...(drawer ? {} : { inert: true })}
      >
        <div className="drawer-head">
          <span className="logo logo-dark" role="img" aria-label="Universidad Externado de Colombia" />
          <button type="button" className="icon-btn drawer-close" onClick={() => setDrawer(false)} aria-label="Cerrar menú">
            <Icon.x />
          </button>
        </div>
        <p className="drawer-sub">Departamento de Matemáticas</p>
        <ul className="drawer-links">{links("drawer")}</ul>
        <div className="drawer-foot">
          {inFlow ? (
            <RestartButton
              onConfirm={() => {
                setDrawer(false);
                onRestart();
              }}
              variant="dark"
              label="Nueva encuesta"
            />
          ) : (
            <button
              type="button"
              className="btn btn-dark btn-block"
              onClick={() => {
                setDrawer(false);
                onStart();
              }}
            >
              Comenzar formulario <Icon.arrow />
            </button>
          )}
          <p className="drawer-note">4 pasos · Sin registro</p>
        </div>
      </aside>
    </>
  );
}
