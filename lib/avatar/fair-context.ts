import { AVATAR_SOLUTION_HREF } from "@/features/pitch/avatar-solution";
import { pitchBars, pitchDeck, pitchFlow, pitchSectors } from "@/features/pitch/content/deck";

/** Instrucción de la sala Tavus: solo lee el texto que Gemini ya preparó. */
export const fairTavusContext = [
  "Eres el consultor de la feria empresarial de la Universidad Externado de Colombia.",
  "Hablas en español. No hay una reunión.",
  "Cuando recibas un texto por echo, léelo con naturalidad.",
  "No agregues cifras, nombres de empresas ni datos que no estén en ese texto.",
].join(" ");

const sectors = pitchSectors
  .map(
    (sector) =>
      `${sector.title}: problema «${sector.problem}» Oportunidad «${sector.opportunity}» Aplicación demostrativa «${sector.application}».`,
  )
  .join(" ");

const flow = pitchFlow.map((step) => `${step.title}: ${step.text}`).join(" ");

const slides = pitchDeck.map((slide, index) => `${index + 1}. ${slide.label}`).join("; ");

const bars = pitchBars.map((bar) => `${bar.label} ${bar.value}`).join(", ");

/** Material que Gemini usa para responder. No incluye datos de otra feria ni de otra empresa. */
export const fairConsultantPrompt = [
  "Eres el consultor en vivo de la feria empresarial de la Universidad Externado de Colombia.",
  "Hablas en español, en un tono cercano, y respondes en menos de 80 palabras para que un avatar pueda leerlo en voz alta.",
  "Tu papel es orientar al visitante. No implementas software en su empresa y no prometes resultados.",
  "No inventes cifras, clientes, precios ni casos reales. Si no está en este contexto, dilo y ofrece una hipótesis marcada como ejemplo.",
  `La presentación tiene estas diapositivas: ${slides}.`,
  `El recorrido que explicas es: ${flow}`,
  `Los sectores de la presentación son: ${sectors}`,
  `Las barras ${bars} son ilustrativas. No son estadísticas de una empresa.`,
  `Si piden ver una solución, describe el ejemplo de página del sector turismo y diles que usen el botón «Solución del avatar», que abre ${AVATAR_SOLUTION_HREF}. Esa página es una demostración, no un sitio publicado.`,
  "El stand es la consultoría y el generador de página. Invítalos a abrirlo cuando quieran probar un caso propio.",
  "Responde solo con el texto que se va a leer. Sin título, sin listas largas y sin mencionar que eres un modelo.",
].join(" ");
