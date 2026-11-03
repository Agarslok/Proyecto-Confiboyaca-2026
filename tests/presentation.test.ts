import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DIMENSIONS } from "../lib/radar/bank";
import { buildRadarResult, emptyRadarAnswers, screensFor } from "../lib/radar/engine";
import { catalogAction, chooseCatalogAction, choosePresentation, withCatalogHeadline } from "../lib/radar/presentation";
import { SOLUTION_KINDS, type CentralProblem, type SolutionKind } from "../lib/radar/solution";
import type { DimensionScore, IndustryId, OptionKey, RadarAnswers, Finding } from "../lib/radar/types";
import { buildSite } from "../lib/site/engine";
import { siteConfigFromDiagnosis } from "../lib/site/from-radar";

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

const vocab = { productos: "productos", clientes: "clientes", punto: "local" };

function choose(kind: SolutionKind, industryId: IndustryId | "" = "alimentos", activityId = "alimentos-produccion") {
  const choice = choosePresentation({
    companyName: "Finca del Alba",
    industryId,
    activityId,
    activityLabel: "Producción",
    vocab,
    central: central(kind, industryId),
    dimensions: quiet,
    findings: [],
  });
  if (!choice) throw new Error("Se esperaba un enfoque de hueco");
  return choice;
}

describe("enfoque del hueco sin IA", () => {
  it("al enviar la encuesta elige catálogo y deja un respaldo válido", () => {
    const bakery = buildRadarResult(answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A"));
    assert.equal(bakery.presentation?.mode, "catalogo");
    assert.equal(bakery.presentation?.fallback.action, "registro");
    assert.deepEqual(bakery.presentation?.fallback.columns, ["Producto", "Elaborado", "Sobra", "Cliente"]);
    assert.equal(bakery.presentation?.kind, "registro");
    assert.equal(bakery.presentation?.vocab.punto, "local");
    assert.ok(bakery.presentation?.also.some((item) => item.kind === "merma"));
    if (bakery.presentation?.mode === "catalogo") assert.equal(bakery.presentation.companion, null);

    const hotel = buildRadarResult(answerAll({ industry: "turismo", activity: "turismo-hotel" }, "A"));
    assert.equal(hotel.presentation?.mode, "catalogo");
    assert.equal(hotel.presentation?.fallback.action, "agenda");
    if (hotel.presentation?.mode === "catalogo") assert.equal(hotel.presentation.companion?.spec.action, "registro");

    const pharmacy = buildRadarResult(answerAll({ industry: "salud", activity: "salud-farmacia" }, "A"));
    assert.equal(pharmacy.presentation?.fallback.action, "registro");
    if (pharmacy.presentation?.mode === "catalogo") assert.equal(pharmacy.presentation.companion?.spec.action, "solicitudes");

    const clinic = buildRadarResult(answerAll({ industry: "salud", activity: "salud-ips" }, "A"));
    assert.equal(clinic.presentation?.fallback.action, "agenda");
    if (clinic.presentation?.mode === "catalogo") assert.equal(clinic.presentation.companion?.spec.action, "registro");

    const site = buildSite({
      companyName: "Panadería Carlitos",
      sectorId: "gastronomia",
      activity: "",
      audience: "",
      goal: "",
      otherGoal: "",
      features: [],
      radar: answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A"),
    });
    assert.equal(site.solution, undefined);
    assert.equal(site.radar?.presentation?.mode, "catalogo");
    const saved = siteConfigFromDiagnosis({
      answers: answerAll({ industry: "alimentos", activity: "alimentos-produccion" }, "A"),
      solutionSpec: bakery.presentation?.fallback ?? null,
    });
    assert.equal(saved?.solution?.action, "registro");
  });

  it("cubre cada kind con un widget del catálogo", () => {
    const industries: IndustryId[] = ["alimentos", "comercio", "moda", "agro", "pecuaria", "madera", "mineria", "manufactura", "transporte", "construccion", "servicios"];
    for (const industryId of industries) {
      for (const kind of SOLUTION_KINDS) {
        const choice = choose(kind, industryId);
        assert.equal(choice.mode, "catalogo", `${industryId} ${kind}`);
        const expected = catalogAction(kind, industryId, "alimentos-produccion");
        assert.equal(choice.action, expected);
        assert.equal(choice.fallback.action, expected);
      }
    }
  });

  it("una reserva o una cita usa agenda; una farmacia sigue en registro", () => {
    assert.equal(catalogAction("registro", "turismo", "turismo-hotel"), "agenda");
    assert.equal(catalogAction("registro", "alimentos", "alimentos-restaurante"), "agenda");
    assert.equal(catalogAction("registro", "salud", "salud-deporte"), "agenda");
    assert.equal(catalogAction("registro", "salud", "salud-farmacia"), "registro");
    assert.equal(catalogAction("registro", "salud", "salud-laboratorio"), "registro");
    assert.equal(catalogAction("registro", "alimentos", "alimentos-produccion"), "registro");
    assert.equal(choose("registro", "turismo", "turismo-hotel").fallback.action, "agenda");
    assert.equal(choose("registro", "salud", "salud-farmacia").fallback.action, "registro");
  });

  it("otra industria, indicadores, respaldo y empate usan catálogo (no guía)", () => {
    const other = choose("inventario", "otra", "otra-actividad");
    assert.equal(other.mode, "catalogo");
    assert.equal(other.fallback.action, "inventario");

    assert.equal(choose("indicadores", "servicios", "servicios-consultoria").mode, "catalogo");
    assert.equal(choose("respaldo", "comercio", "comercio-fisica").fallback.action, "registro");

    const tied = choosePresentation({
      companyName: "Mesa",
      industryId: "alimentos",
      activityId: "alimentos-produccion",
      activityLabel: "Producción de alimentos",
      vocab,
      central: { ...central("registro"), also: [] },
      dimensions: [
        { id: "datos", label: "Datos", weight: 0.15, score: 0, answered: 1 },
        { id: "negocio", label: "Negocio", weight: 0.15, score: 0, answered: 1 },
      ],
      findings: [
        { questionId: "datos-registro", dimension: "datos", severity: "critico", text: "Sin registro", weight: 1 },
        { questionId: "alimentos-1", dimension: "negocio", severity: "critico", text: "Mucha merma", weight: 1 },
      ],
    });
    if (!tied) throw new Error("Se esperaba un enfoque de hueco");
    assert.equal(tied.mode, "catalogo");
    if (tied.mode === "catalogo") {
      assert.equal(tied.action, "registro");
      assert.equal(tied.companion, null);
    }
  });

  it("combina un segundo widget solo cuando la necesidad es distinta", () => {
    const hotel = choose("registro", "turismo", "turismo-hotel");
    assert.equal(hotel.mode, "catalogo");
    if (hotel.mode === "catalogo") {
      assert.equal(hotel.action, "agenda");
      assert.equal(hotel.companion?.spec.action, "registro");
    }

    const bakery = choose("registro", "alimentos", "alimentos-produccion");
    if (bakery.mode === "catalogo") assert.equal(bakery.companion, null);

    const pharmacy = choose("registro", "salud", "salud-farmacia");
    if (pharmacy.mode === "catalogo") assert.equal(pharmacy.companion, null);

    const clinic = choose("registro", "salud", "salud-ips");
    if (clinic.mode === "catalogo") {
      assert.equal(clinic.action, "agenda");
      assert.equal(clinic.companion?.spec.action, "registro");
    }

    const consultoria = choose("indicadores", "servicios", "servicios-consultoria");
    if (consultoria.mode === "catalogo") {
      assert.equal(consultoria.action, "registro");
      assert.equal(consultoria.companion?.spec.action, "agenda");
    }

    const hotelStock = choose("inventario", "turismo", "turismo-hotel");
    if (hotelStock.mode === "catalogo") {
      assert.equal(hotelStock.action, "inventario");
      assert.equal(hotelStock.companion?.spec.action, "agenda");
    }

    const lab = choose("registro", "salud", "salud-laboratorio");
    if (lab.mode === "catalogo") {
      assert.equal(lab.action, "registro");
      assert.equal(lab.companion?.spec.action, "agenda");
    }

    const requests = choose("solicitudes", "alimentos", "alimentos-restaurante");
    if (requests.mode === "catalogo") {
      assert.equal(requests.action, "solicitudes");
      assert.equal(requests.companion?.spec.action, "agenda");
    }

    const withStock = choosePresentation({
      companyName: "Panadería Carlitos",
      industryId: "alimentos",
      activityId: "alimentos-produccion",
      activityLabel: "Producción",
      vocab,
      central: {
        ...central("registro"),
        also: [{ kind: "inventario", name: "Inventario", problem: "No sabe qué hay en existencia." }],
      },
      dimensions: quiet,
      findings: [],
    });
    if (!withStock || withStock.mode !== "catalogo") throw new Error("Se esperaba catálogo");
    assert.equal(withStock.action, "registro");
    assert.equal(withStock.companion?.spec.action, "inventario");
  });

  it("con empate entre problemas prioriza el widget del kind rival", () => {
    const input = {
      companyName: "Mesa",
      industryId: "alimentos" as IndustryId,
      activityId: "alimentos-produccion",
      activityLabel: "Producción",
      vocab,
      central: central("registro"),
      dimensions: [
        { id: "datos", label: "Datos", weight: 0.15, score: 0, answered: 1 },
        { id: "negocio", label: "Negocio", weight: 0.15, score: 0, answered: 1 },
      ],
      findings: [
        { questionId: "datos-registro", dimension: "datos", severity: "critico", text: "Sin registro", weight: 1 },
        { questionId: "alimentos-1", dimension: "negocio", severity: "critico", text: "Mucha merma", weight: 1 },
      ],
    };
    assert.equal(
      chooseCatalogAction({
        ...input,
        dimensions: input.dimensions as DimensionScore[],
        findings: input.findings as Finding[],
      }),
      "registro",
    );
  });

  it("reemplaza títulos de marketing del modelo por el catálogo sectorial", () => {
    const answers = answerAll({ industry: "turismo", activity: "turismo-agencia", companyName: "Shop Viajes" }, "A");
    const site = buildSite({
      companyName: "Shop Viajes",
      sectorId: "turismo",
      activity: "",
      audience: "",
      goal: "",
      otherGoal: "",
      features: [],
      radar: answers,
    });
    const normalized = withCatalogHeadline(
      {
        action: "agenda",
        visitorTitle: "Shop Viajes cotiza su plan de viaje con usted",
        businessChange: "Texto inventado por el modelo.",
        submitLabel: "Confirmar",
        choices: [{ id: "a", label: "Plan", detail: "Demo", price: 0 }],
      },
      site,
    );
    assert.equal(normalized.visitorTitle, "Arma tu plan aquí");
    assert.match(normalized.businessChange, /fecha de salida/i);
  });
});
