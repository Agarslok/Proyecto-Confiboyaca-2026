import { INDUSTRIES, industryById } from "@/lib/radar/bank";
import { emptyRadarAnswers } from "@/lib/radar/engine";
import type { RadarAnswers } from "@/lib/radar/types";
import { buildSite } from "@/lib/site/engine";
import { getSiteSnapshot, patchSiteDraft, saveSiteConfig } from "@/lib/session/site-session";
import { parseSiteBrief } from "@/lib/validation/site";
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

/**
 * Carga en este navegador un diagnóstico guardado (desde el panel de consultores)
 * y regenera el resultado y la página web, para revisarlo con el cliente.
 */
export function loadSavedRadar(answers: RadarAnswers): boolean {
  patchRadar({ ...emptyRadarAnswers(), ...answers, cursor: 0 });
  const parsed = parseSiteBrief(getSiteSnapshot().draft);
  if (!parsed.ok) return false;
  saveSiteConfig(buildSite(parsed.brief));
  return true;
}
