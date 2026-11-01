"use client";

import Link from "next/link";
import { ExtIcon } from "@/components/externado/icons";
import { DEPT_CONTACT, DEPT_URL, HOME_SECTIONS, UNI_URL } from "@/components/externado/team-config";

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
          <div className="foot-dept" aria-label="Contacto del departamento">
            <p className="foot-dept-name">{DEPT_CONTACT.title}</p>
            <dl className="foot-dept-list">
              <div>
                <dt>Dirección</dt>
                <dd>{DEPT_CONTACT.address}</dd>
              </div>
              <div>
                <dt>Teléfonos</dt>
                <dd>{DEPT_CONTACT.phones}</dd>
              </div>
              {DEPT_CONTACT.emails.map((item) => (
                <div key={item.address}>
                  <dt>{item.label}</dt>
                  <dd>
                    <a href={`mailto:${item.address}`}>{item.address}</a>
                  </dd>
                </div>
              ))}
              <div>
                <dt>Horario</dt>
                <dd>{DEPT_CONTACT.hours}</dd>
              </div>
            </dl>
          </div>
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
          <Link className="foot-link" href="/encuestas">Encuestas por nicho</Link>
          <Link className="foot-link" href="/consultor">Acceso para consultores</Link>
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
