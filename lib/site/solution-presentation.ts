import type { PresentationChoice } from "@/lib/radar/presentation";
import type { SolutionHoleSpec } from "@/lib/site/solution-slot";
import { isAssistantSolution, isCatalogSolution } from "@/lib/site/solution-slot";

export type SolutionPresentationBadge = {
  label: "Solución interactiva" | "Asistente virtual";
  tone: "catalogo" | "asistente";
};

/** Lo que verá el visitante en el hueco bajo la portada (spec guardada gana sobre el paso 2). */
export function solutionPresentationBadge(
  spec: SolutionHoleSpec | null | undefined,
  presentation: PresentationChoice | null | undefined,
): SolutionPresentationBadge | null {
  if (spec && isAssistantSolution(spec)) {
    return { label: "Asistente virtual", tone: "asistente" };
  }
  if (spec && isCatalogSolution(spec)) {
    return { label: "Solución interactiva", tone: "catalogo" };
  }
  if (presentation?.mode === "asistente") {
    return { label: "Asistente virtual", tone: "asistente" };
  }
  if (presentation?.mode === "catalogo") {
    return { label: "Solución interactiva", tone: "catalogo" };
  }
  return null;
}

/**
 * Enlace al hueco bajo la portada.
 * Con código RAD abre la página persistida; si aún no hay código, la vista previa
 * de este navegador (/sitio) para no dejar el botón inútil.
 */
export function samplePageHref(recordCode: string | undefined): string {
  const code = recordCode?.trim();
  if (!code) return "/sitio#solucion-hueco";
  return `/s/${code.toUpperCase()}#solucion-hueco`;
}
