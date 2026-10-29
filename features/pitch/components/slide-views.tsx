import type { CSSProperties } from "react";
import Link from "next/link";
import { AvatarStage } from "@/features/pitch/components/avatar-stage";
import { pitchBars, pitchFlow, pitchSectors } from "@/features/pitch/content/deck";

function shown(step: number, beat: number): string {
  return step >= beat ? "pd-beat is-shown" : "pd-beat";
}

export function SlideEra({ step }: { step: number }) {
  return (
    <div className="pd-inner pd-era" data-step={step}>
      <div className="pd-era-field" aria-hidden="true">
        <span className="pd-era-orb pd-era-orb-a" />
        <span className="pd-era-orb pd-era-orb-b" />
        <svg className="pd-era-grid" viewBox="0 0 1200 700" preserveAspectRatio="none">
          <path className="pd-draw" d="M80 560 H1120" />
          <path className="pd-draw pd-draw-late" d="M180 120 V620" />
          <path className="pd-draw pd-draw-late" d="M980 80 C760 220 620 220 420 420" />
        </svg>
      </div>
      <p className="pd-kicker pd-rise" style={{ "--d": "0.15s" } as CSSProperties}>
        Feria empresarial
      </p>
      <h1 className="pd-display pd-rise" style={{ "--d": "0.45s" } as CSSProperties}>
        Una nueva
        <span> era</span>
      </h1>
      <p className="pd-lede pd-rise" style={{ "--d": "0.9s" } as CSSProperties}>
        La inteligencia artificial entra en el trabajo cotidiano de una empresa. No como magia: como una forma de
        ordenar lo que ya ocurre.
      </p>
    </div>
  );
}

export function SlideWhat({ step }: { step: number }) {
  const nodes = [
    { title: "Datos", text: "Lo que la operación ya deja escrito." },
    { title: "Patrones", text: "Lo que se repite y una persona puede no ver a tiempo." },
    { title: "Criterio", text: "La decisión sigue siendo de quien dirige." },
  ];
  return (
    <div className="pd-inner pd-what">
      <div className="pd-what-copy">
        <p className="pd-kicker pd-rise">Concepto</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.12s" } as CSSProperties}>
          Qué es la inteligencia artificial
        </h2>
        <p className={`${shown(step, 0)} pd-lede`}>
          Es una herramienta que aprende de ejemplos para proponer un siguiente paso. No conoce la empresa si nadie le
          cuenta su situación.
        </p>
        <p className={`${shown(step, 2)} pd-aside`}>Sirve para explicar una idea. No sustituye la explicación.</p>
      </div>
      <div className="pd-what-map" aria-hidden={step < 1}>
        <span className={`pd-core ${shown(step, 1)}`}>IA</span>
        {nodes.map((node, index) => (
          <article key={node.title} className={`pd-node pd-node-${index} ${shown(step, 1)}`} style={{ "--d": `${0.12 * index}s` } as CSSProperties}>
            <h3>{node.title}</h3>
            <p>{node.text}</p>
          </article>
        ))}
        <svg className="pd-what-lines" viewBox="0 0 640 520" aria-hidden="true">
          <path className={step >= 1 ? "pd-draw is-live" : "pd-draw"} d="M320 250 L140 110" />
          <path className={step >= 1 ? "pd-draw is-live pd-draw-late" : "pd-draw"} d="M320 250 L500 120" />
          <path className={step >= 1 ? "pd-draw is-live pd-draw-later" : "pd-draw"} d="M320 250 L320 430" />
        </svg>
      </div>
    </div>
  );
}

export function SlideHow({ step }: { step: number }) {
  return (
    <div className="pd-inner pd-how">
      <p className="pd-kicker pd-rise">Proceso</p>
      <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.1s" } as CSSProperties}>
        Cómo funciona
      </h2>
      <ol className="pd-flow">
        {pitchFlow.map((item, index) => (
          <li key={item.title} className={shown(step, index)} style={{ "--d": `${index * 0.08}s` } as CSSProperties}>
            <span className="pd-flow-index">0{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            {index < pitchFlow.length - 1 ? <span className="pd-flow-link" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SlideData({ step }: { step: number }) {
  return (
    <div className="pd-inner pd-data">
      <div>
        <p className="pd-kicker pd-rise">Ejemplo ilustrativo</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.1s" } as CSSProperties}>
          De los datos a las decisiones
        </h2>
        <p className="pd-lede pd-rise" style={{ "--d": "0.2s" } as CSSProperties}>
          Estos valores no pertenecen a ninguna empresa. Sirven para mostrar cómo una lectura breve puede ordenar una
          conversación.
        </p>
        <article className={`${shown(step, 1)} pd-decision`}>
          <p className="pd-kicker">Decisión de ejemplo</p>
          <p>Revisar primero el seguimiento: en este dibujo es donde más distancia hay entre el interés y el cierre.</p>
        </article>
      </div>
      <div className="pd-chart" role="img" aria-label="Gráfico ilustrativo de consultas, seguimiento y cierres. No son datos reales.">
        {pitchBars.map((bar) => (
          <div key={bar.label} className="pd-bar">
            <div className="pd-bar-track">
              <span className={step >= 0 ? "is-grown" : undefined} style={{ height: `${bar.value}%` }} />
            </div>
            <b>{bar.value}</b>
            <span>{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SlideSectors({ step }: { step: number }) {
  return (
    <div className="pd-inner pd-sectors">
      <header className="pd-sectors-head">
        <p className="pd-kicker pd-rise">Tres sectores</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.08s" } as CSSProperties}>
          La IA en el mundo empresarial
        </h2>
      </header>
      <div className="pd-sector-grid">
        {pitchSectors.map((sector, index) => (
          <article key={sector.id} className={`pd-sector pd-sector-${sector.id} ${shown(step, index)}`}>
            <p className="pd-kicker">0{index + 1}</p>
            <h3>{sector.title}</h3>
            <p><b>Problema. </b>{sector.problem}</p>
            <p><b>Oportunidad. </b>{sector.opportunity}</p>
            <p><b>Aplicación. </b>{sector.application}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SlideAvatar({ step }: { step: number }) {
  return (
    <div className="pd-inner pd-avatar has-side" data-step={step}>
      <div className="pd-avatar-open">
        <p className="pd-kicker pd-rise">En vivo</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.12s" } as CSSProperties}>
          Inteligencia en tiempo real
        </h2>
      </div>
      <AvatarStage />
    </div>
  );
}

export function SlideClose({ step }: { step: number }) {
  return (
    <div className="pd-inner pd-close">
      <span className="pd-close-ring" aria-hidden="true" />
      <p className="pd-kicker pd-rise">Cierre</p>
      <h2 className="pd-display pd-rise" style={{ "--d": "0.16s" } as CSSProperties}>
        De la idea a la acción
      </h2>
      <p className="pd-lede pd-rise" style={{ "--d": "0.32s" } as CSSProperties}>
        La presentación muestra el mapa. El stand deja que cada visitante pruebe una lectura con su propio caso.
      </p>
      <div className={`${shown(step, 1)} pd-close-actions`}>
        <Link className="pd-btn pd-btn-solid" href="/consultoria">
          Abrir el stand
        </Link>
        <Link className="pd-btn pd-btn-line" href="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export const slideViews = [SlideEra, SlideWhat, SlideHow, SlideData, SlideSectors, SlideAvatar, SlideClose] as const;
