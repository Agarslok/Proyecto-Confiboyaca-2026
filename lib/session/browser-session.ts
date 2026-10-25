import { getIndustry } from "@/config/industries";
import { parseWalkthrough } from "@/lib/validation/answers";
import type {
  DraftAnswers,
  IndustryId,
  ProblemId,
  WalkthroughState,
} from "@/types/domain";

export const WALKTHROUGH_STORAGE_KEY = "confi.walkthrough.v1";

export const TEMPLATE_BOOT_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(WALKTHROUGH_STORAGE_KEY)});if(!raw)return;var data=JSON.parse(raw);var key=data&&data.templateKey;if(key==="industrial"||key==="services"||key==="base"){document.documentElement.dataset.template=key;}}catch(e){}})();`;

export function emptyDraft(): DraftAnswers {
  return {
    companyName: "",
    industryId: "",
    size: "",
    problems: [],
    otherProblem: "",
    primaryProblem: "",
    goals: [],
    currentMethod: "",
    painFrequency: "",
  };
}

export function emptyWalkthrough(): WalkthroughState {
  return {
    version: 1,
    templateKey: "base",
    industryId: null,
    step: 0,
    draft: emptyDraft(),
    diagnosis: null,
    storageWarning: null,
  };
}

const SERVER_SNAPSHOT = emptyWalkthrough();

export function normalizeDraft(draft: DraftAnswers): DraftAnswers {
  const problems = [...new Set(draft.problems)] as ProblemId[];
  let primaryProblem = draft.primaryProblem;
  if (problems.length === 1) primaryProblem = problems[0];
  else if (primaryProblem && !problems.includes(primaryProblem)) primaryProblem = "";
  return { ...draft, problems, primaryProblem };
}

export function parseStoredSession(raw: string): WalkthroughState {
  try {
    const parsed = parseWalkthrough(JSON.parse(raw));
    return parsed ?? emptyWalkthrough();
  } catch {
    return emptyWalkthrough();
  }
}

let state = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function persist(next: WalkthroughState): WalkthroughState {
  if (typeof window === "undefined") return next;
  try {
    const stored = { ...next, storageWarning: null };
    localStorage.setItem(WALKTHROUGH_STORAGE_KEY, JSON.stringify(stored));
    return stored;
  } catch {
    return {
      ...next,
      storageWarning:
        "El navegador no guardó el recorrido. Si recarga la página, habrá que empezar de nuevo.",
    };
  }
}

function update(next: WalkthroughState): void {
  state = persist(next);
  emit();
}

export function ensureWalkthroughLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const raw = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
  state = raw ? parseStoredSession(raw) : SERVER_SNAPSHOT;
}

export function getWalkthroughSnapshot(): WalkthroughState {
  ensureWalkthroughLoaded();
  return state;
}

export function getWalkthroughServerSnapshot(): WalkthroughState {
  return SERVER_SNAPSHOT;
}

export function subscribeWalkthrough(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasWalkthroughProgress(current: WalkthroughState): boolean {
  return Boolean(
    current.diagnosis ||
      current.draft.companyName ||
      current.draft.industryId ||
      current.draft.problems.length ||
      current.industryId,
  );
}

export function selectIndustry(industryId: IndustryId): void {
  const current = getWalkthroughSnapshot();
  const templateKey = getIndustry(industryId).templateKey;
  if (current.draft.industryId === industryId && current.templateKey === templateKey) return;
  update({
    ...current,
    industryId,
    templateKey,
    draft: { ...current.draft, industryId },
    diagnosis: current.draft.industryId === industryId ? current.diagnosis : null,
  });
}

export function patchDraft(partial: Partial<DraftAnswers>): void {
  const current = getWalkthroughSnapshot();
  const draft = normalizeDraft({ ...current.draft, ...partial });
  if (JSON.stringify(draft) === JSON.stringify(current.draft)) return;
  const templateKey = draft.industryId
    ? getIndustry(draft.industryId).templateKey
    : current.templateKey;
  update({
    ...current,
    draft,
    industryId: draft.industryId || current.industryId,
    templateKey,
    diagnosis: null,
  });
}

export function setWalkthroughStep(step: number): void {
  const current = getWalkthroughSnapshot();
  const nextStep = Math.min(3, Math.max(0, step));
  if (current.step === nextStep) return;
  update({ ...current, step: nextStep });
}

export function saveDiagnosis(diagnosis: WalkthroughState["diagnosis"]): void {
  const current = getWalkthroughSnapshot();
  if (!diagnosis) {
    update({ ...current, diagnosis: null });
    return;
  }
  update({
    ...current,
    diagnosis,
    industryId: diagnosis.industryId,
    templateKey: diagnosis.templateKey,
    step: 3,
  });
}

export function resetWalkthrough(): void {
  update(emptyWalkthrough());
  if (typeof window !== "undefined") {
    localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
  }
}
