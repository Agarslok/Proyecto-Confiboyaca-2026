import { CRM_SLOT_ORDER, columnSelectOptions, type CrmSlot } from "@/lib/assistant/crm-catalog";
import type { CrmEntityState } from "@/lib/assistant/crm-state";
import { meaningfulRows } from "@/lib/assistant/crm-state";
import { formatSpanishDay, resolveRelativeWhenFromMessage } from "@/lib/assistant/relative-dates";
import { tourismLexicon } from "@/lib/ops/sector/turismo";
import type { SectorLexicon } from "@/lib/ops/sector/types";

type HistoryTurn = { role: "user" | "assistant"; text: string };

export const MISSING_VALUE = "Por definir";

export type OpsRecordColumn = {
  key: string;
  label: string;
  slot: CrmSlot;
  options: string[];
};

export type OpsRecordContext = {
  tableLabel: string;
  columns: OpsRecordColumn[];
  /** Filas vivas de la base de datos (las mismas que alimentan el dashboard). */
  rows?: Record<string, string>[];
};

export function toOpsRecord(entity: CrmEntityState): OpsRecordContext {
  const columns = entity.columns.map((column, index) => ({
    key: column.key,
    label: column.label,
    slot: column.slot ?? CRM_SLOT_ORDER[index] ?? "what",
    options: columnSelectOptions(column, entity.rows).slice(0, 12),
  }));
  const rows = meaningfulRows(entity)
    .slice(0, 12)
    .map((row) => Object.fromEntries(columns.map((column) => [column.key, (row[column.key] ?? "").trim()])));
  return { tableLabel: entity.label, columns, rows };
}

export function opsTablesFromEntities(entities: CrmEntityState[]): OpsRecordContext[] {
  return entities.map(toOpsRecord);
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matchOption(message: string, options: string[]): string {
  const haystack = fold(message);
  let best = "";
  for (const option of options) {
    const needle = fold(option);
    if (!needle) continue;
    if (haystack.includes(needle)) {
      if (needle.length > fold(best).length) best = option;
      continue;
    }
    const words = needle.split(" ").filter((word) => word.length > 3);
    if (words.length && words.every((word) => haystack.includes(word))) {
      if (needle.length > fold(best).length) best = option;
    }
  }
  if (best) return best;
  for (const option of options) {
    const last = fold(option).split(" ").at(-1) ?? "";
    if (last.length < 5) continue;
    if (/^(semana|finde|plan|paso|casa|tipo|habitacion|pedido)$/.test(last)) continue;
    if (haystack.includes(last)) return option;
  }
  if (/\bdoble\b/.test(haystack)) {
    const doble = options.find((option) => fold(option).includes("doble"));
    if (doble) return doble;
  }
  if (/\bsuite\b/.test(haystack)) {
    const suite = options.find((option) => fold(option).includes("suite"));
    if (suite) return suite;
  }
  return "";
}

function matchWhen(message: string, options: string[]): string {
  const resolved = resolveRelativeWhenFromMessage(message);
  if (resolved) return resolved;
  const haystack = fold(message);
  if (/fin de semana|finde|fin de/.test(haystack)) {
    return options.find((option) => fold(option).includes("fin")) || "Fin de semana";
  }
  if (/proxima semana/.test(haystack)) {
    return options.find((option) => fold(option).includes("proxima")) || "Próxima semana";
  }
  if (/esta semana/.test(haystack)) {
    return options.find((option) => fold(option).includes("esta semana")) || "Esta semana";
  }
  const weekday = matchWeekdayDate(message, options);
  if (weekday) return weekday;
  return matchOption(message, options);
}

function matchWeekdayDate(message: string, options: string[]): string {
  const hay = fold(message);
  const days = [
    { re: /\blunes\b|\blun\b/, needle: "lun" },
    { re: /\bmartes\b|\bmar\b/, needle: "mar" },
    { re: /\bmiercoles\b|\bmircoles\b|\bmie\b/, needle: "mie" },
    { re: /\bjueves\b|\bjue\b/, needle: "jue" },
    { re: /\bviernes\b|\bvie\b/, needle: "vie" },
    { re: /\bsabado\b|\bsab\b/, needle: "sab" },
    { re: /\bdomingo\b|\bdom\b/, needle: "dom" },
  ];
  for (const day of days) {
    if (!day.re.test(hay)) continue;
    const hit = options.find((option) => fold(option).startsWith(day.needle));
    if (hit) return hit;
  }
  return "";
}

const SPANISH_COUNT_WORDS: Record<string, string> = {
  uno: "1",
  una: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
  siete: "7",
  ocho: "8",
  nueve: "9",
  diez: "10",
  doce: "12",
};

function parseCountToken(message: string, opts?: { allowBareWords?: boolean }): string {
  const digit = message.match(/\b(\d{1,3})\b/);
  if (digit?.[1]) return digit[1];
  const llegan = message.match(/\bllegan?\s+(\d{1,3}|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce)\s+hu[eé]sped/i);
  if (llegan?.[1]) {
    const fromLlegada = wordToCount(llegan[1]);
    if (fromLlegada) return fromLlegada;
  }
  const labeled = message.match(
    /(?:cantidad(?:\s+de\s+hu[eé]spedes)?|hu[eé]spedes)\s+(?:son\s+|es\s+|de\s+)?(\d{1,3}|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce)/i,
  );
  if (labeled?.[1]) {
    const fromLabel = wordToCount(labeled[1]);
    if (fromLabel) return fromLabel;
  }
  if (opts?.allowBareWords) {
    const hay = fold(message);
    for (const [word, num] of Object.entries(SPANISH_COUNT_WORDS)) {
      if (word === "una" || word === "uno") continue;
      if (new RegExp(`\\b${word}\\b`).test(hay)) return num;
    }
  }
  return "";
}

function wordToCount(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{1,3}$/.test(trimmed)) return trimmed;
  return SPANISH_COUNT_WORDS[fold(trimmed)] ?? "";
}

function matchHowMany(message: string, options: string[]): string {
  const value = parseCountToken(message);
  if (!value) return matchOption(message, options);
  if (options.includes(value)) return value;
  return value;
}

function extractWhoName(message: string, options: string[]): string {
  const hay = message.trim();
  if (!hay) return "";
  const folded = fold(hay);

  const namedPhrase =
    hay.match(/(?:el\s+)?(?:cliente|paciente|hu[eé]sped|usuario)\s+se\s+llama\s+[^,.;\n]+/i)?.[0]?.trim() ??
    hay.match(/\bse\s+llama\s+[^,.;\n]+/i)?.[0]?.trim() ??
    "";
  if (namedPhrase.length >= 4 && namedPhrase.length <= 80) {
    return matchOption(namedPhrase, options) || namedPhrase;
  }

  const loteNum = hay.match(/\blote\s+(\d{1,6})\b/i)?.[1]?.trim();
  if (loteNum) return matchOption(`Lote ${loteNum}`, options) || `Lote ${loteNum}`;

  const responsable =
    hay.match(/(?:el\s+)?(?:responsable|encargado)\s+(?:es\s+|se\s+llama\s+)?([^,.;\n]+)/i)?.[1]?.trim() ??
    hay.match(/(?:lote|referencia)\s+(?:es\s+)?([^,.;\n]+)/i)?.[1]?.trim() ??
    "";
  const whoTail = splitWhoTail(responsable);
  if (whoTail.length >= 2 && whoTail.length <= 50) {
    return matchOption(whoTail, options) || whoTail;
  }

  const markers = ["huesped es ", "el huesped es ", "cliente es ", "el cliente es ", "paciente es ", "el paciente es "];
  for (const marker of markers) {
    const idx = folded.indexOf(marker);
    if (idx < 0) continue;
    const start = idx + marker.length;
    const rest = hay.slice(start);
    const name = splitWhoTail(rest);
    if (name.length >= 2 && name.length <= 50 && !/^cantidad\b/i.test(name)) {
      return matchOption(name, options) || name;
    }
  }
  if (/huesped|cantidad|habitacion|suite|llegada|cliente se llama|paciente se llama/.test(folded)) return "";
  if (/cantidad\s+(?:de\s+hu[eé]spedes\s+)?(?:es|son)\b/i.test(hay)) return "";
  if (looksLikeCaptureCommand(message)) return "";
  const trimmed = hay.trim();
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+/.test(trimmed)) {
    return matchOption(trimmed, options) || trimmed;
  }
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}$/.test(trimmed)) {
    return matchOption(trimmed, options) || trimmed;
  }
  return "";
}

function splitWhoTail(rest: string): string {
  return (
    rest
      .split(
        /[,;]|\s+cantidad\b|\s+toneladas?\b|\s+la\s+cantidad|\s+cantidad\s+de|\s+y\s+el\s+|\s+el\s+servici|\s+el\s+producto|\s+producto\s+son\b|\s+son\s+(?:\d|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce)\b/i,
      )[0]
      ?.trim() ?? ""
  );
}

function looksLikeCaptureCommand(message: string): boolean {
  const hay = fold(message);
  return /\b(agenda|agendar|reserv|programa|registr|anot|apunt|servicios?|citas?|consultas?|solicitud|ips|clinica|consultorio|para\s+(?:manana|hoy|pasado)|manana|hoy)\b/.test(
    hay,
  );
}

function extractWhatPhrase(message: string, options: string[]): string {
  const hay = message.trim();
  if (!hay) return "";
  const patterns = [
    /(?:el\s+)?servicio\s+(?:es\s+|de\s+)?([^,.;\n]+)/i,
    /(?:el\s+)?plan\s+(?:es\s+)?([^,.;\n]+)/i,
    /(?:el\s+)?producto\s+(?:es\s+|son\s+)?([^,.;\n]+)/i,
    /(?:la\s+)?referencia\s+(?:es\s+)?([^,.;\n]+)/i,
    /(?:consulta|procedimiento|tratamiento)\s+(?:de\s+|en\s+)?([^,.;\n]+)/i,
  ];
  for (const re of patterns) {
    const match = hay.match(re);
    const part = match?.[1]?.trim() ?? "";
    if (part.length >= 2 && part.length <= 60) {
      return matchOption(part, options) || part;
    }
  }
  return matchOption(message, options);
}

function firstMissingColumn(
  columns: OpsRecordColumn[],
  previous: Record<string, string>,
): OpsRecordColumn | undefined {
  for (const slot of CRM_SLOT_ORDER) {
    const column = columns.find((item) => item.slot === slot);
    if (column && !previous[column.key]?.trim()) return column;
  }
  return undefined;
}

function fillTargetSlot(
  message: string,
  column: OpsRecordColumn,
): string {
  switch (column.slot) {
    case "who": {
      const name = extractWhoName(message, column.options);
      return name;
    }
    case "howMany":
      return extractHowManyPhrase(message, column.options);
    case "when":
      return matchWhen(message, column.options);
    case "what": {
      let what = extractWhatPhrase(message, column.options);
      const trimmed = message.trim();
      if (
        !what &&
        trimmed.length >= 2 &&
        trimmed.length <= 50 &&
        !/^\d+$/.test(trimmed) &&
        !looksLikeCaptureCommand(message) &&
        !extractWhoName(message, column.options)
      ) {
        what = trimmed;
      }
      return what;
    }
    default:
      return "";
  }
}

function extractHowManyPhrase(message: string, options: string[]): string {
  const labeled = message.match(
    /cantidad(?:\s+de\s+hu[eé]spedes)?\s+(?:es\s+|son\s+)?(\d{1,3}|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce)/i,
  );
  if (labeled?.[1]) {
    const fromLabel = wordToCount(labeled[1]);
    if (fromLabel) return options.includes(fromLabel) ? fromLabel : fromLabel;
  }
  const value = parseCountToken(message, { allowBareWords: true });
  if (value) return options.includes(value) ? value : value;
  return matchOption(message, options);
}

function fillMissingFromFollowUp(
  message: string,
  columns: OpsRecordColumn[],
  previous: Record<string, string>,
): Record<string, string> {
  const values = { ...previous };
  const target = firstMissingColumn(columns, values);
  if (target) {
    const filled = fillTargetSlot(message, target);
    if (filled) values[target.key] = filled;
  }
  for (const column of columns) {
    if (values[column.key]?.trim()) continue;
    if (column.slot === "who") {
      const name = extractWhoName(message, column.options);
      if (name) values[column.key] = name;
    } else if (column.slot === "howMany") {
      const count = extractHowManyPhrase(message, column.options);
      if (count) values[column.key] = count;
    } else if (column.slot === "when") {
      const when = matchWhen(message, column.options);
      if (when) values[column.key] = when;
    } else if (column.slot === "what") {
      let what = extractWhatPhrase(message, column.options);
      const trimmed = message.trim();
      if (
        !what &&
        trimmed.length >= 2 &&
        trimmed.length <= 50 &&
        !/^\d+$/.test(trimmed) &&
        !looksLikeCaptureCommand(message) &&
        !extractWhoName(message, column.options)
      ) {
        what = trimmed;
      }
      if (what) values[column.key] = what;
    }
  }
  return values;
}

function captureProgressed(
  previous: Record<string, string>,
  next: Record<string, string>,
  columns: OpsRecordColumn[],
): boolean {
  return columns.some((column) => {
    const was = previous[column.key]?.trim();
    const now = next[column.key]?.trim();
    if (!now) return false;
    return !was || now !== was;
  });
}

function matchWho(message: string, options: string[]): string {
  return matchOption(message, options);
}

function messageLooksLikeWhoOnly(message: string): boolean {
  const hay = fold(message);
  if (extractWhoName(message, [])) return true;
  return /\bse\s+llama\b|\bcliente\b|\bpaciente\b|\bhu[eé]sped\b/.test(hay) && !/\d/.test(message);
}

function fillFromMessage(message: string, columns: OpsRecordColumn[]): Record<string, string> {
  const values: Record<string, string> = {};
  const whoOnly = messageLooksLikeWhoOnly(message);
  for (const column of columns) {
    if (column.slot === "when") values[column.key] = matchWhen(message, column.options);
    else if (column.slot === "howMany") {
      if (whoOnly) values[column.key] = "";
      else values[column.key] = matchHowMany(message, column.options);
    } else if (column.slot === "what") {
      values[column.key] = extractWhatPhrase(message, column.options);
    } else {
      const who = extractWhoName(message, column.options);
      values[column.key] = who || matchWho(message, column.options);
    }
  }
  return values;
}

function displayValue(column: OpsRecordColumn, raw: string): string {
  const value = raw.trim();
  if (!value) return MISSING_VALUE;
  return value;
}

function articleFor(label: string): "el" | "la" {
  const first = (label.trim().split(/\s+/)[0] ?? label).toLowerCase();
  if (/ad$|ción$|cion$|sión$|sion$|a$/.test(first) && !/ista$|ema$/.test(first)) return "la";
  return "el";
}

export function formatCaptureReply(
  tableLabel: string,
  columns: OpsRecordColumn[],
  values: Record<string, string>,
): string {
  const ordered = CRM_SLOT_ORDER.map((slot) => columns.find((column) => column.slot === slot)).filter(
    (column): column is OpsRecordColumn => Boolean(column),
  );
  const lines = ordered.map((column) => `${column.label}: ${displayValue(column, values[column.key] ?? "")}`);
  const missing = ordered.find((column) => !values[column.key]?.trim());
  const closing = missing
    ? `¿Cuál es ${articleFor(missing.label)} ${missing.label}?`
    : `Listo, quedó en ${tableLabel}.`;
  return ["Perfecto.", "", ...lines, "", closing].join("\n");
}

function parseReplyValues(text: string, columns: OpsRecordColumn[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const column of columns) {
    const match = text.match(new RegExp(`${column.label}:\\s*(.+)`, "i"));
    const raw = match?.[1]?.trim() ?? "";
    if (raw && fold(raw) !== fold(MISSING_VALUE)) values[column.key] = raw;
  }
  return values;
}

function pickTable(tables: OpsRecordContext[], message: string): OpsRecordContext {
  const haystack = fold(message);
  const hit = tables.find((table) => {
    const label = fold(table.tableLabel);
    if (haystack.includes(label)) return true;
    if (/pedido|solicitud/.test(haystack) && /pedido|solicitud/.test(label)) return true;
    if (/cupo|libre|habitacion|suite/.test(haystack) && /habitacion|cupo/.test(label)) return true;
    if (/estadia|en casa/.test(haystack) && /huesped|estadia|casa/.test(label)) return true;
    if (/reserva|llega|huesped/.test(haystack) && /reserva/.test(label)) return true;
    return false;
  });
  return hit ?? tables.find((table) => /reserva|registro/i.test(table.tableLabel)) ?? tables[0];
}

function isConsult(message: string): boolean {
  const haystack = fold(message);
  if (/¿/.test(message)) return true;
  return /cuant[oa]s|cual\b|que\s|como\b|donde\b|\btengo\b|\bhay\b|\bmuestra|\blista|\bdime\b|\bdame\b|\bdashboard|\bindicador|\bresumen/.test(
    haystack,
  );
}

function isCaptureIntent(message: string): boolean {
  if (/¿/.test(message)) return false;
  const hay = fold(message);
  if (/^(quien|quienes|cuant|cual|que |como |donde )/.test(hay)) return false;
  return /\banot|\bagenda\b|\bprograma\b|\breservar|\breserva\b|\buna reserva|\bnueva reserva|\breserva para|\blleg|\bqueda|\bdeja|\bguarda|\bregistr|\bapunt|\basigna|\bconfirma|\bnuevo pedido|\bpedir |\bsolicit|\babre\b/.test(
    hay,
  );
}

function isOpenCapture(text: string): boolean {
  return text.includes("Perfecto") && text.includes("¿Cuál es");
}

type CaptureSlotCue = "who" | "howMany" | "what";

function captureSlotCues(message: string): Record<CaptureSlotCue, boolean> {
  const hay = fold(message);
  const who =
    /\b(cliente|paciente|hu[eé]sped|usuario|responsable|encargado|proveedor|comprador|vendedor|operario)\s+(?:es|se\s+llama)\b/.test(
      hay,
    ) ||
    /\blote\s+\d/.test(hay) ||
    /\blote\s+[a-z]/.test(hay) ||
    /\b(orden|pedido)\s+n/.test(hay);
  const howMany =
    /\bcantidad\b/.test(hay) ||
    /\btoneladas?\b/.test(hay) ||
    /\bkilos?\b/.test(hay) ||
    /\bkg\b/.test(hay) ||
    /\b\d+\s*(personas?|pacientes?|hu[eé]spedes?|unidades?|piezas?|bultos?|sacos?|cajas?)\b/.test(hay) ||
    /\b(son|seran|hay)\s+(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d{1,3})\b/.test(hay);
  const what =
    /\b(producto|servicio|plan|material|referencia|item|procedimiento|consulta|tratamiento|cultivo|cosecha|variedad|habitacion|suite|hab)\s+(?:es|son|de)\b/.test(
      hay,
    ) ||
    /\bel\s+producto\b/.test(hay) ||
    /\bproducto\s+son\b/.test(hay);
  return { who, howMany, what };
}

function countCaptureSlotCues(cues: Record<CaptureSlotCue, boolean>): number {
  return (["who", "howMany", "what"] as const).filter((slot) => cues[slot]).length;
}

function isSimpleCaptureFollowUp(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (/^\d{1,3}$/.test(trimmed)) return true;
  if (/,/.test(trimmed)) return false;

  const words = trimmed.split(/\s+/);
  if (words.length === 1 && trimmed.length <= 24 && !looksLikeCaptureCommand(message)) return true;
  if (
    words.length <= 3 &&
    /^[A-ZÁÉÍÓÚÑ]?[a-záéíóúñ0-9]+(\s+[A-ZÁÉÍÓÚÑ]?[a-záéíóúñ0-9]+)?$/i.test(trimmed) &&
    countCaptureSlotCues(captureSlotCues(message)) <= 1
  ) {
    return true;
  }
  return false;
}

function messageLooksCompoundForCapture(message: string, mode: "followUp" | "opening"): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  const cues = captureSlotCues(message);
  const n = countCaptureSlotCues(cues);
  const hay = fold(message);

  if (/,/.test(trimmed)) {
    if (mode === "followUp") return true;
    if (n >= 1) return true;
  }
  if (/\s+y\s+(el|la)\s+/i.test(trimmed) && n >= 1) return true;

  if (/\bcantidad\b/.test(hay) && /\b(lote|producto|referencia|servicio|responsable|material)\b/.test(hay)) {
    return true;
  }
  if (/\blote\b/.test(hay) && /\b(producto|cantidad|referencia)\b/.test(hay)) return true;

  if (mode === "followUp") return n >= 2;

  if (cues.who && (cues.howMany || cues.what)) return true;
  if (cues.howMany && cues.what) return true;
  return false;
}

/** Mensajes compuestos (cualquier sector) → Gemini interpreta y reparte en las columnas del template. */
export function shouldDeferCaptureToGemini(message: string, history: HistoryTurn[] = []): boolean {
  const lastBot = [...history].reverse().find((turn) => turn.role === "assistant");
  const open = Boolean(lastBot && isOpenCapture(lastBot.text));

  if (open) {
    if (isSimpleCaptureFollowUp(message)) return false;
    return messageLooksCompoundForCapture(message, "followUp");
  }

  if (isCaptureIntent(message) && messageLooksCompoundForCapture(message, "opening")) return true;
  return false;
}

/** Respuesta local en plantilla (quién / cuándo / cuántos / qué) sin gastar tokens. */
export function tryLocalOpsReply(
  message: string,
  tables: OpsRecordContext[] | undefined,
  history: HistoryTurn[] = [],
): string | null {
  if (!tables?.length) return null;

  if (shouldDeferCaptureToGemini(message, history)) return null;

  const capture = isCaptureIntent(message);
  if (isConsult(message) && !capture) return null;

  const lastBot = [...history].reverse().find((turn) => turn.role === "assistant");
  const continuing = Boolean(lastBot && isOpenCapture(lastBot.text));
  if (!capture && !continuing) return null;

  const tableFromHistory = lastBot
    ? tables.find((table) => lastBot.text.includes(table.columns[0]?.label ?? "___"))
    : undefined;
  const picked = pickTable(tables, message);
  const table = continuing && !capture ? (tableFromHistory ?? picked) : picked;

  let values = fillFromMessage(message, table.columns);
  if (continuing && !capture && lastBot) {
    const previous = parseReplyValues(lastBot.text, table.columns);
    values = fillMissingFromFollowUp(message, table.columns, previous);
    if (!captureProgressed(previous, values, table.columns)) {
      return formatCaptureReply(table.tableLabel, table.columns, previous);
    }
  }

  const filled = table.columns.filter((column) => values[column.key]).length;
  if (filled === 0) return null;
  return formatCaptureReply(table.tableLabel, table.columns, values);
}

export type CapturedCrmRow = {
  tableLabel: string;
  values: Record<string, string>;
};

/** Fila lista para guardar cuando el asistente cierra con «Listo, quedó en…». */
export function capturedRowFromReply(
  reply: string,
  tables: OpsRecordContext[] | undefined,
): CapturedCrmRow | null {
  const closed = reply.match(/Listo,\s*qued[oó]\s+en\s+([^.]+)\./i);
  const label = closed?.[1]?.trim();
  if (!label || !tables?.length) return null;
  const wanted = fold(label);
  const table =
    tables.find((item) => fold(item.tableLabel) === wanted) ??
    tables.find((item) => wanted.includes(fold(item.tableLabel)) || fold(item.tableLabel).includes(wanted));
  if (!table) return null;
  const values = parseReplyValues(reply, table.columns);
  const complete = table.columns.every((column) => values[column.key]?.trim());
  if (!complete) return null;
  return { tableLabel: table.tableLabel, values };
}

function rowsOf(table: OpsRecordContext): Record<string, string>[] {
  return table.rows ?? [];
}

function slotColumn(table: OpsRecordContext, slot: OpsRecordColumn["slot"]): OpsRecordColumn | undefined {
  return table.columns.find((column) => column.slot === slot);
}

function whenNeedle(message: string, options: string[]): string {
  const resolved = resolveRelativeWhenFromMessage(message);
  if (resolved) return resolved;
  const hay = fold(message);
  if (/\bhoy\b/.test(hay)) return options.find((option) => fold(option) === fold(formatSpanishDay(new Date()))) ?? formatSpanishDay(new Date());
  if (/sabado|\bsab\b/.test(hay)) return options.find((option) => /sab/.test(fold(option))) ?? "";
  if (/domingo|\bdom\b/.test(hay)) return options.find((option) => /\bdom\b/.test(fold(option))) ?? "";
  if (/viernes|\bvie\b/.test(hay)) return options.find((option) => /\bvie\b/.test(fold(option))) ?? "";
  return options.find((option) => fold(option).length > 3 && hay.includes(fold(option))) ?? "";
}

function tableByLexicon(tables: OpsRecordContext[], pattern: RegExp): OpsRecordContext | undefined {
  return tables.find((table) => pattern.test(fold(table.tableLabel)));
}

function tableForQuestion(
  tables: OpsRecordContext[],
  message: string,
  lexicon: SectorLexicon,
): OpsRecordContext | undefined {
  const hay = fold(message);
  const named = tables.find((table) => hay.includes(fold(table.tableLabel)));
  if (named) return named;
  for (const hint of lexicon.tableHints) {
    if (!hint.message.test(hay)) continue;
    const table = tables.find((item) => hint.table.test(fold(item.tableLabel)));
    if (table) return table;
  }
  return undefined;
}

function occupancyReply(tables: OpsRecordContext[], lexicon: SectorLexicon): string {
  const parts: string[] = [];
  const primary = tableByLexicon(tables, lexicon.primaryTable);
  const presence = tableByLexicon(tables, lexicon.presenceTable);
  const stock = tableByLexicon(tables, lexicon.stockTable);

  if (primary) {
    const many = slotColumn(primary, "howMany");
    const total = many
      ? rowsOf(primary).reduce((acc, row) => acc + (Number.parseInt(row[many.key] ?? "", 10) || 0), 0)
      : rowsOf(primary).length;
    parts.push(`Hay ${rowsOf(primary).length} ${lexicon.countWord} y ${total} ${lexicon.expectedWord}.`);
  }
  if (presence) {
    const when = slotColumn(presence, "when");
    const who = slotColumn(presence, "who");
    const todayLabel = fold(formatSpanishDay(new Date()));
    const today = when
      ? rowsOf(presence).filter((row) => {
          const value = fold(row[when.key] ?? "");
          return value === "hoy" || value === todayLabel;
        })
      : [];
    const names = today.map((row) => (who ? row[who.key] : "")).filter(Boolean);
    parts.push(names.length ? `${lexicon.presencePrefix}: ${names.join(", ")}.` : lexicon.presenceEmpty);
  }
  if (stock) {
    const many = slotColumn(stock, "howMany");
    const what = slotColumn(stock, "what");
    if (many && what) {
      const bits = rowsOf(stock)
        .map((row) => `${row[what.key]} ${row[many.key] || "0"} ${lexicon.stockSuffix}`)
        .filter((bit) => !bit.startsWith(" "));
      if (bits.length) parts.push(`${lexicon.stockPrefix}: ${bits.join(", ")}.`);
    }
  }
  return parts.join(" ") || `Puedo revisar ${tables.map((table) => table.tableLabel).join(", ")}. ¿Cuál miramos?`;
}

function describeRow(table: OpsRecordContext, row: Record<string, string>): string {
  return table.columns
    .map((column) => {
      const value = (row[column.key] ?? "").trim();
      return value ? `${column.label}: ${value}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

/** Respuesta concreta leyendo las filas de la base de datos. Si no alcanza, deja pasar a Gemini. */
export function tryLocalOpsQuery(
  message: string,
  tables: OpsRecordContext[] | undefined,
  lexicon: SectorLexicon = tourismLexicon,
): string | null {
  if (!tables?.length || !isConsult(message) || isCaptureIntent(message)) return null;
  const hay = fold(message);

  if (lexicon.summary.test(hay)) {
    return occupancyReply(tables, lexicon);
  }

  for (const table of tables) {
    const who = slotColumn(table, "who");
    if (!who) continue;
    const hit = rowsOf(table).find((row) => {
      const name = fold(row[who.key] ?? "");
      return name.length > 3 && hay.includes(name);
    });
    if (hit) return `En ${table.tableLabel}, ${describeRow(table, hit)}.`;
  }

  const named = tableForQuestion(tables, message, lexicon);
  const table =
    named ??
    (lexicon.arrival.test(hay) ? tableByLexicon(tables, lexicon.primaryTable) ?? tables[0] : undefined);
  if (!table) {
    if (/cuant|quien|lista|resumen|muestra/.test(hay)) {
      return `Puedo revisar ${tables.map((item) => item.tableLabel).join(", ")}. ¿Cuál miramos?`;
    }
    return null;
  }

  const when = slotColumn(table, "when");
  const many = slotColumn(table, "howMany");
  const needle = when ? whenNeedle(message, when.options) : "";
  const filtered = needle && when
    ? rowsOf(table).filter((row) => fold(row[when.key] ?? "").includes(fold(needle)))
    : rowsOf(table);
  const scope = needle ? ` (${needle})` : "";

  if (/cuant/.test(hay) && many && lexicon.sumWhen.test(hay)) {
    const total = filtered.reduce((acc, row) => acc + (Number.parseInt(row[many.key] ?? "", 10) || 0), 0);
    return `En ${table.tableLabel}${scope} suman ${total} en ${many.label.toLowerCase()}.`;
  }

  if (/cuant/.test(hay)) {
    const count = filtered.length;
    if (count === 0) return `En ${table.tableLabel}${scope} no hay registros. ¿Quieres anotar uno?`;
    return `En ${table.tableLabel}${scope} hay ${count} ${count === 1 ? "registro" : "registros"}.`;
  }

  if (/quien|quienes|lista|muestra|cuales/.test(hay)) {
    if (!filtered.length) return `En ${table.tableLabel}${scope} no hay registros. ¿Quieres anotar uno?`;
    const lines = filtered.slice(0, 4).map((row) => describeRow(table, row));
    return `En ${table.tableLabel}${scope}: ${lines.join("; ")}.`;
  }

  return null;
}
