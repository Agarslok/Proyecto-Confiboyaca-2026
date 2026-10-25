import type { TemplateConfig, TemplateKey } from "@/types/domain";

/**
 * Tokens visuales propios. El MCP de Refero respondió suscripción inactiva,
 * así que estas plantillas no reproducen una referencia que no se pudo leer.
 */
export const templates: Record<TemplateKey, TemplateConfig> = {
  base: {
    key: "base",
    name: "General",
    version: 1,
    description: "Identidad de la plataforma antes de elegir un sector.",
  },
  industrial: {
    key: "industrial",
    name: "Industrial",
    version: 1,
    description: "Piedra, cobre y bordes firmes para un perfil de planta o taller.",
  },
  services: {
    key: "services",
    name: "Servicios",
    version: 1,
    description: "Superficies amplias y verde profundo para un perfil de servicios.",
  },
};

export function getTemplate(key: TemplateKey): TemplateConfig {
  return templates[key];
}
