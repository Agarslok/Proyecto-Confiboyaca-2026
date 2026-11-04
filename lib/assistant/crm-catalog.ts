import type { SolutionVoice } from "@/lib/radar/solution-voice";
import type { IndustryId } from "@/lib/radar/types";
import { activityProfile, profileSectorLabel } from "@/lib/ops/sector/profile-builder";
import type { SectorActivityProfile } from "@/lib/ops/sector/profile-types";
import { rollingWhenOptions } from "@/lib/assistant/relative-dates";

/** Quién / cuándo / cuántos / qué: la misma plantilla en todos los sectores. */
export type CrmSlot = "who" | "when" | "howMany" | "what";

export const CRM_SLOT_ORDER: CrmSlot[] = ["who", "when", "howMany", "what"];

/** Columna visible en la tabla CRM (pocas, legibles). */
export type CrmColumn = {
  key: string;
  label: string;
  slot?: CrmSlot;
  /** Texto de ayuda en el formulario «Anotar fila». */
  placeholder?: string;
  /** Si existe, solo se puede elegir de la lista (sin tecleo libre). */
  options?: string[];
};

/** Una “tabla” del negocio (reservas, habitaciones, etc.). */
export type CrmEntityDefinition = {
  id: string;
  label: string;
  description: string;
  columns: CrmColumn[];
  rows: Record<string, string>[];
  /**
   * Clave para enlazar con el asistente más adelante (p. ej. `operational_records.entity_type`).
   * Hoy no se sincroniza; deja el contrato listo.
   */
  syncKey: string;
};

export type CrmCatalog = {
  sectorLabel: string;
  entities: CrmEntityDefinition[];
};

function pickColumns(
  labels: string[],
  keys: string[],
  placeholders?: string[],
  optionsList?: string[][],
): CrmColumn[] {
  return keys.map((key, index) => ({
    key,
    label: labels[index] ?? key,
    slot: CRM_SLOT_ORDER[index] ?? "what",
    placeholder: placeholders?.[index],
    options: optionsList?.[index],
  }));
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

type VoiceTable = SolutionVoice["registro"];

const LOOKS_NUMERIC = /^\d[\d.,:]*(\s+\S{1,8})?$/;

/** Columnas de texto de una tabla de ejemplo (sin estados ni cifras), cada una con sus valores. */
function textColumnsOf(table: VoiceTable): string[][] {
  return table.columns
    .map((header, index) => ({
      header,
      values: uniqueNonEmpty((table.rows ?? []).map((cells) => cells[index] ?? "")),
    }))
    .filter(({ header, values }) => !/estado/i.test(header) && values.length > 0 && values.every((value) => !LOOKS_NUMERIC.test(value)))
    .map(({ values }) => values);
}

/** Cantidades de ejemplo: solo enteros, para que coincidan con la validación del registro. */
function integerOptionsFrom(table: VoiceTable, columnIndex: number, fallback: string[]): string[] {
  const values = uniqueNonEmpty((table.rows ?? []).map((cells) => cells[columnIndex] ?? "")).filter((value) =>
    /^\d{1,5}$/.test(value),
  );
  return values.length ? values : fallback;
}

function optionsFromVoiceColumn(rows: string[][] | undefined, columnIndex: number, fallback: string[]): string[] {
  const fromRows = uniqueNonEmpty((rows ?? []).map((cells) => cells[columnIndex] ?? ""));
  return fromRows.length ? fromRows : fallback;
}

/** Catálogo turismo · hotel: entidades típicas del lente hotel en solution-voice. */
function tourismHotelCatalog(voice: SolutionVoice): CrmCatalog {
  const registro = voice.registro;
  const inventario = voice.inventario;
  const solicitudes = voice.solicitudes;

  const roomTypes = optionsFromVoiceColumn(inventario.rows, 0, [
    "Habitación doble",
    "Suite",
    "Plan fin de semana",
  ]);
  const arrivalOptions = [
    "Hoy",
    "Mañana",
    "Vie 7 nov",
    "Sáb 8 nov",
    "Dom 9 nov",
    "Lun 10 nov",
    "Próxima semana",
  ];
  const guestCountOptions = ["1", "2", "3", "4", "5", "6", "8", "12"];
  const guestOptions = uniqueNonEmpty([
    "Familia Moreno",
    "Agencia Viajes Sol",
    "Huésped de paso",
    "Pareja",
    "Viajero solo",
    "Grupo empresa",
    ...(registro.rows ?? []).map((cells) => cells[0] ?? ""),
  ]);
  const nightsOptions = ["1", "2", "3", "4", "5", "7"];
  const freeOptions = optionsFromVoiceColumn(inventario.rows, 1, ["0", "1", "2", "4", "6", "8", "12"]);
  const orderDetailOptions = uniqueNonEmpty([
    "Grupo de 12, dos noches",
    "Decoración de aniversario",
    "Late check-out",
    "Cuna en habitación",
    "Desayuno temprano",
    ...(solicitudes.rows ?? []).map((cells) => cells[1] ?? ""),
  ]);
  const contactOptions = ["Recepción", "WhatsApp hotel", "Correo confirmado", "Agencia B2B"];

  const reservasCols = pickColumns(
    ["Huésped", "Llegada", "Cantidad de huéspedes", "Habitación"],
    ["guest", "arrival", "guestCount", "room"],
    ["Elige huésped", "Elige llegada", "Elige cantidad", "Elige habitación"],
    [guestOptions, arrivalOptions, guestCountOptions, roomTypes],
  );
  const reservasRows: Record<string, string>[] = [];

  const estadiasCols = pickColumns(
    ["Huésped", "Fecha", "Noches", "Habitación"],
    ["guest", "arrival", "nights", "room"],
    ["Elige huésped", "Elige fecha", "Elige noches", "Elige habitación"],
    [guestOptions, arrivalOptions, nightsOptions, roomTypes],
  );
  const estadiasRows: Record<string, string>[] = [];

  const cuposCols = pickColumns(
    ["Responsable", "Para", "Libres", "Habitación"],
    ["staff", "when", "free", "roomType"],
    ["Elige responsable", "Elige fecha", "Cupos libres", "Elige habitación"],
    [
      ["Recepción", "Gobernanta", "Gerencia"],
      ["Hoy", "Mañana", "Fin de semana", "Esta semana"],
      freeOptions,
      roomTypes,
    ],
  );
  const cuposRows: Record<string, string>[] = [];

  const pedidosCols = pickColumns(
    ["Contacto", "Para", "Cantidad", "Pedido"],
    ["contact", "when", "qty", "detail"],
    ["Elige contacto", "Elige fecha", "Elige cantidad", "Elige pedido"],
    [contactOptions, ["Hoy", "Mañana", "Esta semana", "Fin de semana"], guestCountOptions, orderDetailOptions],
  );
  const pedidosRows: Record<string, string>[] = [];

  return {
    sectorLabel: "Turismo · hotel",
    entities: [
      {
        id: "reservas",
        label: "Reservas",
        description: "Quién llega y cuándo",
        columns: reservasCols,
        rows: reservasRows,
        syncKey: "reserva",
      },
      {
        id: "estadias",
        label: "Huéspedes en casa",
        description: registro.businessChange.slice(0, 120),
        columns: estadiasCols,
        rows: estadiasRows,
        syncKey: "estadia",
      },
      {
        id: "cupos",
        label: "Habitaciones",
        description: inventario.businessChange.slice(0, 120),
        columns: cuposCols,
        rows: cuposRows,
        syncKey: "cupo_habitacion",
      },
      {
        id: "pedidos",
        label: "Pedidos especiales",
        description: solicitudes.businessChange.slice(0, 120),
        columns: pedidosCols,
        rows: pedidosRows,
        syncKey: "solicitud",
      },
    ],
  };
}

/** Registro + inventario genéricos con etiquetas del perfil sectorial. */
function genericCatalogWithProfile(voice: SolutionVoice, profile: SectorActivityProfile): CrmCatalog {
  const registro = voice.registro;
  const textColumns = textColumnsOf(registro);
  const whoOptions = textColumns[0] ?? ["Cliente", "Empresa", "Grupo"];
  const whatOptions = textColumns[1] ?? textColumns[0] ?? ["Producto", "Servicio", "Pedido"];
  const whenOptions = rollingWhenOptions();
  const howManyOptions = ["1", "2", "3", "4", "5", "6", "8", "12"];
  const fields = profile.entities.primary.fields;
  const cols = pickColumns(
    fields.length >= 4 ? fields : [registro.columns[0] ?? "Quién", "Cuándo", "Cuántos", registro.columns[1] ?? "Qué"],
    ["who", "when", "howMany", "what"],
    ["Elige quién", "Elige cuándo", "Elige cuántos", "Elige qué"],
    [whoOptions, whenOptions, howManyOptions, whatOptions],
  );
  const rows: Record<string, string>[] = [];

  const stock = voice.inventario;
  const stockWhat = textColumnsOf(stock)[0] ?? ["Ítem", "Producto"];
  const stockQty = integerOptionsFrom(stock, 1, howManyOptions);
  const stockFields = profile.entities.secondary.fields;
  const stockCols = pickColumns(
    stockFields.length >= 4 ? stockFields : ["Responsable", "Para", "Cantidad", stock.columns[0] ?? "Ítem"],
    ["who", "when", "howMany", "what"],
    ["Elige responsable", "Elige fecha", "Elige cantidad", "Elige ítem"],
    [["Mostrador", "Bodega", "Producción"], whenOptions, stockQty, stockWhat],
  );
  const stockRows: Record<string, string>[] = [];

  return {
    sectorLabel: profileSectorLabel(profile),
    entities: [
      {
        id: profile.entities.primary.id,
        label: profile.entities.primary.label,
        description: profile.entities.primary.description,
        columns: cols,
        rows,
        syncKey: "registro",
      },
      {
        id: profile.entities.secondary.id,
        label: profile.entities.secondary.label,
        description: profile.entities.secondary.description,
        columns: stockCols,
        rows: stockRows,
        syncKey: "inventario",
      },
    ],
  };
}

/** Registro + inventario genéricos cuando aún no hay catálogo sectorial. */
function genericCatalog(voice: SolutionVoice, sectorLabel: string): CrmCatalog {
  const registro = voice.registro;
  const textColumns = textColumnsOf(registro);
  const whoOptions = textColumns[0] ?? ["Cliente", "Empresa", "Grupo"];
  const whatOptions = textColumns[1] ?? textColumns[0] ?? ["Producto", "Servicio", "Pedido"];
  const whenOptions = rollingWhenOptions();
  const howManyOptions = ["1", "2", "3", "4", "5", "6", "8", "12"];
  const cols = pickColumns(
    [registro.columns[0] ?? "Quién", "Cuándo", "Cuántos", registro.columns[1] ?? "Qué"],
    ["who", "when", "howMany", "what"],
    ["Elige quién", "Elige cuándo", "Elige cuántos", "Elige qué"],
    [whoOptions, whenOptions, howManyOptions, whatOptions],
  );
  const rows: Record<string, string>[] = [];

  const stock = voice.inventario;
  const stockWhat = textColumnsOf(stock)[0] ?? ["Ítem", "Producto"];
  const stockQty = integerOptionsFrom(stock, 1, howManyOptions);
  const stockCols = pickColumns(
    ["Responsable", "Para", "Cantidad", stock.columns[0] ?? "Ítem"],
    ["who", "when", "howMany", "what"],
    ["Elige responsable", "Elige fecha", "Elige cantidad", "Elige ítem"],
    [["Mostrador", "Bodega", "Producción"], whenOptions, stockQty, stockWhat],
  );
  const stockRows: Record<string, string>[] = [];

  return {
    sectorLabel,
    entities: [
      {
        id: "registro",
        label: "Registro",
        description: registro.businessChange.slice(0, 120),
        columns: cols,
        rows,
        syncKey: "registro",
      },
      {
        id: "existencias",
        label: "Existencias",
        description: stock.businessChange.slice(0, 120),
        columns: stockCols,
        rows: stockRows,
        syncKey: "inventario",
      },
    ],
  };
}

/**
 * Arma el menú CRM según industria y la voz sectorial (solution-voice).
 * Ampliar con `switch (industryId)` cuando entren más sectores.
 */
export function crmCatalogFromVoice(
  voice: SolutionVoice,
  industryId: IndustryId | "",
  activityId?: string,
): CrmCatalog {
  if (industryId === "turismo" && (!activityId || activityId === "turismo-hotel")) {
    return tourismHotelCatalog(voice);
  }
  if (industryId) {
    const profile = activityProfile(industryId, activityId || "");
    return genericCatalogWithProfile(voice, profile);
  }
  return genericCatalog(voice, industryId ? `Sector ${industryId}` : "General");
}

/**
 * Punto de extensión: fusionar filas que confirme el asistente (aún no conectado).
 * Devuelve el catálogo sin cambios hasta que exista persistencia operativa.
 */
export function mergeCrmCatalogFromAssistant(catalog: CrmCatalog, _payload: unknown): CrmCatalog {
  return catalog;
}

export function emptyRow(columns: CrmColumn[]): Record<string, string> {
  return Object.fromEntries(columns.map((column) => [column.key, ""]));
}

export function isCrmRowEmpty(row: Record<string, string>, columns: CrmColumn[]): boolean {
  return columns.every((column) => !(row[column.key]?.trim() ?? ""));
}

export function columnSelectOptions(column: CrmColumn, entityRows: Record<string, string>[] = []): string[] {
  const fromRows = uniqueNonEmpty(entityRows.map((row) => row[column.key] ?? ""));
  const merged = uniqueNonEmpty([...(column.options ?? []), ...fromRows]);
  return merged;
}

export function coerceCrmCellValue(column: CrmColumn, raw: string, entityRows: Record<string, string>[] = []): string {
  const value = raw.trim();
  const options = columnSelectOptions(column, entityRows);
  if (options.length === 0) return value;
  if (!value) return "";
  if (options.includes(value)) return value;
  return options[0] ?? "";
}

/** Normaliza celdas antes de guardar una fila nueva desde el formulario. */
export function normalizeCrmRow(
  row: Record<string, string>,
  columns: CrmColumn[],
  entityRows: Record<string, string>[] = [],
): Record<string, string> {
  const next = emptyRow(columns);
  columns.forEach((column) => {
    next[column.key] = coerceCrmCellValue(column, row[column.key] ?? "", entityRows);
  });
  return next;
}
