import type {
  CompanyRecord,
  DiagnosticRecord,
  SessionRecord,
  TemplateConfig,
  TemplateKey,
} from "@/types/domain";

export interface CompanyRepository {
  save(record: CompanyRecord): Promise<CompanyRecord>;
  getById(id: string): Promise<CompanyRecord | null>;
}

export interface DiagnosticRepository {
  save(record: DiagnosticRecord): Promise<DiagnosticRecord>;
  getById(id: string): Promise<DiagnosticRecord | null>;
}

export interface SessionRepository {
  save(record: SessionRecord): Promise<SessionRecord>;
  getById(id: string): Promise<SessionRecord | null>;
}

export interface TemplateRepository {
  getByKey(key: TemplateKey): Promise<TemplateConfig | null>;
  list(): Promise<TemplateConfig[]>;
}

export interface Repositories {
  companies: CompanyRepository;
  diagnostics: DiagnosticRepository;
  sessions: SessionRepository;
  templates: TemplateRepository;
}
