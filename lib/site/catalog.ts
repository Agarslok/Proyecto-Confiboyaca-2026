import type { AudienceId, FeatureId, GoalId, SectorId } from "@/types/site";

export const sectorLabels: Record<SectorId, string> = {
  turismo: "Turismo",
  metalurgia: "Metalurgia",
  agroindustria: "Agroindustria",
  gastronomia: "Gastronomía",
  retail: "Retail",
  servicios: "Servicios",
};

export const goalLabels: Record<GoalId, string> = {
  presentar: "Presentar la empresa",
  clientes: "Conseguir nuevos clientes",
  solicitudes: "Recibir solicitudes de información",
  productos: "Mostrar productos o servicios",
  reservas: "Facilitar reservas",
  contactos: "Conseguir contactos comerciales",
  portafolio: "Mostrar un portafolio",
  otro: "Otro objetivo",
};

export const featureLabels: Record<FeatureId, string> = {
  presentacion: "Sección de presentación",
  catalogo: "Catálogo de productos o servicios",
  galeria: "Galería de imágenes",
  contacto: "Formulario de contacto",
  testimonios: "Sección de testimonios",
  faq: "Preguntas frecuentes",
  cta: "Llamadas a la acción",
  personalizacion: "Personalización adicional",
};

export const featureHints: Record<FeatureId, string> = {
  presentacion: "Informativo. La plantilla ya incluye una presentación de ejemplo.",
  catalogo: "Informativo. No cambia la estructura del demo.",
  galeria: "Informativo. Las imágenes siguen siendo de demostración.",
  contacto: "Informativo. El contacto de la plantilla es de ejemplo.",
  testimonios: "Informativo. No añade testimonios reales.",
  faq: "Informativo. Las preguntas mostradas son genéricas.",
  cta: "Informativo. El botón principal es el de la plantilla.",
  personalizacion: "Marque si desea ampliar el alcance más adelante. No altera esta vista.",
};

export const audienceLabels: Record<AudienceId, string> = {
  personas: "Personas",
  empresas: "Empresas",
  ambos: "Personas y empresas",
};
