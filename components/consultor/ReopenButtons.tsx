"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadSavedRadar } from "@/lib/radar/store";
import type { RadarAnswers } from "@/lib/radar/types";

/** Carga el diagnóstico guardado en este navegador y abre el resultado, la página web o el flyer. */
export function ReopenButtons({ answers }: { answers: RadarAnswers }) {
  const router = useRouter();
  const [error, setError] = useState("");

  function open(path: string) {
    if (!loadSavedRadar(answers)) {
      setError("No se pudo reconstruir el diagnóstico con estas respuestas.");
      return;
    }
    router.push(path);
  }

  return (
    <div className="consultor-actions">
      <button type="button" className="btn btn-primary" onClick={() => open("/resultado")}>Abrir diagnóstico completo</button>
      <button type="button" className="btn btn-ghost" onClick={() => open("/flyer")}>Flyer en PDF</button>
      <button type="button" className="btn btn-ghost" onClick={() => open("/sitio")}>Ver su página web</button>
      <button type="button" className="btn btn-ghost" onClick={() => open("/diagnostico")}>Editar respuestas</button>
      {error ? <p className="err" role="alert">{error}</p> : null}
    </div>
  );
}
