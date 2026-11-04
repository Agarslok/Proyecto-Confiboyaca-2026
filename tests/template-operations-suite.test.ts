import assert from "node:assert/strict";
import test from "node:test";
import { TEMPLATE_IDS } from "../types/site";
import { sectorOpsPack } from "../lib/ops/sector/pack";
import { activityProfile } from "../lib/ops/sector/profile-builder";
import { buildShowcaseConfig, SHOWCASE_HUB_PATH, showcasePath } from "../lib/site/operations-showcase";
import { companyNameHint } from "../lib/assistant/company-context";
import { opsBriefFromEntities } from "../lib/assistant/ops-brief";
import { cloneCrmCatalog } from "../lib/assistant/crm-state";
import { compactProfileGuidance } from "../lib/ops/sector/profile-builder";
import { operationsThemeFor } from "../lib/site/operations-theme";
import type { SiteConfig, TemplateId } from "../types/site";

function minimalSite(templateId: TemplateId, industryId: string, activityId: string): SiteConfig {
  return {
    templateId,
    sectorId: templateId === "turismo" ? "turismo" : templateId === "gastronomia" ? "gastronomia" : "retail",
    companyName: templateId === "gastronomia" ? "Panadería Carlitos" : "Empresa demo",
    recordCode: "RAD-DEMO",
    industryId,
    activityId,
    radar: {
      industryLabel: "Test",
      activityLabel: "Test",
      sizeLabel: "Pequeña",
      index: 88,
      level: "bajo",
      findings: [],
      presentation: { vocab: { productos: "productos", clientes: "clientes", punto: "local" } },
    },
  } as unknown as SiteConfig;
}

const TEMPLATE_SAMPLES: Record<TemplateId, { industryId: string; activityId: string }> = {
  turismo: { industryId: "turismo", activityId: "turismo-hotel" },
  gastronomia: { industryId: "alimentos", activityId: "alimentos-produccion" },
  retail: { industryId: "moda", activityId: "moda-compraventa" },
  metalurgia: { industryId: "manufactura", activityId: "manufactura-planta" },
  agroindustria: { industryId: "agro", activityId: "agro-primaria" },
  servicios: { industryId: "salud", activityId: "salud-ips" },
};

test("cada plantilla visual obtiene el mismo paquete operativo (chat + CRM + dashboard)", () => {
  for (const templateId of TEMPLATE_IDS) {
    const sample = TEMPLATE_SAMPLES[templateId];
    const pack = sectorOpsPack(minimalSite(templateId, sample.industryId, sample.activityId));
    assert.ok(pack.crmCatalog.entities.length >= 2, templateId);
    assert.equal(pack.crmCatalog.entities.every((e) => e.rows.length === 0), true, templateId);
    assert.ok(pack.sector.dashboard, templateId);
    assert.ok(pack.sector.profile.initialQuestions.length === 3, templateId);
    assert.ok(pack.assistant.action === "asistente", templateId);
  }
});

test("vitrina operativa expone ruta por plantilla", () => {
  assert.equal(SHOWCASE_HUB_PATH, "/boceto/plantillas");
  for (const templateId of TEMPLATE_IDS) {
    assert.equal(showcasePath(templateId), `/boceto/plantillas/${templateId}`);
    const config = buildShowcaseConfig(templateId);
    assert.ok(config.recordCode?.startsWith("RAD-SHOW"));
  }
});

test("metalurgia usa acento amarillo en el tema operativo", () => {
  const theme = operationsThemeFor("metalurgia");
  assert.equal(theme["--ops-accent"], "#ffd21f");
  assert.equal(theme["--ops-chat-bg"], "#0c0c0d");
  assert.equal(theme["--ops-tab-active-bg"], "#ffd21f");
  assert.equal(theme["--ops-tab-active-text"], "#0c0c0d");
});

test("agro y metalurgia: sugerencias cortas sin paréntesis", () => {
  for (const pair of [
    { industryId: "pecuaria" as const, activityId: "pecuaria-bovinos" },
    { industryId: "mineria" as const, activityId: "mineria-extraccion" },
  ]) {
    const profile = activityProfile(pair.industryId, pair.activityId);
    for (const line of profile.initialQuestions) {
      assert.doesNotMatch(line, /[()]/, pair.activityId);
    }
    assert.ok(profile.initialQuestions[0].length <= 42, profile.initialQuestions[0]);
    assert.match(profile.initialQuestions[1], /\?/, pair.activityId);
    assert.match(profile.initialQuestions[2], /\?/, pair.activityId);
  }
});

test("agro y metalurgia: contexto del asistente cabe en los límites del API", () => {
  for (const templateId of ["agroindustria", "metalurgia"] as const) {
    const config = buildShowcaseConfig(templateId);
    const pack = sectorOpsPack(config);
    const entities = cloneCrmCatalog(pack.crmCatalog);
    const guidance = compactProfileGuidance(pack.sector.profile, 580);
    const hint = companyNameHint(pack.companyName);
    const brief = opsBriefFromEntities(entities, pack.crmCatalog.sectorLabel);
    assert.ok(guidance.length <= 1200, templateId);
    assert.ok(hint.length <= 400, templateId);
    assert.ok(brief.length <= 4000, templateId);
  }
});

test("anclas de navegación por plantilla (CTA del sitio → tres vistas)", () => {
  assert.equal(sectorOpsPack(minimalSite("turismo", "turismo", "turismo-hotel")).sector.anchorId, "operacion-hotel");
  assert.equal(sectorOpsPack(minimalSite("gastronomia", "alimentos", "alimentos-produccion")).sector.anchorId, "reservas");
  assert.equal(sectorOpsPack(minimalSite("servicios", "salud", "salud-ips")).sector.anchorId, "agenda");
  assert.equal(sectorOpsPack(minimalSite("retail", "moda", "moda-compraventa")).sector.anchorId, "operacion");
});
