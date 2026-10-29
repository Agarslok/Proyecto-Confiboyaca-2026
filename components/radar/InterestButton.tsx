"use client";

import { useState } from "react";
import { requestFollowUp } from "@/app/actions/radar";
import { useSite } from "@/components/site/useSite";
import { patchRadar, radarOf } from "@/lib/radar/store";

/** «Quiero que me llamen»: marca el diagnóstico como interesado para el equipo. */
export function InterestButton({ plan }: { plan: string }) {
  const radar = radarOf(useSite());
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const done = Boolean(radar.followUpRequested);

  if (done) {
    return (
      <p className="radar-interest-done" role="status">
        ✓ Listo. Le llamaremos al <strong>{radar.phone}</strong> para agendar la primera visita del {plan}.
      </p>
    );
  }

  const canSend = Boolean(radar.recordId && radar.editToken);
  return (
    <div className="radar-interest">
      <button
        type="button"
        className="btn btn-primary btn-lg"
        disabled={!canSend || state === "sending"}
        onClick={async () => {
          if (!radar.recordId || !radar.editToken) return;
          setState("sending");
          const ok = await requestFollowUp(radar.recordId, radar.editToken);
          if (ok) patchRadar({ followUpRequested: true });
          setState(ok ? "idle" : "error");
        }}
      >
        {state === "sending" ? "Enviando…" : "Sí, quiero que me llamen"}
      </button>
      {!canSend ? <p className="fine">Disponible cuando el diagnóstico quede guardado.</p> : null}
      {state === "error" ? <p className="err" role="alert">No se pudo enviar. Intente de nuevo en un momento.</p> : null}
    </div>
  );
}
