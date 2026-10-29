import { buildSite } from "@/lib/site/engine";
import { parseSiteBrief } from "@/lib/validation/site";
import type { FeatureId, SectorId, SiteConfig, SiteDraft, SiteState } from "@/types/site";
import { FEATURE_IDS, SECTOR_IDS } from "@/types/site";
import { normalizeRadarAnswers } from "@/lib/radar/session";

export const SITE_STORAGE_KEY = "confi.site.v1";
export const INTRO_SEEN_KEY = "confi.intro.seen";

export const INTRO_BOOT_SCRIPT = `(function(){try{document.documentElement.dataset.template="base";if(!sessionStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)})){document.documentElement.dataset.intro="pending";}setTimeout(function(){if(document.documentElement.dataset.intro==="pending"){document.documentElement.dataset.intro="done";var shell=document.querySelector(".shell");if(shell)shell.style.clipPath="";}},8000);}catch(e){}})();`;

export function emptyDraft(): SiteDraft {
  return {
    companyName: "",
    sectorId: "",
    activity: "",
    audience: "",
    goal: "",
    otherGoal: "",
    features: [],
  };
}

export function emptySiteState(): SiteState {
  return {
    version: 1,
    step: 0,
    maxStep: 0,
    draft: emptyDraft(),
    config: null,
    storageWarning: null,
  };
}

const SERVER_SNAPSHOT = emptySiteState();
let state = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function persist(next: SiteState): SiteState {
  if (typeof window === "undefined") return next;
  try {
    const stored = { ...next, storageWarning: null };
    localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(stored));
    return stored;
  } catch {
    return {
      ...next,
      storageWarning:
        "El navegador no guardó el formulario. Si recarga la página, habrá que empezarlo de nuevo.",
    };
  }
}

function update(next: SiteState): void {
  state = persist(next);
  emit();
}

function isDraft(value: unknown): value is SiteDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as SiteDraft;
  return typeof draft.companyName === "string" && Array.isArray(draft.features);
}

function normalizeDraft(partial: SiteDraft): SiteDraft {
  const draft = { ...emptyDraft(), ...partial };
  if (!SECTOR_IDS.includes(draft.sectorId as SectorId)) draft.sectorId = "";
  draft.features = draft.features.filter((feature): feature is FeatureId =>
    (FEATURE_IDS as readonly string[]).includes(feature),
  );
  if (draft.radar) draft.radar = normalizeRadarAnswers(draft.radar);
  else delete draft.radar;
  return draft;
}

export function parseStoredSite(raw: string): SiteState {
  try {
    const parsed = JSON.parse(raw) as Partial<SiteState>;
    if (parsed.version !== 1 || !isDraft(parsed.draft)) return emptySiteState();
    return {
      version: 1,
      step: typeof parsed.step === "number" ? parsed.step : 0,
      maxStep: typeof parsed.maxStep === "number" ? parsed.maxStep : 0,
      draft: normalizeDraft(parsed.draft),
      config: configFromDraft(normalizeDraft(parsed.draft)),
      storageWarning: null,
    };
  } catch {
    return emptySiteState();
  }
}

export function ensureSiteLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const raw = localStorage.getItem(SITE_STORAGE_KEY);
  state = raw ? parseStoredSite(raw) : SERVER_SNAPSHOT;
}

export function getSiteSnapshot(): SiteState {
  ensureSiteLoaded();
  return state;
}

export function getSiteServerSnapshot(): SiteState {
  return SERVER_SNAPSHOT;
}

export function subscribeSite(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasSiteProgress(current: SiteState): boolean {
  return Boolean(current.config || current.draft.companyName || current.draft.sectorId || current.step > 0);
}

export function patchSiteDraft(partial: Partial<SiteDraft>): void {
  const current = getSiteSnapshot();
  const draft = normalizeDraft({ ...current.draft, ...partial });
  if (JSON.stringify(draft) === JSON.stringify(current.draft)) return;
  update({ ...current, draft, config: null });
}

export function setSiteStep(step: number): void {
  const current = getSiteSnapshot();
  const nextStep = Math.min(2, Math.max(0, step));
  if (current.step === nextStep && current.maxStep >= nextStep) return;
  update({ ...current, step: nextStep, maxStep: Math.max(current.maxStep, nextStep) });
}

export function saveSiteConfig(config: SiteConfig): void {
  const current = getSiteSnapshot();
  update({ ...current, config, step: 2, maxStep: 2 });
}

function configFromDraft(draft: SiteDraft): SiteConfig | null {
  const parsed = parseSiteBrief(draft);
  return parsed.ok ? buildSite(parsed.brief) : null;
}

export function rebuildSiteConfig(): SiteConfig | null {
  const current = getSiteSnapshot();
  const config = configFromDraft(current.draft);
  if (!config) return null;
  saveSiteConfig(config);
  return config;
}

export function resetSite(): void {
  update(emptySiteState());
  if (typeof window !== "undefined") localStorage.removeItem(SITE_STORAGE_KEY);
}
