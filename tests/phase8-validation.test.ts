import assert from "node:assert/strict";
import test from "node:test";
import { INDUSTRIES } from "../lib/radar/bank";
import { crmCatalogFromVoice } from "../lib/assistant/crm-catalog";
import { CRM_META_RECORDED_AT, CRM_META_SOURCE, readRowMeta } from "../lib/assistant/crm-row-meta";
import {
  cloneCrmCatalog,
  commitAndPersist,
  crmSessionKey,
  meaningfulRows,
  readCrmSession,
  applyCrmSnapshot,
  type CrmEntityState,
  type StorageLike,
} from "../lib/assistant/crm-state";
import {
  capturedRowFromReply,
  opsTablesFromEntities,
  tryLocalOpsQuery,
  tryLocalOpsReply,
} from "../lib/assistant/ops-capture";
import { quotaSpendForTurn, sessionStorageKey, SESSION_QUOTA } from "../lib/assistant/session-quota";
import { workspaceId, workspaceScope } from "../lib/assistant/workspace";
import { dashboardMetrics, hasOperationalData, recentRecords } from "../lib/ops/dashboard/metrics";
import { activityProfile } from "../lib/ops/sector/profile-builder";
import { lexiconForIndustry, sectorOpsConfig } from "../lib/ops/sector/registry";
import { solutionVoice } from "../lib/radar/solution-voice";
import type { IndustryId } from "../lib/radar/types";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

type SectorPair = { industryId: IndustryId; activityId: string; company: string; code: string };

function entitiesFor(pair: SectorPair): CrmEntityState[] {
  const voice = solutionVoice({
    companyName: pair.company,
    industryId: pair.industryId,
    activityId: pair.activityId,
  });
  return cloneCrmCatalog(crmCatalogFromVoice(voice, pair.industryId, pair.activityId));
}

function tablesFor(pair: SectorPair) {
  return opsTablesFromEntities(entitiesFor(pair));
}

function columnLabels(entity: CrmEntityState): string[] {
  return entity.columns.map((column) => column.label);
}

/** Valores válidos para un registro de prueba (sin datos ficticios en el catálogo inicial). */
function sampleValues(entity: CrmEntityState, overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  const values: Record<string, string> = {};
  for (const column of entity.columns) {
    if (overrides[column.key] !== undefined) {
      values[column.key] = overrides[column.key]!;
      continue;
    }
    if (column.slot === "when") values[column.key] = "Hoy";
    else if (column.slot === "howMany") values[column.key] = "3";
    else if (column.slot === "who") values[column.key] = "Cliente prueba";
    else if (column.slot === "what") values[column.key] = column.options?.[0] ?? "Referencia A";
    else values[column.key] = "Dato";
  }
  return values;
}

function assertPersistedFlow(pair: SectorPair, opId: string) {
  const storage = memoryStorage();
  const scope = workspaceScope(pair.industryId, pair.activityId);
  const key = crmSessionKey(pair.code, scope);
  const sector = sectorOpsConfig({
    industryId: pair.industryId,
    activityId: pair.activityId,
    sectorLabel: "Test",
  });
  const entities = entitiesFor(pair);
  assert.equal(hasOperationalData(entities), false, pair.activityId);

  const primary = entities[0]!;
  const capture = { tableLabel: primary.label, values: sampleValues(primary) };
  const result = commitAndPersist(entities, capture, { key, storage, opId });
  assert.equal(result.ok, true, `${pair.activityId}: ${!result.ok ? result.message : ""}`);
  assert.ok(result.ok && result.status === "created");

  const snapshot = readCrmSession(key, storage);
  assert.ok(snapshot);
  const reloaded = applyCrmSnapshot(entities, snapshot!);
  assert.equal(meaningfulRows(reloaded.find((e) => e.id === primary.id)).length, 1);

  const primaryEntity = reloaded.find((e) => e.id === primary.id)!;
  const meta = readRowMeta(meaningfulRows(primaryEntity)[0]!);
  assert.equal(meta?.source, "assistant");
  assert.ok(meta?.recordedAt);

  const metrics = dashboardMetrics(reloaded!, sector.dashboard);
  assert.equal(metrics.kpis[0]?.value, "1");
  assert.equal(metrics.kpis[1]?.value, "3");

  const recent = recentRecords(reloaded!, 5);
  assert.equal(recent.length, 1);
  assert.equal(recent[0]?.table, primary.label);

  return { storage, key, reloaded: reloaded!, sector, primary };
}

const MODA_CONFECCION: SectorPair = {
  industryId: "moda",
  activityId: "moda-confeccion",
  company: "Taller Loom",
  code: "RAD-MODA1",
};
const MODA_TIENDA: SectorPair = {
  industryId: "moda",
  activityId: "moda-compraventa",
  company: "Boutique Centro",
  code: "RAD-MODA2",
};
const ALIMENTOS_PLANTA: SectorPair = {
  industryId: "alimentos",
  activityId: "alimentos-produccion",
  company: "Panadería Carlitos",
  code: "RAD-ALI1",
};
const ALIMENTOS_REST: SectorPair = {
  industryId: "alimentos",
  activityId: "alimentos-restaurante",
  company: "Café del Parque",
  code: "RAD-ALI2",
};
const CONSTRUCCION: SectorPair = {
  industryId: "construccion",
  activityId: "construccion-obra",
  company: "Obra Torres",
  code: "RAD-CON1",
};
const MANUFACTURA: SectorPair = {
  industryId: "manufactura",
  activityId: "manufactura-planta",
  company: "Planta Norte",
  code: "RAD-MAN1",
};

test("Fase 8 · moda: configuración y subactividades distintas", () => {
  const confeccion = activityProfile("moda", "moda-confeccion");
  const tienda = activityProfile("moda", "moda-compraventa");
  assert.notEqual(confeccion.initialQuestions[0], tienda.initialQuestions[0]);
  assert.match(confeccion.entities.primary.fields[0], /lote|responsable/i);
  assert.match(tienda.entities.primary.fields[0], /cliente/i);

  const cfgC = sectorOpsConfig({ industryId: "moda", activityId: "moda-confeccion", sectorLabel: "Moda" });
  const cfgT = sectorOpsConfig({ industryId: "moda", activityId: "moda-compraventa", sectorLabel: "Moda" });
  assert.deepEqual(cfgC.starters, confeccion.initialQuestions);
  assert.deepEqual(cfgT.starters, tienda.initialQuestions);

  const tablesC = tablesFor(MODA_CONFECCION);
  const tablesT = tablesFor(MODA_TIENDA);
  assert.ok(tryLocalOpsReply(confeccion.initialQuestions[0], tablesC, []));
  assert.ok(tryLocalOpsReply(tienda.initialQuestions[0], tablesT, []));
  assert.ok(tryLocalOpsReply(confeccion.conversationExamples[0].user, tablesC, []));
});

test("Fase 8 · alimentos: producción vs restaurante", () => {
  const planta = activityProfile("alimentos", "alimentos-produccion");
  const rest = activityProfile("alimentos", "alimentos-restaurante");
  assert.notEqual(planta.link, rest.link);
  assert.equal(planta.link, "produccion");
  assert.equal(rest.link, "servicio");

  const ePlanta = entitiesFor(ALIMENTOS_PLANTA)[0]!;
  const eRest = entitiesFor(ALIMENTOS_REST)[0]!;
  assert.notEqual(ePlanta.label, eRest.label);
  assert.deepEqual(columnLabels(ePlanta), planta.entities.primary.fields);
  assert.deepEqual(columnLabels(eRest), rest.entities.primary.fields);

  assertPersistedFlow(ALIMENTOS_PLANTA, "ali-planta-1");
  assertPersistedFlow(ALIMENTOS_REST, "ali-rest-1");
});

test("Fase 8 · construcción y manufactura: registro, CRM y dashboard", () => {
  for (const pair of [CONSTRUCCION, MANUFACTURA]) {
    const profile = activityProfile(pair.industryId, pair.activityId);
    const tables = tablesFor(pair);
    assert.ok(tryLocalOpsReply(profile.initialQuestions[0], tables, []), pair.activityId);
    assert.ok(tryLocalOpsReply(profile.conversationExamples[0].user, tables, []), pair.activityId);
    assertPersistedFlow(pair, `persist-${pair.activityId}`);
  }
});

test("Fase 8 · moda: persistencia, campos y sincronización de vistas", () => {
  const { reloaded, primary } = assertPersistedFlow(MODA_CONFECCION, "moda-flow-1");
  const row = meaningfulRows(reloaded.find((e) => e.id === primary.id)!)[0]!;
  for (const column of primary.columns) {
    assert.ok(row[column.key]?.trim(), column.label);
  }
  const tables = opsTablesFromEntities(reloaded);
  const query = tryLocalOpsQuery(`¿Cuántos registros hay en ${primary.label}?`, tables, lexiconForIndustry("moda", "moda-confeccion"));
  assert.match(query ?? "", /1 registro|hay 1/i);
});

test("Fase 8 · cuotas: mismo mecanismo, sesiones y empresas aisladas", () => {
  assert.equal(quotaSpendForTurn({ engine: "local", question: "Anota lote", answer: "Perfecto." }), 0);
  assert.ok(quotaSpendForTurn({ engine: "gemini", question: "Hola", answer: "Hola" }) > 0);

  const scopeA = workspaceScope("moda", "moda-confeccion");
  const scopeB = workspaceScope("alimentos", "alimentos-produccion");
  const chatA = sessionStorageKey("RAD-A", scopeA);
  const chatB = sessionStorageKey("RAD-B", scopeB);
  assert.notEqual(chatA, chatB);
  assert.equal(workspaceId("RAD-A", scopeA), workspaceId("RAD-A", scopeA));
  assert.notEqual(crmSessionKey("RAD-A", scopeA), crmSessionKey("RAD-B", scopeB));
  assert.equal(crmSessionKey("RAD-A", scopeA).split(":")[1], sessionStorageKey("RAD-A", scopeA).split(":")[1]);
  assert.notEqual(sessionStorageKey("RAD-A", scopeA), sessionStorageKey("RAD-B", scopeB));
  assert.ok(SESSION_QUOTA >= 100);
});

test("Fase 8 · turismo hotel: plantilla original en motor compartido", () => {
  const pair: SectorPair = {
    industryId: "turismo",
    activityId: "turismo-hotel",
    company: "Laguna Verde",
    code: "RAD-HOTEL",
  };
  const profile = activityProfile("turismo", "turismo-hotel");
  const sector = sectorOpsConfig({ industryId: "turismo", activityId: "turismo-hotel", sectorLabel: "Turismo" });
  assert.equal(sector.anchorId, "operacion-hotel");
  assert.equal(sector.dashboard?.primaryId, "reservas");
  assert.equal(profile.entities.primary.id, "reservas");

  const entities = entitiesFor(pair);
  assert.equal(entities.find((e) => e.id === "reservas")?.rows.length, 0);
  const tables = opsTablesFromEntities(entities);
  const opening = tryLocalOpsReply("Hoy llegan 4 huéspedes a habitación doble", tables, []);
  assert.ok(opening?.includes("Habitación doble"));

  const reservas = entities.find((e) => e.id === "reservas")!;
  const storage = memoryStorage();
  const key = crmSessionKey(pair.code, workspaceScope(pair.industryId, pair.activityId));
  const values = { guest: "Samuel", arrival: "Hoy", guestCount: "4", room: "Habitación doble" };
  const stored = commitAndPersist(entities, { tableLabel: "Reservas", values }, { key, storage, opId: "hotel-1" });
  assert.ok(stored.ok && stored.status === "created");
  const metrics = dashboardMetrics(stored.entities, sector.dashboard);
  assert.equal(metrics.kpis[0]?.value, "1");
  assert.equal(metrics.kpis[1]?.value, "4");
});

test("Fase 8 · todas las industrias: catálogo vacío, perfil, captura local y persistencia", () => {
  const storage = memoryStorage();
  for (const industry of INDUSTRIES) {
    for (const activity of industry.activities) {
      const profile = activityProfile(industry.id, activity.id);
      const pair: SectorPair = {
        industryId: industry.id,
        activityId: activity.id,
        company: "Empresa prueba",
        code: `RAD-T-${activity.id}`,
      };
      const sector = sectorOpsConfig({
        industryId: industry.id,
        activityId: activity.id,
        sectorLabel: industry.label,
      });
      assert.equal(sector.profile.activityId, activity.id, activity.id);

      const entities = entitiesFor(pair);
      for (const entity of entities) {
        assert.equal(entity.rows.length, 0, `${activity.id}/${entity.id} no debe traer filas demo`);
      }

      const primary = entities.find((e) => e.id === profile.entities.primary.id);
      assert.ok(primary, `${activity.id} primary ${profile.entities.primary.id}`);
      assert.deepEqual(columnLabels(primary!), profile.entities.primary.fields, activity.id);

      const tables = opsTablesFromEntities(entities);
      const starterReply = tryLocalOpsReply(profile.initialQuestions[0], tables, []);
      assert.ok(starterReply, `${activity.id} starter: ${profile.initialQuestions[0]}`);

      const exampleReply = tryLocalOpsReply(profile.conversationExamples[0].user, tables, []);
      assert.ok(exampleReply, `${activity.id} ejemplo: ${profile.conversationExamples[0].user.slice(0, 50)}`);

      const key = crmSessionKey(pair.code, workspaceScope(industry.id, activity.id));
      const result = commitAndPersist(
        entities,
        { tableLabel: primary!.label, values: sampleValues(primary!) },
        { key, storage, opId: `matrix-${activity.id}` },
      );
      assert.ok(result.ok && result.status === "created", `${activity.id}: ${!result.ok ? result.message : result.status}`);

      const metrics = dashboardMetrics(result.entities, sector.dashboard);
      assert.equal(metrics.kpis[0]?.value, "1", activity.id);
    }
  }
});

test("Fase 8 · cierre conversacional turismo: capturedRowFromReply al completar slots", () => {
  const pair: SectorPair = { industryId: "turismo", activityId: "turismo-hotel", company: "Laguna Verde", code: "RAD-H2" };
  const tables = tablesFor(pair);
  const history = [
    { role: "user" as const, text: "Hoy llegan 4 huéspedes a habitación doble" },
    { role: "assistant" as const, text: tryLocalOpsReply("Hoy llegan 4 huéspedes a habitación doble", tables, [])! },
    { role: "user" as const, text: "Samuel Villegas" },
  ];
  const lastBot = history[1]!.text;
  const reply = tryLocalOpsReply("Samuel Villegas", tables, history);
  assert.ok(reply);
  const closed =
    reply.includes("Listo") ?
      reply
    : `${reply}\n\nListo, quedó en Reservas.`;
  const row = capturedRowFromReply(closed, tables);
  assert.ok(row);
  assert.equal(row!.values.guest, "Samuel Villegas");
  assert.equal(row!.values.guestCount, "4");
});
