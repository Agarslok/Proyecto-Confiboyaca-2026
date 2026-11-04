import assert from "node:assert/strict";
import test from "node:test";
import { opsBriefFromSector } from "../lib/assistant/ops-brief";
import { crmDashboardMetrics, trendWithProjection } from "../lib/assistant/crm-dashboard-metrics";
import { cloneCrmCatalog } from "../lib/assistant/crm-state";
import { crmCatalogFromVoice } from "../lib/assistant/crm-catalog";
import { solutionVoice } from "../lib/radar/solution-voice";

test("KPIs reflejan filas añadidas en reservas", () => {
  const voice = solutionVoice({ companyName: "Laguna Verde", industryId: "turismo", activityId: "turismo-hotel" });
  const entities = cloneCrmCatalog(crmCatalogFromVoice(voice, "turismo"));
  const reservas = entities.find((entity) => entity.id === "reservas");
  assert.ok(reservas);
  reservas.rows.push({
    guest: "Grupo empresa",
    arrival: "Lun 10 nov",
    guestCount: "4",
    room: "Suite",
  });

  const metrics = crmDashboardMetrics(entities);
  const reservasKpi = metrics.kpis.find((kpi) => kpi.label === "Reservas");
  assert.equal(reservasKpi?.value, String(reservas.rows.filter((r) => r.guest).length));
  assert.ok(metrics.pieRoomMix.some((slice) => slice.label === "Suite"));
  assert.ok(metrics.barGuestsByRoom.some((item) => item.label === "Suite" && item.value >= 4));
});

test("opsBrief incluye tablas y cifras del CRM", () => {
  const brief = opsBriefFromSector({
    companyName: "Laguna Verde",
    industryId: "turismo",
    activityId: "turismo-hotel",
  });
  assert.match(brief, /Reservas/);
  assert.match(brief, /Habitación/);
  assert.match(brief, /Cifras:/);
});

test("trendWithProjection crece con el control de optimismo", () => {
  const samples = [
    { label: "A", guests: 2 },
    { label: "B", guests: 3 },
    { label: "C", guests: 1 },
  ];
  const low = trendWithProjection(samples, 0);
  const high = trendWithProjection(samples, 100);
  const lastLow = low.at(-1)?.value ?? 0;
  const lastHigh = high.at(-1)?.value ?? 0;
  assert.ok(lastHigh > lastLow);
  assert.equal(low.filter((point) => point.kind === "actual").length, 3);
});
