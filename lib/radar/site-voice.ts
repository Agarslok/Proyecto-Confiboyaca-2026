import type { TemplateCopy } from "@/lib/site/template-content";
import type { Activity, Industry, IndustryId } from "@/lib/radar/types";

/* ============================================================================
   Tono de la página generada según la actividad (y, en algunos casos, según
   palabras del nombre: «Panadería Carlitos» recibe textos de panadería).
   Solo usa el contrato que ya tienen las plantillas: templateCopy y los
   «extras» opcionales que cada plantilla lee de config. No toca su diseño.
   ========================================================================== */

interface Voice {
  kicker: string;
  aboutTitle: string;
  cta: string;
}

const VOICES: Record<string, Voice> = {
  "moda-confeccion": { kicker: "Taller propio · confección local", aboutTitle: "Del patrón a la prenda", cta: "Pedir catálogo mayorista" },
  "moda-compraventa": { kicker: "Nueva colección en tienda", aboutTitle: "Lo más vendido de la temporada", cta: "Ver colección" },
  "moda-online": { kicker: "Compra en línea · envío a todo el país", aboutTitle: "Favoritos de la comunidad", cta: "Comprar ahora" },
  "moda-mayorista": { kicker: "Distribución para tiendas", aboutTitle: "Surtido por referencia y talla", cta: "Solicitar lista de precios" },
  "alimentos-produccion": { kicker: "Hecho aquí, cada día", aboutTitle: "Nuestra producción", cta: "Hacer un pedido" },
  "alimentos-restaurante": { kicker: "Cocina de la casa · mesa compartida", aboutTitle: "Propuesta gastronómica", cta: "Reservar mesa" },
  "alimentos-venta": { kicker: "Frescos y de la región", aboutTitle: "Lo que encuentras en el local", cta: "Ver productos" },
  "alimentos-domicilios": { kicker: "Llevamos a tu negocio o tu casa", aboutTitle: "Rutas y pedidos", cta: "Programar entrega" },
  "comercio-fisica": { kicker: "Visítanos en tienda", aboutTitle: "Lo más pedido", cta: "Ver catálogo" },
  "comercio-online": { kicker: "Tienda en línea", aboutTitle: "Novedades de la semana", cta: "Comprar en línea" },
  "comercio-mayorista": { kicker: "Abastecimiento para comercios", aboutTitle: "Portafolio mayorista", cta: "Solicitar cotización" },
  "comercio-posventa": { kicker: "Garantía y servicio técnico", aboutTitle: "Te acompañamos después de la compra", cta: "Abrir una solicitud" },
  "salud-ips": { kicker: "Atención médica cercana", aboutTitle: "Especialidades y servicios", cta: "Agendar cita" },
  "salud-farmacia": { kicker: "Droguería de confianza", aboutTitle: "Medicamentos y cuidado personal", cta: "Pedir a domicilio" },
  "salud-laboratorio": { kicker: "Resultados confiables y a tiempo", aboutTitle: "Toma de muestras y análisis", cta: "Agendar toma de muestra" },
  "salud-estetica": { kicker: "Bienestar a tu ritmo", aboutTitle: "Tratamientos y planes", cta: "Reservar sesión" },
  "manufactura-planta": { kicker: "Fabricación en planta", aboutTitle: "Capacidad productiva", cta: "Solicitar cotización" },
  "manufactura-compras": { kicker: "Abastecimiento industrial", aboutTitle: "Proveedores e inventarios", cta: "Ser proveedor" },
  "manufactura-b2b": { kicker: "Soluciones para empresas", aboutTitle: "Portafolio industrial", cta: "Hablar con un asesor" },
  "manufactura-posventa": { kicker: "Mantenimiento y repuestos", aboutTitle: "Servicio técnico", cta: "Programar mantenimiento" },
  "transporte-carga": { kicker: "Carga entre ciudades", aboutTitle: "Flota y rutas", cta: "Cotizar un envío" },
  "transporte-mensajeria": { kicker: "Entregas el mismo día", aboutTitle: "Última milla", cta: "Programar recogida" },
  "transporte-bodegaje": { kicker: "Bodegaje y distribución", aboutTitle: "Centro de distribución", cta: "Solicitar espacio" },
  "transporte-operador": { kicker: "Operador logístico", aboutTitle: "Soluciones de punta a punta", cta: "Hablar con un asesor" },
  "agro-primaria": { kicker: "Directo de la finca", aboutTitle: "Cultivos y origen", cta: "Contacto comercial" },
  "agro-transformacion": { kicker: "Del campo a la mesa", aboutTitle: "Productos y proceso", cta: "Pedir muestras" },
  "agro-exportacion": { kicker: "Comercialización y exportación", aboutTitle: "Origen y calidad", cta: "Solicitar oferta" },
  "agro-acopio": { kicker: "Acopio regional", aboutTitle: "Recogemos en tu vereda", cta: "Programar recogida" },
  "servicios-consultoria": { kicker: "Consultoría y acompañamiento", aboutTitle: "Cómo trabajamos", cta: "Agendar conversación" },
  "servicios-financieros": { kicker: "Soluciones financieras", aboutTitle: "Productos para ti y tu empresa", cta: "Simular un crédito" },
  "servicios-software": { kicker: "Tecnología a la medida", aboutTitle: "Desarrollo y soporte", cta: "Contar mi proyecto" },
  "servicios-educacion": { kicker: "Formación con propósito", aboutTitle: "Programas y cursos", cta: "Inscribirme" },
  "turismo-hotel": { kicker: "Hospedaje en Boyacá", aboutTitle: "Habitaciones y experiencias", cta: "Consultar disponibilidad" },
  "turismo-agencia": { kicker: "Planes y paquetes", aboutTitle: "Viajes diseñados para ti", cta: "Armar mi plan" },
  "turismo-eventos": { kicker: "Eventos y convenciones", aboutTitle: "Espacios para cada ocasión", cta: "Cotizar evento" },
  "turismo-transporte": { kicker: "Traslados y tours", aboutTitle: "Rutas y excursiones", cta: "Reservar traslado" },
  "mineria-extraccion": { kicker: "Minería responsable en Boyacá", aboutTitle: "Frentes de explotación", cta: "Solicitar ficha técnica" },
  "mineria-beneficio": { kicker: "Beneficio y transformación de mineral", aboutTitle: "Planta y procesos", cta: "Cotizar producto" },
  "mineria-comercio": { kicker: "Comercialización de minerales", aboutTitle: "Calidad certificada por lote", cta: "Solicitar oferta" },
  "mineria-transporte": { kicker: "Transporte y despacho de mineral", aboutTitle: "Rutas y despachos", cta: "Programar despacho" },
  "construccion-obra": { kicker: "Construimos en Boyacá", aboutTitle: "Proyectos y obras", cta: "Cotizar mi obra" },
  "construccion-materiales": { kicker: "Depósito de materiales", aboutTitle: "Todo para tu obra", cta: "Pedir cotización" },
  "construccion-inmobiliaria": { kicker: "Inmuebles en venta y arriendo", aboutTitle: "Proyectos disponibles", cta: "Agendar visita" },
  "construccion-mantenimiento": { kicker: "Acabados y mantenimiento", aboutTitle: "Servicios para tu espacio", cta: "Solicitar visita técnica" },
  "otra-operacion": { kicker: "Operación y ejecución", aboutTitle: "Lo que hacemos", cta: "Solicitar cotización" },
  "otra-comercial": { kicker: "Productos y servicios", aboutTitle: "Nuestro portafolio", cta: "Hablar con ventas" },
  "otra-logistica": { kicker: "Logística confiable", aboutTitle: "Cómo movemos lo tuyo", cta: "Cotizar servicio" },
  "otra-servicio": { kicker: "Atención y soporte", aboutTitle: "Cómo te ayudamos", cta: "Contactarnos" },
};

type Extras = Record<string, unknown>;

interface Special {
  match: RegExp;
  industries: IndustryId[];
  voice: Voice;
  cards?: TemplateCopy["cards"];
  statement?: string;
  extras?: Extras;
}

/** Ajustes por palabra del nombre de la empresa, dentro de la misma plantilla. */
const SPECIALS: Special[] = [
  {
    match: /panader|pasteler|reposter|horno|bizcoch/i,
    industries: ["alimentos"],
    voice: { kicker: "Panadería artesanal · horneado cada mañana", aboutTitle: "Del horno a tu mesa", cta: "Encargar pedido" },
    statement: "Pan recién horneado, todos los días",
    cards: [
      { tag: "DEL DÍA", title: "Almojábanas", location: "QUESO CAMPESINO", price: "$2.500", featured: true },
      { tag: "CLÁSICO", title: "Pan de yuca", location: "HORNEADO A LAS 6:00", price: "$2.000" },
      { tag: "POR ENCARGO", title: "Torta de cuajada", location: "RECETA DE LA CASA", price: "$38.000" },
    ],
    extras: {
      drinks: [
        { title: "Café de Boyacá", price: "$3.500", text: "Tinto o con leche." },
        { title: "Chocolate santafereño", price: "$5.000", text: "Con queso y almojábana." },
        { title: "Agua de panela", price: "$3.000", text: "Caliente o con limón." },
        { title: "Jugo natural", price: "$5.500", text: "Fruta de temporada." },
      ],
      events: [
        { title: "Tortas por encargo", text: "Cumpleaños, grados y primeras comuniones." },
        { title: "Refrigerios para empresas", text: "Desayunos y onces para reuniones." },
        { title: "Pedidos al por mayor", text: "Pan para tiendas y cafeterías del barrio." },
      ],
    },
  },
  {
    match: /caf[eé]|cafeter|tost/i,
    industries: ["alimentos", "agro"],
    voice: { kicker: "Café de origen · tostión propia", aboutTitle: "Nuestro café", cta: "Visítanos" },
    statement: "Café boyacense, preparado con calma",
  },
];

export function voiceCopy(
  base: TemplateCopy,
  companyName: string,
  industry: Industry,
  activity: Activity,
  customerLead?: string,
): { copy: TemplateCopy; extras: Extras } {
  const special = SPECIALS.find((item) => item.industries.includes(industry.id) && item.match.test(companyName));
  const voice = special?.voice ?? VOICES[activity.id];
  if (!voice) return { copy: base, extras: {} };
  const copy: TemplateCopy = {
    ...base,
    heroKicker: voice.kicker,
    heroLead: customerLead ?? `${companyName} · ${activity.description}. Textos e imágenes de ejemplo para mostrar cómo se vería la página.`,
    aboutTitle: voice.aboutTitle,
    contactCta: voice.cta,
    footerNote: `${companyName} · ${industry.label} · Demostración local. Contenido de ejemplo.`,
  };
  if (special?.cards) copy.cards = special.cards;
  if (special?.statement) copy.statement = special.statement;
  return { copy, extras: special?.extras ?? {} };
}
