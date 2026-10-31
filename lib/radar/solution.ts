import { DIMENSIONS } from "@/lib/radar/bank";
import type { DimensionScore, Finding, IndustryId } from "@/lib/radar/types";

/* ============================================================================
   Problema central → solución que muestra la página generada.
   El problema central sale de la dimensión donde la empresa pierde más
   puntos del índice, (100 − puntaje) × peso, y es su hallazgo más grave.
   Cada pregunta apunta a un tipo de solución; la página web la incorpora
   (por ejemplo, una panadería sin registros recibe encargos en línea que
   quedan guardados en una tabla).
   ========================================================================== */

export type SolutionKind = "registro" | "merma" | "clientes" | "solicitudes" | "inventario" | "indicadores" | "respaldo";

const BY_QUESTION: Record<string, SolutionKind> = {
  "datos-registro": "registro",
  "datos-historia": "registro",
  "tec-integracion": "registro",
  "agro-1": "registro",
  "manufactura-1": "registro",
  "mineria-1": "registro",
  "datos-lista": "clientes",
  "comercio-2": "clientes",
  "comercial-2": "clientes",
  "servicios-1": "clientes",
  "alimentos-1": "merma",
  "alimentos-2": "merma",
  "produccion-1": "merma",
  "produccion-2": "merma",
  "moda-2": "merma",
  "servicio-1": "solicitudes",
  "servicio-2": "solicitudes",
  "salud-1": "solicitudes",
  "salud-2": "solicitudes",
  "turismo-2": "solicitudes",
  "logistica-1": "solicitudes",
  "logistica-2": "solicitudes",
  "transporte-1": "solicitudes",
  "comercio-1": "inventario",
  "comercial-1": "inventario",
  "moda-1": "inventario",
  "construccion-2": "inventario",
  "tec-proteccion": "respaldo",
  "ia-reglas": "respaldo",
};

export const SOLUTIONS: Record<SolutionKind, { name: string; headline: string; lead: (company: string) => string; changes: string[] }> = {
  registro: {
    name: "Registro digital desde la página",
    headline: "Cada pedido queda registrado, sin cuadernos",
    lead: (company) => `Haz tu pedido aquí: queda registrado al instante y ${company} lo atiende sin perder ningún detalle.`,
    changes: ["Una fila por registro, siempre con las mismas columnas", "El cierre del mes sale de la tabla, no de contar cuadernos", "Desde el primer día empieza a existir un histórico"],
  },
  merma: {
    name: "Producción según lo que se vende",
    headline: "Producir lo justo: tablero de producción y sobrantes",
    lead: (company) => `${company} prepara cada día según lo que realmente se vende: siempre fresco y sin desperdicio.`,
    changes: ["Lo producido y lo vendido se registran por producto y por día", "La merma pasa a ser un número que se puede bajar", "La sugerencia de producción sale del promedio de cada día de la semana"],
  },
  clientes: {
    name: "Base de clientes con autorización",
    headline: "Conocer a cada cliente y lograr que vuelva",
    lead: (company) => `Únete a los clientes frecuentes de ${company}: recibe novedades y beneficios por tus compras.`,
    changes: ["Cada cliente queda con un código único, sin duplicados", "Autorización de datos según la Ley 1581 de 2012", "Se puede medir quién vuelve a comprar"],
  },
  solicitudes: {
    name: "Solicitudes con número y estado",
    headline: "Ninguna solicitud se pierde en el WhatsApp",
    lead: (company) => `Escríbenos desde aquí: cada solicitud queda con número y estado, y ${company} te avisa cuando esté lista.`,
    changes: ["Cada solicitud, reserva o pedido tiene un número y un estado", "Se mide el tiempo de respuesta", "Se ven los problemas que más se repiten"],
  },
  inventario: {
    name: "Inventario que se descuenta con cada venta",
    headline: "Saber qué hay, qué se agota y qué no rota",
    lead: (company) => `Consulta la disponibilidad en línea: ${company} actualiza su inventario con cada venta.`,
    changes: ["Las existencias bajan solas con cada venta", "Alertas cuando un producto llega al mínimo", "Se ve qué productos no rotan"],
  },
  indicadores: {
    name: "Tablero de indicadores",
    headline: "Decidir mirando cifras, no por intuición",
    lead: (company) => `${company} mide cada mes lo que importa para atenderte mejor.`,
    changes: ["3 a 5 indicadores con meta", "Se actualizan solos con los registros", "Se revisan en una reunión fija"],
  },
  respaldo: {
    name: "Datos protegidos y con copia",
    headline: "Que un daño o un robo no borre la historia del negocio",
    lead: (company) => `Tus datos están protegidos: ${company} los guarda con copia de seguridad y acceso controlado.`,
    changes: ["Copias automáticas que se prueban", "Una cuenta por persona y verificación en dos pasos", "Reglas claras sobre qué información va a herramientas de IA"],
  },
};

/** El registro digital se cuenta distinto en cada industria: pedido, cita, reserva, cosecha, producción… */
const RECORD_BY_INDUSTRY: Partial<Record<IndustryId, { headline: string; lead: (company: string) => string }>> = {
  mineria: {
    headline: "La producción de cada frente queda registrada, sin cuadernos",
    lead: (company) => `${company} registra la producción y la calidad de cada frente: fichas técnicas y despachos respaldados con datos.`,
  },
  agro: {
    headline: "Cada cosecha queda registrada por lote",
    lead: (company) => `${company} registra cada lote: origen, cosecha y calidad trazables para sus compradores.`,
  },
  salud: {
    headline: "Cada cita queda registrada, sin agenda de papel",
    lead: (company) => `Agenda tu cita aquí: queda registrada y ${company} te la recuerda antes de tu atención.`,
  },
  turismo: {
    headline: "Cada reserva queda registrada con su canal",
    lead: (company) => `Reserva directo aquí: tu reserva queda confirmada y ${company} te atiende sin intermediarios.`,
  },
  construccion: {
    headline: "Cada material queda registrado por obra",
    lead: (company) => `${company} controla los materiales y el avance de cada obra para entregar a tiempo y sin sobrecostos.`,
  },
  transporte: {
    headline: "Cada envío queda registrado desde que se programa",
    lead: (company) => `Programa tu envío aquí: queda registrado y ${company} te informa cada paso.`,
  },
};

/** Titular de la solución, con el registro contado en palabras de la industria. */
export function solutionHeadline(kind: SolutionKind, industryId: IndustryId | ""): string {
  const record = kind === "registro" && industryId ? RECORD_BY_INDUSTRY[industryId] : undefined;
  return record?.headline ?? SOLUTIONS[kind].headline;
}

export interface CentralProblem {
  questionId: string;
  kind: SolutionKind;
  name: string;
  headline: string;
  problem: string;
  dimensionLabel: string;
  customerLead: string;
  changes: string[];
  also: { kind: SolutionKind; name: string; problem: string }[];
  industryId: IndustryId | "";
}

export function solutionKind(questionId: string): SolutionKind {
  return BY_QUESTION[questionId] ?? "indicadores";
}

export function centralProblem(
  findings: Finding[],
  dimensions: DimensionScore[],
  company: string,
  industryId: IndustryId | "",
): CentralProblem | null {
  const lost = (dimension: DimensionScore) => (dimension.answered ? (100 - dimension.score) * dimension.weight : 0);
  const ranked = [...dimensions].sort((a, b) => lost(b) - lost(a));
  const weakest = ranked.find((dimension) => findings.some((finding) => finding.dimension === dimension.id));
  const main = findings.find((finding) => finding.dimension === weakest?.id);
  if (!main) return null;
  const kind = solutionKind(main.questionId);
  const solution = SOLUTIONS[kind];
  const seen = new Set<SolutionKind>([kind]);
  const also: CentralProblem["also"] = [];
  /* Primero lo propio del nicho (dimensión Negocio), luego el resto por gravedad. */
  const others = findings.filter((item) => item !== main);
  const ordered = [...others.filter((item) => item.dimension === "negocio"), ...others.filter((item) => item.dimension !== "negocio")];
  for (const finding of ordered) {
    const other = solutionKind(finding.questionId);
    if (seen.has(other)) continue;
    seen.add(other);
    also.push({ kind: other, name: SOLUTIONS[other].name, problem: finding.text });
    if (also.length === 2) break;
  }
  const record = kind === "registro" && industryId ? RECORD_BY_INDUSTRY[industryId] : undefined;
  return {
    questionId: main.questionId,
    kind,
    name: solution.name,
    headline: record?.headline ?? solution.headline,
    problem: main.text,
    dimensionLabel: DIMENSIONS.find((dimension) => dimension.id === main.dimension)?.label ?? "",
    customerLead: (record?.lead ?? solution.lead)(company),
    changes: solution.changes,
    also,
    industryId,
  };
}
