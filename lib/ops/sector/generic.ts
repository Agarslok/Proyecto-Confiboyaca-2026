import type { DashboardCopy, SectorLexicon } from "@/lib/ops/sector/types";

/** Léxico neutro: solo etiquetas de las tablas del catálogo, sin palabras de hotel. */
export const genericLexicon: SectorLexicon = {
  tableHints: [],
  summary: /como va|como esta|resumen|estado/,
  sumWhen: /cantidad|suma|total|unidades/,
  arrival: /llega|viene/,
  primaryTable: /registro/,
  presenceTable: /^$/,
  stockTable: /existenc/,
  countWord: "registros",
  expectedWord: "unidades",
  presencePrefix: "Hoy",
  presenceEmpty: "Hoy no hay registros con fecha de hoy.",
  stockPrefix: "Existencias",
  stockSuffix: "disponibles",
};

export const genericDashboardCopy: DashboardCopy = {
  barsTitle: "Volumen por tipo",
  barsY: "Cantidad",
  barsEmpty: "Anota registros para ver este eje.",
  barsHint: "Eje X: tipo · Y: cantidad",
  pieTitle: "Mix de registros",
  pieEmpty: "Anota registros para ver el mix.",
  pieCenter: "registros",
  pieHint: "Cada porción es un tipo en la tabla principal",
  ordersTitle: "Por estado",
  ordersX: "Registros",
  trendTitle: "Tendencia",
  trendY: "Acumulado",
  filterLabel: "Periodo",
  recentTitle: "Actividad reciente",
};

export function genericStarters(sectorLabel: string): string[] {
  const name = sectorLabel.trim() || "el negocio";
  return [
    "Quiero anotar un registro de hoy",
    `¿Cuántos registros hay en ${name}?`,
    "¿Cómo va el resumen de hoy?",
  ];
}
