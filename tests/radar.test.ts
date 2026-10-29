import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INDUSTRIES } from "../lib/radar/bank";
import { CASES } from "../lib/radar/cases";
import { caseDetail } from "../lib/radar/case-details";
import { buildRadarResult, emptyRadarAnswers, nicheQuestions, nicheSummary, pickCases, screensFor } from "../lib/radar/engine";
import { normalizeRadarAnswers } from "../lib/radar/session";
import type { OptionKey, RadarAnswers } from "../lib/radar/types";
import { buildSite } from "../lib/site/engine";

/** Responde todas las pantallas visibles con la misma letra (o según un mapa). */
function answerAll(base: Partial<RadarAnswers>, pick: OptionKey | ((id: string) => OptionKey)): RadarAnswers {
  let answers: RadarAnswers = { ...emptyRadarAnswers(), companyName: "Panadería Carlitos", size: "micro", goals: ["costos"], ...base };
  for (let round = 0; round < 4; round += 1) {
    for (const screen of screensFor(answers)) {
      if (screen.kind !== "question") continue;
      const key = typeof pick === "function" ? pick(screen.question.id) : pick;
      answers = { ...answers, choices: { ...answers.choices, [screen.question.id]: key } };
    }
  }
  return answers;
}

describe("banco del radar", () => {
  it("tiene 12 industrias × 4 actividades y 69 casos", () => {
    assert.equal(INDUSTRIES.length, 12);
    assert.ok(INDUSTRIES.every((industry) => industry.activities.length === 4));
    assert.equal(CASES.length, 69);
  });

  it("no pasa de 18 pantallas en ningún nicho y nunca baja de 15", () => {
    for (const industry of INDUSTRIES) {
      for (const activity of industry.activities) {
        for (const pick of ["A", "D"] as OptionKey[]) {
          const answers = answerAll({ industry: industry.id, activity: activity.id }, pick);
          const total = screensFor(answers).length;
          assert.ok(total >= 15 && total <= 18, `${activity.id} con ${pick}: ${total} pantallas`);
        }
      }
    }
  });

  it("no repite el tema del eslabón si la industria ya lo preguntó", () => {
    const bakery = nicheQuestions({ industry: "alimentos", activity: "alimentos-produccion" });
    assert.deepEqual(bakery.map((question) => question.id), ["alimentos-1", "alimentos-2"]);
    const restaurant = nicheQuestions({ industry: "alimentos", activity: "alimentos-restaurante" });
    assert.equal(restaurant.length, 3);
    assert.match(restaurant[2].text, /clientes/);
  });

  it("reemplaza el vocabulario de la industria en las preguntas", () => {
    const hotel = nicheQuestions({ industry: "turismo", activity: "turismo-hotel" });
    assert.ok(hotel.some((question) => /huéspedes/.test(question.text)));
  });

  it("la pregunta de reglas de IA solo aparece si ya usan IA", () => {
    const base = { industry: "comercio" as const, activity: "comercio-fisica" };
    const never = answerAll(base, "A");
    assert.ok(!screensFor(never).some((screen) => screen.kind === "question" && screen.question.id === "ia-reglas"));
    const uses = answerAll(base, (id) => (id === "ia-uso" ? "B" : "A"));
    assert.ok(screensFor(uses).some((screen) => screen.kind === "question" && screen.question.id === "ia-reglas"));
  });
});

describe("puntaje del radar", () => {
  it("Panadería Carlitos con todo en papel queda en riesgo alto", () => {
    const result = buildRadarResult(answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A"));
    assert.equal(result.index, 0);
    assert.equal(result.level, "alto");
    assert.ok(result.findings.every((finding) => finding.severity === "critico"));
    assert.equal(result.cases.length, 6);
    /* Microempresa en papel: primero 3 primeros pasos sencillos, luego lo de su industria. */
    assert.deepEqual(result.cases.slice(0, 3).map((item) => Boolean(item.forSmall)), [true, true, true]);
    assert.equal(result.cases[3].appliesTo, "alimentos");
    assert.ok(result.cases[0].doneForYou && result.cases[0].ownerEffort);
  });

  it("todo en D da 100 y riesgo bajo", () => {
    const result = buildRadarResult(answerAll({ industry: "manufactura", activity: "manufactura-planta" }, "D"));
    assert.equal(result.index, 100);
    assert.equal(result.level, "bajo");
    assert.equal(result.findings.length, 0);
  });

  it("con Datos por debajo de 55 no puede quedar en riesgo bajo", () => {
    const answers = answerAll({ industry: "servicios", activity: "servicios-software" }, (id) =>
      id.startsWith("datos-") ? "B" : "D",
    );
    const result = buildRadarResult(answers);
    const datos = result.dimensions.find((dimension) => dimension.id === "datos")!;
    assert.ok(datos.score < 55);
    assert.ok(result.index >= 62);
    assert.equal(result.level, "moderado");
    assert.ok(result.levelNote);
  });

  it("«No sé» cuenta 0 y queda por confirmar", () => {
    const result = buildRadarResult(answerAll({ industry: "agro", activity: "agro-primaria" }, (id) => (id === "agro-1" ? "E" : "D")));
    assert.equal(result.unsure, 1);
    assert.equal(result.findings[0].severity, "confirmar");
  });

  it("prioriza casos de la industria, luego del eslabón y por objetivos", () => {
    const cases = pickCases("moderado", { industry: "turismo", activity: "turismo-hotel", goals: ["vender"], size: "mediana", choices: {} });
    assert.ok(cases.every((item) => !item.forSmall));
    assert.deepEqual(cases.slice(0, 2).map((item) => item.appliesTo), ["turismo", "turismo"]);
    assert.ok(cases.slice(2, 4).every((item) => item.appliesTo === "servicio"));
  });
});

describe("página generada desde el radar", () => {
  it("usa la plantilla de la industria y el tono de la actividad", () => {
    const radar = answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A");
    const site = buildSite({
      companyName: radar.companyName, sectorId: "gastronomia", activity: "", audience: "", goal: "", otherGoal: "", features: [], radar,
    });
    assert.equal(site.templateId, "gastronomia");
    assert.match(site.templateCopy.heroKicker, /Panadería/);
    assert.equal(site.templateCopy.cards[0].title, "Almojábanas");
    assert.equal(site.radar?.level, "alto");
    assert.ok(Array.isArray((site as unknown as { drinks: unknown[] }).drinks));
  });

  it("sin radar, la página se genera igual que antes", () => {
    const site = buildSite({ companyName: "Andes Viajes", sectorId: "turismo", activity: "", audience: "", goal: "", otherGoal: "", features: [] });
    assert.equal(site.radar, undefined);
    assert.equal(site.templateCopy.heroKicker, "Guía editorial de viajes");
  });

  it("descarta valores desconocidos guardados en el navegador", () => {
    const clean = normalizeRadarAnswers({ ...emptyRadarAnswers(), industry: "minería", size: "xl", choices: { x: "Z", y: "B" }, goals: ["vender", "otro", "costos", "clientes"] });
    assert.equal(clean?.industry, "");
    assert.equal(clean?.size, "");
    assert.deepEqual(clean?.choices, { y: "B" });
    assert.deepEqual(clean?.goals, ["vender", "costos"]);
  });
});

describe("nichos, casos en detalle y problema central", () => {
  it("minería tiene sus propias preguntas y cabe en 15 a 18 pantallas", () => {
    const summary = nicheSummary("mineria", "mineria-extraccion");
    assert.deepEqual(summary.questions.map((question) => question.id), ["mineria-1", "mineria-2", "produccion-2"]);
    assert.ok(summary.shortest >= 15 && summary.longest <= 18);
  });

  it("el problema central de la panadería es el registro y la página lo resuelve", () => {
    const radar = answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A");
    const result = buildRadarResult(radar);
    assert.equal(result.central?.questionId, "datos-registro");
    assert.equal(result.central?.kind, "registro");
    assert.ok(result.central?.also.some((item) => item.kind === "merma"));
    const site = buildSite({ companyName: radar.companyName, sectorId: "gastronomia", activity: "", audience: "", goal: "", otherGoal: "", features: [], radar });
    assert.match(site.templateCopy.heroLead, /queda registrado/);
  });

  it("el detalle de un caso compara la respuesta de hoy con el nivel integrado", () => {
    const radar = answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A");
    const item = CASES.find((entry) => entry.id === "t-alto-0")!;
    const detail = caseDetail(item, radar);
    assert.equal(detail.todayAnswer?.key, "A");
    assert.match(detail.target ?? "", /integrados/);
    assert.ok(detail.rows.some((row) => row.includes("Almojábana")));
    const generic = caseDetail(CASES.find((entry) => entry.kind === "eslabon")!, radar);
    assert.ok(generic.steps.length > 0 && generic.rows.length === 6);
  });
});
