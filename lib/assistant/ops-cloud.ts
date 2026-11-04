import type { CrmSessionSnapshot } from "@/lib/assistant/crm-state";
import type { OpsChatSession } from "@/lib/assistant/session-quota";

export type OpsCloudRecord = {
  crm: CrmSessionSnapshot;
  chat: OpsChatSession;
  updatedAt: string;
};

const stampKey = (workspaceId: string) => `ops-cloud:${workspaceId}`;

export function markOpsCloudLocal(workspaceId: string): void {
  try {
    window.localStorage.setItem(stampKey(workspaceId), String(Date.now()));
  } catch {
    /* el espejo en la nube no debe tumbar el guardado local */
  }
}

export function opsCloudLocalStamp(workspaceId: string): number {
  try {
    return Number(window.localStorage.getItem(stampKey(workspaceId)) || 0);
  } catch {
    return 0;
  }
}

export function markOpsCloudSynced(workspaceId: string, updatedAt: string): void {
  const stamp = Date.parse(updatedAt);
  if (!Number.isFinite(stamp)) return;
  try {
    window.localStorage.setItem(stampKey(workspaceId), String(stamp));
  } catch {
    /* ignore */
  }
}

export async function pushOpsCloud(input: {
  workspaceId: string;
  companyName: string;
  industryId: string;
  activityId: string;
  recordCode: string;
  crm: CrmSessionSnapshot;
  chat: OpsChatSession;
}): Promise<{ ok: true; updatedAt: string } | { ok: false; message: string }> {
  const response = await fetch("/api/ops/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; updatedAt?: string };
  if (!response.ok) return { ok: false, message: data.error || "No se pudo copiar a la base." };
  if (data.updatedAt) markOpsCloudSynced(input.workspaceId, data.updatedAt);
  return { ok: true, updatedAt: data.updatedAt || new Date().toISOString() };
}

export async function pullOpsCloud(workspaceId: string): Promise<OpsCloudRecord | null> {
  const response = await fetch(`/api/ops/workspace?workspaceId=${encodeURIComponent(workspaceId)}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { record?: OpsCloudRecord | null };
  return data.record ?? null;
}
