const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

/** Etiqueta corta tipo «Vie 7 nov» (zona local del servidor / navegador). */
export function formatSpanishDay(date: Date): string {
  return `${WEEKDAY_SHORT[date.getDay()]} ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
}

/** Convierte hoy / mañana / pasado mañana / «mañana mañana» en fecha concreta. */
export function resolveRelativeWhenFromMessage(message: string, reference = new Date()): string | null {
  const hay = fold(message);
  if (/pasado\s+manana/.test(hay)) return formatSpanishDay(addDays(reference, 2));
  if (/manana\s+manana/.test(hay)) return formatSpanishDay(addDays(reference, 2));
  const mananaHits = hay.match(/\bmanana\b/g)?.length ?? 0;
  if (mananaHits >= 2) return formatSpanishDay(addDays(reference, 2));
  if (mananaHits === 1) return formatSpanishDay(addDays(reference, 1));
  if (/\bhoy\b/.test(hay)) return formatSpanishDay(reference);
  return null;
}

/** Opciones de fecha para selects CRM: hoy + siguientes días y rangos habituales. */
export function rollingWhenOptions(reference = new Date(), dayCount = 10): string[] {
  const days = Array.from({ length: dayCount }, (_, index) => formatSpanishDay(addDays(reference, index)));
  return [...days, "Esta semana", "Fin de semana"];
}
