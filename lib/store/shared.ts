import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { buildRadarResult, isRadarComplete } from "@/lib/radar/engine";
import { contactErrors } from "@/lib/radar/contact";
import { normalizeRadarAnswers } from "@/lib/radar/session";
import type { LevelId, RadarAnswers } from "@/lib/radar/types";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/store/lead-status";

/* ============================================================================
   Lo común a los dos almacenes de diagnósticos (SQLite local y Supabase):
   la interfaz, la validación, el código RAD-…, el token de edición y cómo se
   pasan las respuestas a columnas. Las columnas se llaman igual en ambos.
   ========================================================================== */

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

export type SaveResult =
  | { ok: true; id: string; code: string; editToken: string }
  | { ok: false; error: string };

export interface ClearResult {
  removed: number;
  /** Dónde quedó la copia: un archivo (SQLite) o un lote en la tabla de respaldo (Supabase). */
  backup: string;
}

export interface DiagnosisStore {
  save(answers: RadarAnswers, options?: { id?: string; editToken?: string; asConsultant?: boolean }): Promise<SaveResult>;
  get(id: string): Promise<DiagnosisRecord | null>;
  list(query?: ListQuery): Promise<{ items: DiagnosisSummary[]; total: number }>;
  stats(): Promise<{ total: number; byLevel: Record<LevelId, number>; interested: number }>;
  /** El cliente pide que lo llamen; solo con el token de su navegador. */
  requestFollowUp(id: string, editToken: string): Promise<boolean>;
  /** Solo consultores: cambia el estado y las notas. */
  setStatus(id: string, status: LeadStatus, notes: string): Promise<boolean>;
  /** Todos los registros completos, para exportar. */
  all(): Promise<DiagnosisRecord[]>;
  /** Solo consultores: guarda una copia y borra todo, para empezar de cero. */
  clear(options?: { backupPath?: string }): Promise<ClearResult>;
}

/* Sin 0/O ni 1/I para que el código se pueda dictar por teléfono. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newCode(): string {
  const bytes = randomBytes(6);
  return `RAD-${Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("")}`;
}

export function newEditToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string | undefined, hash: unknown): boolean {
  if (!token || typeof hash !== "string") return false;
  const left = Buffer.from(hashToken(token), "hex");
  const right = Buffer.from(hash, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
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

/** Columnas calculadas en el servidor a partir de las respuestas (no se confía en el navegador). */
export function columnsFor(answers: RadarAnswers) {
  const result = buildRadarResult(answers);
  return {
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
}

export type Row = Record<string, unknown>;

const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

export function toSummary(row: Row): DiagnosisSummary {
  return {
    id: text(row.id),
    code: text(row.code),
    companyName: text(row.company_name),
    city: text(row.city),
    contactName: text(row.contact_name),
    industry: text(row.industry),
    activity: text(row.activity),
    index: Number(row.index_score),
    level: text(row.level) as LevelId,
    status: ((LEAD_STATUSES as readonly string[]).includes(text(row.status)) ? text(row.status) : "nuevo") as LeadStatus,
    interestAt: text(row.interest_at),
    centralProblem: text(row.central_problem),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

export function toRecord(row: Row): DiagnosisRecord | null {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text(row.answers_json));
  } catch {
    return null;
  }
  const answers = normalizeRadarAnswers(parsed);
  if (!answers) return null;
  return {
    ...toSummary(row),
    notes: text(row.notes),
    email: text(row.email),
    phone: text(row.phone),
    consentAt: text(row.consent_at),
    answers: { ...answers, recordId: text(row.id), recordCode: text(row.code) },
  };
}

export function emptyStats(): { total: number; byLevel: Record<LevelId, number>; interested: number } {
  return { total: 0, byLevel: { alto: 0, moderado: 0, bajo: 0 }, interested: 0 };
}
