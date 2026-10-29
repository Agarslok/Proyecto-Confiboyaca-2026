"use client";

import { useSyncExternalStore } from "react";
import { getStandSector } from "@/features/stand/sectors";
import { readStandSector } from "@/features/stand/stand-session";

function subscribe(listener: () => void): () => void {
  window.addEventListener("storage", listener);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("focus", listener);
  };
}

export function StandSectorNote() {
  const sectorId = useSyncExternalStore(subscribe, readStandSector, () => null);
  const sector = getStandSector(sectorId);

  if (!sector) {
    return (
      <p className="banner" role="status">
        Todavía no hay un sector de stand guardado en esta pestaña. Puede continuar el diagnóstico o volver a elegirlo.
      </p>
    );
  }

  return (
    <p className="banner" role="note">
      Sector del stand: {sector.label}. {sector.engineNote}
    </p>
  );
}
