"use client";

import { Button } from "@/components/ui/Button";
import { useSite } from "@/components/site/useSite";

export function SiteDiagnosis() {
  const state = useSite();
  const config = state.config;

  if (!config) {
    return (
      <section className="wrap empty-state">
        <p className="micro accent">Diagnóstico</p>
        <h1 className="display r-title">Todavía no hay una página preparada</h1>
        <p className="lead sm">
          Complete el formulario. Si recargó el navegador antes de terminar, las respuestas guardadas siguen en el
          formulario.
        </p>
        <Button href="/diagnostico">Ir al formulario</Button>
      </section>
    );
  }

  return (
    <article className="wrap results">
      <header className="r-head">
        <p className="micro accent">
          {config.sectorLabel} · {config.templateLabel}
        </p>
        <h1 className="display r-title">Lectura preliminar para {config.companyName}</h1>
        <p className="lead sm">{config.diagnosis.need}</p>
        <dl className="r-facts">
          <div>
            <dt>Plantilla</dt>
            <dd>{config.templateLabel}</dd>
          </div>
          <div>
            <dt>Objetivo (info.)</dt>
            <dd>{config.goalLabel}</dd>
          </div>
          <div>
            <dt>Público (info.)</dt>
            <dd>{config.audienceLabel}</dd>
          </div>
          <div>
            <dt>Actividad</dt>
            <dd>{config.activityNote}</dd>
          </div>
        </dl>
      </header>

      <div className="r-grid">
        <div className="r-main">
          <section className="r-block">
            <h2 className="h2">Regla aplicada</h2>
            <p>{config.diagnosis.priority}</p>
          </section>
          <section className="r-block">
            <h2 className="h2">Qué incluye esta lectura</h2>
            <ul className="benefits-plain">
              {config.diagnosis.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="r-block">
            <h2 className="h2">Qué todavía falta</h2>
            <ul className="benefits-plain">
              {config.diagnosis.missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <div className="callout">
            <p>{config.diagnosis.limitation}</p>
          </div>
          <div className="w-actions" style={{ justifyContent: "flex-start" }}>
            <Button href="/preview">Ver la página generada</Button>
            <Button href="/sitio" target="_blank" rel="noopener noreferrer">
              Abrir en una nueva pestaña
            </Button>
            <Button href="/diagnostico" variant="secondary">Editar respuestas</Button>
          </div>
        </div>

        <aside className="r-side">
          <div className="card side-card">
            <p className="micro accent">Siguiente paso</p>
            <p className="side-text">Abra la vista previa o el sitio en pantalla completa en otra pestaña.</p>
            <Button href="/preview" className="btn-block">Abrir vista previa</Button>
            <Button href="/sitio" target="_blank" rel="noopener noreferrer" variant="secondary" className="btn-block">
              Nueva pestaña
            </Button>
          </div>
        </aside>
      </div>
    </article>
  );
}
