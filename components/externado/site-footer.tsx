"use client";

import Link from "next/link";
import { ExtIcon } from "@/components/externado/icons";
import { DEPT_URL, HOME_SECTIONS, UNI_URL } from "@/components/externado/team-config";

interface SiteFooterProps {
  onReplay: () => void;
  onSection: (id: string) => void;
}

export function SiteFooter({ onReplay, onSection }: SiteFooterProps) {
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <span className="logo" role="img" aria-label="Universidad Externado de Colombia" />
          <p>
            Prototipo académico del Departamento de Matemáticas. La lectura y la página se generan con reglas locales
            en este navegador.
          </p>
        </div>
        <nav className="foot-col" aria-label="Secciones del pie">
          <p className="micro">Explorar</p>
          {HOME_SECTIONS.map((s) => (
            <button key={s.id} type="button" className="foot-link" onClick={() => onSection(s.id)}>
              {s.label}
            </button>
          ))}
          <button type="button" className="foot-link" onClick={onReplay}>Repetir apertura</button>
          <Link href="/" className="foot-link">Elegir experiencia</Link>
        </nav>
        <div className="foot-col">
          <p className="micro">Universidad</p>
          <a className="foot-link" href={DEPT_URL} target="_blank" rel="noopener noreferrer">
            Departamento de Matemáticas <ExtIcon />
          </a>
          <a className="foot-link" href={UNI_URL} target="_blank" rel="noopener noreferrer">
            Universidad Externado de Colombia <ExtIcon />
          </a>
        </div>
      </div>
      <div className="wrap foot-base">
        <p>© {new Date().getFullYear()} · Prototipo académico. No es un servicio oficial de la Universidad.</p>
      </div>
    </footer>
  );
}
