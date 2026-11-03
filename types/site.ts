import type { RadarAnswers, RadarResult } from "@/lib/radar/types";
import type { ConsultancyReport } from "@/lib/site/consultancy";
import type { SolutionHoleSpec } from "@/lib/site/solution-slot";
import type { SectorPhotos } from "@/lib/site/sector-gallery";
import type { TemplateCopy } from "@/lib/site/template-content";

export const SECTOR_IDS = [
  "turismo",
  "metalurgia",
  "agroindustria",
  "gastronomia",
  "retail",
  "servicios",
] as const;

export const TEMPLATE_IDS = [
  "turismo",
  "metalurgia",
  "agroindustria",
  "gastronomia",
  "retail",
  "servicios",
] as const;

export const GOAL_IDS = [
  "presentar",
  "clientes",
  "solicitudes",
  "productos",
  "reservas",
  "contactos",
  "portafolio",
  "otro",
] as const;

/** Opciones informativas en el formulario; no alteran la plantilla. */
export const FEATURE_IDS = [
  "presentacion",
  "catalogo",
  "galeria",
  "contacto",
  "testimonios",
  "faq",
  "cta",
  "personalizacion",
] as const;

export const AUDIENCE_IDS = ["personas", "empresas", "ambos"] as const;

export type SectorId = (typeof SECTOR_IDS)[number];
export type TemplateId = (typeof TEMPLATE_IDS)[number];
export type GoalId = (typeof GOAL_IDS)[number];
export type FeatureId = (typeof FEATURE_IDS)[number];
export type AudienceId = (typeof AUDIENCE_IDS)[number];

export interface SiteDraft {
  companyName: string;
  sectorId: SectorId | "";
  activity: string;
  audience: AudienceId | "";
  goal: GoalId | "";
  otherGoal: string;
  features: FeatureId[];
  /** Respuestas del Radar IA (rama prueba/radar-ia). Opcional: sin ellas, el flujo clásico sigue igual. */
  radar?: RadarAnswers;
}

export interface SiteConfig {
  id: string;
  companyName: string;
  sectorId: SectorId;
  templateId: TemplateId;
  sectorLabel: string;
  templateLabel: string;
  audienceLabel: string;
  goalLabel: string;
  activityNote: string;
  templateCopy: TemplateCopy;
  gaps: string[];
  consultancy: ConsultancyReport;
  /** Hueco bajo la portada: widget del catálogo, guía o asistente. Vacío hasta que el diagnóstico lo rellene. */
  solution?: SolutionHoleSpec;
  radar?: RadarResult;
  /** Industria y actividad del diagnóstico, para el asistente y las fotos. */
  industryId?: string;
  activityId?: string;
  /** Código RAD-… si el diagnóstico ya se guardó. */
  recordCode?: string;
  /** Fotos de public/media/sectores/<industria>/, según la industria del diagnóstico. */
  sectorPhotos?: SectorPhotos;
  diagnosis: {
    need: string;
    priority: string;
    included: string[];
    missing: string[];
    limitation: string;
  };
}

export interface SiteState {
  version: 1;
  step: number;
  maxStep: number;
  draft: SiteDraft;
  config: SiteConfig | null;
  storageWarning: string | null;
}
