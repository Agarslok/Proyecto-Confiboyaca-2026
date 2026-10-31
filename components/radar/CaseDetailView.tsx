"use client";

import { CaseSpark } from "@/components/radar/CaseSpark";
import { useSite } from "@/components/site/useSite";
import { Button } from "@/components/ui/Button";
import { COURSES, LEVELS } from "@/lib/radar/bank";
import { caseDetail } from "@/lib/radar/case-details";
import { CASES } from "@/lib/radar/cases";
import { radarOf } from "@/lib/radar/store";

const KIND = { industria: "Caso de su industria", eslabon: "Caso de su eslabón", transversal: "Caso transversal" } as const;

export function CaseDetailView({ id }: { id: string }) {
  const state = useSite();
  const item = CASES.find((entry) => entry.id === id);
  const answers = radarOf(state);
  const result = state.config?.radar;

  if (!item) {
    return (
      <section className="wrap empty-state">
        <h1 className="display r-title">Ese caso no existe</h1>
        <Button href="/resultado">Volver al diagnóstico</Button>
      </section>
    );
  }

  const detail = caseDetail(item, answers);
  const level = result ? LEVELS[result.level] : null;
  const course = COURSES.find((entry) => result && entry.levels.includes(result.level) && entry.levels.length < 3) ?? COURSES[COURSES.length - 1];

  return (
    <article className="wrap radar-report case-detail">
      <header className="consultoria-report-head">
        <p className="micro accent">{KIND[item.kind]}{state.config ? ` · ${state.config.companyName}` : ""}</p>
        <h1 className="display niche-title">{item.title}</h1>
        <p className="lead sm">{item.technique}</p>
        {item.method ? (
          <details className="radar-note">
            <summary>Nota para el consultor</summary>
            <p>Técnica: {item.method}.</p>
          </details>
        ) : null}
        {level ? (
          <p className={`radar-level is-${result!.level}`}>
            <span aria-hidden="true">{level.icon}</span> Caso para {level.label.toLowerCase()}
          </p>
        ) : null}
      </header>

      {item.doneForYou ? (
        <section className="case-compare case-dfy">
          <div className="card case-target">
            <p className="micro accent">Lo que hacemos nosotros</p>
            <p className="case-answer">{item.doneForYou}</p>
          </div>
          <div className="case-arrow" aria-hidden="true">+</div>
          <div className="card">
            <p className="micro">Lo único que hace usted</p>
            <p className="case-answer">{item.ownerEffort}</p>
          </div>
        </section>
      ) : null}

      {detail.question ? (
        <section className="case-compare">
          <div className="card case-today">
            <p className="micro">Cómo lo tiene hoy</p>
            <p className="case-question">{detail.question.text}</p>
            <p className="case-answer">
              {detail.todayAnswer ? (
                <>
                  <span className="radar-key" aria-hidden="true">{detail.todayAnswer.key}</span> {detail.todayAnswer.text}
                </>
              ) : (
                <span className="fine">Esta empresa no respondió esa pregunta.</span>
              )}
            </p>
          </div>
          <div className="case-arrow" aria-hidden="true">→</div>
          <div className="card case-target">
            <p className="micro accent">Cómo debería tenerlo</p>
            <p className="case-question">Nivel integrado</p>
            <p className="case-answer">
              <span className="radar-key on" aria-hidden="true">D</span> {detail.target}
            </p>
          </div>
        </section>
      ) : null}

      <section className="case-structure" aria-labelledby="case-structure-title">
        <h2 id="case-structure-title">La estructura de los datos</h2>
        <div className="case-structure-grid">
          <figure className="case-notebook">
            <figcaption className="micro">Hoy: cuaderno, chat o memoria</figcaption>
            <ul>
              {detail.notebook.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </figure>
          <figure className="card case-table">
            <figcaption className="micro accent">Propuesta: una tabla con columnas fijas</figcaption>
            <div className="case-table-scroll">
              <table>
                <thead>
                  <tr>
                    {detail.columns.map((column) => (
                      <th key={column} scope="col">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fine">Filas de ejemplo. Cada fila es un registro; cada columna, siempre el mismo dato.</p>
          </figure>
        </div>
      </section>

      <section className="radar-plan">
        <div className="card">
          <h2>Pasos</h2>
          <ol className="radar-route">
            {detail.steps.map((step) => (
              <li key={step}>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h2>Qué cambia</h2>
          <p>{detail.benefit}</p>
          <CaseSpark item={item} large />
          <p className="fine">Formación sugerida: {course.title} ({course.hours} h).</p>
        </div>
      </section>

      <div className="consultoria-report-actions">
        <Button href="/resultado" variant="secondary">Volver al diagnóstico</Button>
      </div>
    </article>
  );
}
