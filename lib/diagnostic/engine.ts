import { demos, frequencies, goalBenefits, goals, methodOpeners, methods, problems, sizes } from "@/config/catalog";
import { getIndustry } from "@/config/industries";
import { getTemplate } from "@/config/templates";
import type {
  Answers,
  DemoType,
  Diagnosis,
  DiagnosisIds,
  GoalId,
  ProblemId,
} from "@/types/domain";

const DIRECT_DEMO: Record<Exclude<ProblemId, "otro">, DemoType> = {
  captacion: "crm",
  seguimiento: "crm",
  administracion: "tasks",
  inventario: "inventory",
  tareas: "tasks",
  analisis: "analytics",
};

const SOLUTIONS: Record<
  Exclude<ProblemId, "otro">,
  { title: string; summary: string; steps: [string, string, string]; benefit: string }
> = {
  captacion: {
    title: "Un registro único de oportunidades nuevas",
    summary: "Concentrar cada oportunidad que entra, con origen, responsable y siguiente contacto.",
    steps: [
      "Definir qué cuenta como una oportunidad y quién la registra el mismo día.",
      "Dejar visibles el origen, el responsable y la fecha del siguiente contacto.",
      "Revisar una vez por semana las oportunidades que siguen sin movimiento.",
    ],
    benefit:
      "El equipo puede ver qué oportunidades están vivas sin reconstruir la historia desde chats o la memoria.",
  },
  seguimiento: {
    title: "Seguimiento con el próximo paso a la vista",
    summary: "Pasar de una lista de nombres a un tablero donde cada cuenta tiene estado y una próxima acción.",
    steps: [
      "Abrir un registro por cuenta activa, no por cada mensaje suelto.",
      "Asignar un estado y una fecha de siguiente contacto a cada una.",
      "Acordar quién revisa los seguimientos vencidos.",
    ],
    benefit:
      "Las oportunidades dejan de depender de que una persona recuerde a quién hay que escribir.",
  },
  administracion: {
    title: "Bandeja única de pendientes administrativos",
    summary: "Reunir facturas, aprobaciones y trámites en una lista con estado.",
    steps: [
      "Listar los pendientes abiertos y nombrar un responsable por cada uno.",
      "Separar lo que está en curso de lo que espera a otra persona.",
      "Revisar la bandeja en un momento fijo de la semana.",
    ],
    benefit: "Los trámites dejan de esconderse en correos y se puede ver qué está frenado.",
  },
  inventario: {
    title: "Existencias con mínimos visibles",
    summary: "Ver qué materiales están cerca de agotarse antes de que el faltante detenga un pedido o una entrega.",
    steps: [
      "Elegir los materiales críticos y registrar una existencia mínima para cada uno.",
      "Unificar el conteo en un solo registro, con fecha de la última actualización.",
      "Atender primero las alertas, no el inventario completo.",
    ],
    benefit:
      "El equipo puede anticipar un faltante en los materiales que de verdad detienen la operación.",
  },
  tareas: {
    title: "Tablero corto de tareas del equipo",
    summary: "Hacer visible quién tiene qué, sin añadir una metodología pesada.",
    steps: [
      "Sacar las tareas de la semana a un tablero compartido.",
      "Marcar cada una como pendiente, en curso o lista.",
      "Cerrar la semana revisando lo que no se movió.",
    ],
    benefit: "La carga de trabajo se puede conversar con la lista delante, no de memoria.",
  },
  analisis: {
    title: "Un tablero breve con pocos indicadores",
    summary: "Elegir pocos números que el equipo sí va a mirar.",
    steps: [
      "Acordar tres o cuatro indicadores ligados al problema declarado.",
      "Definir de dónde sale cada número y cada cuánto se actualiza.",
      "Revisar el tablero en la misma reunión donde se deciden las acciones.",
    ],
    benefit:
      "Las decisiones se apoyan en un conjunto pequeño de datos acordados, no en un informe distinto cada vez.",
  },
};

export function isWeakSignal(answers: Answers): boolean {
  return answers.painFrequency === "ocasional" && answers.currentMethod === "software";
}

export function selectDemo(answers: Answers): DemoType {
  if (answers.primaryProblem !== "otro") return DIRECT_DEMO[answers.primaryProblem];
  if (answers.goals.includes("ventas")) return "crm";
  if (answers.goals.includes("decisiones") || answers.goals.includes("informacion")) {
    return "analytics";
  }
  return "tasks";
}

function solutionKey(answers: Answers): Exclude<ProblemId, "otro"> {
  if (answers.primaryProblem !== "otro") return answers.primaryProblem;
  const demo = selectDemo(answers);
  if (demo === "crm") return answers.goals.includes("ventas") ? "seguimiento" : "captacion";
  if (demo === "analytics") return "analisis";
  if (demo === "inventory") return "inventario";
  return answers.goals.includes("errores") ? "administracion" : "tareas";
}

function listLabels(ids: GoalId[]): string {
  return ids.map((id) => goals[id].toLowerCase()).join(", ");
}

function otherProblems(answers: Answers): string {
  const extra = answers.problems.filter((id) => id !== answers.primaryProblem);
  if (extra.length === 0) return "No marcó problemas adicionales.";
  return `También marcó: ${extra.map((id) => problems[id].label.toLowerCase()).join(", ")}.`;
}

export function buildDiagnosis(answers: Answers, ids: DiagnosisIds): Diagnosis {
  const industry = getIndustry(answers.industryId);
  const template = getTemplate(industry.templateKey);
  const key = solutionKey(answers);
  const solution = SOLUTIONS[key];
  const lens = industry.lenses[answers.primaryProblem];
  const weak = isWeakSignal(answers);
  const demoType = selectDemo(answers);
  const opener = methodOpeners[answers.currentMethod];
  const primaryGoal = answers.goals[0];
  const steps: [string, string, string] = [opener, solution.steps[1], solution.steps[2]];

  const summary = weak
    ? `${answers.companyName} indica que ya cuenta con un software y que el inconveniente aparece ${frequencies[answers.painFrequency].phrase}. Con esas respuestas no alcanza para afirmar que ${lens} esté fallando. Lo que sigue es una hipótesis para conversar, no un hallazgo cerrado.`
    : `${answers.companyName} declara que ${lens} se gestiona ${methods[answers.currentMethod].phrase}. El inconveniente aparece ${frequencies[answers.painFrequency].phrase}. En un equipo de ${sizes[answers.size].toLowerCase()}, ese patrón merece atención antes de sumar otra herramienta. Esto describe lo respondido, no un resultado medido.`;

  const evidence = [
    answers.primaryProblem === "otro"
      ? `Problema principal descrito por la empresa: ${answers.otherProblem?.trim()}.`
      : `Problema principal declarado: ${problems[answers.primaryProblem].label.toLowerCase()}.`,
    otherProblems(answers),
    `Hoy el proceso vive ${methods[answers.currentMethod].phrase}.`,
    `La dificultad aparece ${frequencies[answers.painFrequency].phrase}.`,
    `Objetivos marcados: ${listLabels(answers.goals)}.`,
    `Tamaño declarado: ${sizes[answers.size].toLowerCase()}.`,
    `En ${industry.name.toLowerCase()}, la lectura se hace sobre ${lens}.`,
  ];

  const limitations = [
    "Los beneficios describen una oportunidad por validar. Este prototipo no mide ahorros, ventas ni tiempos de la empresa.",
  ];
  if (weak) {
    limitations.push(
      "La señal es insuficiente para presentar la recomendación como un hecho. Conviene confirmarla con quien opera el proceso.",
    );
  }
  if (answers.primaryProblem === "otro") {
    limitations.push(
      "El problema llegó en texto libre. La demostración se eligió por los objetivos, no por una lectura automática de ese texto.",
    );
  }
  if (answers.problems.length > 1) {
    limitations.push("Se priorizó un solo problema. Los demás quedan fuera de esta recomendación.");
  }

  return {
    id: ids.diagnosisId,
    companyId: ids.companyId,
    sessionId: ids.sessionId,
    companyName: answers.companyName,
    industryId: answers.industryId,
    industryName: industry.name,
    templateKey: industry.templateKey,
    templateVersion: template.version,
    primaryProblem: answers.primaryProblem,
    primaryProblemLabel: problems[answers.primaryProblem].label,
    summary,
    evidence,
    solutionTitle: solution.title,
    solutionSummary: `${solution.summary} En ${industry.name.toLowerCase()}, el foco declarado es ${lens}.`,
    steps,
    benefits: [solution.benefit, goalBenefits[primaryGoal]],
    limitations,
    assumptions: [
      "Las respuestas describen la percepción de quien completa el formulario, no una auditoría de procesos.",
      "El tamaño y la frecuencia son declarados. No están verificados con registros de la empresa.",
      "La demostración usa datos ficticios y no describe la operación real.",
    ],
    demoType,
    demoTitle: demos[demoType].title,
    source: "rules",
    signal: weak ? "insuficiente" : "clara",
  };
}
