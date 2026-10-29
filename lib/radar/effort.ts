import type { PlanId } from "@/lib/radar/bank";
import type { RadarAnswers, SizeId } from "@/lib/radar/types";

/* ============================================================================
   Estimación de horas del acompañamiento.

   Referencia del equipo: un producto pequeño (Plan Arranque, unos 3 meses)
   toma mínimo 60–80 horas hombre, porque muchas empresas no tienen base de
   datos o la tienen en varios cuadernos que hay que pasar. Las horas de cada
   fase suben con el tamaño de la empresa y con lo desordenado de los datos.
   Todo se ajusta en este archivo.
   ========================================================================== */

interface PhaseTemplate {
  name: string;
  hours: number;
  /** Horas extra según cómo registra hoy (A papel, B Excel suelto, C software suelto, D integrado). */
  byRecord?: Partial<Record<"A" | "B" | "C" | "D" | "E", number>>;
}

const PHASES: Record<PlanId, PhaseTemplate[]> = {
  arranque: [
    { name: "Levantamiento en el negocio: cómo se trabaja hoy", hours: 8 },
    { name: "Pasar cuadernos y archivos a una tabla", hours: 4, byRecord: { A: 14, E: 14, B: 8, C: 2 } },
    { name: "Montar la solución al problema central", hours: 20 },
    { name: "Primeros pasos: caja, inventario o fiados", hours: 12 },
    { name: "Enseñar al dueño o al encargado, en su celular", hours: 10 },
    { name: "Seguimiento y ajustes", hours: 6 },
  ],
  orden: [
    { name: "Levantamiento por áreas", hours: 12 },
    { name: "Digitalizar y unificar la información", hours: 12, byRecord: { A: 24, E: 24, B: 16, C: 8 } },
    { name: "Montar ventas, clientes e inventario en un solo lugar", hours: 40 },
    { name: "Tablero con 3 a 5 indicadores", hours: 24 },
    { name: "Copias de seguridad y accesos por persona", hours: 8 },
    { name: "Acompañar al encargado hasta que lo use solo", hours: 16 },
    { name: "Seguimiento y ajustes", hours: 12 },
  ],
  crecer: [
    { name: "Elegir el uso de IA de mayor retorno", hours: 16 },
    { name: "Preparar y limpiar los datos", hours: 32, byRecord: { A: 24, E: 24, B: 16, C: 8 } },
    { name: "Implementar el caso de IA en sus sistemas", hours: 80 },
    { name: "Automatizar los reportes", hours: 32 },
    { name: "Reglas de uso de IA y datos personales", hours: 12 },
    { name: "Capacitar al equipo", hours: 24 },
    { name: "Medir el antes y el después", hours: 16 },
  ],
};

/** Más personas = más procesos, más datos y más gente que capacitar. */
const SIZE_FACTOR: Record<SizeId, number> = { micro: 1, pequena: 1.3, mediana: 1.8, grande: 2.5 };

/** Parte del trabajo que se hace en el negocio (visitas) y ritmo semanal. */
const ON_SITE: Record<PlanId, number> = { arranque: 0.7, orden: 0.5, crecer: 0.35 };
const HOURS_PER_WEEK: Record<PlanId, number> = { arranque: 6, orden: 7, crecer: 6 };
const HOURS_PER_VISIT = 4;

export interface Effort {
  phases: { name: string; hours: number }[];
  total: number;
  range: [number, number];
  visits: number;
  weeks: number;
  months: number;
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

export function estimateEffort(plan: PlanId, answers: Pick<RadarAnswers, "size" | "choices">): Effort {
  const factor = SIZE_FACTOR[answers.size || "micro"];
  const record = answers.choices["datos-registro"] ?? "B";
  const phases = PHASES[plan].map((phase) => ({
    name: phase.name,
    hours: Math.round((phase.hours + (phase.byRecord?.[record] ?? 0)) * factor),
  }));
  const total = phases.reduce((sum, phase) => sum + phase.hours, 0);
  const weeks = Math.ceil(total / (HOURS_PER_WEEK[plan] * Math.sqrt(factor)));
  return {
    phases,
    total,
    range: [round5(total * 0.9), round5(total * 1.15)],
    visits: Math.ceil((total * ON_SITE[plan]) / HOURS_PER_VISIT),
    weeks,
    months: Math.max(1, Math.round(weeks / 4.3)),
  };
}
