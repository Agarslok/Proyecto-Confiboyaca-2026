"use client";

import { useActionState, useState } from "react";
import { resetAllDiagnoses } from "@/app/actions/radar";

const EXPORTS = [
  { href: "/consultor/exportar?formato=xlsx", label: "Excel (.xlsx)", primary: true },
  { href: "/consultor/exportar?formato=csv", label: "CSV para Excel en español (;)" },
  { href: "/consultor/exportar?formato=csv-coma", label: "CSV estándar (,)" },
  { href: "/consultor/exportar?formato=csv&hoja=respuestas", label: "CSV de respuestas" },
];

/** Exportar a Excel / CSV y reiniciar la base (con respaldo). */
export function DataTools({ total }: { total: number }) {
  const [state, action, pending] = useActionState(resetAllDiagnoses, {});
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  return (
    <section className="card consultor-tools" aria-labelledby="tools-title">
      <div>
        <h2 id="tools-title">Exportar</h2>
        <p className="fine">Todos los diagnósticos guardados ({total}). Excel trae dos hojas: «Diagnósticos» (una fila por empresa) y «Respuestas» (cada pregunta, para análisis).</p>
        {/* Descargas de archivos: <a download>, no <Link>, que navegaría dentro de la app. */}
        <div className="consultor-tools-row">
          {EXPORTS.map((item) => (
            <a key={item.href} className={item.primary ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"} href={item.href} download>
              {item.label}
            </a>
          ))}
        </div>
        <p className="fine">Para un PDF por empresa, abra el diagnóstico y use «Flyer en PDF».</p>
      </div>

      <div className="consultor-danger">
        <h2>Reiniciar la base</h2>
        <p className="fine">Borra todos los diagnósticos para empezar de cero (por ejemplo, antes del despliegue final). Antes se guarda una copia completa de respaldo en el servidor; descargue también el Excel.</p>
        {!open ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} disabled={total === 0}>
            Reiniciar la base…
          </button>
        ) : (
          <form action={action} className="consultor-danger-form">
            <label>
              <span className="fine">Escriba <strong>BORRAR</strong> para confirmar</span>
              <input name="confirm" className="text-in sm" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" />
            </label>
            <div className="consultor-tools-row">
              <button type="submit" className="btn btn-danger btn-sm" disabled={confirm.trim() !== "BORRAR" || pending}>
                {pending ? "Borrando…" : `Borrar ${total} diagnósticos`}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setConfirm(""); }}>Cancelar</button>
            </div>
          </form>
        )}
        {state.done ? <p className="fine" role="status">{state.done}</p> : null}
        {state.error ? <p className="err" role="alert">{state.error}</p> : null}
      </div>
    </section>
  );
}
