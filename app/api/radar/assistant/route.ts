import { NextResponse } from "next/server";
import { z } from "zod";
import { askBusinessAssistant, assistantContextFromAnswers, type AssistantTurn } from "@/lib/radar/ask-assistant";
import type { AssistantChatContext } from "@/lib/radar/assistant";
import { sanitizeAssistantContext, sanitizeAssistantPayload } from "@/lib/radar/assistant-payload";
import { getDiagnosisStore } from "@/lib/store/diagnoses";
import { isAssistantSolution } from "@/lib/site/solution-slot";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(4000),
});

const contextSchema = z.object({
  companyName: z.string().trim().min(1).max(80),
  industry: z.string().trim().max(80).default(""),
  activity: z.string().trim().max(80).default(""),
  industryId: z.string().trim().max(40).optional(),
  activityId: z.string().trim().max(60).optional(),
  size: z.string().trim().max(80).default(""),
  index: z.number().int().min(0).max(100),
  level: z.string().trim().max(20).default(""),
  findings: z.array(z.string().trim().max(240)).max(8).default([]),
  items: z.array(z.string().trim().max(80)).max(6).default([]),
  customers: z.array(z.string().trim().max(80)).max(4).default([]),
  role: z.string().trim().max(80).default(""),
  focus: z.string().trim().max(240).default(""),
  productos: z.string().trim().max(60).default("productos"),
  clientes: z.string().trim().max(60).default("clientes"),
  punto: z.string().trim().max(60).default("sede"),
  opsBrief: z.string().trim().max(4000).optional(),
  opsProfileGuidance: z.string().trim().max(1200).optional(),
  companyNameHint: z.string().trim().max(400).optional(),
  opsTables: z
    .array(
      z.object({
        tableLabel: z.string().trim().max(80),
        columns: z
          .array(
            z.object({
              key: z.string().trim().max(40),
              label: z.string().trim().max(80),
              slot: z.enum(["who", "when", "howMany", "what"]),
              options: z.array(z.string().trim().max(120)).max(24).default([]),
            }),
          )
          .max(4),
        rows: z.array(z.record(z.string().max(40), z.string().max(500))).max(12).optional(),
      }),
    )
    .max(8)
    .optional(),
});

const bodySchema = z.object({
  question: z.string().trim().min(1).max(500),
  history: z.array(turnSchema).max(8).default([]),
  code: z.string().trim().max(16).optional(),
  context: contextSchema.optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "La pregunta no es válida." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((issue) => issue.code === "too_big" && issue.path.join(".") === "question");
    const message = tooLong
      ? "Escriba una pregunta de hasta 500 caracteres."
      : "Los datos del asistente no pudieron validarse. Recargue la página e intente de nuevo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const clientContext = parsed.data.context ? sanitizeAssistantContext(parsed.data.context as AssistantChatContext) : undefined;
  const history = sanitizeAssistantPayload({
    context: clientContext ?? ({ companyName: "El negocio", index: 0, level: "bajo", findings: [] } as AssistantChatContext),
    history: parsed.data.history as AssistantTurn[],
  }).history;

  const context = await resolveContext(parsed.data.code, clientContext);
  if (!context) {
    return NextResponse.json({ error: "Falta el contexto de este negocio." }, { status: 400 });
  }

  try {
    const result = await askBusinessAssistant({
      question: parsed.data.question,
      history,
      context: sanitizeAssistantContext(context),
    });
    return NextResponse.json({ answer: result.answer, engine: result.engine });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar al asistente.";
    const status = message.includes("GEMINI_API_KEY") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

async function resolveContext(
  code: string | undefined,
  fallback: AssistantChatContext | undefined,
): Promise<AssistantChatContext | null> {
  const label = code?.trim().toUpperCase();
  if (label) {
    try {
      const record = await (await getDiagnosisStore()).get(label);
      if (record) {
        const spec = record.solutionSpec && isAssistantSolution(record.solutionSpec) ? record.solutionSpec : null;
        const fromStore = assistantContextFromAnswers(record.answers, spec);
        // Las filas vivas vienen del navegador: solo se aceptan si son del mismo sector
        // que el negocio guardado con ese código; si no, se usa el catálogo del servidor.
        const sameSector =
          !!fallback &&
          (fallback.industryId ?? "") === (fromStore.industryId ?? "") &&
          (fallback.activityId ?? "") === (fromStore.activityId ?? "");
        return {
          ...fromStore,
          opsBrief: sameSector ? (fallback?.opsBrief ?? fromStore.opsBrief) : fromStore.opsBrief,
          opsTables: sameSector ? (fallback?.opsTables ?? fromStore.opsTables) : fromStore.opsTables,
          opsProfileGuidance: sameSector
            ? (fallback?.opsProfileGuidance ?? fromStore.opsProfileGuidance)
            : fromStore.opsProfileGuidance,
        };
      }
    } catch {
      /* Si el almacén no está, se usa el contexto de la página. */
    }
  }
  return fallback ?? null;
}
