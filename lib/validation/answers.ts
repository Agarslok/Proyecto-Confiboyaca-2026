import { z } from "zod";
import {
  FREQUENCY_IDS,
  GOAL_IDS,
  INDUSTRY_IDS,
  METHOD_IDS,
  PROBLEM_IDS,
  SIZE_IDS,
  TEMPLATE_KEYS,
  type Answers,
  type Diagnosis,
  type WalkthroughState,
} from "@/types/domain";

export const answersSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(2, "Escriba el nombre de la empresa.")
      .max(80, "Use un nombre de hasta 80 caracteres."),
    industryId: z.enum(INDUSTRY_IDS, "Seleccione un sector."),
    size: z.enum(SIZE_IDS, "Seleccione el tamaño aproximado."),
    problems: z.array(z.enum(PROBLEM_IDS)).min(1, "Seleccione al menos un problema."),
    otherProblem: z
      .string()
      .trim()
      .max(240, "Use una descripción de hasta 240 caracteres.")
      .optional(),
    primaryProblem: z.enum(PROBLEM_IDS, "Seleccione el problema principal."),
    goals: z.array(z.enum(GOAL_IDS)).min(1, "Seleccione al menos un objetivo."),
    currentMethod: z.enum(METHOD_IDS, "Indique cómo se gestiona hoy."),
    painFrequency: z.enum(FREQUENCY_IDS, "Indique con qué frecuencia aparece."),
  })
  .superRefine((value, ctx) => {
    if (!value.problems.includes(value.primaryProblem)) {
      ctx.addIssue({
        code: "custom",
        message: "El problema principal debe estar entre los seleccionados.",
        path: ["primaryProblem"],
      });
    }
    if (value.problems.includes("otro") && (value.otherProblem ?? "").length < 8) {
      ctx.addIssue({
        code: "custom",
        message: "Describa el otro problema en una frase breve.",
        path: ["otherProblem"],
      });
    }
  });

const stepTuple = z.tuple([
  z.string().min(1),
  z.string().min(1),
  z.string().min(1),
]);

export const diagnosisSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  sessionId: z.string().min(1),
  companyName: z.string().min(1),
  industryId: z.enum(INDUSTRY_IDS),
  industryName: z.string().min(1),
  templateKey: z.enum(["industrial", "services"]),
  templateVersion: z.number().int().positive(),
  primaryProblem: z.enum(PROBLEM_IDS),
  primaryProblemLabel: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.array(z.string().min(1)).min(3),
  solutionTitle: z.string().min(1),
  solutionSummary: z.string().min(1),
  steps: stepTuple,
  benefits: z.array(z.string().min(1)).min(2),
  limitations: z.array(z.string().min(1)).min(1),
  assumptions: z.array(z.string().min(1)).min(1),
  demoType: z.enum(["crm", "tasks", "inventory", "analytics"]),
  demoTitle: z.string().min(1),
  source: z.literal("rules"),
  signal: z.enum(["clara", "insuficiente"]),
});

export const draftSchema = z.object({
  companyName: z.string(),
  industryId: z.union([z.enum(INDUSTRY_IDS), z.literal("")]),
  size: z.union([z.enum(SIZE_IDS), z.literal("")]),
  problems: z.array(z.enum(PROBLEM_IDS)),
  otherProblem: z.string(),
  primaryProblem: z.union([z.enum(PROBLEM_IDS), z.literal("")]),
  goals: z.array(z.enum(GOAL_IDS)),
  currentMethod: z.union([z.enum(METHOD_IDS), z.literal("")]),
  painFrequency: z.union([z.enum(FREQUENCY_IDS), z.literal("")]),
});

export const walkthroughSchema = z.object({
  version: z.literal(1),
  templateKey: z.enum(TEMPLATE_KEYS),
  industryId: z.enum(INDUSTRY_IDS).nullable(),
  step: z.number().int().min(0).max(3),
  draft: draftSchema,
  diagnosis: diagnosisSchema.nullable(),
  storageWarning: z.string().nullable(),
});

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function parseAnswers(input: unknown):
  | { ok: true; answers: Answers }
  | { ok: false; fieldErrors: Record<string, string> } {
  const parsed = answersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  return { ok: true, answers: parsed.data };
}

export function parseDiagnosis(input: unknown): Diagnosis | null {
  const parsed = diagnosisSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function parseWalkthrough(input: unknown): WalkthroughState | null {
  const parsed = walkthroughSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
