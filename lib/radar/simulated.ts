import type { CaseItem } from "@/lib/radar/types";

/* Serie simulada (base 100): 12 meses de histórico y 6 de proyección con y
   sin la solución. Es ilustrativa; se genera con una semilla por caso. */

function seeded(seed: string): () => number {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return ((hash ^= hash >>> 16) >>> 0) / 4294967296;
  };
}

export function simulatedSeries(item: CaseItem) {
  const random = seeded(item.id);
  const history = Array.from({ length: 12 }, () => 100 + (random() - 0.5) * 12);
  const last = history[history.length - 1];
  const sign = item.better === "menor" ? -1 : 1;
  const gain = 0.18 + random() * 0.14;
  const loss = 0.06 + random() * 0.08;
  const favorable = Array.from({ length: 6 }, (_, i) => last * (1 + sign * gain * ((i + 1) / 6)) + (random() - 0.5) * 3);
  const unfavorable = Array.from({ length: 6 }, (_, i) => last * (1 - sign * loss * ((i + 1) / 6)) + (random() - 0.5) * 3);
  return { history, favorable, unfavorable, change: Math.round(sign * gain * 100) };
}
