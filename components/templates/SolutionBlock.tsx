import type { ReactNode } from "react";
import styles from "./solution-slot.module.css";
import { catalogSecond } from "@/lib/radar/presentation";
import type { IndustryId } from "@/lib/radar/types";
import type { SolutionHoleSpec, SolutionSectionSpec } from "@/lib/site/solution-slot";
import type { SiteConfig, TemplateId } from "@/types/site";
import { SolutionAssistantSlot } from "@/components/templates/SolutionAssistantSlot";
import { SolutionPlaceholder } from "@/components/templates/SolutionPlaceholder";
import { SolutionSlot } from "@/components/templates/SolutionSlot";

/** Segunda pieza del diagnóstico, solo si el widget no repite el que ya se muestra. */
function companionOf(
  solution: SolutionHoleSpec,
  site?: Pick<SiteConfig, "companyName" | "industryId" | "activityId" | "radar">,
): { spec: SolutionSectionSpec; note: string } | null {
  if (solution.action === "asistente") return null;
  const radar = site?.radar;
  if (!radar) return null;
  return catalogSecond(
    {
      companyName: site?.companyName ?? "",
      industryId: (site?.industryId || "") as IndustryId | "",
      activityId: site?.activityId ?? "",
      activityLabel: radar.activityLabel,
      vocab: { productos: "productos", clientes: "clientes", punto: "sede" },
      central: radar.central,
      dimensions: radar.dimensions,
      findings: radar.findings,
    },
    solution.action,
  );
}

/** Segundo bloque bajo la portada: spec guardado, o placeholder mientras no hay diagnóstico. */
export function SolutionBlock({
  solution,
  tone,
  site,
  slotId,
}: {
  solution?: SolutionHoleSpec;
  tone: TemplateId;
  site?: Pick<SiteConfig, "companyName" | "recordCode" | "industryId" | "activityId" | "radar">;
  /** Si hay varios huecos en la misma página, evita ids repetidos. */
  slotId?: string;
}) {
  const wrap = (child: ReactNode) => (
    <div id={slotId ?? "solucion-hueco"} className={styles.hueco}>
      {child}
    </div>
  );
  const titleId = slotId ? `${slotId}-title` : "solution-slot-title";
  const companionId = slotId ? `${slotId}-companion` : "solution-companion-title";

  if (!solution) {
    return wrap(<SolutionPlaceholder tone={tone} />);
  }
  if (solution.action === "asistente") {
    return wrap(<SolutionAssistantSlot spec={solution} tone={tone} site={site} />);
  }
  const companion = companionOf(solution, site);
  return wrap(
    <>
      <SolutionSlot spec={solution} tone={tone} companyName={site?.companyName} headingId={titleId} />
      {companion ? (
        <SolutionSlot
          spec={companion.spec}
          tone={tone}
          companyName={site?.companyName}
          headingId={companionId}
          kicker="También para este negocio"
          bridge={companion.note}
        />
      ) : null}
    </>,
  );
}
