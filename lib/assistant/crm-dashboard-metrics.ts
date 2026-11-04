import type { CrmEntityState } from "@/lib/assistant/crm-state";
import { findCrmEntity } from "@/lib/assistant/crm-state";
import { dashboardMetrics, type CrmDashboardMetrics, type TrendSample } from "@/lib/ops/dashboard/metrics";
import { tourismDashboardBinding } from "@/lib/ops/sector/turismo";

export type { BarItem, ChartSlice, CrmDashboardMetrics, DashboardKpi, TrendSample } from "@/lib/ops/dashboard/metrics";

/**
 * Compatibilidad: turismo usa su binding; cualquier otro catálogo cae en slots.
 * El motor vive en `lib/ops/dashboard/metrics.ts`.
 */
export function crmDashboardMetrics(entities: CrmEntityState[]): CrmDashboardMetrics {
  const binding = findCrmEntity(entities, "reservas") ? tourismDashboardBinding : null;
  return dashboardMetrics(entities, binding);
}

export type TrendSeriesPoint = { label: string; value: number; kind: "actual" | "projected" };

/** Acumulado de la serie + proyección (0 = conservadora, 100 = optimista). */
export function trendWithProjection(samples: TrendSample[], optimismPercent: number): TrendSeriesPoint[] {
  if (samples.length === 0) {
    return [
      { label: "Hoy", value: 0, kind: "actual" },
      { label: "Proy. 1", value: 0, kind: "projected" },
      { label: "Proy. 2", value: 0, kind: "projected" },
    ];
  }
  const points: TrendSeriesPoint[] = [];
  let sum = 0;
  for (const sample of samples) {
    sum += sample.guests;
    points.push({ label: sample.label, value: sum, kind: "actual" });
  }
  const avg = samples.reduce((acc, sample) => acc + sample.guests, 0) / samples.length;
  const step = avg * (0.55 + optimismPercent / 120);
  points.push({ label: "Proy. 1", value: Math.round(sum + step), kind: "projected" });
  points.push({ label: "Proy. 2", value: Math.round(sum + step * 2), kind: "projected" });
  return points;
}
