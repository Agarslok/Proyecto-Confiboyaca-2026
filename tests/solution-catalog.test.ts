import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sketchHole } from "../lib/radar/presentation";
import { activityOf } from "../lib/radar/engine";
import {
  buildCatalogConfig,
  CATALOG_HOLES,
  CATALOG_SECTORS,
} from "../lib/site/solution-catalog";
import { parseSolutionHole } from "../lib/validation/solution-hole";

describe("catálogo sector × solución", () => {
  it("tiene seis plantillas y cinco tipos de hueco", () => {
    assert.equal(CATALOG_SECTORS.length, 6);
    assert.equal(CATALOG_HOLES.length, 5);
    assert.deepEqual(
      CATALOG_HOLES.map((hole) => hole.id),
      ["agenda", "registro", "inventario", "solicitudes", "asistente"],
    );
  });

  it("cada combinación produce un spec válido", () => {
    for (const sector of CATALOG_SECTORS) {
      const { industry, activity } = activityOf({ industry: sector.industry, activity: sector.activity });
      const vocab = industry
        ? { ...industry.vocab, ...activity?.vocab }
        : { productos: "productos", clientes: "clientes", punto: "sede" };
      for (const hole of CATALOG_HOLES) {
        const spec = sketchHole(
          {
            companyName: sector.companyName,
            industryId: sector.industry,
            activityId: sector.activity,
            activityLabel: activity?.label ?? sector.activityLabel,
            vocab,
          },
          hole.id,
        );
        const parsed = parseSolutionHole(spec);
        assert.equal(parsed.ok, true, `${sector.label} × ${hole.id}`);
        if (parsed.ok) assert.equal(parsed.spec.action, hole.id);
      }
    }
  });

  it("arma una página completa con radar para el asistente", () => {
    const config = buildCatalogConfig(CATALOG_SECTORS[0]!, "asistente");
    assert.equal(config.templateId, "turismo");
    assert.equal(config.solution?.action, "asistente");
    assert.ok(config.radar && config.radar.index >= 70);
  });

  it("la agenda habla como el negocio: reserva, mesa, cita o pedido", () => {
    const title = (label: string) => {
      const sector = CATALOG_SECTORS.find((item) => item.label === label)!;
      const spec = buildCatalogConfig(sector, "agenda").solution;
      assert.equal(spec?.action, "agenda");
      return spec?.action === "agenda" ? spec : null;
    };
    const turismo = title("Turismo");
    const gastro = title("Gastronomía");
    const servicios = title("Servicios");
    const agro = title("Agro");
    const metal = title("Metalurgia");
    const tienda = title("Tienda");
    assert.match(turismo?.visitorTitle ?? "", /reserva/i);
    assert.equal((turismo?.choices ?? []).some((choice) => /habitaci/i.test(choice.label)), true);
    assert.match(gastro?.visitorTitle ?? "", /mesa/i);
    assert.equal(gastro?.partyLabel, "Comensales");
    assert.match(servicios?.visitorTitle ?? "", /cita/i);
    for (const spec of [agro, metal, tienda]) {
      assert.match(spec?.visitorTitle ?? "", /pedido/i);
      assert.doesNotMatch(spec?.visitorTitle ?? "", /visita/i);
    }
    assert.equal(agro?.dateLabel, "Entrega");
    assert.equal(metal?.partyLabel, "Toneladas");
    assert.equal(tienda?.partyLabel, "Prendas");
  });

  it("una experiencia turística no ofrece habitaciones", () => {
    const spec = sketchHole(
      {
        companyName: "Páramo Vivo",
        industryId: "turismo",
        activityId: "turismo-experiencias",
        activityLabel: "Guianza y experiencias",
        vocab: { productos: "experiencias", clientes: "viajeros", punto: "salida" },
      },
      "agenda",
    );
    assert.equal(spec.action, "agenda");
    if (spec.action !== "agenda") return;
    assert.match(spec.visitorTitle, /experiencia/i);
    assert.equal(spec.choices?.some((choice) => /habitaci/i.test(choice.label)), false);
  });

  it("registro e inventario usan el oficio, no un pedido genérico de mostrador", () => {
    const hotel = buildCatalogConfig(CATALOG_SECTORS[0]!, "registro").solution;
    const cocina = buildCatalogConfig(CATALOG_SECTORS[1]!, "inventario").solution;
    assert.equal(hotel?.action, "registro");
    if (hotel?.action === "registro") {
      assert.match(hotel.visitorTitle, /estadía/i);
      assert.equal(hotel.columns?.[0], "Huésped");
    }
    assert.equal(cocina?.action, "inventario");
    if (cocina?.action === "inventario") assert.match(cocina.visitorTitle, /servir/i);
  });
});
