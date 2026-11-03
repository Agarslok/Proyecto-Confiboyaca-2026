/* ============================================================================
   Pitch «Cómo implementar la IA sin morir en el intento».

   Pensado para 15–20 minutos con el video incluido. Cada diapositiva avanza
   por pasos («beats») con la flecha derecha o el control del presentador; los
   minutos son una guía para el panel de notas (tecla N), no un límite.
   Esta es la versión 1 (14 diapositivas, /pitch/v1); la vigente está en
   deck-v2.ts y la de Juan en /pitch/clasico. Los contenidos de abajo los
   comparten ambas versiones.
   ========================================================================== */

export type ShowTransition = "circle" | "wipe" | "zoom" | "color";

export interface ShowSlide {
  id: string;
  label: string;
  /** Último paso interno. 0 = la diapositiva entra completa. */
  beats: number;
  minutes: number;
  transition: ShowTransition;
  notes: string;
}

export const SHOW_SLIDES: ShowSlide[] = [
  {
    id: "apertura",
    label: "Apertura",
    beats: 3,
    minutes: 1,
    transition: "zoom",
    notes: "Silencio hasta que el punto se abra. Preguntar en voz alta: «¿Quién quiere usar IA en su empresa?». Luego el golpe naranja y el título.",
  },
  {
    id: "video",
    label: "Video",
    beats: 0,
    minutes: 1.7,
    transition: "circle",
    notes: "El video arranca solo con sonido. Espacio pausa o reanuda. Al terminar, avanzar con la flecha.",
  },
  {
    id: "realidad",
    label: "¿Te suena?",
    beats: 4,
    minutes: 1.5,
    transition: "color",
    notes: "Un dolor por paso. En el último, pedir que levanten la mano y contar con la tecla H (o el botón +). Leer el número en voz alta.",
  },
  {
    id: "que-es",
    label: "La IA, sin humo",
    beats: 3,
    minutes: 1.5,
    transition: "wipe",
    notes: "Explicar con la red: entra lo que ya registran, sale una propuesta. Luego lo que la IA no es. Cerrar con «no conoce tu empresa si nadie le cuenta».",
  },
  {
    id: "morir",
    label: "Por qué fallan",
    beats: 4,
    minutes: 1.5,
    transition: "color",
    notes: "Tres errores, uno por paso (se rompen). En el cuarto paso se voltean: así lo evitamos.",
  },
  {
    id: "ruta",
    label: "La ruta en 5 pasos",
    beats: 5,
    minutes: 0.8,
    transition: "zoom",
    notes: "Es el mapa del resto de la charla. Nombrar cada paso cuando se enciende.",
  },
  {
    id: "datos",
    label: "Paso 1 · Datos",
    beats: 3,
    minutes: 1.5,
    transition: "wipe",
    notes: "El cuaderno se vuelve tabla y la tabla, cifras. Mensaje clave: si no tienes datos, te enseñamos a construirlos.",
  },
  {
    id: "diagnostico",
    label: "Paso 2 · Diagnóstico",
    beats: 3,
    minutes: 1.5,
    transition: "circle",
    notes: "El radar muestra seis dimensiones; el índice y el problema central salen solos. En el último paso, invitar a escanear el QR y hacerlo desde el celular.",
  },
  {
    id: "antes-despues",
    label: "Sin IA / Con IA",
    beats: 1,
    minutes: 2,
    transition: "color",
    notes: "Primero «Sin IA» (el cuaderno). Siguiente paso o tecla T: «Con IA», funcionando. Se puede cambiar el negocio y el problema con clic, en vivo.",
  },
  {
    id: "pagina",
    label: "Paso 3 · Tu página",
    beats: 2,
    minutes: 1,
    transition: "zoom",
    notes: "La solución queda en una página web del negocio. Señalar el registro que aparece al hacer el pedido.",
  },
  {
    id: "implementa",
    label: "Paso 4 · Implementación",
    beats: 3,
    minutes: 1.7,
    transition: "wipe",
    notes: "Cuatro cosas que montamos. Luego se agrupan en las dos mentorías y, al final, los cursos a la medida.",
  },
  {
    id: "horas",
    label: "Paso 5 · Horas",
    beats: 1,
    minutes: 1.7,
    transition: "circle",
    notes: "Calculadora en vivo con las horas del Radar. Preguntar a alguien del público su tamaño y cómo registra hoy, y marcarlo.",
  },
  {
    id: "feria",
    label: "En la feria",
    beats: 2,
    minutes: 1.5,
    transition: "color",
    notes: "Tres pasos en feria y la ventana de 12 horas. No inventar fechas de cohortes: remitir al contacto del departamento.",
  },
  {
    id: "cierre",
    label: "Cierre",
    beats: 2,
    minutes: 1,
    transition: "zoom",
    notes: "Letrero «Ven al stand», la frase central y el QR. Dejar esta diapositiva en pantalla mientras la gente se acerca.",
  },
];

export const SHOW_TOTAL_MINUTES = SHOW_SLIDES.reduce((sum, slide) => sum + slide.minutes, 0);

export const PAINS = [
  { icon: "notebook", title: "Las cuentas viven en un cuaderno", text: "Y el cierre del mes es contar a mano." },
  { icon: "chat", title: "Los pedidos llegan por WhatsApp", text: "Y alguno siempre se pierde entre los chats." },
  { icon: "sheet", title: "Hay Excel, pero cada uno tiene el suyo", text: "Y nadie sabe cuál es el bueno." },
] as const;

export const AI_IS = [
  { yes: false, title: "No es magia", text: "Trabaja con lo que tu negocio ya registra." },
  { yes: false, title: "No reemplaza a tu equipo", text: "Propone; quien conoce el negocio decide." },
  { yes: false, title: "No inventa tus cifras", text: "Si no hay datos, primero se construyen." },
] as const;

/** Por qué se «muere en el intento», y cómo lo evitamos. */
export const FAILURES = [
  { fail: "Empezar por la herramienta", fix: "Empezamos por tu problema central" },
  { fail: "Querer IA sin tener datos", fix: "Primero construimos tus datos" },
  { fail: "Hacerlo solo y abandonar", fix: "Te acompañamos por horas, paso a paso" },
] as const;

export const ROUTE = [
  { n: 1, title: "Datos", text: "Del cuaderno a una tabla" },
  { n: 2, title: "Diagnóstico", text: "Dónde se pierde más" },
  { n: 3, title: "Solución", text: "Funcionando en tu página" },
  { n: 4, title: "Implementación", text: "Y tu equipo aprende" },
  { n: 5, title: "Acompañamiento", text: "Por horas, a tu ritmo" },
] as const;

export const NOTEBOOK = [
  ["Lun", "Almojábana", "40", "Café El Puente"],
  ["Mar", "Pan de yuca", "12", "Marta Rojas"],
  ["Mié", "Roscón", "25", "Tienda Lupe"],
] as const;

/** Cuatro cosas que se montan en la implementación (base de las dos mentorías). */
export const BUILDS = [
  { id: "asistente", k: "Asistente de IA", title: "Correos y documentos en minutos", text: "Resume, redacta y te dice qué sigue.", group: "ia" },
  { id: "flujos", k: "Automatización", title: "Tareas repetidas que se hacen solas", text: "Entra un pedido y el aviso sale solo.", group: "ia" },
  { id: "limpios", k: "Datos en orden", title: "Del Excel desordenado a datos limpios", text: "Nombres, fechas y totales que cuadran.", group: "analytics" },
  { id: "tableros", k: "Tableros", title: "Historias con datos para decidir", text: "Ventas, metas y alertas de un vistazo.", group: "analytics" },
] as const;

export const FAIR_STEPS = [
  { title: "Escuchamos el reto", text: "Qué duele hoy: ventas, operación, datos dispersos o decisiones a ojo." },
  { title: "Elegimos la ruta", text: "Mentoría, curso a la medida o acompañamiento por horas." },
  { title: "Contratan en feria", text: "Condiciones especiales solo dentro de la ventana de la feria." },
] as const;

export const CLOSING_QUOTE = { text: "Sin datos, solo tienes otra opinión.", author: "W. Edwards Deming" };
