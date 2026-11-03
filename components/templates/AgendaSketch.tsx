"use client";

import { useState } from "react";
import { SiteTemplateView } from "@/components/templates/SiteTemplateView";
import type { SiteConfig } from "@/types/site";
import styles from "./agenda-sketch.module.css";

export function AgendaSketch({ sites }: { sites: { label: string; config: SiteConfig }[] }) {
  const [index, setIndex] = useState(0);
  const current = sites[index] ?? sites[0];
  if (!current) return null;

  return (
    <div className={styles.page}>
      <SiteTemplateView config={current.config} />
      <div className={styles.bar} role="tablist" aria-label="Plantilla del boceto">
        {sites.map((site, i) => (
          <button
            key={site.label}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={i === index ? styles.on : undefined}
            onClick={() => {
              setIndex(i);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {site.label}
          </button>
        ))}
      </div>
    </div>
  );
}
