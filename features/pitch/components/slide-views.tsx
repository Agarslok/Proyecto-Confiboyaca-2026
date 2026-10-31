import type { CSSProperties, RefObject } from "react";
import Link from "next/link";
import { VideoStage } from "@/features/pitch/components/video-stage";
import {
  pitchBars,
  pitchClosingQuote,
  pitchCustomCoursePillars,
  pitchCustomCoursePresenterPoints,
  pitchCustomCourseTopics,
  pitchEraPillars,
  pitchFlow,
  pitchMentorshipOffers,
  pitchNextStepPhases,
  pitchNextStepPresenterPoints,
  pitchOfferFooter,
  pitchSectors,
  pitchWhatExamples,
} from "@/features/pitch/content/deck";
// Avatar en vivo (futuro): import { AvatarStage } from "@/features/pitch/components/avatar-stage";

export type PitchSlideProps = {
  step: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
  videoActive?: boolean;
};

function topicTagKey(tag: string): string {
  if (tag === "Datos") return "datos";
  if (tag === "Operación") return "operacion";
  if (tag === "IA") return "ia";
  return "areas";
}

function shown(step: number, beat: number): string {
  return step >= beat ? "pd-beat is-shown" : "pd-beat";
}

function OfferIcon({ kind }: { kind: "analytics" | "ai" }) {
  if (kind === "analytics") {
    return (
      <svg className="pd-offer-icon" viewBox="0 0 120 120" aria-hidden="true">
        <rect x="12" y="68" width="22" height="40" rx="6" className="pd-offer-icon-fill" />
        <rect x="44" y="48" width="22" height="60" rx="6" className="pd-offer-icon-fill" />
        <rect x="76" y="28" width="22" height="80" rx="6" className="pd-offer-icon-fill pd-offer-icon-accent" />
        <path className="pd-offer-icon-line" d="M8 104 H112" />
      </svg>
    );
  }
  return (
    <svg className="pd-offer-icon" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="52" r="18" className="pd-offer-icon-ring" />
      <circle cx="28" cy="78" r="12" className="pd-offer-icon-ring" />
      <circle cx="92" cy="78" r="12" className="pd-offer-icon-ring" />
      <path className="pd-offer-icon-line" d="M60 70 V92 M60 70 L28 78 M60 70 L92 78" />
      <text x="60" y="58" textAnchor="middle" className="pd-offer-icon-label">
        IA
      </text>
    </svg>
  );
}

function PresenterPanel({ title, points, className }: { title: string; points: string[]; className?: string }) {
  return (
    <aside className={`pd-presenter ${className ?? ""}`.trim()} aria-label={title}>
      <p className="pd-presenter-title">{title}</p>
      <ul>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </aside>
  );
}

export function SlideEra({ step }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-era" data-step={step}>
      <div className="pd-era-copy">
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
        <p className={`${shown(step, 1)} pd-era-foot`}>
          Hoy mostramos cómo pasan los <strong>datos</strong> a una <strong>lectura clara</strong> y luego a una{" "}
          <strong>decisión</strong> que ustedes confirman.
        </p>
      </div>
      <div className="pd-era-field" aria-hidden="true">
        <span className="pd-era-orb pd-era-orb-a" />
        <span className="pd-era-orb pd-era-orb-b" />
        <div className={`pd-era-story ${shown(step, 0)}`}>
          {pitchEraPillars.map((pillar, index) => (
            <article key={pillar.title} className="pd-era-card" style={{ "--d": `${index * 0.1}s` } as CSSProperties}>
              <span className="pd-era-card-num">0{index + 1}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
          <svg className="pd-era-flow" viewBox="0 0 480 48" aria-hidden="true">
            <path className="pd-draw is-live" d="M24 24 H456" />
            <circle cx="48" cy="24" r="6" className="pd-era-dot" />
            <circle cx="240" cy="24" r="6" className="pd-era-dot" />
            <circle cx="432" cy="24" r="6" className="pd-era-dot" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function SlideWhat({ step }: PitchSlideProps) {
  const nodes = [
    { title: "Datos", text: "Ventas, mensajes, inventario: lo que la operación ya registra." },
    { title: "Patrones", text: "Lo que se repite y cuesta ver a tiempo en cuadernos o chats." },
    { title: "Criterio", text: "La decisión final la toma quien conoce el negocio." },
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
        <ul className={`${shown(step, 0)} pd-friendly-list`}>
          {pitchWhatExamples.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={`${shown(step, 2)} pd-aside`}>Sirve para explicar una idea. No sustituye la explicación.</p>
      </div>
      <div className="pd-what-map" aria-hidden={step < 1}>
        <span className={`pd-core ${shown(step, 1)}`}>IA</span>
        {nodes.map((node, index) => (
          <article
            key={node.title}
            className={`pd-node pd-node-${index} ${shown(step, 1)}`}
            style={{ "--d": `${0.12 * index}s` } as CSSProperties}
          >
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

export function SlideHow({ step }: PitchSlideProps) {
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
            <p className="pd-flow-example">
              {index === 0 && "Ej.: mensajes de clientes y pedidos del día."}
              {index === 1 && "Ej.: agrupar lo repetido y señalar un hueco."}
              {index === 2 && "Ej.: «conviene llamar a estos tres clientes»."}
            </p>
            {index < pitchFlow.length - 1 ? <span className="pd-flow-link" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SlideData({ step }: PitchSlideProps) {
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
        <p className={`${shown(step, 0)} pd-data-caption`}>
          Tres etapas del embudo: más consultas arriba, menos cierres abajo — ahí suele estar la conversación.
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

export function SlideSectors({ step }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-sectors">
      <header className="pd-sectors-head">
        <p className="pd-kicker pd-rise">Tres sectores</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.08s" } as CSSProperties}>
          La IA en el mundo empresarial
        </h2>
        <p className="pd-lede pd-rise" style={{ "--d": "0.16s" } as CSSProperties}>
          Mismo método, distintos datos: turismo, metalurgia y agro.
        </p>
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

export function SlideVideo({ videoRef, videoActive }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-video pd-video-only">
      <VideoStage ref={videoRef} active={videoActive} />
    </div>
  );
}

export function SlideNextStep({ step }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-next-step">
      <header className="pd-next-head">
        <p className="pd-kicker pd-rise">Paso a seguir</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.1s" } as CSSProperties}>
          Qué sigue
        </h2>
        <p className="pd-lede pd-rise" style={{ "--d": "0.22s" } as CSSProperties}>
          Después de la demostración, las empresas de la feria pueden contratar mentorías del Departamento de
          Matemáticas con condiciones especiales.
        </p>
      </header>
      <div className="pd-next-layout">
        <ol className={`pd-next-phases ${shown(step, 0)}`}>
          {pitchNextStepPhases.map((phase, index) => (
            <li key={phase.title} style={{ "--d": `${index * 0.08}s` } as CSSProperties}>
              <span className="pd-next-phase-index">0{index + 1}</span>
              <div>
                <h3>{phase.title}</h3>
                <p>{phase.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className={`pd-next-visual ${shown(step, 1)}`}>
          <div className="pd-next-clock" role="img" aria-label="Ventana de contratación de doce horas">
            <svg viewBox="0 0 200 200" className="pd-next-clock-svg">
              <circle cx="100" cy="100" r="88" className="pd-next-clock-ring" />
              <circle cx="100" cy="100" r="88" className="pd-next-clock-arc" pathLength={100} />
              <line x1="100" y1="100" x2="100" y2="42" className="pd-next-clock-hand" />
              <line x1="100" y1="100" x2="148" y2="118" className="pd-next-clock-hand pd-next-clock-hand-short" />
            </svg>
            <p className="pd-next-step-hours">12 h</p>
            <p className="pd-next-clock-caption">Ventana de contratación en feria</p>
          </div>
          <article className="pd-next-step-callout">
            <p className="pd-kicker">Qué decir ahora</p>
            <p>
              Desde este momento tienen <strong>12 horas</strong> para adquirir una de las mentorías preseleccionadas.
              La oferta concreta está en la <strong>siguiente diapositiva</strong>.
            </p>
          </article>
        </div>
      </div>
      <PresenterPanel
        title="Apoyo al presentador"
        points={pitchNextStepPresenterPoints}
        className={shown(step, 2)}
      />
    </div>
  );
}

export function SlideOffer({ step }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-offer">
      <header className="pd-offer-head">
        <p className="pd-kicker pd-rise">Feria</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.08s" } as CSSProperties}>
          Oferta adicional
        </h2>
        <p className={`${shown(step, 0)} pd-lede pd-offer-lede`}>
          Dos mentorías ya definidas. Elijan la que mejor encaje con el reto; abajo, qué se lleva cada una.
        </p>
      </header>
      <div className="pd-offer-grid">
        {pitchMentorshipOffers.map((offer, index) => (
          <article
            key={offer.title}
            className={`pd-offer-card pd-offer-card-${offer.icon} ${shown(step, 0)}`}
            style={{ "--d": `${index * 0.1}s` } as CSSProperties}
          >
            <div className="pd-offer-card-top">
              <OfferIcon kind={offer.icon} />
              <div>
                <p className="pd-kicker">Mentoría {index + 1}</p>
                <h3>{offer.title}</h3>
                <p className="pd-offer-sub">{offer.subtitle}</p>
              </div>
            </div>
            <dl className={`pd-offer-meta ${shown(step, 0)}`}>
              <div>
                <dt>Para quién</dt>
                <dd>{offer.audience}</dd>
              </div>
              <div>
                <dt>Formato</dt>
                <dd>{offer.format}</dd>
              </div>
            </dl>
            <ul className={`pd-offer-outcomes ${shown(step, 1)}`}>
              {offer.outcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className={`pd-offer-footer ${shown(step, 1)}`}>{pitchOfferFooter}</p>
    </div>
  );
}

export function SlideCustomCourses({ step }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-custom">
      <header className="pd-custom-head">
        <p className="pd-kicker pd-rise">A la medida</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.08s" } as CSSProperties}>
          Cursos a la medida
        </h2>
        <p className={`${shown(step, 0)} pd-lede`}>
          Si el reto no encaja en una mentoría cerrada, se diseña un curso con temas y <strong>horas distintas</strong>{" "}
          según lo que la empresa necesite.
        </p>
      </header>
      <div className="pd-custom-layout">
        <div className={`pd-custom-pillars ${shown(step, 0)}`}>
          <p className="pd-kicker">Cómo se arma</p>
          <ol>
            {pitchCustomCoursePillars.map((pillar, index) => (
              <li key={pillar.title} style={{ "--d": `${index * 0.06}s` } as CSSProperties}>
                <span className="pd-custom-pillar-num">{index + 1}</span>
                <div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <svg className="pd-custom-diagram" viewBox="0 0 320 120" aria-hidden="true">
            <path className="pd-draw is-live" d="M24 60 H296" />
            <circle cx="48" cy="60" r="10" className="pd-custom-node" />
            <circle cx="160" cy="60" r="10" className="pd-custom-node" />
            <circle cx="272" cy="60" r="10" className="pd-custom-node" />
          </svg>
        </div>
        <div className={`pd-custom-topics ${shown(step, 1)}`}>
          <p className="pd-kicker">Temas de referencia</p>
          <ul className="pd-topic-grid">
            {pitchCustomCourseTopics.map((topic) => (
              <li key={topic.label}>
                <span className={`pd-topic-tag pd-topic-tag-${topicTagKey(topic.tag)}`}>
                  {topic.tag}
                </span>
                <span>{topic.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <PresenterPanel
        title="Apoyo al presentador"
        points={pitchCustomCoursePresenterPoints}
        className={shown(step, 2)}
      />
    </div>
  );
}

export function SlideClose({ step }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-close">
      <span className="pd-close-ring" aria-hidden="true" />
      <p className="pd-kicker pd-rise">Muchas gracias</p>
      <h2 className="pd-display pd-rise" style={{ "--d": "0.16s" } as CSSProperties}>
        De la idea a la acción
      </h2>
      <p className="pd-lede pd-rise" style={{ "--d": "0.32s" } as CSSProperties}>
        La presentación muestra el mapa. El stand deja que cada visitante pruebe una lectura con su propio caso.
      </p>
      <blockquote className={`${shown(step, 0)} pd-close-quote`}>
        <p>«{pitchClosingQuote.text}»</p>
        <footer>— {pitchClosingQuote.author}</footer>
      </blockquote>
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

export const slideViews = [
  SlideEra,
  SlideWhat,
  SlideHow,
  SlideData,
  SlideSectors,
  SlideVideo,
  SlideNextStep,
  SlideOffer,
  SlideCustomCourses,
  SlideClose,
] as const;
