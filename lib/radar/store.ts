import { INDUSTRIES, industryById } from "@/lib/radar/bank";
import { emptyRadarAnswers } from "@/lib/radar/engine";
import type { RadarAnswers } from "@/lib/radar/types";
import { getSiteSnapshot, patchSiteDraft } from "@/lib/session/site-session";
import type { SiteState } from "@/types/site";

/**
 * Las respuestas del radar viven dentro del borrador del sitio (confi.site.v1),
 * así /resultado y /sitio siguen leyendo el mismo estado que antes.
 * El nombre y la plantilla del sitio se derivan del radar.
 */
export function radarOf(state: SiteState): RadarAnswers {
  return state.draft.radar ?? { ...emptyRadarAnswers(), companyName: state.draft.companyName };
}

export function patchRadar(partial: Partial<RadarAnswers>): void {
  const current = radarOf(getSiteSnapshot());
  const radar: RadarAnswers = { ...current, ...partial };
  const industry = industryById(radar.industry);
  patchSiteDraft({
    radar,
    companyName: radar.companyName,
    sectorId: industry ? industry.template : "",
    activity: industry?.activities.find((item) => item.id === radar.activity)?.description ?? "",
  });
}

/** Empieza una encuesta nueva ya ubicada en un nicho (desde el catálogo). */
export function startNiche(activityId: string): boolean {
  const industry = INDUSTRIES.find((item) => item.activities.some((activity) => activity.id === activityId));
  if (!industry) return false;
  patchRadar({ ...emptyRadarAnswers(), industry: industry.id, activity: activityId, cursor: 0 });
  return true;
}
