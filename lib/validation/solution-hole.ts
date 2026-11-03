import { z } from "zod";
import { SOLUTION_ACTIONS, type SolutionHoleSpec } from "@/lib/site/solution-slot";

/* ============================================================================
   Validación del hueco de solución.

   El modelo solo puede devolver JSON de catálogo o asistente.
   Los specs antiguos con action "guia" se convierten a tabla de registro.
   ========================================================================== */

import type { SolutionActionId } from "@/lib/site/solution-slot";

function migrateLegacySolution(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const row = value as Record<string, unknown>;
  if (row.action !== "guia") return value;
  const action = (SOLUTION_ACTIONS as readonly string[]).includes(String(row.suggestedActionLater))
    ? (row.suggestedActionLater as SolutionActionId)
    : "registro";
  const steps = Array.isArray(row.steps) ? row.steps : [];
  return {
    action,
    visitorTitle: row.visitorTitle ?? "Registra aquí",
    businessChange: row.businessChange ?? "Cada movimiento queda en la misma lista.",
    submitLabel: "Guardar",
    columns: ["Paso", "Qué hacer"],
    rows: steps.length
      ? steps.slice(0, 8).map((step) => {
          const s = step as Record<string, unknown>;
          return [String(s.title ?? "Paso"), String(s.detail ?? "")];
        })
      : [["Hoy", "Anota lo que ocurrió en el momento."]],
  };
}

const plain = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Falta ${label}.`)
    .max(max, `${label} es demasiado largo.`)
    .refine((value) => !/[<>]/.test(value), `${label} no puede llevar HTML.`);

const choiceSchema = z.strictObject({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,40}$/, "El id de la opción usa solo minúsculas, números y guiones."),
  label: plain(80, "El nombre de la opción"),
  detail: plain(120, "El detalle de la opción"),
  price: z.number().int().nonnegative().max(50_000_000),
});

const catalogBase = {
  visitorTitle: plain(90, "El título"),
  businessChange: plain(240, "La frase para el negocio"),
  submitLabel: plain(40, "El botón"),
};

const agendaSchema = z
  .strictObject({
    action: z.literal("agenda"),
    ...catalogBase,
    choices: z.array(choiceSchema).min(1, "La agenda necesita al menos una opción.").max(6),
    dateLabel: plain(40, "La etiqueta de fecha").optional(),
    partyLabel: plain(40, "La etiqueta de personas").optional(),
    partyMin: z.number().int().min(1).max(20).optional(),
    partyMax: z.number().int().min(1).max(40).optional(),
  })
  .refine((spec) => spec.partyMin == null || spec.partyMax == null || spec.partyMin <= spec.partyMax, {
    message: "El mínimo de personas no puede superar el máximo.",
  });

const cell = plain(80, "La celda");

const tableSchema = {
  ...catalogBase,
  columns: z.array(plain(40, "La columna")).min(2, "Hacen falta al menos dos columnas.").max(6),
  rows: z.array(z.array(cell).min(1).max(6)).min(1, "Hace falta al menos una fila.").max(8),
};

function withMatchingRows<T extends z.ZodType<{ columns: string[]; rows: string[][] }>>(schema: T) {
  return schema.refine((spec) => spec.rows.every((row) => row.length === spec.columns.length), {
    message: "Cada fila tiene que tener tantas celdas como columnas.",
  });
}

const inventarioSchema = withMatchingRows(z.strictObject({ action: z.literal("inventario"), ...tableSchema }));
const registroSchema = withMatchingRows(z.strictObject({ action: z.literal("registro"), ...tableSchema }));
const solicitudesSchema = withMatchingRows(z.strictObject({ action: z.literal("solicitudes"), ...tableSchema }));

const assistantSchema = z.strictObject({
  action: z.literal("asistente"),
  visitorTitle: plain(90, "El título"),
  businessChange: plain(240, "La frase para el negocio"),
  role: plain(80, "El rol del asistente"),
  focus: plain(240, "El enfoque de IA"),
  greeting: plain(240, "El saludo"),
  starters: z.array(plain(80, "La pregunta sugerida")).min(3, "El asistente necesita entre 3 y 4 preguntas.").max(4),
  disclaimer: plain(280, "La aclaración"),
});

export const solutionHoleSchema = z.discriminatedUnion("action", [
  agendaSchema,
  inventarioSchema,
  registroSchema,
  solicitudesSchema,
  assistantSchema,
]);

export function parseSolutionHole(
  value: unknown,
): { ok: true; spec: SolutionHoleSpec } | { ok: false; reason: string } {
  if (typeof value === "string") {
    return { ok: false, reason: "La solución tiene que ser un JSON, no texto ni HTML." };
  }
  const parsed = solutionHoleSchema.safeParse(migrateLegacySolution(value));
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? "La solución no cumple el contrato." };
  }
  return { ok: true, spec: parsed.data };
}
