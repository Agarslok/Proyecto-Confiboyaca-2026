import type { IndustryId, ProblemId, SectorTemplateKey } from "@/types/domain";

export interface IndustryConfig {
  id: IndustryId;
  slug: string;
  name: string;
  summary: string;
  templateKey: SectorTemplateKey;
  lenses: Record<ProblemId, string>;
  prompts: Record<ProblemId, string>;
}
