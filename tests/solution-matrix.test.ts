import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TEMPLATE_IDS } from "../types/site";
import { createSolutionSpec } from "../lib/radar/create-solution";
import { buildRadarResult } from "../lib/radar/engine";
import { solutionKind } from "../lib/radar/solution";
import { solutionPresentationBadge } from "../lib/site/solution-presentation";
import { siteConfigFromDiagnosis } from "../lib/site/from-radar";
import type { SolutionActionId, SolutionHoleSpec } from "../lib/site/solution-slot";
import { isCatalogSolution } from "../lib/site/solution-slot";
import { selectTemplate } from "../lib/site/select-template";
import { MATRIX } from "./helpers/radar-answers";

function catalog(result: ReturnType<typeof buildRadarResult>): { action: SolutionActionId } {
  assert.equal(result.presentation?.mode, "catalogo", `Se esperaba catálogo; central=${result.central?.kind} q=${result.central?.questionId}`);
  if (result.presentation?.mode !== "catalogo") throw new Error("unreachable");
  return { action: result.presentation.action };
}

describe("matriz pequeña · modo de presentación (sin Gemini)", () => {
  it("Panadería + registro → catálogo registro", () => {
    const result = buildRadarResult(MATRIX.panaderiaRegistro());
    assert.equal(result.central?.kind, "registro");
    assert.equal(catalog(result).action, "registro");
  });

  it("Hotel + ocupación → catálogo agenda", () => {
    const answers = MATRIX.hotelOcupacion();
    assert.equal(solutionKind("turismo-1"), "registro");
    const result = buildRadarResult(answers);
    assert.equal(result.central?.questionId, "turismo-1");
    assert.equal(result.central?.kind, "registro");
    assert.equal(catalog(result).action, "agenda");
    assert.ok(result.presentation?.mode === "catalogo" && (result.presentation.fallback.choices?.length ?? 0) > 0);
  });

  it("Tienda + inventario → catálogo inventario", () => {
    const result = buildRadarResult(MATRIX.tiendaInventario());
    assert.equal(result.central?.kind, "inventario");
    assert.equal(catalog(result).action, "inventario");
    assert.ok(result.presentation?.mode === "catalogo" && (result.presentation.fallback.rows?.length ?? 0) > 0);
  });

  it("IPS + solicitudes → catálogo solicitudes (no agenda aunque sea IPS)", () => {
    const result = buildRadarResult(MATRIX.ipsSolicitudes());
    assert.equal(result.central?.kind, "solicitudes");
    assert.equal(catalog(result).action, "solicitudes");
  });

  it("Otra industria + respuestas mixtas → catálogo", () => {
    const result = buildRadarResult(MATRIX.otraMixta());
    assert.equal(catalog(result).action, "registro");
    assert.equal(result.central?.industryId, "otra");
    assert.ok(result.central?.kind);
  });

  it("Problema central respaldo → catálogo registro", () => {
    const result = buildRadarResult(MATRIX.problemaRespaldo());
    assert.equal(result.central?.kind, "respaldo");
    assert.equal(catalog(result).action, "registro");
  });

  it("Hallazgo raro sin BY_QUESTION → catálogo registro", () => {
    assert.equal(solutionKind("otra-1"), "indicadores");
    const result = buildRadarResult(MATRIX.hallazgoRaro());
    assert.equal(result.central?.questionId, "otra-1");
    assert.equal(catalog(result).action, "registro");
  });
});

describe("matriz pequeña · spec guardada (Gemini caído)", () => {
  const restoreKey = process.env.GEMINI_API_KEY;

  it("Catálogo: panadería sin Gemini → fallback de catálogo registro", async () => {
    delete process.env.GEMINI_API_KEY;
    const drafted = await createSolutionSpec(MATRIX.panaderiaRegistro(), {
      fetchImpl: async () => new Response("offline", { status: 503 }),
    });
    process.env.GEMINI_API_KEY = restoreKey;
    assert.equal(drafted.source, "catalogo");
    assert.equal(drafted.spec.action, "registro");
    assert.ok(isCatalogSolution(drafted.spec));
  });

  it("Otra industria mixta sin Gemini → catálogo por kind", async () => {
    delete process.env.GEMINI_API_KEY;
    const answers = MATRIX.otraMixta();
    assert.equal(buildRadarResult(answers).presentation?.mode, "catalogo");
    const drafted = await createSolutionSpec(answers, {
      fetchImpl: async () => new Response("offline", { status: 503 }),
    });
    process.env.GEMINI_API_KEY = restoreKey;
    assert.equal(drafted.source, "catalogo");
    assert.equal(drafted.spec.action, "registro");
  });

  it("Respaldo sin Gemini → catálogo registro", async () => {
    delete process.env.GEMINI_API_KEY;
    const answers = MATRIX.problemaRespaldo();
    const drafted = await createSolutionSpec(answers, {
      fetchImpl: async () => new Response("offline", { status: 503 }),
    });
    process.env.GEMINI_API_KEY = restoreKey;
    assert.equal(drafted.spec.action, "registro");
  });
});

describe("matriz pequeña · acción × plantilla en /s/…", () => {
  const specs: Record<SolutionActionId, SolutionHoleSpec> = {
    agenda: {
      action: "agenda",
      visitorTitle: "Agenda",
      businessChange: "Demo",
      submitLabel: "Confirmar",
      choices: [{ id: "visita", label: "Visita", detail: "2 h", price: 50000 }],
    },
    registro: {
      action: "registro",
      visitorTitle: "Registro",
      businessChange: "Demo",
      submitLabel: "Registrar",
      columns: ["Col", "Estado"],
      rows: [["Pedido", "Nuevo"]],
    },
    inventario: {
      action: "inventario",
      visitorTitle: "Inventario",
      businessChange: "Demo",
      submitLabel: "Consultar",
      columns: ["Producto", "Stock"],
      rows: [["Item", "12"]],
    },
    solicitudes: {
      action: "solicitudes",
      visitorTitle: "Solicitudes",
      businessChange: "Demo",
      submitLabel: "Enviar",
      columns: ["Número", "Estado"],
      rows: [["SOL-1", "Recibida"]],
    },
  };

  const sectorByAction = {
    agenda: MATRIX.hotelOcupacion(),
    registro: MATRIX.panaderiaRegistro(),
    inventario: MATRIX.tiendaInventario(),
    solicitudes: MATRIX.ipsSolicitudes(),
  } as const;

  for (const action of ["agenda", "registro", "inventario", "solicitudes"] as const) {
    it(`integra ${action} en la plantilla del sector`, () => {
      const answers = sectorByAction[action];
      const result = buildRadarResult(answers);
      const config = siteConfigFromDiagnosis({ answers, solutionSpec: specs[action] });
      assert.ok(config, "config");
      if (!config) return;
      assert.equal(config.templateId, selectTemplate(config.sectorId));
      assert.ok(TEMPLATE_IDS.includes(config.templateId));
      assert.equal(config.solution?.action, action);
      const badge = solutionPresentationBadge(config.solution, result.presentation);
      assert.equal(badge?.tone, "catalogo");
    });
  }

  it("cada acción cae en la plantilla sectorial esperada", () => {
    assert.equal(siteConfigFromDiagnosis({ answers: MATRIX.panaderiaRegistro(), solutionSpec: specs.registro })?.templateId, "gastronomia");
    assert.equal(siteConfigFromDiagnosis({ answers: MATRIX.hotelOcupacion(), solutionSpec: specs.agenda })?.templateId, "turismo");
    assert.equal(siteConfigFromDiagnosis({ answers: MATRIX.tiendaInventario(), solutionSpec: specs.inventario })?.templateId, "retail");
    assert.equal(siteConfigFromDiagnosis({ answers: MATRIX.ipsSolicitudes(), solutionSpec: specs.solicitudes })?.templateId, "servicios");
  });
});
