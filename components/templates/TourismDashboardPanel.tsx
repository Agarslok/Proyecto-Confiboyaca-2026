"use client";

import { CrmOperationsDashboard } from "@/components/templates/CrmOperationsDashboard";
import type { CrmEntityState } from "@/lib/assistant/crm-state";
import type { DashboardBinding, DashboardCopy } from "@/lib/ops/sector/types";

/** Tablero conectado al CRM operativo (misma fuente que Base de datos). */
export function TourismDashboardPanel({
  entities,
  sectorLabel,
  binding,
  copy,
  exampleOperations,
  onTryInAssistant,
}: {
  entities: CrmEntityState[];
  sectorLabel: string;
  binding?: DashboardBinding | null;
  copy?: DashboardCopy;
  exampleOperations?: string[];
  onTryInAssistant?: (starter: string) => void;
}) {
  return (
    <CrmOperationsDashboard
      entities={entities}
      sectorLabel={sectorLabel}
      binding={binding}
      copy={copy}
      exampleOperations={exampleOperations}
      onTryInAssistant={onTryInAssistant}
    />
  );
}
