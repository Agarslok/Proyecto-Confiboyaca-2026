import assert from "node:assert/strict";
import test from "node:test";
import { crmCatalogFromVoice, isCrmRowEmpty, normalizeCrmRow } from "../lib/assistant/crm-catalog";
import { solutionVoice } from "../lib/radar/solution-voice";

test("catálogo CRM turismo: reservas con tres o cuatro columnas alineadas al formulario", () => {
  const voice = solutionVoice({ companyName: "Laguna Verde", industryId: "turismo", activityId: "turismo-hotel" });
  const catalog = crmCatalogFromVoice(voice, "turismo");
  assert.equal(catalog.sectorLabel, "Turismo · hotel");
  assert.ok(catalog.entities.some((entity) => entity.id === "reservas"));
  assert.ok(catalog.entities.some((entity) => entity.id === "cupos"));
  const reservas = catalog.entities.find((entity) => entity.id === "reservas");
  assert.ok((reservas?.columns.length ?? 0) >= 3 && (reservas?.columns.length ?? 0) <= 4);
  assert.deepEqual(
    reservas?.columns.map((column) => column.label),
    ["Huésped", "Llegada", "Cantidad de huéspedes", "Habitación"],
  );
  assert.equal(reservas?.rows.length ?? 0, 0);
  assert.ok(reservas?.syncKey);
  for (const entity of catalog.entities) {
    assert.equal(entity.columns.length, 4, entity.id);
    assert.deepEqual(
      entity.columns.map((column) => column.slot),
      ["who", "when", "howMany", "what"],
      entity.id,
    );
    for (const column of entity.columns) {
      assert.ok((column.options?.length ?? 0) >= 2, `${entity.id}.${column.key} debe tener opciones`);
    }
  }
});

test("normalizeCrmRow solo acepta valores de la lista", () => {
  const voice = solutionVoice({ companyName: "Laguna Verde", industryId: "turismo", activityId: "turismo-hotel" });
  const reservas = crmCatalogFromVoice(voice, "turismo").entities.find((entity) => entity.id === "reservas");
  assert.ok(reservas);
  const row = normalizeCrmRow(
    { guest: "Familia Moreno", arrival: "Lun 10 nov", guestCount: "2", room: "Suite" },
    reservas.columns,
  );
  assert.equal(row.guest, "Familia Moreno");
  assert.equal(row.room, "Suite");
  const coerced = normalizeCrmRow(
    { guest: "Texto inventado", arrival: "", guestCount: "", room: "" },
    reservas.columns,
  );
  assert.equal(coerced.guest, reservas.columns[0]?.options?.[0]);
  assert.equal(isCrmRowEmpty({ guest: "", arrival: "", guestCount: "", room: "" }, reservas.columns), true);
  assert.equal(isCrmRowEmpty(row, reservas.columns), false);
});
