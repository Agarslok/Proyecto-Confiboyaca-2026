import type { IndustryId } from "@/types/domain";

export const STAND_SECTORS = [
  {
    id: "turismo",
    label: "Turismo",
    summary: "Agencias, hospedaje, experiencias y operadores.",
    industryId: "servicios" satisfies IndustryId,
    engineNote:
      "El motor de diagnóstico todavía no tiene textos propios de turismo. La demostración usa la plantilla de servicios profesionales y datos ficticios.",
  },
  {
    id: "metalurgia",
    label: "Metalurgia",
    summary: "Plantas, talleres y transformación de materiales.",
    industryId: "metalurgia" satisfies IndustryId,
    engineNote: "Usa la plantilla industrial que ya existe en el motor de diagnóstico.",
  },
  {
    id: "agro",
    label: "Agro",
    summary: "Producción, comercialización y operación agrícola.",
    industryId: "servicios" satisfies IndustryId,
    engineNote:
      "El motor de diagnóstico todavía no tiene textos propios de agro. La demostración usa la plantilla de servicios profesionales y datos ficticios.",
  },
] as const;

export type StandSectorId = (typeof STAND_SECTORS)[number]["id"];

export function getStandSector(id: string | null): (typeof STAND_SECTORS)[number] | null {
  return STAND_SECTORS.find((sector) => sector.id === id) ?? null;
}
