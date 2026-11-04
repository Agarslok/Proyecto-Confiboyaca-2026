import { opsBriefFromSector } from "@/lib/assistant/ops-brief";
import { opsTablesFromEntities } from "@/lib/assistant/ops-capture";
import { localOpsAnswer } from "@/lib/ops/conversational";
import { activityProfile, compactProfileGuidance } from "@/lib/ops/sector/profile-builder";
import { cloneCrmCatalog } from "@/lib/assistant/crm-state";
import { crmCatalogFromVoice } from "@/lib/assistant/crm-catalog";
import { solutionVoice } from "@/lib/radar/solution-voice";
import { activityOf, buildRadarResult } from "@/lib/radar/engine";
import type { AssistantChatContext } from "@/lib/radar/assistant";
import { samplesFor } from "@/lib/radar/assistant";
import type { IndustryId, RadarAnswers } from "@/lib/radar/types";
import type { SolutionAssistantSpec } from "@/lib/site/solution-slot";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

export type AssistantTurn = { role: "user" | "assistant"; text: string };

export type AssistantReply = { answer: string; engine: import("@/lib/assistant/session-quota").AssistantEngine };

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
    opsBrief: opsBriefFromSector({
      companyName: answers.companyName.trim() || "El negocio",
      industryId: answers.industry || undefined,
      activityId: answers.activity || undefined,
    }),
    opsProfileGuidance: answers.industry
      ? compactProfileGuidance(activityProfile(answers.industry as IndustryId, answers.activity || ""))
      : undefined,
    opsTables: answers.industry
      ? opsTablesFromEntities(
          cloneCrmCatalog(
            crmCatalogFromVoice(
              solutionVoice({
                companyName: answers.companyName.trim() || "El negocio",
                industryId: answers.industry as IndustryId,
                activityId: answers.activity || "",
              }),
              answers.industry,
              answers.activity || "",
            ),
          ),
        )
      : undefined,
  };
}

export function assistantSystemPrompt(context: AssistantChatContext): string {
  const ops =
    context.opsBrief?.trim() ||
    `Sector: ${context.industry || context.activity || "general"}. Tablas: Registro; Existencias; Solicitudes. Vocabulario: ${context.productos}; ${context.clientes}; ${context.punto}.`;
  const table = context.opsTables?.[0];
  const sampleLines = table?.columns.length
    ? table.columns.map((column) => `${column.label}: (dato o Por definir)`).join("\n")
    : "Quién: (dato o Por definir)\nCuándo: (dato o Por definir)\nCuántos: (dato o Por definir)\nQué: (dato o Por definir)";
  const profileGuide = context.opsProfileGuidance?.trim();
  return [
    `Eres el asistente operativo de ${context.companyName} (${context.industry} · ${context.activity}).`,
    profileGuide ? `Contexto sectorial: ${profileGuide}` : "",
    context.companyNameHint?.trim() ? `Nombre del negocio: ${context.companyNameHint.trim()}` : "",
    "Usas SOLO estas tablas y cifras (misma base de datos y dashboard):",
    ops,
    "Responde a la última pregunta, en una o dos frases, cercanas y concretas. Si consulta, cuenta, saluda o cambia de tema, NO uses la plantilla de anotar.",
    "ANOTAR (solo si quiere registrar un dato nuevo): plantilla EXACTA, con líneas en blanco:",
    "Perfecto.",
    "",
    sampleLines,
    "",
    "¿Cuál es {el primer campo en Por definir}?",
    "Si el usuario da varios datos en un solo mensaje, reparte cada dato en SU línea del template usando las etiquetas de arriba. Nunca copies la frase completa en el primer campo. Conserva lo que ya tenías en Por definir salvo que el usuario lo corrija. Ejemplos: salud — «el cliente es Juan, son 6 personas y el servicio es odontología»; planta — «lote 3, cantidad 20 toneladas y el producto son esmeraldas» → cada valor en su columna (responsable/lote, cantidad, producto/referencia, etc.).",
    "Una sola pregunta de seguimiento si aún falta un campo. Si no falta nada, cierra con «Listo, quedó en {tabla}.»",
    "CONSULTAR: usa solo nombres y cifras de las filas. Ej: «Tienes 3 reservas. Familia Moreno llega el Vie 7 nov.» Si el dato no está, dilo y pregunta si miramos reservas, huéspedes en casa, habitaciones o pedidos. No inventes filas. Nunca empieces con «Perfecto.»",
    "Sin saludo si ya hablaste. Sin teléfono ni legales.",
  ].join("\n");
}

export async function askBusinessAssistant(
  input: {
    question: string;
    history: AssistantTurn[];
    context: AssistantChatContext;
  },
  options?: { fetchImpl?: typeof fetch },
): Promise<AssistantReply> {
  const local = localOpsAnswer({
    question: input.question,
    tables: input.context.opsTables,
    history: input.history,
    industryId: input.context.industryId,
    activityId: input.context.activityId,
  });
  if (local) return { answer: local, engine: "local" };

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
  }

  const model = process.env.GEMINI_MODEL_ID?.trim() || "gemini-2.5-flash";
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 20000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 20000);
  const fetchImpl = options?.fetchImpl ?? fetch;
  const history = input.history.slice(-6).map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.text.slice(0, 400) }],
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
          generation_config: { temperature: 0.25, max_output_tokens: 180 },
        }),
      },
    );
    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini no pudo responder.");
    }
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!answer) throw new Error("Gemini no devolvió texto.");
    return { answer: answer.slice(0, 600), engine: "gemini" };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La consulta a Gemini tardó demasiado.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
