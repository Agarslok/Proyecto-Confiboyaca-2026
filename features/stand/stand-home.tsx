"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { selectIndustry, setWalkthroughStep } from "@/lib/session/browser-session";
import { STAND_SECTORS, type StandSectorId } from "@/features/stand/sectors";
import { readStandSector, writeStandSector } from "@/features/stand/stand-session";

function subscribeStandSector(): () => void {
  return () => {};
}

export function StandHome() {
  const router = useRouter();
  const storedSector = useSyncExternalStore(subscribeStandSector, readStandSector, () => null);
  const [override, setOverride] = useState<StandSectorId | null>(null);
  const sectorId = override ?? storedSector;
  const selected = STAND_SECTORS.find((sector) => sector.id === sectorId) ?? null;

  function continueToDiagnosis() {
    if (!selected) return;
    writeStandSector(selected.id);
    selectIndustry(selected.industryId);
    setWalkthroughStep(0);
    router.push("/stand/diagnostico");
  }

  return (
    <section aria-labelledby="stand-title">
      <p className="eyebrow">Stand</p>
      <h1 id="stand-title" className="display section-title">
        Trae el problema de tu empresa
      </h1>
      <p className="lead">
        Elige un sector y continúa al diagnóstico. El motor actual trabaja con reglas locales. Las cifras de la
        demostración son ficticias.
      </p>
      <div className="stand-sectors" role="radiogroup" aria-label="Sector de la empresa">
        {STAND_SECTORS.map((sector) => {
          const isSelected = sector.id === sectorId;
          return (
            <button
              key={sector.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={isSelected ? "card stand-sector is-selected" : "card stand-sector"}
              onClick={() => setOverride(sector.id)}
            >
              <span className="h3">{sector.label}</span>
              <span>{sector.summary}</span>
            </button>
          );
        })}
      </div>
      {selected ? (
        <p className="banner" role="status">
          {selected.engineNote}
        </p>
      ) : null}
      <div className="experience-actions">
        <button type="button" className="btn btn-primary" disabled={!selected} onClick={continueToDiagnosis}>
          Continuar al diagnóstico
        </button>
      </div>
    </section>
  );
}
