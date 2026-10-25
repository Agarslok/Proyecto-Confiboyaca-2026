import type {
  CurrentMethod,
  DemoType,
  GoalId,
  IndustryId,
  PainFrequency,
  ProblemId,
  SizeId,
} from "@/types/domain";

export const industriesCatalog: Record<
  IndustryId,
  { name: string; summary: string }
> = {
  metalurgia: {
    name: "Metalurgia",
    summary: "Plantas, talleres y transformación de materiales.",
  },
  servicios: {
    name: "Servicios profesionales",
    summary: "Firmas, consultores y equipos que venden conocimiento.",
  },
};

export const problems: Record<ProblemId, { label: string; description: string }> = {
  captacion: {
    label: "Captación de clientes",
    description: "Oportunidades y cotizaciones que entran sin un registro común.",
  },
  seguimiento: {
    label: "Seguimiento comercial",
    description: "Cuentas y propuestas que dependen de la memoria del equipo.",
  },
  administracion: {
    label: "Procesos administrativos",
    description: "Facturas, aprobaciones y trámites repartidos en mensajes.",
  },
  inventario: {
    label: "Inventario",
    description: "Existencias que se descubren tarde, cuando ya falta material.",
  },
  tareas: {
    label: "Organización de tareas",
    description: "Trabajo de la semana que no tiene responsable ni estado visible.",
  },
  analisis: {
    label: "Análisis de datos",
    description: "Decisiones que se toman sin un conjunto breve de indicadores.",
  },
  otro: {
    label: "Otro problema",
    description: "Una situación que no encaja en las categorías anteriores.",
  },
};

export const goals: Record<GoalId, string> = {
  tiempo: "Ahorrar tiempo",
  errores: "Reducir errores",
  ventas: "Mejorar las ventas",
  informacion: "Organizar la información",
  decisiones: "Tomar mejores decisiones",
};

export const sizes: Record<SizeId, string> = {
  "1-10": "1 a 10 personas",
  "11-50": "11 a 50 personas",
  "51-250": "51 a 250 personas",
  "251+": "Más de 250 personas",
};

export const methods: Record<CurrentMethod, { label: string; phrase: string }> = {
  memoria: {
    label: "En la memoria del equipo",
    phrase: "en la memoria del equipo",
  },
  hojas: {
    label: "Hojas de cálculo o documentos sueltos",
    phrase: "en hojas de cálculo o documentos sueltos",
  },
  software: {
    label: "Un software que no siempre se usa",
    phrase: "en un software que no siempre se usa",
  },
  mixto: {
    label: "Una mezcla de varios medios",
    phrase: "repartido entre varios medios",
  },
  nada: {
    label: "No hay un método definido",
    phrase: "sin un método definido",
  },
};

export const frequencies: Record<PainFrequency, { label: string; phrase: string }> = {
  diaria: { label: "Casi todos los días", phrase: "casi todos los días" },
  semanal: { label: "Varias veces por semana", phrase: "varias veces por semana" },
  ocasional: { label: "De vez en cuando", phrase: "solo de vez en cuando" },
};

export const demos: Record<DemoType, { title: string; description: string }> = {
  crm: {
    title: "Seguimiento comercial",
    description: "Cuentas ficticias, estados y una próxima acción.",
  },
  tasks: {
    title: "Gestión de tareas",
    description: "Pendientes de ejemplo con estado actualizable.",
  },
  inventory: {
    title: "Control de existencias",
    description: "Materiales de ejemplo con mínimos y alertas.",
  },
  analytics: {
    title: "Tablero de indicadores",
    description: "Cifras ficticias para mostrar un tablero breve.",
  },
};

export const methodOpeners: Record<CurrentMethod, string> = {
  memoria:
    "Sacar el proceso de la memoria de una persona y dejar el dato mínimo en un registro común.",
  hojas:
    "Sustituir las hojas sueltas por un solo registro, con responsable y fecha.",
  software:
    "Revisar si la herramienta actual se usa para este proceso o solo está contratada.",
  mixto:
    "Elegir un único lugar de registro y dejar de repartir el proceso entre varios medios.",
  nada: "Definir el registro mínimo que el equipo sí se compromete a mantener.",
};

export const goalBenefits: Record<GoalId, string> = {
  tiempo:
    "Puede reducir el tiempo que se va en reconstruir el estado del proceso, si el registro se mantiene al día.",
  errores:
    "Puede hacer más visibles los olvidos y los registros duplicados, sin prometer que desaparezcan.",
  ventas:
    "Puede ayudar a que una oportunidad no se enfríe por falta de seguimiento. El efecto comercial habría que medirlo después.",
  informacion:
    "Puede dejar la información del proceso en un lugar compartido, en vez de repartida entre personas.",
  decisiones:
    "Puede ofrecer un punto de partida común para decidir, siempre que los datos se actualicen.",
};
