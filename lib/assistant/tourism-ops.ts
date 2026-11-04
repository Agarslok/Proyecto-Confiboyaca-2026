import { industryById } from "@/lib/radar/bank";
import { assistantSketch } from "@/lib/radar/assistant";
import { solutionVoice, type SolutionVoice } from "@/lib/radar/solution-voice";
import type { SolutionActionId, SolutionAssistantSpec, SolutionSectionSpec } from "@/lib/site/solution-slot";
import type { IndustryId } from "@/lib/radar/types";
import type { SiteConfig } from "@/types/site";
import { isAssistantSolution } from "@/lib/site/solution-slot";
import { crmCatalogFromVoice, type CrmCatalog } from "@/lib/assistant/crm-catalog";

function clean(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trim()}…`;
}

export type TourismOpsSectionId = "reservas" | "estadias" | "cupos";

export type TourismOpsSection = {
  id: TourismOpsSectionId;
  label: string;
  title: string;
  lead: string;
  catalogAction: SolutionActionId;
};

export const TOURISM_OPS_SECTIONS: TourismOpsSection[] = [
  {
    id: "reservas",
    label: "Reservas",
    title: "Reservas y llegadas",
    lead: "Agenda habitaciones, huéspedes y fechas. El asistente captura lo que cuentas; los registros y el tablero se actualizan en la demo.",
    catalogAction: "agenda",
  },
  {
    id: "estadias",
    label: "Estadías",
    title: "Huéspedes en casa",
    lead: "Quién está hospedado, en qué habitación y cuántas noches. Misma conversación, otra vista de los datos.",
    catalogAction: "registro",
  },
  {
    id: "cupos",
    label: "Cupos",
    title: "Disponibilidad de habitaciones",
    lead: "Qué tipos de habitación quedan libres y cuándo conviene avisar. Consulta inventario sin abrir una hoja.",
    catalogAction: "inventario",
  },
];

export function tourismVoiceSpec(voice: SolutionVoice, action: SolutionActionId): SolutionSectionSpec {
  if (action === "agenda") {
    const agenda = voice.agenda;
    return {
      action,
      visitorTitle: clean(agenda.visitorTitle, 90),
      businessChange: clean(agenda.businessChange, 240),
      submitLabel: clean(agenda.submitLabel, 40),
      dateLabel: clean(agenda.dateLabel, 40),
      partyLabel: clean(agenda.partyLabel, 40),
      partyMin: agenda.partyMin,
      partyMax: agenda.partyMax,
      choices: agenda.choices.map((choice, index) => ({
        id: `opcion-${index + 1}`,
        label: clean(choice.label, 80),
        detail: clean(choice.detail, 120),
        price: choice.price,
      })),
    };
  }
  const table = action === "inventario" ? voice.inventario : voice.registro;
  return {
    action: action === "inventario" ? "inventario" : "registro",
    visitorTitle: clean(table.visitorTitle, 90),
    businessChange: clean(table.businessChange, 240),
    submitLabel: clean(table.submitLabel, 40),
    columns: table.columns.map((column) => clean(column, 40)),
    rows: table.rows.map((row) => row.map((cell) => clean(cell, 80))),
  };
}

export function tourismOpsPack(site: SiteConfig): {
  voice: SolutionVoice;
  assistant: SolutionAssistantSpec;
  companyName: string;
  industryId: IndustryId;
  activityId: string;
  /** Vista única: registro + tablero (demo general del hotel). */
  generalSpec: SolutionSectionSpec;
  crmCatalog: CrmCatalog;
} {
  const industryId = (site.industryId ?? "turismo") as IndustryId;
  const activityId = site.activityId ?? "turismo-hotel";
  const industry = industryById(industryId);
  const activity = industry?.activities.find((item) => item.id === activityId);
  const companyName = site.companyName.trim() || "Laguna Verde";
  const voice = solutionVoice({ companyName, industryId, activityId });
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
    generalSpec: tourismVoiceSpec(voice, "registro"),
    crmCatalog: crmCatalogFromVoice(voice, industryId),
  };
}
