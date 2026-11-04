import { industryById } from "@/lib/radar/bank";
import { assistantSketch } from "@/lib/radar/assistant";
import { solutionVoice, type SolutionVoice } from "@/lib/radar/solution-voice";
import type { SolutionAssistantSpec } from "@/lib/site/solution-slot";
import { isAssistantSolution } from "@/lib/site/solution-slot";
import type { IndustryId } from "@/lib/radar/types";
import type { SiteConfig } from "@/types/site";
import { crmCatalogFromVoice, type CrmCatalog } from "@/lib/assistant/crm-catalog";
import { companyNameHint } from "@/lib/assistant/company-context";
import { sectorOpsConfig } from "@/lib/ops/sector/registry";
import type { SectorOpsConfig } from "@/lib/ops/sector/types";

/** Arma voz, catálogo y configuración sectorial sin bifurcar el motor. */
export function sectorOpsPack(site: SiteConfig): {
  voice: SolutionVoice;
  assistant: SolutionAssistantSpec;
  companyName: string;
  industryId: IndustryId;
  activityId: string;
  crmCatalog: CrmCatalog;
  sector: SectorOpsConfig;
} {
  const industryId = (site.industryId || "turismo") as IndustryId;
  const activityId = site.activityId || (industryId === "turismo" ? "turismo-hotel" : "");
  const industry = industryById(industryId);
  const activity = industry?.activities.find((item) => item.id === activityId);
  const companyName = site.companyName.trim() || (industryId === "turismo" ? "Laguna Verde" : "El negocio");
  const voice = solutionVoice({ companyName, industryId, activityId });
  const crmCatalog = crmCatalogFromVoice(voice, industryId, activityId);
  const assistant =
    site.solution && isAssistantSolution(site.solution)
      ? site.solution
      : assistantSketch(companyName, industryId, activityId, site.radar?.activityLabel ?? activity?.label);

  return {
    voice,
    assistant,
    companyName,
    industryId,
    activityId,
    crmCatalog,
    sector: sectorOpsConfig({
      industryId,
      activityId,
      companyName,
      sectorLabel: crmCatalog.sectorLabel,
      templateId: site.templateId,
    }),
  };
}
