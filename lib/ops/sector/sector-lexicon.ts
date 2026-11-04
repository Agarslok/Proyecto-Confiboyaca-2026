import { activityProfile } from "@/lib/ops/sector/profile-builder";
import type { SectorActivityProfile } from "@/lib/ops/sector/profile-types";
import { INDUSTRY_BRIEFS } from "@/lib/ops/sector/industry-briefs";
import type { DashboardBinding, DashboardCopy, SectorLexicon } from "@/lib/ops/sector/types";
import { genericDashboardCopy, genericLexicon } from "@/lib/ops/sector/generic";
import { tourismDashboardBinding, tourismDashboardCopy, tourismLexicon, tourismStarters } from "@/lib/ops/sector/turismo";
import type { IndustryId } from "@/lib/radar/types";

export function lexiconFromProfile(profile: SectorActivityProfile): SectorLexicon {
  const brief = INDUSTRY_BRIEFS[(profile.industryId as IndustryId) || "otra"];
  return {
    ...genericLexicon,
    tableHints: brief.tableHints,
    countWord: brief.countWord,
    presencePrefix: "Para hoy",
    presenceEmpty: `Hoy no hay registros en ${profile.entities.primary.label.toLowerCase()}.`,
    stockPrefix: profile.entities.secondary.label,
    stockSuffix: "disponibles",
  };
}

export function dashboardBindingFromProfile(profile: SectorActivityProfile): DashboardBinding {
  const brief = INDUSTRY_BRIEFS[(profile.industryId as IndustryId) || "otra"];
  const primaryId = profile.entities.primary.id;
  const stockId = profile.entities.secondary.id;
  return {
    primaryId,
    presenceId: primaryId,
    stockId,
    ordersId: stockId,
    whoKey: "who",
    whenKey: "when",
    countKey: "howMany",
    whatKey: "what",
    stockCountKey: "howMany",
    stockWhatKey: "what",
    ordersWhatKey: "what",
    presenceWhen: /hoy|today/i,
    kpis: {
      primary: { label: brief.dashboard.primary, hint: profile.entities.primary.label },
      sum: { label: brief.dashboard.sum, hint: "Suma de unidades en la tabla principal" },
      presence: { label: brief.dashboard.presence, hint: "Registros con fecha de hoy" },
      orders: { label: brief.dashboard.stock, hint: profile.entities.secondary.label },
    },
    stockHint: (free) => `${free} ${profile.entities.secondary.label.toLowerCase()} disponibles`,
    emptyOrders: `Sin ${profile.entities.secondary.label.toLowerCase()}`,
  };
}

export function dashboardCopyFromProfile(profile: SectorActivityProfile): DashboardCopy {
  const charts = profile.recommendedCharts;
  const brief = INDUSTRY_BRIEFS[(profile.industryId as IndustryId) || "otra"];
  return {
    ...genericDashboardCopy,
    barsTitle: charts[0] ?? genericDashboardCopy.barsTitle,
    pieTitle: charts[1] ?? genericDashboardCopy.pieTitle,
    ordersTitle: charts[2] ?? genericDashboardCopy.ordersTitle,
    trendTitle: charts[3] ?? genericDashboardCopy.trendTitle,
    pieCenter: brief.countWord,
  };
}

export function lexiconForSector(industryId: string | undefined, activityId?: string): SectorLexicon {
  if (industryId === "turismo" && (!activityId || activityId === "turismo-hotel")) {
    return tourismLexicon;
  }
  if (!industryId) return genericLexicon;
  return lexiconFromProfile(activityProfile(industryId as IndustryId, activityId || ""));
}

export function sectorDashboardFromProfile(
  industryId: string | undefined,
  activityId: string | undefined,
): { dashboard: DashboardBinding | null; copy: DashboardCopy; starters: string[] } {
  if (industryId === "turismo" && (!activityId || activityId === "turismo-hotel")) {
    return { dashboard: tourismDashboardBinding, copy: tourismDashboardCopy, starters: tourismStarters };
  }
  if (!industryId) {
    return { dashboard: null, copy: genericDashboardCopy, starters: [] };
  }
  const profile = activityProfile(industryId as IndustryId, activityId || "");
  return {
    dashboard: dashboardBindingFromProfile(profile),
    copy: dashboardCopyFromProfile(profile),
    starters: profile.initialQuestions,
  };
}
