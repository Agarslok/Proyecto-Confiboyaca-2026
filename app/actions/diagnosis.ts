"use server";

import { ProviderNotReadyError } from "@/lib/diagnostic/provider";
import { requestDiagnosis } from "@/lib/diagnostic/service";
import { PersistenceNotReadyError } from "@/lib/repositories";
import type { DiagnosisResponse } from "@/types/domain";

export async function submitDiagnosis(input: unknown): Promise<DiagnosisResponse> {
  try {
    return await requestDiagnosis(input);
  } catch (error) {
    if (error instanceof ProviderNotReadyError || error instanceof PersistenceNotReadyError) {
      return { ok: false, formError: error.message };
    }
    return { ok: false, formError: "No se pudo generar el diagnóstico. Intente de nuevo." };
  }
}
