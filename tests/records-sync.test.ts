import assert from "node:assert/strict";
import test from "node:test";
import { crmCatalogFromVoice } from "../lib/assistant/crm-catalog";
import { CRM_META_OP_ID } from "../lib/assistant/crm-row-meta";
import {
  applyCrmSnapshot,
  cloneCrmCatalog,
  commitAndPersist,
  commitCapturedRow,
  crmSessionKey,
  DUPLICATE_WINDOW_MS,
  meaningfulRows,
  readCrmSession,
  writeCrmSession,
  type CrmEntityState,
  type StorageLike,
} from "../lib/assistant/crm-state";
import { validateRowValues } from "../lib/assistant/crm-validate";
import { opsTablesFromEntities, tryLocalOpsQuery, tryLocalOpsReply } from "../lib/assistant/ops-capture";
import { sessionStorageKey } from "../lib/assistant/session-quota";
import { workspaceScope } from "../lib/assistant/workspace";
import { dashboardMetrics, hasOperationalData, recentRecords } from "../lib/ops/dashboard/metrics";
import { sectorOpsConfig } from "../lib/ops/sector/registry";
import { solutionVoice } from "../lib/radar/solution-voice";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const brokenStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

/** Acepta la escritura pero no la conserva: la verificación de lectura debe detectarlo. */
const lossyStorage: StorageLike = { getItem: () => null, setItem: () => undefined };

function hotel(): CrmEntityState[] {
  const voice = solutionVoice({ companyName: "Laguna Verde", industryId: "turismo", activityId: "turismo-hotel" });
  return cloneCrmCatalog(crmCatalogFromVoice(voice, "turismo", "turismo-hotel"));
}

const reservation = {
  tableLabel: "Reservas",
  values: { guest: "Familia Moreno", arrival: "Hoy", guestCount: "4", room: "Habitación doble" },
};

test("validación: no registra «Por definir», cantidades inválidas ni texto con etiquetas", () => {
  const reservas = hotel().find((entity) => entity.id === "reservas")!;
  assert.equal(validateRowValues(reservas, reservation.values).ok, true);

  const pending = validateRowValues(reservas, { ...reservation.values, guest: "Por definir" });
  assert.equal(pending.ok, false);
  const zero = validateRowValues(reservas, { ...reservation.values, guestCount: "0" });
  assert.equal(zero.ok, false);
  const text = validateRowValues(reservas, { ...reservation.values, guestCount: "cuatro" });
  assert.equal(text.ok, false);
  const markup = validateRowValues(reservas, { ...reservation.values, guest: "<b>Ana</b>" });
  assert.equal(markup.ok, false);
  const partial = validateRowValues(reservas, { guest: "Ana", arrival: "", guestCount: "", room: "" }, { partial: true });
  assert.equal(partial.ok, true);
  assert.equal(validateRowValues(reservas, {}, { partial: true }).ok, false);
});

test("registrar guarda, persiste y el dashboard lee ese mismo registro", () => {
  const storage = memoryStorage();
  const key = crmSessionKey("RAD-AAA1");
  const entities = hotel();
  assert.equal(hasOperationalData(entities), false);

  const result = commitAndPersist(entities, reservation, { key, storage, opId: "op-1" });
  assert.equal(result.ok, true);
  assert.ok(result.ok && result.status === "created");
  if (!result.ok) return;

  // Recarga: lo que hay en el almacenamiento reconstruye exactamente el mismo estado.
  const snapshot = readCrmSession(key, storage);
  assert.ok(snapshot);
  const reloaded = applyCrmSnapshot(hotel(), snapshot);
  const reservas = reloaded.find((entity) => entity.id === "reservas")!;
  assert.equal(meaningfulRows(reservas).length, 1);
  assert.equal(reservas.rows[0]?.guest, "Familia Moreno");

  // Dashboard e historial salen de las filas guardadas, no de datos de ejemplo.
  const binding = sectorOpsConfig({ industryId: "turismo", activityId: "turismo-hotel", sectorLabel: "Turismo" }).dashboard;
  const metrics = dashboardMetrics(reloaded, binding);
  assert.equal(metrics.kpis[0]?.value, "1");
  assert.equal(metrics.kpis[1]?.value, "4");
  assert.deepEqual(metrics.barGuestsByRoom, [{ label: "Habitación doble", value: 4 }]);
  assert.match(recentRecords(reloaded)[0]?.summary ?? "", /Familia Moreno/);

  // El asistente consulta las mismas filas.
  const answer = tryLocalOpsQuery("¿Cuántas reservas tengo?", opsTablesFromEntities(reloaded));
  assert.match(answer ?? "", /1 registro/);
});

test("si falla el almacenamiento no se confirma ni cambia el estado", () => {
  const entities = hotel();
  for (const storage of [brokenStorage, lossyStorage]) {
    const result = commitAndPersist(entities, reservation, { key: "ops-crm:X", storage, opId: "op-x" });
    assert.equal(result.ok, false);
    assert.ok(!result.ok && result.reason === "storage");
    assert.match(!result.ok ? result.message : "", /NO quedó registrada/);
  }
  assert.equal(hasOperationalData(entities), false);
  assert.equal(writeCrmSession("k", entities, brokenStorage), false);
});

test("una ficha incompleta o a una tabla inexistente no se guarda", () => {
  const storage = memoryStorage();
  const incomplete = commitAndPersist(hotel(), { ...reservation, values: { ...reservation.values, guest: "Por definir" } }, {
    key: "ops-crm:X",
    storage,
  });
  assert.ok(!incomplete.ok && incomplete.reason === "invalid");
  const unknown = commitAndPersist(hotel(), { tableLabel: "Inventario lunar", values: reservation.values }, { key: "ops-crm:X", storage });
  assert.ok(!unknown.ok && unknown.reason === "unknown_table");
  assert.equal(storage.data.size, 0);
});

test("no duplica por reintentos: misma operación, mismo contenido en la ventana; sí después", () => {
  const storage = memoryStorage();
  const key = "ops-crm:RAD-AAA1";
  const t0 = new Date("2026-11-03T10:00:00Z");
  const first = commitAndPersist(hotel(), reservation, { key, storage, opId: "op-1", now: t0 });
  assert.ok(first.ok && first.status === "created");
  if (!first.ok) return;

  // Mismo turno procesado dos veces (doble clic, reintento de red, render doble).
  const sameOp = commitAndPersist(first.entities, { ...reservation, values: { ...reservation.values, guestCount: "5" } }, {
    key,
    storage,
    opId: "op-1",
    now: new Date(t0.getTime() + 1000),
  });
  assert.ok(sameOp.ok && sameOp.status === "duplicate");

  // Mismo contenido repetido enseguida con otro turno.
  const repeated = commitAndPersist(first.entities, reservation, {
    key,
    storage,
    opId: "op-2",
    now: new Date(t0.getTime() + 5000),
  });
  assert.ok(repeated.ok && repeated.status === "duplicate");

  // Misma reserva pasada la ventana: es otra operación legítima.
  const later = commitAndPersist(first.entities, reservation, {
    key,
    storage,
    opId: "op-3",
    now: new Date(t0.getTime() + DUPLICATE_WINDOW_MS + 1000),
  });
  assert.ok(later.ok && later.status === "created");
  if (!later.ok) return;
  const reservas = later.entities.find((entity) => entity.id === "reservas")!;
  assert.equal(meaningfulRows(reservas).length, 2);
  assert.deepEqual(
    reservas.rows.map((row) => row[CRM_META_OP_ID]),
    ["op-1", "op-3"],
  );
});

test("escribe en una sola tabla aunque dos etiquetas se parezcan", () => {
  const entities = hotel();
  const result = commitCapturedRow(entities, reservation);
  assert.ok(result.ok);
  if (!result.ok) return;
  const withRows = result.entities.filter((entity) => meaningfulRows(entity).length > 0);
  assert.deepEqual(
    withRows.map((entity) => entity.id),
    ["reservas"],
  );
});

test("sesiones aisladas: cada empresa, y cada demo sin código, tiene su propia base", () => {
  const storage = memoryStorage();
  const keyA = crmSessionKey("RAD-AAA1");
  const keyB = crmSessionKey("rad-bbb2");
  assert.notEqual(keyA, keyB);
  assert.equal(crmSessionKey(" rad-aaa1 "), keyA);

  const resultA = commitAndPersist(hotel(), reservation, { key: keyA, storage, opId: "a-1" });
  assert.ok(resultA.ok);
  assert.equal(readCrmSession(keyB, storage), null);
  const rowsB = applyCrmSnapshot(hotel(), readCrmSession(keyB, storage) ?? {});
  assert.equal(hasOperationalData(rowsB), false);

  // Sin código RAD, dos sectores no comparten espacio (antes ambos caían en «DEMO»).
  const hotelScope = workspaceScope("turismo", "turismo-hotel");
  const bakeryScope = workspaceScope("alimentos", "alimentos-produccion");
  assert.notEqual(crmSessionKey(undefined, hotelScope), crmSessionKey(undefined, bakeryScope));
  assert.notEqual(sessionStorageKey(undefined, hotelScope), sessionStorageKey(undefined, bakeryScope));
  // El chat y la base de datos de una misma empresa usan el mismo identificador.
  assert.equal(crmSessionKey("RAD-AAA1").split(":")[1], sessionStorageKey("RAD-AAA1").split(":")[1]);
});

test("un respaldo de otro catálogo no contamina: se ignoran tablas y columnas desconocidas", () => {
  const polluted = applyCrmSnapshot(hotel(), {
    reservas: [{ guest: "Ana", arrival: "Hoy", guestCount: "2", room: "Suite", inventada: "x", _status: "Confirmado" }],
    existencias: [{ who: "Otra empresa", what: "Pan", howMany: "9", when: "Hoy" }],
  });
  const reservas = polluted.find((entity) => entity.id === "reservas")!;
  assert.equal("inventada" in (reservas.rows[0] ?? {}), false);
  assert.equal(reservas.rows[0]?._status, "Confirmado");
  assert.equal(polluted.some((entity) => entity.id === "existencias"), false);
});

test("flujo completo en otra industria: conversación → registro → dashboard", () => {
  const voice = solutionVoice({ companyName: "Panadería Carlitos", industryId: "alimentos", activityId: "alimentos-produccion" });
  const entities = cloneCrmCatalog(crmCatalogFromVoice(voice, "alimentos", "alimentos-produccion"));
  const sector = sectorOpsConfig({ industryId: "alimentos", activityId: "alimentos-produccion", sectorLabel: "Alimentos" });
  const tables = opsTablesFromEntities(entities);
  const primary = tables[0]!;
  const labels = primary.columns.map((column) => column.label);
  assert.equal(labels.length, 4);

  // Las listas de sugerencias de texto no deben traer cifras ni estados (defecto de columnas mezcladas).
  for (const column of primary.columns.filter((c) => c.slot === "who" || c.slot === "what")) {
    assert.ok(column.options.length > 0);
    assert.ok(
      column.options.every((option) => !/^\d/.test(option)),
      `opciones de "${column.label}" con cifras: ${column.options.join(", ")}`,
    );
  }
  for (const column of primary.columns.filter((c) => c.slot === "howMany")) {
    assert.ok(column.options.every((option) => /^\d{1,5}$/.test(option)));
  }

  const opening = tryLocalOpsReply("Registra producción o pedido de productos (producción de alimentos) para mañana", tables, []);
  assert.ok(opening, "la conversación debe abrir un registro guiado");

  const storage = memoryStorage();
  const stored = commitAndPersist(
    entities,
    {
      tableLabel: primary.tableLabel,
      values: Object.fromEntries(
        primary.columns.map((column) => [
          column.key,
          column.slot === "howMany" ? "12" : column.slot === "when" ? "Hoy" : column.slot === "who" ? "Hotel Sol" : "Mogollas",
        ]),
      ),
    },
    { key: crmSessionKey("RAD-PAN1"), storage, opId: "pan-1" },
  );
  assert.ok(stored.ok && stored.status === "created");
  if (!stored.ok) return;
  const metrics = dashboardMetrics(stored.entities, sector.dashboard);
  assert.equal(metrics.kpis[0]?.value, "1");
  assert.equal(metrics.kpis[1]?.value, "12");
});
