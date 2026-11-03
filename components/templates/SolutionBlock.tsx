import type { ReactNode } from "react";
import styles from "./solution-slot.module.css";
import { catalogSecond, presentationInputFromSite, withCatalogHeadline } from "@/lib/radar/presentation";
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
  const input = site ? presentationInputFromSite(site) : null;
  if (!input) return null;
  return catalogSecond(input, solution.action);
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
  const primary = withCatalogHeadline(solution, site);
  return wrap(
    <>
      <SolutionSlot spec={primary} tone={tone} companyName={site?.companyName} headingId={titleId} />
      {companion ? (
        <SolutionSlot
          spec={withCatalogHeadline(companion.spec, site)}
          tone={tone}
          companyName={site?.companyName}
          headingId={companionId}
          bridge={companion.note}
        />
      ) : null}
    </>,
  );
}
