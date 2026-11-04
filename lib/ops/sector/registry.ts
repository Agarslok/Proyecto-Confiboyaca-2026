import type { IndustryId } from "@/lib/radar/types";
import type { TemplateId } from "@/types/site";
import { INDUSTRY_BRIEFS } from "@/lib/ops/sector/industry-briefs";
import { activityProfile, profileSectorLabel } from "@/lib/ops/sector/profile-builder";
import { genericDashboardCopy } from "@/lib/ops/sector/generic";
import type { SectorLexicon, SectorOpsConfig } from "@/lib/ops/sector/types";
import {
  lexiconForSector,
  sectorDashboardFromProfile,
} from "@/lib/ops/sector/sector-lexicon";
import { tourismDashboardBinding, tourismDashboardCopy, tourismLexicon, tourismStarters } from "@/lib/ops/sector/turismo";

export type SectorOpsInput = {
  industryId?: string;
  activityId?: string;
  companyName?: string;
  sectorLabel: string;
  /** Plantilla visual del sitio: define el ancla de navegación hacia las tres vistas. */
  templateId?: TemplateId;
};

/** Léxico del motor conversacional según industria y subactividad. */
export function lexiconForIndustry(industryId: string | undefined, activityId?: string): SectorLexicon {
  return lexiconForSector(industryId, activityId);
}

export function sectorOpsConfig(input: SectorOpsInput): SectorOpsConfig {
  const industryId = (input.industryId || "") as IndustryId | "";
  const activityId = input.activityId || (industryId === "turismo" ? "turismo-hotel" : "");
  const profile = industryId ? activityProfile(industryId, activityId) : activityProfile("otra", "otra-operacion");
  const brief = industryId ? INDUSTRY_BRIEFS[industryId] : INDUSTRY_BRIEFS.otra;
  const tourismHotel = industryId === "turismo" && activityId === "turismo-hotel";
  const sectorLabel = input.sectorLabel || profileSectorLabel(profile);
  const dash = sectorDashboardFromProfile(industryId || undefined, activityId);
  const anchorId = opsAnchorId(input.templateId, tourismHotel);

  return {
    industryId,
    activityId,
    sectorLabel,
    introLabel: tourismHotel
      ? "Asistente empresarial · demo turismo"
      : `Asistente empresarial · ${sectorLabel}`,
    anchorId,
    companyFallback: tourismHotel ? "tu hotel" : brief.companyFallback,
    composerPlaceholder: tourismHotel ? "Reserva, huéspedes, cupos…" : brief.composerHint,
    inputId: tourismHotel ? "tourism-assistant-input" : "ops-assistant-input",
    starters: tourismHotel ? tourismStarters : dash.starters.length ? dash.starters : profile.initialQuestions,
    lexicon: tourismHotel ? tourismLexicon : lexiconForSector(industryId, activityId),
    dashboard: tourismHotel ? tourismDashboardBinding : dash.dashboard,
    copy: tourismHotel ? tourismDashboardCopy : dash.copy ?? genericDashboardCopy,
    profile,
  };
}

function opsAnchorId(templateId: TemplateId | undefined, tourismHotel: boolean): string {
  if (tourismHotel) return "operacion-hotel";
  switch (templateId) {
    case "gastronomia":
      return "reservas";
    case "servicios":
      return "agenda";
    default:
      return "operacion";
  }
}
