/* ============================================================================
   Límites escritos del hueco de solución (catálogo y guía).

   La IA solo rellena el JSON del segundo bloque bajo la portada. El índice,
   el kind principal y el modo (catálogo vs guía) los fija el diagnóstico.
   ========================================================================== */

/** Resumen para informe, carga y documentación. */
export const SOLUTION_LIMITS_SUMMARY =
  "La IA solo redacta el hueco bajo la portada: no cambia menú, hero, pie ni fotos. Datos y precios son demostración. El índice y el enfoque principal los calcula el diagnóstico, no Gemini.";

export const SOLUTION_GUIDE_LIMITS_SUMMARY =
  "En modo guía, la IA no promete integraciones reales ni cumplimiento legal; el disclaimer lo deja claro y un consultor debe revisar antes de aplicarla.";

export const SOLUTION_LOADING_NOTE =
  "La IA solo completa el hueco bajo la portada (no rediseña menú, hero, pie ni fotos). No se envían teléfono ni correo. Índice y enfoque principal los fija el diagnóstico. Precios y nombres son demostración.";

export const DEMO_DISCLAIMER_BASE =
  "Es una demostración. No guarda datos ni reemplaza la operación real del negocio.";

export const DEMO_PRICES_NOTE = "Precios y nombres son ficticios.";

export const GUIDE_LEGAL_NOTE =
  "No promete integraciones reales ni cumplimiento legal; un consultor debe revisarla antes de aplicarla.";

/** Aclaración fija en guías (fallbacks y post-proceso del modelo). */
export const GUIDE_DISCLAIMER = `${DEMO_DISCLAIMER_BASE} ${DEMO_PRICES_NOTE} ${GUIDE_LEGAL_NOTE}`;

/** Aclaración del chat: demostración, con el diagnóstico, sin guardar la conversación. */
export const ASSISTANT_DISCLAIMER =
  "Es una demostración. El asistente usa inteligencia artificial con el diagnóstico de este negocio; no reemplaza a una persona ni guarda lo que se escribe aquí.";

/** Alias histórico en fallbacks escritos a mano. */
export const SOLUTION_DISCLAIMER = GUIDE_DISCLAIMER;

const DISCLAIMER_MAX = 280;

/** Instrucciones del system prompt de Gemini al redactar el hueco. */
export const GEMINI_SOLUTION_SYSTEM_LINES = [
  "Redactas el hueco de una página de demostración para una pyme en Colombia.",
  "Devuelves un único objeto JSON. Sin markdown, sin HTML y sin texto alrededor.",
  "No cambies action ni primaryKind: ya vienen decididos por el diagnóstico.",
  "No recalcules ni menciones el índice de madurez: tampoco lo tocas.",
  "No modifiques menú, portada, pie de página ni fotos: solo el JSON del hueco.",
  "Los precios son de demostración, en pesos enteros, y no son un cobro real.",
  "Usa los productos y clientes de ejemplo del encargo.",
  "En tablas (registro, inventario, solicitudes) las columnas deben servir para operar: agregar, editar y quitar filas (producto, cantidades, destino o estado). No inventes un botón que solo 'envía' sin lista editable.",
  "Escribe en español sencillo, como se le habla a quien visita la página.",
  "En modo guía: no prometas software conectado, integraciones desplegadas ni cumplimiento legal; el disclaimer debe aclarar que hace falta revisión humana.",
  "Si action es asistente: no armes una tabla ni una guía de pasos. Escribe una propuesta de cómo la IA entra en ese sector y esa actividad, un saludo y 3 o 4 preguntas cortas que haría un visitante.",
] as const;

function trimToMax(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

/** Garantiza demostración + límite legal/integraciones en guías generadas por IA. */
export function finalizeGuideDisclaimer(modelText?: string): string {
  let out = (modelText ?? "").trim();
  if (!out) return trimToMax(GUIDE_DISCLAIMER, DISCLAIMER_MAX);
  if (!/demostraci/i.test(out)) out = `${DEMO_DISCLAIMER_BASE} ${out}`;
  if (!/fictici|demostraci/i.test(out) && !/precio/i.test(out)) out = `${out} ${DEMO_PRICES_NOTE}`;
  if (!/integraci|legal|consultor/i.test(out)) out = `${out} ${GUIDE_LEGAL_NOTE}`;
  return trimToMax(out, DISCLAIMER_MAX);
}
