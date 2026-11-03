"use client";

import type { SolutionSectionSpec } from "@/lib/site/solution-slot";
import { solutionSlotKicker } from "@/lib/site/demo-chat";
import type { TemplateId } from "@/types/site";
import { AgendaChat, TableChat } from "./CatalogDemoChat";
import styles from "./solution-slot.module.css";

/** Hueco del catálogo: chat guiado de demostración. El asistente con modelo vive aparte. */
export function SolutionSlot({
  spec,
  tone,
  companyName,
  headingId = "solution-slot-title",
  kicker,
  bridge,
}: {
  spec: SolutionSectionSpec;
  tone: TemplateId;
  companyName?: string;
  headingId?: string;
  kicker?: string;
  bridge?: string;
}) {
  const agenda = spec.action === "agenda" && (spec.choices?.length ?? 0) > 0;
  const label = kicker ?? solutionSlotKicker(spec.action);

  return (
    <section className={`${styles.slot} ${styles[tone]}`} aria-labelledby={headingId}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.kicker}>{label}</p>
          {bridge ? <p className={styles.bridge}>{bridge}</p> : null}
          <h2 id={headingId} className={styles.title}>
            {spec.visitorTitle}
          </h2>
          <p className={styles.change}>{spec.businessChange}</p>
        </header>
        {agenda ? (
          <AgendaChat key={spec.visitorTitle} spec={spec} companyName={companyName} />
        ) : (
          <TableChat key={`${spec.action}-${spec.visitorTitle}`} spec={spec} companyName={companyName} />
        )}
      </div>
    </section>
  );
}
