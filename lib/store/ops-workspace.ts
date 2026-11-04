import { randomUUID } from "node:crypto";
import type { CrmSessionSnapshot } from "@/lib/assistant/crm-state";
import type { OpsChatSession } from "@/lib/assistant/session-quota";

/**
 * Copia de la operación de una empresa en Supabase.
 * La fila vigente está en ops_workspaces; cada guardado deja además una fila
 * en ops_workspaces_backup. RLS sin políticas: solo el servidor, con la llave secreta.
 */

export type OpsWorkspacePayload = {
  workspaceId: string;
  companyName: string;
  industryId: string;
  activityId: string;
  recordCode: string;
  crm: CrmSessionSnapshot;
  chat: OpsChatSession;
};

export type OpsWorkspaceRecord = OpsWorkspacePayload & { updatedAt: string };

type FetchImpl = typeof fetch;

function credentials(): { url: string; key: string } | null {
  if ((process.env.RADAR_STORE || "sqlite").toLowerCase() !== "supabase") return null;
  const url = process.env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, "") ?? "";
  const key = process.env.SUPABASE_SECRET_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!url || !key) return null;
  return { url, key };
}

async function request(
  url: string,
  key: string,
  path: string,
  init: RequestInit & { prefer?: string } = {},
  fetchImpl: FetchImpl,
): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: key,
    ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
    "Content-Type": "application/json",
    ...(init.prefer ? { Prefer: init.prefer } : {}),
  };
  const response = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    const missing = response.status === 404 || /ops_workspaces/i.test(body.message ?? "");
    const hint = missing
      ? " Falta crear las tablas: vuelva a correr supabase/schema.sql en el SQL Editor."
      : "";
    throw new Error(`Supabase ${response.status}: ${(body.message || "no se pudo guardar").slice(0, 220)}${hint}`);
  }
  return response;
}

function rowFrom(payload: OpsWorkspacePayload, updatedAt: string) {
  return {
    workspace_id: payload.workspaceId,
    company_name: payload.companyName,
    industry_id: payload.industryId,
    activity_id: payload.activityId,
    record_code: payload.recordCode,
    crm: payload.crm,
    chat: payload.chat,
    updated_at: updatedAt,
  };
}

export async function saveOpsWorkspace(
  payload: OpsWorkspacePayload,
  fetchImpl: FetchImpl = fetch,
): Promise<{ ok: true; updatedAt: string; skipped?: boolean } | { ok: false; message: string }> {
  const auth = credentials();
  if (!auth) return { ok: true, updatedAt: new Date().toISOString(), skipped: true };
  const updatedAt = new Date().toISOString();
  const row = rowFrom(payload, updatedAt);
  try {
    await request(
      auth.url,
      auth.key,
      "/ops_workspaces_backup",
      {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({
          backup_id: randomUUID(),
          workspace_id: row.workspace_id,
          company_name: row.company_name,
          industry_id: row.industry_id,
          activity_id: row.activity_id,
          record_code: row.record_code,
          crm: row.crm,
          chat: row.chat,
          saved_at: updatedAt,
        }),
      },
      fetchImpl,
    );
    await request(
      auth.url,
      auth.key,
      "/ops_workspaces?on_conflict=workspace_id",
      {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify(row),
      },
      fetchImpl,
    );
    return { ok: true, updatedAt };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo guardar en la base." };
  }
}

export async function readOpsWorkspace(
  workspaceId: string,
  fetchImpl: FetchImpl = fetch,
): Promise<OpsWorkspaceRecord | null> {
  const auth = credentials();
  if (!auth) return null;
  const filter = `eq.${encodeURIComponent(`"${workspaceId.replace(/"/g, "")}"`)}`;
  const response = await request(
    auth.url,
    auth.key,
    `/ops_workspaces?workspace_id=${filter}&select=workspace_id,company_name,industry_id,activity_id,record_code,crm,chat,updated_at&limit=1`,
    { method: "GET" },
    fetchImpl,
  );
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row) return null;
  const chat = row.chat as OpsChatSession;
  if (!chat || !Array.isArray(chat.thread) || typeof chat.used !== "number") return null;
  if (!row.crm || typeof row.crm !== "object" || Array.isArray(row.crm)) return null;
  return {
    workspaceId: String(row.workspace_id ?? workspaceId),
    companyName: String(row.company_name ?? ""),
    industryId: String(row.industry_id ?? ""),
    activityId: String(row.activity_id ?? ""),
    recordCode: String(row.record_code ?? ""),
    crm: row.crm as CrmSessionSnapshot,
    chat: { used: chat.used, thread: chat.thread },
    updatedAt: String(row.updated_at ?? ""),
  };
}
