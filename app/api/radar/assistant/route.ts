import { NextResponse } from "next/server";
import { z } from "zod";
import { askBusinessAssistant, assistantContextFromAnswers, type AssistantTurn } from "@/lib/radar/ask-assistant";
import type { AssistantChatContext } from "@/lib/radar/assistant";
import { getDiagnosisStore } from "@/lib/store/diagnoses";
import { isAssistantSolution } from "@/lib/site/solution-slot";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(1200),
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
    return NextResponse.json({ error: "Escriba una pregunta de hasta 500 caracteres." }, { status: 400 });
  }

  const context = await resolveContext(parsed.data.code, parsed.data.context);
  if (!context) {
    return NextResponse.json({ error: "Falta el contexto de este negocio." }, { status: 400 });
  }

  try {
    const answer = await askBusinessAssistant({
      question: parsed.data.question,
      history: parsed.data.history as AssistantTurn[],
      context,
    });
    return NextResponse.json({ answer });
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
        return assistantContextFromAnswers(record.answers, spec);
      }
    } catch {
      /* Si el almacén no está, se usa el contexto de la página. */
    }
  }
  return fallback ?? null;
}
