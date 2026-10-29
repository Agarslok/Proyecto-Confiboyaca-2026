"use client";

import { useWalkthrough } from "@/components/layout/useWalkthrough";
import { Button } from "@/components/ui/Button";

export function DiagnosisScreen({
  formHref = "/diagnostico",
  demoHref = "/demo",
}: {
  formHref?: string;
  demoHref?: string;
}) {
  const state = useWalkthrough();
  const diagnosis = state.diagnosis;

  if (!diagnosis) {
    return (
      <section className="panel empty-state">
        <p className="kicker">Diagnóstico</p>
        <h1>Aún no hay un resultado</h1>
        <p>
          Complete el formulario para generar una lectura a partir de las respuestas. Si ya lo
          hizo y luego cambió algún dato, hay que generarlo de nuevo.
        </p>
        <Button href={formHref}>Ir al formulario</Button>
      </section>
    );
  }

  return (
    <article className="result">
      <p className="kicker">
        {diagnosis.industryName} · versión {diagnosis.templateVersion}
      </p>
      <h1>{diagnosis.companyName}</h1>
      <p className="result-problem">{diagnosis.primaryProblemLabel}</p>
      <p className={diagnosis.signal === "insuficiente" ? "callout callout-warn" : "callout"}>
        {diagnosis.signal === "insuficiente"
          ? "Señal insuficiente para un hallazgo cerrado. Lo que sigue es una hipótesis."
          : "Señal clara según lo declarado. No es una medición de la operación."}
      </p>
      <p className="lede">{diagnosis.summary}</p>

      <section>
        <h2>Por qué esta lectura</h2>
        <ul className="evidence">
          {diagnosis.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>{diagnosis.solutionTitle}</h2>
        <p>{diagnosis.solutionSummary}</p>
        <ol className="numbered">
          {diagnosis.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Oportunidades por validar</h2>
        <ul className="benefit-list">
          {diagnosis.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Límites de esta lectura</h2>
        <ul className="evidence">
          {diagnosis.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ul className="assumptions">
          {diagnosis.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="actions">
        <Button href={demoHref}>Abrir la demostración de {diagnosis.demoTitle.toLowerCase()}</Button>
        <Button href={formHref} variant="secondary">
          Corregir respuestas
        </Button>
      </div>
    </article>
  );
}
