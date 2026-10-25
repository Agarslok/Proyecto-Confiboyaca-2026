import { buildDiagnosis } from "@/lib/diagnostic/engine";
import type { Answers, Diagnosis } from "@/types/domain";

export interface DiagnosisProvider {
  readonly id: "rules" | "gemini";
  generate(answers: Answers): Promise<Diagnosis>;
}

export class ProviderNotReadyError extends Error {
  constructor() {
    super("El proveedor Gemini no está conectado. Esta versión usa el motor de reglas local.");
    this.name = "ProviderNotReadyError";
  }
}

const rulesProvider: DiagnosisProvider = {
  id: "rules",
  async generate(answers) {
    return buildDiagnosis(answers, {
      diagnosisId: crypto.randomUUID(),
      companyId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
    });
  },
};

export function getDiagnosisProvider(): DiagnosisProvider {
  const selected = process.env.DIAGNOSIS_PROVIDER ?? "rules";
  if (selected === "rules" || selected === "") return rulesProvider;
  throw new ProviderNotReadyError();
}
