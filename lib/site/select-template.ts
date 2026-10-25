import type { SectorId, TemplateId } from "@/types/site";

/** Regla única: el sector determina la plantilla. */
export function selectTemplate(sectorId: SectorId): TemplateId {
  switch (sectorId) {
    case "turismo":
      return "turismo";
    case "metalurgia":
      return "metalurgia";
    case "agroindustria":
      return "agroindustria";
    case "gastronomia":
      return "gastronomia";
    case "retail":
      return "retail";
    case "servicios":
      return "servicios";
    default: {
      const _exhaustive: never = sectorId;
      return _exhaustive;
    }
  }
}

export function templateLabel(templateId: TemplateId): string {
  const labels: Record<TemplateId, string> = {
    turismo: "Turismo (Kobu)",
    metalurgia: "Metalurgia (ON.energy)",
    agroindustria: "Agroindustria (Arva)",
    gastronomia: "Gastronomía (Mesa)",
    retail: "Retail (Vitrina)",
    servicios: "Servicios (Consulta)",
  };
  return labels[templateId];
}
