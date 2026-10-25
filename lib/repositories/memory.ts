import { templates } from "@/config/templates";
import type { Repositories } from "@/lib/repositories/contracts";
import type {
  CompanyRecord,
  DiagnosticRecord,
  SessionRecord,
  TemplateKey,
} from "@/types/domain";

const companies = new Map<string, CompanyRecord>();
const diagnostics = new Map<string, DiagnosticRecord>();
const sessions = new Map<string, SessionRecord>();

export function resetMemoryStore(): void {
  companies.clear();
  diagnostics.clear();
  sessions.clear();
}

export const memoryRepositories: Repositories = {
  companies: {
    async save(record) {
      companies.set(record.id, record);
      return record;
    },
    async getById(id) {
      return companies.get(id) ?? null;
    },
  },
  diagnostics: {
    async save(record) {
      const company = companies.get(record.companyId);
      if (!company) {
        throw new Error("El diagnóstico no tiene una empresa asociada en el almacén local.");
      }
      if (company.industryId !== record.industryId) {
        throw new Error("El sector del diagnóstico no coincide con el de la empresa.");
      }
      diagnostics.set(record.id, record);
      return record;
    },
    async getById(id) {
      return diagnostics.get(id) ?? null;
    },
  },
  sessions: {
    async save(record) {
      if (!companies.has(record.companyId)) {
        throw new Error("La sesión no tiene una empresa asociada en el almacén local.");
      }
      sessions.set(record.id, record);
      return record;
    },
    async getById(id) {
      return sessions.get(id) ?? null;
    },
  },
  templates: {
    async getByKey(key: TemplateKey) {
      return templates[key] ?? null;
    },
    async list() {
      return Object.values(templates);
    },
  },
};
