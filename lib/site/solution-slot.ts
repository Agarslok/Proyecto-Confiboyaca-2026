/* ============================================================================
   Contratos del hueco fijo bajo la portada.

   La inteligencia artificial, más adelante, solo rellena uno de estos objetos.
   No inventa HTML ni una plantilla nueva. El modo lo elige el motor de reglas;
   el modelo completa textos, opciones o pasos. Cada plantilla pinta el mismo
   contrato con su propia paleta.

   Catálogo: agenda, inventario, registro, solicitudes.
   Asistente: diagnóstico listo para IA (sin hallazgos críticos).

   Límites: la IA solo rellena este JSON; no rediseña menú, hero, pie ni fotos.
   ========================================================================== */

import type { SolutionKind } from "@/lib/radar/solution";

export const SOLUTION_ACTIONS = ["agenda", "inventario", "registro", "solicitudes"] as const;

export type SolutionActionId = (typeof SOLUTION_ACTIONS)[number];

export const ASSISTANT_ACTION = "asistente" as const;
export type PresentationActionId = SolutionActionId | typeof ASSISTANT_ACTION;

export interface SolutionChoice {
  id: string;
  label: string;
  detail: string;
  /** Precio por persona, en pesos. 0 si la acción no cobra. */
  price: number;
}

/**
 * Lo que ve el visitante en la sección, y la frase de qué cambia para el negocio.
 * `choices` alimenta agenda. `columns` y `rows` quedan reservados para inventario,
 * registro y solicitudes; esta entrega solo dibuja agenda.
 */
export interface SolutionSectionSpec {
  action: SolutionActionId;
  visitorTitle: string;
  businessChange: string;
  submitLabel: string;
  choices?: SolutionChoice[];
  dateLabel?: string;
  partyLabel?: string;
  partyMin?: number;
  partyMax?: number;
  columns?: string[];
  rows?: string[][];
}

/**
 * Hueco cuando el diagnóstico ya no tiene errores graves:
 * propuesta de cómo entra la IA en el sector y chat en vivo.
 */
export interface SolutionAssistantSpec {
  action: "asistente";
  visitorTitle: string;
  businessChange: string;
  role: string;
  focus: string;
  greeting: string;
  starters: string[];
  disclaimer: string;
}

/** Lo que puede vivir en el hueco: un widget del catálogo o el asistente. */
export type SolutionHoleSpec = SolutionSectionSpec | SolutionAssistantSpec;

export function isCatalogSolution(spec: SolutionHoleSpec): spec is SolutionSectionSpec {
  return spec.action !== "asistente";
}

export function isAssistantSolution(spec: SolutionHoleSpec): spec is SolutionAssistantSpec {
  return spec.action === "asistente";
}

/** Boceto fijo de agendamiento, para revisar título, campos y colores antes de conectar el modelo. */
export function agendaVisitSketch(): SolutionSectionSpec {
  return {
    action: "agenda",
    visitorTitle: "Agenda tu visita aquí",
    businessChange: "Cada visita queda con fecha, cupo y valor. El negocio deja de armarla por WhatsApp.",
    submitLabel: "Confirmar visita",
    dateLabel: "Fecha",
    partyLabel: "Personas",
    partyMin: 1,
    partyMax: 8,
    choices: [
      { id: "laguna", label: "Sendero laguna", detail: "3 horas · guía incluido", price: 85000 },
      { id: "aves", label: "Avistamiento de aves", detail: "Mañana · cupo corto", price: 120000 },
      { id: "taller", label: "Taller con la comunidad", detail: "Medio día · incluye almuerzo", price: 150000 },
    ],
  };
}
