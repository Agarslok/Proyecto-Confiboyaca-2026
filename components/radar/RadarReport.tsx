"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRadarSolution } from "@/app/actions/radar";
import { CaseSpark } from "@/components/radar/CaseSpark";
import { RadarChart } from "@/components/radar/RadarChart";
import { InterestButton } from "@/components/radar/InterestButton";
import { SolutionPresentationBadge } from "@/components/radar/SolutionPresentationBadge";
import { SolutionQr } from "@/components/radar/SolutionQr";
import { useSite } from "@/components/site/useSite";
import { Button } from "@/components/ui/Button";
import { COURSES, DIMENSIONS, LEVELS, PLANS } from "@/lib/radar/bank";
import { patchRadar, radarOf } from "@/lib/radar/store";
import { applySolutionToSiteSession } from "@/lib/site/apply-solution-session";
import { samplePageHref, solutionPresentationBadge } from "@/lib/site/solution-presentation";
import { SOLUTION_GUIDE_LIMITS_SUMMARY, SOLUTION_LIMITS_SUMMARY } from "@/lib/radar/solution-limits";
import type { Finding, RadarResult } from "@/lib/radar/types";
import type { SiteConfig } from "@/types/site";

const SEVERITY: Record<Finding["severity"], string> = {
  critico: "Crítico",
  mejorable: "Mejorable",
  confirmar: "Por confirmar",
};

const KIND: Record<RadarResult["cases"][number]["kind"], string> = {
  industria: "De su industria",
  eslabon: "De su eslabón",
  transversal: "Transversal",
};

function Gauge({ index, level }: { index: number; level: RadarResult["level"] }) {
  const radius = 80;
  const length = Math.PI * radius;
  return (
    <svg className={`radar-gauge is-${level}`} viewBox="0 0 200 112" aria-hidden="true">
      <path className="radar-gauge-track" d="M20,100 A80,80 0 0 1 180,100" />
      <path
        className="radar-gauge-fill"
        d="M20,100 A80,80 0 0 1 180,100"
        style={{ strokeDasharray: length, strokeDashoffset: length * (1 - index / 100) }}
      />
      {[35, 62].map((cut) => {
        const angle = Math.PI * (1 - cut / 100);
        return (
          <line
            key={cut}
            className="radar-gauge-cut"
            x1={100 + Math.cos(angle) * 70}
            y1={100 - Math.sin(angle) * 70}
            x2={100 + Math.cos(angle) * 92}
            y2={100 - Math.sin(angle) * 92}
          />
        );
      })}
    </svg>
  );
}

function RegenerarSolution() {
  const radar = radarOf(useSite());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!radar.recordId || !radar.editToken) return null;
  return (
    <button
      type="button"
      className="link-btn"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        setDone(false);
        void createRadarSolution(radar.recordId!, radar.editToken!, true)
          .then((result) => {
            if (result.ok) applySolutionToSiteSession(result.spec);
            setDone(result.ok);
          })
          .finally(() => setBusy(false));
      }}
    >
      {busy ? "Regenerando la solución…" : done ? "Solución actualizada" : "Regenerar la solución de la página"}
    </button>
  );
}

export function RadarReport({ config }: { config: SiteConfig & { radar: RadarResult } }) {
  const router = useRouter();
  const recordCode = radarOf(useSite()).recordCode;
  const result = config.radar;
  const level = LEVELS[result.level];
  const [allFindings, setAllFindings] = useState(false);
  const findings = allFindings ? result.findings : result.findings.slice(0, 5);
  const critical = result.findings.filter((finding) => finding.severity === "critico").length;
  const plan = PLANS[result.plan];
  const effort = result.effort;
  const nextPlan = result.nextPlan ? PLANS[result.nextPlan] : null;
  const solutionBadge = solutionPresentationBadge(config.solution, result.presentation);
  const pageHref = samplePageHref(recordCode);
  /* El curso de 12 h de IA generativa queda como opción, no como la solución. */
  const course = COURSES.find((item) => item.title.startsWith("IA generativa")) ?? null;

  return (
    <article className="wrap radar-report">
      <header className="consultoria-report-head">
        <h1 className="consultoria-report-title">
          <span className="consultoria-report-kicker">Radar IA · diagnóstico para</span>
          <span className="consultoria-report-name display">{config.companyName}</span>
        </h1>
        <p className="radar-chips">
          <span className="tag">{result.industryLabel}</span>
          <span className="tag">{result.activityLabel}</span>
          <span className="tag">Eslabón: {result.linkLabel.toLowerCase()}</span>
          {result.sizeLabel ? <span className="tag">{result.sizeLabel}</span> : null}
          {solutionBadge ? <SolutionPresentationBadge badge={solutionBadge} /> : null}
        </p>
        <p className="fine radar-saved" role="status">
          {recordCode ? (
            <>Guardado · código <strong>{recordCode}</strong>. El equipo puede abrirlo de nuevo desde el panel de consultores.</>
          ) : recordCode === "" ? (
            "No se pudo guardar en el servidor. El diagnóstico sigue disponible en este navegador."
          ) : (
            "Guardando el diagnóstico…"
          )}
        </p>
        <p className="fine radar-limits">{SOLUTION_LIMITS_SUMMARY} {SOLUTION_GUIDE_LIMITS_SUMMARY}</p>
      </header>

      <section className="radar-hero">
        <div className={`card radar-score is-${result.level}`}>
          <p className="micro">Índice de madurez en datos e IA</p>
          <div className="radar-score-dial">
            <Gauge index={result.index} level={result.level} />
            <p className="radar-score-num display">{result.index}<span>/100</span></p>
          </div>
          <p className={`radar-level is-${result.level}`}>
            <span aria-hidden="true">{level.icon}</span> {level.label}
          </p>
          <p className="radar-reading">{level.reading}</p>
          <p className="fine">Enfoque recomendado: {level.focus}.</p>
          {result.levelNote ? <p className="radar-level-note">{result.levelNote}</p> : null}
          <p className="fine">
            {result.questionsAnswered} respuestas · {result.findings.length} hallazgos ({critical} críticos)
            {result.unsure ? ` · ${result.unsure} por confirmar` : ""}
          </p>
        </div>

        <div className="card radar-shape">
          <p className="micro">Las 6 dimensiones</p>
          <RadarChart dimensions={result.dimensions} size={250} showValues />
        </div>
      </section>

      {result.central ? (
        <section className="card radar-central" aria-labelledby="radar-central-title">
          <div>
            <p className="micro accent">Problema central · {result.central.dimensionLabel}</p>
            <h2 id="radar-central-title">{result.central.problem}</h2>
            <p className="fine">Está en la dimensión donde la empresa pierde más puntos del índice. La página web generada se enfoca en resolverlo.</p>
          </div>
          <div className="radar-central-fix">
            <p className="micro">Solución en su página</p>
            <p className="radar-central-name">{result.central.name}</p>
            <p className="fine">En el hueco bajo la portada verá {solutionBadge?.tone === "asistente" ? "un asistente virtual de demostración" : "un módulo interactivo de demostración"}.</p>
            <Button href={pageHref} target="_blank" rel="noopener noreferrer" variant="ghost" className="btn-sm">
              Ver la página
            </Button>
          </div>
        </section>
      ) : null}

      <section className="card radar-dims" aria-labelledby="radar-dims-title">
        <h2 id="radar-dims-title">Puntaje por dimensión</h2>
        <ul>
          {result.dimensions.map((dimension) => {
            const meta = DIMENSIONS.find((item) => item.id === dimension.id)!;
            return (
              <li key={dimension.id}>
                <span className="radar-dim-name">{meta.label}</span>
                <span className="radar-dim-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(2, dimension.score)}%` }} />
                </span>
                <span className="radar-dim-score">{dimension.score}</span>
                <span className="fine radar-dim-weight">peso {Math.round(dimension.weight * 100)} %</span>
              </li>
            );
          })}
        </ul>
      </section>

      {result.findings.length ? (
        <section className="card radar-findings" aria-labelledby="radar-findings-title">
          <h2 id="radar-findings-title">Hallazgos</h2>
          <p className="fine">Ordenados por gravedad y por cuánto pesa la pregunta en el índice.</p>
          <ol>
            {findings.map((finding) => (
              <li key={finding.questionId} className={`is-${finding.severity}`}>
                <span className="radar-finding-tag">{SEVERITY[finding.severity]}</span>
                <span>{finding.text}</span>
              </li>
            ))}
          </ol>
          {result.findings.length > 5 ? (
            <button type="button" className="link-btn" onClick={() => setAllFindings(!allFindings)}>
              {allFindings ? "Ver menos" : `Ver los ${result.findings.length} hallazgos`}
            </button>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="radar-cases-title">
        <h2 id="radar-cases-title" className="radar-section-title">Casos para empezar</h2>
        <p className="fine">
          {result.firstSteps
            ? "Primero, pasos muy sencillos que dejamos montados en su celular; después, los de su industria. Abra cada uno para ver cómo lo tiene hoy y cómo quedaría."
            : "Seis casos de su nivel, primero los de su industria y su eslabón, priorizados por sus objetivos. Abra cada uno para ver cómo tiene hoy el dato y cómo debería tenerlo."}
        </p>
        <div className="radar-cases">
          {result.cases.map((item) => (
            <Link key={item.id} href={`/caso/${item.id}`} className={item.forSmall ? "card radar-case is-small" : "card radar-case"}>
              <p className="radar-case-kind">{item.forSmall ? "Primer paso · se lo dejamos montado" : KIND[item.kind]}</p>
              <h3>{item.title}</h3>
              {item.forSmall ? (
                <>
                  <p className="radar-case-tech"><strong>Nosotros:</strong> {item.doneForYou}</p>
                  <p className="radar-case-effort"><strong>Usted:</strong> {item.ownerEffort}</p>
                </>
              ) : (
                <>
                  <p className="radar-case-tech">{item.technique}</p>
                  <CaseSpark item={item} />
                </>
              )}
              <span className="radar-case-more">Ver hoy vs. cómo debería ser →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card radar-mentoring" aria-labelledby="radar-mentoring-title">
        <div>
          <p className="micro accent">Acompañamiento por horas · se lo dejamos funcionando</p>
          <h2 id="radar-mentoring-title">{plan.name}: entre {effort.range[0]} y {effort.range[1]} horas</h2>
          <p className="radar-mentoring-promise">{plan.promise}</p>
          <p className="radar-mentoring-facts">
            <span><strong>≈ {effort.months} {effort.months === 1 ? "mes" : "meses"}</strong> de trabajo</span>
            <span><strong>{effort.visits} visitas</strong> a su negocio</span>
            <span>Dentro del sistema de su empresa</span>
          </p>
          <ul className="radar-mentoring-list">
            {plan.includes.map((line, index) => (
              <li key={line}>{index === 1 && result.central ? `Montamos ${result.central.name.toLowerCase()} y los primeros pasos` : line}</li>
            ))}
          </ul>
        </div>
        <div className="radar-mentoring-side">
          <h3>Horas por fase</h3>
          <ol className="radar-phases">
            {effort.phases.map((phase) => (
              <li key={phase.name}>
                <span>{phase.name}</span>
                <strong>{phase.hours} h</strong>
              </li>
            ))}
            <li className="is-total"><span>Total estimado</span><strong>{effort.total} h</strong></li>
          </ol>
          <p className="fine">Estimación según el tamaño de su empresa y cómo tiene hoy la información. Se confirma en la primera visita.</p>
          {nextPlan ? <p className="fine">Después, si quiere seguir: {nextPlan.name}.</p> : null}
          {course ? (
            <p className="radar-mentoring-course">
              <span className="fine">Opcional, si quiere que su equipo aprenda:</span>
              {course.title} · {course.hours} h · {course.mode.toLowerCase()}
            </p>
          ) : null}
        </div>
      </section>

      <section className="card radar-closing" aria-labelledby="radar-closing-title">
        <div>
          <p className="micro accent">Siguiente paso</p>
          <h2 id="radar-closing-title">Déjenos su número y nos contactaremos con usted</h2>
          <p className="lead sm">
            Confirme su celular o WhatsApp. Le escribimos para agendar la primera visita a {config.companyName}, sin costo
            ni compromiso.
          </p>
          <InterestButton plan={plan.name} />
        </div>
        <div className="radar-closing-side">
          <SolutionQr code={recordCode} />
          <Button
            href={pageHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            className="btn-block"
          >
            Ver la página
          </Button>
          <Button href="/flyer" variant="ghost" className="btn-block">Descargar el resumen en PDF</Button>
          <RegenerarSolution />
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              patchRadar({ cursor: 0 });
              router.push("/diagnostico");
            }}
          >
            Editar respuestas
          </button>
        </div>
      </section>
    </article>
  );
}
