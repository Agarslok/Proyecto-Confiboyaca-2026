import type { LinkId } from "@/lib/radar/types";

export type ConversationExample = { user: string; assistant: string };

/** Perfil operativo por industria + subactividad (formulario Radar). */
export type SectorActivityProfile = {
  industryId: string;
  activityId: string;
  industryLabel: string;
  activityLabel: string;
  link: LinkId;
  businessContext: string;
  assistantRole: string;
  mainActivities: string[];
  initialQuestions: string[];
  followUpQuestions: string[];
  operationTypes: string[];
  entities: {
    primary: { id: string; label: string; description: string; fields: string[] };
    secondary: { id: string; label: string; description: string; fields: string[] };
  };
  validationRules: string[];
  dashboardIndicators: string[];
  recommendedCharts: string[];
  frequentQueries: string[];
  conversationExamples: ConversationExample[];
  /** Texto corto para Gemini (no repetir plantilla de anotar en consultas). */
  guidanceForModel: string;
};
