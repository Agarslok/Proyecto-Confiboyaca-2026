import { SIZES } from "@/lib/radar/bank";
import { activityOf, buildRadarResult, screensFor } from "@/lib/radar/engine";
import { solutionVoice } from "@/lib/radar/solution-voice";
import type { SolutionKind } from "@/lib/radar/solution";
import type { RadarAnswers } from "@/lib/radar/types";
import type { PresentationActionId } from "@/lib/site/solution-slot";

/* ============================================================================
   Encargo fijo para «Creando la solución».

   Siempre las mismas claves. No incluye teléfono, correo ni el nombre de
   la persona: Gemini solo necesita el negocio y las respuestas que más pesan.
   ========================================================================== */

export interface SolutionBrief {
  companyName: string;
  industry: string;
  activity: string;
  size: string;
  problem: string;
  kind: SolutionKind;
  presentationMode: "catalogo" | "asistente";
  action: PresentationActionId | "";
  keyAnswers: { question: string; answer: string }[];
  samples: { items: string[]; customers: string[] };
  modelPrompt: string;
}

export function solutionBrief(answers: RadarAnswers): SolutionBrief | null {
  const result = buildRadarResult(answers);
  if (!result.presentation) return null;
  if (!result.central && result.presentation.mode !== "asistente") return null;
  const { industry, activity } = activityOf(answers);
  const voice = solutionVoice({
    companyName: answers.companyName,
    industryId: industry?.id ?? "",
    activityId: activity?.id ?? answers.activity,
  });
  const size = answers.size ? `${SIZES[answers.size].detail} (${SIZES[answers.size].label} personas)` : "Tamaño no indicado";
  return {
    companyName: answers.companyName.trim(),
    industry: result.industryLabel,
    activity: result.activityLabel,
    size,
    problem: result.central?.problem ?? result.presentation.problem,
    kind: result.presentation.kind,
    presentationMode: result.presentation.mode,
    action:
      result.presentation.mode === "catalogo"
        ? result.presentation.action
        : result.presentation.mode === "asistente"
          ? "asistente"
          : "",
    keyAnswers: keyAnswers(answers),
    samples: {
      items: voice.agenda.choices.map((choice) => choice.label),
      customers: voice.registro.rows.map((row) => row[0] ?? "").filter(Boolean).slice(0, 2),
    },
    modelPrompt: `${modelPromptFor(result.presentation.mode)} Enfoque: ${voice.hint}`,
  };
}

function modelPromptFor(mode: "catalogo" | "asistente"): string {
  if (mode === "asistente") {
    return "Rellena el asistente: visitorTitle para quien visita, businessChange y focus con cómo la IA entra en este sector y esta actividad, greeting, role y 3 o 4 starters que un visitante haría. Disclaimer de demostración. No toques menú, portada, pie ni fotos.";
  }
  return "Rellena el widget con el lenguaje de esta actividad: hotel reserva habitación, experiencia o plan no menciona habitaciones, restaurante reserva mesa, salud o servicios agenda cita, y campo, mina o tienda toma un pedido con fecha. visitorTitle como en el catálogo (Reserva aquí, Arma tu plan aquí), sin eslóganes ni el nombre de la empresa en el título. No uses «agenda tu visita» si el negocio no va al sitio del cliente. Si es tabla, las columnas son campos de esa operación porque el visitante agrega, edita y quita filas. Precios de demostración. No toques menú, portada, pie ni fotos.";
}

/** Entre 3 y 5 respuestas. Primero los hallazgos que más pesan. */
function keyAnswers(answers: RadarAnswers): { question: string; answer: string }[] {
  const result = buildRadarResult(answers);
  const questions = new Map(
    screensFor(answers).flatMap((screen) => (screen.kind === "question" ? [[screen.question.id, screen.question] as const] : [])),
  );
  const picked: { question: string; answer: string }[] = [];
  const seen = new Set<string>();
  const push = (questionId: string, onlyWeak: boolean) => {
    if (seen.has(questionId) || picked.length >= 5) return;
    const question = questions.get(questionId);
    const key = answers.choices[questionId];
    if (!question || !key) return;
    if (onlyWeak && key !== "A" && key !== "B" && key !== "E") return;
    const answer = key === "E" ? "No sé" : question.options["ABCD".indexOf(key)] ?? "";
    if (!answer) return;
    seen.add(questionId);
    picked.push({ question: question.text, answer });
  };

  for (const finding of result.findings) push(finding.questionId, false);
  for (const questionId of questions.keys()) push(questionId, true);
  if (picked.length < 3) {
    for (const questionId of questions.keys()) push(questionId, false);
  }
  return picked.slice(0, 5);
}
