export interface PitchSector {
  id: string;
  title: string;
  problem: string;
  opportunity: string;
  application: string;
}

export interface PitchBar {
  label: string;
  value: number;
}

export interface PitchFlowStep {
  title: string;
  text: string;
}

export interface PitchMentorshipOffer {
  title: string;
  subtitle: string;
  audience: string;
  format: string;
  outcomes: string[];
  icon: "analytics" | "ai";
}

export interface PitchNextStepPhase {
  title: string;
  text: string;
}

export interface PitchCustomCoursePillar {
  title: string;
  text: string;
}

export interface PitchCustomCourseTopic {
  label: string;
  tag: string;
}

export interface PitchSlideContent {
  id: string;
  label: string;
  notes: string;
  /** Último paso interno. 0 significa que la diapositiva no tiene revelados extra. */
  beats: number;
}

export const pitchFlow: PitchFlowStep[] = [
  { title: "Entrada", text: "Mensajes, ventas, tareas o documentos que la empresa ya produce." },
  { title: "Proceso", text: "Una herramienta ordena esa información y señala un patrón posible." },
  { title: "Resultado", text: "Una propuesta concreta que una persona puede aceptar, corregir o descartar." },
];

/** Tres ideas simples para la diapositiva de apertura (visual + texto). */
export const pitchEraPillars: PitchFlowStep[] = [
  { title: "Datos del día a día", text: "Ventas, pedidos, inventario y mensajes que ya existen." },
  { title: "Orden y lectura", text: "La IA agrupa y resalta; no inventa cifras." },
  { title: "Decisión humana", text: "Quien dirige valida, corrige o descarta." },
];

export const pitchWhatExamples: string[] = [
  "Ejemplo: repetir la misma respuesta en WhatsApp.",
  "Ejemplo: ver qué producto se agota antes de tiempo.",
  "Ejemplo: comparar semanas sin abrir diez archivos.",
];

export const pitchClosingQuote = {
  text: "Sin datos, solo tienes otra opinión.",
  author: "W. Edwards Deming",
};

export const pitchBars: PitchBar[] = [
  { label: "Consultas", value: 72 },
  { label: "Seguimiento", value: 46 },
  { label: "Cierres", value: 28 },
];

export const pitchSectors: PitchSector[] = [
  {
    id: "turismo",
    title: "Turismo",
    problem: "Las mismas preguntas se responden a mano y los interesados se enfrían.",
    opportunity: "Dejar visible el siguiente contacto y responder con un criterio común.",
    application: "Un asistente de consultas y un seguimiento simple de prospectos.",
  },
  {
    id: "metalurgia",
    title: "Metalurgia",
    problem: "Costos, pedidos y materiales viven en hojas que no se miran juntas.",
    opportunity: "Ver qué está por agotarse y qué pedido sigue abierto.",
    application: "Alertas de existencias y un tablero breve de producción.",
  },
  {
    id: "agro",
    title: "Agro",
    problem: "Cuesta comparar qué producto o lote deja mejor resultado.",
    opportunity: "Juntar precios, costos y cantidades en una sola lectura.",
    application: "Una comparación ilustrativa de rentabilidad para decidir qué revisar primero.",
  },
];

/** Pasos que el presentador puede narrar antes del reloj de 12 horas. */
export const pitchNextStepPhases: PitchNextStepPhase[] = [
  {
    title: "Escuchamos el reto",
    text: "Qué duele hoy: ventas, operación, datos dispersos o decisiones a ojo.",
  },
  {
    title: "Elegimos la mentoría",
    text: "Dos rutas ya definidas; la siguiente diapositiva muestra el detalle.",
  },
  {
    title: "Contratan en feria",
    text: "Condiciones de feria solo dentro de la ventana que aparece aquí.",
  },
];

export const pitchNextStepPresenterPoints: string[] = [
  "No leer el reloj en silencio: primero los tres pasos, luego la ventana de 12 horas.",
  "Si preguntan por fechas, remitir a contacto del departamento; no inventar cohortes.",
  "Transición: «En la siguiente lámina están las dos mentorías preseleccionadas».",
];

/** Mentorías preseleccionadas (oferta adicional). */
export const pitchMentorshipOffers: PitchMentorshipOffer[] = [
  {
    title: "Visual Analytics Ejecutivo",
    subtitle: "Historias con datos para la toma de decisiones.",
    audience: "Directivos y equipos que ya tienen reportes pero no una lectura común.",
    format: "Mentoría guiada · tableros y narrativa ejecutiva",
    icon: "analytics",
    outcomes: [
      "Priorizar indicadores que sí mueven la conversación.",
      "Armar una historia visual en lugar de otra hoja suelta.",
      "Acordar un tablero mínimo viable con el equipo.",
    ],
  },
  {
    title: "Inteligencia Artificial",
    subtitle: "Usos corporativos de Copilot en entornos de Microsoft 365.",
    audience: "Equipos en Microsoft 365 que quieren usar IA con criterio, no moda.",
    format: "Mentoría guiada · casos Copilot y buenas prácticas",
    icon: "ai",
    outcomes: [
      "Separar tareas donde Copilot ayuda de las que no.",
      "Plantillas seguras para correo, resúmenes y borradores.",
      "Plan corto de adopción por área (ventas, operaciones, talento).",
    ],
  },
];

export const pitchOfferFooter =
  "Ambas mentorías parten del mismo enfoque del stand: datos reales, persona al mando y entregables concretos.";

/** Cómo se diseña un curso a la medida (tres pilares). */
export const pitchCustomCoursePillars: PitchCustomCoursePillar[] = [
  {
    title: "Diagnóstico breve",
    text: "Qué proceso, qué datos y qué decisión quiere mejorar la empresa.",
  },
  {
    title: "Horas y ritmo",
    text: "Intensivo en feria o sesiones posteriores; no es un catálogo rígido.",
  },
  {
    title: "Entrega aplicada",
    text: "Ejercicios con sus propios ejemplos, no solo diapositivas genéricas.",
  },
];

/** Temáticas de referencia para cursos a la medida. */
export const pitchCustomCourseTopics: PitchCustomCourseTopic[] = [
  { label: "Visualización ejecutiva y tableros de control", tag: "Datos" },
  { label: "Calidad del dato y gobierno básico", tag: "Datos" },
  { label: "Automatización de reportes recurrentes", tag: "Operación" },
  { label: "Copilot y productividad en Microsoft 365", tag: "IA" },
  { label: "Introducción a IA con criterio corporativo", tag: "IA" },
  { label: "Casos de uso por área (ventas, operaciones, talento)", tag: "Áreas" },
];

export const pitchCustomCoursePresenterPoints: string[] = [
  "La lista es orientativa: el temario final sale del diagnóstico.",
  "Enfatizar que las horas cambian según profundidad y número de participantes.",
  "Puente al cierre: «Ahora probemos su caso en el stand».",
];

export const pitchDeck: PitchSlideContent[] = [
  {
    id: "era",
    label: "Una nueva era",
    notes: "Mostrar los tres bloques del fondo (datos → orden → decisión). Luego el mensaje principal.",
    beats: 1,
  },
  {
    id: "que-es",
    label: "Qué es la inteligencia artificial",
    notes: "Definición, diagrama central, ejemplos cotidianos y frase de cierre.",
    beats: 2,
  },
  {
    id: "como",
    label: "Cómo funciona",
    notes: "Revelar entrada, proceso y resultado en ese orden. Insistir en que una persona revisa el resultado.",
    beats: 2,
  },
  {
    id: "datos",
    label: "De los datos a las decisiones",
    notes: "Decir en voz alta que las barras son un ejemplo, no cifras de una empresa. Luego mostrar la decisión ilustrativa.",
    beats: 1,
  },
  {
    id: "sectores",
    label: "La IA en la empresa",
    notes: "Un avance por sector: turismo, metalurgia y agro. No abrir el stand todavía.",
    beats: 2,
  },
  {
    id: "video",
    label: "Video en tiempo real",
    notes: "Reproducir el video con audio si el espacio lo permite. El avatar en vivo queda reservado en código para más adelante.",
    beats: 0,
  },
  {
    id: "paso-seguir",
    label: "Qué sigue",
    notes:
      "Beat 1: recorrer los tres pasos del diagrama. Beat 2: mostrar el reloj de 12 h y condiciones de feria. Beat 3: apoyo al presentador (no leer en voz alta si hay público).",
    beats: 2,
  },
  {
    id: "oferta",
    label: "Oferta adicional",
    notes:
      "Beat 1: títulos y para quién es cada mentoría. Beat 2: tres entregables por tarjeta. Cerrar con la franja inferior sobre enfoque del stand.",
    beats: 1,
  },
  {
    id: "cursos-medida",
    label: "Cursos a la medida",
    notes:
      "Beat 1: tres pilares (diagnóstico, horas, entrega). Beat 2: grilla de temas por etiqueta. Beat 3: guía de cierre hacia el stand.",
    beats: 2,
  },
  {
    id: "cierre",
    label: "De la idea a la acción",
    notes: "Agradecer, citar a Deming y pasar al stand Radar IA.",
    beats: 1,
  },
];
