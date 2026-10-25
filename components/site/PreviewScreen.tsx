"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GeneratedSite } from "@/components/site/GeneratedSite";
import { useSite } from "@/components/site/useSite";
import { rebuildSiteConfig, resetSite } from "@/lib/session/site-session";

export function PreviewScreen() {
  const router = useRouter();
  const state = useSite();
  const [frame, setFrame] = useState<"desktop" | "mobile">("desktop");
  const [notice, setNotice] = useState("");

  if (!state.config) {
    return (
      <section className="wrap empty-state">
        <p className="micro accent">Página generada</p>
        <h1 className="display r-title">No hay una configuración para mostrar</h1>
        <p className="lead sm">
          Termine el formulario para construir la página. Si ya lo había hecho en otro navegador, hay que repetirlo: los
          datos no salen de este equipo.
        </p>
        <div className="w-actions">
          <Button href="/diagnostico">Ir al formulario</Button>
          <Button href="/resultado" variant="secondary">Volver al diagnóstico</Button>
        </div>
      </section>
    );
  }

  function regenerate() {
    const config = rebuildSiteConfig();
    setNotice(
      config
        ? "La página se volvió a construir con las respuestas guardadas."
        : "Faltan respuestas para regenerar. Vuelva al formulario.",
    );
  }

  function restart() {
    const accepted = window.confirm("Se borrará el formulario y la página guardados en este navegador.");
    if (!accepted) return;
    resetSite();
    router.push("/");
  }

  return (
    <section className="wrap demo">
      <div>
        <p className="micro accent">Vista previa</p>
        <h1 className="display d-title">Página de {state.config.companyName}</h1>
        <p className="demo-explain">
          {state.config.templateLabel} · {state.config.sectorLabel}
        </p>
      </div>

      <div className="card demo-card">
        <div className="demo-body">
          <div className="demo-toolbar">
            <div className="filters" role="group" aria-label="Ancho de la vista previa">
              <button
                type="button"
                className={frame === "desktop" ? "filter on" : "filter"}
                onClick={() => setFrame("desktop")}
              >
                Escritorio
              </button>
              <button
                type="button"
                className={frame === "mobile" ? "filter on" : "filter"}
                onClick={() => setFrame("mobile")}
              >
                Móvil
              </button>
            </div>
            <div className="w-actions" style={{ margin: 0 }}>
              <Button href="/resultado" variant="secondary">Diagnóstico</Button>
              <Button href="/diagnostico" variant="secondary">Editar</Button>
              <Button href="/sitio" target="_blank" rel="noopener noreferrer" variant="secondary">
                Abrir en una nueva pestaña
              </Button>
              <Button type="button" variant="ghost" onClick={regenerate}>Regenerar</Button>
              <Button type="button" variant="ghost" onClick={restart}>Reiniciar</Button>
            </div>
          </div>
          {notice ? <p className="banner" role="status">{notice}</p> : null}
          <div className={frame === "mobile" ? "preview-frame is-mobile" : "preview-frame"}>
            <GeneratedSite config={state.config} />
          </div>
        </div>
      </div>
    </section>
  );
}
