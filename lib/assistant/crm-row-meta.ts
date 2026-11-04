/** Metadatos de fila (no son slots del formulario; persisten con la fila). */
export const CRM_META_RECORDED_AT = "_recordedAt";
export const CRM_META_SOURCE = "_source";
export const CRM_META_STATUS = "_status";
/** Identificador de la operación que originó la fila (evita registrar dos veces la misma). */
export const CRM_META_OP_ID = "_opId";

export type CrmRowSource = "assistant" | "manual";

export type CrmRowMeta = {
  recordedAt: string;
  source: CrmRowSource;
  status: string;
};

export function stampRowMeta(
  source: CrmRowSource,
  status = "Confirmado",
  options: { opId?: string; now?: Date } = {},
): Record<string, string> {
  const meta: Record<string, string> = {
    [CRM_META_RECORDED_AT]: (options.now ?? new Date()).toISOString(),
    [CRM_META_SOURCE]: source,
    [CRM_META_STATUS]: status,
  };
  if (options.opId) meta[CRM_META_OP_ID] = options.opId;
  return meta;
}

export function mergeRowMeta(row: Record<string, string>, meta: Record<string, string>): Record<string, string> {
  return { ...row, ...meta };
}

export function readRowMeta(row: Record<string, string>): CrmRowMeta | null {
  const recordedAt = (row[CRM_META_RECORDED_AT] ?? "").trim();
  if (!recordedAt) return null;
  const source = row[CRM_META_SOURCE] === "manual" ? "manual" : "assistant";
  return {
    recordedAt,
    source,
    status: (row[CRM_META_STATUS] ?? "Confirmado").trim() || "Confirmado",
  };
}

export function formatRecordedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

export function isMetaKey(key: string): boolean {
  return key.startsWith("_");
}
