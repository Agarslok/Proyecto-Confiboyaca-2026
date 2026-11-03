import type { SolutionPresentationBadge as BadgeMeta } from "@/lib/site/solution-presentation";

export function SolutionPresentationBadge({ badge }: { badge: BadgeMeta }) {
  return (
    <span className={`radar-solution-badge is-${badge.tone}`} title="Qué verá el visitante en el hueco bajo la portada">
      {badge.label}
    </span>
  );
}
