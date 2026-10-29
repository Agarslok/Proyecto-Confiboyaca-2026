"use client";

import { useSyncExternalStore } from "react";
import { SolutionSpotlight } from "@/components/radar/SolutionSpotlight";
import { SiteTemplateView } from "@/components/templates/SiteTemplateView";
import {
  ensureSiteLoaded,
  getSiteServerSnapshot,
  getSiteSnapshot,
  subscribeSite,
} from "@/lib/session/site-session";

function useSiteSnapshot() {
  return useSyncExternalStore(subscribeSite, getSiteSnapshot, getSiteServerSnapshot);
}

export function StandaloneSitePage() {
  ensureSiteLoaded();
  const state = useSiteSnapshot();
  const config = state.config;

  if (!config) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 480 }}>
        <h1>Página no disponible</h1>
        <p>
          No hay una página generada guardada en este navegador. Complete el formulario y genere la consultoría
          primero.
        </p>
      </main>
    );
  }

  return (
    <>
      <SiteTemplateView config={config} />
      {config.radar?.central ? <SolutionSpotlight central={config.radar.central} companyName={config.companyName} /> : null}
    </>
  );
}
