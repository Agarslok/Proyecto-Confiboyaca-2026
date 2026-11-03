import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { interpretSolutionModelText } from "../lib/radar/create-solution";
import { solutionBrief } from "../lib/radar/solution-brief";
import { emptyRadarAnswers, screensFor } from "../lib/radar/engine";
import { GEMINI_SOLUTION_SYSTEM_LINES, SOLUTION_LIMITS_SUMMARY } from "../lib/radar/solution-limits";
import type { OptionKey, RadarAnswers } from "../lib/radar/types";

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

describe("límites escritos del hueco", () => {
  it("resume alcance de la IA para informe y carga", () => {
    assert.match(SOLUTION_LIMITS_SUMMARY, /menú|hero/i);
    assert.match(SOLUTION_LIMITS_SUMMARY, /índice/i);
  });

  it("fija disclaimer en catálogo del modelo", () => {
    const brief = solutionBrief(answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A"));
    assert.ok(brief && brief.presentationMode === "catalogo");
    if (!brief) return;
    const drafted = interpretSolutionModelText(
      JSON.stringify({
        action: "registro",
        visitorTitle: "Cada pedido queda anotado",
        businessChange: "Queda escrito qué hacer.",
        submitLabel: "Guardar",
        columns: ["Pedido", "Estado"],
        rows: [["Hoy", "Nuevo"]],
      }),
      brief,
    );
    assert.equal(drafted.ok, true);
    if (drafted.ok) assert.equal(drafted.spec.action, "registro");
  });

  it("el system prompt de Gemini repite los límites de alcance", () => {
    const text = GEMINI_SOLUTION_SYSTEM_LINES.join(" ");
    assert.match(text, /menú|portada|pie/i);
    assert.match(text, /índice/i);
    assert.match(text, /agregar, editar y quitar/i);
  });
});
