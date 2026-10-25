import { z } from "zod";
import { fieldErrorsFromZod } from "@/lib/validation/answers";
import type { SiteBrief } from "@/lib/site/engine";
import { formatCompanyName } from "@/lib/site/format-company-name";
import { AUDIENCE_IDS, FEATURE_IDS, GOAL_IDS, SECTOR_IDS, type SiteDraft } from "@/types/site";

export const siteBriefSchema = z.object({
  companyName: z.string().trim().min(2, "Escriba el nombre de la empresa.").max(80, "Use un nombre más corto."),
  sectorId: z.enum(SECTOR_IDS, { error: "Elija un sector." }),
  activity: z.string().trim().max(280, "Acórtela a 280 caracteres."),
  audience: z.union([z.enum(AUDIENCE_IDS), z.literal("")]),
  goal: z.union([z.enum(GOAL_IDS), z.literal("")]),
  otherGoal: z.string().trim().max(120, "Describa el objetivo en menos de 120 caracteres."),
  features: z.array(z.enum(FEATURE_IDS)),
});

export function parseSiteBrief(
  draft: SiteDraft,
): { ok: true; brief: SiteBrief } | { ok: false; fieldErrors: Record<string, string> } {
  const parsed = siteBriefSchema.safeParse(draft);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  return {
    ok: true,
    brief: { ...parsed.data, companyName: formatCompanyName(parsed.data.companyName) },
  };
}

export function validateSiteStep(step: number, draft: SiteDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (draft.companyName.trim().length < 2) errors.companyName = "Escriba el nombre de la empresa.";
    if (!draft.sectorId) errors.sectorId = "Elija un sector.";
  }
  return errors;
}
