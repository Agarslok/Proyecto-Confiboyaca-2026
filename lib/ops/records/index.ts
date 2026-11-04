import type { CrmColumn } from "@/lib/assistant/crm-catalog";
import {
  appendCapturedRow,
  applyCrmSnapshot,
  cloneCrmCatalog,
  commitAndPersist,
  commitCapturedRow,
  crmSessionKey,
  findCrmEntity,
  meaningfulRows,
  parseCount,
  readCrmSession,
  snapshotCrmRows,
  writeCrmSession,
  type CapturedRowInput,
  type CommitResult,
  type CrmEntityState,
  type CrmSessionSnapshot,
} from "@/lib/assistant/crm-state";

export {
  appendCapturedRow,
  applyCrmSnapshot,
  cloneCrmCatalog,
  commitAndPersist,
  commitCapturedRow,
  crmSessionKey,
  findCrmEntity,
  meaningfulRows,
  parseCount,
  readCrmSession,
  snapshotCrmRows,
  writeCrmSession,
};
export type { CapturedRowInput, CommitResult, CrmEntityState, CrmSessionSnapshot };

function foldLabel(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Clasifica un cierre «quedó en {tabla}» contra las entidades del catálogo. */
export function classifyTable(entities: CrmEntityState[], tableLabel: string): CrmEntityState | undefined {
  const wanted = foldLabel(tableLabel);
  return entities.find((entity) => {
    const label = foldLabel(entity.label);
    return label === wanted || wanted.includes(label) || label.includes(wanted);
  });
}

/** Campos vacíos de una fila. La conversación pregunta solo el primero. */
export function missingFields(columns: CrmColumn[], values: Record<string, string>): CrmColumn[] {
  return columns.filter((column) => !(values[column.key] ?? "").trim());
}

export function rowIsComplete(columns: CrmColumn[], values: Record<string, string>): boolean {
  return missingFields(columns, values).length === 0;
}
