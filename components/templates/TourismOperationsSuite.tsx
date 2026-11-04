"use client";

import type { SiteConfig } from "@/types/site";
import { OperationsSuite } from "@/components/templates/OperationsSuite";

/** Turismo usa el mismo motor. La diferencia está en la configuración sectorial. */
export function TourismOperationsSuite({ config }: { config: SiteConfig }) {
  return <OperationsSuite config={config} />;
}
