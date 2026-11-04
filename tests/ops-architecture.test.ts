import assert from "node:assert/strict";
import test from "node:test";
import { cloneCrmCatalog } from "../lib/assistant/crm-state";
import { crmCatalogFromVoice } from "../lib/assistant/crm-catalog";
import { crmDashboardMetrics } from "../lib/assistant/crm-dashboard-metrics";
import { tryLocalOpsQuery } from "../lib/assistant/ops-capture";
import { opsTablesFromEntities } from "../lib/assistant/ops-capture";
import { dashboardMetrics } from "../lib/ops/dashboard/metrics";
import { lexiconForIndustry, sectorOpsConfig } from "../lib/ops/sector/registry";
import { solutionVoice } from "../lib/radar/solution-voice";

test("turismo hotel sigue en el motor compartido y otra industria no hereda su léxico", () => {
  const tourism = sectorOpsConfig({
    industryId: "turismo",
    activityId: "turismo-hotel",
    sectorLabel: "Turismo · hotel",
  });
  const alimentos = sectorOpsConfig({
    industryId: "alimentos",
    activityId: "alimentos-produccion",
    sectorLabel: "Alimentos · producción",
  });

  assert.equal(tourism.anchorId, "operacion-hotel");
  assert.equal(tourism.dashboard?.primaryId, "reservas");
  assert.equal(alimentos.dashboard?.primaryId, "registro");
  assert.ok(lexiconForIndustry("alimentos", "alimentos-produccion").tableHints.length > 0);
  assert.ok(lexiconForIndustry("turismo", "turismo-hotel").tableHints.length > 0);
  assert.notEqual(alimentos.starters[0], tourism.starters[0]);
});

test("el tablero sectorial sale de las tablas del catálogo, no de reservas de hotel", () => {
  const voice = solutionVoice({ companyName: "Panadería Carlitos", industryId: "alimentos", activityId: "alimentos-produccion" });
  const sector = sectorOpsConfig({ industryId: "alimentos", activityId: "alimentos-produccion", sectorLabel: "Alimentos" });
  const entities = cloneCrmCatalog(crmCatalogFromVoice(voice, "alimentos", "alimentos-produccion"));
  const metrics = dashboardMetrics(entities, sector.dashboard);
  const primary = entities[0];
  assert.equal(metrics.kpis[0]?.label, sector.dashboard?.kpis.primary.label);
  assert.equal(metrics.kpis[0]?.value, String(primary?.rows.length));
  assert.equal(crmDashboardMetrics(entities).kpis[0]?.label, primary?.label);
});

test("una consulta de hotel no se responde con tablas de otro sector", () => {
  const voice = solutionVoice({ companyName: "Panadería Carlitos", industryId: "alimentos", activityId: "alimentos-produccion" });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "alimentos", "alimentos-produccion")));
  const answer = tryLocalOpsQuery("¿Cuántas reservas tengo?", tables, lexiconForIndustry("alimentos", "alimentos-produccion"));
  assert.equal(answer?.includes("Reservas"), false);
});
