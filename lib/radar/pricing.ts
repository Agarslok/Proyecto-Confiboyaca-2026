import type { Effort } from "@/lib/radar/effort";

/* ============================================================================
   Costo interno del acompañamiento (solo panel de consultores).

   Los valores por defecto son de REFERENCIA para empezar a calcular; el
   equipo debe reemplazarlos por sus tarifas reales. En el panel se pueden
   cambiar para cada empresa sin tocar este archivo.
   ========================================================================== */

export interface Rates {
  /** Costo de una hora del equipo: salario + prestaciones ÷ horas trabajadas. */
  hourCost: number;
  /** Transporte ida y vuelta por visita al negocio. */
  transportPerVisit: number;
  /** Viáticos por visita (alimentación, peajes), si aplica. */
  perDiemPerVisit: number;
  /** Licencias o herramientas por mes (hojas en la nube, WhatsApp Business API…). */
  toolsPerMonth: number;
  /** Gastos administrativos sobre el costo directo. */
  overhead: number;
  /** Margen sobre el costo total. */
  margin: number;
}

export const REFERENCE_RATES: Rates = {
  hourCost: 45_000,
  transportPerVisit: 40_000,
  perDiemPerVisit: 15_000,
  toolsPerMonth: 0,
  overhead: 0.1,
  margin: 0.25,
};

export function costEstimate(effort: Effort, rates: Rates) {
  const team = effort.total * rates.hourCost;
  const travel = effort.visits * (rates.transportPerVisit + rates.perDiemPerVisit);
  const tools = effort.months * rates.toolsPerMonth;
  const direct = team + travel + tools;
  const overhead = direct * rates.overhead;
  const cost = direct + overhead;
  const price = cost * (1 + rates.margin);
  return { team, travel, tools, overhead, cost, price, perHour: price / Math.max(1, effort.total) };
}

export const money = (value: number) => `$${Math.round(value).toLocaleString("es-CO")}`;
