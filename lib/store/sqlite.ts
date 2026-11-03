import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { LevelId } from "@/lib/radar/types";
import { LEAD_STATUSES } from "@/lib/store/lead-status";
import {
  activityCatalog,
  answerRowsFor,
  goalRowsFor,
  industryCatalog,
  questionCatalog,
} from "@/lib/store/normalized";
import {
  columnsFor,
  emptyStats,
  hashToken,
  newCode,
  newEditToken,
  toRecord,
  toSummary,
  tokenMatches,
  solutionSpecJson,
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
    contact_phone TEXT NOT NULL DEFAULT '',
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

  CREATE TABLE IF NOT EXISTS radar_industries (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    template TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS radar_activities (
    id TEXT PRIMARY KEY,
    industry_id TEXT NOT NULL,
    label TEXT NOT NULL,
    link TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS radar_questions (
    id TEXT PRIMARY KEY,
    industry_id TEXT,
    link TEXT,
    scope TEXT NOT NULL,
    dimension TEXT NOT NULL,
    section TEXT NOT NULL,
    prompt TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS diagnosis_answers (
    diagnosis_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    industry_id TEXT NOT NULL DEFAULT '',
    option_key TEXT NOT NULL,
    points INTEGER NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (diagnosis_id, question_id)
  );
  CREATE TABLE IF NOT EXISTS diagnosis_goals (
    diagnosis_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    PRIMARY KEY (diagnosis_id, goal_id)
  );
  CREATE INDEX IF NOT EXISTS diagnosis_answers_question ON diagnosis_answers (question_id, industry_id);
`;

export function createSqliteStore(path: string): DiagnosisStore {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  /* Sin WAL: un solo archivo, más seguro si la carpeta se sincroniza (OneDrive, Drive). */
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 3000;");
  db.exec(SCHEMA);
  /* Columnas que llegaron después: se agregan si la base ya existía. */
  const columns = new Set((db.prepare("PRAGMA table_info(diagnoses)").all() as Row[]).map((column) => String(column.name)));
  if (!columns.has("status")) db.exec("ALTER TABLE diagnoses ADD COLUMN status TEXT NOT NULL DEFAULT 'nuevo'");
  if (!columns.has("notes")) db.exec("ALTER TABLE diagnoses ADD COLUMN notes TEXT NOT NULL DEFAULT ''");
  if (!columns.has("interest_at")) db.exec("ALTER TABLE diagnoses ADD COLUMN interest_at TEXT NOT NULL DEFAULT ''");
  if (!columns.has("industry_id")) db.exec("ALTER TABLE diagnoses ADD COLUMN industry_id TEXT NOT NULL DEFAULT ''");
  if (!columns.has("activity_id")) db.exec("ALTER TABLE diagnoses ADD COLUMN activity_id TEXT NOT NULL DEFAULT ''");
  if (!columns.has("contact_phone")) db.exec("ALTER TABLE diagnoses ADD COLUMN contact_phone TEXT NOT NULL DEFAULT ''");
  if (!columns.has("presentation_mode")) db.exec("ALTER TABLE diagnoses ADD COLUMN presentation_mode TEXT NOT NULL DEFAULT ''");
  if (!columns.has("presentation_kind")) db.exec("ALTER TABLE diagnoses ADD COLUMN presentation_kind TEXT NOT NULL DEFAULT ''");
  if (!columns.has("presentation_action")) db.exec("ALTER TABLE diagnoses ADD COLUMN presentation_action TEXT NOT NULL DEFAULT ''");
  if (!columns.has("solution_spec")) db.exec("ALTER TABLE diagnoses ADD COLUMN solution_spec TEXT NOT NULL DEFAULT ''");

  let catalogReady = false;
  const syncCatalog = () => {
    if (catalogReady) return;
    const upsertIndustry = db.prepare(
      `INSERT INTO radar_industries (id, label, template) VALUES ($id, $label, $template)
       ON CONFLICT(id) DO UPDATE SET label = excluded.label, template = excluded.template`,
    );
    const upsertActivity = db.prepare(
      `INSERT INTO radar_activities (id, industry_id, label, link) VALUES ($id, $industry_id, $label, $link)
       ON CONFLICT(id) DO UPDATE SET industry_id = excluded.industry_id, label = excluded.label, link = excluded.link`,
    );
    const upsertQuestion = db.prepare(
      `INSERT INTO radar_questions (id, industry_id, link, scope, dimension, section, prompt, option_a, option_b, option_c, option_d)
       VALUES ($id, $industry_id, $link, $scope, $dimension, $section, $prompt, $option_a, $option_b, $option_c, $option_d)
       ON CONFLICT(id) DO UPDATE SET industry_id = excluded.industry_id, link = excluded.link, scope = excluded.scope,
         dimension = excluded.dimension, section = excluded.section, prompt = excluded.prompt,
         option_a = excluded.option_a, option_b = excluded.option_b, option_c = excluded.option_c, option_d = excluded.option_d`,
    );
    for (const row of industryCatalog()) upsertIndustry.run({ ...row });
    for (const row of activityCatalog()) upsertActivity.run({ ...row });
    for (const row of questionCatalog()) upsertQuestion.run({ ...row });
    catalogReady = true;
  };

  const replaceDetails = (diagnosisId: string, answers: Parameters<typeof answerRowsFor>[1]) => {
    syncCatalog();
    db.prepare("DELETE FROM diagnosis_answers WHERE diagnosis_id = ?").run(diagnosisId);
    db.prepare("DELETE FROM diagnosis_goals WHERE diagnosis_id = ?").run(diagnosisId);
    const insertAnswer = db.prepare(
      `INSERT INTO diagnosis_answers (diagnosis_id, question_id, industry_id, option_key, points, prompt)
       VALUES ($diagnosis_id, $question_id, $industry_id, $option_key, $points, $prompt)`,
    );
    const insertGoal = db.prepare("INSERT INTO diagnosis_goals (diagnosis_id, goal_id) VALUES ($diagnosis_id, $goal_id)");
    for (const row of answerRowsFor(diagnosisId, answers)) insertAnswer.run({ ...row });
    for (const row of goalRowsFor(diagnosisId, answers)) insertGoal.run({ ...row });
  };

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
           phone = $phone, contact_phone = $contact_phone, industry = $industry, activity = $activity, industry_id = $industry_id, activity_id = $activity_id,
           index_score = $index_score, level = $level,
           central_problem = $central_problem, presentation_mode = $presentation_mode, presentation_kind = $presentation_kind,
           presentation_action = $presentation_action,
           answers_json = $answers_json, updated_at = $now WHERE id = $id`,
        ).run({ ...fields, now, id: options.id });
        replaceDetails(options.id, valid.answers);
        return { ok: true, id: options.id, code: String(existing.code), editToken: options.editToken ?? "" };
      }

      const id = randomUUID();
      const editToken = newEditToken();
      let code = newCode();
      while (db.prepare("SELECT 1 FROM diagnoses WHERE code = ?").get(code)) code = newCode();
      db.prepare(
        `INSERT INTO diagnoses (id, code, edit_token_hash, company_name, city, contact_name, email, phone, contact_phone, industry, activity,
         industry_id, activity_id, index_score, level, central_problem, presentation_mode, presentation_kind, presentation_action,
         solution_spec, answers_json, consent_at, created_at, updated_at)
         VALUES ($id, $code, $hash, $company_name, $city, $contact_name, $email, $phone, $contact_phone, $industry, $activity,
         $industry_id, $activity_id, $index_score, $level, $central_problem, $presentation_mode, $presentation_kind, $presentation_action,
         '', $answers_json, $now, $now, $now)`,
      ).run({ ...fields, id, code, hash: hashToken(editToken), now });
      replaceDetails(id, valid.answers);
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

    async hasEditAccess(id, editToken) {
      const row = db.prepare("SELECT edit_token_hash FROM diagnoses WHERE id = ?").get(id) as Row | undefined;
      return Boolean(row && tokenMatches(editToken, row.edit_token_hash));
    },

    async setSolutionSpec(id, editToken, spec) {
      const json = solutionSpecJson(spec);
      if (!json || !(await this.hasEditAccess(id, editToken))) return false;
      const result = db.prepare("UPDATE diagnoses SET solution_spec = ?, updated_at = ? WHERE id = ?").run(json, new Date().toISOString(), id);
      return Number(result.changes) > 0;
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
      db.exec("DELETE FROM diagnosis_answers");
      db.exec("DELETE FROM diagnosis_goals");
      db.exec("DELETE FROM diagnoses");
      return { removed, backup };
    },
  };
}
