/** Empareja lo que escribe el visitante con una opción de la demostración. Sin modelo. */

export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchOption<T extends { id: string; label: string }>(text: string, options: T[]): T | null {
  const needle = fold(text);
  if (!needle) return null;
  const exact = options.find((item) => fold(item.label) === needle);
  if (exact) return exact;
  const partial = options.filter((item) => {
    const label = fold(item.label);
    return label.includes(needle) || needle.includes(label);
  });
  return partial.length === 1 ? partial[0]! : null;
}

/** Parte una respuesta en tantas celdas como columnas, separadas por comas. */
export function parseCommaFields(text: string, count: number): string[] | null {
  const parts = text.split(",").map((part) => part.trim());
  if (parts.length !== count) return null;
  if (parts.some((part) => part.length === 0 || part.length > 80)) return null;
  return parts;
}

const DIGITS = /cantidad|cupo|unidades|m[ií]nimo|precio|total|kilos|tonelada|bulto|piezas|existenc|noches|libres/i;
const CODE = /n[uú]mero|numero|pedido|orden|solicitud|c[oó]digo/i;

export function valueMatchesColumn(column: string, value: string): boolean {
  if (CODE.test(column)) return /^\d+([.,]\d+)?$/.test(value) || /^[A-Za-z]{1,8}-?\d+$/.test(value);
  if (DIGITS.test(column)) return /^\d+([.,]\d+)?$/.test(value);
  return true;
}

export function parseParty(text: string, min: number, max: number): number | null {
  const match = text.match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

export function isConfirm(text: string): boolean {
  return /^(confirmar|confirmo|si|ok|dale|listo)$/.test(fold(text));
}

export function isRestart(text: string): boolean {
  return /^(cambiar|corregir|no|otra|empezar|cancelar)$/.test(fold(text));
}

import type { SolutionActionId } from "@/lib/site/solution-slot";

/** Encabezado del hueco: deja claro qué hace el chat de demostración. */
export function solutionSlotKicker(action: SolutionActionId): string {
  switch (action) {
    case "agenda":
      return "Chat para agendar con un asistente";
    case "inventario":
      return "Chat para consultar inventario con un asistente";
    case "solicitudes":
      return "Chat para atender solicitudes con un asistente";
    default:
      return "Chat para llevar el registro con un asistente";
  }
}

export function assistantHello(kind: string, company: string): string {
  const place = company.trim() || "tu empresa";
  return `Hola, soy tu asistente de ${kind} en ${place}. Te hago preguntas concretas y lo que acordemos queda en la lista de al lado.`;
}

function firstSentence(text: string, max = 140): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  const sentence = (match?.[0] ?? trimmed).trim();
  if (sentence.length <= max) return sentence;
  return `${sentence.slice(0, max - 1).trim()}…`;
}

/** Una frase de contexto del negocio antes de la primera pregunta (agenda). */
export function demoContextAgenda(businessChange: string, listed: string): string {
  const hint = firstSentence(businessChange);
  if (hint) return `${hint} Te voy guiando en el chat y lo ves en ${listed}.`;
  return `Te voy guiando en el chat y lo ves en ${listed}.`;
}

/** Una frase de contexto antes de capturar columnas (registro, inventario, solicitudes). */
export function demoContextTable(action: SolutionActionId, businessChange: string, columns: string[]): string {
  const hint = firstSentence(businessChange);
  const fields = columns.slice(0, 4).join(", ");
  const tail = columns.length > 4 ? "…" : "";
  const task =
    action === "inventario"
      ? "consultar existencias"
      : action === "solicitudes"
        ? "atender cada solicitud"
        : "anotar cada movimiento";
  if (hint) return `${hint} Para ${task}, capturo ${fields}${tail} contigo, campo por campo.`;
  return `Para ${task}, capturo ${fields}${tail} contigo, campo por campo, y queda en la tabla.`;
}

export function agendaQuestion(submitLabel: string): string {
  const label = fold(submitLabel);
  if (label.includes("cita")) return "¿Qué tipo de cita necesitas? Elige una opción o escríbela.";
  if (label.includes("reunion")) return "¿Qué reunión quieren agendar? Elige una opción o escríbela.";
  if (label.includes("toma")) return "¿Qué toma o estudio quieren agendar?";
  if (label.includes("visita")) return "¿Qué visita quieren programar?";
  if (label.includes("pedido")) return "¿Qué tipo de pedido es? Elige del menú o escríbelo.";
  if (label.includes("mesa")) return "¿Qué mesa o zona quieren reservar? Elige una opción o escríbela.";
  if (label.includes("entrada")) return "¿Qué entrada o pase quieren?";
  if (label.includes("plan")) return "¿Qué plan o salida les interesa?";
  if (label.includes("reserva")) return "¿Qué reserva quieren hacer? Elige una opción o escríbela.";
  return "¿Qué quieren reservar? Elige una opción o escríbela.";
}

export function agendaDatePrompt(choiceLabel: string, choiceDetail: string): string {
  const detail = choiceDetail.trim();
  const lead = detail ? `${choiceLabel} (${detail}).` : `${choiceLabel}.`;
  return `${lead} ¿Para qué día la dejamos? Elige una fecha de la lista o escríbela.`;
}

export function agendaPartyPrompt(partyLabel: string, min: number, max: number): string {
  const word = partyLabel.trim().toLowerCase();
  const key = fold(partyLabel);
  if (/comensal|persona|cliente/.test(key)) {
    return `¿Cuántas ${word} vienen? Escribe un número entre ${min} y ${max}.`;
  }
  if (/huesped|viajero|pasajero/.test(key)) {
    return `¿Cuántos ${word} van en esta reserva? Entre ${min} y ${max}.`;
  }
  if (/noches|dias|tonelada|bulto|unidad|pieza|cupo/.test(key)) {
    const feminine = /a$|as$|es$/.test(word) || /noches|unidades|piezas|citas|visitas|entradas/.test(word);
    return `¿${feminine ? "Cuántas" : "Cuántos"} ${word}? Entre ${min} y ${max}.`;
  }
  const feminine = /(as|a)$/.test(word) || /personas|toneladas|unidades|piezas|citas|visitas|entradas/.test(word);
  return `¿${feminine ? "Cuántas" : "Cuántos"} ${word}? Escribe un número entre ${min} y ${max}.`;
}

export function agendaGuestPrompt(submitLabel: string, partyLabel: string): string {
  const label = fold(submitLabel);
  const party = fold(partyLabel);
  if (label.includes("mesa") || party.includes("comensal")) {
    return "¿A nombre de quién queda la mesa? (quien reserva o paga)";
  }
  if (label.includes("plan") || party.includes("viajero")) {
    return "¿A nombre de quién va el plan? (contacto principal)";
  }
  if (label.includes("cita") || label.includes("toma") || party.includes("paciente")) {
    return "¿A nombre de quién queda la cita?";
  }
  if (label.includes("reserva") || party.includes("huesped")) {
    return "¿A nombre de quién va la reserva?";
  }
  return "¿A nombre de quién queda?";
}

export interface AgendaConfirmInput {
  choiceLabel: string;
  choiceDetail: string;
  dateLabel: string;
  party: number;
  partyLabel: string;
  guest: string;
  totalMoney?: string;
}

export function agendaConfirmLine(input: AgendaConfirmInput): string {
  const parts = [
    input.choiceLabel,
    input.dateLabel,
    `${input.party} ${input.partyLabel.toLowerCase()}`,
    input.guest,
  ];
  const money = input.totalMoney ? ` Total ${input.totalMoney}.` : "";
  return `Quedaría así: ${parts.join(" · ")}.${money} ¿La confirmo?`;
}

export function agendaSavedLine(
  listed: string,
  input: AgendaConfirmInput,
  updating: boolean,
): string {
  const summary = `${input.choiceLabel} · ${input.dateLabel} · ${input.party} ${input.partyLabel.toLowerCase()} · ${input.guest}`;
  if (updating) return `Listo. Actualicé la reserva: ${summary}. Si quieres otra, dilo.`;
  return `Listo. Quedó en ${listed}: ${summary}. Si quieres otra, dilo.`;
}

/** Pregunta de un solo campo, en el orden de las columnas de la plantilla. */
export function fieldQuestion(column: string, ctx?: { action?: SolutionActionId; columns?: string[] }): string {
  const word = column.trim();
  const key = fold(word);
  if (/numero|solicitud|pedido|orden|codigo/.test(key)) {
    return ctx?.action === "solicitudes"
      ? "¿Cuál es el número de la solicitud? (por ejemplo SOL-1042)"
      : "¿Cuál es el número o código?";
  }
  if (key === "estado") return "¿En qué estado queda? (Recibida, En curso, Listo…)";
  if (key === "libres") return "¿Cuántas unidades quedan libres ahora?";
  if (key === "minimo") return "¿Cuál es el mínimo antes de avisar?";
  if (/mesa/.test(key)) return "¿En qué mesa se sientan? (número o nombre de la mesa)";
  if (/habitacion|cuarto/.test(key)) return "¿Qué habitación ocupan?";
  if (key === "huesped" || key === "huésped") return "¿A nombre de quién va la estadía?";
  if (key === "viajero") return "¿Quién es el viajero o contacto principal?";
  if (key === "cliente") return "¿Nombre del cliente?";
  if (key === "persona" || key === "comensal") return "¿Nombre de la persona?";
  if (key === "paciente") return "¿Nombre del paciente?";
  if (/producto|prenda|articulo|plato|menu|servicio|plan/.test(key)) {
    return `¿Qué ${word.toLowerCase()} registramos en esta fila?`;
  }
  if (/detalle|nota|observacion|descripcion/.test(key)) return "¿Qué detalle le anotamos? (breve)";
  if (/fecha|llegada|salida/.test(key)) return "¿Qué fecha anoto?";
  if (/cantidad|noches|cupos|unidades|precio|total|bultos|piezas|personas|comensales|toneladas|kilos/.test(key)) {
    const feminine = /a$|as$|es$/.test(key) || /noches|unidades|piezas|personas|comensales/.test(key);
    return `¿${feminine ? "Cuántas" : "Cuántos"} ${word.toLowerCase()}?`;
  }
  return `¿Qué ${word.toLowerCase()} anoto en este registro?`;
}

/** Resume una fila con frases cortas para confirmar en el chat. */
export function formatFieldPhrase(column: string, value: string): string {
  const key = fold(column);
  const v = value.trim() || "—";
  if (/mesa/.test(key)) return v.match(/^\d+$/) ? `mesa ${v}` : v;
  if (/numero|solicitud|pedido|orden|codigo/.test(key)) return `${column.toLowerCase()} ${v}`;
  if (/estado/.test(key)) return `estado ${v}`;
  if (/cantidad|noches|cupos|unidades|personas|comensales|huespedes|viajeros|bultos|piezas|libres|minimo|toneladas|kilos/.test(key)) {
    const n = Number(v.replace(",", "."));
    if (!Number.isNaN(n)) return `${n} ${column.toLowerCase()}`;
  }
  if (/huesped|viajero|cliente|persona|paciente|comensal|producto|prenda|plan|servicio|habitacion|detalle/.test(key)) {
    return `${column.toLowerCase()} ${v}`;
  }
  return `${column.toLowerCase()}: ${v}`;
}

export function tableConfirmLine(columns: string[], values: string[]): string {
  const parts = columns.map((column, index) => formatFieldPhrase(column, values[index] ?? ""));
  return `Quedaría así: ${parts.join(" · ")}. ¿Lo confirmo?`;
}

export function tableSavedLine(columns: string[], values: string[], updating: boolean): string {
  const parts = columns.map((column, index) => formatFieldPhrase(column, values[index] ?? ""));
  const summary = parts.join(" · ");
  if (updating) return `Listo. Actualicé el registro: ${summary}. Si quieres otro, dilo.`;
  return `Listo. Ya quedó anotado: ${summary}. Si quieres otro, dilo.`;
}

/** Celda de ejemplo para mostrar el formato, sin inventar un registro real. */
export function exampleCell(column: string, index: number): string {
  const key = fold(column);
  if (CODE.test(column)) return "SOL-1042";
  if (/mesa/.test(key)) return "4";
  if (/huesped|viajero|cliente|persona|paciente|comensal/.test(key)) return index === 0 ? "Ana Gómez" : "Carlos Ruiz";
  if (/habitacion|plan|producto|prenda|servicio|plato/.test(key)) return index === 0 ? "Terraza" : "Opción B";
  if (DIGITS.test(column)) return index === 0 ? "2" : "4";
  if (/estado/i.test(column)) return "Recibida";
  if (/fecha|llegada|salida/i.test(column)) return "mañana";
  if (/detalle|nota|observacion/.test(key)) return "Grupo de 2, sin gluten";
  return index === 0 ? "Ejemplo" : "Dato";
}
