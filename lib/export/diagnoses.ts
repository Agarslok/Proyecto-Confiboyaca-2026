import { GOALS, LEVELS, PLANS, SIZES } from "@/lib/radar/bank";
import { buildRadarResult, coreQuestions, nicheQuestions } from "@/lib/radar/engine";
import type { Cell, Sheet } from "@/lib/export/spreadsheet";
import type { DiagnosisRecord } from "@/lib/store/diagnoses";
import { LEAD_LABELS } from "@/lib/store/lead-status";

const POINTS: Record<string, number | null> = { A: 0, B: 1, C: 2, D: 3, E: null };
const date = (iso: string) => (iso ? iso.slice(0, 19).replace("T", " ") : "");

/** Hoja 1: una fila por empresa, con contacto, resultado, plan y seguimiento. */
export function diagnosesSheet(records: DiagnosisRecord[]): Sheet {
  const header: Cell[] = [
    "Código", "Empresa", "Contacto", "Correo", "Teléfono", "Ciudad", "Industria", "Actividad", "Tamaño",
    "Índice (0-100)", "Nivel", "Negocio", "Datos", "Tecnología", "Analítica e IA", "Equipo", "Estrategia",
    "Problema central", "Solución en la página", "Objetivos", "Plan", "Horas estimadas", "Visitas", "Meses",
    "Hallazgos críticos", "Respuestas «No sé»", "Seguimiento", "Pidió llamada", "Notas", "Autorizó datos", "Creado", "Actualizado",
  ];
  const rows = records.map((record) => {
    const result = buildRadarResult(record.answers);
    const score = (id: string) => result.dimensions.find((dimension) => dimension.id === id)?.score ?? null;
    return [
      record.code, record.companyName, record.contactName, record.email, record.phone, record.city,
      record.industry, record.activity, record.answers.size ? SIZES[record.answers.size].detail : "",
      result.index, LEVELS[result.level].label,
      score("negocio"), score("datos"), score("tecnologia"), score("analitica"), score("equipo"), score("estrategia"),
      result.central?.problem ?? "", result.central?.name ?? "",
      record.answers.goals.map((goal) => GOALS[goal].label).join(", "),
      PLANS[result.plan].name, result.effort.total, result.effort.visits, result.effort.months,
      result.findings.filter((finding) => finding.severity === "critico").length, result.unsure,
      LEAD_LABELS[record.status], date(record.interestAt), record.notes,
      date(record.consentAt), date(record.createdAt), date(record.updatedAt),
    ] as Cell[];
  });
  return { name: "Diagnósticos", rows: [header, ...rows] };
}

/** Hoja 2: una fila por pregunta respondida, para analizar respuestas por nicho. */
export function answersSheet(records: DiagnosisRecord[]): Sheet {
  const header: Cell[] = ["Código", "Empresa", "Industria", "Actividad", "Dimensión", "Pregunta", "Opción", "Respuesta", "Puntos"];
  const rows: Cell[][] = [];
  for (const record of records) {
    const { industry, activity, choices } = record.answers;
    const questions = [...nicheQuestions(record.answers), ...coreQuestions(industry || undefined, activity)];
    for (const question of questions) {
      const key = choices[question.id];
      if (!key) continue;
      const text = key === "E" ? "No sé" : question.options["ABCD".indexOf(key)];
      rows.push([record.code, record.companyName, record.industry, record.activity, question.section, question.text, key, text, POINTS[key]]);
    }
  }
  return { name: "Respuestas", rows: [header, ...rows] };
}
