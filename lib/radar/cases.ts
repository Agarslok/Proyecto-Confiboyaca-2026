import type { CaseItem, IndustryId, LevelId, LinkId, RadarGoalId } from "@/lib/radar/types";

/* ============================================================================
   Biblioteca de casos hipotéticos: los 60 de la sección 6 del esquema, más
   4 de minería y construcción, que se agregaron en esta rama.
   Los objetivos de cada caso (goals) no estaban en el esquema: se asignaron
   aquí para poder aplicar el +10 por objetivo coincidente.
   ========================================================================== */

type Row = [title: string, technique: string, indicator: string, better: "menor" | "mayor", goals: RadarGoalId[]];

function transversal(level: LevelId, rows: Row[]): CaseItem[] {
  return rows.map(([title, technique, indicator, better, goals], i) => ({
    id: `t-${level}-${i}`, title, kind: "transversal", appliesTo: "todas", levels: [level], technique, indicator, better, goals,
  }));
}

function byLink(level: LevelId, link: LinkId, rows: Row[]): CaseItem[] {
  return rows.map(([title, technique, indicator, better, goals], i) => ({
    id: `e-${level}-${link}-${i}`, title, kind: "eslabon", appliesTo: link, levels: [level], technique, indicator, better, goals,
  }));
}

/** Cada caso de industria aplica a dos niveles: [alto, moderado] o [moderado, bajo]. */
function byIndustry(industry: IndustryId, basic: Row, advanced: Row): CaseItem[] {
  return [
    { row: basic, levels: ["alto", "moderado"] as LevelId[], tag: "b" },
    { row: advanced, levels: ["moderado", "bajo"] as LevelId[], tag: "a" },
  ].map(({ row: [title, technique, indicator, better, goals], levels, tag }) => ({
    id: `i-${industry}-${tag}`, title, kind: "industria", appliesTo: industry, levels, technique, indicator, better, goals,
  }));
}

export const CASES: CaseItem[] = [
  ...transversal("alto", [
    ["Información dispersa en papel, chats y memoria", "Modelo de datos relacional · formularios digitales · hoja maestra", "Días para cerrar el mes", "menor", ["automatizar"]],
    ["Duplicados y errores de digitación", "Limpieza de datos · llaves únicas · validación en captura", "Registros con errores", "menor", ["costos", "automatizar"]],
    ["El negocio depende de una sola persona", "Gobierno de datos básico · diccionario de datos · roles", "Horas semanales en tareas manuales", "menor", ["automatizar"]],
    ["Riesgo de perder toda la información", "Almacenamiento en la nube · copias de seguridad · permisos", "Probabilidad anual de pérdida de datos", "menor", ["costos"]],
    ["Precios fijados sin conocer el costo real", "Costeo por producto · análisis de Pareto · tablero de márgenes", "Margen bruto", "mayor", ["vender", "costos"]],
    ["Decisiones sin indicadores", "Mapa de KPI · tablero en Looker Studio o Excel", "Decisiones soportadas en datos", "mayor", ["nose", "vender"]],
  ]),
  ...byLink("alto", "produccion", [
    ["Producción «al ojo»: sobrantes y faltantes", "Registro estructurado · promedios móviles por día", "Merma sobre producción", "menor", ["costos", "demanda"]],
    ["Insumos que se agotan o se vencen", "Inventario mínimo-máximo · PEPS / FEFO", "Pérdida por insumos vencidos", "menor", ["costos"]],
  ]),
  ...byLink("alto", "comercial", [
    ["No se sabe qué se vende más", "Punto de venta · análisis ABC", "Agotados de productos estrella", "menor", ["vender", "demanda"]],
    ["Clientes anónimos", "CRM básico · política de datos personales · mensajería", "Clientes que vuelven a comprar", "mayor", ["clientes", "vender"]],
  ]),
  ...byLink("alto", "logistica", [
    ["Rutas armadas a mano", "Planilla digital · georreferenciación", "Costo por entrega", "menor", ["costos"]],
    ["Pedidos sin trazabilidad", "Trazabilidad por estados · notificaciones automáticas", "Reclamos por pedidos", "menor", ["clientes", "automatizar"]],
  ]),
  ...byLink("alto", "servicio", [
    ["Quejas que se pierden en WhatsApp", "Mesa de ayuda · categorización de solicitudes", "Tiempo de respuesta", "menor", ["clientes", "automatizar"]],
    ["La satisfacción no se mide", "Net Promoter Score · encuestas automáticas", "NPS", "mayor", ["clientes"]],
  ]),
  ...transversal("moderado", [
    ["Reportes que tardan días en Excel", "ETL con Power Query · Power BI · actualización programada", "Horas al mes armando reportes", "menor", ["automatizar"]],
    ["Cada área tiene su propia verdad", "Bodega de datos ligera · capa semántica · glosario de KPI", "Diferencia entre reportes de áreas", "menor", ["automatizar", "nose"]],
    ["Las caídas en ventas se detectan tarde", "Tableros · alertas por umbral · control estadístico", "Días para detectar una caída", "menor", ["vender"]],
    ["Todos los clientes reciben el mismo trato", "Análisis RFM · clustering k-means", "Tasa de recompra", "mayor", ["clientes", "vender"]],
    ["Calidad de datos irregular", "Perfilamiento de datos · reglas de calidad · monitoreo", "Completitud de datos clave", "mayor", ["automatizar"]],
    ["Presupuesto sin seguimiento", "Modelo financiero · Power BI · análisis de variaciones", "Desviación del presupuesto", "menor", ["costos"]],
  ]),
  ...byLink("moderado", "produccion", [
    ["Paros y cuellos de botella invisibles", "OEE · Pareto de paros · tablero de producción", "Eficiencia (OEE)", "mayor", ["costos"]],
    ["Plan de producción desconectado de ventas", "S&OP · suavizamiento exponencial", "Exactitud del plan", "mayor", ["demanda"]],
  ]),
  ...byLink("moderado", "comercial", [
    ["Capital inmovilizado en inventario", "Análisis de rotación · ABC/XYZ", "Días de inventario", "menor", ["costos", "demanda"]],
    ["Promociones sin medir el resultado", "Análisis antes/después · grupos de control", "Retorno de las promociones", "mayor", ["vender"]],
  ]),
  ...byLink("moderado", "logistica", [
    ["Flota sin indicadores", "Integración de datos de telemetría · Power BI", "Entregas a tiempo", "mayor", ["costos", "clientes"]],
    ["Bodega sin orden por rotación", "Slotting ABC · mapas de calor de alistamiento", "Tiempo de alistamiento por pedido", "menor", ["costos"]],
  ]),
  ...byLink("moderado", "servicio", [
    ["Clientes que se van sin avisar", "Análisis de cohortes · embudo de retención", "Abandono mensual (churn)", "menor", ["clientes"]],
    ["Capacidad mal dimensionada", "Mapas de calor de demanda · programación de turnos", "Tiempo de espera promedio", "menor", ["demanda", "costos"]],
  ]),
  ...transversal("bajo", [
    ["Pronóstico de demanda con machine learning", "Gradient boosting · Prophet · variables de calendario", "Error de pronóstico (MAPE)", "menor", ["demanda"]],
    ["Predicción de abandono de clientes", "Clasificación (XGBoost) · scoring mensual", "Clientes perdidos por mes", "menor", ["clientes"]],
    ["Precios basados en elasticidad", "Modelos de elasticidad · optimización de precios", "Margen bruto", "mayor", ["vender"]],
    ["Asistente de IA generativa para atención", "IA generativa · RAG · WhatsApp Business API", "Consultas resueltas sin intervención", "mayor", ["automatizar", "clientes"]],
    ["Recomendaciones personalizadas", "Filtrado colaborativo · reglas de asociación", "Ticket promedio", "mayor", ["vender", "clientes"]],
    ["Detección de anomalías y fraude", "Isolation Forest · alertas automáticas", "Pérdidas por anomalías", "menor", ["costos"]],
  ]),
  ...byLink("bajo", "produccion", [
    ["Mantenimiento predictivo", "Análisis de supervivencia · IoT · clasificación", "Horas de paro no planificado", "menor", ["costos"]],
    ["Control de calidad con visión artificial", "Visión por computador · redes neuronales convolucionales", "Defectos que llegan al cliente", "menor", ["costos", "automatizar"]],
  ]),
  ...byLink("bajo", "comercial", [
    ["Reabastecimiento automático", "Pronóstico jerárquico · optimización de inventarios", "Agotados", "menor", ["demanda", "automatizar"]],
    ["Priorización de prospectos (lead scoring)", "Regresión logística · árboles de decisión", "Tasa de conversión", "mayor", ["vender"]],
  ]),
  ...byLink("bajo", "logistica", [
    ["Optimización de rutas", "Problema de ruteo de vehículos (VRP) · OR-Tools", "Kilómetros por entrega", "menor", ["costos"]],
    ["Hora de llegada predictiva", "Regresión con datos de GPS y tráfico", "Entregas tardías o fallidas", "menor", ["clientes"]],
  ]),
  ...byLink("bajo", "servicio", [
    ["Análisis de sentimiento de opiniones", "Procesamiento de lenguaje natural · modelos de lenguaje", "Días para detectar un problema recurrente", "menor", ["clientes"]],
    ["Agenda y personal según la demanda prevista", "Series de tiempo · optimización de turnos", "Costo de personal por servicio", "menor", ["demanda", "costos"]],
  ]),
  ...byIndustry("moda",
    ["Tallas y colores que no rotan", "Curva de tallas · ABC por referencia", "Prendas que terminan en liquidación", "menor", ["costos", "demanda"]],
    ["Pronóstico de tendencias por temporada", "Machine learning · Google Trends · datos de e-commerce", "Venta a precio completo", "mayor", ["vender", "demanda"]]),
  ...byIndustry("alimentos",
    ["Producto que sobra al cierre", "Promedios por día de la semana · tablero de merma", "Merma diaria", "menor", ["costos", "demanda"]],
    ["Pronóstico por clima, festivos y quincena", "Gradient boosting · variables de calendario y clima", "Ventas perdidas por agotados", "menor", ["demanda", "vender"]]),
  ...byIndustry("comercio",
    ["Surtido igual en todas las tiendas", "Análisis de surtido · ventas por m²", "Ventas por m²", "mayor", ["vender"]],
    ["Canasta de mercado y venta cruzada", "Reglas de asociación (Apriori)", "Productos por tiquete", "mayor", ["vender", "clientes"]]),
  ...byIndustry("salud",
    ["Inasistencia a citas", "Tablero de inasistencia · recordatorios automáticos", "Inasistencia a citas", "menor", ["clientes", "automatizar"]],
    ["Identificación temprana de pacientes en riesgo", "Modelos de clasificación · anonimización de datos", "Reingresos a 30 días", "menor", ["clientes"]]),
  ...byIndustry("manufactura",
    ["Costos de producción sin desagregar", "Costeo por órdenes · análisis de variaciones", "Variación costo real vs. estándar", "menor", ["costos"]],
    ["Consumo de energía optimizado", "IoT · modelos de regresión · optimización", "Energía por unidad producida", "menor", ["costos"]]),
  ...byIndustry("transporte",
    ["Viajes de regreso vacíos", "Tablero de ocupación · análisis origen-destino", "Kilómetros recorridos en vacío", "menor", ["costos", "vender"]],
    ["Combustible y hábitos de conducción", "Telemetría · machine learning de patrones", "Combustible por 100 km", "menor", ["costos"]]),
  ...byIndustry("agro",
    ["Rendimiento por lote sin registro", "Aplicación de campo · tablero por lote", "Variación de rendimiento sin explicar", "menor", ["costos"]],
    ["Agricultura de precisión", "Imágenes satelitales · NDVI · modelos predictivos", "Insumos por tonelada (índice)", "menor", ["costos", "demanda"]]),
  ...byIndustry("servicios",
    ["Proyectos que pierden dinero", "Registro de tiempos · rentabilidad por proyecto", "Rentabilidad por proyecto", "mayor", ["costos", "vender"]],
    ["Propuestas e informes con IA generativa", "Modelos de lenguaje · plantillas · base de conocimiento", "Horas por propuesta", "menor", ["automatizar"]]),
  ...byIndustry("mineria",
    ["Accidentes que se repiten sin registro", "Registro digital de incidentes · análisis de causas · Pareto", "Incidentes por cada 1.000 turnos", "menor", ["costos"]],
    ["Predicción de la calidad del mineral", "Modelos de regresión con análisis de laboratorio · muestreo por frente", "Castigos de precio por calidad", "menor", ["vender", "costos"]]),
  ...byIndustry("construccion",
    ["Obras que se pasan del presupuesto", "Control de avance · curva S · presupuesto vs. real", "Sobrecosto sobre el presupuesto", "menor", ["costos"]],
    ["Pronóstico de sobrecostos y retrasos", "Modelos de regresión con el histórico de obras · alertas", "Obras entregadas a tiempo", "mayor", ["costos", "demanda"]]),
  ...byIndustry("turismo",
    ["Comisiones sin control por canal", "Tablero de ocupación · ADR · RevPAR", "Comisiones a intermediarios", "menor", ["costos", "vender"]],
    ["Tarifas dinámicas (revenue management)", "Pronóstico de ocupación · optimización tarifaria", "RevPAR", "mayor", ["vender", "demanda"]]),
];
