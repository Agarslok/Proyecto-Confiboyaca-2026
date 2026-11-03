import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agendaVisitSketch } from "../lib/site/solution-slot";
import { parseSolutionHole } from "../lib/validation/solution-hole";

const table = {
  visitorTitle: "Qué hay hoy",
  businessChange: "Cada venta descuenta el inventario y se ve qué se está agotando.",
  submitLabel: "Consultar",
  columns: ["Producto", "Quedan"],
  rows: [
    ["Pan", "12"],
    ["Queso", "4"],
  ],
};

describe("contrato del hueco", () => {
  it("acepta el boceto de agenda", () => {
    const parsed = parseSolutionHole(agendaVisitSketch());
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.spec.action, "agenda");
  });

  it("acepta inventario, registro y solicitudes con tabla", () => {
    for (const action of ["inventario", "registro", "solicitudes"] as const) {
      const parsed = parseSolutionHole({ action, ...table });
      assert.equal(parsed.ok, true, action);
    }
  });

  it("convierte specs antiguos con action guia a tabla de catálogo", () => {
    const parsed = parseSolutionHole({
      action: "guia",
      visitorTitle: "Cómo ordenar el corte",
      businessChange: "Cada medida queda apuntada antes de cortar la siguiente tabla.",
      problemFocus: "El taller pierde madera porque el corte no queda registrado.",
      steps: [
        { title: "Medir", detail: "Anota especie, largo y estado antes de cortar." },
        { title: "Cortar", detail: "Registra el corte y el sobrante usable." },
        { title: "Revisar", detail: "Al cierre del día compara lo cortado con lo vendido." },
      ],
      primaryKind: "merma",
      suggestedActionLater: "registro",
      disclaimer: "Es una demostración.",
    });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.spec.action, "registro");
      assert.equal(parsed.spec.columns?.length, 2);
    }
  });

  it("rechaza texto suelto y HTML", () => {
    const text = parseSolutionHole("<section><h2>Agenda</h2></section>");
    assert.equal(text.ok, false);

    const html = parseSolutionHole({
      ...agendaVisitSketch(),
      visitorTitle: "Agenda <b>tu visita</b>",
    });
    assert.equal(html.ok, false);
    if (!html.ok) assert.match(html.reason, /HTML/);
  });

  it("rechaza una acción desconocida y campos de más", () => {
    const unknown = parseSolutionHole({ ...agendaVisitSketch(), action: "tablero" });
    assert.equal(unknown.ok, false);

    const extra = parseSolutionHole({ ...agendaVisitSketch(), html: "<p>hola</p>" });
    assert.equal(extra.ok, false);
  });

  it("exige filas alineadas con las columnas", () => {
    const parsed = parseSolutionHole({
      action: "inventario",
      ...table,
      rows: [["Pan"]],
    });
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.reason, /celdas/);
  });
});
