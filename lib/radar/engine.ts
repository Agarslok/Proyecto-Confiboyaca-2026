import {
  CORE_QUESTIONS,
  DIMENSIONS,
  INDUSTRY_QUESTIONS,
  LINKS,
  LINK_QUESTIONS,
  SIZES,
  industryById,
} from "@/lib/radar/bank";
import type { PlanId } from "@/lib/radar/bank";
import { CASES } from "@/lib/radar/cases";
import { centralProblem } from "@/lib/radar/solution";
import type {
  Activity,
  CaseItem,
  DimensionScore,
  Finding,
  Industry,
  LevelId,
  OptionKey,
  RadarAnswers,
  RadarQuestion,
  RadarResult,
  Vocab,
} from "@/lib/radar/types";

export type Screen =
  | { kind: "empresa"; section: string }
  | { kind: "sector"; section: string }
  | { kind: "question"; section: string; question: RadarQuestion }
  | { kind: "objetivos"; section: string };

const POINTS: Record<OptionKey, number> = { A: 0, B: 1, C: 2, D: 3, E: 0 };
const SEVERITY_ORDER: Record<Finding["severity"], number> = { critico: 0, mejorable: 1, confirmar: 2 };

export function emptyRadarAnswers(): RadarAnswers {
  return {
    companyName: "", city: "", contactName: "", email: "", phone: "", consent: false,
    size: "", industry: "", activity: "", choices: {}, goals: [], cursor: 0,
  };
}

export function activityOf(answers: Pick<RadarAnswers, "industry" | "activity">): { industry?: Industry; activity?: Activity } {
  const industry = industryById(answers.industry);
  return { industry, activity: industry?.activities.find((item) => item.id === answers.activity) };
}

function vocabFor(industry: Industry, activity?: Activity): Vocab {
  return { ...industry.vocab, ...activity?.vocab };
}

function fill(text: string, vocab: Vocab): string {
  return text.replace(/\{(productos|clientes|punto)\}/g, (_, key: keyof Vocab) => vocab[key]);
}

function withVocab(question: RadarQuestion, vocab: Vocab): RadarQuestion {
  return { ...question, text: fill(question.text, vocab) };
}

/** 2 preguntas de la industria + 1 del eslabón que no repita tema. */
export function nicheQuestions(answers: Pick<RadarAnswers, "industry" | "activity">): RadarQuestion[] {
  const { industry, activity } = activityOf(answers);
  if (!industry || !activity) return [];
  const own = INDUSTRY_QUESTIONS[industry.id];
  const covered = new Set(own.flatMap((question) => question.topics ?? []));
  const link = LINK_QUESTIONS[activity.link].find(
    (question) =>
      !(question.topics ?? []).some((topic) => covered.has(topic)) && !question.skipFor?.includes(industry.id),
  );
  const vocab = vocabFor(industry, activity);
  return [...own, ...(link ? [link] : [])].map((question) => withVocab(question, vocab));
}

/** Todas las preguntas puntuables posibles para el nicho, visibles u ocultas. */
function allScoredQuestions(answers: RadarAnswers): RadarQuestion[] {
  const { industry, activity } = activityOf(answers);
  const vocab = industry ? vocabFor(industry, activity) : { productos: "productos", clientes: "clientes", punto: "sede" };
  return [...nicheQuestions(answers), ...CORE_QUESTIONS.map((question) => withVocab(question, vocab))];
}

function isVisible(question: RadarQuestion, answers: RadarAnswers): boolean {
  return question.showIf ? question.showIf(answers) : true;
}

/** Pantallas del formulario. Cambia según industria, actividad y respuestas. */
export function screensFor(answers: RadarAnswers): Screen[] {
  const screens: Screen[] = [
    { kind: "empresa", section: "Empresa" },
    { kind: "sector", section: "Sector" },
  ];
  for (const question of allScoredQuestions(answers)) {
    if (isVisible(question, answers)) screens.push({ kind: "question", section: question.section, question });
  }
  screens.push({ kind: "objetivos", section: "Estrategia" });
  return screens;
}

export function screenIsDone(screen: Screen, answers: RadarAnswers): boolean {
  switch (screen.kind) {
    case "empresa":
      return answers.companyName.trim().length >= 2 && Boolean(answers.size) && answers.consent;
    case "sector":
      return Boolean(activityOf(answers).activity);
    case "question":
      return Boolean(answers.choices[screen.question.id]);
    case "objetivos":
      return answers.goals.length > 0;
  }
}

export function isRadarComplete(answers: RadarAnswers): boolean {
  return screensFor(answers).every((screen) => screenIsDone(screen, answers));
}

function levelFor(index: number): LevelId {
  if (index < 35) return "alto";
  if (index < 62) return "moderado";
  return "bajo";
}

/** Microempresa o pequeña que registra en papel o en Excel suelto: necesita primeros pasos muy sencillos. */
export function needsFirstSteps(answers: Pick<RadarAnswers, "size" | "choices">): boolean {
  const small = answers.size === "micro" || answers.size === "pequena";
  const record = answers.choices["datos-registro"];
  return small && (record === "A" || record === "B" || record === "E");
}

/**
 * Prioridad: industria +100, eslabón +50, transversal 0, +10 por objetivo.
 * Si la empresa necesita primeros pasos, esos casos suben +150 y se muestran
 * hasta 3, antes que los demás; si no, no se muestran.
 */
export function pickCases(level: LevelId, answers: Pick<RadarAnswers, "industry" | "activity" | "goals" | "size" | "choices">, count = 6): CaseItem[] {
  const { industry, activity } = activityOf(answers);
  const firstSteps = needsFirstSteps(answers);
  let small = 0;
  return CASES.map((item, order) => {
    let score = -1;
    if (item.levels.includes(level)) {
      if (item.forSmall) score = firstSteps ? 150 : -1;
      else if (item.kind === "transversal") score = 0;
      if (item.kind === "eslabon" && item.appliesTo === activity?.link) score = 50;
      if (item.kind === "industria" && item.appliesTo === industry?.id) score = 100;
    }
    if (score >= 0) score += 10 * item.goals.filter((goal) => answers.goals.includes(goal)).length;
    return { item, score, order };
  })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .filter((entry) => !entry.item.forSmall || ++small <= 3)
    .slice(0, count)
    .map((entry) => entry.item);
}

/**
 * Índice 0–100 = Σ (puntaje de la dimensión × peso); puntaje de la dimensión =
 * puntos ÷ (3 × preguntas) × 100. Las preguntas condicionales ocultas no
 * cuentan, salvo las que se infieren (inferWhenHidden).
 * Se puede llamar con respuestas parciales: así se dibuja el radar en vivo.
 */
export function scoreRadar(answers: RadarAnswers) {
  const sums = new Map(DIMENSIONS.map((dimension) => [dimension.id, { points: 0, count: 0 }]));
  const scored: { question: RadarQuestion; points: number; key: OptionKey | "inferido" }[] = [];

  for (const question of allScoredQuestions(answers)) {
    const visible = isVisible(question, answers);
    const choice = answers.choices[question.id];
    let entry: (typeof scored)[number] | null = null;
    if (visible && choice) entry = { question, points: POINTS[choice], key: choice };
    if (!visible && question.inferWhenHidden && answers.choices["datos-registro"]) {
      entry = { question, points: question.inferWhenHidden.points, key: "inferido" };
    }
    if (!entry) continue;
    scored.push(entry);
    const sum = sums.get(question.dimension)!;
    sum.points += entry.points;
    sum.count += 1;
  }

  const dimensions: DimensionScore[] = DIMENSIONS.map((dimension) => {
    const sum = sums.get(dimension.id)!;
    return {
      id: dimension.id,
      label: dimension.short,
      weight: dimension.weight,
      score: sum.count ? Math.round((sum.points / (3 * sum.count)) * 100) : 0,
      answered: sum.count,
    };
  });

  const answeredWeight = dimensions.reduce((total, dimension) => total + (dimension.answered ? dimension.weight : 0), 0);
  const weighted = dimensions.reduce((total, dimension) => total + (dimension.answered ? dimension.score * dimension.weight : 0), 0);
  const index = answeredWeight ? Math.round(weighted / answeredWeight) : 0;

  let level = levelFor(index);
  let levelNote: string | null = null;
  const datos = dimensions.find((dimension) => dimension.id === "datos")!;
  if (datos.answered && datos.score < 30 && level !== "alto") {
    level = "alto";
    levelNote = `La dimensión Datos quedó en ${datos.score}/100 (menos de 30): sin datos no hay base para la IA, así que el nivel es riesgo alto aunque el índice dé más.`;
  } else if (datos.answered && datos.score < 55 && level === "bajo") {
    level = "moderado";
    levelNote = `La dimensión Datos quedó en ${datos.score}/100 (menos de 55): la empresa no puede quedar en riesgo bajo hasta fortalecer sus datos.`;
  }

  const findings: Finding[] = scored
    .filter((entry) => entry.points <= 1)
    .map(({ question, points, key }) => {
      const dimension = dimensions.find((item) => item.id === question.dimension)!;
      const severity: Finding["severity"] = key === "E" ? "confirmar" : points === 0 ? "critico" : "mejorable";
      return {
        questionId: question.id,
        dimension: question.dimension,
        severity,
        text: key === "inferido" && question.inferWhenHidden ? question.inferWhenHidden.reason : question.finding,
        weight: dimension.weight / Math.max(1, dimension.answered),
      };
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.weight - a.weight);

  const unsure = scored.filter((entry) => entry.key === "E").length;
  return { index, level, levelNote, dimensions, findings, scoredCount: scored.length, unsure };
}

export function buildRadarResult(answers: RadarAnswers): RadarResult {
  const { industry, activity } = activityOf(answers);
  const score = scoreRadar(answers);
  return {
    index: score.index,
    level: score.level,
    levelNote: score.levelNote,
    dimensions: score.dimensions,
    findings: score.findings,
    cases: pickCases(score.level, answers),
    industryLabel: industry?.label ?? "",
    activityLabel: activity?.label ?? "",
    linkLabel: activity ? LINKS[activity.link] : "",
    sizeLabel: answers.size ? `${SIZES[answers.size].detail} (${SIZES[answers.size].label} personas)` : "",
    questionsAnswered: score.scoredCount,
    unsure: score.unsure,
    central: centralProblem(score.findings, score.dimensions, answers.companyName, answers.industry),
    ...(() => {
      const { plan, next } = planFor(score.level, answers);
      return { plan, nextPlan: next, firstSteps: needsFirstSteps(answers) };
    })(),
  };
}

/** Para el catálogo: preguntas propias del nicho y cuántas pantallas puede tener. */
export function nicheSummary(industryId: Industry["id"], activityId: string) {
  const base: RadarAnswers = { ...emptyRadarAnswers(), industry: industryId, activity: activityId };
  const shortest = screensFor({ ...base, choices: { "datos-registro": "A", "ia-uso": "A" } }).length;
  const longest = screensFor({ ...base, choices: { "datos-registro": "B", "ia-uso": "B" } }).length;
  return { questions: nicheQuestions(base), shortest, longest };
}

/** Las preguntas comunes, con el vocabulario del nicho si se indica. */
export function coreQuestions(industryId?: Industry["id"], activityId?: string): RadarQuestion[] {
  const { industry, activity } = activityOf({ industry: industryId ?? "", activity: activityId ?? "" });
  const vocab = industry ? vocabFor(industry, activity) : { productos: "productos", clientes: "clientes", punto: "sede" };
  return CORE_QUESTIONS.map((question) => withVocab(question, vocab));
}

/** Plan de acompañamiento según el nivel y el tamaño; el siguiente queda como paso posterior. */
export function planFor(level: LevelId, answers: Pick<RadarAnswers, "size" | "choices">): { plan: PlanId; next: PlanId | null } {
  if (level === "bajo") return { plan: "crecer", next: null };
  if (level === "moderado") return { plan: "orden", next: "crecer" };
  const small = answers.size === "micro" || answers.size === "pequena";
  return small || needsFirstSteps(answers) ? { plan: "arranque", next: "orden" } : { plan: "orden", next: "crecer" };
}
