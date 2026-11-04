import { columnSelectOptions, crmCatalogFromVoice } from "@/lib/assistant/crm-catalog";
import { crmDashboardMetrics } from "@/lib/assistant/crm-dashboard-metrics";
import { opsTablesFromEntities, type OpsRecordContext } from "@/lib/assistant/ops-capture";
import { cloneCrmCatalog, meaningfulRows, type CrmEntityState } from "@/lib/assistant/crm-state";
import { solutionVoice } from "@/lib/radar/solution-voice";
import type { IndustryId } from "@/lib/radar/types";

/** Resumen corto de tablas + cifras para el prompt del asistente (ahorra tokens). */
export function opsBriefFromEntities(entities: CrmEntityState[], sectorLabel: string): string {
  const metrics = crmDashboardMetrics(entities);
  const tables = entities.map((entity) => {
    const rows = meaningfulRows(entity);
    const columns = entity.columns
      .map((column) => {
        const options = columnSelectOptions(column, entity.rows).slice(0, 8);
        const slot = column.slot === "who" ? "quién" : column.slot === "when" ? "cuándo" : column.slot === "howMany" ? "cuántos" : "qué";
        return options.length ? `${column.label}(${slot})[${options.join("/")}]` : `${column.label}(${slot})`;
      })
      .join("; ");
    const facts = rows
      .slice(0, 6)
      .map((row) =>
        entity.columns
          .map((column) => (row[column.key] ?? "").trim())
          .filter(Boolean)
          .join(" · "),
      )
      .join(" | ");
    return facts
      ? `${entity.label} (${rows.length}): ${columns}\n  Filas: ${facts}`
      : `${entity.label} (${rows.length}): ${columns}`;
  });
  const kpis = metrics.kpis.map((kpi) => `${kpi.label} ${kpi.value}`).join(" · ");
  return [`Sector: ${sectorLabel}`, ...tables, `Cifras: ${kpis}`].join("\n");
}

/** Catálogo demo del sector (cuando aún no hay edición en vivo). */
export function opsBriefFromSector(input: {
  companyName: string;
  industryId?: string;
  activityId?: string;
}): string {
  const industryId = (input.industryId || "") as IndustryId | "";
  if (!industryId) return "";
  const voice = solutionVoice({
    companyName: input.companyName,
    industryId,
    activityId: input.activityId || "",
  });
  const catalog = crmCatalogFromVoice(voice, industryId, input.activityId || "");
  return opsBriefFromEntities(cloneCrmCatalog(catalog), catalog.sectorLabel);
}

export function opsTablesFromSector(input: {
  companyName: string;
  industryId?: string;
  activityId?: string;
}): OpsRecordContext[] {
  const industryId = (input.industryId || "") as IndustryId | "";
  if (!industryId) return [];
  const voice = solutionVoice({
    companyName: input.companyName,
    industryId,
    activityId: input.activityId || "",
  });
  const catalog = crmCatalogFromVoice(voice, industryId, input.activityId || "");
  return opsTablesFromEntities(cloneCrmCatalog(catalog));
}
