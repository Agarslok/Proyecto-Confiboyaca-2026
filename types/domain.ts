export const INDUSTRY_IDS = ["metalurgia", "servicios"] as const;
export type IndustryId = (typeof INDUSTRY_IDS)[number];

export const TEMPLATE_KEYS = ["base", "industrial", "services"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type SectorTemplateKey = Exclude<TemplateKey, "base">;

export const PROBLEM_IDS = [
  "captacion",
  "seguimiento",
  "administracion",
  "inventario",
  "tareas",
  "analisis",
  "otro",
] as const;
export type ProblemId = (typeof PROBLEM_IDS)[number];

export const GOAL_IDS = [
  "tiempo",
  "errores",
  "ventas",
  "informacion",
  "decisiones",
] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export const SIZE_IDS = ["1-10", "11-50", "51-250", "251+"] as const;
export type SizeId = (typeof SIZE_IDS)[number];

export const METHOD_IDS = ["memoria", "hojas", "software", "mixto", "nada"] as const;
export type CurrentMethod = (typeof METHOD_IDS)[number];

export const FREQUENCY_IDS = ["diaria", "semanal", "ocasional"] as const;
export type PainFrequency = (typeof FREQUENCY_IDS)[number];

export const DEMO_TYPES = ["crm", "tasks", "inventory", "analytics"] as const;
export type DemoType = (typeof DEMO_TYPES)[number];

export interface Answers {
  companyName: string;
  industryId: IndustryId;
  size: SizeId;
  problems: ProblemId[];
  otherProblem?: string;
  primaryProblem: ProblemId;
  goals: GoalId[];
  currentMethod: CurrentMethod;
  painFrequency: PainFrequency;
}

export interface DraftAnswers {
  companyName: string;
  industryId: IndustryId | "";
  size: SizeId | "";
  problems: ProblemId[];
  otherProblem: string;
  primaryProblem: ProblemId | "";
  goals: GoalId[];
  currentMethod: CurrentMethod | "";
  painFrequency: PainFrequency | "";
}

export interface DiagnosisIds {
  diagnosisId: string;
  companyId: string;
  sessionId: string;
}

export interface Diagnosis {
  id: string;
  companyId: string;
  sessionId: string;
  companyName: string;
  industryId: IndustryId;
  industryName: string;
  templateKey: SectorTemplateKey;
  templateVersion: number;
  primaryProblem: ProblemId;
  primaryProblemLabel: string;
  summary: string;
  evidence: string[];
  solutionTitle: string;
  solutionSummary: string;
  steps: [string, string, string];
  benefits: string[];
  limitations: string[];
  assumptions: string[];
  demoType: DemoType;
  demoTitle: string;
  source: "rules";
  signal: "clara" | "insuficiente";
}

export interface CompanyRecord {
  id: string;
  name: string;
  industryId: IndustryId;
  size: SizeId;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  companyId: string;
  status: "completed";
  createdAt: string;
  expiresAt: string | null;
}

export interface DiagnosticRecord {
  id: string;
  companyId: string;
  sessionId: string;
  industryId: IndustryId;
  answers: Answers;
  diagnosis: Diagnosis;
  createdAt: string;
}

export interface TemplateConfig {
  key: TemplateKey;
  name: string;
  version: number;
  description: string;
}

export interface WalkthroughState {
  version: 1;
  templateKey: TemplateKey;
  industryId: IndustryId | null;
  step: number;
  draft: DraftAnswers;
  diagnosis: Diagnosis | null;
  storageWarning: string | null;
}

export type DiagnosisResponse =
  | { ok: true; diagnosis: Diagnosis }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };
