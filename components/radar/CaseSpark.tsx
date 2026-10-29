import type { CaseItem } from "@/lib/radar/types";

/* Serie simulada (base 100): 12 meses de histórico y 6 de proyección con y
   sin la solución. Es ilustrativa; se genera con una semilla por caso. */

function seeded(seed: string): () => number {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return ((hash ^= hash >>> 16) >>> 0) / 4294967296;
  };
}

export function simulatedSeries(item: CaseItem) {
  const random = seeded(item.id);
  const history = Array.from({ length: 12 }, () => 100 + (random() - 0.5) * 12);
  const last = history[history.length - 1];
  const sign = item.better === "menor" ? -1 : 1;
  const gain = 0.18 + random() * 0.14;
  const loss = 0.06 + random() * 0.08;
  const favorable = Array.from({ length: 6 }, (_, i) => last * (1 + sign * gain * ((i + 1) / 6)) + (random() - 0.5) * 3);
  const unfavorable = Array.from({ length: 6 }, (_, i) => last * (1 - sign * loss * ((i + 1) / 6)) + (random() - 0.5) * 3);
  return { history, favorable, unfavorable, change: Math.round(sign * gain * 100) };
}

export function CaseSpark({ item }: { item: CaseItem }) {
  const { history, favorable, unfavorable, change } = simulatedSeries(item);
  const all = [...history, ...favorable, ...unfavorable];
  const min = Math.min(...all) - 4;
  const max = Math.max(...all) + 4;
  const width = 240;
  const height = 72;
  const x = (i: number) => (i / 17) * width;
  const y = (value: number) => height - ((value - min) / (max - min)) * height;
  const line = (values: number[], offset: number) =>
    values.map((value, i) => `${i === 0 ? "M" : "L"}${x(i + offset).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const join = (values: number[]) => `M${x(11).toFixed(1)},${y(history[11]).toFixed(1)} ${line(values, 12).replace(/^M/, "L")}`;

  return (
    <figure className="case-spark">
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
