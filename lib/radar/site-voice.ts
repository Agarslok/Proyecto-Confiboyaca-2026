import type { TemplateCopy } from "@/lib/site/template-content";
import { garmentImage, type Garment } from "@/lib/radar/niche-art";
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
  "moda-textil": { kicker: "Textil e insumos", aboutTitle: "Telas y acabados", cta: "Pedir muestra de tela" },
  "moda-confeccion": { kicker: "Taller propio · confección local", aboutTitle: "Del patrón a la prenda", cta: "Pedir catálogo mayorista" },
  "moda-calzado": { kicker: "Calzado y marroquinería", aboutTitle: "Línea de temporada", cta: "Ver catálogo" },
  "moda-compraventa": { kicker: "Nueva colección en tienda", aboutTitle: "Lo más vendido de la temporada", cta: "Ver colección" },
  "moda-online": { kicker: "Compra en línea · envío a todo el país", aboutTitle: "Favoritos de la comunidad", cta: "Comprar ahora" },
  "moda-mayorista": { kicker: "Distribución para tiendas", aboutTitle: "Surtido por referencia y talla", cta: "Solicitar lista de precios" },
  "alimentos-produccion": { kicker: "Hecho aquí, cada día", aboutTitle: "Nuestra producción", cta: "Hacer un pedido" },
  "alimentos-bebidas": { kicker: "Bebidas de la casa", aboutTitle: "Nuestra planta", cta: "Pedir un lote" },
  "alimentos-restaurante": { kicker: "Cocina de la casa · mesa compartida", aboutTitle: "Propuesta gastronómica", cta: "Reservar mesa" },
  "alimentos-catering": { kicker: "Catering para cada ocasión", aboutTitle: "Menús institucionales", cta: "Cotizar un evento" },
  "alimentos-venta": { kicker: "Frescos y de la región", aboutTitle: "Lo que encuentras en el local", cta: "Ver productos" },
  "alimentos-domicilios": { kicker: "Llevamos a tu negocio o tu casa", aboutTitle: "Rutas y pedidos", cta: "Programar entrega" },
  "comercio-fisica": { kicker: "Visítanos en tienda", aboutTitle: "Lo más pedido", cta: "Ver catálogo" },
  "comercio-autoservicio": { kicker: "Todo para la casa, en un solo lugar", aboutTitle: "Pasillos y ofertas", cta: "Ver ofertas" },
  "comercio-online": { kicker: "Tienda en línea", aboutTitle: "Novedades de la semana", cta: "Comprar en línea" },
  "comercio-marketplace": { kicker: "Encuéntranos en plataformas", aboutTitle: "Catálogo publicado", cta: "Ver tienda" },
  "comercio-mayorista": { kicker: "Abastecimiento para comercios", aboutTitle: "Portafolio mayorista", cta: "Solicitar cotización" },
  "comercio-posventa": { kicker: "Garantía y servicio técnico", aboutTitle: "Te acompañamos después de la compra", cta: "Abrir una solicitud" },
  "salud-ips": { kicker: "Atención médica cercana", aboutTitle: "Especialidades y servicios", cta: "Agendar cita" },
  "salud-hogar": { kicker: "Cuidado en casa", aboutTitle: "Atención domiciliaria", cta: "Solicitar visita" },
  "salud-farmacia": { kicker: "Droguería de confianza", aboutTitle: "Medicamentos y cuidado personal", cta: "Pedir a domicilio" },
  "salud-laboratorio": { kicker: "Resultados confiables y a tiempo", aboutTitle: "Toma de muestras y análisis", cta: "Agendar toma de muestra" },
  "salud-estetica": { kicker: "Cuidado personal", aboutTitle: "Tratamientos y planes", cta: "Reservar sesión" },
  "salud-deporte": { kicker: "Entrena a tu ritmo", aboutTitle: "Planes y clases", cta: "Inscribirme" },
  "manufactura-planta": { kicker: "Fabricación en planta", aboutTitle: "Capacidad productiva", cta: "Solicitar cotización" },
  "manufactura-taller": { kicker: "Taller y series cortas", aboutTitle: "Lo que fabricamos", cta: "Pedir cotización" },
  "manufactura-maquila": { kicker: "Ensamble para su marca", aboutTitle: "Capacidad de maquila", cta: "Solicitar cupo" },
  "manufactura-compras": { kicker: "Abastecimiento industrial", aboutTitle: "Proveedores e inventarios", cta: "Ser proveedor" },
  "manufactura-b2b": { kicker: "Soluciones para empresas", aboutTitle: "Portafolio industrial", cta: "Hablar con un asesor" },
  "manufactura-posventa": { kicker: "Mantenimiento y repuestos", aboutTitle: "Servicio técnico", cta: "Programar mantenimiento" },
  "transporte-carga": { kicker: "Carga entre ciudades", aboutTitle: "Flota y rutas", cta: "Cotizar un envío" },
  "transporte-mensajeria": { kicker: "Entregas el mismo día", aboutTitle: "Última milla", cta: "Programar recogida" },
  "transporte-pasajeros": { kicker: "Movilidad de personas", aboutTitle: "Rutas y horarios", cta: "Consultar rutas" },
  "transporte-bodegaje": { kicker: "Bodegaje y distribución", aboutTitle: "Centro de distribución", cta: "Solicitar espacio" },
  "transporte-comercio-ext": { kicker: "Aduanas y comercio exterior", aboutTitle: "Trámites y forwarding", cta: "Cotizar un despacho" },
  "transporte-operador": { kicker: "Operador logístico", aboutTitle: "Soluciones de punta a punta", cta: "Hablar con un asesor" },
  "agro-primaria": { kicker: "Directo de la finca", aboutTitle: "Cultivos y origen", cta: "Contacto comercial" },
  "agro-poscosecha": { kicker: "Poscosecha y empaque", aboutTitle: "Selección y empaque", cta: "Cotizar un lote" },
  "agro-transformacion": { kicker: "Del campo a la mesa", aboutTitle: "Productos y proceso", cta: "Pedir muestras" },
  "agro-insumos": { kicker: "Insumos para el campo", aboutTitle: "Semillas, insumos y equipos", cta: "Ver catálogo" },
  "agro-exportacion": { kicker: "Comercialización y exportación", aboutTitle: "Origen y calidad", cta: "Solicitar oferta" },
  "agro-acopio": { kicker: "Acopio regional", aboutTitle: "Recogemos en tu vereda", cta: "Programar recogida" },
  "pecuaria-bovinos": { kicker: "Ganadería de leche y carne", aboutTitle: "Nuestro hato", cta: "Contacto comercial" },
  "pecuaria-porcinos": { kicker: "Porcicultura", aboutTitle: "Cría y engorde", cta: "Contacto comercial" },
  "pecuaria-aves": { kicker: "Avicultura", aboutTitle: "Aves y huevos", cta: "Pedir un lote" },
  "pecuaria-piscicultura": { kicker: "Piscicultura", aboutTitle: "Estanques y cosecha", cta: "Contacto comercial" },
  "pecuaria-derivados": { kicker: "Quesos y derivados", aboutTitle: "De la finca a la mesa", cta: "Pedir muestras" },
  "pecuaria-comercial": { kicker: "Comercialización de ganado", aboutTitle: "Compra y venta", cta: "Solicitar oferta" },
  "servicios-consultoria": { kicker: "Consultoría y acompañamiento", aboutTitle: "Cómo trabajamos", cta: "Agendar conversación" },
  "servicios-financieros": { kicker: "Soluciones financieras", aboutTitle: "Productos para ti y tu empresa", cta: "Simular un crédito" },
  "servicios-software": { kicker: "Tecnología a la medida", aboutTitle: "Desarrollo y soporte", cta: "Contar mi proyecto" },
  "servicios-educacion": { kicker: "Formación con propósito", aboutTitle: "Programas y cursos", cta: "Inscribirme" },
  "servicios-comunicacion": { kicker: "Comunicación que se nota", aboutTitle: "Campañas y piezas", cta: "Pedir una propuesta" },
  "servicios-bpo": { kicker: "Operación de apoyo", aboutTitle: "Servicios que quitamos de encima", cta: "Cotizar servicio" },
  "turismo-hotel": { kicker: "Hospedaje en Boyacá", aboutTitle: "Habitaciones y experiencias", cta: "Consultar disponibilidad" },
  "turismo-agencia": { kicker: "Planes y paquetes", aboutTitle: "Viajes diseñados para ti", cta: "Armar mi plan" },
  "turismo-atraccion": { kicker: "Un lugar para visitar", aboutTitle: "Qué vas a vivir", cta: "Comprar entrada" },
  "turismo-experiencias": { kicker: "Experiencias locales", aboutTitle: "Recorridos y actividades", cta: "Reservar experiencia" },
  "turismo-eventos": { kicker: "Eventos y convenciones", aboutTitle: "Espacios para cada ocasión", cta: "Cotizar evento" },
  "turismo-transporte": { kicker: "Traslados y tours", aboutTitle: "Rutas y excursiones", cta: "Reservar traslado" },
  "mineria-extraccion": { kicker: "Minería responsable en Boyacá", aboutTitle: "Frentes de explotación", cta: "Solicitar ficha técnica" },
  "mineria-beneficio": { kicker: "Beneficio y transformación de mineral", aboutTitle: "Planta y procesos", cta: "Cotizar producto" },
  "mineria-energia": { kicker: "Energía para la región", aboutTitle: "Generación y distribución", cta: "Hablar con un asesor" },
  "mineria-servicios": { kicker: "Servicios a la operación minera", aboutTitle: "Apoyo en frente y planta", cta: "Solicitar servicio" },
  "mineria-comercio": { kicker: "Comercialización de minerales", aboutTitle: "Calidad certificada por lote", cta: "Solicitar oferta" },
  "mineria-transporte": { kicker: "Transporte y despacho de mineral", aboutTitle: "Rutas y despachos", cta: "Programar despacho" },
  "construccion-obra": { kicker: "Construimos en Boyacá", aboutTitle: "Proyectos y obras", cta: "Cotizar mi obra" },
  "construccion-diseno": { kicker: "Arquitectura e interventoría", aboutTitle: "Proyectos y supervisión", cta: "Agendar reunión" },
  "construccion-instalaciones": { kicker: "Instalaciones de obra", aboutTitle: "Redes y montajes", cta: "Cotizar instalación" },
  "construccion-materiales": { kicker: "Depósito de materiales", aboutTitle: "Todo para tu obra", cta: "Pedir cotización" },
  "construccion-inmobiliaria": { kicker: "Inmuebles en venta y arriendo", aboutTitle: "Proyectos disponibles", cta: "Agendar visita" },
  "construccion-mantenimiento": { kicker: "Acabados y mantenimiento", aboutTitle: "Servicios para tu espacio", cta: "Solicitar visita técnica" },
  "madera-bosque": { kicker: "Madera de bosque", aboutTitle: "Plantación y corte", cta: "Solicitar oferta" },
  "madera-aserradero": { kicker: "Aserrío y secado", aboutTitle: "Tablas y vigas", cta: "Pedir cotización" },
  "madera-carpinteria": { kicker: "Carpintería a medida", aboutTitle: "Muebles y piezas", cta: "Cotizar un mueble" },
  "madera-deposito": { kicker: "Depósito de madera", aboutTitle: "Medidas y especies", cta: "Ver existencias" },
  "madera-estructuras": { kicker: "Estructuras de madera", aboutTitle: "Techos y entramados", cta: "Cotizar la estructura" },
  "madera-instalacion": { kicker: "Instalación en madera", aboutTitle: "Pisos, closets y acabados", cta: "Agendar visita" },
  "otra-operacion": { kicker: "Operación y ejecución", aboutTitle: "Lo que hacemos", cta: "Solicitar cotización" },
  "otra-comercial": { kicker: "Productos y servicios", aboutTitle: "Nuestro portafolio", cta: "Hablar con ventas" },
  "otra-logistica": { kicker: "Logística confiable", aboutTitle: "Cómo movemos lo tuyo", cta: "Cotizar servicio" },
  "otra-servicio": { kicker: "Atención y soporte", aboutTitle: "Cómo te ayudamos", cta: "Contactarnos" },
  "otra-digital": { kicker: "Producto digital", aboutTitle: "La plataforma", cta: "Conocer el producto" },
  "otra-mixto": { kicker: "Un negocio con varias líneas", aboutTitle: "Cómo operamos", cta: "Contarnos su caso" },
};

type Extras = Record<string, unknown>;

const GARMENTS: [Garment, string, string, string, string, string?][] = [
  ["shirt", "CAMISAS", "Camisa oxford", "TALLAS S–XL · 3 COLORES", "$89.900", "$109.900"],
  ["jeans", "JEANS", "Jean clásico tiro alto", "TALLAS 6–16", "$119.900"],
  ["jacket", "CHAQUETAS", "Chaqueta de jean", "TALLAS S–L", "$159.900"],
  ["dress", "VESTIDOS", "Vestido camisero", "TALLAS XS–L", "$129.900", "$149.900"],
  ["hoodie", "BUSOS", "Buso con capota", "UNISEX · S–XL", "$99.900"],
  ["sneaker", "CALZADO", "Tenis blancos", "TALLAS 35–43", "$149.900"],
];

/**
 * Productos de la página según la industria, para que se vea el negocio real:
 * prendas para moda; mercado de barrio para comercio (la plantilla ya dibuja
 * bien costales, botellas, latas y cajas cuando el nombre lo dice).
 */
const INDUSTRY_CARDS: Partial<Record<IndustryId, TemplateCopy["cards"]>> = {
  moda: GARMENTS.map(([garment, tag, title, location, price, oldPrice], index) => ({
    tag, title, location, price, oldPrice, image: garmentImage(garment, index), featured: index === 0,
  })),
  comercio: [
    { tag: "GRANOS", title: "Arroz 500 g", location: "BULTO O UNIDAD", price: "$2.900", featured: true },
    { tag: "ACEITES", title: "Aceite de girasol 1 L", location: "BOTELLA", price: "$9.800", oldPrice: "$11.200" },
    { tag: "LÁCTEOS", title: "Leche entera 1 L", location: "BOLSA", price: "$4.200" },
    { tag: "DESPENSA", title: "Huevos x 30", location: "CUBETA", price: "$16.500" },
    { tag: "ENLATADOS", title: "Atún en lata", location: "175 G", price: "$6.900" },
    { tag: "ASEO", title: "Detergente líquido 2 L", location: "BOTELLA", price: "$18.900", oldPrice: "$21.500" },
  ],
};

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
  const cards = special?.cards ?? INDUSTRY_CARDS[industry.id];
  if (cards) copy.cards = cards;
  if (special?.statement) copy.statement = special.statement;
  return { copy, extras: special?.extras ?? {} };
}
