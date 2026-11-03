"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteTemplateView } from "@/components/templates/SiteTemplateView";
import {
  buildCatalogConfig,
  CATALOG_HOLES,
  CATALOG_SECTORS,
  type CatalogSector,
} from "@/lib/site/solution-catalog";
import type { SketchHoleId } from "@/lib/radar/presentation";
import styles from "./solution-catalog-sketch.module.css";

export function SolutionCatalogSketch() {
  const [sectorIndex, setSectorIndex] = useState(0);
  const [holeId, setHoleId] = useState<SketchHoleId>("agenda");

  const sector: CatalogSector = CATALOG_SECTORS[sectorIndex] ?? CATALOG_SECTORS[0]!;
  const config = useMemo(() => buildCatalogConfig(sector, holeId), [sector, holeId]);

  useEffect(() => {
    const target = document.getElementById("solucion-hueco");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectorIndex, holeId]);

  return (
    <div className={styles.page}>
      <SiteTemplateView config={config} />
      <div className={styles.dock} aria-label="Catálogo de soluciones">
        <p className={styles.kicker}>Plantilla</p>
        <div className={styles.row} role="tablist" aria-label="Sector o plantilla">
          {CATALOG_SECTORS.map((item, index) => (
            <button
              key={item.sectorId}
              type="button"
              role="tab"
              aria-selected={index === sectorIndex}
              className={index === sectorIndex ? styles.on : undefined}
              onClick={() => setSectorIndex(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className={styles.kicker}>Solución en el hueco</p>
        <div className={styles.row} role="tablist" aria-label="Tipo de solución">
          {CATALOG_HOLES.map((hole) => (
            <button
              key={hole.id}
              type="button"
              role="tab"
              aria-selected={hole.id === holeId}
              className={hole.id === holeId ? styles.on : undefined}
              onClick={() => setHoleId(hole.id)}
            >
              {hole.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
