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

export const pitchDeck: PitchSlideContent[] = [
  {
    id: "era",
    label: "Una nueva era",
    notes: "Apertura. Dejar que el título aparezca antes de hablar. No prometer que la IA resuelve cualquier problema.",
    beats: 0,
  },
  {
    id: "que-es",
    label: "Qué es la inteligencia artificial",
    notes: "Primer avance: la definición. Segundo: los tres nodos. Tercero: la frase de cierre. Explicar con pausa entre cada uno.",
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
    id: "avatar",
    label: "Avatar en tiempo real",
    notes: "Iniciar avatar abre la sala en vivo. La pregunta va a Gemini y, si la sala está conectada, el avatar la lee. Solución del avatar abre el ejemplo de turismo. El micrófono solo dicta; no entra a la sala.",
    beats: 1,
  },
  {
    id: "cierre",
    label: "De la idea a la acción",
    notes: "Cerrar la idea y pasar al stand. El stand es la consultoría y el generador de página.",
    beats: 1,
  },
];
