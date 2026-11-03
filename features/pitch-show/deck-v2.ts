import type { ShowSlide } from "./deck";

/* ============================================================================
   Pitch v2: 9 diapositivas, ~15 minutos con el video.

   El video ya cuenta la ruta completa (datos, diagnóstico, página,
   implementación, horas). Las diapositivas no la repiten: preparan al público
   antes del video y después hacen lo que el video no puede (votar, probar
   la demo en vivo, calcular horas, la oferta de feria). La v1 sigue en /pitch/v1.
   ========================================================================== */

export const SHOW_SLIDES_V2: ShowSlide[] = [
  {
    id: "titulo",
    label: "Título",
    beats: 1,
    minutes: 0.5,
    transition: "zoom",
    notes: "Presentarse (nombre y Departamento de Matemáticas). En el segundo paso, leer la agenda en una frase.",
  },
  {
    id: "encuesta",
    label: "¿En cuál está tu empresa?",
    beats: 1,
    minutes: 1.5,
    transition: "color",
    notes: "Pregunta retórica: nadie tiene que responder. Leer las tres opciones mientras el resaltado las recorre y dar unos segundos para pensar. Siguiente paso: se encienden las tres con su siguiente paso (también quien ya usa IA: modelos, tableros, automatización).",
  },
  {
    id: "que-es",
    label: "La IA, sin humo",
    beats: 3,
    minutes: 2,
    transition: "wipe",
    notes: "La base común para todos. La red: entra lo que ya registran, sale una propuesta. Después, lo que la IA no es.",
  },
  {
    id: "morir",
    label: "Por qué fallan",
    beats: 4,
    minutes: 1.5,
    transition: "color",
    notes: "Tres errores, uno por paso. En el cuarto se voltean. Puente al video: «Así lo hacemos nosotros, en 90 segundos».",
  },
  {
    id: "video",
    label: "Video: la ruta en 5 pasos",
    beats: 0,
    minutes: 1.7,
    transition: "circle",
    notes: "El video arranca solo con sonido. Espacio pausa o reanuda. No narrar encima.",
  },
  {
    id: "antes-despues",
    label: "Pruébalo: sin IA / con IA",
    beats: 1,
    minutes: 2.5,
    transition: "color",
    notes: "«Lo que vieron en el video, en vivo.» Preguntar a alguien su tipo de negocio y su problema y marcarlos. Siguiente paso o tecla T: con IA. La cortina se puede arrastrar.",
  },
  {
    id: "horas",
    label: "¿Cuántas horas necesitas?",
    beats: 1,
    minutes: 2,
    transition: "circle",
    notes: "Calculadora con las horas del Radar. Con la misma persona: tamaño y cómo registra hoy. Aclarar que el número final sale del diagnóstico.",
  },
  {
    id: "feria",
    label: "Solo en la feria",
    beats: 3,
    minutes: 2,
    transition: "wipe",
    notes: "Tres pasos en feria, luego las cuatro rutas (dos mentorías, curso a la medida, acompañamiento por horas) y la ventana de 12 horas. No inventar fechas: remitir al contacto del departamento.",
  },
  {
    id: "stand",
    label: "Te esperamos en el stand",
    beats: 1,
    minutes: 1,
    transition: "zoom",
    notes: "Dejar esta diapositiva en pantalla al terminar: explica qué pasa en el stand y el QR lleva directo al diagnóstico.",
  },
];
