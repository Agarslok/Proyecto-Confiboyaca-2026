"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DIMENSIONS, INDUSTRIES, LINKS } from "@/lib/radar/bank";
import { coreQuestions, nicheSummary } from "@/lib/radar/engine";
import type { RadarQuestion } from "@/lib/radar/types";
import { templateLabel } from "@/lib/site/select-template";

const LETTERS = ["A", "B", "C", "D"];

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function dimensionLabel(question: RadarQuestion): string {
  return DIMENSIONS.find((dimension) => dimension.id === question.dimension)?.short ?? "";
}

function QuestionList({ questions }: { questions: RadarQuestion[] }) {
  return (
    <ol className="niche-questions">
      {questions.map((question) => (
        <li key={question.id}>
          <p className="niche-q-text">
            {question.text}
            <span className="niche-q-dim">{dimensionLabel(question)}</span>
            {question.showIf ? <span className="niche-q-cond">condicional</span> : null}
          </p>
          <ul className="niche-q-options">
            {question.options.map((option, index) => (
              <li key={option}>
                <span className="radar-key" aria-hidden="true">{LETTERS[index]}</span>
                <span>{option}</span>
                <span className="fine">{index} pts</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function NicheCatalog() {
  const [query, setQuery] = useState("");
  const core = useMemo(() => coreQuestions(), []);
  const term = normalize(query.trim());

  const industries = INDUSTRIES.map((industry) => ({
    industry,
    activities: industry.activities.filter(
      (activity) =>
        !term ||
        normalize(`${industry.label} ${activity.label} ${activity.description}`).includes(term),
    ),
  })).filter((entry) => entry.activities.length > 0);

  return (
    <section className="wrap niche-catalog">
      <header className="consultoria-report-head">
        <p className="micro accent">Radar IA · catálogo</p>
        <h1 className="display niche-title">Encuestas por nicho</h1>
        <p className="lead sm">
          Elija el nicho de la empresa y aplique la encuesta directamente. Todas las empresas responden las mismas
          {" "}{core.length} preguntas de madurez; lo que cambia por nicho son las preguntas de «Su negocio», el
          vocabulario, los casos y el diseño de la página.
        </p>
      </header>

      <div className="field niche-search">
        <label className="q-help" htmlFor="niche-search">Buscar nicho</label>
        <input
          id="niche-search"
          className="text-in sm"
          type="search"
          placeholder="Ej. hotel, minería, panadería, farmacia…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <details className="card niche-core">
        <summary>
          <strong>Preguntas comunes a todos los nichos ({core.length})</strong>
          <span className="fine"> Datos · Tecnología · Analítica e IA · Equipo · Estrategia</span>
        </summary>
        <QuestionList questions={core} />
      </details>

      {industries.length === 0 ? <p className="lead sm">Ningún nicho coincide con «{query}».</p> : null}

      {industries.map(({ industry, activities }) => (
        <section key={industry.id} className="niche-industry" aria-labelledby={`niche-${industry.id}`}>
          <h2 id={`niche-${industry.id}`}>
            <span aria-hidden="true">{industry.icon}</span> {industry.label}
            <span className="fine"> · página: plantilla {templateLabel(industry.template)}</span>
          </h2>
          <div className="niche-grid">
            {activities.map((activity) => {
              const summary = nicheSummary(industry.id, activity.id);
              return (
                <article key={activity.id} className="card niche-card">
                  <p className="radar-case-kind">{LINKS[activity.link]}</p>
                  <h3>{activity.label}</h3>
                  <p className="fine">{activity.description}</p>
                  <p className="niche-count">
                    {summary.shortest === summary.longest ? summary.shortest : `${summary.shortest}–${summary.longest}`} pantallas ·{" "}
                    {summary.questions.length} preguntas propias
                  </p>
                  <details className="niche-detail">
                    <summary>Ver preguntas del nicho</summary>
                    <QuestionList questions={summary.questions} />
                    <p className="fine">Más las {core.length} preguntas comunes, con el vocabulario de este nicho.</p>
                  </details>
                  <Button href={`/diagnostico?nicho=${activity.id}`} className="btn-sm">
                    Aplicar encuesta
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
