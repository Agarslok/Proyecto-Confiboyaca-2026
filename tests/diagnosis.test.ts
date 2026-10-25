import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { industries } from "../config/industries";
import { templates } from "../config/templates";
import { analyticsFor, isLowStock } from "../lib/data/demos";
import { buildDiagnosis, isWeakSignal, selectDemo } from "../lib/diagnostic/engine";
import { getDiagnosisProvider, ProviderNotReadyError } from "../lib/diagnostic/provider";
import { requestDiagnosis } from "../lib/diagnostic/service";
import { getRepositories, PersistenceNotReadyError, resetMemoryStore } from "../lib/repositories";
import { memoryRepositories } from "../lib/repositories/memory";
import { normalizeDraft, parseStoredSession } from "../lib/session/browser-session";
import type { Answers, DiagnosisIds } from "../types/domain";
import { diagnosisSchema } from "../lib/validation/answers";
import { firstInvalidStep, validateStep } from "../lib/validation/steps";

const IDS: DiagnosisIds = { diagnosisId: "d1", companyId: "c1", sessionId: "s1" };

function answers(overrides: Partial<Answers> = {}): Answers {
  return {
    companyName: "Taller Andino",
    industryId: "metalurgia",
    size: "11-50",
    problems: ["inventario"],
    primaryProblem: "inventario",
    goals: ["tiempo"],
    currentMethod: "hojas",
    painFrequency: "diaria",
    ...overrides,
  };
}

afterEach(() => {
  resetMemoryStore();
  delete process.env.DATA_PROVIDER;
  delete process.env.DIAGNOSIS_PROVIDER;
});

describe("motor de reglas", () => {
  it("cambia el diagnóstico cuando cambian el sector y el problema", () => {
    const industrial = buildDiagnosis(answers(), IDS);
    const services = buildDiagnosis(
      answers({
        companyName: "Estudio Norte",
        industryId: "servicios",
        problems: ["seguimiento"],
        primaryProblem: "seguimiento",
        goals: ["ventas"],
        currentMethod: "memoria",
        painFrequency: "semanal",
      }),
      IDS,
    );

    assert.equal(industrial.demoType, "inventory");
    assert.equal(services.demoType, "crm");
    assert.equal(industrial.templateKey, "industrial");
    assert.equal(services.templateKey, "services");
    assert.notEqual(industrial.summary, services.summary);
    assert.match(industrial.summary, /materia prima/i);
    assert.match(services.summary, /propuestas|cuentas/i);
    assert.equal(diagnosisSchema.safeParse(industrial).success, true);
    assert.equal(diagnosisSchema.safeParse(services).success, true);
  });

  it("marca una señal insuficiente y no fabrica porcentajes", () => {
    const diagnosis = buildDiagnosis(
      answers({ currentMethod: "software", painFrequency: "ocasional", goals: ["decisiones", "tiempo"] }),
      IDS,
    );
    const text = JSON.stringify(diagnosis);
    assert.equal(isWeakSignal(answers({ currentMethod: "software", painFrequency: "ocasional" })), true);
    assert.equal(diagnosis.signal, "insuficiente");
    assert.match(diagnosis.summary, /no alcanza/i);
    assert.equal(diagnosis.steps.length, 3);
    assert.equal(/%|\bgarantiz/i.test(text), false);
  });

  it("elige la demostración de un problema libre según el objetivo", () => {
    const commercial = answers({
      problems: ["otro"],
      primaryProblem: "otro",
      otherProblem: "Los reportes del turno llegan tarde",
      goals: ["ventas"],
    });
    const analytical = answers({
      ...commercial,
      goals: ["decisiones"],
    });
    assert.equal(selectDemo(commercial), "crm");
    assert.equal(selectDemo(analytical), "analytics");
    assert.match(buildDiagnosis(commercial, IDS).limitations.join(" "), /texto libre/i);
  });

  it("cambia el primer paso según el método actual", () => {
    const sheets = buildDiagnosis(answers({ currentMethod: "hojas" }), IDS);
    const memory = buildDiagnosis(answers({ currentMethod: "memoria" }), IDS);
    assert.notEqual(sheets.steps[0], memory.steps[0]);
    assert.match(sheets.steps[0], /hojas/i);
    assert.match(memory.steps[0], /memoria/i);
  });

  it("resuelve plantillas distintas para los dos sectores", () => {
    assert.equal(industries.metalurgia.templateKey, "industrial");
    assert.equal(industries.servicios.templateKey, "services");
    assert.equal(templates.industrial.version, 1);
    assert.notEqual(templates.industrial.name, templates.services.name);
  });
});

describe("validación y servicio", () => {
  it("rechaza un formulario incompleto", async () => {
    const result = await requestDiagnosis({ companyName: "A" });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.fieldErrors?.companyName);
  });

  it("guarda empresa y diagnóstico enlazados en memoria", async () => {
    const result = await requestDiagnosis(answers({ companyName: "  Fundición Demo  " }));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.diagnosis.companyName, "Fundición Demo");
    assert.equal(result.diagnosis.source, "rules");
    const repos = getRepositories();
    const stored = await repos.diagnostics.getById(result.diagnosis.id);
    const company = await repos.companies.getById(result.diagnosis.companyId);
    assert.equal(stored?.companyId, company?.id);
    assert.equal(stored?.industryId, company?.industryId);
  });

  it("impide asociar un diagnóstico a una empresa de otro sector", async () => {
    await memoryRepositories.companies.save({
      id: "c1",
      name: "Taller Andino",
      industryId: "metalurgia",
      size: "11-50",
      createdAt: new Date().toISOString(),
    });
    await assert.rejects(() =>
      memoryRepositories.diagnostics.save({
        id: "d1",
        companyId: "c1",
        sessionId: "s1",
        industryId: "servicios",
        answers: answers({ industryId: "servicios" }),
        diagnosis: buildDiagnosis(answers(), IDS),
        createdAt: new Date().toISOString(),
      }),
    );
  });

  it("deja Supabase y Gemini sin conectar", () => {
    process.env.DATA_PROVIDER = "supabase";
    assert.throws(() => getRepositories(), PersistenceNotReadyError);
    process.env.DATA_PROVIDER = "memory";
    process.env.DIAGNOSIS_PROVIDER = "gemini";
    assert.throws(() => getDiagnosisProvider(), ProviderNotReadyError);
  });

  it("valida los pasos y el borrador", () => {
    const errors = validateStep(0, {
      companyName: "",
      industryId: "",
      size: "",
      problems: [],
      otherProblem: "",
      primaryProblem: "",
      goals: [],
      currentMethod: "",
      painFrequency: "",
    });
    assert.equal(firstInvalidStep(errors), 0);
    assert.equal(normalizeDraft({ ...answers(), problems: ["tareas"], primaryProblem: "inventario", industryId: "metalurgia", size: "1-10", otherProblem: "", currentMethod: "nada", painFrequency: "diaria", goals: ["errores"] }).primaryProblem, "tareas");
    assert.equal(parseStoredSession("{").templateKey, "base");
    assert.equal(isLowStock(2, 5), true);
    assert.notDeepStrictEqual(analyticsFor("services")[0].metrics, analyticsFor("services")[1].metrics);
  });
});
