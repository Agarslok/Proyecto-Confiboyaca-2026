import type { CentralProblem } from "@/lib/radar/solution";
import type { SectorId } from "@/types/site";

/** Las 6 dimensiones del índice (los ejes del radar). */
export const DIMENSION_IDS = ["negocio", "datos", "tecnologia", "analitica", "equipo", "estrategia"] as const;
export type DimensionId = (typeof DIMENSION_IDS)[number];

export const INDUSTRY_IDS = [
  "moda",
  "alimentos",
  "comercio",
  "salud",
  "manufactura",
  "transporte",
  "agro",
  "servicios",
  "turismo",
  "mineria",
  "construccion",
  "otra",
] as const;
export type IndustryId = (typeof INDUSTRY_IDS)[number];

/** Eslabón de la cadena de valor al que pertenece cada actividad. */
export type LinkId = "produccion" | "comercial" | "logistica" | "servicio";

export const SIZE_IDS = ["micro", "pequena", "mediana", "grande"] as const;
export type SizeId = (typeof SIZE_IDS)[number];

export const GOAL_IDS = ["vender", "costos", "clientes", "automatizar", "demanda", "nose"] as const;
export type RadarGoalId = (typeof GOAL_IDS)[number];

export type LevelId = "alto" | "moderado" | "bajo";

/** A–D puntúan 0–3. «E» es «No sé»: cuenta 0 y queda «por confirmar». */
export type OptionKey = "A" | "B" | "C" | "D" | "E";

export interface Vocab {
  productos: string;
  clientes: string;
  punto: string;
}

export interface Activity {
  id: string;
  label: string;
  description: string;
  link: LinkId;
  vocab?: Partial<Vocab>;
}

export interface Industry {
  id: IndustryId;
  label: string;
  icon: string;
  /** Plantilla de página web que se le genera a la empresa. */
  template: SectorId;
  vocab: Vocab;
  activities: Activity[];
}

export interface RadarQuestion {
  id: string;
  dimension: DimensionId;
  /** Sección visible en el formulario. */
  section: string;
  text: string;
  /** Cuatro opciones, de 0 a 3 puntos. */
  options: [string, string, string, string];
  finding: string;
  consultantNote?: string;
  /** Temas que cubre; sirve para no repetir preguntas del eslabón. */
  topics?: string[];
  /** Industrias donde la pregunta no aplica. */
  skipFor?: IndustryId[];
  /** Pregunta condicional: solo aparece si se cumple. */
  showIf?: (answers: RadarAnswers) => boolean;
  /** Si está oculta, puntúa este valor en lugar de excluirse. */
  inferWhenHidden?: { points: number; reason: string };
}

export interface RadarAnswers {
  companyName: string;
  city: string;
  size: SizeId | "";
  industry: IndustryId | "";
  activity: string;
  /** Respuestas por id de pregunta. */
  choices: Record<string, OptionKey>;
  goals: RadarGoalId[];
  /** Pantalla actual del formulario. */
  cursor: number;
}

export interface Finding {
  questionId: string;
  dimension: DimensionId;
  severity: "critico" | "mejorable" | "confirmar";
  text: string;
  weight: number;
}

export interface CaseItem {
  id: string;
  title: string;
  kind: "transversal" | "eslabon" | "industria";
  appliesTo: "todas" | LinkId | IndustryId;
  levels: LevelId[];
  technique: string;
  indicator: string;
  better: "menor" | "mayor";
  goals: RadarGoalId[];
}

export interface DimensionScore {
  id: DimensionId;
  label: string;
  weight: number;
  score: number;
  answered: number;
}

export interface RadarResult {
  index: number;
  level: LevelId;
  levelNote: string | null;
  dimensions: DimensionScore[];
  findings: Finding[];
  cases: CaseItem[];
  industryLabel: string;
  activityLabel: string;
  linkLabel: string;
  sizeLabel: string;
  questionsAnswered: number;
  unsure: number;
  /** El hallazgo más grave y la solución que incorpora la página web. */
  central: CentralProblem | null;
}
