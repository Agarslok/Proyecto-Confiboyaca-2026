import { randomUUID } from "node:crypto";
import type { LevelId } from "@/lib/radar/types";
import { LEAD_STATUSES } from "@/lib/store/lead-status";
import {
  columnsFor,
  emptyStats,
  hashToken,
  newCode,
  newEditToken,
  toRecord,
  toSummary,
  tokenMatches,
  validateForStorage,
  type DiagnosisRecord,
  type DiagnosisStore,
  type Row,
} from "@/lib/store/shared";

/* ============================================================================
   Almacén en Supabase (Postgres), para publicar en Netlify.

   Usa la API REST de Supabase con la llave secreta del proyecto
   (SUPABASE_SECRET_KEY: la nueva sb_secret_… o la antigua service_role),
   que solo existe en el servidor. La tabla tiene RLS
   activado y sin políticas: con la llave pública nadie puede leerla.
   El esquema está en supabase/schema.sql.
   ========================================================================== */

type Fetch = typeof fetch;

export class SupabaseError extends Error {}

const PAGE = 1000;

/** Quita lo que rompe un filtro de PostgREST (comas, paréntesis, comillas, comodines). */
function safeTerm(value: string): string {
  return value.replace(/[,()"*\\:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function createSupabaseStore(url: string, key: string, fetchImpl: Fetch = fetch): DiagnosisStore {
  const base = `${url.replace(/\/$/, "")}/rest/v1`;

  async function request(path: string, init: RequestInit & { prefer?: string } = {}) {
    const headers: Record<string, string> = {
      apikey: key,
      /* Llaves antiguas (JWT «service_role», empiezan con eyJ) también van como Bearer.
         Las nuevas (sb_secret_…) solo en apikey: Supabase las cambia por un JWT. */
      ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    };
    const response = await fetchImpl(`${base}${path}`, { ...init, headers, cache: "no-store" });
    if (!response.ok) {
      /* Solo código y mensaje: el «details» de Postgres puede traer la fila con datos personales. */
      const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string; hint?: string };
      /* Si la llave es rechazada, solo su formato (prefijo de 10 caracteres y largo) para diagnosticar. */
      const keyHint = response.status === 401 ? ` [llave recibida: «${key.slice(0, 10)}…», ${key.length} caracteres]` : "";
      throw new SupabaseError(`Supabase ${response.status}: ${[body.code, body.message, body.hint].filter(Boolean).join(" · ").slice(0, 300)}${keyHint}`);
    }
    return response;
  }

  async function rows(path: string): Promise<Row[]> {
    const response = await request(path);
    return (await response.json()) as Row[];
  }

  /**
   * Trae todas las filas por páginas. Supabase corta cada respuesta en su
   * «max rows» (1.000 por defecto, pero cada proyecto lo puede bajar), así que
   * se pide el conteo exacto y se sigue hasta completarlo.
   */
  async function allRows(select: string, order = "created_at.asc"): Promise<Row[]> {
    const out: Row[] = [];
    let total = Infinity;
    while (out.length < total) {
      const response = await request(`/diagnoses?select=${select}&order=${order}&limit=${PAGE}&offset=${out.length}`, { prefer: "count=exact" });
      const page = (await response.json()) as Row[];
      const counted = Number(response.headers.get("content-range")?.split("/")[1]);
      if (Number.isFinite(counted)) total = counted;
      if (page.length === 0) break;
      out.push(...page);
      if (!Number.isFinite(counted) && page.length < PAGE) break;
    }
    return out;
  }

  async function getRow(id: string): Promise<Row | null> {
    const term = encodeURIComponent(safeTerm(id));
    const found = await rows(`/diagnoses?select=*&or=(id.eq.${term},code.eq.${encodeURIComponent(safeTerm(id).toUpperCase())})&limit=1`);
    return found[0] ?? null;
  }

  return {
    async save(raw, options = {}) {
      const valid = validateForStorage(raw);
      if (!valid.ok) return valid;
      const fields = columnsFor(valid.answers);
      const now = new Date().toISOString();

      if (options.id) {
        const existing = await getRow(options.id);
        if (!existing || existing.id !== options.id) return { ok: false, error: "Ese diagnóstico ya no existe." };
        if (!options.asConsultant && !tokenMatches(options.editToken, existing.edit_token_hash)) {
          return { ok: false, error: "No tiene permiso para modificar ese diagnóstico." };
        }
        await request(`/diagnoses?id=eq.${encodeURIComponent(options.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ ...fields, updated_at: now }),
          prefer: "return=minimal",
        });
        return { ok: true, id: options.id, code: String(existing.code), editToken: options.editToken ?? "" };
      }

      const id = randomUUID();
      const editToken = newEditToken();
      /* El código es único: si choca (muy raro), se intenta con otro. */
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = newCode();
        try {
          await request("/diagnoses", {
            method: "POST",
            body: JSON.stringify({ ...fields, id, code, edit_token_hash: hashToken(editToken), status: "nuevo", notes: "", consent_at: now, created_at: now, updated_at: now }),
            prefer: "return=minimal",
          });
          return { ok: true, id, code, editToken };
        } catch (error) {
          if (!(error instanceof SupabaseError) || !error.message.startsWith("Supabase 409")) throw error;
        }
      }
      return { ok: false, error: "No se pudo generar un código único. Intente de nuevo." };
    },

    async get(id) {
      const row = await getRow(id);
      return row ? toRecord(row) : null;
    },

    async list({ search = "", level = "", status = "", limit = 50, offset = 0 } = {}) {
      const filters: string[] = [];
      const term = safeTerm(search);
      if (term) {
        const like = encodeURIComponent(`*${term}*`);
        const fields = ["company_name", "code", "contact_name", "email", "city", "industry", "activity"];
        filters.push(`or=(${fields.map((field) => `${field}.ilike.${like}`).join(",")})`);
      }
      if (level) filters.push(`level=eq.${level}`);
      if (status) filters.push(`status=eq.${status}`);
      const size = Math.min(200, Math.max(1, limit));
      const response = await request(
        `/diagnoses?select=*&order=updated_at.desc&limit=${size}&offset=${Math.max(0, offset)}${filters.length ? `&${filters.join("&")}` : ""}`,
        { prefer: "count=exact" },
      );
      const items = ((await response.json()) as Row[]).map(toSummary);
      const total = Number(response.headers.get("content-range")?.split("/")[1] ?? items.length);
      return { items, total: Number.isFinite(total) ? total : items.length };
    },

    async stats() {
      const stats = emptyStats();
      for (const row of await allRows("level,status")) {
        const level = String(row.level) as LevelId;
        if (level in stats.byLevel) stats.byLevel[level] += 1;
        if (row.status === "interesado") stats.interested += 1;
      }
      stats.total = stats.byLevel.alto + stats.byLevel.moderado + stats.byLevel.bajo;
      return stats;
    },

    async requestFollowUp(id, editToken) {
      const row = await getRow(id);
      if (!row || row.id !== id || !tokenMatches(editToken, row.edit_token_hash)) return false;
      const now = new Date().toISOString();
      /* No retrocede un caso que el equipo ya está atendiendo. */
      const next = !row.status || row.status === "nuevo" ? "interesado" : String(row.status);
      await request(`/diagnoses?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next, interest_at: now, updated_at: now }),
        prefer: "return=minimal",
      });
      return true;
    },

    async setStatus(id, status, notes) {
      if (!(LEAD_STATUSES as readonly string[]).includes(status)) return false;
      const response = await request(`/diagnoses?id=eq.${encodeURIComponent(id)}&select=id`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes: notes.slice(0, 2000), updated_at: new Date().toISOString() }),
        prefer: "return=representation",
      });
      return ((await response.json()) as Row[]).length > 0;
    },

    async all() {
      return (await allRows("*")).map(toRecord).filter((record): record is DiagnosisRecord => record !== null);
    },

    async clear() {
      const existing = await allRows("*");
      if (existing.length === 0) return { removed: 0, backup: "" };
      /* Copia en la tabla diagnoses_backup, marcada con un lote, antes de borrar. */
      const batch = `respaldo-${new Date().toISOString()}`;
      for (let i = 0; i < existing.length; i += 500) {
        const chunk = existing.slice(i, i + 500).map((row) => ({ ...row, backup_id: randomUUID(), backup_batch: batch }));
        await request("/diagnoses_backup", { method: "POST", body: JSON.stringify(chunk), prefer: "return=minimal" });
      }
      await request("/diagnoses?id=not.is.null", { method: "DELETE", prefer: "return=minimal" });
      return { removed: existing.length, backup: `tabla diagnoses_backup, lote «${batch}»` };
    },
  };
}
