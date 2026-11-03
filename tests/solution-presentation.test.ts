import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRadarResult } from "../lib/radar/engine";
import { choosePresentation } from "../lib/radar/presentation";
import type { CentralProblem, SolutionKind } from "../lib/radar/solution";
import type { DimensionScore, IndustryId, OptionKey, RadarAnswers } from "../lib/radar/types";
import { samplePageHref, solutionPresentationBadge } from "../lib/site/solution-presentation";
import { emptyRadarAnswers, screensFor } from "../lib/radar/engine";
import { DIMENSIONS } from "../lib/radar/bank";

function answerAll(base: Partial<RadarAnswers>, pick: OptionKey): RadarAnswers {
  let answers: RadarAnswers = { ...emptyRadarAnswers(), companyName: "Panadería Carlitos", size: "micro", goals: ["costos"], ...base };
  for (let round = 0; round < 4; round += 1) {
    for (const screen of screensFor(answers)) {
      if (screen.kind !== "question") continue;
      answers = { ...answers, choices: { ...answers.choices, [screen.question.id]: pick } };
    }
  }
  return answers;
}

function central(kind: SolutionKind, industryId: IndustryId | "" = "alimentos"): CentralProblem {
  return {
    questionId: "datos-registro",
    kind,
    name: "Registro",
    headline: "Cada pedido queda registrado",
    problem: "Hoy lo importante se anota en cuadernos o se queda en el chat.",
    dimensionLabel: "Datos",
    customerLead: "Queda registrado.",
    changes: [],
    also: [],
    industryId,
  };
}

const quiet: DimensionScore[] = DIMENSIONS.map((dimension) => ({
  id: dimension.id,
  label: dimension.short,
  weight: dimension.weight,
  score: 80,
  answered: 4,
}));

describe("presentación en el informe", () => {
  it("prioriza la spec guardada sobre el paso 2", () => {
    const bakery = buildRadarResult(answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A"));
    const badge = solutionPresentationBadge(
      {
        action: "registro",
        visitorTitle: "Registro",
        businessChange: "Cambio",
        submitLabel: "Guardar",
        columns: ["A", "B"],
        rows: [["1", "2"]],
      },
      bakery.presentation,
    );
    assert.equal(badge?.label, "Solución interactiva");
  });

  it("usa catálogo del diagnóstico si aún no hay spec", () => {
    const bakery = buildRadarResult(answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A"));
    const badge = solutionPresentationBadge(null, bakery.presentation);
    assert.equal(badge?.label, "Solución interactiva");

    const catalog = choosePresentation({
      companyName: "X",
      industryId: "servicios",
      activityId: "servicios-consultoria",
      activityLabel: "Consultoría",
      vocab: { productos: "servicios", clientes: "clientes", punto: "local" },
      central: central("indicadores", "servicios"),
      dimensions: quiet,
      findings: [],
    });
    const catalogBadge = solutionPresentationBadge(null, catalog);
    assert.equal(catalogBadge?.label, "Solución interactiva");
  });

  it("arma el enlace a la página con ancla al hueco", () => {
    assert.equal(samplePageHref("RAD-001"), "/s/RAD-001#solucion-hueco");
    assert.equal(samplePageHref("rad-001"), "/s/RAD-001#solucion-hueco");
    assert.equal(samplePageHref(undefined), "/sitio#solucion-hueco");
    assert.equal(samplePageHref(""), "/sitio#solucion-hueco");
  });
});
