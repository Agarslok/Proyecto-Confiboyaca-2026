"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmCatalog, CrmColumn, CrmEntityDefinition } from "@/lib/assistant/crm-catalog";
import type { CrmSlot } from "@/lib/assistant/crm-catalog";
import { columnSelectOptions, emptyRow, isCrmRowEmpty, normalizeCrmRow } from "@/lib/assistant/crm-catalog";
import { formatRecordedAt, readRowMeta } from "@/lib/assistant/crm-row-meta";
import type { CrmEntityState } from "@/lib/assistant/crm-state";
import { commitCapturedRow, meaningfulRows } from "@/lib/assistant/crm-state";
import type { SectorActivityProfile } from "@/lib/ops/sector/profile-types";
import { OpsTryAssistantLinks } from "@/components/templates/OpsTryAssistantLinks";
import styles from "./tourism-operations.module.css";

const SLOT_ROLE: Record<CrmSlot, string> = {
  who: "Contacto / responsable",
  when: "Fecha",
  howMany: "Cantidad",
  what: "Categoría / detalle",
};

export type { CrmEntityState };

function CrmFieldSelect({
  column,
  value,
  entityRows,
  className,
  ariaLabel,
  onChange,
}: {
  column: CrmColumn;
  value: string;
  entityRows: Record<string, string>[];
  className: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  const options = columnSelectOptions(column, entityRows);
  const mergedOptions =
    value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select
      className={className}
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{column.placeholder ?? `Elige ${column.label.toLowerCase()}`}</option>
      {mergedOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/** Vista CRM: menú de tablas a la izquierda, grid editable a la derecha. */
export function SectorCrmPanel({
  catalog,
  entities,
  onEntitiesChange,
  focusLabel,
  profile,
  onTryInAssistant,
}: {
  catalog: CrmCatalog;
  entities: CrmEntityState[];
  /** Devuelve false si el cambio no quedó guardado (entonces no se refleja en pantalla). */
  onEntitiesChange: (entities: CrmEntityState[]) => boolean | void;
  focusLabel?: string | null;
  profile?: SectorActivityProfile;
  onTryInAssistant?: (starter: string) => void;
}) {
  const [activeId, setActiveId] = useState(catalog.entities[0]?.id ?? "");
  const [addingForId, setAddingForId] = useState<string | null>(null);
  const [draftRow, setDraftRow] = useState<Record<string, string> | null>(null);
  const [addFormError, setAddFormError] = useState("");

  const active = useMemo(() => entities.find((entity) => entity.id === activeId) ?? entities[0], [entities, activeId]);

  useEffect(() => {
    setAddingForId(null);
    setDraftRow(null);
    setAddFormError("");
  }, [activeId]);

  useEffect(() => {
    const label = focusLabel?.trim();
    if (!label) return;
    const match = entities.find((entity) => entity.label.localeCompare(label, "es", { sensitivity: "base" }) === 0);
    if (match) setActiveId(match.id);
  }, [entities, focusLabel]);

  const commit = useCallback(
    (next: CrmEntityState[]) => onEntitiesChange(next),
    [onEntitiesChange],
  );

  function updateCell(entityId: string, rowIndex: number, key: string, value: string) {
    commit(
      entities.map((entity) => {
        if (entity.id !== entityId) return entity;
        const rows = entity.rows.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row));
        return { ...entity, rows };
      }),
    );
  }

  function startAddRow(entityId: string, columns: CrmEntityDefinition["columns"]) {
    setAddFormError("");
    if (addingForId === entityId) {
      setAddingForId(null);
      setDraftRow(null);
      return;
    }
    setAddingForId(entityId);
    setDraftRow(emptyRow(columns));
  }

  function updateDraftField(key: string, value: string) {
    setDraftRow((prev) => (prev ? { ...prev, [key]: value } : prev));
    setAddFormError("");
  }

  function cancelAddRow() {
    setAddingForId(null);
    setDraftRow(null);
    setAddFormError("");
  }

  function saveDraftRow(entityId: string, entity: CrmEntityState) {
    if (!draftRow) return;
    const normalized = normalizeCrmRow(draftRow, entity.columns, entity.rows);
    if (isCrmRowEmpty(normalized, entity.columns)) {
      setAddFormError("Elige al menos un dato antes de guardar la fila.");
      return;
    }
    const result = commitCapturedRow(
      entities,
      { tableLabel: entity.label, values: normalized },
      { source: "manual", partial: true },
    );
    if (!result.ok) {
      setAddFormError(result.message);
      return;
    }
    if (result.status === "duplicate") {
      setAddFormError("Ese registro ya está en la tabla; no se duplicó.");
      return;
    }
    if (commit(result.entities) === false) {
      setAddFormError("No se pudo guardar en este navegador. La fila no quedó registrada.");
      return;
    }
    setDraftRow(emptyRow(entity.columns));
    setAddFormError("");
  }

  function removeRow(entityId: string, rowIndex: number) {
    commit(
      entities.map((entity) => {
        if (entity.id !== entityId) return entity;
        return { ...entity, rows: entity.rows.filter((_, index) => index !== rowIndex) };
      }),
    );
  }

  if (!active) return null;

  const showAddForm = addingForId === active.id && draftRow;
  const visibleRows = meaningfulRows(active);
  const exampleOps = profile?.initialQuestions ?? [];

  return (
    <div className={styles.crm}>
      <aside className={styles.crmNav} aria-label="Tablas del negocio">
        <p className={styles.crmNavTitle}>{catalog.sectorLabel}</p>
        <ul className={styles.crmNavList}>
          {entities.map((entity) => (
            <li key={entity.id}>
              <button
                type="button"
                className={`${styles.crmNavBtn}${entity.id === active.id ? ` ${styles.crmNavBtnOn}` : ""}`}
                aria-current={entity.id === active.id ? "true" : undefined}
                onClick={() => setActiveId(entity.id)}
              >
                <span className={styles.crmNavLabel}>{entity.label}</span>
                <span className={styles.crmNavMeta}>{meaningfulRows(entity).length} registros</span>
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.crmNavFoot}>
          Tipo de registro = tabla activa. Cada fila guardada alimenta el dashboard. Persistencia en este navegador
          (localStorage).
        </p>
      </aside>

      <div className={styles.crmMain}>
        <header className={styles.crmHead}>
          <div>
            <h3 className={styles.crmTableTitle}>{active.label}</h3>
            <p className={styles.crmTableLead}>{active.description}</p>
            <p className={styles.crmTableType}>
              Tipo de registro: <strong>{active.label}</strong>
              {profile ? ` · ${profile.activityLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            className={`${styles.crmAddBtn}${showAddForm ? ` ${styles.crmAddBtnOn}` : ""}`}
            aria-expanded={showAddForm ? "true" : "false"}
            onClick={() => startAddRow(active.id, active.columns)}
          >
            {showAddForm ? "Cerrar formulario" : "+ Anotar fila"}
          </button>
        </header>

        {showAddForm ? (
          <form
            className={styles.crmAddForm}
            onSubmit={(event) => {
              event.preventDefault();
              saveDraftRow(active.id, active);
            }}
          >
            <p className={styles.crmAddFormLead}>
              Elige cada dato en las listas (sin teclear). Así evitas errores de digitación y el dashboard lee valores
              consistentes.
            </p>
            <div className={styles.crmAddFields}>
              {active.columns.map((column) => (
                <label key={column.key} className={styles.crmAddField}>
                  <span className={styles.crmAddLabel}>{column.label}</span>
                  <CrmFieldSelect
                    column={column}
                    value={draftRow[column.key] ?? ""}
                    entityRows={active.rows}
                    className={styles.crmAddSelect}
                    ariaLabel={column.label}
                    onChange={(value) => updateDraftField(column.key, value)}
                  />
                </label>
              ))}
            </div>
            {addFormError ? (
              <p className={styles.crmAddError} role="alert">
                {addFormError}
              </p>
            ) : null}
            <div className={styles.crmAddActions}>
              <button type="submit" className={styles.crmSaveBtn}>
                Guardar fila
              </button>
              <button type="button" className={styles.crmCancelBtn} onClick={cancelAddRow}>
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        <div className={styles.crmTableWrap}>
          <table className={styles.crmTable}>
            <thead>
              <tr>
                {active.columns.map((column) => (
                  <th key={column.key} scope="col">
                    <span className={styles.crmColLabel}>{column.label}</span>
                    {column.slot ? <span className={styles.crmColHint}>{SLOT_ROLE[column.slot]}</span> : null}
                  </th>
                ))}
                <th scope="col">Estado</th>
                <th scope="col">Registrado</th>
                <th scope="col" className={styles.crmActionsHead}>
                  <span className={styles.srOnly}>Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={active.columns.length + 4} className={styles.crmEmpty}>
                    <p>Todavía no hay registros en esta tabla.</p>
                    {exampleOps.length ? (
                      <OpsTryAssistantLinks starters={exampleOps} onTryInAssistant={onTryInAssistant} />
                    ) : (
                      <p className={styles.crmEmptyHint}>Usa «Anotar fila» o confirma datos en el asistente.</p>
                    )}
                  </td>
                </tr>
              ) : (
                active.rows.map((row, rowIndex) => {
                  if (isCrmRowEmpty(row, active.columns)) return null;
                  const meta = readRowMeta(row);
                  return (
                  <tr key={`${active.id}-${rowIndex}`}>
                    {active.columns.map((column) => (
                      <td key={column.key}>
                        <CrmFieldSelect
                          column={column}
                          value={row[column.key] ?? ""}
                          entityRows={active.rows}
                          className={styles.crmCellSelect}
                          ariaLabel={`${column.label}, fila ${rowIndex + 1}`}
                          onChange={(value) => updateCell(active.id, rowIndex, column.key, value)}
                        />
                      </td>
                    ))}
                    <td className={styles.crmMetaCell}>{meta?.status ?? "—"}</td>
                    <td className={styles.crmMetaCell}>
                      {meta ? formatRecordedAt(meta.recordedAt) : "—"}
                      {meta ? (
                        <span className={styles.crmMetaSource}>{meta.source === "assistant" ? "Asistente" : "Manual"}</span>
                      ) : null}
                    </td>
                    <td className={styles.crmRowActions}>
                      <button
                        type="button"
                        className={styles.crmRowRemove}
                        onClick={() => removeRow(active.id, rowIndex)}
                        aria-label={`Quitar fila ${rowIndex + 1}`}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
