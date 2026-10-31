/** Seguimiento comercial de cada empresa, de la encuesta al acompañamiento. */
export const LEAD_STATUSES = ["nuevo", "interesado", "contactado", "visita", "acompanamiento", "cerrado", "descartado"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  interesado: "Pidió que lo llamen",
  contactado: "Contactado",
  visita: "Visita agendada",
  acompanamiento: "En acompañamiento",
  cerrado: "Terminado",
  descartado: "Descartado",
};
