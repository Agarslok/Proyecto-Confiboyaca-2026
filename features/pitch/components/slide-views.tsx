import type { CSSProperties, ReactNode, RefObject } from "react";
import Link from "next/link";
import { PitchInstitutionIntro } from "@/features/pitch/components/pitch-institution-bar";
import { VideoStage } from "@/features/pitch/components/video-stage";
import {
  pitchClosingQuote,
  pitchCustomCoursePillars,
  pitchCustomCourseTopics,
  pitchEraPillars,
  pitchFlow,
  pitchMentorshipOffers,
  pitchNextStepPhases,
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

function storyMode(step: number, heroUntil = 0): "hero" | "compact" {
  return step <= heroUntil ? "hero" : "compact";
}

function StoryShell({
  step,
  heroUntil = 0,
  className = "",
  kicker,
  title,
  large = false,
  intro,
  hideKickerOnCompact = false,
  children,
}: {
  step: number;
  heroUntil?: number;
  className?: string;
  kicker?: string;
  title: ReactNode;
  large?: boolean;
  intro?: ReactNode;
  hideKickerOnCompact?: boolean;
  children?: ReactNode;
}) {
  const mode = storyMode(step, heroUntil);
  const showKicker = kicker && !(hideKickerOnCompact && mode === "compact");
  const showIntro = intro && mode === "hero";
  return (
    <div className={`pd-inner pd-story pd-story--${mode} ${className}`.trim()} data-step={step}>
      <header className={`pd-story-head ${mode === "hero" ? "pd-story-head--center" : "pd-story-head--rail"}`}>
        {showIntro ? (
          <div className="pd-inst-wrap pd-rise" style={{ "--d": "0s" } as CSSProperties}>
            {intro}
          </div>
        ) : null}
        {showKicker ? (
          <p
            className={`pd-kicker ${mode === "hero" ? "pd-rise" : shown(step, heroUntil + 1)}`}
            style={mode === "hero" ? ({ "--d": "0.1s" } as CSSProperties) : undefined}
          >
            {kicker}
          </p>
        ) : null}
        <h2
          className={`pd-display ${large ? "" : "pd-display-sm"} ${mode === "hero" ? "pd-rise" : "pd-story-title-compact"}`}
          style={mode === "hero" ? ({ "--d": "0.35s" } as CSSProperties) : undefined}
        >
          {title}
        </h2>
      </header>
      {mode === "compact" && children ? <div className="pd-story-body">{children}</div> : null}
    </div>
  );
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

export function SlideEra({ step }: PitchSlideProps) {
  return (
    <StoryShell
      step={step}
      heroUntil={0}
      className="pd-era"
      intro={<PitchInstitutionIntro />}
      hideKickerOnCompact
      kicker="Feria empresarial"
      title={
        <>
          Una nueva <span className="pd-era-accent">era</span>
        </>
      }
      large
    >
      <p className={`${shown(step, 1)} pd-lede pd-lede-center pd-lede-era-main`}>
        La inteligencia artificial entra en el trabajo cotidiano de una empresa. No como magia: como una forma de
        ordenar lo que ya ocurre.
      </p>
      <p className={`${shown(step, 2)} pd-era-foot pd-lede-center pd-text-marked`}>
        Hoy mostramos cómo pasan los <strong>datos</strong> a una <strong>lectura clara</strong> y luego a una{" "}
        <strong>decisión</strong> que ustedes confirman.
      </p>
      <div className={`pd-era-field ${shown(step, 3)}`} aria-hidden={step < 3}>
        <div className="pd-era-story">
          {pitchEraPillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className={`pd-era-card pd-era-card-pop ${shown(step, 3 + index)}`}
              style={{ "--d": `${index * 0.14}s` } as CSSProperties}
            >
              <span className="pd-era-card-num">0{index + 1}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
      </div>
    </StoryShell>
  );
}

export function SlideWhat({ step }: PitchSlideProps) {
  const nodes = [
    { title: "Datos", text: "Ventas, mensajes, inventario: lo que la operación ya registra." },
    { title: "Patrones", text: "Lo que se repite y cuesta ver a tiempo en cuadernos o chats." },
    { title: "Criterio", text: "La decisión final la toma quien conoce el negocio." },
  ];
  const split = step >= 5;
  return (
    <StoryShell
      step={step}
      heroUntil={0}
      className="pd-what"
      kicker="Concepto"
      title={
        <>
          Qué es
          <span className="pd-title-accent-block">la inteligencia artificial</span>
        </>
      }
    >
      <div className={`pd-what-flow ${split ? "is-split" : ""}`}>
        <p className={`${shown(step, 1)} pd-lede pd-lede-center pd-what-def`}>
          Es una herramienta que aprende de ejemplos para proponer un siguiente paso. No conoce la empresa si nadie le
          cuenta su situación.
        </p>
        <ul className={`pd-friendly-list pd-what-examples ${split ? "is-side" : ""}`}>
          {pitchWhatExamples.map((line, exampleIndex) => (
            <li key={line} className={shown(step, 2 + exampleIndex)}>
              {line}
            </li>
          ))}
        </ul>
        <div className={`pd-what-diagram ${shown(step, 5)}`} aria-hidden={step < 5}>
          <div className="pd-what-ia-hub">
            <span className="pd-what-ia-mark">IA</span>
            <p>Lee datos y patrones; la propuesta la valida quien conoce el negocio.</p>
          </div>
          <ol className="pd-what-pipeline">
            {nodes.map((node, index) => (
              <li key={node.title} className={shown(step, 5)} style={{ "--d": `${0.1 * index}s` } as CSSProperties}>
                <article>
                  <span className="pd-what-pipeline-num">0{index + 1}</span>
                  <h3>{node.title}</h3>
                  <p>{node.text}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
        <p className={`${shown(step, 6)} pd-aside pd-lede-center`}>Sirve para explicar una idea. No sustituye la explicación.</p>
      </div>
    </StoryShell>
  );
}

export function SlideHow({ step }: PitchSlideProps) {
  const activeStep = step >= 3 ? 3 : step >= 2 ? 2 : step >= 1 ? 1 : 0;
  const runnerLeft = activeStep <= 1 ? "8%" : activeStep === 2 ? "50%" : "92%";
  return (
    <StoryShell step={step} heroUntil={0} className="pd-how" kicker="Proceso" title="Cómo funciona">
      <p className={`${shown(step, 1)} pd-lede pd-lede-center`}>
        Tres pasos en cadena: lo que entra, lo que ordena la herramienta y lo que sale para decidir.
      </p>
      <div
        className={`pd-how-track ${shown(step, 1)}`}
        data-active={activeStep}
        aria-label="Recorrido entrada, proceso y resultado"
      >
        <div className="pd-how-rail" aria-hidden="true">
          <span className="pd-how-rail-fill" style={{ width: `${(activeStep / 3) * 100}%` }} />
          <span
            className="pd-how-runner"
            style={{ left: runnerLeft }}
          />
        </div>
        <ol className="pd-flow pd-flow-journey">
          {pitchFlow.map((item, index) => (
            <li
              key={item.title}
              className={`${shown(step, index + 1)} ${step >= index + 1 ? "is-active" : ""}`.trim()}
              style={{ "--d": `${index * 0.12}s` } as CSSProperties}
            >
              <span className="pd-flow-index">0{index + 1}</span>
              <p className="pd-flow-step-label">
                {index === 0 ? "Entrada" : index === 1 ? "Proceso" : "Resultado"}
              </p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <p className="pd-flow-example">
                {index === 0 && "Ej.: mensajes de clientes y pedidos del día."}
                {index === 1 && "Ej.: agrupar lo repetido y señalar un hueco."}
                {index === 2 && "Ej.: «conviene llamar a estos tres clientes»."}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </StoryShell>
  );
}

export function SlideData({ step }: PitchSlideProps) {
  const barExplain = [
    { label: "Consultas", plain: "Personas que preguntaron", value: 72 },
    { label: "Seguimiento", plain: "A quienes se les respondió después", value: 46 },
    { label: "Cierres", plain: "Ventas concretadas al final", value: 28 },
  ] as const;

  return (
    <StoryShell
      step={step}
      heroUntil={0}
      className="pd-data"
      kicker="Ejemplo ilustrativo"
      title="De los datos a las decisiones"
    >
      <div className="pd-data-stack">
        <p className={`${shown(step, 1)} pd-lede pd-lede-center`}>
          Números inventados: la pregunta es dónde se pierde gente entre el interés y el cierre.
        </p>
        <div className={`pd-funnel-formula pd-funnel-row ${shown(step, 1)}`} aria-label="Embudo ilustrativo">
          {barExplain.map((bar, barIndex) => (
            <span key={bar.label} className={`pd-funnel-step ${shown(step, 2 + barIndex)}`}>
              <b>{bar.value}</b>
              <small>{bar.label}</small>
              {barIndex < barExplain.length - 1 ? <span className="pd-funnel-op" aria-hidden="true">→</span> : null}
            </span>
          ))}
        </div>
        <figure
          className={`pd-chart-panel ${shown(step, 2)}`}
          aria-label="Gráfico ilustrativo. Valores ficticios de consultas, seguimiento y cierres."
        >
          <figcaption className="pd-chart-caption">
            <span className="pd-kicker">Gráfico de ejemplo</span>
            <p>Cada barra = personas en una etapa (números de muestra, no reales).</p>
          </figcaption>
          <div className="pd-chart">
            {barExplain.map((bar, barIndex) => (
              <div key={bar.label} className={`pd-bar ${shown(step, 2 + barIndex)}`}>
                <div className="pd-bar-track">
                  <span className={step >= 2 + barIndex ? "is-grown" : undefined} style={{ height: `${bar.value}%` }} />
                </div>
                <b>{bar.value}</b>
                <span className="pd-bar-label">{bar.label}</span>
                <span className="pd-bar-plain">{bar.plain}</span>
              </div>
            ))}
          </div>
        </figure>
        <p className={`${shown(step, 5)} pd-data-hook pd-lede-center`}>
          <strong>Qué haríamos mañana:</strong> revisar el seguimiento antes que cualquier otra cosa.
        </p>
      </div>
    </StoryShell>
  );
}

export function SlideSectors({ step }: PitchSlideProps) {
  return (
    <StoryShell step={step} heroUntil={0} className="pd-sectors" kicker="Tres sectores" title="La IA en el mundo empresarial">
      <p className={`${shown(step, 1)} pd-lede pd-lede-center`}>Mismo método, distintos datos: turismo, metalurgia y agro.</p>
      <div className={`pd-sector-grid ${shown(step, 2)}`}>
        {pitchSectors.map((sector, index) => (
          <article
            key={sector.id}
            className={`pd-sector pd-sector-${sector.id} pd-beat is-shown`}
            style={{ "--d": `${index * 0.1}s` } as CSSProperties}
          >
            <div className="pd-sector-ribbon" aria-hidden="true" />
            <h3>{sector.title}</h3>
            <dl className="pd-sector-facts">
              <div>
                <dt>Problema</dt>
                <dd>{sector.problem}</dd>
              </div>
              <div>
                <dt>Oportunidad</dt>
                <dd>{sector.opportunity}</dd>
              </div>
              <div>
                <dt>Aplicación</dt>
                <dd>{sector.application}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </StoryShell>
  );
}

export function SlideVideo({ videoRef, videoActive }: PitchSlideProps) {
  return (
    <div className="pd-inner pd-video pd-video-only">
      <VideoStage ref={videoRef} active={videoActive} />
    </div>
  );
}

export function SlideNextStepIntro() {
  return (
    <div className="pd-inner pd-story pd-next-intro pd-story--hero pd-story--center-block">
      <header className="pd-story-head pd-story-head--center">
        <p className="pd-kicker pd-rise">Paso a seguir</p>
        <h2 className="pd-display pd-display-sm pd-rise" style={{ "--d": "0.12s" } as CSSProperties}>
          Qué sigue
        </h2>
      </header>
      <p className="pd-lede pd-lede-center pd-next-intro-lede pd-rise" style={{ "--d": "0.28s" } as CSSProperties}>
        Después de la demostración, las empresas de la feria pueden contratar mentorías del Departamento de Matemáticas
        con condiciones especiales.
      </p>
    </div>
  );
}

export function SlideNextStepPlan({ step }: PitchSlideProps) {
  return (
    <StoryShell step={step} heroUntil={0} className="pd-next-step" kicker="Paso a seguir" title="Pasos en feria">
      <div className={`pd-next-layout ${shown(step, 1)}`}>
        <ol className="pd-next-phases">
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
        <div className={`pd-next-visual ${shown(step, 2)}`}>
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
    </StoryShell>
  );
}

export function SlideOffer({ step }: PitchSlideProps) {
  const showLede = step === 1;
  return (
    <StoryShell step={step} heroUntil={0} className="pd-offer" kicker="Feria" title="Oferta adicional">
      {showLede ? (
        <p className={`${shown(step, 1)} pd-lede pd-lede-center pd-offer-lede`}>
          Dos mentorías ya definidas. Elijan la que mejor encaje con el reto; abajo, qué se lleva cada una.
        </p>
      ) : null}
      <div className="pd-offer-grid">
        {pitchMentorshipOffers.map((offer, index) => (
          <article
            key={offer.title}
            className={`pd-offer-card pd-offer-card-${offer.icon} ${shown(step, index + 2)}`}
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
            <dl className="pd-offer-meta">
              <div>
                <dt>Para quién</dt>
                <dd>{offer.audience}</dd>
              </div>
              <div>
                <dt>Formato</dt>
                <dd>{offer.format}</dd>
              </div>
            </dl>
            <ul className={`pd-offer-outcomes ${shown(step, index + 2)}`}>
              {offer.outcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className={`${shown(step, 4)} pd-offer-footer pd-lede-center`}>{pitchOfferFooter}</p>
    </StoryShell>
  );
}

export function SlideCustomCourses({ step }: PitchSlideProps) {
  return (
    <StoryShell step={step} heroUntil={0} className="pd-custom" kicker="A la medida" title="Cursos a la medida">
      <p className={`${shown(step, 1)} pd-lede pd-lede-center pd-custom-lede`}>
        Si el reto no encaja en una mentoría cerrada, se diseña un curso con temas y <strong>horas distintas</strong>{" "}
        según lo que la empresa necesite.
      </p>
      <div className={`pd-custom-layout ${shown(step, 1)}`}>
        <div className="pd-custom-pillars">
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
    </StoryShell>
  );
}

export function SlideClose({ step }: PitchSlideProps) {
  return (
    <StoryShell step={step} heroUntil={0} className="pd-close" kicker="Muchas gracias" title="De la idea a la acción" large>
      <p className={`${shown(step, 1)} pd-lede pd-lede-center`}>
        La presentación muestra el mapa. El stand deja que cada visitante pruebe una lectura con su propio caso.
      </p>
      <blockquote className={`${shown(step, 1)} pd-close-quote`}>
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
    </StoryShell>
  );
}

export const slideViews = [
  SlideEra,
  SlideWhat,
  SlideHow,
  SlideData,
  SlideSectors,
  SlideVideo,
  SlideNextStepIntro,
  SlideNextStepPlan,
  SlideOffer,
  SlideCustomCourses,
  SlideClose,
] as const;
