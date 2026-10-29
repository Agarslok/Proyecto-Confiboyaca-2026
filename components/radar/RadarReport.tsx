"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaseSpark } from "@/components/radar/CaseSpark";
import { RadarChart } from "@/components/radar/RadarChart";
import { ConsultoriaQr } from "@/components/site/ConsultoriaQr";
import { Button } from "@/components/ui/Button";
import { COURSES, DIMENSIONS, LEVELS, ROUTES } from "@/lib/radar/bank";
import { patchRadar } from "@/lib/radar/store";
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

export function RadarReport({ config }: { config: SiteConfig & { radar: RadarResult } }) {
  const router = useRouter();
  const result = config.radar;
  const level = LEVELS[result.level];
  const [allFindings, setAllFindings] = useState(false);
  const findings = allFindings ? result.findings : result.findings.slice(0, 5);
  const critical = result.findings.filter((finding) => finding.severity === "critico").length;
  const courses = COURSES.filter((course) => course.levels.includes(result.level));

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
        </p>
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
            <Button href="/sitio#solucion-consultoria" target="_blank" rel="noopener noreferrer" variant="ghost" className="btn-sm">
              Ver cómo lo resuelve
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
        <p className="fine">Seis casos de su nivel, primero los de su industria y su eslabón, priorizados por sus objetivos. Abra cada uno para ver cómo tiene hoy el dato y cómo debería tenerlo.</p>
        <div className="radar-cases">
          {result.cases.map((item) => (
            <Link key={item.id} href={`/caso/${item.id}`} className="card radar-case">
              <p className="radar-case-kind">{KIND[item.kind]}</p>
              <h3>{item.title}</h3>
              <p className="radar-case-tech">{item.technique}</p>
              <CaseSpark item={item} />
              <span className="radar-case-more">Ver hoy vs. cómo debería ser →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="radar-plan">
        <div className="card">
          <h2>Ruta de 12 meses</h2>
          <ol className="radar-route">
            {ROUTES[result.level].map((stage) => (
              <li key={stage.title}>
                <span className="fine">{stage.when}</span>
                <strong>{stage.title}</strong>
              </li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h2>Formación recomendada</h2>
          <ul className="radar-courses">
            {courses.map((course) => (
              <li key={course.title}>
                <span>{course.title}</span>
                <span className="fine">{course.hours} h · {course.mode}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="consultoria-cta card" aria-label="Acceso a su página web">
        <div className="consultoria-cta-block">
          <h3>Conozca su página</h3>
          <ConsultoriaQr siteId={config.id} />
        </div>
        <div className="consultoria-cta-block is-visit">
          <h3>Su página, con el estilo de su sector</h3>
          <p className="fine">Plantilla {config.templateLabel}, con textos para {result.activityLabel.toLowerCase()}. Se abre en una pestaña nueva.</p>
          <Button href="/sitio" target="_blank" rel="noopener noreferrer" className="btn-block">
            Ver mi página web
          </Button>
        </div>
      </section>

      <div className="consultoria-report-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            patchRadar({ cursor: 0 });
            router.push("/diagnostico");
          }}
        >
          Editar respuestas
        </Button>
      </div>
    </article>
  );
}
