import { industriesCatalog } from "@/config/catalog";
import type { IndustryConfig } from "@/config/industries/types";
import type { IndustryId } from "@/types/domain";

export type { IndustryConfig } from "@/config/industries/types";

export const industries: Record<IndustryId, IndustryConfig> = {
  metalurgia: {
    id: "metalurgia",
    slug: "metalurgia",
    name: industriesCatalog.metalurgia.name,
    summary: industriesCatalog.metalurgia.summary,
    templateKey: "industrial",
    lenses: {
      captacion: "la entrada de cotizaciones y pedidos industriales",
      seguimiento: "el seguimiento de cuentas, obras y pedidos en curso",
      administracion: "las órdenes, las facturas y los pendientes de planta",
      inventario: "la materia prima, los repuestos y el producto terminado",
      tareas: "las tareas de taller y de planta",
      analisis: "los datos con los que se decide producción o compra",
      otro: "el problema descrito por la empresa",
    },
    prompts: {
      captacion: "¿Cómo entra hoy una cotización o un pedido nuevo?",
      seguimiento: "¿Dónde queda el siguiente contacto con un cliente o una obra?",
      administracion: "¿Dónde viven las órdenes, las facturas y los pendientes de planta?",
      inventario: "¿Dónde registran hoy la materia prima, los repuestos y el producto terminado?",
      tareas: "¿Cómo se reparten las tareas del taller o de la planta?",
      analisis: "¿De dónde salen los números con los que deciden producción o compras?",
      otro: "¿Cómo están manejando hoy el problema que describieron?",
    },
  },
  servicios: {
    id: "servicios",
    slug: "servicios-profesionales",
    name: industriesCatalog.servicios.name,
    summary: industriesCatalog.servicios.summary,
    templateKey: "services",
    lenses: {
      captacion: "la entrada de oportunidades y propuestas",
      seguimiento: "el seguimiento de cuentas y propuestas abiertas",
      administracion: "los contratos, las facturas y las entregas pendientes",
      inventario: "los insumos, las licencias o los materiales de entrega",
      tareas: "la organización del trabajo del equipo",
      analisis: "los datos con los que se decide dónde invertir el tiempo",
      otro: "el problema descrito por la empresa",
    },
    prompts: {
      captacion: "¿Cómo registran hoy una oportunidad o una propuesta nueva?",
      seguimiento: "¿Dónde queda el próximo contacto con un cliente o una propuesta?",
      administracion: "¿Dónde están los pendientes de facturación, contratos y entregas?",
      inventario: "¿Dónde controlan insumos, licencias o materiales de entrega?",
      tareas: "¿Cómo reparte el equipo el trabajo de la semana?",
      analisis: "¿Con qué información deciden dónde poner el tiempo del equipo?",
      otro: "¿Cómo están manejando hoy el problema que describieron?",
    },
  },
};

export function getIndustry(id: IndustryId): IndustryConfig {
  return industries[id];
}
