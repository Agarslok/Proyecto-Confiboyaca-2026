import { activityOf, buildRadarResult } from "@/lib/radar/engine";
import type { AssistantChatContext } from "@/lib/radar/assistant";
import { samplesFor } from "@/lib/radar/assistant";
import type { RadarAnswers } from "@/lib/radar/types";
import type { SolutionAssistantSpec } from "@/lib/site/solution-slot";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

export type AssistantTurn = { role: "user" | "assistant"; text: string };

export function assistantContextFromAnswers(
  answers: RadarAnswers,
  spec?: SolutionAssistantSpec | null,
): AssistantChatContext {
  const result = buildRadarResult(answers);
  const { industry, activity } = activityOf(answers);
  const vocab = industry
    ? { ...industry.vocab, ...activity?.vocab }
    : { productos: "productos", clientes: "clientes", punto: "sede" };
  const samples = samplesFor(answers.industry);
  return {
    companyName: answers.companyName.trim() || "El negocio",
    industry: result.industryLabel,
    activity: result.activityLabel,
    industryId: answers.industry || undefined,
    activityId: answers.activity || undefined,
    size: result.sizeLabel,
    index: result.index,
    level: result.level,
    findings: result.findings.map((finding) => finding.text),
    items: samples.items,
    customers: samples.customers,
    role: spec?.role || `Asistente de ${answers.companyName.trim() || "el negocio"}`,
    focus: spec?.focus || "",
    productos: vocab.productos,
    clientes: vocab.clientes,
    punto: vocab.punto,
  };
}

export function assistantSystemPrompt(context: AssistantChatContext): string {
  const findings = context.findings.length
    ? context.findings.slice(0, 6).map((item) => `- ${item}`).join("\n")
    : "- Ningún hallazgo crítico. El negocio ya puede usar IA en el día a día.";
  const items = context.items.slice(0, 3).join(", ") || "productos de demostración";
  const customers = context.customers.slice(0, 2).join(", ") || "clientes de demostración";
  return [
    `Eres ${context.role || `el asistente virtual de ${context.companyName}`}.`,
    `Negocio: ${context.companyName}. Sector: ${context.industry}. Actividad: ${context.activity}. Tamaño: ${context.size || "no indicado"}.`,
    `Índice Radar: ${context.index}/100. Nivel: ${context.level}.`,
    `Cómo entra la IA en este negocio: ${context.focus || "atender con el contexto de la operación"}.`,
    `Vocabulario: ${context.productos}; ${context.clientes}; ${context.punto}.`,
    `Ejemplos (demostración, no inventario real): ${items}. Clientes de ejemplo: ${customers}.`,
    `Hallazgos del diagnóstico:\n${findings}`,
    "Responde en español sencillo, como quien atiende el mostrador de ESTE negocio, no un consultor genérico.",
    "No pidas ni reveles teléfono, correo ni datos de contacto. No inventes integraciones reales ni cumplimiento legal.",
    "Si no sabes un dato concreto de este negocio, dilo y ofrece cómo la IA podría ayudar en este sector.",
    "Máximo cuatro párrafos cortos.",
  ].join(" ");
}

export async function askBusinessAssistant(
  input: {
    question: string;
    history: AssistantTurn[];
    context: AssistantChatContext;
  },
  options?: { fetchImpl?: typeof fetch },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
  }

  const model = process.env.GEMINI_MODEL_ID?.trim() || "gemini-2.5-flash";
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 20000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 20000);
  const fetchImpl = options?.fetchImpl ?? fetch;
  const history = input.history.slice(-8).map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.text.slice(0, 1200) }],
  }));

  try {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: assistantSystemPrompt(input.context) }] },
          contents: [...history, { role: "user", parts: [{ text: input.question }] }],
          generation_config: { temperature: 0.4, max_output_tokens: 400 },
        }),
      },
    );
    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini no pudo responder.");
    }
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!answer) throw new Error("Gemini no devolvió texto.");
    return answer.slice(0, 1200);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La consulta a Gemini tardó demasiado.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
