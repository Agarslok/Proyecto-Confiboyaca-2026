"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { SiteTemplateView } from "@/components/templates/SiteTemplateView";
import {
  buildShowcaseConfig,
  SHOWCASE_ENTRIES,
  SHOWCASE_HUB_PATH,
  type ShowcaseEntry,
} from "@/lib/site/operations-showcase";
import type { TemplateId } from "@/types/site";
import styles from "@/components/templates/solution-catalog-sketch.module.css";

export function OperationsShowcaseView({ activeId }: { activeId: TemplateId }) {
  const router = useRouter();
  const entry = useMemo(
    () => SHOWCASE_ENTRIES.find((item) => item.templateId === activeId) ?? SHOWCASE_ENTRIES[0]!,
    [activeId],
  );
  const config = useMemo(() => buildShowcaseConfig(entry.templateId), [entry.templateId]);

  useEffect(() => {
    const target = document.getElementById(entry.opsAnchor);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [entry.templateId, entry.opsAnchor]);

  return (
    <div className={styles.page}>
      <SiteTemplateView config={config} />
      <div className={styles.dock} aria-label="Vitrina de plantillas operativas">
        <p className={styles.kicker}>
          Solución única · Asistente + Base de datos + Dashboard ·{" "}
          <Link href={SHOWCASE_HUB_PATH} style={{ color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}>
            Índice
          </Link>
        </p>
        <div className={styles.row} role="tablist" aria-label="Plantilla del sitio">
          {SHOWCASE_ENTRIES.map((item) => (
            <button
              key={item.templateId}
              type="button"
              role="tab"
              aria-selected={item.templateId === entry.templateId}
              className={item.templateId === entry.templateId ? styles.on : undefined}
              onClick={() => router.push(`/boceto/plantillas/${item.templateId}`)}
            >
              {item.sector.label}
            </button>
          ))}
        </div>
        <p className={styles.kicker} style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
          {entry.sector.companyName} · {entry.sector.activityLabel}
        </p>
      </div>
    </div>
  );
}

export function OperationsShowcaseHub() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 80px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#64748b" }}>
        Boceto · operaciones
      </p>
      <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", margin: "8px 0 12px", lineHeight: 1.2 }}>
        Todas las plantillas con la solución incrementada
      </h1>
      <p style={{ color: "#475569", lineHeight: 1.55, marginBottom: 32 }}>
        Mismo motor en las seis vistas: conversación, registro validado, base de datos y dashboard sectorial. Usa el dock
        inferior para cambiar de plantilla sin salir del boceto.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
        {SHOWCASE_ENTRIES.map((item: ShowcaseEntry) => (
          <li key={item.templateId}>
            <Link
              href={`/boceto/plantillas/${item.templateId}`}
              style={{
                display: "block",
                padding: "16px 18px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                color: "#0f172a",
              }}
            >
              <strong style={{ display: "block", marginBottom: 4 }}>{item.label}</strong>
              <span style={{ fontSize: 14, color: "#64748b" }}>
                {item.sector.companyName} — {item.sector.activityLabel}
              </span>
              <span style={{ display: "block", marginTop: 8, fontSize: 13, color: "#2563eb" }}>
                Abrir plantilla →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 28, fontSize: 13, color: "#94a3b8" }}>
        Atajo legacy: <Link href="/boceto/turismo-operaciones">/boceto/turismo-operaciones</Link> (solo hotel).
      </p>
    </main>
  );
}
