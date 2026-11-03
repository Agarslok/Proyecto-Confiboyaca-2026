import { industryById } from "@/lib/radar/bank";
import { buildSite } from "@/lib/site/engine";
import type { SolutionHoleSpec } from "@/lib/site/solution-slot";
import type { RadarAnswers } from "@/lib/radar/types";
import type { SiteConfig } from "@/types/site";

/** Arma la página de muestra a partir del diagnóstico guardado (mismo criterio que el formulario). */
export function siteConfigFromRadar(
  answers: RadarAnswers,
  options?: { solution?: SolutionHoleSpec | null },
): SiteConfig | null {
  const industry = industryById(answers.industry);
  if (!industry) return null;
  const activity = industry.activities.find((item) => item.id === answers.activity);
  return buildSite({
    companyName: answers.companyName,
    sectorId: industry.template,
    activity: activity?.description ?? "",
    audience: "",
    goal: "",
    otherGoal: "",
    features: [],
    radar: answers,
    solution: options?.solution ?? undefined,
  });
}

/** /s/RAD-… y el QR: solo el spec ya guardado. No llama al modelo. */
export function siteConfigFromDiagnosis(record: { answers: RadarAnswers; solutionSpec: SolutionHoleSpec | null }): SiteConfig | null {
  return siteConfigFromRadar(record.answers, { solution: record.solutionSpec });
}
