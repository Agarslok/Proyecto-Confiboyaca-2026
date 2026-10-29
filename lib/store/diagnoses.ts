import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { buildRadarResult, isRadarComplete } from "@/lib/radar/engine";
import { contactErrors } from "@/lib/radar/contact";
import { normalizeRadarAnswers } from "@/lib/radar/session";
import type { LevelId, RadarAnswers } from "@/lib/radar/types";

/* ============================================================================
   Diagnósticos guardados en el servidor.

   Esta versión usa SQLite (incluido en Node 24, sin dependencias) en un
   archivo local: data/radar.db, o la ruta de RADAR_DB_PATH. Sirve para el
   piloto con cientos de empresas en un solo servidor. Para publicarlo en
   internet con varios servidores, se cambia este archivo por uno que use
   Postgres (por ejemplo Supabase) con la misma interfaz DiagnosisStore.

   Solo se importa desde Server Actions y Server Components.
   ========================================================================== */

import { LEAD_STATUSES, type LeadStatus } from "@/lib/store/lead-status";

export { LEAD_LABELS, LEAD_STATUSES, type LeadStatus } from "@/lib/store/lead-status";

export interface DiagnosisSummary {
  id: string;
  status: LeadStatus;
  interestAt: string;
  code: string;
  companyName: string;
  city: string;
  contactName: string;
  industry: string;
  activity: string;
  index: number;
  level: LevelId;
  centralProblem: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosisRecord extends DiagnosisSummary {
  notes: string;
  email: string;
  phone: string;
  consentAt: string;
  answers: RadarAnswers;
}

export interface ListQuery {
  search?: string;
  level?: LevelId | "";
  status?: LeadStatus | "";
  limit?: number;
  offset?: number;
}

export interface DiagnosisStore {
  save(answers: RadarAnswers, options?: { id?: string; editToken?: string; asConsultant?: boolean }): SaveResult;
  get(id: string): DiagnosisRecord | null;
  list(query?: ListQuery): { items: DiagnosisSummary[]; total: number };
  stats(): { total: number; byLevel: Record<LevelId, number>; interested: number };
  /** El cliente pide que lo llamen; solo con el token de su navegador. */
  requestFollowUp(id: string, editToken: string): boolean;
  /** Solo consultores: cambia el estado y las notas. */
  setStatus(id: string, status: LeadStatus, notes: string): boolean;
  /** Todos los registros completos, para exportar. */
  all(): DiagnosisRecord[];
  /**
   * Solo consultores: borra todos los diagnósticos para empezar de cero.
   * Antes guarda una copia de la base en backupPath. Devuelve cuántos borró.
   */
  clear(backupPath: string): number;
}

export type SaveResult =
  | { ok: true; id: string; code: string; editToken: string }
  | { ok: false; error: string };

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

/* Sin 0/O ni 1/I para que el código se pueda dictar por teléfono. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newCode(): string {
  const bytes = randomBytes(6);
  return `RAD-${Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("")}`;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

type Row = Record<string, string | number>;

function toSummary(row: Row): DiagnosisSummary {
  return {
    id: String(row.id),
    code: String(row.code),
    companyName: String(row.company_name),
    city: String(row.city),
    contactName: String(row.contact_name),
    industry: String(row.industry),
    activity: String(row.activity),
    index: Number(row.index_score),
    level: String(row.level) as LevelId,
    status: ((LEAD_STATUSES as readonly string[]).includes(String(row.status)) ? String(row.status) : "nuevo") as LeadStatus,
    interestAt: String(row.interest_at ?? ""),
    centralProblem: String(row.central_problem),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Deja solo lo que el formulario puede producir y exige un diagnóstico completo con autorización. */
export function validateForStorage(raw: unknown): { ok: true; answers: RadarAnswers } | { ok: false; error: string } {
  const answers = normalizeRadarAnswers(raw);
  if (!answers) return { ok: false, error: "Las respuestas no tienen el formato esperado." };
  if (!answers.consent) return { ok: false, error: "Falta la autorización de tratamiento de datos (Ley 1581 de 2012)." };
  if (answers.companyName.length > 80) return { ok: false, error: "El nombre de la empresa es muy largo." };
  const contact = Object.values(contactErrors(answers));
  if (contact.length) return { ok: false, error: contact[0] };
  if (!isRadarComplete(answers)) return { ok: false, error: "El diagnóstico está incompleto." };
  /* El registro, su código y el token se guardan en columnas propias, no dentro de las respuestas. */
  const clean: RadarAnswers = { ...answers, cursor: 0 };
  delete clean.recordId;
  delete clean.recordCode;
  delete clean.editToken;
  delete clean.followUpRequested;
  return { ok: true, answers: clean };
}

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

  return {
    save(raw, options = {}) {
      const valid = validateForStorage(raw);
      if (!valid.ok) return valid;
      const answers = valid.answers;
      const result = buildRadarResult(answers);
      const now = new Date().toISOString();
      const fields = {
        company_name: answers.companyName.trim(),
        city: answers.city.trim(),
        contact_name: `${answers.contactName.trim()} ${answers.contactLastName.trim()}`.trim(),
        email: answers.email.trim().toLowerCase(),
        phone: answers.phone.trim(),
        industry: result.industryLabel,
        activity: result.activityLabel,
        index_score: result.index,
        level: result.level,
        central_problem: result.central?.problem ?? "",
        answers_json: JSON.stringify(answers),
      };

      if (options.id) {
        const existing = db.prepare("SELECT code, edit_token_hash FROM diagnoses WHERE id = ?").get(options.id) as Row | undefined;
        if (!existing) return { ok: false, error: "Ese diagnóstico ya no existe." };
        const allowed = options.asConsultant || (options.editToken && sameHash(hashToken(options.editToken), String(existing.edit_token_hash)));
        if (!allowed) return { ok: false, error: "No tiene permiso para modificar ese diagnóstico." };
        db.prepare(
          `UPDATE diagnoses SET company_name = $company_name, city = $city, contact_name = $contact_name, email = $email,
           phone = $phone, industry = $industry, activity = $activity, index_score = $index_score, level = $level,
           central_problem = $central_problem, answers_json = $answers_json, updated_at = $now WHERE id = $id`,
        ).run({ ...fields, now, id: options.id });
        return { ok: true, id: options.id, code: String(existing.code), editToken: options.editToken ?? "" };
      }

      const id = randomUUID();
      const editToken = randomBytes(24).toString("base64url");
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

    get(id) {
      const row = db.prepare("SELECT * FROM diagnoses WHERE id = ? OR code = ?").get(id, id.toUpperCase()) as Row | undefined;
      if (!row) return null;
      const answers = normalizeRadarAnswers(JSON.parse(String(row.answers_json)));
      if (!answers) return null;
      return {
        ...toSummary(row),
        notes: String(row.notes ?? ""),
        email: String(row.email),
        phone: String(row.phone),
        consentAt: String(row.consent_at),
        answers: { ...answers, recordId: String(row.id), recordCode: String(row.code) },
      };
    },

    list({ search = "", level = "", status = "", limit = 50, offset = 0 } = {}) {
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

    stats() {
      const rows = db.prepare("SELECT level, COUNT(*) AS n FROM diagnoses GROUP BY level").all() as Row[];
      const byLevel: Record<LevelId, number> = { alto: 0, moderado: 0, bajo: 0 };
      for (const row of rows) byLevel[String(row.level) as LevelId] = Number(row.n);
      const interested = Number((db.prepare("SELECT COUNT(*) AS n FROM diagnoses WHERE status = 'interesado'").get() as Row).n);
      return { total: byLevel.alto + byLevel.moderado + byLevel.bajo, byLevel, interested };
    },

    requestFollowUp(id, editToken) {
      const row = db.prepare("SELECT edit_token_hash, status FROM diagnoses WHERE id = ?").get(id) as Row | undefined;
      if (!row || !editToken || !sameHash(hashToken(editToken), String(row.edit_token_hash))) return false;
      const now = new Date().toISOString();
      /* No retrocede un caso que el equipo ya está atendiendo. */
      const next = String(row.status) === "nuevo" ? "interesado" : String(row.status);
      db.prepare("UPDATE diagnoses SET status = ?, interest_at = ?, updated_at = ? WHERE id = ?").run(next, now, now, id);
      return true;
    },

    setStatus(id, status, notes) {
      if (!(LEAD_STATUSES as readonly string[]).includes(status)) return false;
      const result = db.prepare("UPDATE diagnoses SET status = ?, notes = ?, updated_at = ? WHERE id = ?").run(status, notes.slice(0, 2000), new Date().toISOString(), id);
      return Number(result.changes) > 0;
    },

    all() {
      const ids = db.prepare("SELECT id FROM diagnoses ORDER BY created_at").all() as Row[];
      return ids.map((row) => this.get(String(row.id))).filter((record): record is DiagnosisRecord => record !== null);
    },

    clear(backupPath) {
      const total = Number((db.prepare("SELECT COUNT(*) AS n FROM diagnoses").get() as Row).n);
      if (total === 0) return 0;
      if (path !== ":memory:") {
        mkdirSync(dirname(backupPath), { recursive: true });
        /* Copia completa y consistente de la base antes de borrar. */
        db.prepare("VACUUM INTO ?").run(backupPath);
      }
      db.exec("DELETE FROM diagnoses");
      return total;
    },
  };
}

let store: DiagnosisStore | null = null;

export function getDiagnosisStore(): DiagnosisStore {
  if (!store) store = createSqliteStore(resolve(process.env.RADAR_DB_PATH || "data/radar.db"));
  return store;
}
