import { fairConsultantPrompt } from "@/lib/avatar/fair-context";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

export async function askFairConsultant(question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
  }

  const model = process.env.GEMINI_MODEL_ID?.trim() || "gemini-2.5-flash";
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 20000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 20000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: fairConsultantPrompt }] },
          contents: [{ role: "user", parts: [{ text: question }] }],
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
