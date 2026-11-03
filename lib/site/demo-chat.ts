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

export function assistantHello(kind: string, company: string): string {
  const place = company.trim() || "tu empresa";
  return `Hola, soy tu asistente de ${kind} en ${place}, y estoy aquí para ayudarte.`;
}

export function agendaQuestion(submitLabel: string): string {
  const label = fold(submitLabel);
  if (label.includes("cita")) return "¿Qué tipo de cita quieres?";
  if (label.includes("reunion")) return "¿Qué tipo de reunión quieres agendar?";
  if (label.includes("toma")) return "¿Qué toma quieres agendar?";
  if (label.includes("visita")) return "¿Qué tipo de visita quieres agendar?";
  if (label.includes("pedido")) return "¿Qué tipo de pedido quieres hacer?";
  if (label.includes("mesa")) return "¿Qué mesa quieres reservar?";
  if (label.includes("entrada")) return "¿Qué entrada quieres?";
  return "¿Qué tipo de reserva quieres hacer?";
}

/** Pregunta de un solo campo, en el orden de las columnas de la plantilla. */
export function fieldQuestion(column: string): string {
  const word = column.trim();
  const key = fold(word);
  if (/numero|solicitud|pedido|orden|codigo/.test(key)) return "¿Cuál es el número?";
  if (key === "estado") return "¿En qué estado queda?";
  if (key === "libres") return "¿Cuántos quedan libres?";
  if (key === "minimo") return "¿Cuál es el mínimo?";
  if (/cantidad|noches|cupos|unidades|precio|total|bultos|piezas/.test(key)) {
    const feminine = /a$|as$|es$/.test(key);
    return `¿${feminine ? "Cuántas" : "Cuántos"} ${word.toLowerCase()}?`;
  }
  return `¿Qué ${word.toLowerCase()} anoto?`;
}

/** Celda de ejemplo para mostrar el formato, sin inventar un registro real. */
export function exampleCell(column: string, index: number): string {
  if (CODE.test(column)) return "1042";
  if (DIGITS.test(column)) return "2";
  if (/estado/i.test(column)) return "Recibida";
  if (/fecha/i.test(column)) return "mañana";
  return index === 0 ? "Ejemplo" : "Dato";
}
