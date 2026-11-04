import type { CrmCatalog, CrmEntityDefinition } from "@/lib/assistant/crm-catalog";
import { isCrmRowEmpty } from "@/lib/assistant/crm-catalog";
import {
  CRM_META_OP_ID,
  CRM_META_RECORDED_AT,
  isMetaKey,
  mergeRowMeta,
  stampRowMeta,
  type CrmRowSource,
} from "@/lib/assistant/crm-row-meta";
import { validateRowValues } from "@/lib/assistant/crm-validate";
import { workspaceId } from "@/lib/assistant/workspace";

export type CrmEntityState = CrmEntityDefinition & { rows: Record<string, string>[] };

export function cloneCrmCatalog(catalog: CrmCatalog): CrmEntityState[] {
  return catalog.entities.map((entity) => ({
    ...entity,
    columns: entity.columns.map((column) => ({ ...column })),
    rows: entity.rows.map((row) => ({ ...row })),
  }));
}

export function findCrmEntity(entities: CrmEntityState[], id: string): CrmEntityState | undefined {
  return entities.find((entity) => entity.id === id);
}

/** Filas con al menos un dato escrito (ignora placeholders vacíos). */
export function meaningfulRows(entity: CrmEntityState | undefined): Record<string, string>[] {
  if (!entity) return [];
  return entity.rows.filter((row) => !isCrmRowEmpty(row, entity.columns));
}

export function parseCount(raw: string | undefined): number {
  const match = (raw ?? "").replace(/\./g, "").match(/\d+/);
  if (!match) return 0;
  const value = Number.parseInt(match[0], 10);
  return Number.isFinite(value) ? value : 0;
}

function foldLabel(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type CapturedRowInput = {
  tableLabel: string;
  values: Record<string, string>;
};

/* ------------------------------ Registro único ----------------------------- */

/** Una misma operación repetida dentro de esta ventana se toma como reintento. */
export const DUPLICATE_WINDOW_MS = 120_000;

export type CommitFailureReason = "unknown_table" | "invalid" | "storage";

export type CommitResult =
  | { ok: true; status: "created" | "duplicate"; entities: CrmEntityState[]; tableLabel: string }
  | { ok: false; reason: CommitFailureReason; message: string };

export type CommitOptions = {
  /** Identificador de la operación (por ejemplo, el turno del chat). */
  opId?: string;
  now?: Date;
  source?: CrmRowSource;
  /** Formulario manual: basta un dato válido, no hace falta completar todos. */
  partial?: boolean;
};

/** Una sola tabla de destino: coincidencia exacta primero; si no, la primera cercana. */
function targetEntity(entities: CrmEntityState[], tableLabel: string): CrmEntityState | undefined {
  const wanted = foldLabel(tableLabel);
  if (!wanted) return undefined;
  return (
    entities.find((entity) => foldLabel(entity.label) === wanted) ??
    entities.find((entity) => {
      const label = foldLabel(entity.label);
      return wanted.includes(label) || label.includes(wanted);
    })
  );
}

function sameValues(entity: CrmEntityState, a: Record<string, string>, b: Record<string, string>): boolean {
  return entity.columns.every((column) => (a[column.key] ?? "").trim() === (b[column.key] ?? "").trim());
}

/**
 * Valida y agrega una fila. Función pura: devuelve el estado nuevo, no lo guarda.
 * Quien llama decide si el resultado se muestra como registrado (solo tras persistir).
 */
export function commitCapturedRow(
  entities: CrmEntityState[],
  capture: CapturedRowInput,
  options: CommitOptions = {},
): CommitResult {
  const entity = targetEntity(entities, capture.tableLabel);
  if (!entity) {
    return { ok: false, reason: "unknown_table", message: `No encontré la tabla «${capture.tableLabel}» para guardar esto.` };
  }

  const checked = validateRowValues(entity, capture.values, { partial: options.partial });
  if (!checked.ok) {
    return { ok: false, reason: "invalid", message: `No se guardó: ${checked.issues.join("; ")}.` };
  }

  const now = options.now ?? new Date();
  const opId = options.opId?.trim() || undefined;

  if (opId && entities.some((item) => item.rows.some((row) => row[CRM_META_OP_ID] === opId))) {
    return { ok: true, status: "duplicate", entities, tableLabel: entity.label };
  }

  const repeated = entity.rows.some((existing) => {
    if (isCrmRowEmpty(existing, entity.columns) || !sameValues(entity, existing, checked.values)) return false;
    const stamp = Date.parse(existing[CRM_META_RECORDED_AT] ?? "");
    if (!Number.isFinite(stamp)) return true;
    return now.getTime() - stamp < DUPLICATE_WINDOW_MS;
  });
  if (repeated) return { ok: true, status: "duplicate", entities, tableLabel: entity.label };

  const row = mergeRowMeta(
    checked.values,
    stampRowMeta(options.source ?? "assistant", "Confirmado", { opId, now }),
  );

  const next = entities.map((item) => {
    if (item.id !== entity.id) return item;
    const columns = item.columns.map((column) => {
      const value = row[column.key] ?? "";
      if (!value || column.options?.includes(value)) return column;
      return { ...column, options: [...(column.options ?? []), value] };
    });
    return { ...item, columns, rows: [...item.rows, row] };
  });
  return { ok: true, status: "created", entities: next, tableLabel: entity.label };
}

/** Compatibilidad: agrega la fila si es válida y no repetida; si no, deja el estado igual. */
export function appendCapturedRow(entities: CrmEntityState[], capture: CapturedRowInput): CrmEntityState[] {
  const result = commitCapturedRow(entities, capture);
  return result.ok ? result.entities : entities;
}

/* ------------------------------- Persistencia ------------------------------ */

export type CrmSessionSnapshot = Record<string, Record<string, string>[]>;

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function crmSessionKey(code: string | undefined, scope?: string): string {
  return `ops-crm:${workspaceId(code, scope)}`;
}

export function snapshotCrmRows(entities: CrmEntityState[]): CrmSessionSnapshot {
  return Object.fromEntries(entities.map((entity) => [entity.id, entity.rows.map((row) => ({ ...row }))]));
}

const MAX_STORED_ROWS = 2000;

/** Solo columnas conocidas y metadatos; lo demás (datos de otro catálogo) se descarta. */
function sanitizeRows(entity: CrmEntityState, rows: unknown): Record<string, string>[] {
  if (!Array.isArray(rows)) return [];
  const allowed = new Set(entity.columns.map((column) => column.key));
  return rows
    .slice(0, MAX_STORED_ROWS)
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row))
    .map((row) =>
      Object.fromEntries(
        Object.entries(row)
          .filter(([key, value]) => typeof value === "string" && (allowed.has(key) || isMetaKey(key)))
          .map(([key, value]) => [key, value as string]),
      ),
    );
}

export function applyCrmSnapshot(base: CrmEntityState[], snapshot: CrmSessionSnapshot): CrmEntityState[] {
  return base.map((entity) => {
    if (!Object.prototype.hasOwnProperty.call(snapshot, entity.id)) return entity;
    const rows = sanitizeRows(entity, snapshot[entity.id]);
    const columns = entity.columns.map((column) => {
      const extras = [
        ...new Set(
          rows
            .map((row) => (row[column.key] ?? "").trim())
            .filter((value) => value && !(column.options ?? []).includes(value)),
        ),
      ];
      if (!extras.length) return column;
      return { ...column, options: [...(column.options ?? []), ...extras] };
    });
    return { ...entity, columns, rows };
  });
}

function parseSnapshot(raw: string | null): CrmSessionSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CrmSessionSnapshot;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function browserStorage(kind: "localStorage" | "sessionStorage"): Storage | null {
  try {
    return typeof window === "undefined" ? null : window[kind];
  } catch {
    return null;
  }
}

/**
 * Lee la base de datos de una empresa. La única copia vigente es localStorage;
 * si solo existe la copia antigua de sessionStorage, se migra una vez y se borra.
 */
export function readCrmSession(key: string, storage?: StorageLike): CrmSessionSnapshot | null {
  if (storage) return parseSnapshot(storage.getItem(key));
  const local = browserStorage("localStorage");
  if (!local) return null;
  try {
    const current = parseSnapshot(local.getItem(key));
    if (current) return current;
    const legacyStore = browserStorage("sessionStorage");
    const legacy = parseSnapshot(legacyStore?.getItem(key) ?? null);
    if (legacy) {
      local.setItem(key, JSON.stringify(legacy));
      legacyStore?.removeItem(key);
    }
    return legacy;
  } catch {
    return null;
  }
}

/**
 * Guarda y verifica leyendo de vuelta. Devuelve false si el dato no quedó guardado:
 * en ese caso no se debe mostrar ninguna operación como registrada.
 */
export function writeCrmSession(key: string, entities: CrmEntityState[], storage?: StorageLike): boolean {
  const target = storage ?? browserStorage("localStorage");
  if (!target) return false;
  const payload = JSON.stringify(snapshotCrmRows(entities));
  try {
    target.setItem(key, payload);
    return target.getItem(key) === payload;
  } catch {
    return false;
  }
}

/**
 * Valida, guarda y recién entonces confirma. El estado nuevo solo se entrega
 * si la escritura quedó verificada.
 */
export function commitAndPersist(
  entities: CrmEntityState[],
  capture: CapturedRowInput,
  options: CommitOptions & { key: string; storage?: StorageLike },
): CommitResult {
  const result = commitCapturedRow(entities, capture, options);
  if (!result.ok || result.status === "duplicate") return result;
  if (!writeCrmSession(options.key, result.entities, options.storage)) {
    return {
      ok: false,
      reason: "storage",
      message: "No pude guardar en este navegador (almacenamiento lleno o bloqueado). La operación NO quedó registrada.",
    };
  }
  return result;
}
