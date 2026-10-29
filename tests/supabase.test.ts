import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRadarAnswers, screensFor } from "../lib/radar/engine";
import type { RadarAnswers } from "../lib/radar/types";
import { createSupabaseStore } from "../lib/store/supabase";

/* ============================================================================
   Imitación en memoria de la API REST de Supabase (PostgREST), con lo que usa
   el adaptador: select, eq, or(...eq/ilike), order, limit/offset, conteo
   exacto, PATCH/DELETE con filtro y 409 si se repite una clave única.
   No reemplaza probar contra un Supabase real; verifica cómo se arman las
   consultas y cómo se leen las respuestas.
   ========================================================================== */

type Row = Record<string, unknown>;

function fakeSupabase(maxRows = 1000, key = "sb_secret_prueba") {
  const tables: Record<string, Row[]> = { diagnoses: [], diagnoses_backup: [] };
  const calls: string[] = [];

  function matches(row: Row, params: URLSearchParams): boolean {
    for (const [key, value] of params) {
      if (["select", "order", "limit", "offset"].includes(key)) continue;
      if (key === "or") {
        const parts = value.slice(1, -1).split(",");
        const ok = parts.some((part) => {
          const [field, op, ...rest] = part.split(".");
          const target = rest.join(".");
          if (op === "eq") return String(row[field]) === target;
          if (op === "ilike") return String(row[field] ?? "").toLowerCase().includes(target.replace(/\*/g, "").toLowerCase());
          return false;
        });
        if (!ok) return false;
        continue;
      }
      const [op, ...rest] = value.split(".");
      const target = rest.join(".");
      if (op === "eq" && String(row[key]) !== target) return false;
      if (op === "not" && value === "not.is.null" && row[key] == null) return false;
    }
    return true;
  }

  const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const table = url.pathname.split("/").pop()!;
    const method = init.method ?? "GET";
    const headers = new Headers(init.headers);
    calls.push(`${method} ${table}`);
    assert.equal(headers.get("apikey"), key);
    /* Solo las llaves JWT antiguas van también como Bearer. */
    assert.equal(headers.get("authorization"), key.startsWith("eyJ") ? `Bearer ${key}` : null);
    const rows = tables[table];
    const params = url.searchParams;

    if (method === "POST") {
      const incoming = [JSON.parse(String(init.body))].flat() as Row[];
      for (const row of incoming) {
        if (table === "diagnoses" && rows.some((other) => other.id === row.id || other.code === row.code)) {
          return new Response('{"code":"23505"}', { status: 409 });
        }
      }
      rows.push(...incoming);
      return new Response(null, { status: 201 });
    }
    const selected = rows.filter((row) => matches(row, params));
    if (method === "PATCH") {
      const patch = JSON.parse(String(init.body)) as Row;
      selected.forEach((row) => Object.assign(row, patch));
      return new Response(JSON.stringify(selected.map((row) => ({ id: row.id }))), { status: 200 });
    }
    if (method === "DELETE") {
      tables[table] = rows.filter((row) => !selected.includes(row));
      return new Response(null, { status: 204 });
    }
    const [field, direction] = (params.get("order") ?? "created_at.asc").split(".");
    selected.sort((a, b) => String(a[field]).localeCompare(String(b[field])) * (direction === "desc" ? -1 : 1));
    const offset = Number(params.get("offset") ?? 0);
    const limit = Math.min(maxRows, Number(params.get("limit") ?? maxRows));
    const page = selected.slice(offset, offset + limit);
    const responseHeaders = new Headers({ "content-type": "application/json" });
    if (headers.get("prefer")?.includes("count=exact")) responseHeaders.set("content-range", `${offset}-${offset + page.length - 1}/${selected.length}`);
    return new Response(JSON.stringify(page), { status: 200, headers: responseHeaders });
  }) as typeof fetch;

  return { tables, calls, store: createSupabaseStore("https://ejemplo.supabase.co/", key, fetchImpl) };
}

function complete(overrides: Partial<RadarAnswers> = {}): RadarAnswers {
  let answers: RadarAnswers = {
    ...emptyRadarAnswers(),
    companyName: "Panadería Carlitos", city: "Tunja", contactName: "Carlos", contactLastName: "Rodríguez",
    email: "carlos@ejemplo.co", phone: "300 123 4567", size: "micro", industry: "alimentos",
    activity: "alimentos-produccion", goals: ["costos"], consent: true, ...overrides,
  };
  for (let round = 0; round < 3; round += 1) {
    for (const screen of screensFor(answers)) {
      if (screen.kind === "question") answers = { ...answers, choices: { ...answers.choices, [screen.question.id]: "A" } };
    }
  }
  return answers;
}

describe("almacén en Supabase", () => {
  it("guarda con las columnas calculadas en el servidor y lo recupera por id o código", async () => {
    const { store, tables } = fakeSupabase();
    const saved = await store.save(complete());
    assert.ok(saved.ok);
    if (!saved.ok) return;
    const row = tables.diagnoses[0];
    assert.equal(row.level, "alto");
    assert.equal(row.contact_name, "Carlos Rodríguez");
    assert.notEqual(row.edit_token_hash, saved.editToken);
    assert.equal((await store.get(saved.id))?.companyName, "Panadería Carlitos");
    assert.equal((await store.get(saved.code.toLowerCase()))?.id, saved.id);
  });

  it("busca, filtra y cuenta con content-range", async () => {
    const { store } = fakeSupabase();
    await store.save(complete());
    await store.save(complete({ companyName: "Hotel Paipa", city: "Paipa" }));
    assert.equal((await store.list({ search: "paipa" })).total, 1);
    /* Comas y paréntesis romperían el filtro or=(...): se limpian antes de consultar. */
    assert.equal((await store.list({ search: "carlitos,(" })).items[0]?.companyName, "Panadería Carlitos");
    assert.equal((await store.list({ level: "alto" })).total, 2);
    assert.equal((await store.stats()).byLevel.alto, 2);
  });

  it("solo actualiza con el token correcto; seguimiento y estado", async () => {
    const { store } = fakeSupabase();
    const saved = await store.save(complete());
    assert.ok(saved.ok);
    if (!saved.ok) return;
    assert.equal((await store.save(complete({ city: "Duitama" }), { id: saved.id, editToken: "otro" })).ok, false);
    assert.equal((await store.save(complete({ city: "Duitama" }), { id: saved.id, editToken: saved.editToken })).ok, true);
    assert.equal(await store.requestFollowUp(saved.id, "otro"), false);
    assert.equal(await store.requestFollowUp(saved.id, saved.editToken), true);
    assert.equal((await store.stats()).interested, 1);
    assert.equal(await store.setStatus(saved.id, "visita", "Jueves"), true);
    assert.equal(await store.setStatus("no-existe", "visita", ""), false);
    const record = await store.get(saved.id);
    assert.equal(record?.city, "Duitama");
    assert.equal(record?.notes, "Jueves");
  });

  it("trae todo por páginas aunque Supabase entregue máximo N filas", async () => {
    const { store } = fakeSupabase(2);
    for (const name of ["Uno", "Dos", "Tres", "Cuatro", "Cinco"]) await store.save(complete({ companyName: `Empresa ${name}` }));
    assert.equal((await store.all()).length, 5);
    assert.equal((await store.stats()).total, 5);
  });

  it("con una llave JWT antigua también manda Authorization: Bearer", async () => {
    const { store } = fakeSupabase(1000, "eyJantigua.service.role");
    assert.ok((await store.save(complete())).ok);
  });

  it("reiniciar copia a la tabla de respaldo y luego borra", async () => {
    const { store, tables, calls } = fakeSupabase();
    await store.save(complete());
    await store.save(complete({ companyName: "Otra" }));
    const result = await store.clear();
    assert.equal(result.removed, 2);
    assert.equal(tables.diagnoses.length, 0);
    assert.equal(tables.diagnoses_backup.length, 2);
    assert.ok(calls.indexOf("POST diagnoses_backup") < calls.indexOf("DELETE diagnoses"));
    assert.equal((await store.clear()).removed, 0);
  });
});
