import { buildCatalogConfig, CATALOG_SECTORS, type CatalogSector } from "@/lib/site/solution-catalog";
import { selectTemplate, templateLabel } from "@/lib/site/select-template";
import type { SiteConfig, TemplateId } from "@/types/site";
import { TEMPLATE_IDS } from "@/types/site";

/** Demos de plantilla con la solución operativa única (asistente + CRM + dashboard). */
export type ShowcaseEntry = {
  templateId: TemplateId;
  label: string;
  sector: CatalogSector;
  opsAnchor: string;
};

const ANCHOR_BY_TEMPLATE: Record<TemplateId, string> = {
  turismo: "operacion-hotel",
  gastronomia: "reservas",
  servicios: "agenda",
  retail: "operacion",
  metalurgia: "operacion",
  agroindustria: "operacion",
};

export function showcaseSectorFor(templateId: TemplateId): CatalogSector {
  const found = CATALOG_SECTORS.find((item) => selectTemplate(item.sectorId) === templateId);
  if (!found) {
    return CATALOG_SECTORS[0]!;
  }
  return found;
}

export function buildShowcaseConfig(templateId: TemplateId): SiteConfig {
  const sector = showcaseSectorFor(templateId);
  const config = buildCatalogConfig(sector, "asistente");
  return {
    ...config,
    recordCode: `RAD-SHOW-${templateId.slice(0, 4).toUpperCase()}`,
  };
}

export const SHOWCASE_ENTRIES: ShowcaseEntry[] = TEMPLATE_IDS.map((templateId) => {
  const sector = showcaseSectorFor(templateId);
  return {
    templateId,
    label: templateLabel(templateId),
    sector,
    opsAnchor: ANCHOR_BY_TEMPLATE[templateId],
  };
});

export function showcasePath(templateId: TemplateId): string {
  return `/boceto/plantillas/${templateId}`;
}

export const SHOWCASE_HUB_PATH = "/boceto/plantillas";
