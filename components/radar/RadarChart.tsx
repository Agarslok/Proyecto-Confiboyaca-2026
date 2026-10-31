import type { DimensionScore } from "@/lib/radar/types";

interface RadarChartProps {
  dimensions: DimensionScore[];
  size?: number;
  /** Muestra el puntaje junto a cada eje. */
  showValues?: boolean;
  className?: string;
}

type Center = { x: number; y: number };

const RINGS = [25, 50, 75, 100];
/* Margen lateral más ancho: las etiquetas de los ejes izquierdo y derecho crecen hacia afuera. */
const PAD_X = 96;
const PAD_Y = 48;

function point(index: number, total: number, radius: number, center: Center): [number, number] {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return [center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius];
}

function shape(values: number[], radius: number, center: Center): string {
  return (
    values
      .map((value, index) => {
        const [x, y] = point(index, values.length, (Math.max(4, value) / 100) * radius, center);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

/** Radar de 6 ejes. La forma se anima (transición CSS de «d») al cambiar las respuestas. */
export function RadarChart({ dimensions, size = 280, showValues = false, className }: RadarChartProps) {
  const width = size + PAD_X * 2;
  const height = size + PAD_Y * 2;
  const center = { x: width / 2, y: height / 2 };
  const radius = size / 2;
  const values = dimensions.map((dimension) => (dimension.answered ? dimension.score : 0));
  const area = shape(values, radius, center);

  return (
    <svg
      className={["radar-chart", className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={dimensions.map((d) => `${d.label} ${d.answered ? d.score : "sin responder"}`).join(", ")}
    >
      {RINGS.map((ring) => (
        <path key={ring} className="radar-ring" d={shape(dimensions.map(() => ring), radius, center)} />
      ))}
      {dimensions.map((dimension, index) => {
        const [x, y] = point(index, dimensions.length, radius, center);
        return <line key={dimension.id} className="radar-axis" x1={center.x} y1={center.y} x2={x} y2={y} />;
      })}
      <path className="radar-area" style={{ d: `path("${area}")` }} d={area} />
      {dimensions.map((dimension, index) => {
        const [x, y] = point(index, dimensions.length, (Math.max(4, values[index]) / 100) * radius, center);
        return dimension.answered ? <circle key={dimension.id} className="radar-dot" cx={x} cy={y} r={4} /> : null;
      })}
      {dimensions.map((dimension, index) => {
        const [x, y] = point(index, dimensions.length, radius + 22, center);
        const anchor = Math.abs(x - center.x) < 4 ? "middle" : x > center.x ? "start" : "end";
        return (
          <text key={dimension.id} className={dimension.answered ? "radar-label" : "radar-label is-empty"} x={x} y={y} textAnchor={anchor} dominantBaseline="middle">
            {dimension.label}
            {showValues && dimension.answered ? <tspan className="radar-value" x={x} dy="1.25em">{dimension.score}</tspan> : null}
          </text>
        );
      })}
    </svg>
  );
}
