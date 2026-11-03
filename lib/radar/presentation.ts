import { assistantFallback, genericAssistant, isReadyForAssistant } from "@/lib/radar/assistant";
import { DIMENSIONS, industryById } from "@/lib/radar/bank";
import { solutionVoice } from "@/lib/radar/solution-voice";
import { SOLUTIONS, solutionKind, type CentralProblem, type SolutionKind } from "@/lib/radar/solution";
import type { DimensionScore, Finding, IndustryId, LevelId, Vocab } from "@/lib/radar/types";
import type { SolutionActionId, SolutionAssistantSpec, SolutionHoleSpec, SolutionSectionSpec } from "@/lib/site/solution-slot";
import { parseSolutionHole } from "@/lib/validation/solution-hole";

/* ============================================================================
   Enfoque del hueco, sin inteligencia artificial.

   El diagnóstico ya calculó índice, dimensiones y problema central. Aquí solo
   se elige el widget del problema principal y, si hace falta, un segundo
   distinto (por ejemplo agenda junto a la lista). El asistente queda
   para cuando el radar está maduro.
   ========================================================================== */

const VISIT_ACTIVITIES = new Set([
  "alimentos-restaurante",
  "salud-ips",
  "salud-hogar",
  "salud-estetica",
  "salud-deporte",
]);

export type PresentationInput = {
  companyName: string;
  industryId: IndustryId | "";
  activityId: string;
  activityLabel: string;
  vocab: Vocab;
  central: CentralProblem;
  dimensions: DimensionScore[];
  findings: Finding[];
};

export type PresentationRequest = Omit<PresentationInput, "central"> & {
  central: CentralProblem | null;
  index?: number;
  level?: LevelId;
};

export type PresentationChoice =
  | {
      mode: "catalogo";
      action: SolutionActionId;
      kind: SolutionKind;
      problem: string;
      also: CentralProblem["also"];
      vocab: Vocab;
      fallback: SolutionSectionSpec;
      /** Segunda necesidad, solo si el widget es distinto al principal. */
      companion: { spec: SolutionSectionSpec; note: string } | null;
    }
  | {
      mode: "asistente";
      kind: SolutionKind;
      problem: string;
      also: CentralProblem["also"];
      vocab: Vocab;
      fallback: SolutionAssistantSpec;
    };

export function choosePresentation(input: PresentationRequest): PresentationChoice | null {
  if (
    input.index != null &&
    input.level &&
    isReadyForAssistant({ index: input.index, level: input.level, findings: input.findings })
  ) {
    return assistantChoice(input);
  }
  if (!input.central) return null;
  const resolved: PresentationInput = { ...input, central: input.central };
  const kind = resolved.central.kind;
  const action = chooseCatalogAction(resolved);
  const spec = catalogSpec(resolved, action);
  const parsed = parseSolutionHole(spec);
  const fallback =
    parsed.ok && parsed.spec.action !== "asistente" ? (parsed.spec as SolutionSectionSpec) : catalogSpec(resolved, action);
  const companion = companionFor(resolved, fallback.action);
  return {
    mode: "catalogo",
    action: fallback.action,
    kind,
    problem: resolved.central.problem,
    also: resolved.central.also,
    vocab: resolved.vocab,
    fallback,
    companion,
  };
}

function assistantChoice(input: PresentationRequest): PresentationChoice {
  const spec = assistantFallback({
    companyName: input.companyName,
    industryId: input.industryId,
    activityId: input.activityId,
    activityLabel: input.activityLabel,
    vocab: input.vocab,
    index: input.index,
    findings: input.findings,
  });
  const parsed = parseSolutionHole(spec);
  const fallback = parsed.ok && parsed.spec.action === "asistente" ? parsed.spec : genericAssistant(input.companyName);
  return {
    mode: "asistente",
    kind: input.central?.kind ?? "indicadores",
    problem: input.central?.problem || "El negocio ya puede usar IA en el día a día.",
    also: input.central?.also ?? [],
    vocab: input.vocab,
    fallback,
  };
}

/** Una cita, reserva o mesa. El resto de los registros siguen siendo una tabla. */
export function catalogAction(kind: SolutionKind, industryId: IndustryId | "", activityId: string): SolutionActionId {
  switch (kind) {
    case "inventario":
      return "inventario";
    case "solicitudes":
    case "clientes":
      return "solicitudes";
    case "merma":
      return "registro";
    case "registro":
      return isVisit(industryId, activityId) ? "agenda" : "registro";
    case "indicadores":
    case "respaldo":
      return "registro";
    default:
      return "registro";
  }
}

function isVisit(industryId: IndustryId | "", activityId: string): boolean {
  return industryId === "turismo" || VISIT_ACTIVITIES.has(activityId);
}

/** Atiende personas con hora, aunque el problema principal sea de datos o de stock. */
const RECEIVES_PEOPLE = new Set([
  ...VISIT_ACTIVITIES,
  "alimentos-catering",
  "salud-laboratorio",
  "comercio-posventa",
  "servicios-consultoria",
  "servicios-financieros",
  "servicios-software",
  "servicios-educacion",
  "servicios-comunicacion",
  "servicios-bpo",
  "construccion-diseno",
  "construccion-inmobiliaria",
  "construccion-mantenimiento",
  "madera-instalacion",
]);

function receivesPeople(industryId: IndustryId | "", activityId: string): boolean {
  return industryId === "turismo" || RECEIVES_PEOPLE.has(activityId);
}

/** Widget del kind sin convertir una cita en agenda. Así la lista no se pierde cuando ya se agenda. */
function baseAction(kind: SolutionKind): SolutionActionId {
  switch (kind) {
    case "inventario":
      return "inventario";
    case "solicitudes":
    case "clientes":
      return "solicitudes";
    default:
      return "registro";
  }
}

function companionNote(action: SolutionActionId): string {
  switch (action) {
    case "agenda":
      return "También atiende con cita, reserva o visita. Eso se agenda aparte de la lista.";
    case "inventario":
      return "Las existencias van aparte: qué hay, qué se agota y qué no se mueve.";
    case "solicitudes":
      return "Cada pedido o solicitud queda con número y estado, fuera de la lista principal.";
    default:
      return "Lo que entra o sale también queda escrito, con los campos de este negocio.";
  }
}

/** Una segunda pieza solo cuando el negocio tiene otra necesidad, con otro widget. */
export function companionAction(input: PresentationInput, primary: SolutionActionId): SolutionActionId | null {
  const candidates: SolutionActionId[] = [];
  const raw = baseAction(input.central.kind);
  if (primary === "agenda" && raw !== primary) candidates.push(raw);
  if (primary !== "agenda" && receivesPeople(input.industryId, input.activityId)) candidates.push("agenda");
  for (const item of input.central.also) {
    const action = catalogAction(item.kind, input.industryId, input.activityId);
    if (action !== primary) candidates.push(action);
  }
  return candidates.find((action) => action !== primary) ?? null;
}

function companionFor(input: PresentationInput, primary: SolutionActionId): { spec: SolutionSectionSpec; note: string } | null {
  const action = companionAction(input, primary);
  if (!action) return null;
  return { spec: catalogSpec(input, action), note: companionNote(action) };
}

/** Segunda pieza respecto al widget que ya se ve, aunque el radar ya esté en asistente. */
export function catalogSecond(
  input: Omit<PresentationInput, "central"> & { central: CentralProblem | null },
  shown: SolutionActionId,
): { spec: SolutionSectionSpec; note: string } | null {
  const central = input.central ?? {
    questionId: "datos-registro",
    kind: "registro",
    name: "",
    headline: "",
    problem: "",
    dimensionLabel: "",
    customerLead: "",
    changes: [],
    also: [],
    industryId: input.industryId,
  };
  return companionFor({ ...input, central }, shown);
}

/** Dos dimensiones críticas, casi empatadas, con kinds distintos. */
export function rivalKind(dimensions: DimensionScore[], findings: Finding[], kind: SolutionKind): SolutionKind | null {
  const lost = (dimension: DimensionScore) => (dimension.answered ? (100 - dimension.score) * dimension.weight : 0);
  const ranked = [...dimensions]
    .filter((dimension) => findings.some((finding) => finding.dimension === dimension.id))
    .sort((a, b) => lost(b) - lost(a));
  const [first, second] = ranked;
  if (!first || !second) return null;
  const top = lost(first);
  if (top <= 0 || lost(second) / top < 0.92) return null;
  const other = solutionKind(findings.find((finding) => finding.dimension === second.id)?.questionId ?? "");
  return other === kind ? null : other;
}

/** Acción del catálogo: si hay empate entre problemas, prioriza el widget del rival. */
export function chooseCatalogAction(input: PresentationInput): SolutionActionId {
  const rival = rivalKind(input.dimensions, input.findings, input.central.kind);
  const primary = catalogAction(input.central.kind, input.industryId, input.activityId);
  if (rival !== null) {
    const secondary = catalogAction(rival, input.industryId, input.activityId);
    if (secondary !== primary) return secondary;
  }
  return primary;
}

/** Respaldo escrito del paso 2 cuando Gemini no interviene o falla. */
export function catalogFallback(input: PresentationInput): SolutionSectionSpec {
  return catalogSpec(input, chooseCatalogAction(input));
}

const FALLBACK_CENTRAL: CentralProblem = {
  questionId: "datos-registro",
  kind: "registro",
  name: "Registro",
  headline: "Cada pedido queda registrado",
  problem: "",
  dimensionLabel: "Datos",
  customerLead: "",
  changes: [],
  also: [],
  industryId: "",
};

/** Contexto del diagnóstico para armar textos del catálogo en pantalla. */
export function presentationInputFromSite(site: {
  companyName?: string;
  industryId?: string;
  activityId?: string;
  radar?: {
    activityLabel?: string;
    central: CentralProblem | null;
    dimensions: PresentationInput["dimensions"];
    findings: PresentationInput["findings"];
  };
}): PresentationInput | null {
  if (!site.companyName?.trim() || !site.industryId || !site.radar) return null;
  const industry = industryById(site.industryId as IndustryId);
  const activity = industry?.activities.find((item) => item.id === site.activityId);
  const vocab = industry
    ? { ...industry.vocab, ...activity?.vocab }
    : { productos: "productos", clientes: "clientes", punto: "sede" };
  return {
    companyName: site.companyName,
    industryId: site.industryId as IndustryId,
    activityId: site.activityId ?? "",
    activityLabel: site.radar.activityLabel || activity?.label || "",
    vocab,
    central: site.radar.central ?? { ...FALLBACK_CENTRAL, industryId: site.industryId as IndustryId },
    dimensions: site.radar.dimensions,
    findings: site.radar.findings,
  };
}

/** Título y subtítulo del hueco: siempre el catálogo sectorial, aunque el spec guardado venga del modelo. */
export function withCatalogHeadline(
  spec: SolutionSectionSpec,
  site?: Parameters<typeof presentationInputFromSite>[0],
): SolutionSectionSpec {
  const input = site ? presentationInputFromSite(site) : null;
  if (!input) return spec;
  const fresh = catalogSpec(input, spec.action);
  return { ...spec, visitorTitle: fresh.visitorTitle, businessChange: fresh.businessChange };
}

function catalogSpec(input: PresentationInput, action: SolutionActionId): SolutionSectionSpec {
  const voice = solutionVoice(input);
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
  const table = action === "inventario" ? voice.inventario : action === "solicitudes" ? voice.solicitudes : voice.registro;
  return {
    action: action === "inventario" || action === "solicitudes" ? action : "registro",
    visitorTitle: clean(table.visitorTitle, 90),
    businessChange: clean(table.businessChange, 240),
    submitLabel: clean(table.submitLabel, 40),
    columns: table.columns.map((column) => clean(column, 40)),
    rows: table.rows.map((row) => row.map((cell) => clean(cell, 80))),
  };
}

/** Último hueco posible de catálogo antes de dejar la página en blanco. */
export function genericCatalog(kind: SolutionKind = "registro"): SolutionSectionSpec {
  const solution = SOLUTIONS[kind] ?? SOLUTIONS.registro;
  const action = catalogAction(kind, "alimentos", "alimentos-produccion");
  const spec: SolutionSectionSpec = {
    action,
    visitorTitle: clean(solution.headline, 90),
    businessChange: clean(solution.changes[0] ?? "Queda un registro claro desde la página.", 240),
    submitLabel: action === "agenda" ? "Confirmar" : "Guardar",
    columns: ["Concepto", "Detalle"],
    rows: [
      ["Ejemplo 1", "Demostración"],
      ["Ejemplo 2", "Demostración"],
    ],
  };
  const parsed = parseSolutionHole(spec);
  return parsed.ok && parsed.spec.action !== "asistente" ? (parsed.spec as SolutionSectionSpec) : spec;
}

const GENERIC_CELLS = new Set(["Producto A", "Producto B", "Servicio C", "Cliente Uno", "Cliente Dos", "Opción 1", "Opción 2"]);

/** Catálogo pobre: no valida, no tiene filas u opciones, o sigue usando los ejemplos genéricos de «otra». */
export function isPoorCatalogFallback(spec: SolutionSectionSpec): boolean {
  const parsed = parseSolutionHole(spec);
  if (!parsed.ok) return true;
  if (spec.action === "agenda") {
    const choices = spec.choices ?? [];
    return choices.length === 0 || choices.every((choice) => GENERIC_CELLS.has(choice.label.trim()));
  }
  const rows = spec.rows ?? [];
  if (rows.length === 0) return true;
  const cells = rows.flat().map((cell) => cell.trim());
  return cells.some((cell) => GENERIC_CELLS.has(cell)) || new Set(cells).size <= 1;
}

function clean(value: string, max: number): string {
  const text = value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Boceto del hueco para el catálogo sector × solución (sin diagnóstico real). */
export type SketchHoleId = SolutionActionId | "asistente";

const SKETCH_DIMENSIONS: DimensionScore[] = DIMENSIONS.map((dimension) => ({
  id: dimension.id,
  label: dimension.short,
  weight: dimension.weight,
  score: 80,
  answered: 4,
}));

function sketchKind(hole: SketchHoleId): SolutionKind {
  switch (hole) {
    case "inventario":
      return "inventario";
    case "solicitudes":
      return "solicitudes";
    case "agenda":
      return "registro";
    default:
      return "registro";
  }
}

export function sketchHole(
  input: {
    companyName: string;
    industryId: IndustryId;
    activityId: string;
    activityLabel: string;
    vocab: Vocab;
  },
  hole: SketchHoleId,
): SolutionHoleSpec {
  if (hole === "asistente") {
    const spec = assistantFallback({
      ...input,
      index: 88,
      findings: [],
    });
    const parsed = parseSolutionHole(spec);
    return parsed.ok && parsed.spec.action === "asistente" ? parsed.spec : genericAssistant(input.companyName);
  }

  const kind = sketchKind(hole);
  const solution = SOLUTIONS[kind];
  const central: CentralProblem = {
    questionId: "datos-registro",
    kind,
    name: solution.name,
    headline: solution.headline,
    problem: "Demostración del catálogo de soluciones para apoyo del consultor.",
    dimensionLabel: "Datos",
    customerLead: solution.lead(input.companyName),
    changes: solution.changes,
    also: [],
    industryId: input.industryId,
  };
  const full: PresentationInput = {
    ...input,
    central,
    dimensions: SKETCH_DIMENSIONS,
    findings: [],
  };

  const spec = catalogSpec(full, hole);
  const parsed = parseSolutionHole(spec);
  return parsed.ok ? parsed.spec : catalogSpec(full, "registro");
}
