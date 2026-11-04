import type { CrmEntityDefinition } from "@/lib/assistant/crm-catalog";

const PLACEHOLDER = "por definir";
const MAX_VALUE = 80;
const MAX_QUANTITY = 99999;

export type RowValidation =
  | { ok: true; values: Record<string, string> }
  | { ok: false; issues: string[] };

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Valida una fila contra las columnas de su tabla.
 * - completa: todos los campos con dato real (cierre del asistente).
 * - parcial: basta un dato (formulario manual), pero lo escrito debe ser válido.
 */
export function validateRowValues(
  entity: Pick<CrmEntityDefinition, "label" | "columns">,
  raw: Record<string, string>,
  options: { partial?: boolean } = {},
): RowValidation {
  const issues: string[] = [];
  const values: Record<string, string> = {};
  let filled = 0;

  for (const column of entity.columns) {
    const value = (raw[column.key] ?? "").replace(/\s+/g, " ").trim();
    values[column.key] = value;
    const missing = !value || fold(value) === PLACEHOLDER;
    if (missing) {
      if (!options.partial) issues.push(`falta «${column.label}»`);
      values[column.key] = missing && fold(value) === PLACEHOLDER ? "" : value;
      continue;
    }
    filled += 1;
    if (value.length > MAX_VALUE || /[<>]/.test(value)) {
      issues.push(`«${column.label}» no es válido`);
      continue;
    }
    if (column.slot === "howMany") {
      const quantity = /^\d{1,5}$/.test(value) ? Number.parseInt(value, 10) : 0;
      if (quantity < 1 || quantity > MAX_QUANTITY) issues.push(`«${column.label}» debe ser un número entero mayor que 0`);
    }
  }

  if (options.partial && filled === 0) issues.push("no hay ningún dato para guardar");
  return issues.length ? { ok: false, issues } : { ok: true, values };
}
