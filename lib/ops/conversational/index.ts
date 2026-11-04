import { tryLocalOpsQuery, tryLocalOpsReply, type OpsRecordContext } from "@/lib/assistant/ops-capture";
import { lexiconForIndustry } from "@/lib/ops/sector/registry";

type HistoryTurn = { role: "user" | "assistant"; text: string };

/**
 * Motor conversacional local: primero ficha (anotar / corregir), después consulta.
 * Si devuelve null, el llamador sigue con Gemini.
 */
export function localOpsAnswer(input: {
  question: string;
  tables: OpsRecordContext[] | undefined;
  history: HistoryTurn[];
  industryId?: string;
  activityId?: string;
}): string | null {
  const captured = tryLocalOpsReply(input.question, input.tables, input.history);
  if (captured) return captured;
  return tryLocalOpsQuery(
    input.question,
    input.tables,
    lexiconForIndustry(input.industryId, input.activityId),
  );
}
