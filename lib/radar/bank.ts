import type {
  DimensionId,
  Industry,
  IndustryId,
  LinkId,
  RadarGoalId,
  RadarQuestion,
  SizeId,
} from "@/lib/radar/types";

/* ============================================================================
   Banco de preguntas del Radar IA.

   Base: esquema de la encuesta Radar IA (21 preguntas). Se recortó a 15–18
   pantallas cruzándolo con la propuesta de Jessica (35 ítems): se quitaron
   las preguntas del curso de IA y de la caja de compensación, se fusionaron
   las que medían lo mismo y se tomaron de la propuesta las que el esquema no
   tenía (papel de la gerencia, quién lideraría la IA, reglas de uso de IA y
   protección de cuentas).

   Lo dinámico:
   · 2 preguntas propias de la industria.
   · 1 del eslabón, solo si no repite un tema que la industria ya preguntó.
   · «¿Qué tan fácil es sacar la lista de clientes?» no aparece si todo está
     en papel (se infiere 0).
   · «¿Qué reglas tienen para usar IA?» solo aparece si ya usan IA.
   ========================================================================== */

export const DIMENSIONS: { id: DimensionId; label: string; short: string; weight: number }[] = [
  { id: "negocio", label: "Prácticas del negocio", short: "Negocio", weight: 0.15 },
  { id: "datos", label: "Datos: disponibilidad y calidad", short: "Datos", weight: 0.25 },
  { id: "tecnologia", label: "Tecnología y seguridad", short: "Tecnología", weight: 0.15 },
  { id: "analitica", label: "Analítica e IA", short: "Analítica", weight: 0.2 },
  { id: "equipo", label: "Equipo y liderazgo", short: "Equipo", weight: 0.15 },
  { id: "estrategia", label: "Dirección y estrategia", short: "Estrategia", weight: 0.1 },
];

export const SIZES: Record<SizeId, { label: string; detail: string }> = {
  micro: { label: "1 a 10", detail: "Microempresa" },
  pequena: { label: "11 a 50", detail: "Pequeña" },
  mediana: { label: "51 a 200", detail: "Mediana" },
  grande: { label: "Más de 200", detail: "Grande" },
};

export const LINKS: Record<LinkId, string> = {
  produccion: "Producción / transformación",
  comercial: "Comercialización y ventas",
  logistica: "Logística y distribución",
  servicio: "Servicio y atención al cliente",
};

export const GOALS: Record<RadarGoalId, { label: string; detail: string }> = {
  vender: { label: "Vender más", detail: "Aumentar ingresos, ticket o conversión" },
  costos: { label: "Reducir costos y desperdicio", detail: "Mermas, inventario, tiempos, errores" },
  clientes: { label: "Conocer y retener clientes", detail: "Fidelizar, segmentar, atender mejor" },
  automatizar: { label: "Automatizar tareas", detail: "Menos trabajo manual y reportes" },
  demanda: { label: "Anticipar la demanda", detail: "Saber cuánto producir, comprar o atender" },
  nose: { label: "Aún no lo sé", detail: "Quiero entender qué puedo hacer" },
};

export const INDUSTRIES: Industry[] = [
  {
    id: "moda",
    label: "Moda y textil",
    icon: "fashion",
    template: "retail",
    vocab: { productos: "prendas", clientes: "compradores", punto: "tienda" },
    activities: [
      { id: "moda-textil", label: "Textil e insumos", description: "Hilamos, tejemos, teñimos o vendemos tela e insumos; no confeccionamos prendas", link: "produccion", vocab: { productos: "telas e insumos" } },
      { id: "moda-confeccion", label: "Diseño y confección", description: "Diseñamos y producimos prendas (taller, planta o maquila propia)", link: "produccion" },
      { id: "moda-calzado", label: "Calzado, marroquinería y accesorios", description: "Producimos o ensamblamos zapatos, bolsos, cinturones o bisutería", link: "produccion", vocab: { productos: "calzado y accesorios" } },
      { id: "moda-compraventa", label: "Tienda física de moda", description: "Vendemos ropa o accesorios en local; no producimos", link: "comercial" },
      { id: "moda-online", label: "Marca o tienda online", description: "Vendemos principalmente por redes, catálogo digital o e-commerce", link: "comercial" },
      { id: "moda-mayorista", label: "Distribución mayorista", description: "Abastecemos tiendas, almacenes o marcas; no vendemos al detal", link: "logistica" },
    ],
  },
  {
    id: "alimentos",
    label: "Alimentos y bebidas",
    icon: "bakery",
    template: "gastronomia",
    vocab: { productos: "productos", clientes: "clientes", punto: "local" },
    activities: [
      { id: "alimentos-produccion", label: "Producción de alimentos", description: "Panadería, pastelería, planta de alimentos o lácteos sólidos", link: "produccion" },
      { id: "alimentos-bebidas", label: "Producción de bebidas", description: "Jugos, agua, cerveza, café tostado u otras bebidas; no es un restaurante", link: "produccion", vocab: { productos: "bebidas" } },
      { id: "alimentos-restaurante", label: "Restaurante o cafetería", description: "Cocinamos y servimos al público en el local o para llevar", link: "servicio" },
      { id: "alimentos-catering", label: "Catering y alimentación institucional", description: "Comidas para eventos, empresas, colegios o casinos; sin mesa al público", link: "servicio" },
      { id: "alimentos-venta", label: "Tienda de alimentos", description: "Vendemos alimentos o bebidas en mostrador, sin preparar platos a la mesa", link: "comercial" },
      { id: "alimentos-domicilios", label: "Distribución y domicilios", description: "Repartimos a tiendas, empresas u hogares; no operamos un local de consumo", link: "logistica" },
    ],
  },
  {
    id: "comercio",
    label: "Comercio y retail",
    icon: "retail",
    template: "retail",
    vocab: { productos: "productos", clientes: "clientes", punto: "tienda" },
    activities: [
      { id: "comercio-fisica", label: "Tienda de barrio o especializada", description: "Venta al detal en un local, sin autoservicio de supermercado", link: "comercial" },
      { id: "comercio-autoservicio", label: "Supermercado o minimercado", description: "Autoservicio de canasta familiar, aseo y abarrotes", link: "comercial" },
      { id: "comercio-online", label: "Tienda propia en línea", description: "Vendemos por página o app propia, con inventario a cargo nuestro", link: "comercial" },
      { id: "comercio-marketplace", label: "Venta en marketplaces", description: "Vendemos en plataformas de terceros, con poco o ningún local propio", link: "comercial" },
      { id: "comercio-mayorista", label: "Bodega y distribución mayorista", description: "Abastecemos a otros comercios; no vendemos al consumidor final", link: "logistica" },
      { id: "comercio-posventa", label: "Servicio técnico y posventa", description: "Garantías, reparaciones y recambios; no es la venta principal", link: "servicio" },
    ],
  },
  {
    id: "salud",
    label: "Salud y bienestar",
    icon: "health",
    template: "servicios",
    vocab: { productos: "servicios", clientes: "pacientes", punto: "sede" },
    activities: [
      { id: "salud-ips", label: "IPS, clínica o consultorio", description: "Atención médica, odontológica o de rehabilitación en sede", link: "servicio" },
      { id: "salud-hogar", label: "Atención domiciliaria", description: "Cuidado, enfermería o terapias en el hogar; no es una IPS de consultorio", link: "servicio" },
      { id: "salud-farmacia", label: "Farmacia o droguería", description: "Venta de medicamentos y productos de salud", link: "comercial", vocab: { productos: "medicamentos y productos", clientes: "clientes" } },
      { id: "salud-laboratorio", label: "Laboratorio clínico o de producción", description: "Toma y procesamiento de muestras, o elaboración de insumos de salud", link: "produccion", vocab: { productos: "análisis" } },
      { id: "salud-estetica", label: "Estética y cuidado personal", description: "Spa, centro de estética, barbería o salón; no es gimnasio", link: "servicio", vocab: { clientes: "clientes" } },
      { id: "salud-deporte", label: "Gimnasio y acondicionamiento", description: "Entrenamiento físico, box o centro deportivo", link: "servicio", vocab: { clientes: "clientes", punto: "gimnasio" } },
    ],
  },
  {
    id: "manufactura",
    label: "Manufactura e industria",
    icon: "factory",
    template: "metalurgia",
    vocab: { productos: "productos", clientes: "clientes", punto: "planta" },
    activities: [
      { id: "manufactura-planta", label: "Producción en planta", description: "Fabricamos en serie o por lotes en planta propia", link: "produccion" },
      { id: "manufactura-taller", label: "Taller y series cortas", description: "Metalmecánica, prototipos o lotes pequeños; no es una línea masiva", link: "produccion" },
      { id: "manufactura-maquila", label: "Ensamble y maquila", description: "Transformamos o ensamblamos para otras empresas", link: "produccion" },
      { id: "manufactura-compras", label: "Compras e insumos industriales", description: "Compramos y abastecemos materias primas; no fabricamos el producto final", link: "logistica" },
      { id: "manufactura-b2b", label: "Venta a empresas (B2B)", description: "Comercializamos producto industrial a distribuidores u otras plantas", link: "comercial" },
      { id: "manufactura-posventa", label: "Mantenimiento y posventa", description: "Servicio técnico, garantías y repuestos de lo que ya se vendió", link: "servicio" },
    ],
  },
  {
    id: "transporte",
    label: "Transporte y logística",
    icon: "transport",
    template: "servicios",
    vocab: { productos: "envíos", clientes: "clientes", punto: "centro de distribución" },
    activities: [
      { id: "transporte-carga", label: "Transporte de carga", description: "Movemos mercancía intermunicipal o regional; no es última milla urbana", link: "logistica" },
      { id: "transporte-mensajeria", label: "Mensajería y última milla", description: "Entregas urbanas a hogares o comercios", link: "logistica" },
      { id: "transporte-pasajeros", label: "Transporte de pasajeros", description: "Buses, escolar, intermunicipal o movilidad de personas", link: "servicio", vocab: { productos: "viajes", clientes: "pasajeros" } },
      { id: "transporte-bodegaje", label: "Almacenamiento y bodegaje", description: "Operamos bodegas o centros de distribución, sin flota propia como negocio principal", link: "logistica" },
      { id: "transporte-comercio-ext", label: "Comercio exterior y aduanas", description: "Agenciamiento aduanero, forwarding o trámites de importación y exportación", link: "logistica" },
      { id: "transporte-operador", label: "Operador logístico integral", description: "Coordinamos terceros (transporte, bodega y aduana) sin operar solo un eslabón", link: "comercial" },
    ],
  },
  {
    id: "agro",
    label: "Agro y agroindustria",
    icon: "farm",
    template: "agroindustria",
    vocab: { productos: "cosechas", clientes: "compradores", punto: "finca" },
    activities: [
      { id: "agro-primaria", label: "Cultivos y producción vegetal", description: "Agricultura, vivero o cosecha en finca; la ganadería tiene su propia industria", link: "produccion" },
      { id: "agro-poscosecha", label: "Poscosecha y empaque", description: "Seleccionamos, secamos o empacamos la cosecha; no criamos animales", link: "produccion", vocab: { productos: "cosechas empacadas" } },
      { id: "agro-transformacion", label: "Transformación agroindustrial", description: "Procesamos lo cosechado o criado (café, lácteos, pulpas)", link: "produccion", vocab: { productos: "productos" } },
      { id: "agro-insumos", label: "Insumos y maquinaria agrícola", description: "Vendemos semillas, agroinsumos o equipos; no producimos el cultivo", link: "comercial", vocab: { productos: "insumos", clientes: "productores" } },
      { id: "agro-exportacion", label: "Comercialización y exportación", description: "Compramos y vendemos producto agrícola, sin procesarlo", link: "comercial" },
      { id: "agro-acopio", label: "Acopio y distribución", description: "Recogemos, almacenamos y transportamos cosechas de terceros", link: "logistica" },
    ],
  },
  {
    id: "pecuaria",
    label: "Ganadería y pecuaria",
    icon: "cattle",
    template: "agroindustria",
    vocab: { productos: "animales y derivados", clientes: "compradores", punto: "finca" },
    activities: [
      { id: "pecuaria-bovinos", label: "Ganadería bovina", description: "Cría de ganado de leche, carne o doble propósito", link: "produccion", vocab: { productos: "ganado y leche" } },
      { id: "pecuaria-porcinos", label: "Porcicultura", description: "Cría de cerdos", link: "produccion", vocab: { productos: "cerdos" } },
      { id: "pecuaria-aves", label: "Avicultura", description: "Pollos de engorde, ponedoras u otras aves", link: "produccion", vocab: { productos: "aves y huevos" } },
      { id: "pecuaria-piscicultura", label: "Piscicultura", description: "Cría de peces en estanque o jaula", link: "produccion", vocab: { productos: "peces", punto: "estanque" } },
      { id: "pecuaria-derivados", label: "Derivados lácteos y cárnicos", description: "Quesos, yogur, cortes o embutidos a partir de lo que criamos o acopiamos", link: "produccion", vocab: { productos: "derivados" } },
      { id: "pecuaria-comercial", label: "Comercialización de animales", description: "Compramos y vendemos ganado u otros animales, sin criarlos como negocio principal", link: "comercial" },
    ],
  },
  {
    id: "servicios",
    label: "Servicios profesionales y financieros",
    icon: "services",
    template: "servicios",
    vocab: { productos: "servicios", clientes: "clientes", punto: "oficina" },
    activities: [
      { id: "servicios-consultoria", label: "Consultoría y asesoría", description: "Contable, jurídica, tributaria o empresarial", link: "servicio" },
      { id: "servicios-financieros", label: "Servicios financieros", description: "Crédito, seguros, cooperativas o fondos", link: "comercial" },
      { id: "servicios-software", label: "Tecnología y software", description: "Desarrollo, nube, soporte TI o ciberseguridad", link: "servicio" },
      { id: "servicios-educacion", label: "Educación y formación", description: "Cursos, colegios, institutos o academias", link: "servicio", vocab: { clientes: "estudiantes" } },
      { id: "servicios-comunicacion", label: "Comunicación y marketing", description: "Publicidad, diseño, medios o agencia creativa", link: "servicio" },
      { id: "servicios-bpo", label: "BPO y servicios de apoyo", description: "Call center, nómina, aseo, vigilancia u outsourcing administrativo", link: "servicio" },
    ],
  },
  {
    id: "turismo",
    label: "Turismo y hotelería",
    icon: "hotel",
    template: "turismo",
    vocab: { productos: "reservas", clientes: "huéspedes", punto: "hotel" },
    activities: [
      { id: "turismo-hotel", label: "Hotel o alojamiento", description: "Hotel, hostal, glamping o apartamentos turísticos", link: "servicio" },
      { id: "turismo-agencia", label: "Agencia de viajes u operador", description: "Armamos y vendemos planes y paquetes; no operamos el hotel", link: "comercial", vocab: { productos: "planes", clientes: "viajeros" } },
      { id: "turismo-atraccion", label: "Atractivo o parque", description: "Parque, museo, termales o sitio de visita con taquilla", link: "servicio", vocab: { productos: "entradas", clientes: "visitantes", punto: "atractivo" } },
      { id: "turismo-experiencias", label: "Guianza y experiencias", description: "Guías, avistamiento, gastronomía turística o actividades locales", link: "servicio", vocab: { productos: "experiencias", clientes: "viajeros" } },
      { id: "turismo-eventos", label: "Eventos y convenciones", description: "Organizamos eventos o alquilamos salones y recintos", link: "servicio", vocab: { clientes: "clientes" } },
      { id: "turismo-transporte", label: "Transporte turístico", description: "Traslados, tours en vehículo o excursiones; no es una agencia de paquetes", link: "logistica", vocab: { clientes: "viajeros" } },
    ],
  },
  {
    id: "mineria",
    label: "Minería y energía",
    icon: "mining",
    template: "metalurgia",
    vocab: { productos: "minerales", clientes: "compradores", punto: "mina" },
    activities: [
      { id: "mineria-extraccion", label: "Extracción minera", description: "Carbón, esmeraldas, materiales de construcción u otros minerales en frente de mina", link: "produccion" },
      { id: "mineria-beneficio", label: "Beneficio y transformación", description: "Lavado, trituración, coquización o tallado; no extraemos el mineral", link: "produccion", vocab: { productos: "productos beneficiados" } },
      { id: "mineria-energia", label: "Generación o distribución de energía", description: "Térmica, hidroeléctrica, solar u otra energía; no es mina", link: "produccion", vocab: { productos: "energía", punto: "planta" } },
      { id: "mineria-servicios", label: "Servicios a la mina", description: "Perforación, mantenimiento, explosivos o contratistas de apoyo", link: "servicio", vocab: { productos: "servicios", clientes: "operadores mineros" } },
      { id: "mineria-comercio", label: "Comercialización de minerales", description: "Compramos y vendemos mineral o producto beneficiado, sin extraerlo", link: "comercial" },
      { id: "mineria-transporte", label: "Transporte y despacho minero", description: "Llevamos mineral a acopios, plantas o puertos", link: "logistica" },
    ],
  },
  {
    id: "construccion",
    label: "Construcción e inmobiliario",
    icon: "construction",
    template: "servicios",
    vocab: { productos: "obras", clientes: "clientes", punto: "obra" },
    activities: [
      { id: "construccion-obra", label: "Construcción de obras", description: "Vivienda, edificaciones u obra civil como contratista principal", link: "produccion" },
      { id: "construccion-diseno", label: "Arquitectura e interventoría", description: "Diseño, planos, supervisión o gerencia de proyecto; no ejecutamos la obra", link: "servicio", vocab: { productos: "proyectos" } },
      { id: "construccion-instalaciones", label: "Instalaciones y redes", description: "Eléctrica, hidrosanitaria, gas o datos en obra; no es el constructor general", link: "produccion" },
      { id: "construccion-materiales", label: "Venta de materiales", description: "Ferretería o depósito de materiales para la obra", link: "comercial", vocab: { productos: "materiales" } },
      { id: "construccion-inmobiliaria", label: "Inmobiliaria", description: "Venta y arriendo de inmuebles ya construidos", link: "comercial", vocab: { productos: "inmuebles", clientes: "compradores e inquilinos" } },
      { id: "construccion-mantenimiento", label: "Acabados y mantenimiento", description: "Remodelaciones, pintura, reparaciones o facilities de inmuebles", link: "servicio" },
    ],
  },
  {
    id: "madera",
    label: "Madera y carpintería",
    icon: "wood",
    template: "servicios",
    vocab: { productos: "maderas y muebles", clientes: "clientes", punto: "taller" },
    activities: [
      { id: "madera-bosque", label: "Aprovechamiento forestal", description: "Plantación, corte o extracción de madera en bosque o finca", link: "produccion", vocab: { productos: "trozas", punto: "finca" } },
      { id: "madera-aserradero", label: "Aserrío y secado", description: "Aserradero, secado o dimensionado de tablas y vigas", link: "produccion", vocab: { productos: "tablas y vigas" } },
      { id: "madera-carpinteria", label: "Carpintería y muebles", description: "Muebles, puertas, ventanas o piezas a medida en taller", link: "produccion", vocab: { productos: "muebles" } },
      { id: "madera-deposito", label: "Depósito de madera", description: "Vendemos madera dimensionada, tableros o insumos; no aserramos", link: "comercial", vocab: { productos: "maderas" } },
      { id: "madera-estructuras", label: "Estructuras y cubiertas", description: "Entramados, techos o estructuras de madera en obra", link: "produccion", vocab: { productos: "estructuras", punto: "obra" } },
      { id: "madera-instalacion", label: "Instalación y acabados", description: "Pisos, cielos rasos, closets o instalación en el sitio del cliente", link: "servicio", vocab: { productos: "instalaciones" } },
    ],
  },
  {
    id: "otra",
    label: "Otra industria",
    icon: "compass",
    template: "servicios",
    vocab: { productos: "productos o servicios", clientes: "clientes", punto: "sede" },
    activities: [
      { id: "otra-operacion", label: "Producción u operación", description: "Fabricamos, construimos o ejecutamos el producto o la obra", link: "produccion" },
      { id: "otra-comercial", label: "Comercialización", description: "Vendemos productos o servicios de terceros o propios, sin producirlos", link: "comercial" },
      { id: "otra-logistica", label: "Logística", description: "Movemos, almacenamos o distribuimos", link: "logistica" },
      { id: "otra-servicio", label: "Servicio al cliente", description: "Atención, soporte o cuidado de personas; no es venta ni producción", link: "servicio" },
      { id: "otra-digital", label: "Producto o plataforma digital", description: "App, software, contenidos o marketplace propio", link: "servicio", vocab: { productos: "servicios digitales" } },
      { id: "otra-mixto", label: "Varias actividades a la vez", description: "El negocio combina producción, venta y servicio; elegimos esta si ninguna otra encaja", link: "comercial" },
    ],
  },
];

export function industryById(id: IndustryId | ""): Industry | undefined {
  return INDUSTRIES.find((industry) => industry.id === id);
}

/* ----------------------------- Nicho: industria ---------------------------- */

const NEGOCIO = "Su negocio";

export const INDUSTRY_QUESTIONS: Record<IndustryId, RadarQuestion[]> = {
  moda: [
    {
      id: "moda-1", dimension: "negocio", section: NEGOCIO, topics: ["ventas-detalle"],
      text: "¿Registran las ventas por referencia, talla y color?",
      options: ["No, solo el total vendido", "Por referencia, sin talla ni color", "Sí, pero en archivos separados", "Sí, en un sistema con todo el detalle"],
      consultantNote: "Pida un ejemplo: «¿sabe cuántas camisas talla M azules vendió el mes pasado?»",
      finding: "Sin ventas por talla y color, las compras de temporada se hacen a ciegas y el inventario termina en liquidación.",
    },
    {
      id: "moda-2", dimension: "negocio", section: NEGOCIO, topics: ["planeacion"],
      text: "¿Cómo deciden cuánto producir o comprar para cada temporada?",
      options: ["Por intuición o lo que dice el proveedor", "Repetimos lo de la temporada anterior", "Analizamos ventas pasadas en Excel", "Con un pronóstico por referencia"],
      finding: "La compra o producción de temporada no se apoya en datos históricos: alto riesgo de faltantes y sobrestock.",
    },
  ],
  alimentos: [
    {
      id: "alimentos-1", dimension: "negocio", section: NEGOCIO, topics: ["desperdicio"],
      text: "¿Registran cuánto producto sobra, se daña o se bota cada día?",
      options: ["No lo registramos", "Lo calculamos «a ojo»", "En una planilla, por producto", "En el sistema, por producto y día"],
      consultantNote: "La merma es el dato que más rápido muestra el valor de medir. Si no la conocen, pídales un estimado.",
      finding: "La merma no se mide: es dinero que se pierde todos los días sin que nadie lo cuantifique.",
    },
    {
      id: "alimentos-2", dimension: "negocio", section: NEGOCIO, topics: ["planeacion"],
      text: "¿Cómo deciden cuánto producir o preparar cada día?",
      options: ["Lo mismo todos los días", "Según la experiencia del encargado", "Ajustamos según el día de la semana con registros", "Con un pronóstico (clima, festivos, quincena)"],
      finding: "La producción diaria no responde a la demanda real: unos días sobra y otros falta.",
    },
  ],
  comercio: [
    {
      id: "comercio-1", dimension: "negocio", section: NEGOCIO, topics: ["inventario"],
      text: "¿Conocen la rotación de cada producto (cuántos días dura en inventario)?",
      options: ["No", "Solo de los productos principales, a ojo", "Sí, con un reporte que armamos", "Sí, el sistema lo calcula por producto"],
      finding: "Sin rotación por producto, el capital queda inmovilizado en inventario que no se vende.",
    },
    {
      id: "comercio-2", dimension: "negocio", section: NEGOCIO, topics: ["clientes"],
      text: "¿Tienen un programa de fidelización o base de datos de clientes?",
      options: ["No", "Algunos contactos en el celular", "Base de clientes con sus compras", "Programa de puntos con historial y segmentos"],
      finding: "No se identifican los clientes ni su historial: imposible personalizar ofertas o medir recompra.",
    },
  ],
  salud: [
    {
      id: "salud-1", dimension: "negocio", section: NEGOCIO, topics: ["solicitudes"],
      text: "¿Las historias clínicas o registros de atención están digitalizados?",
      options: ["En papel", "Mixto: parte papel, parte digital", "Software de historia clínica", "Software integrado con agenda y facturación"],
      consultantNote: "Los datos de salud son sensibles (Ley 1581 de 2012). Indague si hay consentimiento informado.",
      finding: "Los registros de atención no están digitalizados: alto riesgo de pérdida y nula capacidad de análisis.",
    },
    {
      id: "salud-2", dimension: "negocio", section: NEGOCIO, topics: ["agenda"],
      text: "¿Miden la inasistencia a citas y los tiempos de espera?",
      options: ["No los medimos", "Tenemos una idea general", "Los calculamos mensualmente", "Están en un tablero actualizado"],
      finding: "No se mide la inasistencia: la agenda pierde capacidad sin que se pueda corregir.",
    },
  ],
  manufactura: [
    {
      id: "manufactura-1", dimension: "negocio", section: NEGOCIO, topics: ["paros"],
      text: "¿Registran los paros de máquina y sus causas?",
      options: ["No", "En bitácora o cuaderno", "En Excel, con causa y duración", "Automáticamente desde las máquinas"],
      finding: "Los paros no se registran con su causa: no se puede atacar lo que más capacidad le quita a la planta.",
    },
    {
      id: "manufactura-2", dimension: "negocio", section: NEGOCIO, topics: ["captura"],
      text: "¿Capturan datos de forma automática en planta (sensores, PLC, MES)?",
      options: ["No, todo es manual", "Algunos equipos, pero no se guardan", "Sí, y se guardan en un sistema", "Sí, y se analizan para decidir"],
      finding: "La planta no genera datos automáticamente: el registro manual limita la confiabilidad y la frecuencia.",
    },
  ],
  transporte: [
    {
      id: "transporte-1", dimension: "negocio", section: NEGOCIO, topics: ["trazabilidad"],
      text: "¿Los vehículos tienen GPS o telemetría y se guarda esa información?",
      options: ["No tienen GPS", "Tienen GPS pero solo lo miramos en el momento", "Guardamos el histórico de recorridos", "Integrado con pedidos y costos"],
      finding: "No hay datos de recorridos: no se pueden optimizar rutas ni controlar combustible.",
    },
    {
      id: "transporte-2", dimension: "negocio", section: NEGOCIO, topics: ["entregas"],
      text: "¿Miden el porcentaje de entregas a tiempo y el costo por entrega?",
      options: ["No", "Solo uno de los dos, aproximado", "Ambos, cada mes", "Ambos, en un tablero diario"],
      finding: "Sin indicadores de cumplimiento y costo por entrega, no se sabe qué rutas o clientes dan pérdida.",
    },
  ],
  agro: [
    {
      id: "agro-1", dimension: "negocio", section: NEGOCIO, topics: ["lotes"],
      text: "¿Llevan registro por lote o cultivo (insumos, labores y rendimiento)?",
      options: ["No", "En libreta, de vez en cuando", "En Excel, por lote", "En una aplicación de campo"],
      finding: "No hay registro por lote: no se sabe qué lotes son rentables ni por qué rinden distinto.",
    },
    {
      id: "agro-2", dimension: "negocio", section: NEGOCIO, topics: ["clima"],
      text: "¿Usan datos de clima, suelo o imágenes satelitales?",
      options: ["No", "Solo el pronóstico del tiempo", "Estación meteorológica o análisis de suelo", "Agricultura de precisión (satélite, drones, sensores)"],
      finding: "Las decisiones de riego, fertilización y cosecha no usan datos de clima ni suelo.",
    },
  ],
  servicios: [
    {
      id: "servicios-1", dimension: "negocio", section: NEGOCIO, topics: ["clientes"],
      text: "¿Usan un CRM para el seguimiento de clientes y oportunidades?",
      options: ["No, cada quien lleva lo suyo", "Una hoja de cálculo compartida", "Sí, un CRM que usa el equipo comercial", "CRM integrado con facturación y marketing"],
      finding: "El seguimiento comercial depende de cada persona: se pierden oportunidades y no hay embudo medible.",
    },
    {
      id: "servicios-2", dimension: "negocio", section: NEGOCIO, topics: ["rentabilidad"],
      text: "¿Conocen la rentabilidad por cliente o por proyecto?",
      options: ["No", "Una idea general", "Al cierre de cada proyecto", "En tiempo real, con horas registradas"],
      finding: "No se conoce la rentabilidad por cliente o proyecto: algunos podrían estar generando pérdidas.",
    },
  ],
  turismo: [
    {
      id: "turismo-1", dimension: "negocio", section: NEGOCIO, topics: ["ocupacion"],
      text: "¿Registran a diario la ocupación y la tarifa por canal de venta?",
      options: ["No", "Solo la ocupación total", "Ocupación y tarifa por canal, en Excel", "En un PMS o channel manager con reportes"],
      finding: "No se conoce la ocupación y tarifa por canal: se pagan comisiones sin saber qué canal es rentable.",
    },
    {
      id: "turismo-2", dimension: "negocio", section: NEGOCIO, topics: ["satisfaccion"],
      text: "¿Analizan las reseñas y opiniones en línea de sus huéspedes?",
      options: ["No", "Las leemos de vez en cuando", "Las respondemos y llevamos un registro", "Medimos temas y tendencias de forma sistemática"],
      finding: "Las opiniones de los huéspedes no se analizan: se pierden alertas tempranas de problemas de servicio.",
    },
  ],
  mineria: [
    {
      id: "mineria-1", dimension: "negocio", section: NEGOCIO, topics: ["seguridad"],
      text: "¿Registran los incidentes, casi-accidentes y condiciones de riesgo (gases, sostenimiento, ventilación)?",
      options: ["No se registran", "Solo los accidentes graves, en papel", "Todos, en una planilla con su causa", "En un sistema, con causas, tendencias y alertas"],
      consultantNote: "En minería subterránea la seguridad es el dato más crítico. Pregunte si guardan las mediciones de gases por turno.",
      finding: "Los incidentes y condiciones de riesgo no se registran: no se pueden anticipar accidentes ni demostrar cumplimiento ante la autoridad minera.",
    },
    {
      id: "mineria-2", dimension: "negocio", section: NEGOCIO, topics: ["planeacion"],
      text: "¿Miden la producción y la calidad del mineral por frente o turno (toneladas, humedad, poder calorífico)?",
      options: ["No, solo lo que se vende", "Totales aproximados por semana", "Por frente o turno, en una planilla", "En un sistema, enlazado con los análisis de laboratorio"],
      finding: "No se mide la producción por frente ni la calidad: no se sabe qué frente es rentable ni se puede negociar el precio por calidad.",
    },
  ],
  construccion: [
    {
      id: "construccion-1", dimension: "negocio", section: NEGOCIO, topics: ["planeacion"],
      text: "¿Comparan el avance real de cada obra con lo presupuestado (costo y tiempo)?",
      options: ["No", "Solo al terminar la obra", "Cada mes, en Excel", "Cada semana, con un software de control de obra"],
      finding: "No se compara el avance con el presupuesto: los sobrecostos se descubren cuando ya no hay cómo corregirlos.",
    },
    {
      id: "construccion-2", dimension: "negocio", section: NEGOCIO, topics: ["inventario"],
      text: "¿Llevan control de los materiales que entran y salen de cada obra o bodega?",
      options: ["No", "Remisiones en papel", "Una planilla por obra", "Un sistema con existencias por obra"],
      finding: "Sin control de materiales por obra hay pérdidas, robos y compras dobles que nadie detecta.",
    },
  ],
  pecuaria: [
    {
      id: "pecuaria-1", dimension: "negocio", section: NEGOCIO, topics: ["hato"],
      text: "¿Llevan registro por animal o por lote (peso, partos, litros, mortalidad)?",
      options: ["No", "En libreta, cuando se acuerdan", "En Excel, por lote o por animal", "En una aplicación de finca"],
      finding: "Sin registro del hato no se sabe qué animales producen, cuáles se enferman ni cuánto cuesta criarlos.",
    },
    {
      id: "pecuaria-2", dimension: "negocio", section: NEGOCIO, topics: ["alimentacion"],
      text: "¿Conocen el costo de alimentación y el rendimiento (litros, kilos o huevos) de cada periodo?",
      options: ["No", "Un estimado al cierre del mes", "Costo y rendimiento, en una planilla", "Los dos, por lote y en el momento"],
      finding: "No se cruza lo que se gasta en alimento con lo que se produce: la finca puede estar perdiendo plata sin verlo.",
    },
  ],
  madera: [
    {
      id: "madera-1", dimension: "negocio", section: NEGOCIO, topics: ["medidas"],
      text: "¿Llevan inventario de madera por especie, medida y estado (verde, seca, usada)?",
      options: ["No", "Un conteo de vez en cuando", "Una planilla por especie y medida", "Un sistema que descuenta con cada pedido o corte"],
      finding: "Sin inventario por medida se compra de más, se corta lo que no hace falta y se pierde material en el patio.",
    },
    {
      id: "madera-2", dimension: "negocio", section: NEGOCIO, topics: ["corte"],
      text: "¿Miden el aprovechamiento del corte o del taller (metros útiles frente a desperdicio)?",
      options: ["No", "Una idea al terminar el trabajo", "Lo anotamos en cada pedido", "Lo medimos y lo usamos para cotizar"],
      finding: "El desperdicio de madera no se mide: el precio del mueble o de la tabla no cubre lo que realmente se botó.",
    },
  ],
  otra: [
    {
      id: "otra-1", dimension: "negocio", section: NEGOCIO, topics: ["kpi"],
      text: "¿Tienen indicadores clave (KPI) definidos y con meta?",
      options: ["No", "Algunos, sin meta clara", "Definidos y con meta", "Con meta y seguimiento periódico"],
      finding: "No hay indicadores clave con meta: no hay forma objetiva de saber si el negocio mejora.",
    },
    {
      id: "otra-2", dimension: "negocio", section: NEGOCIO, topics: ["rentabilidad"],
      text: "¿Saben cuáles son sus clientes o productos más rentables?",
      options: ["No", "Tenemos una idea", "Lo analizamos una vez al año", "Lo monitoreamos continuamente"],
      finding: "No se identifican los clientes y productos más rentables: los recursos se reparten sin criterio.",
    },
  ],
};

/* ------------------------------ Nicho: eslabón ----------------------------- */

/**
 * Dos candidatas por eslabón, en orden de prioridad. Se muestra la primera
 * cuyo tema no haya preguntado ya la industria; si ambas se repiten, ninguna.
 * Las llaves {productos}, {clientes} y {punto} toman el vocabulario del nicho.
 */
export const LINK_QUESTIONS: Record<LinkId, RadarQuestion[]> = {
  produccion: [
    {
      id: "produccion-1", dimension: "negocio", section: NEGOCIO, topics: ["planeacion"],
      text: "¿Cómo planifican la producción de sus {productos}?",
      options: ["Por experiencia o intuición", "Según los pedidos del momento", "Con históricos en hoja de cálculo", "Con un sistema de planeación y pronósticos"],
      finding: "La planeación de la producción no se apoya en datos: genera sobrantes, faltantes y horas extra.",
    },
    {
      id: "produccion-2", dimension: "negocio", section: NEGOCIO, topics: ["desperdicio"],
      text: "¿Miden desperdicios, reprocesos o productos defectuosos?",
      options: ["No", "Ocasionalmente", "Sí, cada mes", "Sí, por causa y en tiempo real"],
      finding: "El desperdicio y los reprocesos no se miden: es un costo oculto en cada unidad producida.",
    },
  ],
  comercial: [
    {
      id: "comercial-1", dimension: "negocio", section: NEGOCIO, topics: ["inventario"], skipFor: ["servicios", "turismo", "transporte"],
      text: "¿Cómo controlan el inventario de {productos}?",
      options: ["No llevamos control", "Conteos físicos de vez en cuando", "Hoja de cálculo actualizada a mano", "Sistema que descuenta con cada venta"],
      finding: "El inventario no se controla en línea: hay quiebres de stock y capital inmovilizado.",
    },
    {
      id: "comercial-2", dimension: "negocio", section: NEGOCIO, topics: ["clientes"],
      text: "¿Qué información tienen de sus {clientes}?",
      options: ["Prácticamente ninguna", "Nombre y teléfono de algunos", "Historial de compras por cliente", "Historial, segmentos y preferencias"],
      finding: "Hay poca información de los clientes: las ventas dependen del cliente que «llegue solo».",
    },
  ],
  logistica: [
    {
      id: "logistica-1", dimension: "negocio", section: NEGOCIO, topics: ["rutas"],
      text: "¿Cómo planifican las rutas y los despachos?",
      options: ["Cada conductor decide", "El coordinador las arma a mano", "Con apoyo de mapas y planillas", "Con software de ruteo"],
      finding: "Las rutas no se optimizan: más kilómetros, combustible y entregas tardías de las necesarias.",
    },
    {
      id: "logistica-2", dimension: "negocio", section: NEGOCIO, topics: ["trazabilidad"],
      text: "¿Pueden saber en qué estado está un pedido en este momento?",
      options: ["No, hay que llamar al conductor", "Solo al despachar y al entregar", "Sí, con estados que actualiza el equipo", "Sí, en tiempo real y el cliente también lo ve"],
      finding: "No hay trazabilidad de los pedidos: más reclamos y llamadas, menos confianza del cliente.",
    },
  ],
  servicio: [
    {
      id: "servicio-1", dimension: "negocio", section: NEGOCIO, topics: ["solicitudes"],
      text: "¿Cómo registran las solicitudes, quejas o reservas de sus {clientes}?",
      options: ["No se registran; se atienden y ya", "Quedan en WhatsApp o correo", "En una planilla o agenda digital", "En un sistema con estados y tiempos"],
      finding: "Las solicitudes de los clientes no quedan registradas: no se pueden medir tiempos ni problemas recurrentes.",
    },
    {
      id: "servicio-2", dimension: "negocio", section: NEGOCIO, topics: ["satisfaccion"],
      text: "¿Miden la satisfacción de sus {clientes}?",
      options: ["No", "Preguntamos de manera informal", "Encuesta periódica", "Encuesta automática (NPS) con seguimiento"],
      finding: "No se mide la satisfacción: los clientes insatisfechos se van sin dejar rastro.",
    },
  ],
};

/* --------------------------- Madurez (todas) ------------------------------ */

const usesAi = (answers: { choices: Record<string, string> }) => {
  const ai = answers.choices["ia-uso"];
  return ai === "B" || ai === "C" || ai === "D";
};

export const CORE_QUESTIONS: RadarQuestion[] = [
  {
    id: "datos-registro", dimension: "datos", section: "Datos",
    text: "¿Cómo registran hoy la información del negocio (ventas, inventario, clientes)?",
    options: ["En papel, cuadernos o de memoria", "En hojas de Excel sueltas, cada quien las suyas", "En software (POS, ERP, CRM) que no se conectan", "En sistemas integrados o una base de datos central"],
    consultantNote: "Es la pregunta que más pesa. Si la respuesta es mixta, elija la que describe la mayor parte de la operación.",
    finding: "La información del negocio no está en una base de datos estructurada: es el primer obstáculo para cualquier análisis.",
  },
  {
    id: "datos-historia", dimension: "datos", section: "Datos",
    text: "¿Cuánto tiempo de historia de datos confiable tienen?",
    options: ["Nada o menos de 6 meses", "Entre 6 y 12 meses", "Entre 1 y 3 años", "Más de 3 años"],
    finding: "El histórico de datos es corto: los modelos predictivos necesitan al menos uno o dos ciclos anuales.",
  },
  {
    id: "datos-lista", dimension: "datos", section: "Datos",
    text: "Si hoy necesitaran la lista de {clientes} del último año con lo que compró cada uno, ¿qué tan fácil sería obtenerla?",
    options: ["Imposible, o tomaría días reconstruirla", "Posible, pero uniendo archivos y quitando duplicados", "En pocas horas, con ajustes menores", "En minutos, completa y confiable, desde el sistema"],
    consultantNote: "Es la prueba práctica de la calidad de los datos. Otra forma: «si dos personas sacan el total de ventas del mes, ¿les da lo mismo?»",
    finding: "Los datos no son confiables ni fáciles de consultar: cualquier reporte o modelo heredará esos errores.",
    showIf: (answers) => answers.choices["datos-registro"] !== "A",
    inferWhenHidden: { points: 0, reason: "Con la información en papel, reconstruir la lista de clientes tomaría días." },
  },
  {
    id: "tec-integracion", dimension: "tecnologia", section: "Tecnología",
    text: "¿Sus sistemas o archivos se comunican entre sí?",
    options: ["No; todo se transcribe a mano", "Exportamos y copiamos entre archivos", "Algunas integraciones automáticas", "Todo integrado (un pedido genera la factura y descuenta el inventario)"],
    finding: "La información se transcribe entre sistemas: horas de trabajo manual y errores de digitación.",
  },
  {
    id: "tec-proteccion", dimension: "tecnologia", section: "Tecnología",
    text: "¿Dónde se guardan los datos y cómo se protegen?",
    options: [
      "En un computador o una USB, sin copias de seguridad",
      "En carpetas compartidas (Drive, OneDrive), con copias ocasionales",
      "En el sistema o la nube de la empresa, con copias periódicas y accesos por cargo",
      "Además, verificación en dos pasos, copias automáticas que se prueban y retiro de accesos",
    ],
    finding: "Los datos están en equipos personales o carpetas sin control: riesgo de pérdida y de fuga de información.",
  },
  {
    id: "analitica-decisiones", dimension: "analitica", section: "Analítica e IA",
    text: "¿Cómo toman las decisiones importantes (precios, compras, contrataciones, nuevos productos)?",
    options: ["Por intuición y experiencia", "Por experiencia, apoyada a veces en algunas cifras", "Con indicadores revisados periódicamente", "Con tableros actualizados y modelos predictivos"],
    finding: "Las decisiones se toman sin datos: el negocio reacciona tarde a los cambios.",
  },
  {
    id: "ia-uso", dimension: "analitica", section: "Analítica e IA",
    text: "¿Han usado inteligencia artificial en el trabajo (ChatGPT, Gemini, Copilot u otras)?",
    options: ["Nunca", "Algunas personas, con versiones gratuitas y cuentas personales", "Herramientas aprobadas con cuentas de la empresa, o un piloto", "Modelos o asistentes de IA funcionando en la operación"],
    finding: "No hay experiencia con IA en la empresa: conviene empezar con casos de uso acotados y de retorno rápido.",
  },
  {
    id: "ia-reglas", dimension: "analitica", section: "Analítica e IA",
    text: "¿Qué reglas tienen sobre qué información de la empresa o de los clientes se puede poner en esas herramientas?",
    options: ["Ninguna; no sabemos con qué información se usan", "Indicaciones verbales sobre lo que no se debe poner", "Una política escrita de uso de IA, conocida por el equipo", "Política escrita y solo herramientas aprobadas tras revisar qué hacen con los datos"],
    consultantNote: "Solo aparece si ya usan IA. Relacione con la Ley 1581 de 2012 de protección de datos personales.",
    finding: "Se usa IA sin reglas: datos de clientes o de la empresa pueden terminar en herramientas externas.",
    showIf: usesAi,
  },
  {
    id: "equipo-responsable", dimension: "equipo", section: "Equipo",
    text: "¿Quién se encarga de que la información de la empresa esté correcta y al día?",
    options: ["Nadie en particular", "El dueño o alguien en sus ratos libres", "Una persona de sistemas o un analista", "Un equipo de datos, con responsables y reglas"],
    finding: "No hay un responsable de los datos: nadie responde por su calidad ni por su uso.",
  },
  {
    id: "equipo-lider", dimension: "equipo", section: "Equipo",
    text: "Si la empresa decide implementar un uso de IA, ¿quién lo lideraría?",
    options: ["No hay quién", "Alguien interesado, en el tiempo que le quede libre", "Una persona designada, con tiempo asignado", "Un equipo pequeño de las áreas involucradas, con apoyo de la gerencia"],
    finding: "No hay quién lidere la adopción de IA: las iniciativas se quedan en esfuerzos individuales.",
  },
  {
    id: "estrategia-gerencia", dimension: "estrategia", section: "Estrategia",
    text: "¿Qué papel tiene la gerencia o los dueños frente al uso de datos e IA?",
    options: ["No ha sido un tema de conversación", "Muestra interés, pero no ha tomado decisiones", "Aprobó explorarlo y designó a un responsable", "Hace parte del plan de la empresa y se le hace seguimiento"],
    finding: "La dirección no ha tomado decisiones sobre datos e IA: sin ese respaldo, todo queda en iniciativas sueltas.",
  },
  {
    id: "estrategia-presupuesto", dimension: "estrategia", section: "Estrategia",
    text: "¿Tienen presupuesto o disposición para invertir en datos este año?",
    options: ["Por ahora no", "Algo, si se ve el retorno", "Sí, un presupuesto moderado", "Sí, es una prioridad estratégica"],
    finding: "No hay presupuesto definido: conviene arrancar con proyectos pequeños que se paguen solos.",
  },
];

export const COURSES: { title: string; hours: number; mode: string; levels: ("alto" | "moderado" | "bajo")[] }[] = [
  { title: "Fundamentos de datos para empresas", hours: 16, mode: "Presencial o virtual", levels: ["alto"] },
  { title: "Excel profesional y bases de datos", hours: 24, mode: "Virtual", levels: ["alto", "moderado"] },
  { title: "Indicadores para la toma de decisiones", hours: 12, mode: "Presencial", levels: ["alto", "moderado"] },
  { title: "Visualización y tableros con Power BI", hours: 32, mode: "Virtual", levels: ["moderado"] },
  { title: "Gobierno y calidad de datos", hours: 16, mode: "Virtual", levels: ["moderado"] },
  { title: "SQL para análisis de datos", hours: 24, mode: "Virtual", levels: ["moderado", "bajo"] },
  { title: "Python para ciencia de datos", hours: 40, mode: "Virtual", levels: ["moderado", "bajo"] },
  { title: "Machine learning aplicado a negocios", hours: 40, mode: "Virtual con proyecto", levels: ["bajo"] },
  { title: "IA generativa para la productividad empresarial", hours: 12, mode: "Presencial o virtual", levels: ["alto", "moderado", "bajo"] },
];

export const ROUTES: Record<"alto" | "moderado" | "bajo", { when: string; title: string }[]> = {
  alto: [
    { when: "Mes 1 a 3", title: "Dejar de anotar en papel" },
    { when: "Mes 4 a 6", title: "Medir lo esencial: ventas, inventario y caja" },
    { when: "Mes 7 a 12", title: "Decidir con esos números" },
  ],
  moderado: [
    { when: "Mes 1 a 2", title: "Juntar la información en un solo lugar" },
    { when: "Mes 3 a 5", title: "Ver los números del negocio cada semana" },
    { when: "Mes 6 a 12", title: "Primer pronóstico de ventas" },
  ],
  bajo: [
    { when: "Mes 1 a 2", title: "Elegir el uso de IA que más ahorra" },
    { when: "Mes 3 a 6", title: "La IA funcionando en el día a día" },
    { when: "Mes 7 a 12", title: "Extenderlo a otras áreas, con reglas claras" },
  ],
};

export const LEVELS: Record<"alto" | "moderado" | "bajo", { label: string; icon: string; reading: string; focus: string }> = {
  alto: { label: "Riesgo alto", icon: "●", reading: "Todavía sin datos para decidir", focus: "Ordenar lo básico: registrar todo y no perder la información" },
  moderado: { label: "Riesgo moderado", icon: "◆", reading: "Con datos, pero dispersos", focus: "Juntar la información y ver los números del negocio cada semana" },
  bajo: { label: "Riesgo bajo", icon: "▲", reading: "Lista para usar IA", focus: "Pronósticos e IA en el día a día" },
};

/** Ejemplos para tablas y demostraciones: 3 productos o servicios y 2 clientes por industria. */
export const SAMPLES: Record<IndustryId, { items: [string, string, string]; customers: [string, string] }> = {
  moda: { items: ["Camisa M azul", "Jean 32", "Chaqueta S negra"], customers: ["Almacén La 10", "Laura Gómez"] },
  alimentos: { items: ["Almojábana", "Pan de yuca", "Torta de cuajada"], customers: ["Cafetería El Puente", "Marta Rojas"] },
  comercio: { items: ["Arroz 500 g", "Aceite 1 L", "Café 250 g"], customers: ["Tienda Don Luis", "Carlos Pérez"] },
  salud: { items: ["Consulta general", "Control odontológico", "Examen de sangre"], customers: ["Ana Torres", "Jorge Niño"] },
  manufactura: { items: ["Soporte B-40", "Pieza A-120", "Lámina C-8"], customers: ["Metálicas del Norte", "Ferretería Central"] },
  transporte: { items: ["Envío Tunja–Bogotá", "Envío Duitama", "Envío Sogamoso"], customers: ["Distribuidora Andina", "Lácteos El Valle"] },
  agro: { items: ["Papa pastusa", "Café pergamino", "Arveja"], customers: ["Acopio La Vega", "Cooperativa del Valle"] },
  pecuaria: { items: ["Leche cruda", "Novillo gordo", "Queso campesino"], customers: ["Lácteos El Roble", "Carnes Andinas"] },
  servicios: { items: ["Asesoría contable", "Declaración de renta", "Auditoría"], customers: ["Comercial Boyacá SAS", "Pedro Castro"] },
  turismo: { items: ["Habitación doble", "Suite", "Plan fin de semana"], customers: ["Familia Moreno", "Agencia Viajes Sol"] },
  mineria: { items: ["Carbón térmico", "Carbón coquizable", "Coque"], customers: ["Acerías Paz del Río", "Coquizadora del Norte"] },
  construccion: { items: ["Cemento 50 kg", "Varilla 1/2\"", "Bloque #5"], customers: ["Obra Torres del Lago", "Juan Becerra"] },
  madera: { items: ["Tabla de pino", "Viga 4×4", "Puerta en cedro"], customers: ["Obra Los Pinos", "Muebles del Alto"] },
  otra: { items: ["Producto A", "Producto B", "Servicio C"], customers: ["Cliente Uno", "Cliente Dos"] },
};

/* ----------------------- Acompañamiento por horas ----------------------- */

export type PlanId = "arranque" | "orden" | "crecer";

/**
 * Monitorías en la empresa: el equipo monta la solución en el sistema de la
 * empresa y la deja funcionando. Las horas se estiman por fases en effort.ts
 * según el tamaño y cómo están hoy los datos; los costos, en pricing.ts.
 */
export const PLANS: Record<PlanId, { name: string; promise: string; includes: string[] }> = {
  arranque: {
    name: "Plan Arranque",
    promise: "Se lo dejamos funcionando en su propio celular. Usted no tiene que aprender a programar nada.",
    includes: [
      "Una visita para ver cómo trabaja hoy, sin cambiarle nada",
      "Montamos la solución a su problema central y los primeros pasos",
      "Le mostramos cómo usarla con su propio celular, las veces que haga falta",
      "Volvemos a la semana para resolver dudas y ajustar",
    ],
  },
  orden: {
    name: "Plan Orden",
    promise: "Ventas, clientes e inventario en un solo lugar, con un tablero que se actualiza solo.",
    includes: [
      "Unificamos la información que hoy está en cuadernos, chats y archivos",
      "Dejamos un tablero con 3 a 5 indicadores y su meta",
      "Copias de seguridad automáticas y accesos por persona",
      "Acompañamos al encargado hasta que lo use sin ayuda",
    ],
  },
  crecer: {
    name: "Plan Crecer con IA",
    promise: "Su primer uso de inteligencia artificial funcionando en la operación, con resultados medidos.",
    includes: [
      "Elegimos con usted el caso de IA de mayor retorno",
      "Lo implementamos en sus sistemas y automatizamos los reportes",
      "Reglas de uso de IA y de datos personales (Ley 1581)",
      "Medimos el antes y el después",
    ],
  },
};
