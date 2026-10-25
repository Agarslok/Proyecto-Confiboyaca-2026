import { getDiagnosisProvider } from "@/lib/diagnostic/provider";
import { getRepositories } from "@/lib/repositories";
import { parseAnswers } from "@/lib/validation/answers";
import type { DiagnosisResponse } from "@/types/domain";

export async function requestDiagnosis(input: unknown): Promise<DiagnosisResponse> {
  const parsed = parseAnswers(input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors };

  const diagnosis = await getDiagnosisProvider().generate(parsed.answers);
  const createdAt = new Date().toISOString();
  const repositories = getRepositories();

  await repositories.companies.save({
    id: diagnosis.companyId,
    name: diagnosis.companyName,
    industryId: diagnosis.industryId,
    size: parsed.answers.size,
    createdAt,
  });
  await repositories.sessions.save({
    id: diagnosis.sessionId,
    companyId: diagnosis.companyId,
    status: "completed",
    createdAt,
    expiresAt: null,
  });
  await repositories.diagnostics.save({
    id: diagnosis.id,
    companyId: diagnosis.companyId,
    sessionId: diagnosis.sessionId,
    industryId: diagnosis.industryId,
    answers: parsed.answers,
    diagnosis,
    createdAt,
  });

  return { ok: true, diagnosis };
}
