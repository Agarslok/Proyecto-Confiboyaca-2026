"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SESSION_QUOTA } from "@/lib/assistant/session-quota";
import styles from "./tourism-operations.module.css";

export function SessionReactivateModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => boolean;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const ok = onConfirm(password);
    if (ok) return;
    setError("Contraseña incorrecta. Vuelve a intentarlo.");
  }

  return (
    <div className={styles.reactivateOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.reactivateDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.reactivateKicker}>Cupo de esta sesión</p>
        <h3 className={styles.reactivateTitle} id={titleId}>
          Reactivar conversación
        </h3>
        <p className={styles.reactivateLead}>
          El cupo llegó a cero. Con la contraseña de reactivación recuperas {SESSION_QUOTA} unidades; el chat y la base
          de datos de esta sesión se conservan.
        </p>
        <form className={styles.reactivateForm} onSubmit={submit}>
          <label className={styles.reactivateLabel} htmlFor={`${titleId}-pwd`}>
            Contraseña de reactivación
          </label>
          <input
            ref={inputRef}
            id={`${titleId}-pwd`}
            type="password"
            className={styles.reactivateInput}
            value={password}
            autoComplete="off"
            placeholder="Escribe la contraseña"
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
          />
          {error ? (
            <p className={styles.reactivateError} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.reactivateActions}>
            <button type="button" className={styles.reactivateCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.reactivateConfirm}>
              Reactivar cupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
