import type { DraftAnswers } from "@/types/domain";

export const STEP_COUNT = 4;

const FIELD_STEP: Record<string, number> = {
  companyName: 0,
  industryId: 0,
  size: 0,
  problems: 1,
  otherProblem: 1,
  goals: 2,
  primaryProblem: 3,
  currentMethod: 3,
  painFrequency: 3,
};

export function validateStep(step: number, draft: DraftAnswers): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 0) {
    if (draft.companyName.trim().length < 2) {
      errors.companyName = "Escriba el nombre de la empresa.";
    }
    if (!draft.industryId) errors.industryId = "Seleccione un sector.";
    if (!draft.size) errors.size = "Seleccione el tamaño aproximado.";
  }

  if (step === 1) {
    if (draft.problems.length === 0) {
      errors.problems = "Seleccione al menos un problema.";
    }
    if (draft.problems.includes("otro") && draft.otherProblem.trim().length < 8) {
      errors.otherProblem = "Describa el otro problema en una frase breve.";
    }
  }

  if (step === 2 && draft.goals.length === 0) {
    errors.goals = "Seleccione al menos un objetivo.";
  }

  if (step === 3) {
    const primary = draft.primaryProblem || (draft.problems.length === 1 ? draft.problems[0] : "");
    if (!primary || !draft.problems.includes(primary)) {
      errors.primaryProblem = "Seleccione el problema principal.";
    }
    if (!draft.currentMethod) errors.currentMethod = "Indique cómo se gestiona hoy.";
    if (!draft.painFrequency) errors.painFrequency = "Indique con qué frecuencia aparece.";
  }

  return errors;
}

export function firstInvalidStep(errors: Record<string, string>): number {
  const steps = Object.keys(errors).map((key) => FIELD_STEP[key] ?? 0);
  return steps.length ? Math.min(...steps) : 0;
}
