import { buildSite } from "@/lib/site/engine";
import type { SolutionHoleSpec } from "@/lib/site/solution-slot";
import { getSiteSnapshot, saveSiteConfig } from "@/lib/session/site-session";
import { parseSiteBrief } from "@/lib/validation/site";

/** Actualiza la página de muestra en este navegador tras guardar el hueco en el servidor. */
export function applySolutionToSiteSession(spec: SolutionHoleSpec): boolean {
  const parsed = parseSiteBrief(getSiteSnapshot().draft);
  if (!parsed.ok) return false;
  saveSiteConfig(buildSite({ ...parsed.brief, solution: spec }));
  return true;
}
