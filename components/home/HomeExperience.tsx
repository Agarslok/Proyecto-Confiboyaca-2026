"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/site/useSite";
import { sectorLabels } from "@/lib/site/catalog";
import { patchSiteDraft } from "@/lib/session/site-session";
import { SECTOR_IDS, type SectorId } from "@/types/site";

const STEPS = [
  {
    title: "La empresa",
    text: "Nombre, sector, actividad y el tipo de página que necesita.",
  },
  {
    title: "La lectura",
    text: "Un diagnóstico breve, hecho con reglas, sobre el objetivo y las secciones.",
  },
  {
    title: "La página",
    text: "Una página real, armada con esas respuestas, no una captura fija.",
  },
];

export function HomeExperience() {
  const router = useRouter();
  const state = useSite();
  const started = Boolean(state.draft.companyName || state.draft.sectorId || state.config);

  function begin(sectorId?: SectorId) {
    if (sectorId) patchSiteDraft({ sectorId });
    router.push("/diagnostico");
  }

  return (
    <>
      <section className="wrap welcome" aria-labelledby="w-title">
        <span className="hero-tag">
          <span className="pulse-dot" aria-hidden="true" />
          Generador local de páginas
        </span>
        <h1 id="w-title" className="display w-title">
          Describa la empresa y vea una página hecha con esas respuestas
        </h1>
        <p className="lead w-lead">
          No usa una tienda externa ni un modelo de inteligencia artificial.
        </p>
        <div className="w-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => begin()}>
            {started ? "Continuar formulario" : "Comenzar formulario"}
          </button>
          {state.config ? (
            <Link className="btn btn-ghost btn-lg" href="/preview">
              Ver página generada
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
            >
              Cómo funciona
            </button>
          )}
        </div>
        <p className="w-meta">3 pasos · Sin registro · Todo en este equipo</p>
        <button
          type="button"
          className="scroll-cue"
          onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
        >
          <span>Desliza para ver el recorrido</span>
          <span className="cue-line" aria-hidden="true" />
        </button>
      </section>

      <section id="como-funciona" tabIndex={-1} className="wrap section" aria-labelledby="how-title">
        <div className="section-head center">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="how-title" className="section-title">Del formulario a la página</h2>
          <p className="section-lead">
            Un flujo corto: usted responde, el sistema explica qué incluiría y arma una vista previa editable.
          </p>
        </div>
        <ol className="how-grid">
          {STEPS.map((step, index) => (
            <li className="card" key={step.title}>
              <span className="how-n" aria-hidden="true">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap section" aria-labelledby="sectors-title">
        <div className="section-head center">
          <p className="eyebrow">Perfiles</p>
          <h2 id="sectors-title" className="section-title sm">Plantillas sectoriales</h2>
          <p className="section-lead">
            El sector elige la plantilla (seis opciones). El nombre personaliza el encabezado.
          </p>
        </div>
        <div className="sector-grid" style={{ marginInline: "auto" }}>
          {SECTOR_IDS.map((sectorId) => (
            <button key={sectorId} type="button" className="sector-card" onClick={() => begin(sectorId)}>
              <strong>{sectorLabels[sectorId]}</strong>
              <span>Plantilla de demostración para {sectorLabels[sectorId].toLowerCase()}.</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
