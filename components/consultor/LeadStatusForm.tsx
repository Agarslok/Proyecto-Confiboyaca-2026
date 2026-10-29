"use client";

import { useActionState } from "react";
import { updateLeadStatus } from "@/app/actions/radar";
import { LEAD_LABELS, LEAD_STATUSES, type LeadStatus } from "@/lib/store/lead-status";

/** Estado del seguimiento comercial y notas del equipo sobre esta empresa. */
export function LeadStatusForm({ id, status, notes }: { id: string; status: LeadStatus; notes: string }) {
  const [state, action, pending] = useActionState(updateLeadStatus, {});
  return (
    <form action={action} className="card consultor-lead">
      <input type="hidden" name="id" value={id} />
      <h2>Seguimiento</h2>
      <div className="consultor-lead-steps" role="radiogroup" aria-label="Estado">
        {LEAD_STATUSES.map((value) => (
          <label key={value} className="consultor-lead-step">
            <input type="radio" name="status" value={value} defaultChecked={value === status} />
            <span>{LEAD_LABELS[value]}</span>
          </label>
        ))}
      </div>
      <label className="consultor-lead-notes">
        <span className="fine">Notas del equipo (llamadas, acuerdos, próxima visita)</span>
        <textarea name="notes" rows={3} defaultValue={notes} className="text-in sm" />
      </label>
      <div className="consultor-lead-save">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Guardando…" : "Guardar seguimiento"}</button>
        {state.saved ? <span className="fine" role="status">Guardado.</span> : null}
        {state.error ? <span className="err" role="alert">{state.error}</span> : null}
      </div>
    </form>
  );
}
