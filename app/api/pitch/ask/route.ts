import { NextResponse } from "next/server";
import { z } from "zod";
import { askFairConsultant } from "@/lib/avatar/ask-gemini";
import { answerOffersAvatarSolution } from "@/lib/avatar/solution-offer";

const bodySchema = z.object({
  question: z.string().trim().min(1).max(500),
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

  try {
    const answer = await askFairConsultant(parsed.data.question);
    return NextResponse.json({
      answer,
      solutionReady: answerOffersAvatarSolution(answer),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar al asistente.";
    const status = message.includes("GEMINI_API_KEY") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
