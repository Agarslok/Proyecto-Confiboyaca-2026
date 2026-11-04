"use client";

import { useMemo, useState } from "react";
import { trendWithProjection, type BarItem, type ChartSlice, type TrendSeriesPoint } from "@/lib/assistant/crm-dashboard-metrics";
import { OpsTryAssistantLinks } from "@/components/templates/OpsTryAssistantLinks";
import type { CrmEntityState } from "@/lib/assistant/crm-state";
import { dashboardMetrics, filterEntitiesByWhen, hasOperationalData, recentRecords } from "@/lib/ops/dashboard/metrics";
import { tourismDashboardBinding, tourismDashboardCopy } from "@/lib/ops/sector/turismo";
import type { DashboardBinding, DashboardCopy } from "@/lib/ops/sector/types";
import styles from "./tourism-operations.module.css";

const CHART_COLORS = [
  "var(--ops-chart-1, #5346f0)",
  "var(--ops-chart-2, #12362f)",
  "var(--ops-chart-3, #3d7a6a)",
  "var(--ops-chart-4, #b8954a)",
  "var(--ops-chart-5, #8b2e26)",
];
const AXIS = "var(--ops-chart-axis, rgba(18, 24, 26, 0.22))";
const GRID = "var(--ops-chart-grid, rgba(18, 24, 26, 0.08))";
const TREND_ACTUAL = "var(--ops-chart-trend-actual, #12362f)";
const TREND_PROJECTED = "var(--ops-chart-trend-projected, #5346f0)";
const TREND_FILL = "var(--ops-chart-trend-fill, rgba(18, 54, 47, 0.1))";

function integerTicks(max: number): number[] {
  const top = Math.max(1, Math.ceil(max));
  if (top <= 4) return Array.from({ length: top + 1 }, (_, i) => i);
  const step = Math.ceil(top / 4);
  const ticks: number[] = [];
  for (let value = 0; value <= step * 4; value += step) ticks.push(value);
  return ticks;
}

function clip(label: string, max = 10): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function VerticalBarChart({
  items,
  yLabel,
  emptyText,
  hint,
  activeIndex,
  onActive,
}: {
  items: BarItem[];
  yLabel: string;
  emptyText: string;
  hint: string;
  activeIndex: number | null;
  onActive: (index: number | null) => void;
}) {
  const width = 240;
  const height = 111;
  const pad = { l: 30, r: 10, t: 16, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const yMax = integerTicks(Math.max(...items.map((item) => item.value), 1)).at(-1) ?? 1;
  const ticks = integerTicks(yMax);
  const slot = innerW / Math.max(items.length, 1);
  const barW = Math.min(28, slot * 0.58);

  if (items.length === 0 || items.every((item) => item.value === 0)) {
    return <p className={styles.chartEmpty}>{emptyText}</p>;
  }

  const active = activeIndex !== null ? items[activeIndex] : null;

  return (
    <div className={styles.chartBody}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img" aria-label={`Barras: ${yLabel}`}>
        <text x={4} y={12} className={styles.chartAxisTitle}>
          {yLabel}
        </text>
        {ticks.map((tick) => {
          const y = pad.t + innerH - (tick / yMax) * innerH;
          return (
            <g key={tick}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={GRID} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" className={styles.chartTick}>
                {tick}
              </text>
            </g>
          );
        })}
        <line x1={pad.l} x2={pad.l} y1={pad.t} y2={height - pad.b} stroke={AXIS} />
        <line x1={pad.l} x2={width - pad.r} y1={height - pad.b} y2={height - pad.b} stroke={AXIS} />
        {items.map((item, index) => {
          const h = (item.value / yMax) * innerH;
          const x = pad.l + slot * index + (slot - barW) / 2;
          const y = pad.t + innerH - h;
          const dimmed = activeIndex !== null && activeIndex !== index;
          return (
            <g
              key={item.label}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onActive(index)}
              onMouseLeave={() => onActive(null)}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 0)}
                rx={4}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                opacity={dimmed ? 0.28 : 0.92}
                style={{ transition: "opacity 0.25s ease, y 0.35s ease, height 0.35s ease" }}
              />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" className={styles.chartValue}>
                {item.value}
              </text>
              <text x={x + barW / 2} y={height - 8} textAnchor="middle" className={styles.chartTick}>
                {clip(item.label, 9)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={styles.chartStatus}>
        {active ? `${active.label}: ${active.value} ${yLabel.toLowerCase()}` : hint}
      </p>
    </div>
  );
}

function HorizontalBarChart({
  items,
  xLabel,
  emptyText,
  activeIndex,
  onActive,
}: {
  items: BarItem[];
  xLabel: string;
  emptyText?: string;
  activeIndex: number | null;
  onActive: (index: number | null) => void;
}) {
  if (items.length === 0 || items.every((item) => item.value === 0)) {
    return <p className={styles.chartEmpty}>{emptyText ?? "Sin datos en este periodo."}</p>;
  }
  const width = 240;
  const rowH = 17;
  const pad = { l: 78, r: 28, t: 8, b: 22 };
  const height = pad.t + pad.b + Math.max(items.length, 1) * rowH;
  const innerW = width - pad.l - pad.r;
  const yMax = integerTicks(Math.max(...items.map((item) => item.value), 1)).at(-1) ?? 1;
  const ticks = integerTicks(yMax);
  const active = activeIndex !== null ? items[activeIndex] : null;

  return (
    <div className={styles.chartBody}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img" aria-label={`Barras horizontales: ${xLabel}`}>
        {ticks.map((tick) => {
          const x = pad.l + (tick / yMax) * innerW;
          return (
            <g key={tick}>
              <line x1={x} x2={x} y1={pad.t} y2={height - pad.b} stroke={GRID} />
              <text x={x} y={height - 6} textAnchor="middle" className={styles.chartTick}>
                {tick}
              </text>
            </g>
          );
        })}
        <line x1={pad.l} x2={width - pad.r} y1={height - pad.b} y2={height - pad.b} stroke={AXIS} />
        <line x1={pad.l} x2={pad.l} y1={pad.t} y2={height - pad.b} stroke={AXIS} />
        {items.map((item, index) => {
          const y = pad.t + index * rowH + 4;
          const w = (item.value / yMax) * innerW;
          const dimmed = activeIndex !== null && activeIndex !== index;
          return (
            <g
              key={item.label}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onActive(index)}
              onMouseLeave={() => onActive(null)}
            >
              <text x={pad.l - 6} y={y + 11} textAnchor="end" className={styles.chartTick}>
                {clip(item.label, 11)}
              </text>
              <rect
                x={pad.l}
                y={y}
                width={Math.max(w, 0)}
                height={14}
                rx={4}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                opacity={dimmed ? 0.28 : 0.9}
                style={{ transition: "width 0.35s ease, opacity 0.25s ease" }}
              />
              <text x={pad.l + w + 6} y={y + 11} className={styles.chartValue}>
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={styles.chartStatus}>
        {active ? `${active.label}: ${active.value} ${xLabel.toLowerCase()}` : `Eje X: ${xLabel.toLowerCase()} · Y: estado`}
      </p>
    </div>
  );
}

function DonutChart({
  slices,
  emptyText,
  centerLabel,
  hint,
  activeIndex,
  onActive,
}: {
  slices: ChartSlice[];
  emptyText: string;
  centerLabel: string;
  hint: string;
  activeIndex: number | null;
  onActive: (index: number | null) => void;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const size = 176;
  const cx = size / 2;
  const cy = size / 2;
  const outer = 62;
  const inner = 34;
  let angle = -Math.PI / 2;

  if (total === 0 || slices.length === 0) {
    return <p className={styles.chartEmpty}>{emptyText}</p>;
  }

  const arcs = slices.map((slice, index) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const a0 = angle;
    angle += sweep;
    const a1 = angle;
    const large = sweep > Math.PI ? 1 : 0;
    const x0 = cx + outer * Math.cos(a0);
    const y0 = cy + outer * Math.sin(a0);
    const x1 = cx + outer * Math.cos(a1);
    const y1 = cy + outer * Math.sin(a1);
    const xi0 = cx + inner * Math.cos(a1);
    const yi0 = cy + inner * Math.sin(a1);
    const xi1 = cx + inner * Math.cos(a0);
    const yi1 = cy + inner * Math.sin(a0);
    const d = `M ${x0} ${y0} A ${outer} ${outer} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`;
    return { ...slice, d, index };
  });

  const active = activeIndex !== null ? slices[activeIndex] : null;

  return (
    <div className={styles.pieWrap}>
      <div className={styles.pieChartArea}>
        <svg viewBox={`0 0 ${size} ${size}`} className={styles.pieSvg} role="img" aria-label="Mix de habitaciones">
          {arcs.map((arc) => (
            <path
              key={arc.label}
              d={arc.d}
              fill={CHART_COLORS[arc.index % CHART_COLORS.length]}
              opacity={activeIndex !== null && activeIndex !== arc.index ? 0.28 : 0.92}
              style={{ cursor: "pointer", transition: "opacity 0.25s ease" }}
              onMouseEnter={() => onActive(arc.index)}
              onMouseLeave={() => onActive(null)}
            />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" className={styles.pieCenterValue}>
            {total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className={styles.pieCenterLabel}>
            {centerLabel}
          </text>
        </svg>
      </div>
      <ul className={styles.pieLegend}>
        {slices.map((slice, index) => (
          <li key={slice.label}>
            <button
              type="button"
              className={`${styles.pieLegendBtn}${activeIndex === index ? ` ${styles.pieLegendBtnOn}` : ""}`}
              onMouseEnter={() => onActive(index)}
              onMouseLeave={() => onActive(null)}
            >
              <span className={styles.pieSwatch} style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className={styles.pieLegendName}>{slice.label}</span>
              <strong className={styles.pieLegendValue}>
                {slice.value} · {Math.round((slice.value / total) * 100)}%
              </strong>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.chartStatus}>
        {active ? `${active.label}: ${active.value}` : hint}
      </p>
    </div>
  );
}

function TrendChart({
  points,
  yLabel,
  optimism,
  onOptimism,
}: {
  points: TrendSeriesPoint[];
  yLabel: string;
  optimism: number;
  onOptimism: (value: number) => void;
}) {
  const width = 240;
  const height = 99;
  const pad = { l: 28, r: 12, t: 16, b: 26 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const yMax = integerTicks(Math.max(...points.map((point) => point.value), 1)).at(-1) ?? 1;
  const ticks = integerTicks(yMax);
  const lastActualIndex = points.reduce((acc, point, index) => (point.kind === "actual" ? index : acc), 0);
  const scaleX = (index: number) => pad.l + (index / Math.max(points.length - 1, 1)) * innerW;
  const scaleY = (value: number) => pad.t + innerH - (value / yMax) * innerH;

  const actualLine = points
    .slice(0, lastActualIndex + 1)
    .map((point, index) => `${scaleX(index)},${scaleY(point.value)}`)
    .join(" ");
  const projectedLine = points
    .slice(lastActualIndex)
    .map((point, index) => `${scaleX(lastActualIndex + index)},${scaleY(point.value)}`)
    .join(" ");
  const area = `${scaleX(0)},${scaleY(0)} ${actualLine} ${scaleX(lastActualIndex)},${scaleY(0)}`;
  const lastProjected = points.at(-1);
  const lastActual = points[lastActualIndex];

  return (
    <div className={styles.chartBody}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img" aria-label="Tendencia de huéspedes">
        <text x={4} y={12} className={styles.chartAxisTitle}>
          {yLabel}
        </text>
        {ticks.map((tick) => {
          const y = scaleY(tick);
          return (
            <g key={tick}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={GRID} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" className={styles.chartTick}>
                {tick}
              </text>
            </g>
          );
        })}
        <line x1={pad.l} x2={pad.l} y1={pad.t} y2={height - pad.b} stroke={AXIS} />
        <line x1={pad.l} x2={width - pad.r} y1={height - pad.b} y2={height - pad.b} stroke={AXIS} />
        <polygon points={area} fill={TREND_FILL} />
        <polyline points={actualLine} fill="none" stroke={TREND_ACTUAL} strokeWidth={2.2} strokeLinejoin="round" />
        <polyline points={projectedLine} fill="none" stroke={TREND_PROJECTED} strokeWidth={2} strokeDasharray="5 4" />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={scaleX(index)}
              cy={scaleY(point.value)}
              r={3.4}
              fill={point.kind === "actual" ? TREND_ACTUAL : TREND_PROJECTED}
            />
            <text x={scaleX(index)} y={scaleY(point.value) - 6} textAnchor="middle" className={styles.chartValue}>
              {point.value}
            </text>
            <text x={scaleX(index)} y={height - 8} textAnchor="middle" className={styles.chartTick}>
              {clip(point.label, 8)}
            </text>
          </g>
        ))}
      </svg>
      <div className={styles.trendControls}>
        <label className={styles.trendSliderLabel}>
          Proyección
          <input
            type="range"
            min={0}
            max={100}
            value={optimism}
            className={styles.trendSlider}
            onChange={(event) => onOptimism(Number(event.target.value))}
          />
        </label>
        <p className={styles.chartStatus}>
          Hoy {lastActual?.value ?? 0} · {optimism < 33 ? "conservadora" : optimism > 66 ? "optimista" : "moderada"} llega a{" "}
          {lastProjected?.value ?? 0}
        </p>
      </div>
    </div>
  );
}

export function CrmOperationsDashboard({
  entities,
  sectorLabel,
  binding,
  copy = tourismDashboardCopy,
  exampleOperations = [],
  onTryInAssistant,
}: {
  entities: CrmEntityState[];
  sectorLabel: string;
  binding?: DashboardBinding | null;
  copy?: DashboardCopy;
  /** Sugerencias cuando aún no hay registros reales. */
  exampleOperations?: string[];
  onTryInAssistant?: (starter: string) => void;
}) {
  const [period, setPeriod] = useState<"all" | "hoy">("all");
  const filtered = useMemo(() => filterEntitiesByWhen(entities, period), [entities, period]);
  const resolved = binding === undefined ? (entities.some((entity) => entity.id === "reservas") ? tourismDashboardBinding : null) : binding;
  const metrics = useMemo(() => dashboardMetrics(filtered, resolved), [filtered, resolved]);
  const recent = useMemo(() => recentRecords(filtered), [filtered]);
  const [pieActive, setPieActive] = useState<number | null>(null);
  const [barActive, setBarActive] = useState<number | null>(null);
  const [horizActive, setHorizActive] = useState<number | null>(null);
  const [trendOptimism, setTrendOptimism] = useState(45);
  const trendPoints = useMemo(
    () => (metrics.trendSamples.length ? trendWithProjection(metrics.trendSamples, trendOptimism) : []),
    [metrics.trendSamples, trendOptimism],
  );
  const hasData = useMemo(() => hasOperationalData(filtered), [filtered]);

  return (
    <div className={styles.dashboardLive}>
      {!hasData ? (
        <div className={styles.dashEmpty} role="status">
          <p className={styles.dashEmptyTitle}>Aún no hay operaciones registradas</p>
          <p className={styles.dashEmptyLead}>
            Los indicadores y gráficos se calculan solo con filas que guardes en la base de datos (desde el asistente o
            «Anotar fila»). Cuando anotes la primera, este tablero se actualiza al instante.
          </p>
          {exampleOperations.length ? (
            <OpsTryAssistantLinks
              starters={exampleOperations}
              onTryInAssistant={onTryInAssistant}
              hint="Ejemplos que puedes probar en el asistente:"
            />
          ) : null}
        </div>
      ) : null}

      <div className={styles.dashToolbar}>
        <span className={styles.dashPeriodLabel} id="dash-period-label">
          {copy.filterLabel}
        </span>
        <div className={styles.dashPeriodToggle} role="group" aria-labelledby="dash-period-label">
          <button
            type="button"
            className={`${styles.dashPeriodBtn}${period === "all" ? ` ${styles.dashPeriodBtnOn}` : ""}`}
            aria-pressed={period === "all"}
            onClick={() => setPeriod("all")}
          >
            Todos
          </button>
          <button
            type="button"
            className={`${styles.dashPeriodBtn}${period === "hoy" ? ` ${styles.dashPeriodBtnOn}` : ""}`}
            aria-pressed={period === "hoy"}
            onClick={() => setPeriod("hoy")}
          >
            Hoy
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {metrics.kpis.map((kpi) => (
          <article key={kpi.label} className={styles.kpi}>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <strong className={styles.kpiValue}>{kpi.value}</strong>
            <span className={styles.kpiHint}>{kpi.hint}</span>
          </article>
        ))}
      </div>

      <div className={styles.dashCharts}>
        <article className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{copy.barsTitle}</h3>
          <VerticalBarChart
            items={metrics.barGuestsByRoom}
            yLabel={copy.barsY}
            emptyText={copy.barsEmpty}
            hint={copy.barsHint}
            activeIndex={barActive}
            onActive={setBarActive}
          />
        </article>

        <article className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{copy.pieTitle}</h3>
          <DonutChart
            slices={metrics.pieRoomMix}
            emptyText={copy.pieEmpty}
            centerLabel={copy.pieCenter}
            hint={copy.pieHint}
            activeIndex={pieActive}
            onActive={setPieActive}
          />
        </article>

        <article className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{copy.ordersTitle}</h3>
          <HorizontalBarChart
            items={metrics.barOrdersByStatus}
            xLabel={copy.ordersX}
            emptyText={copy.pieEmpty}
            activeIndex={horizActive}
            onActive={setHorizActive}
          />
        </article>

        <article className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{copy.trendTitle}</h3>
          {metrics.trendSamples.length === 0 ? (
            <p className={styles.chartEmpty}>Anota registros con fecha y cantidad para ver la tendencia.</p>
          ) : (
            <TrendChart points={trendPoints} yLabel={copy.trendY} optimism={trendOptimism} onOptimism={setTrendOptimism} />
          )}
        </article>
      </div>

      <section className={styles.dashRecent} aria-labelledby="dash-recent-title">
        <p className={styles.recentTitle} id="dash-recent-title">
          {copy.recentTitle}
        </p>
        {recent.length === 0 ? (
          <p className={styles.chartEmpty}>Sin filas en este periodo.</p>
        ) : (
          <ul className={styles.recentList}>
            {recent.map((item) => (
              <li key={`${item.table}-${item.summary}`}>
                <span>{item.table}</span>
                {item.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={styles.dashFoot}>Cifras de {sectorLabel}, tomadas de la base de datos de esta sesión.</p>
    </div>
  );
}
