import type { IndustryId } from "@/lib/radar/types";
import type { TemplateId } from "@/types/site";
import type { SectorActivityProfile } from "@/lib/ops/sector/profile-types";

/** Pista para elegir una tabla cuando el mensaje no dice su nombre. */
export type TableHint = {
  message: RegExp;
  table: RegExp;
};

/**
 * Vocabulario de consulta de un sector.
 * El motor conversacional no nombra reservas ni habitaciones: lee esto.
 */
export type SectorLexicon = {
  tableHints: TableHint[];
  summary: RegExp;
  /** Si aparece junto a «cuántos», suma la columna numérica en vez de contar filas. */
  sumWhen: RegExp;
  /** Preguntas de llegada sin nombrar la tabla: caen en la tabla primaria. */
  arrival: RegExp;
  primaryTable: RegExp;
  presenceTable: RegExp;
  stockTable: RegExp;
  countWord: string;
  expectedWord: string;
  presencePrefix: string;
  presenceEmpty: string;
  stockPrefix: string;
  stockSuffix: string;
};

export type DashboardKpiCopy = {
  label: string;
  hint: string;
};

/** Qué entidad y qué campos alimentan cada indicador. Null = calcular por slots. */
export type DashboardBinding = {
  primaryId: string;
  presenceId: string;
  stockId: string;
  ordersId: string;
  whoKey: string;
  whenKey: string;
  countKey: string;
  whatKey: string;
  stockCountKey: string;
  stockWhatKey: string;
  ordersWhatKey: string;
  presenceWhen: RegExp;
  kpis: {
    primary: DashboardKpiCopy;
    sum: DashboardKpiCopy;
    presence: DashboardKpiCopy;
    orders: DashboardKpiCopy;
  };
  stockHint: (free: number) => string;
  emptyOrders: string;
};

export type DashboardCopy = {
  barsTitle: string;
  barsY: string;
  barsEmpty: string;
  barsHint: string;
  pieTitle: string;
  pieEmpty: string;
  pieCenter: string;
  pieHint: string;
  ordersTitle: string;
  ordersX: string;
  trendTitle: string;
  trendY: string;
  filterLabel: string;
  recentTitle: string;
};

/** Configuración de una industria. Agregar un sector = un objeto de este tipo, no un motor nuevo. */
export type SectorOpsConfig = {
  industryId: IndustryId | "";
  activityId: string;
  sectorLabel: string;
  introLabel: string;
  anchorId: string;
  companyFallback: string;
  composerPlaceholder: string;
  inputId: string;
  starters: string[];
  lexicon: SectorLexicon;
  dashboard: DashboardBinding | null;
  copy: DashboardCopy;
  profile: SectorActivityProfile;
};
