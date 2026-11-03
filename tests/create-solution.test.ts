import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyFallbacks, createSolutionSpec, interpretSolutionModelText } from "../lib/radar/create-solution";
import { genericCatalog, isPoorCatalogFallback } from "../lib/radar/presentation";
import { emptyRadarAnswers, screensFor } from "../lib/radar/engine";
import { solutionBrief } from "../lib/radar/solution-brief";
import type { OptionKey, RadarAnswers } from "../lib/radar/types";

function answerAll(base: Partial<RadarAnswers>, pick: OptionKey): RadarAnswers {
  let answers: RadarAnswers = {
    ...emptyRadarAnswers(),
    companyName: "Panadería Carlitos",
    city: "Tunja",
    contactName: "Carlos",
    contactLastName: "Rodríguez",
    email: "carlos@ejemplo.co",
    phone: "3001234567",
    contactPhone: "3011234567",
    size: "micro",
    industry: "alimentos",
    activity: "alimentos-produccion",
    goals: ["costos"],
    consent: true,
    ...base,
  };
  for (let round = 0; round < 4; round += 1) {
    for (const screen of screensFor(answers)) {
      if (screen.kind !== "question") continue;
      answers = { ...answers, choices: { ...answers.choices, [screen.question.id]: pick } };
    }
  }
  return answers;
}

const table = {
  visitorTitle: "Cada pedido queda anotado",
  businessChange: "El cierre del día sale de la lista.",
  submitLabel: "Dejar registrado",
  columns: ["Pedido", "Producto", "Estado"],
  rows: [["Hoy", "Almojábana", "Por anotar"]],
};

describe("encargo de la solución", () => {
  it("arma siempre la misma estructura y deja fuera teléfono y correo", () => {
    const answers = answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A");
    const brief = solutionBrief(answers);
    assert.ok(brief);
    if (!brief) return;
    assert.equal(brief.companyName, "Panadería Carlitos");
    assert.equal(brief.industry, "Alimentos y bebidas");
    assert.equal(brief.presentationMode, "catalogo");
    assert.equal(brief.action, "registro");
    assert.equal(brief.kind, "registro");
    assert.ok(brief.keyAnswers.length >= 3 && brief.keyAnswers.length <= 5);
    assert.ok(brief.samples.items.includes("Almojábana"));
    assert.match(brief.modelPrompt, /widget/i);
    const raw = JSON.stringify(brief);
    assert.equal(raw.includes("3001234567"), false);
    assert.equal(raw.includes("carlos@ejemplo.co"), false);
    assert.equal(raw.includes("Carlos"), false);
  });

  it("fija la acción del catálogo y rechaza HTML", () => {
    const brief = solutionBrief(answerAll({}, "A"));
    assert.ok(brief);
    if (!brief) return;
    const drafted = interpretSolutionModelText(JSON.stringify({ action: "inventario", html: "<p>x</p>", ...table }), brief);
    assert.equal(drafted.ok, true);
    if (drafted.ok) assert.equal(drafted.spec.action, "registro");

    const html = interpretSolutionModelText(JSON.stringify({ ...table, visitorTitle: "Pedido <b>listo</b>" }), brief);
    assert.equal(html.ok, false);
  });

  it("otra industria sigue en catálogo con action fijada", () => {
    const brief = solutionBrief(answerAll({ industry: "otra", activity: "otra-mixto" }, "A"));
    assert.ok(brief && brief.presentationMode === "catalogo");
    if (!brief) return;
    const drafted = interpretSolutionModelText(
      JSON.stringify({
        action: "registro",
        ...table,
      }),
      brief,
    );
    assert.equal(drafted.ok, true);
    if (drafted.ok) assert.equal(drafted.spec.action, "registro");
  });

  it("pide a Gemini temperatura baja y solo el JSON", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-key";
    let body = "";
    const fetchImpl: typeof fetch = async (_url, init) => {
      body = String(init?.body ?? "");
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ action: "agenda", ...table }) }] } }] }), { status: 200 });
    };
    const drafted = await createSolutionSpec(answerAll({}, "A"), { fetchImpl });
    process.env.GEMINI_API_KEY = previousKey;
    assert.equal(drafted.ok, true);
    assert.equal(drafted.source, "modelo");
    assert.match(body, /"temperature":0\.35/);
    assert.match(body, /menú|portada/i);
    assert.match(body, /"max_output_tokens":1600/);
    assert.equal(body.includes("3001234567"), false);
    assert.equal(body.includes("carlos@ejemplo.co"), false);
  });

  it("si el JSON no sirve, usa el catálogo escrito; si es pobre, el catálogo mínimo", () => {
    const brief = solutionBrief(answerAll({}, "A"));
    assert.ok(brief);
    if (!brief) return;
    const catalog = {
      action: "registro" as const,
      visitorTitle: "Cada pedido queda anotado",
      businessChange: "El cierre sale de la lista.",
      submitLabel: "Dejar registrado",
      columns: ["Pedido", "Producto", "Estado"],
      rows: [["Hoy", "Almojábana", "Por anotar"]],
    };

    const fromCatalog = applyFallbacks({ brief, modelSpec: null, catalogFallback: catalog });
    assert.equal(fromCatalog.source, "catalogo");
    assert.equal(fromCatalog.spec.action, "registro");

    const poor = { ...catalog, rows: [["Hoy", "Producto A", "Listo"]] };
    assert.equal(isPoorCatalogFallback(poor), true);
    const fromMinimo = applyFallbacks({ brief, modelSpec: null, catalogFallback: poor });
    assert.equal(fromMinimo.source, "minimo");
    assert.equal(fromMinimo.spec.action, "registro");
    assert.ok(genericCatalog("registro").rows?.length);
  });

  it("sin clave de Gemini una panadería igual recibe el hueco de registro", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const drafted = await createSolutionSpec(answerAll({}, "A"), { fetchImpl: async () => new Response("no", { status: 500 }) });
    process.env.GEMINI_API_KEY = previousKey;
    assert.equal(drafted.ok, true);
    assert.equal(drafted.source, "catalogo");
    assert.equal(drafted.spec.action, "registro");
  });
});
