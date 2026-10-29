import { simulatedSeries } from "@/lib/radar/simulated";
import type { CaseItem } from "@/lib/radar/types";

export function CaseSpark({ item, large = false }: { item: CaseItem; large?: boolean }) {
  const { history, favorable, unfavorable, change } = simulatedSeries(item);
  const all = [...history, ...favorable, ...unfavorable];
  const min = Math.min(...all) - 4;
  const max = Math.max(...all) + 4;
  const width = 240;
  const height = large ? 160 : 72;
  const x = (i: number) => (i / 17) * width;
  const y = (value: number) => height - ((value - min) / (max - min)) * height;
  const line = (values: number[], offset: number) =>
    values.map((value, i) => `${i === 0 ? "M" : "L"}${x(i + offset).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const join = (values: number[]) => `M${x(11).toFixed(1)},${y(history[11]).toFixed(1)} ${line(values, 12).replace(/^M/, "L")}`;

  return (
    <figure className={large ? "case-spark is-large" : "case-spark"}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <line className="case-spark-now" x1={x(11)} x2={x(11)} y1={0} y2={height} />
        <path className="case-spark-hist" d={line(history, 0)} />
        <path className="case-spark-bad" d={join(unfavorable)} />
        <path className="case-spark-good" d={join(favorable)} />
      </svg>
      <figcaption>
        <span className="case-spark-delta">{change > 0 ? "+" : ""}{change} %</span> {item.indicator.toLowerCase()} en 6 meses
        <span className="fine"> · datos simulados ({item.better} es mejor)</span>
      </figcaption>
    </figure>
  );
}
