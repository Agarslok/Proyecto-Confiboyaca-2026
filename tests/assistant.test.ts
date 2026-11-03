import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assistantFallback, genericAssistant, isReadyForAssistant } from "../lib/radar/assistant";
import { askBusinessAssistant, assistantContextFromAnswers, assistantSystemPrompt } from "../lib/radar/ask-assistant";
import { applyFallbacks, createSolutionSpec, interpretSolutionModelText } from "../lib/radar/create-solution";
import { buildRadarResult } from "../lib/radar/engine";
import { solutionBrief } from "../lib/radar/solution-brief";
import { solutionPresentationBadge } from "../lib/site/solution-presentation";
import { parseSolutionHole } from "../lib/validation/solution-hole";
import { answerAll } from "./helpers/radar-answers";

describe("asistente virtual cuando el diagnóstico ya está listo", () => {
  it("pide índice 70, riesgo bajo y ningún hallazgo crítico", () => {
    assert.equal(isReadyForAssistant({ index: 100, level: "bajo", findings: [] }), true);
    assert.equal(isReadyForAssistant({ index: 70, level: "bajo", findings: [] }), true);
    assert.equal(isReadyForAssistant({ index: 69, level: "bajo", findings: [] }), false);
    assert.equal(
      isReadyForAssistant({
        index: 80,
        level: "moderado",
        findings: [],
      }),
      false,
    );
    assert.equal(
      isReadyForAssistant({
        index: 90,
        level: "bajo",
        findings: [{ questionId: "datos-registro", dimension: "datos", severity: "critico", text: "Sin registro", weight: 1 }],
      }),
      false,
    );
  });

  it("una panadería con todo en D recibe asistente, no registro", () => {
    const bakery = buildRadarResult(
      answerAll({ companyName: "Panadería Carlitos", industry: "alimentos", activity: "alimentos-produccion" }, "D"),
    );
    assert.equal(bakery.index, 100);
    assert.equal(bakery.findings.length, 0);
    assert.equal(bakery.presentation?.mode, "asistente");
    assert.equal(bakery.presentation?.fallback.action, "asistente");
    if (bakery.presentation?.mode === "asistente") {
      assert.match(bakery.presentation.fallback.focus, /hornear|producción|materia prima/i);
      assert.ok(bakery.presentation.fallback.starters.length >= 3);
    }
    const badge = solutionPresentationBadge(bakery.presentation?.fallback, bakery.presentation);
    assert.equal(badge?.label, "Asistente virtual");
  });

  it("el enfoque cambia con el sector: bosque no es textil", () => {
    const wood = assistantFallback({
      companyName: "Bosque Alto",
      industryId: "madera",
      activityId: "madera-bosque",
      activityLabel: "Aprovechamiento forestal",
      vocab: { productos: "trozas", clientes: "clientes", punto: "finca" },
      index: 88,
      findings: [],
    });
    const textile = assistantFallback({
      companyName: "Telares del Valle",
      industryId: "moda",
      activityId: "moda-textil",
      activityLabel: "Textil e insumos",
      vocab: { productos: "telas e insumos", clientes: "compradores", punto: "tienda" },
      index: 88,
      findings: [],
    });
    assert.match(wood.focus, /forestal|trozas|corte/i);
    assert.match(textile.focus, /textil|telas|telar/i);
    assert.notEqual(wood.focus, textile.focus);
    assert.equal(parseSolutionHole(wood).ok, true);
    assert.equal(parseSolutionHole(textile).ok, true);
  });

  it("sin clave de Gemini igual entrega el hueco de asistente", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const drafted = await createSolutionSpec(
      answerAll({ companyName: "Panadería Carlitos", industry: "alimentos", activity: "alimentos-produccion" }, "D"),
      { fetchImpl: async () => new Response("no", { status: 500 }) },
    );
    process.env.GEMINI_API_KEY = previousKey;
    assert.equal(drafted.ok, true);
    assert.equal(drafted.spec.action, "asistente");
    assert.equal(drafted.source, "catalogo");
  });

  it("el encargo de Gemini no lleva teléfono ni correo y fija action asistente", () => {
    const answers = answerAll(
      {
        companyName: "Panadería Carlitos",
        industry: "alimentos",
        activity: "alimentos-produccion",
        email: "carlos@ejemplo.co",
        phone: "3001234567",
      },
      "D",
    );
    const brief = solutionBrief(answers);
    assert.ok(brief);
    assert.equal(brief?.presentationMode, "asistente");
    assert.equal(brief?.action, "asistente");
    const raw = JSON.stringify(brief);
    assert.equal(raw.includes("3001234567"), false);
    assert.equal(raw.includes("carlos@ejemplo.co"), false);
    const drafted = interpretSolutionModelText(
      JSON.stringify({
        action: "registro",
        visitorTitle: "Habla con el asistente de Carlitos",
        businessChange: "La IA atiende pedidos del día.",
        role: "Asistente de Carlitos",
        focus: "Estima cuánto hornear según lo que se pide.",
        greeting: "Hola, soy el asistente de Carlitos.",
        starters: ["¿Qué pan hay hoy?", "¿Puedo dejar un pedido?", "¿Qué se pide más?"],
        disclaimer: "Es una demostración.",
      }),
      brief!,
    );
    assert.equal(drafted.ok, true);
    if (drafted.ok) assert.equal(drafted.spec.action, "asistente");
  });

  it("si el modelo falla, el asistente maduro cae al mínimo de asistente", () => {
    const answers = answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "D");
    const brief = solutionBrief(answers);
    assert.ok(brief && brief.presentationMode === "asistente");
    const fromMinimo = applyFallbacks({
      brief,
      modelSpec: null,
    });
    assert.equal(fromMinimo.spec.action, "asistente");
    assert.equal(fromMinimo.source, "minimo");
  });

  it("el chat envía el contexto del negocio a Gemini, no el teléfono", async () => {
    const answers = answerAll(
      {
        companyName: "Panadería Carlitos",
        industry: "alimentos",
        activity: "alimentos-produccion",
        phone: "3001234567",
        email: "carlos@ejemplo.co",
      },
      "D",
    );
    const context = assistantContextFromAnswers(answers);
    const prompt = assistantSystemPrompt(context);
    assert.match(prompt, /Panadería Carlitos/);
    assert.match(prompt, /Alimentos/);
    assert.equal(prompt.includes("3001234567"), false);
    assert.equal(prompt.includes("carlos@ejemplo.co"), false);

    const previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-key";
    let body = "";
    const answer = await askBusinessAssistant(
      { question: "¿Qué pan hay hoy?", history: [], context },
      {
        fetchImpl: async (_url, init) => {
          body = String(init?.body ?? "");
          return new Response(
            JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hoy hay almojábana y pan de yuca." }] } }] }),
            { status: 200 },
          );
        },
      },
    );
    assert.match(answer, /almojábana/i);
    process.env.GEMINI_API_KEY = previousKey;
    assert.match(body, /Panadería Carlitos/);
    assert.match(body, /¿Qué pan hay hoy\?/);
    assert.equal(body.includes("3001234567"), false);
  });

  it("acepta el JSON del hueco de asistente y rechaza HTML", () => {
    const parsed = parseSolutionHole({
      action: "asistente",
      visitorTitle: "Habla con el asistente de Carlitos",
      businessChange: "La IA atiende con el contexto de la panadería.",
      role: "Asistente de Carlitos",
      focus: "Estima cuánto hornear y qué se pide más.",
      greeting: "Hola, soy el asistente de Carlitos.",
      starters: ["¿Qué pan hay hoy?", "¿Puedo dejar un pedido?", "¿Qué se pide más?"],
      disclaimer: "Es una demostración. El asistente no guarda lo que se escribe aquí.",
    });
    assert.equal(parsed.ok, true);
    const html = parseSolutionHole({
      action: "asistente",
      visitorTitle: "Habla <b>ya</b>",
      businessChange: "Cambio",
      role: "Asistente",
      focus: "Enfoque de IA para el sector.",
      greeting: "Hola.",
      starters: ["Uno de pregunta", "Dos de pregunta", "Tres de pregunta"],
      disclaimer: "Demo.",
    });
    assert.equal(html.ok, false);
  });
});
