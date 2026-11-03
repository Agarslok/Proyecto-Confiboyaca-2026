"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./solution-slot.module.css";

function padRow(columns: string[], row: string[] | undefined): string[] {
  return columns.map((_, index) => row?.[index]?.trim() ?? "");
}

function filledRow(columns: string[], draft: string[]): string[] {
  return columns.map((_, index) => draft[index]?.trim() || "—");
}

/** Tabla de demostración: agregar, editar y quitar filas. No persiste en el servidor. */
export function SolutionWorkbook({
  columns,
  initialRows,
  addLabel,
  emptyLabel,
}: {
  columns: string[];
  initialRows: string[][];
  addLabel: string;
  emptyLabel: string;
}) {
  const seed = useMemo(() => JSON.stringify({ columns, initialRows }), [columns, initialRows]);
  const [rows, setRows] = useState(() => initialRows.map((row) => padRow(columns, row)));
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<string[]>(() => columns.map(() => ""));
  const [status, setStatus] = useState("");

  useEffect(() => {
    const parsed = JSON.parse(seed) as { columns: string[]; initialRows: string[][] };
    setRows(parsed.initialRows.map((row) => padRow(parsed.columns, row)));
    setMode("idle");
    setEditIndex(null);
    setDraft(parsed.columns.map(() => ""));
    setStatus("");
  }, [seed]);

  if (columns.length === 0) return null;

  function openCreate() {
    setDraft(columns.map(() => ""));
    setEditIndex(null);
    setMode("create");
    setStatus("");
  }

  function openEdit(index: number) {
    setDraft(padRow(columns, rows[index]));
    setEditIndex(index);
    setMode("edit");
    setStatus("");
  }

  function save() {
    const next = filledRow(columns, draft);
    if (mode === "edit" && editIndex != null) {
      setRows((current) => current.map((row, index) => (index === editIndex ? next : row)));
      setStatus("Registro actualizado en esta demostración. En un sistema real quedaría en la base del negocio.");
    } else {
      setRows((current) => [...current, next]);
      setStatus("Registro agregado en esta demostración. En un sistema real quedaría en la base del negocio.");
    }
    setMode("idle");
    setEditIndex(null);
  }

  function remove(index: number) {
    setRows((current) => current.filter((_, item) => item !== index));
    if (editIndex === index) {
      setMode("idle");
      setEditIndex(null);
    }
    setStatus("Registro quitado de esta demostración.");
  }

  const editing = mode !== "idle";
  const canSave = draft.some((cell) => cell.trim().length > 0);

  return (
    <div className={styles.workbook}>
      <div className={styles.toolbar}>
        <p className={styles.toolbarNote}>
          Vista de implementación: puede agregar, editar y quitar. Los datos no se envían ni se guardan.
        </p>
        <button type="button" className={styles.submit} onClick={openCreate} disabled={mode === "create"}>
          {addLabel}
        </button>
      </div>

      {rows.length === 0 && !editing ? <p className={styles.empty}>{emptyLabel}</p> : null}

      {rows.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} scope="col">
                    {col}
                  </th>
                ))}
                <th scope="col">
                  <span className={styles.srOnly}>Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join("|")}`} className={editIndex === rowIndex ? styles.rowOn : undefined}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                  <td className={styles.rowActions}>
                    <div className={styles.cellActions}>
                      <button type="button" className={styles.linkish} onClick={() => openEdit(rowIndex)}>
                        Editar
                      </button>
                      <button type="button" className={styles.linkish} onClick={() => remove(rowIndex)}>
                        Quitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {editing ? (
        <form
          className={styles.editor}
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) save();
          }}
        >
          <p className={styles.editorTitle}>{mode === "edit" ? "Editar registro" : addLabel}</p>
          <div className={styles.fields} style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, minmax(0, 1fr))` }}>
            {columns.map((col, index) => (
              <label key={col} className={styles.field}>
                <span>{col}</span>
                <input
                  value={draft[index] ?? ""}
                  maxLength={80}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft((current) => current.map((cell, cellIndex) => (cellIndex === index ? value : cell)));
                  }}
                />
              </label>
            ))}
          </div>
          <div className={styles.editorActions}>
            <button type="submit" className={styles.submit} disabled={!canSave}>
              {mode === "edit" ? "Guardar cambios" : "Agregar a la lista"}
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => {
                setMode("idle");
                setEditIndex(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {status ? (
        <p className={styles.flash} role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
