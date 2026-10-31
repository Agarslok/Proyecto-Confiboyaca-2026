"use client";

import Link from "next/link";
import { RadarChart } from "@/components/radar/RadarChart";
import { useSite } from "@/components/site/useSite";
import { LEVELS, PLANS } from "@/lib/radar/bank";
import { radarOf } from "@/lib/radar/store";

/* ============================================================================
   Flyer de una página (A4) con el diagnóstico. «Descargar PDF» usa el
   diálogo de impresión del navegador («Guardar como PDF»): no necesita
   librerías y el texto queda seleccionable.
   ========================================================================== */

export function RadarFlyer() {
  const state = useSite();
  const config = state.config;
  const result = config?.radar;
  const answers = radarOf(state);

  if (!config || !result) {
    return (
      <main className="flyer-empty">
        <h1>No hay un diagnóstico para imprimir</h1>
        <p>Complete la encuesta o abra un diagnóstico desde el panel de consultores.</p>
        <Link href="/diagnostico">Ir a la encuesta</Link>
      </main>
    );
  }

  const level = LEVELS[result.level];
  const today = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  const top = result.findings.filter((finding) => finding.text !== result.central?.problem).slice(0, 3);

  return (
    <div className="flyer-page">
      <div className="flyer-toolbar">
        <Link href="/resultado">← Volver al diagnóstico</Link>
        <button type="button" onClick={() => window.print()}>Descargar PDF</button>
        <span>En el diálogo elija «Guardar como PDF» y tamaño A4.</span>
      </div>

      <article className="flyer">
        <header className="flyer-head">
          <div>
            <p className="flyer-kicker">Radar IA · Diagnóstico de madurez en datos e IA</p>
            <h1>{config.companyName}</h1>
            <p className="flyer-meta">{[result.industryLabel, result.activityLabel, answers.city].filter(Boolean).join(" · ")}</p>
          </div>
          <div className={`flyer-score is-${result.level}`}>
            <strong>{result.index}</strong>
            <span>de 100</span>
            <em>{level.icon} {level.label}</em>
          </div>
        </header>

        <section className="flyer-row">
          <div className="flyer-radar">
            <RadarChart dimensions={result.dimensions} size={210} showValues />
          </div>
          <div className="flyer-reading">
            <h2>{level.reading}</h2>
            <p>Enfoque recomendado: {level.focus.toLowerCase()}.</p>
            {result.central ? (
              <div className="flyer-central">
                <span>Problema central · {result.central.dimensionLabel}</span>
                <p>{result.central.problem}</p>
                <p className="flyer-fix">Solución propuesta: <strong>{result.central.name}</strong></p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="flyer-cols">
          <div>
            <h3>Otros hallazgos</h3>
            <ul>{top.map((finding) => <li key={finding.questionId}>{finding.text}</li>)}</ul>
          </div>
          <div>
            <h3>Casos para empezar</h3>
            <ul>{result.cases.slice(0, 3).map((item) => <li key={item.id}><strong>{item.title}.</strong> {item.technique}</li>)}</ul>
          </div>
        </section>

        <section className="flyer-plan">
          <div>
            <span>Acompañamiento recomendado</span>
            <strong>{PLANS[result.plan].name} · {result.effort.range[0]}–{result.effort.range[1]} horas</strong>
            <p>{PLANS[result.plan].promise}</p>
          </div>
          <p>≈ {result.effort.months} {result.effort.months === 1 ? "mes" : "meses"} · {result.effort.visits} visitas a su negocio</p>
        </section>

        <section className="flyer-route">
          <h3>Horas por fase</h3>
          <ol>
            {result.effort.phases.slice(0, 6).map((phase) => (
              <li key={phase.name}><span>{phase.hours} h</span>{phase.name}</li>
            ))}
          </ol>
        </section>

        <footer className="flyer-foot">
          <div className="flyer-code">
            <span>Código del diagnóstico</span>
            <strong>{answers.recordCode ?? "Sin guardar"}</strong>
            <span>Cítelo para revisar su diagnóstico con el equipo.</span>
          </div>
          <p>
            Universidad Externado de Colombia · Departamento de Matemáticas<br />
            Generado el {today}
          </p>
        </footer>
      </article>
    </div>
  );
}
