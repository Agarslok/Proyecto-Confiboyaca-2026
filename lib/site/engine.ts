import { buildRadarResult, activityOf } from "@/lib/radar/engine";
import { voiceCopy } from "@/lib/radar/site-voice";
import type { RadarAnswers } from "@/lib/radar/types";
import { audienceLabels, featureLabels, goalLabels, sectorLabels } from "@/lib/site/catalog";
import { buildConsultancy } from "@/lib/site/consultancy";
import { formatCompanyName } from "@/lib/site/format-company-name";
import { selectTemplate, templateLabel } from "@/lib/site/select-template";
import { contentForTemplate } from "@/lib/site/template-content";
import type { FeatureId, SectorId, SiteConfig, SiteDraft } from "@/types/site";

export interface SiteBrief {
  companyName: string;
  sectorId: SectorId;
  activity: string;
  audience: SiteDraft["audience"];
  goal: SiteDraft["goal"];
  otherGoal: string;
  features: FeatureId[];
  radar?: RadarAnswers;
}

function configId(companyName: string, sectorId: SectorId): string {
  const raw = `${companyName.trim()}|${sectorId}`;
  let hash = 0;
  for (const char of raw) hash = (Math.imul(31, hash) + char.charCodeAt(0)) | 0;
  return `pagina-${(hash >>> 0).toString(16)}`;
}

function labelOrPending(value: string, fallback: string): string {
  return value.trim() ? value.trim() : fallback;
}

function goalText(brief: SiteBrief): string {
  if (!brief.goal) return "No indicado (no altera la plantilla)";
  if (brief.goal === "otro" && brief.otherGoal.trim()) return brief.otherGoal.trim();
  return goalLabels[brief.goal];
}

function audienceText(brief: SiteBrief): string {
  if (!brief.audience) return "No indicado";
  return audienceLabels[brief.audience];
}

function gapsFor(brief: SiteBrief): string[] {
  const gaps: string[] = [];
  if (!brief.activity.trim()) gaps.push("No hay descripción de actividad. La plantilla usa textos sectoriales de ejemplo.");
  if (!brief.audience) gaps.push("No indicó público objetivo.");
  if (!brief.goal) gaps.push("No indicó objetivo de la página.");
  if (brief.features.length === 0) gaps.push("No marcó elementos deseados. La plantilla sectorial se muestra igual.");
  gaps.push("Imágenes, precios y testimonios son de demostración.");
  return gaps;
}

export function buildSite(brief: SiteBrief): SiteConfig {
  const companyName = formatCompanyName(brief.companyName);
  const sectorId = brief.sectorId;
  const templateId = selectTemplate(sectorId);
  let templateCopy = contentForTemplate(templateId, companyName);
  let extras: Record<string, unknown> = {};
  const { industry, activity } = brief.radar ? activityOf(brief.radar) : {};
  if (industry && activity) ({ copy: templateCopy, extras } = voiceCopy(templateCopy, companyName, industry, activity));
  const sectorLabel = sectorLabels[sectorId];
  const tplLabel = templateLabel(templateId);
  const gaps = gapsFor(brief);

  const informational: string[] = [
    `Plantilla: ${tplLabel} (elegida solo por el sector ${sectorLabel}).`,
    `Nombre en encabezado: ${companyName}.`,
  ];
  if (brief.activity.trim()) informational.push(`Actividad descrita (informativa): ${brief.activity.trim()}`);
  informational.push(`Público (informativo): ${audienceText(brief)}`);
  informational.push(`Objetivo (informativo): ${goalText(brief)}`);
  if (brief.features.length > 0) {
    informational.push(
      `Elementos marcados (informativos): ${brief.features.map((f) => featureLabels[f]).join(", ")}.`,
    );
  }

  return {
    ...extras,
    id: configId(companyName, sectorId),
    companyName,
    sectorId,
    templateId,
    sectorLabel,
    templateLabel: tplLabel,
    audienceLabel: audienceText(brief),
    goalLabel: goalText(brief),
    activityNote: labelOrPending(brief.activity, "Sin descripción"),
    templateCopy,
    gaps,
    consultancy: buildConsultancy({ ...brief, companyName }),
    radar: brief.radar ? buildRadarResult({ ...brief.radar, companyName }) : undefined,
    diagnosis: {
      need: `${companyName} recibirá la plantilla de ${sectorLabel.toLowerCase()}. La personalización visible es el nombre de la empresa; el sector fija el diseño.`,
      priority: `Regla del demo: sector → plantilla. Objetivo y características marcadas no cambian el resultado.`,
      included: informational,
      missing: gaps,
      limitation:
        "Consultoría simulada con reglas locales. La animación de IA es demostrativa; no publica en internet ni sustituye asesoría profesional.",
    },
  };
}

export function featureSummary(features: FeatureId[]): string[] {
  return features.map((feature) => featureLabels[feature]);
}
