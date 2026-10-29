import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
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
   Almacén local en SQLite (incluido en Node 24, sin dependencias).
   Para trabajar en un computador: data/radar.db o la ruta de RADAR_DB_PATH.
   En Netlify no sirve (no hay disco que se conserve): allí va Supabase.
   ========================================================================== */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS diagnoses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    edit_token_hash TEXT NOT NULL,
    company_name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    contact_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL,
    activity TEXT NOT NULL,
    index_score INTEGER NOT NULL,
    level TEXT NOT NULL,
    central_problem TEXT NOT NULL DEFAULT '',
    answers_json TEXT NOT NULL,
    consent_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS diagnoses_company ON diagnoses (company_name);
  CREATE INDEX IF NOT EXISTS diagnoses_created ON diagnoses (created_at);
`;

export function createSqliteStore(path: string): DiagnosisStore {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  /* Sin WAL: un solo archivo, más seguro si la carpeta se sincroniza (OneDrive, Drive). */
  db.exec("PRAGMA busy_timeout = 3000;");
  db.exec(SCHEMA);
  /* Columnas que llegaron después: se agregan si la base ya existía. */
  const columns = new Set((db.prepare("PRAGMA table_info(diagnoses)").all() as Row[]).map((column) => String(column.name)));
  if (!columns.has("status")) db.exec("ALTER TABLE diagnoses ADD COLUMN status TEXT NOT NULL DEFAULT 'nuevo'");
  if (!columns.has("notes")) db.exec("ALTER TABLE diagnoses ADD COLUMN notes TEXT NOT NULL DEFAULT ''");
  if (!columns.has("interest_at")) db.exec("ALTER TABLE diagnoses ADD COLUMN interest_at TEXT NOT NULL DEFAULT ''");

  const getRow = (id: string) => db.prepare("SELECT * FROM diagnoses WHERE id = ? OR code = ?").get(id, id.toUpperCase()) as Row | undefined;
  const count = (sql: string) => Number((db.prepare(sql).get() as Row).n);

  return {
    async save(raw, options = {}) {
      const valid = validateForStorage(raw);
      if (!valid.ok) return valid;
      const fields = columnsFor(valid.answers);
      const now = new Date().toISOString();

      if (options.id) {
        const existing = db.prepare("SELECT code, edit_token_hash FROM diagnoses WHERE id = ?").get(options.id) as Row | undefined;
        if (!existing) return { ok: false, error: "Ese diagnóstico ya no existe." };
        if (!options.asConsultant && !tokenMatches(options.editToken, existing.edit_token_hash)) {
          return { ok: false, error: "No tiene permiso para modificar ese diagnóstico." };
        }
        db.prepare(
          `UPDATE diagnoses SET company_name = $company_name, city = $city, contact_name = $contact_name, email = $email,
           phone = $phone, industry = $industry, activity = $activity, index_score = $index_score, level = $level,
           central_problem = $central_problem, answers_json = $answers_json, updated_at = $now WHERE id = $id`,
        ).run({ ...fields, now, id: options.id });
        return { ok: true, id: options.id, code: String(existing.code), editToken: options.editToken ?? "" };
      }

      const id = randomUUID();
      const editToken = newEditToken();
      let code = newCode();
      while (db.prepare("SELECT 1 FROM diagnoses WHERE code = ?").get(code)) code = newCode();
      db.prepare(
        `INSERT INTO diagnoses (id, code, edit_token_hash, company_name, city, contact_name, email, phone, industry, activity,
         index_score, level, central_problem, answers_json, consent_at, created_at, updated_at)
         VALUES ($id, $code, $hash, $company_name, $city, $contact_name, $email, $phone, $industry, $activity,
         $index_score, $level, $central_problem, $answers_json, $now, $now, $now)`,
      ).run({ ...fields, id, code, hash: hashToken(editToken), now });
      return { ok: true, id, code, editToken };
    },

    async get(id) {
      const row = getRow(id);
      return row ? toRecord(row) : null;
    },

    async list({ search = "", level = "", status = "", limit = 50, offset = 0 } = {}) {
      const where: string[] = [];
      const params: Record<string, string | number> = {};
      if (search.trim()) {
        where.push("(company_name LIKE $q OR code LIKE $q OR contact_name LIKE $q OR email LIKE $q OR city LIKE $q OR industry LIKE $q OR activity LIKE $q)");
        params.q = `%${search.trim()}%`;
      }
      if (level) {
        where.push("level = $level");
        params.level = level;
      }
      if (status) {
        where.push("status = $status");
        params.status = status;
      }
      const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const total = Number((db.prepare(`SELECT COUNT(*) AS n FROM diagnoses ${clause}`).get(params) as Row).n);
      const rows = db
        .prepare(`SELECT * FROM diagnoses ${clause} ORDER BY updated_at DESC LIMIT $limit OFFSET $offset`)
        .all({ ...params, limit: Math.min(200, Math.max(1, limit)), offset: Math.max(0, offset) }) as Row[];
      return { items: rows.map(toSummary), total };
    },

    async stats() {
      const stats = emptyStats();
      for (const row of db.prepare("SELECT level, COUNT(*) AS n FROM diagnoses GROUP BY level").all() as Row[]) {
        stats.byLevel[String(row.level) as LevelId] = Number(row.n);
      }
      stats.total = stats.byLevel.alto + stats.byLevel.moderado + stats.byLevel.bajo;
      stats.interested = count("SELECT COUNT(*) AS n FROM diagnoses WHERE status = 'interesado'");
      return stats;
    },

    async requestFollowUp(id, editToken) {
      const row = db.prepare("SELECT edit_token_hash, status FROM diagnoses WHERE id = ?").get(id) as Row | undefined;
      if (!row || !tokenMatches(editToken, row.edit_token_hash)) return false;
      const now = new Date().toISOString();
      /* No retrocede un caso que el equipo ya está atendiendo. */
      const next = String(row.status) === "nuevo" ? "interesado" : String(row.status);
      db.prepare("UPDATE diagnoses SET status = ?, interest_at = ?, updated_at = ? WHERE id = ?").run(next, now, now, id);
      return true;
    },

    async setStatus(id, status, notes) {
      if (!(LEAD_STATUSES as readonly string[]).includes(status)) return false;
      const result = db.prepare("UPDATE diagnoses SET status = ?, notes = ?, updated_at = ? WHERE id = ?").run(status, notes.slice(0, 2000), new Date().toISOString(), id);
      return Number(result.changes) > 0;
    },

    async all() {
      const rows = db.prepare("SELECT * FROM diagnoses ORDER BY created_at").all() as Row[];
      return rows.map(toRecord).filter((record): record is DiagnosisRecord => record !== null);
    },

    async clear({ backupPath } = {}) {
      const removed = count("SELECT COUNT(*) AS n FROM diagnoses");
      if (removed === 0) return { removed: 0, backup: "" };
      let backup = "";
      if (path !== ":memory:") {
        backup = backupPath ?? join(dirname(path), "respaldos", `radar-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
        mkdirSync(dirname(backup), { recursive: true });
        /* Copia completa y consistente de la base antes de borrar. */
        db.prepare("VACUUM INTO ?").run(backup);
      }
      db.exec("DELETE FROM diagnoses");
      return { removed, backup };
    },
  };
}
