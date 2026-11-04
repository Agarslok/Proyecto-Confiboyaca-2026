import type { TemplateId } from "@/types/site";

export interface TemplateCard {
  tag: string;
  title: string;
  location: string;
  price: string;
  featured?: boolean;
  /** Opcionales que algunas plantillas leen (la de tienda: imagen y precio anterior). */
  image?: string;
  oldPrice?: string;
  description?: string;
}

export interface TemplateCopy {
  nav: string[];
  heroKicker: string;
  heroLead: string;
  aboutTitle: string;
  aboutBody: string;
  cards: TemplateCard[];
  statement?: string;
  capabilities?: { title: string; text: string }[];
  sustainability?: string;
  hoursLabel?: string;
  contactCta: string;
  footerNote: string;
}

const DEMO_NOTE =
  "Contenido de demostración. No describe clientes, certificaciones ni resultados reales de la empresa.";

export function contentForTemplate(templateId: TemplateId, companyName: string): TemplateCopy {
  const name = companyName.trim();
  switch (templateId) {
    case "turismo":
      return {
        nav: ["HOTELES", "EXPERIENCIAS", "RUTAS", "JOURNAL"],
        heroKicker: "Guía editorial de viajes",
        heroLead: `${name} presenta destinos y experiencias con un tono de revista. ${DEMO_NOTE}`,
        aboutTitle: "Experiencias curadas",
        aboutBody:
          "Cada propuesta combina alojamiento, paisaje y ritmo local. Los textos y precios son ejemplos para mostrar la estructura de la plantilla Kobu.",
        cards: [
          { tag: "DESTACADO", title: "Ruta de montaña", location: "REGIÓN ANDINA", price: "DESDE $420.000", featured: true },
          { tag: "NUEVO", title: "Fin de semana costero", location: "LITORAL", price: "DESDE $310.000" },
          { tag: "NUEVO", title: "Retiro bienestar", location: "VALLE TEMPLADO", price: "DESDE $580.000" },
        ],
        contactCta: "Solicitar itinerario de ejemplo",
        footerNote: `${name} · Demostración local · ${DEMO_NOTE}`,
      };
    case "metalurgia":
      return {
        nav: ["SOLUCIONES", "PLANTA", "CASOS", "NOTICIAS"],
        heroKicker: "Ingeniería y fabricación",
        heroLead: `${name} muestra capacidades industriales con el lenguaje ON.energy: contraste, precisión y acento amarillo.`,
        aboutTitle: "Capacidad productiva",
        aboutBody:
          "Líneas de corte, soldadura y acabado para componentes metálicos. Las cifras y proyectos citados son ficticios y sirven solo para la maqueta.",
        statement: "Fabricamos con estándares de seguridad y trazabilidad — texto de ejemplo para la franja amarilla.",
        capabilities: [
          { title: "Láminas y perfiles", text: "Corte CNC y conformado para estructuras medias." },
          { title: "Ensamble", text: "Celdas robotizadas de demostración." },
          { title: "Acabados", text: "Pintura electrostática y control dimensional." },
          { title: "Logística", text: "Embalaje industrial y despacho programado." },
        ],
        cards: [
          { tag: "NOTICIA", title: "Ampliación de planta piloto", location: "SECTOR INDUSTRIAL", price: "2026" },
          { tag: "NOTICIA", title: "Nueva línea de soldadura", location: "PLANTA CENTRAL", price: "2025" },
        ],
        contactCta: "Agendar visita técnica (demo)",
        footerNote: `${name} · Prototipo industrial · ${DEMO_NOTE}`,
      };
    case "agroindustria":
      return {
        nav: ["PRODUCTOS", "CAMPO", "CONTACTO"],
        heroKicker: "Del campo a la mesa",
        heroLead: `${name} comunica origen, calidad y sostenibilidad con la estética Arva: verdes profundos, crema y pastels.`,
        aboutTitle: "Productos y origen",
        aboutBody:
          "Cultivos, procesamiento y comercialización con trazabilidad. Los volúmenes y certificaciones mostrados son de ejemplo.",
        sustainability:
          "Prácticas de rotación, uso eficiente del agua y aliados locales — párrafo demostrativo, no un reporte oficial.",
        cards: [
          { tag: "GRANO", title: "Café especial", location: "ALTURA MEDIA", price: "LOTE DEMO" },
          { tag: "FRESCO", title: "Hortalizas de temporada", location: "FINCA PILOTO", price: "CAJA DEMO" },
          { tag: "PROCESADO", title: "Derivados agrícolas", location: "PLANTA", price: "MUESTRA DEMO" },
        ],
        contactCta: "Contacto comercial",
        footerNote: `${name} · Demostración agroindustrial · ${DEMO_NOTE}`,
      };
    case "gastronomia":
      return {
        nav: ["MENÚ", "CHEF", "RESERVAS", "EVENTOS"],
        heroKicker: "Cocina de autor · mesa compartida",
        heroLead: `${name} invita a una experiencia cálida: ingredientes de temporada, carta de ejemplo y ambiente acogedor.`,
        aboutTitle: "Propuesta gastronómica",
        aboutBody:
          "Platos pensados para compartir o disfrutar en solitario. Precios y alérgenos mostrados son ficticios para la maqueta.",
        statement: "«Cocinamos con productores locales — cita de demostración, no atribuida a una persona real.»",
        hoursLabel: "Mar–Dom · 12:00–22:00 (horario de ejemplo)",
        cards: [
          { tag: "ENTRADA", title: "Ceviche de la casa", location: "PESCADO DEL DÍA", price: "$38.000", featured: true },
          { tag: "FUERTE", title: "Risotto de hongos", location: "VEGETARIANO", price: "$52.000" },
          { tag: "POSTRE", title: "Tarta de chocolate", location: "REPOSTERÍA", price: "$22.000" },
        ],
        contactCta: "Reservar mesa (demo)",
        footerNote: `${name} · Restaurante de demostración · ${DEMO_NOTE}`,
      };
    case "retail":
      return {
        nav: ["NOVEDADES", "COLECCIÓN", "TIENDAS", "AYUDA"],
        heroKicker: "Nueva temporada",
        heroLead: `${name} presenta un catálogo retail limpio: productos destacados, promos de ejemplo y compra simulada.`,
        aboutTitle: "Lo más pedido",
        aboutBody:
          "Selección de artículos para mostrar grillas, precios y etiquetas. No hay inventario real ni checkout conectado.",
        capabilities: [
          { title: "Envío demo", text: "48–72 h en zonas urbanas (texto de ejemplo)." },
          { title: "Cambios", text: "Política ilustrativa de 30 días." },
          { title: "Tiendas", text: "Puntos de venta ficticios en tres ciudades." },
        ],
        cards: [
          { tag: "-20%", title: "Chaqueta urbana", location: "TALLAS S–XL", price: "$189.900", featured: true },
          { tag: "NUEVO", title: "Mochila commuter", location: "NEGRO / ARENA", price: "$129.000" },
          { tag: "BEST", title: "Zapatillas daily", location: "UNISEX", price: "$219.000" },
        ],
        contactCta: "Ver colección completa",
        footerNote: `${name} · Tienda demo · ${DEMO_NOTE}`,
      };
    case "servicios":
      return {
        nav: ["SERVICIOS", "METODOLOGÍA", "EQUIPOS", "CONTACTO"],
        heroKicker: "Consultoría y acompañamiento",
        heroLead: `${name} comunica servicios profesionales con tono sobrio: propuesta de valor, casos de ejemplo y llamada a contacto.`,
        aboutTitle: "Cómo trabajamos",
        aboutBody:
          "Diagnóstico, implementación y seguimiento. Los clientes y cifras citados son ficticios y sirven solo para la plantilla.",
        capabilities: [
          { title: "Estrategia", text: "Talleres y hoja de ruta de 6–8 semanas (demo)." },
          { title: "Operación", text: "Optimización de procesos y indicadores." },
          { title: "Capacitación", text: "Programas modulares para equipos." },
          { title: "Soporte", text: "Acompañamiento mensual de ejemplo." },
        ],
        cards: [
          { tag: "CASO", title: "Transformación comercial", location: "SECTOR SERVICIOS", price: "6 MESES DEMO" },
          { tag: "CASO", title: "Onboarding digital", location: "PYME", price: "3 MESES DEMO" },
        ],
        contactCta: "Agendar conversación",
        footerNote: `${name} · Firma de servicios · ${DEMO_NOTE}`,
      };
    default: {
      const _never: never = templateId;
      return _never;
    }
  }
}
