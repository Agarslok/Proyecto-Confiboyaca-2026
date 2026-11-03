import { SAMPLES } from "@/lib/radar/bank";
import { ASSISTANT_DISCLAIMER } from "@/lib/radar/solution-limits";
import type { Finding, IndustryId, LevelId, Vocab } from "@/lib/radar/types";
import type { SolutionAssistantSpec } from "@/lib/site/solution-slot";

/* ============================================================================
   Negocios listos para IA: el hueco deja de ser un widget de registro y
   pasa a ser un asistente virtual con propuesta de sector.

   Umbral: riesgo bajo (índice ≥ 70) y ningún hallazgo crítico. No hace
   falta un 100: si ya no hay «errores» graves, el siguiente paso es IA.
   ========================================================================== */

/** Por debajo de 62 el motor ya marca riesgo moderado; 70 es «listo para usar». */
export const ASSISTANT_INDEX_MIN = 70;

export function isReadyForAssistant(input: {
  index: number;
  level: LevelId;
  findings: Finding[];
}): boolean {
  if (input.level !== "bajo") return false;
  if (input.index < ASSISTANT_INDEX_MIN) return false;
  return !input.findings.some((finding) => finding.severity === "critico");
}

export function assistantFallback(input: {
  companyName: string;
  industryId: IndustryId | "";
  activityId: string;
  activityLabel: string;
  vocab: Vocab;
  index?: number;
  findings: Finding[];
}): SolutionAssistantSpec {
  const name = clean(input.companyName, 60) || "el negocio";
  const activity = clean(input.activityLabel, 80) || "esta actividad";
  const polish = polishNote(input.findings);
  return {
    action: "asistente",
    visitorTitle: clean(`Habla con el asistente de ${name}`, 90),
    businessChange: clean(
      `El diagnóstico ya está en orden${input.index != null ? ` (${input.index}/100)` : ""}. El siguiente paso es un asistente de IA que atiende con el contexto de ${activity}.${polish}`,
      240,
    ),
    role: clean(`Asistente de ${name}`, 80),
    focus: clean(assistantFocus(input.industryId, input.activityId, input.vocab, activity), 240),
    greeting: clean(
      `Hola, soy el asistente de ${name}. Puedo ayudarte con ${input.vocab.productos} y con lo que suelen preguntar ${input.vocab.clientes} en ${input.vocab.punto}.`,
      240,
    ),
    starters: assistantStarters(input.industryId, input.activityId, input.vocab),
    disclaimer: ASSISTANT_DISCLAIMER,
  };
}

/** Último hueco posible si Gemini no rellena el asistente. */
export function genericAssistant(companyName = "el negocio"): SolutionAssistantSpec {
  const name = clean(companyName, 60) || "el negocio";
  return {
    action: "asistente",
    visitorTitle: clean(`Habla con el asistente de ${name}`, 90),
    businessChange: "El negocio ya puede usar IA en el día a día: un asistente responde con el contexto de esta operación.",
    role: clean(`Asistente de ${name}`, 80),
    focus: "La IA entra como un mostrador que nunca cierra: responde con los productos, horarios y datos que ya tiene el negocio.",
    greeting: clean(`Hola, soy el asistente de ${name}. Pregúntame lo que necesites de este negocio.`, 240),
    starters: [
      "¿Qué pueden hacer por mí hoy?",
      "¿Cómo usa este negocio la inteligencia artificial?",
      "¿Qué dato les ayuda a decidir mejor?",
    ],
    disclaimer: ASSISTANT_DISCLAIMER,
  };
}

export function assistantSketch(
  companyName: string,
  industryId: IndustryId,
  activityId: string,
  activityLabel?: string,
): SolutionAssistantSpec {
  const vocabByIndustry: Record<IndustryId, Vocab> = {
    moda: { productos: "prendas", clientes: "compradores", punto: "tienda" },
    alimentos: { productos: "productos", clientes: "clientes", punto: "local" },
    comercio: { productos: "productos", clientes: "clientes", punto: "tienda" },
    salud: { productos: "servicios", clientes: "pacientes", punto: "sede" },
    manufactura: { productos: "piezas", clientes: "clientes", punto: "planta" },
    transporte: { productos: "envíos", clientes: "clientes", punto: "bodega" },
    agro: { productos: "cosechas", clientes: "compradores", punto: "finca" },
    pecuaria: { productos: "animales y leche", clientes: "compradores", punto: "finca" },
    servicios: { productos: "servicios", clientes: "clientes", punto: "oficina" },
    turismo: { productos: "planes", clientes: "viajeros", punto: "sede" },
    mineria: { productos: "mineral", clientes: "compradores", punto: "frente" },
    construccion: { productos: "obras", clientes: "clientes", punto: "obra" },
    madera: { productos: "maderas y muebles", clientes: "clientes", punto: "taller" },
    otra: { productos: "productos o servicios", clientes: "clientes", punto: "sede" },
  };
  return assistantFallback({
    companyName,
    industryId,
    activityId,
    activityLabel: activityLabel || activityId.replace(/-/g, " "),
    vocab: vocabByIndustry[industryId] ?? vocabByIndustry.otra,
    index: 88,
    findings: [],
  });
}

export type AssistantChatContext = {
  companyName: string;
  industry: string;
  activity: string;
  industryId?: string;
  activityId?: string;
  size: string;
  index: number;
  level: string;
  findings: string[];
  items: string[];
  customers: string[];
  role: string;
  focus: string;
  productos: string;
  clientes: string;
  punto: string;
};

export function samplesFor(industryId: string | undefined): { items: string[]; customers: string[] } {
  const samples = SAMPLES[(industryId as IndustryId) || "otra"] ?? SAMPLES.otra;
  return { items: [...samples.items], customers: [...samples.customers] };
}

function assistantFocus(industryId: IndustryId | "", activityId: string, vocab: Vocab, activityLabel: string): string {
  switch (activityId) {
    case "madera-bosque":
      return `En aprovechamiento forestal la IA estima volúmenes de ${vocab.productos}, fechas de corte y qué lote sale primero, sin calcularlo a ojo.`;
    case "madera-aserradero":
      return `En el aserrío la IA ordena el dimensionado: qué tabla sale, cuánta merma queda y cuándo secar el siguiente lote.`;
    case "madera-carpinteria":
      return `En carpintería la IA arma cotizaciones a medida, avisa el material que falta y estima tiempos de taller con las medidas ya registradas.`;
    case "moda-textil":
      return `En textil la IA anticipa consumo de ${vocab.productos}, tintas y rollos según pedidos, para no parar el telar.`;
    case "moda-confeccion":
      return `En confección la IA ordena cortes, tallas y fechas de entrega a partir de lo que ya se anota en el taller.`;
    case "moda-compraventa":
    case "moda-online":
      return `En la tienda la IA sugiere qué ${vocab.productos} reponer, responde tallas y avisa de lo que no se mueve.`;
    case "alimentos-restaurante":
      return `En el restaurante la IA toma pedidos, sugiere platos del día y avisa cuando un insumo se acaba, con la carta de este local.`;
    case "alimentos-produccion":
      return `En producción la IA estima cuánto hornear, qué ${vocab.productos} se piden más y dónde se está perdiendo materia prima.`;
    case "turismo-hotel":
      return `En el hotel la IA responde disponibilidad, planes y horarios con el inventario de habitaciones de este negocio.`;
    default:
      break;
  }
  switch (industryId) {
    case "alimentos":
      return `En ${activityLabel} la IA estima demanda de ${vocab.productos}, merma del día y pedidos, para decidir con números y no de memoria.`;
    case "comercio":
      return `En el mostrador la IA consulta existencias de ${vocab.productos}, sugiere reposición y responde a ${vocab.clientes} sin buscar en el cuaderno.`;
    case "salud":
      return `En ${activityLabel} la IA orienta citas, preparación y preguntas frecuentes, sin inventar una historia clínica.`;
    case "manufactura":
      return `En planta la IA ordena lotes, avisos de insumo y tiempos de ${vocab.productos} a partir de lo que ya se registra.`;
    case "transporte":
      return `En logística la IA estima rutas, cupos y estados de ${vocab.productos} para no perder un envío en el chat.`;
    case "agro":
      return `En el campo la IA ayuda a decidir riego, cosecha y venta de ${vocab.productos} con los datos de la finca.`;
    case "pecuaria":
      return `En la finca la IA sigue lotes, alimentación y salidas de ${vocab.productos} para ver merma y fechas a tiempo.`;
    case "servicios":
      return `En ${activityLabel} la IA atiende solicitudes, agenda y preguntas repetidas con el portafolio de este negocio.`;
    case "turismo":
      return `En ${activityLabel} la IA responde cupos, planes y qué incluye cada experiencia, con el inventario de este ${vocab.punto}.`;
    case "mineria":
      return `En el frente la IA ordena turnos, producción y despachos de ${vocab.productos} a partir de los registros del día.`;
    case "construccion":
      return `En obra la IA sigue materiales, avances y pedidos de ${vocab.productos} para que nada se quede solo en WhatsApp.`;
    case "madera":
      return `En ${activityLabel} la IA ordena medidas, existencias y cotizaciones de ${vocab.productos}.`;
    case "moda":
      return `En ${activityLabel} la IA anticipa tallas, reposición y lo que más piden ${vocab.clientes}.`;
    default:
      return `La IA entra como un mostrador de ${activityLabel}: responde con ${vocab.productos}, atiende a ${vocab.clientes} y usa los datos que el negocio ya tiene.`;
  }
}

function assistantStarters(industryId: IndustryId | "", activityId: string, vocab: Vocab): string[] {
  switch (activityId) {
    case "madera-bosque":
      return [
        "¿Qué lote de trozas sale primero?",
        "¿Cuánta madera estiman para esta semana?",
        "¿Cómo ayuda la IA en el corte?",
      ];
    case "madera-carpinteria":
      return [
        "¿Me cotizan un mueble a medida?",
        "¿Qué maderas tienen disponibles?",
        "¿Cuánto tarda un encargo típico?",
      ];
    case "moda-textil":
      return [
        "¿Qué tela les queda para este pedido?",
        "¿Cuándo estaría listo el rollo?",
        "¿Cómo anticipan el consumo de insumos?",
      ];
    case "alimentos-restaurante":
      return [
        "¿Qué hay en la carta hoy?",
        "¿Puedo reservar una mesa?",
        "¿Tienen opciones para llevar?",
      ];
    case "turismo-hotel":
      return [
        "¿Hay habitación este fin de semana?",
        "¿Qué incluye el plan?",
        "¿A qué hora es el check-in?",
      ];
    default:
      break;
  }
  switch (industryId) {
    case "alimentos":
      return [
        `¿Qué ${vocab.productos} tienen hoy?`,
        "¿Puedo dejar un pedido para recoger?",
        "¿Qué se está pidiendo más esta semana?",
      ];
    case "comercio":
      return [
        `¿Tienen este ${vocab.productos} en ${vocab.punto}?`,
        "¿Qué se está agotando?",
        "¿Me ayudan a armar un pedido?",
      ];
    case "salud":
      return [
        "¿Cómo agendo una cita?",
        "¿Qué debo llevar a la consulta?",
        "¿En qué horarios atienden?",
      ];
    case "servicios":
      return [
        "¿Qué servicios ofrecen esta semana?",
        "¿Cómo dejo una solicitud?",
        "¿En cuánto tiempo responden?",
      ];
    default:
      return [
        `¿Qué ${vocab.productos} puedo pedir hoy?`,
        `¿Cómo atienden a ${vocab.clientes}?`,
        "¿Cómo usa este negocio la inteligencia artificial?",
      ];
  }
}

function polishNote(findings: Finding[]): string {
  const leftover = findings.filter((finding) => finding.severity !== "critico");
  if (!leftover.length) return "";
  return " Todavía hay detalles por pulir; el asistente ayuda a usar IA ahí.";
}

function clean(value: string, max: number): string {
  const text = value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
