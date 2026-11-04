import type { CrmEntityState } from "@/lib/assistant/crm-state";
import { findCrmEntity, meaningfulRows, parseCount } from "@/lib/assistant/crm-state";
import { CRM_META_RECORDED_AT } from "@/lib/assistant/crm-row-meta";
import type { DashboardBinding } from "@/lib/ops/sector/types";

export type DashboardKpi = { label: string; value: string; hint: string };
export type ChartSlice = { label: string; value: number };
export type BarItem = { label: string; value: number };
export type TrendSample = { label: string; guests: number };

export type CrmDashboardMetrics = {
  kpis: DashboardKpi[];
  pieRoomMix: ChartSlice[];
  barGuestsByRoom: BarItem[];
  barOrdersByStatus: BarItem[];
  trendSamples: TrendSample[];
};

function countByField(rows: Record<string, string>[], field: string): ChartSlice[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = (row[field] ?? "").trim() || "Sin dato";
    totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function sumField(rows: Record<string, string>[], field: string): number {
  return rows.reduce((acc, row) => acc + parseCount(row[field]), 0);
}

function sumByField(rows: Record<string, string>[], groupField: string, valueField: string): BarItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = (row[groupField] ?? "").trim() || "Sin dato";
    const amount = parseCount(row[valueField]);
    totals.set(label, (totals.get(label) ?? 0) + (amount > 0 ? amount : 1));
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function shortLabel(raw: string | undefined, fallback: string): string {
  const text = (raw ?? "").trim();
  if (!text) return fallback;
  const first = text.split(/\s+/)[0] ?? text;
  return first.length > 12 ? `${first.slice(0, 11)}…` : first;
}

function slotKey(entity: CrmEntityState | undefined, slot: "who" | "when" | "howMany" | "what"): string {
  return entity?.columns.find((column) => column.slot === slot)?.key ?? "";
}

/** Indicadores a partir del binding sectorial (turismo hoy; otras industrias pueden traer el suyo). */
export function metricsFromBinding(entities: CrmEntityState[], binding: DashboardBinding): CrmDashboardMetrics {
  const primary = findCrmEntity(entities, binding.primaryId);
  const presence = findCrmEntity(entities, binding.presenceId);
  const stock = findCrmEntity(entities, binding.stockId);
  const orders = findCrmEntity(entities, binding.ordersId);

  const primaryRows = meaningfulRows(primary);
  const presenceRows = meaningfulRows(presence);
  const stockRows = meaningfulRows(stock);
  const orderRows = meaningfulRows(orders);

  const expected = sumField(primaryRows, binding.countKey) || primaryRows.length;
  const inPlace = presenceRows.filter((row) => binding.presenceWhen.test(row[binding.whenKey] ?? "")).length;
  const free = sumField(stockRows, binding.stockCountKey);
  const openOrders = orderRows.length;

  const pieSource =
    countByField(primaryRows, binding.whatKey).length > 0
      ? countByField(primaryRows, binding.whatKey)
      : countByField(stockRows, binding.stockWhatKey);

  const bars =
    primaryRows.length > 0
      ? sumByField(primaryRows, binding.whatKey, binding.countKey)
      : stockRows.map((row) => ({
          label: (row[binding.stockWhatKey] ?? "").trim() || "Tipo",
          value: parseCount(row[binding.stockCountKey]) || 0,
        }));

  const orderBars = countByField(orderRows, binding.ordersWhatKey);
  const trendSamples: TrendSample[] = primaryRows.map((row, index) => ({
    label: shortLabel(row[binding.whoKey], row[binding.whenKey] || `R${index + 1}`),
    guests: Math.max(1, parseCount(row[binding.countKey]) || 1),
  }));

  return {
    kpis: [
      { label: binding.kpis.primary.label, value: String(primaryRows.length), hint: binding.kpis.primary.hint },
      { label: binding.kpis.sum.label, value: String(expected), hint: binding.kpis.sum.hint },
      {
        label: binding.kpis.presence.label,
        value: String(inPlace || presenceRows.length),
        hint: stockRows.length > 0 ? binding.stockHint(free) : binding.kpis.presence.hint,
      },
      { label: binding.kpis.orders.label, value: String(openOrders), hint: binding.kpis.orders.hint },
    ],
    pieRoomMix: pieSource.slice(0, 5),
    barGuestsByRoom: bars.slice(0, 6),
    barOrdersByStatus: orderBars.length ? orderBars : [],
    trendSamples,
  };
}

/** Indicadores por slots quién / cuándo / cuántos / qué, sin ids de hotel. */
export function metricsFromSlots(entities: CrmEntityState[]): CrmDashboardMetrics {
  const primary = entities[0];
  const stock = entities[1];
  const orders = entities[2];
  const primaryRows = meaningfulRows(primary);
  const stockRows = meaningfulRows(stock);
  const orderRows = meaningfulRows(orders);
  const countKey = slotKey(primary, "howMany");
  const whatKey = slotKey(primary, "what");
  const whoKey = slotKey(primary, "who");
  const whenKey = slotKey(primary, "when");
  const stockCount = slotKey(stock, "howMany");
  const stockWhat = slotKey(stock, "what");
  const orderWhat = slotKey(orders, "what");
  const today = whenKey ? primaryRows.filter((row) => /hoy/.test(row[whenKey] ?? "")).length : 0;
  const expected = countKey ? sumField(primaryRows, countKey) || primaryRows.length : primaryRows.length;
  const pie = whatKey ? countByField(primaryRows, whatKey) : [];
  const bars = whatKey && countKey ? sumByField(primaryRows, whatKey, countKey) : [];
  const orderBars = orderWhat ? countByField(orderRows, orderWhat) : countByField(stockRows, stockWhat);

  return {
    kpis: [
      {
        label: primary?.label ?? "Registros",
        value: String(primaryRows.length),
        hint: "En la tabla principal",
      },
      { label: "Total", value: String(expected), hint: "Suma de la columna de cantidad" },
      {
        label: "Hoy",
        value: String(today),
        hint: stockRows.length ? `${sumField(stockRows, stockCount)} en existencias` : "Con fecha de hoy",
      },
      {
        label: orders?.label ?? stock?.label ?? "Otras",
        value: String(orderRows.length || stockRows.length),
        hint: "Segunda tabla de la operación",
      },
    ],
    pieRoomMix: pie.slice(0, 5),
    barGuestsByRoom: bars.slice(0, 6),
    barOrdersByStatus: orderBars.length ? orderBars : [],
    trendSamples: primaryRows.map((row, index) => ({
      label: shortLabel(whoKey ? row[whoKey] : "", whenKey ? row[whenKey] : `R${index + 1}`),
      guests: Math.max(1, countKey ? parseCount(row[countKey]) || 1 : 1),
    })),
  };
}

export function dashboardMetrics(entities: CrmEntityState[], binding: DashboardBinding | null): CrmDashboardMetrics {
  if (binding) return metricsFromBinding(entities, binding);
  return metricsFromSlots(entities);
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Filtro de periodo sobre la columna «cuándo». «Todos» no altera las filas. */
export function filterEntitiesByWhen(entities: CrmEntityState[], period: "all" | "hoy"): CrmEntityState[] {
  if (period === "all") return entities;
  return entities.map((entity) => {
    const when = entity.columns.find((column) => column.slot === "when");
    if (!when) return entity;
    return {
      ...entity,
      rows: entity.rows.filter((row) => /\bhoy\b/.test(fold(row[when.key] ?? ""))),
    };
  });
}

export type RecentRecord = { table: string; summary: string };

/** Últimas filas operativas de todas las tablas. */
export function recentRecords(entities: CrmEntityState[], limit = 6): RecentRecord[] {
  const items: { table: string; summary: string; recordedAt: string }[] = [];
  for (const entity of entities) {
    for (const row of meaningfulRows(entity).slice(-limit)) {
      items.push({
        table: entity.label,
        summary: entity.columns
          .map((column) => (row[column.key] ?? "").trim())
          .filter(Boolean)
          .slice(0, 4)
          .join(" · "),
        recordedAt: row[CRM_META_RECORDED_AT] ?? "",
      });
    }
  }
  return items
    .filter((item) => item.summary)
    .sort((a, b) => (b.recordedAt || "").localeCompare(a.recordedAt || ""))
    .slice(0, limit)
    .map(({ table, summary }) => ({ table, summary }));
}

export function hasOperationalData(entities: CrmEntityState[]): boolean {
  return entities.some((entity) => meaningfulRows(entity).length > 0);
}
