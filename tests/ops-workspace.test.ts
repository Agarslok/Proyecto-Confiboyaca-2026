import assert from "node:assert/strict";
import test from "node:test";
import { readOpsWorkspace, saveOpsWorkspace } from "../lib/store/ops-workspace";

test("guardar operación escribe la fila vigente y una copia de respaldo", async () => {
  const previous = {
    store: process.env.RADAR_STORE,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
  };
  process.env.RADAR_STORE = "supabase";
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_prueba";
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("ops_workspaces?")) {
      return new Response(
        JSON.stringify([
          {
            workspace_id: "RAD-1",
            company_name: "Taller Boyacá",
            industry_id: "manufactura",
            activity_id: "manufactura-planta",
            record_code: "RAD-1",
            crm: { produccion: [{ lote: "3" }] },
            chat: { used: 0, thread: [{ role: "user", text: "lote 3" }] },
            updated_at: "2026-11-04T03:00:00.000Z",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response("", { status: 201 });
  };
  try {
    const saved = await saveOpsWorkspace(
      {
        workspaceId: "RAD-1",
        companyName: "Taller Boyacá",
        industryId: "manufactura",
        activityId: "manufactura-planta",
        recordCode: "RAD-1",
        crm: { produccion: [{ lote: "3" }] },
        chat: { used: 0, thread: [{ role: "user", text: "lote 3" }] },
      },
      fetchImpl,
    );
    assert.equal(saved.ok, true);
    assert.match(calls[0] ?? "", /POST .*ops_workspaces_backup/);
    assert.match(calls[1] ?? "", /POST .*ops_workspaces\?on_conflict=workspace_id/);
    const loaded = await readOpsWorkspace("DEMO:manufactura:planta", fetchImpl);
    assert.equal(loaded?.companyName, "Taller Boyacá");
    assert.equal(loaded?.crm.produccion?.[0]?.lote, "3");
    assert.match(calls[2] ?? "", /workspace_id=eq\.%22DEMO/);
  } finally {
    process.env.RADAR_STORE = previous.store;
    process.env.SUPABASE_URL = previous.url;
    process.env.SUPABASE_SECRET_KEY = previous.key;
  }
});
