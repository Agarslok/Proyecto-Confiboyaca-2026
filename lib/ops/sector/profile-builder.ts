import { INDUSTRIES, industryById } from "@/lib/radar/bank";
import { INDUSTRY_BRIEFS, SHARED_VALIDATION_RULES } from "@/lib/ops/sector/industry-briefs";
import { LINK_TEMPLATES } from "@/lib/ops/sector/link-templates";
import type { SectorActivityProfile } from "@/lib/ops/sector/profile-types";
import type { IndustryId, Vocab } from "@/lib/radar/types";

function mergeVocab(industryId: IndustryId, activityVocab?: Partial<Vocab>): Vocab {
  const industry = industryById(industryId);
  const base = industry?.vocab ?? { productos: "productos", clientes: "clientes", punto: "sede" };
  return { ...base, ...activityVocab };
}

function shortProductPhrase(productos: string): string {
  const p = productos.trim();
  if (p.length <= 14 && !/\s+y\s+/.test(p)) return p;
  return "";
}

function shortCaptureStarter(brief: (typeof INDUSTRY_BRIEFS)[IndustryId], vocab: Vocab, linkId: SectorActivityProfile["link"]): string {
  const snippet = shortProductPhrase(vocab.productos);

  if (linkId === "servicio") return "Agenda cita para mañana";
  if (linkId === "logistica") return "Programa despacho para mañana";
  if (linkId === "comercial") {
    return snippet ? `Anota venta de ${snippet} para mañana` : "Anota venta para mañana";
  }

  if (brief.captureVerb.includes("movimiento")) return "Registra extracción de hoy";
  if (/venta|cosecha|lote/i.test(brief.captureVerb)) return "Registra una venta para mañana";
  if (brief.captureVerb.startsWith("Agenda")) return "Agenda cita para mañana";
  if (snippet) return `Registra ${snippet} para mañana`;
  return "Registra producción para mañana";
}

function polishAssistantStarters(
  capture: string,
  query: string,
  stock: string,
  vocab: Vocab,
): [string, string, string] {
  const queryShort = query.replace(/\s+de producción/i, "");
  const stockShort =
    vocab.productos.length > 16 || vocab.productos.includes(" y ") ? "¿Qué hay en existencias?" : stock;
  return [capture, queryShort, stockShort];
}

function businessContext(industryLabel: string, activityDescription: string, brief: (typeof INDUSTRY_BRIEFS)[IndustryId]): string {
  return `${brief.contextLead} En ${industryLabel}: ${activityDescription}`;
}

function assistantRole(brief: (typeof INDUSTRY_BRIEFS)[IndustryId], activityLabel: string): string {
  return `Auxiliar de gestión, ${brief.roleSuffix}, enfocado en ${activityLabel.toLowerCase()}. Orienta qué anotar y cómo hacerlo en las tablas operativas.`;
}

function guidanceForModel(profile: Omit<SectorActivityProfile, "guidanceForModel">): string {
  return [
    `Rol: ${profile.assistantRole}`,
    `Operaciones: ${profile.operationTypes.slice(0, 4).join("; ")}.`,
    `Tablas: ${profile.entities.primary.label} (${profile.entities.primary.fields.join(", ")}); ${profile.entities.secondary.label}.`,
    `Consultas típicas: ${profile.frequentQueries.slice(0, 3).join(" · ")}.`,
    "No preguntes solo «¿cuánto vendiste?»; usa el vocabulario del sector.",
  ].join(" ");
}

function mainActivitiesFor(link: (typeof LINK_TEMPLATES)[keyof typeof LINK_TEMPLATES], brief: (typeof INDUSTRY_BRIEFS)[IndustryId]): string[] {
  return [...link.operationTypes.slice(0, 2), ...brief.mainActivities.slice(0, 3)];
}

export function activityProfile(industryId: IndustryId, activityId: string): SectorActivityProfile {
  const industry = industryById(industryId) ?? industryById("otra")!;
  const activity = industry.activities.find((item) => item.id === activityId) ?? industry.activities[0]!;
  const brief = INDUSTRY_BRIEFS[industry.id];
  const link = LINK_TEMPLATES[activity.link];
  const vocab = mergeVocab(industry.id, activity.vocab);
  const [, queryStarter, stockStarter] = link.starters(vocab, activity.label);
  const capture = shortCaptureStarter(brief, vocab, activity.link);
  const starters = polishAssistantStarters(capture, queryStarter, stockStarter, vocab);
  const primary = link.primaryLabel;
  const frequent = link.frequentQueries(primary);
  const hotel = industry.id === "turismo" && activity.id === "turismo-hotel";

  const hotelFields = ["Huésped", "Llegada", "Cantidad de huéspedes", "Habitación"];
  const hotelStockFields = ["Responsable", "Para", "Libres", "Habitación"];

  const base: Omit<SectorActivityProfile, "guidanceForModel"> = {
    industryId: industry.id,
    activityId: activity.id,
    industryLabel: industry.label,
    activityLabel: activity.label,
    link: activity.link,
    businessContext: businessContext(industry.label, activity.description, brief),
    assistantRole: assistantRole(brief, activity.label),
    mainActivities: mainActivitiesFor(link, brief),
    initialQuestions: starters,
    followUpQuestions: link.followUps,
    operationTypes: link.operationTypes,
    entities: {
      primary: {
        id: hotel ? "reservas" : "registro",
        label: hotel ? "Reservas" : link.primaryLabel,
        description: link.primaryDesc,
        fields: hotel ? hotelFields : [link.whoLabel, link.whenLabel, link.howManyLabel, link.whatLabel],
      },
      secondary: {
        id: hotel ? "cupos" : "existencias",
        label: hotel ? "Habitaciones" : link.secondaryLabel,
        description: link.secondaryDesc,
        fields: hotel ? hotelStockFields : [link.whoLabel, link.whenLabel, link.howManyLabel, link.whatLabel],
      },
    },
    validationRules: SHARED_VALIDATION_RULES,
    dashboardIndicators: [
      brief.dashboard.primary,
      brief.dashboard.sum,
      brief.dashboard.presence,
      brief.dashboard.stock,
    ],
    recommendedCharts: link.charts,
    frequentQueries: frequent,
    conversationExamples: link.examples(primary, vocab),
  };

  return { ...base, guidanceForModel: guidanceForModel(base) };
}

export function allActivityProfiles(): SectorActivityProfile[] {
  return INDUSTRIES.flatMap((industry) => industry.activities.map((activity) => activityProfile(industry.id, activity.id)));
}

export function profileSectorLabel(profile: SectorActivityProfile): string {
  return `${profile.industryLabel} · ${profile.activityLabel}`;
}

export function compactGuidanceForModel(text: string, maxLen = 520): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}

export function compactProfileGuidance(profile: SectorActivityProfile, maxLen = 520): string {
  return compactGuidanceForModel(profile.guidanceForModel, maxLen);
}
