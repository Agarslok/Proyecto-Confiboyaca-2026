import { CORE_QUESTIONS, INDUSTRIES, INDUSTRY_QUESTIONS, LINK_QUESTIONS } from "@/lib/radar/bank";
import { screensFor } from "@/lib/radar/engine";
import type { RadarAnswers, RadarQuestion } from "@/lib/radar/types";

/**
 * Catálogo y respuestas en tablas propias.
 * No hay una tabla por industria: la industria es una columna, así una pregunta
 * compartida (datos, equipo, estrategia) no se duplica doce veces.
 */

export interface IndustryRow {
  id: string;
  label: string;
  template: string;
}

export interface ActivityRow {
  id: string;
  industry_id: string;
  label: string;
  link: string;
}

export interface QuestionRow {
  id: string;
  industry_id: string | null;
  link: string | null;
  scope: "industria" | "eslabon" | "transversal";
  dimension: string;
  section: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface AnswerRow {
  diagnosis_id: string;
  question_id: string;
  industry_id: string;
  option_key: string;
  points: number;
  prompt: string;
}

export interface GoalRow {
  diagnosis_id: string;
  goal_id: string;
}

function questionRow(question: RadarQuestion, scope: QuestionRow["scope"], industryId: string | null, link: string | null): QuestionRow {
  const [optionA, optionB, optionC, optionD] = question.options;
  return {
    id: question.id,
    industry_id: industryId,
    link,
    scope,
    dimension: question.dimension,
    section: question.section,
    prompt: question.text,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
  };
}

export function industryCatalog(): IndustryRow[] {
  return INDUSTRIES.map((industry) => ({ id: industry.id, label: industry.label, template: industry.template }));
}

export function activityCatalog(): ActivityRow[] {
  return INDUSTRIES.flatMap((industry) =>
    industry.activities.map((activity) => ({
      id: activity.id,
      industry_id: industry.id,
      label: activity.label,
      link: activity.link,
    })),
  );
}

export function questionCatalog(): QuestionRow[] {
  const rows: QuestionRow[] = [];
  for (const [industryId, questions] of Object.entries(INDUSTRY_QUESTIONS)) {
    for (const question of questions) rows.push(questionRow(question, "industria", industryId, null));
  }
  for (const [link, questions] of Object.entries(LINK_QUESTIONS)) {
    for (const question of questions) rows.push(questionRow(question, "eslabon", null, link));
  }
  for (const question of CORE_QUESTIONS) rows.push(questionRow(question, "transversal", null, null));
  return rows;
}

/** Una fila por pregunta que vio esa empresa, con la opción que marcó. */
export function answerRowsFor(diagnosisId: string, answers: RadarAnswers): AnswerRow[] {
  const rows: AnswerRow[] = [];
  for (const screen of screensFor(answers)) {
    if (screen.kind !== "question") continue;
    const option = answers.choices[screen.question.id];
    if (!option) continue;
    rows.push({
      diagnosis_id: diagnosisId,
      question_id: screen.question.id,
      industry_id: answers.industry,
      option_key: option,
      points: option === "E" ? 0 : "ABCD".indexOf(option),
      prompt: screen.question.text,
    });
  }
  return rows;
}

export function goalRowsFor(diagnosisId: string, answers: RadarAnswers): GoalRow[] {
  return answers.goals.map((goal) => ({ diagnosis_id: diagnosisId, goal_id: goal }));
}
