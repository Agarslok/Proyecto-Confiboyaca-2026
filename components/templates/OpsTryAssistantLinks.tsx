"use client";

import styles from "./tourism-operations.module.css";

/** Botones estilo pestaña que abren el asistente con un texto de prueba. */
export function OpsTryAssistantLinks({
  starters,
  onTryInAssistant,
  hint = "Prueba en el asistente:",
  actionLabel = "Abrir en asistente",
}: {
  starters: string[];
  onTryInAssistant?: (starter: string) => void;
  hint?: string;
  actionLabel?: string;
}) {
  if (!starters.length || !onTryInAssistant) return null;
  return (
    <>
      <p className={styles.crmEmptyHint}>{hint}</p>
      <div className={styles.opsTryTabs} role="group" aria-label="Ejemplos en el asistente">
        {starters.map((line) => (
          <button key={line} type="button" className={styles.tab} onClick={() => onTryInAssistant(line)}>
            {line}
            <span className={styles.tabDesc}>{actionLabel}</span>
          </button>
        ))}
      </div>
    </>
  );
}
