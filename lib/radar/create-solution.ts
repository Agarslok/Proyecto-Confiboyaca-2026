import { genericAssistant } from "@/lib/radar/assistant";
import { catalogFallback, genericCatalog, isPoorCatalogFallback } from "@/lib/radar/presentation";
import { activityOf, buildRadarResult } from "@/lib/radar/engine";
import type { SolutionBrief } from "@/lib/radar/solution-brief";
import { solutionBrief } from "@/lib/radar/solution-brief";
import type { RadarAnswers } from "@/lib/radar/types";
import type { SolutionAssistantSpec, SolutionHoleSpec, SolutionSectionSpec } from "@/lib/site/solution-slot";
import { ASSISTANT_DISCLAIMER, GEMINI_SOLUTION_SYSTEM_LINES } from "@/lib/radar/solution-limits";
import { parseSolutionHole } from "@/lib/validation/solution-hole";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

const CATALOG_KEYS = ["visitorTitle", "businessChange", "submitLabel", "choices", "dateLabel", "partyLabel", "partyMin", "partyMax", "columns", "rows"];
const ASSISTANT_KEYS = ["visitorTitle", "businessChange", "role", "focus", "greeting", "starters", "disclaimer"];

export type SolutionSource = "modelo" | "catalogo" | "minimo";

export function interpretSolutionModelText(
  text: string,
  brief: SolutionBrief,
): { ok: true; spec: SolutionHoleSpec } | { ok: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    return { ok: false, reason: "La solución tiene que ser un JSON, no texto ni HTML." };
  }
  return parseSolutionHole(lockDraft(parsed, brief));
}

/**
 * Cadena de respaldos, sin red:
 * JSON válido → catálogo del paso 2 → catálogo mínimo genérico.
 */
export function applyFallbacks(input: {
  brief: SolutionBrief | null;
  modelSpec?: SolutionHoleSpec | null;
  catalogFallback?: SolutionSectionSpec | SolutionAssistantSpec;
}): { spec: SolutionHoleSpec; source: SolutionSource } {
  const kind = input.brief?.kind ?? "registro";
  const minimo = genericCatalog(kind);
  if (input.brief?.presentationMode === "asistente") {
    if (input.modelSpec?.action === "asistente") return { spec: input.modelSpec, source: "modelo" };
    if (input.catalogFallback?.action === "asistente") return { spec: input.catalogFallback, source: "catalogo" };
    return { spec: genericAssistant(input.brief.companyName), source: "minimo" };
  }
  if (input.modelSpec && input.modelSpec.action !== "asistente") {
    const spec = input.modelSpec as SolutionSectionSpec;
    if (input.catalogFallback && input.catalogFallback.action !== "asistente") {
      return {
        spec: {
          ...spec,
          visitorTitle: input.catalogFallback.visitorTitle,
          businessChange: input.catalogFallback.businessChange,
        },
        source: "modelo",
      };
    }
    return { spec, source: "modelo" };
  }
  if (
    input.catalogFallback &&
    input.catalogFallback.action !== "asistente" &&
    !isPoorCatalogFallback(input.catalogFallback)
  ) {
    return { spec: input.catalogFallback, source: "catalogo" };
  }
  return { spec: minimo, source: "minimo" };
}

export async function createSolutionSpec(
  answers: RadarAnswers,
  options?: { fetchImpl?: typeof fetch },
): Promise<{ ok: true; spec: SolutionHoleSpec; source: SolutionSource }> {
  const result = buildRadarResult(answers);
  const { industry, activity } = activityOf(answers);
  const vocab = industry
    ? { ...industry.vocab, ...activity?.vocab }
    : { productos: "productos", clientes: "clientes", punto: "sede" };
  const brief = solutionBrief(answers);
  const catalogFallbackSpec =
    result.presentation?.mode === "catalogo"
      ? result.presentation.fallback
      : result.presentation?.mode === "asistente"
        ? result.presentation.fallback
        : result.central
          ? catalogFallback({
              companyName: answers.companyName,
              industryId: answers.industry,
              activityId: answers.activity,
              activityLabel: activity?.label ?? "",
              vocab,
              central: result.central,
              dimensions: result.dimensions,
              findings: result.findings,
            })
          : genericCatalog("registro");

  const fetchImpl = options?.fetchImpl ?? fetch;
  const modelSpec = brief ? await askModel(brief, fetchImpl) : null;

  return {
    ok: true,
    ...applyFallbacks({ brief, modelSpec, catalogFallback: catalogFallbackSpec }),
  };
}

async function askModel(brief: SolutionBrief, fetchImpl: typeof fetch): Promise<SolutionHoleSpec | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL_ID?.trim() || "gemini-2.5-flash";
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 20000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 20000);

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
          system_instruction: { parts: [{ text: GEMINI_SOLUTION_SYSTEM_LINES.join(" ") }] },
          contents: [{ role: "user", parts: [{ text: userPrompt(brief) }] }],
          generation_config: {
            temperature: 0.35,
            max_output_tokens: 1600,
            response_mime_type: "application/json",
          },
        }),
      },
    );
    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) return null;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return null;
    const drafted = interpretSolutionModelText(text, brief);
    return drafted.ok ? drafted.spec : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function userPrompt(brief: SolutionBrief): string {
  const shape =
    brief.presentationMode === "asistente"
      ? "Objeto con action \"asistente\", visitorTitle, businessChange, role, focus (cómo la IA entra en este sector y esta actividad), greeting, starters (3 a 4 preguntas cortas de un visitante) y disclaimer de demostración."
      : brief.action === "agenda"
        ? "Objeto con action \"agenda\", visitorTitle, businessChange, submitLabel y choices (id en minúsculas con guiones, label, detail, price entero). dateLabel, partyLabel, partyMin y partyMax son opcionales."
        : `Objeto con action "${brief.action}", visitorTitle, businessChange, submitLabel, columns (2 a 6) y rows. Cada fila tiene tantas celdas como columnas. Las columnas son campos operativos (producto, cantidades, cliente o estado) porque el visitante agrega, edita y quita filas.`;
  return `Encargo:\n${JSON.stringify(brief)}\n\nForma del JSON:\n${shape}`;
}

function extractJson(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) return trimmed;
  return trimmed.slice(start, end + 1);
}

function lockDraft(value: unknown, brief: SolutionBrief): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  if (brief.presentationMode === "asistente") {
    const draft = pick(source, ASSISTANT_KEYS);
    draft.action = "asistente";
    draft.disclaimer = typeof source.disclaimer === "string" && source.disclaimer.trim()
      ? source.disclaimer
      : ASSISTANT_DISCLAIMER;
    return draft;
  }
  const draft = pick(source, CATALOG_KEYS);
  draft.action = brief.action;
  if (Array.isArray(draft.choices)) {
    draft.choices = draft.choices.map((choice) => {
      if (!choice || typeof choice !== "object") return choice;
      const row = choice as Record<string, unknown>;
      const price = typeof row.price === "string" ? Number(row.price) : row.price;
      return { ...row, price };
    });
  }
  return draft;
}

function pick(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const draft: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) draft[key] = source[key];
  }
  return draft;
}
