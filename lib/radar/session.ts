import { emptyRadarAnswers } from "@/lib/radar/engine";
import { GOAL_IDS, INDUSTRY_IDS, SIZE_IDS } from "@/lib/radar/types";
import type { IndustryId, OptionKey, RadarAnswers, RadarGoalId, SizeId } from "@/lib/radar/types";

const OPTION_KEYS: readonly string[] = ["A", "B", "C", "D", "E"];

export function isRadarAnswers(value: unknown): value is RadarAnswers {
  if (!value || typeof value !== "object") return false;
  const answers = value as RadarAnswers;
  return typeof answers.companyName === "string" && typeof answers.choices === "object" && Array.isArray(answers.goals);
}

/** Limpia lo que venga de localStorage: valores desconocidos se descartan. */
export function normalizeRadarAnswers(raw: unknown): RadarAnswers | undefined {
  if (!isRadarAnswers(raw)) return undefined;
  const answers = { ...emptyRadarAnswers(), ...raw };
  if (!(SIZE_IDS as readonly string[]).includes(answers.size)) answers.size = "" as SizeId | "";
  if (!(INDUSTRY_IDS as readonly string[]).includes(answers.industry)) answers.industry = "" as IndustryId | "";
  answers.choices = Object.fromEntries(
    Object.entries(answers.choices ?? {}).filter(([, key]) => OPTION_KEYS.includes(key)),
  ) as Record<string, OptionKey>;
  answers.goals = answers.goals.filter((goal): goal is RadarGoalId => (GOAL_IDS as readonly string[]).includes(goal)).slice(0, 2);
  answers.cursor = typeof answers.cursor === "number" && answers.cursor >= 0 ? Math.floor(answers.cursor) : 0;
  for (const key of ["city", "contactName", "contactLastName", "email", "phone"] as const) {
    answers[key] = typeof answers[key] === "string" ? answers[key].slice(0, 120) : "";
  }
  answers.consent = answers.consent === true;
  for (const key of ["recordId", "recordCode", "editToken"] as const) {
    if (typeof answers[key] !== "string") delete answers[key];
  }
  if (answers.followUpRequested !== true) delete answers.followUpRequested;
  return answers;
}
