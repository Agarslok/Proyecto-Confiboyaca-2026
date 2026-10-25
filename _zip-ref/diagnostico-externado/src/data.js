/* =========================================================
   1. PREGUNTAS DEL DIAGNÓSTICO
   ========================================================= */
export const SECTORS = [
  { id: 'metalurgia', label: 'Metalurgia' },
  { id: 'automocion', label: 'Automoción' },
  { id: 'mineria', label: 'Minería' },
  { id: 'agroindustria', label: 'Agroindustria' },
  { id: 'cemento', label: 'Cemento y materiales de construcción' },
  { id: 'salud', label: 'Salud' },
  { id: 'gastronomia', label: 'Gastronomía' },
  { id: 'turismo', label: 'Turismo' },
  { id: 'educacion', label: 'Educación' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'otro', label: 'Otro' },
];

export const CHALLENGES = [
  { id: 'captacion', label: 'Captación de clientes', hint: 'Atraer prospectos y convertirlos en clientes' },
  { id: 'seguimiento', label: 'Seguimiento comercial', hint: 'Dar continuidad a cotizaciones y clientes' },
  { id: 'administrativos', label: 'Procesos administrativos', hint: 'Facturas, documentos y aprobaciones' },
  { id: 'inventario', label: 'Gestión de inventario', hint: 'Existencias, compras y reposición' },
  { id: 'agenda', label: 'Organización de tareas y agendas', hint: 'Responsables, plazos y reuniones' },
  { id: 'analisis', label: 'Análisis de información', hint: 'Reportes e indicadores para decidir' },
  { id: 'otro', label: 'Otro', hint: 'Un desafío distinto a los anteriores' },
];

export const HOURS = [
  { id: 'menos5', label: 'Menos de 5 horas', hint: 'Una parte menor de la semana' },
  { id: '5a10', label: 'Entre 5 y 10 horas', hint: 'Cerca de una jornada completa' },
  { id: 'mas10', label: 'Más de 10 horas', hint: 'Más de una jornada a la semana' },
  { id: 'nose', label: 'No lo sabemos', hint: 'Lo medimos como primer paso' },
];

export const GOALS = [
  { id: 'tiempo', label: 'Ahorrar tiempo', hint: 'Menos pasos manuales y esperas' },
  { id: 'errores', label: 'Reducir errores', hint: 'Datos consistentes y verificados' },
  { id: 'ventas', label: 'Mejorar las ventas', hint: 'Más oportunidades bien atendidas' },
  { id: 'informacion', label: 'Organizar mejor la información', hint: 'Todo en un solo lugar' },
  { id: 'decisiones', label: 'Tomar mejores decisiones', hint: 'Indicadores claros y a tiempo' },
];

export const STEPS = [
  { id: 'company', short: 'Empresa', type: 'text' },
  { id: 'sector', short: 'Sector', type: 'choice', options: SECTORS, otherKey: 'sectorOther', compact: true },
  { id: 'challenge', short: 'Desafío', type: 'choice', options: CHALLENGES, otherKey: 'challengeOther' },
  { id: 'hours', short: 'Tiempo', type: 'choice', options: HOURS },
  { id: 'goal', short: 'Objetivo', type: 'choice', options: GOALS },
];

export const EMPTY_ANSWERS = { company: '', sector: '', sectorOther: '', challenge: '', challengeOther: '', hours: '', goal: '' };

export const labelOf = (list, id) => (list.find((o) => o.id === id) || {}).label || '';
export const companyOr = (a) => (a.company || '').trim() || 'tu empresa';

export function stepCopy(step, a) {
  const c = companyOr(a);
  const ch = a.challenge === 'otro'
    ? 'ese proceso'
    : (labelOf(CHALLENGES, a.challenge) || 'ese proceso').toLowerCase();
  switch (step) {
    case 0: return { title: '¿Cómo se llama tu empresa?', help: 'Usaremos el nombre para personalizar la propuesta. No se guarda en ningún servidor.' };
    case 1: return { title: `¿A qué sector pertenece ${c}?`, help: 'El sector ajusta el contexto de la propuesta y los ejemplos de la demostración.' };
    case 2: return { title: `¿Cuál es el principal desafío de ${c}?`, help: 'Elige el que más limita el crecimiento hoy. Podrás cambiarlo después.' };
    case 3: return { title: `¿Cuánto tiempo dedican a ${ch} cada semana?`, help: 'Una estimación aproximada es suficiente.' };
    case 4: return { title: `¿Qué resultado le gustaría conseguir a ${c}?`, help: 'Define el enfoque de la solución recomendada.' };
    default: return { title: '', help: '' };
  }
}

/* =========================================================
   2. REGLAS DEL DIAGNÓSTICO (deterministas, locales)
   ========================================================= */
export const SECTOR_CONTEXT = {
  metalurgia: 'En metalurgia, la planeación de materias primas y los tiempos de producción pesan mucho sobre el margen.',
  automocion: 'En automoción, la coordinación entre repuestos, servicio y clientes define buena parte de la experiencia.',
  mineria: 'En minería, la continuidad operativa y la trazabilidad de insumos y equipos son críticas.',
  agroindustria: 'En agroindustria, la estacionalidad y el manejo de perecederos hacen que la información oportuna sea decisiva.',
  cemento: 'En cemento y materiales de construcción, los volúmenes altos y la logística de entrega afectan directamente los costos.',
  salud: 'En salud, la precisión de los registros y la oportunidad en la atención son prioritarias.',
  gastronomia: 'En gastronomía, la rotación de insumos y la atención en horas pico condicionan la rentabilidad.',
  turismo: 'En turismo, la demanda cambia por temporada y la rapidez de respuesta influye en cada reserva.',
  educacion: 'En educación, la gestión de estudiantes, horarios y comunicaciones genera muchas tareas recurrentes.',
  tecnologia: 'En tecnología, la velocidad de entrega y el seguimiento de clientes recurrentes marcan la diferencia.',
  otro: 'Como el sector no está entre los listados, las referencias sectoriales de esta propuesta deben validarse.',
};

export const HOURS_RULES = {
  menos5: { level: 'Moderada', bars: 1, note: 'Con menos de 5 horas semanales, conviene empezar con una mejora puntual y de bajo costo.' },
  '5a10': { level: 'Media', bars: 2, note: 'Entre 5 y 10 horas semanales es un volumen que justifica automatizar una parte del proceso.' },
  mas10: { level: 'Alta', bars: 3, note: 'Con más de 10 horas semanales, este proceso es candidato prioritario para automatizar.' },
  nose: { level: 'Por medir', bars: 0, note: 'Como aún no se mide el tiempo dedicado, el primer paso es registrarlo durante dos semanas.' },
};

export const GOAL_RULES = {
  tiempo: { focus: 'eliminar pasos repetitivos y tiempos de espera', benefit: 'Tiempo liberado para tareas de mayor valor' },
  errores: { focus: 'validaciones automáticas y un registro único que evite duplicados', benefit: 'Menor riesgo de errores de digitación y duplicados' },
  ventas: { focus: 'las acciones con más posibilidad de generar ingresos', benefit: 'Más oportunidades comerciales atendidas a tiempo' },
  informacion: { focus: 'una estructura de datos ordenada y fácil de consultar', benefit: 'Información centralizada y fácil de encontrar' },
  decisiones: { focus: 'indicadores claros y lecturas que expliquen qué cambió', benefit: 'Decisiones apoyadas en datos actualizados' },
};

export const CHALLENGE_RULES = {
  captacion: {
    summary: (c) => `Las respuestas indican que ${c} dedica esfuerzo a atraer clientes nuevos, pero sin una forma clara de saber qué canales generan los mejores prospectos.`,
    opportunity: 'Reunir todos los contactos entrantes en un solo registro y clasificarlos según su probabilidad de compra, para concentrar el esfuerzo comercial donde hay más interés.',
    solutionTitle: 'Registro único de prospectos con calificación asistida por IA',
    solutionText: 'Un formulario y un tablero que centralizan los contactos de todos los canales. Un modelo sencillo asigna a cada prospecto una calificación según su origen y su interacción, y sugiere a quién contactar primero.',
    steps: [
      ['Unificar el origen de los contactos', 'Inventariar los canales actuales (redes, referidos, web, ferias) y llevarlos a un formato común.'],
      ['Definir criterios de calificación', 'Acordar con el equipo comercial qué señales indican interés real y usarlas para puntuar.'],
      ['Automatizar la priorización', 'Activar alertas para responder primero a los prospectos mejor calificados y medir la conversión por canal.'],
    ],
    benefits: ['Visibilidad del rendimiento de cada canal', 'Respuesta más rápida a prospectos con interés', 'Menos contactos olvidados', 'Base para decidir dónde invertir en marketing'],
    demo: 'pipeline', demoMode: 'leads', demoName: 'Prospectos priorizados',
  },
  seguimiento: {
    summary: (c) => `${c} tiene oportunidades comerciales en curso, pero el seguimiento parece depender de la memoria o de hojas sueltas, así que algunas cotizaciones pueden quedarse sin respuesta.`,
    opportunity: 'Ordenar la cartera por prioridad y programar el siguiente contacto con cada cliente, para que ninguna oportunidad se enfríe.',
    solutionTitle: 'Tablero de seguimiento con priorización automática',
    solutionText: 'Un tablero que reúne clientes y cotizaciones, calcula una prioridad según el valor estimado, la etapa y los días sin contacto, y recuerda la próxima acción a cada responsable.',
    steps: [
      ['Consolidar la cartera', 'Reunir en un solo lugar clientes activos, cotizaciones abiertas y la fecha del último contacto.'],
      ['Establecer reglas de prioridad', 'Combinar valor de la oportunidad, etapa comercial y días sin respuesta en una calificación simple.'],
      ['Programar recordatorios', 'Generar alertas automáticas de seguimiento y revisar cada semana las oportunidades estancadas.'],
    ],
    benefits: ['Menos oportunidades perdidas por falta de seguimiento', 'Claridad sobre qué cliente atender primero', 'Historial comercial compartido por el equipo', 'Mejor lectura del embudo de ventas'],
    demo: 'pipeline', demoMode: 'clients', demoName: 'Cartera priorizada',
  },
  administrativos: {
    summary: (c) => `En ${c}, las tareas administrativas parecen consumir tiempo que podría dedicarse al negocio. Es común que documentos, aprobaciones y registros se repitan a mano.`,
    opportunity: 'Identificar las tareas repetitivas y automatizar las que siguen reglas fijas, como la captura de datos de facturas o el envío de recordatorios de pago.',
    solutionTitle: 'Flujo administrativo con tareas priorizadas y extracción de datos',
    solutionText: 'Un tablero de tareas con responsables y prioridades, más automatizaciones que extraen con IA los datos de los documentos y los llevan al registro que corresponde.',
    steps: [
      ['Mapear el proceso actual', 'Listar las tareas administrativas, quién las hace y cuántas veces se repiten cada semana.'],
      ['Elegir qué automatizar', 'Priorizar las tareas con reglas claras y alto volumen, como el registro de facturas o las conciliaciones.'],
      ['Implementar y medir', 'Poner en marcha un piloto, registrar el tiempo antes y después, y ajustar.'],
    ],
    benefits: ['Menos digitación manual', 'Menor riesgo de errores de digitación y duplicados', 'Trazabilidad de cada tarea', 'Tiempo liberado para tareas de mayor valor'],
    demo: 'tasks', demoMode: 'admin', demoName: 'Tablero administrativo',
  },
  inventario: {
    summary: (c) => `${c} necesita saber con precisión qué tiene disponible. Sin un control al día aparecen faltantes o compras de más que inmovilizan capital.`,
    opportunity: 'Llevar un registro actualizado de existencias con un nivel mínimo por producto y alertas de reposición basadas en el consumo.',
    solutionTitle: 'Control de inventario con alertas y pronóstico de demanda',
    solutionText: 'Una tabla de existencias que compara cada producto con su nivel mínimo, señala los que requieren reposición y estima cuántas semanas de cobertura quedan según el consumo.',
    steps: [
      ['Depurar el catálogo', 'Unificar referencias, unidades de medida y existencias actuales en una sola base.'],
      ['Definir niveles mínimos', 'Calcular el punto de reposición de cada producto según su consumo y el tiempo de entrega del proveedor.'],
      ['Activar alertas y pronóstico', 'Configurar avisos automáticos y revisar cada mes qué tan acertado fue el pronóstico.'],
    ],
    benefits: ['Menos faltantes de producto', 'Compras planificadas en lugar de urgentes', 'Menos capital inmovilizado en inventario', 'Información confiable para negociar con proveedores'],
    demo: 'inventory', demoMode: 'inventory', demoName: 'Control de existencias',
  },
  agenda: {
    summary: (c) => `En ${c}, la coordinación de tareas, plazos y reuniones parece depender de mensajes dispersos, lo que dificulta saber quién hace qué y para cuándo.`,
    opportunity: 'Concentrar las tareas en un tablero compartido con responsables, fechas y prioridades, y automatizar los recordatorios.',
    solutionTitle: 'Tablero de tareas y agenda con priorización asistida',
    solutionText: 'Un espacio común donde cada tarea tiene responsable, fecha y prioridad. Un asistente sugiere el orden de trabajo según urgencia e importancia.',
    steps: [
      ['Reunir los pendientes', 'Trasladar tareas y compromisos dispersos a un solo tablero compartido.'],
      ['Acordar prioridades', 'Clasificar por urgencia e importancia y asignar un responsable a cada tarea.'],
      ['Automatizar recordatorios', 'Programar avisos antes de cada vencimiento y una revisión semanal corta del tablero.'],
    ],
    benefits: ['Claridad sobre responsables y plazos', 'Menos tareas olvidadas', 'Reuniones de seguimiento más cortas', 'Carga de trabajo visible para todo el equipo'],
    demo: 'tasks', demoMode: 'agenda', demoName: 'Tablero de tareas',
  },
  analisis: {
    summary: (c) => `${c} genera información en su operación, pero convertirla en decisiones toma tiempo: los reportes se arman a mano y llegan tarde.`,
    opportunity: 'Definir pocos indicadores clave y construir un tablero que se actualice solo, con lecturas en lenguaje natural generadas por IA.',
    solutionTitle: 'Tablero de indicadores con lectura asistida por IA',
    solutionText: 'Un tablero con los indicadores que importan, alimentado desde las fuentes de datos de la empresa, que resume tendencias y señala variaciones inusuales.',
    steps: [
      ['Definir las preguntas clave', 'Acordar qué decisiones debe apoyar el tablero y qué indicadores las responden.'],
      ['Conectar y limpiar los datos', 'Identificar las fuentes, unificar formatos y automatizar la carga.'],
      ['Publicar y revisar', 'Poner el tablero en uso, recoger comentarios del equipo y ajustar los indicadores.'],
    ],
    benefits: ['Reportes disponibles sin armarlos a mano', 'Decisiones apoyadas en datos actualizados', 'Detección temprana de variaciones', 'Un lenguaje común de indicadores en el equipo'],
    demo: 'analytics', demoMode: 'analytics', demoName: 'Tablero de indicadores',
  },
  otro: {
    summary: (c) => `${c} enfrenta un desafío que no encaja en las categorías de este diagnóstico. Por eso esta propuesta es general y necesita validarse en una conversación con el equipo.`,
    opportunity: 'Medir el proceso afectado, identificar sus pasos repetitivos y evaluar qué parte puede apoyarse con datos o automatización.',
    solutionTitle: 'Levantamiento del proceso y piloto de mejora',
    solutionText: 'Una sesión para entender el proceso, seguida de un tablero básico de indicadores y un piloto de automatización en la tarea de mayor impacto.',
    steps: [
      ['Levantar el proceso', 'Describir paso a paso cómo se hace hoy, quién participa y dónde se generan demoras.'],
      ['Medir la línea base', 'Registrar tiempos, volúmenes y errores durante dos semanas para dimensionar el problema.'],
      ['Diseñar un piloto', 'Elegir la tarea con más impacto y probar una mejora con datos o automatización.'],
    ],
    benefits: ['Comprensión clara del problema antes de invertir', 'Línea base para comparar resultados', 'Riesgo bajo al empezar con un piloto', 'Información centralizada y fácil de encontrar'],
    demo: 'analytics', demoMode: 'analytics', demoName: 'Tablero de indicadores',
  },
};

export function buildDiagnosis(a) {
  const company = a.company.trim();
  const rule = CHALLENGE_RULES[a.challenge] || CHALLENGE_RULES.otro;
  const hours = HOURS_RULES[a.hours] || HOURS_RULES.nose;
  const goal = GOAL_RULES[a.goal] || GOAL_RULES.tiempo;
  const sectorLabel = a.sector === 'otro' ? (a.sectorOther.trim() || 'Otro sector') : labelOf(SECTORS, a.sector);
  const problemLabel = a.challenge === 'otro' ? (a.challengeOther.trim() || 'Desafío por definir') : labelOf(CHALLENGES, a.challenge);
  const benefits = [goal.benefit, ...rule.benefits.filter((b) => b !== goal.benefit)].slice(0, 4);
  return {
    company,
    sector: a.sector,
    sectorLabel,
    problemLabel,
    goalLabel: labelOf(GOALS, a.goal),
    hoursLabel: labelOf(HOURS, a.hours),
    needsValidation: a.challenge === 'otro' || a.sector === 'otro',
    urgency: hours,
    summary: [rule.summary(company), SECTOR_CONTEXT[a.sector] || SECTOR_CONTEXT.otro],
    hoursNote: hours.note,
    opportunity: rule.opportunity,
    solution: {
      title: rule.solutionTitle,
      text: rule.solutionText,
      focus: `Como el objetivo es ${labelOf(GOALS, a.goal).toLowerCase()}, la propuesta se concentra en ${goal.focus}.`,
    },
    steps: rule.steps,
    premeasure: a.hours === 'nose',
    benefits,
    demo: rule.demo,
    demoMode: rule.demoMode,
    demoName: rule.demoName,
    source: 'local',
  };
}

/* =========================================================
   3. PROVEEDOR DEL DIAGNÓSTICO
   Hoy: reglas locales. Para integrar Gemini, crea un proveedor
   con la misma interfaz y cámbialo en ACTIVE_PROVIDER:

   const geminiProvider = {
     name: 'gemini',
     async diagnose(answers) {
       // La clave de API vive en un backend propio, nunca en el navegador.
       const res = await fetch('/api/diagnostico', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(answers),
       });
       const ai = await res.json();
       // Combina la respuesta del modelo con la base determinista
       return { ...buildDiagnosis(answers), ...ai, source: 'gemini' };
     },
   };
   ========================================================= */
export const localProvider = {
  name: 'local',
  async diagnose(answers) { return buildDiagnosis(answers); },
};
export const ACTIVE_PROVIDER = localProvider;

/* =========================================================
   4. DATOS FICTICIOS PARA LAS DEMOSTRACIONES
   ========================================================= */
export const PIPELINE = {
  clients: {
    heading: 'Cartera comercial priorizada',
    explain: 'La prioridad combina el valor estimado, la etapa comercial y los días sin contacto. Con datos reales, estas reglas se calibran con el historial de ventas.',
    action: 'Registrar contacto',
    done: 'Contactado hoy',
    items: [
      { id: 1, name: 'Inversiones Alameda', stage: 'Cotización enviada', value: 48, days: 12 },
      { id: 2, name: 'Comercial Los Andes', stage: 'Negociación', value: 22, days: 3 },
      { id: 3, name: 'Grupo Sabana', stage: 'Cotización enviada', value: 65, days: 21 },
      { id: 4, name: 'Distribuciones Altamira', stage: 'Primer contacto', value: 9, days: 15 },
      { id: 5, name: 'Ferretería El Roble', stage: 'Negociación', value: 14, days: 6 },
      { id: 6, name: 'Servicios Cordillera', stage: 'Propuesta en revisión', value: 31, days: 9 },
      { id: 7, name: 'Taller La Esperanza', stage: 'Primer contacto', value: 5, days: 2 },
    ],
  },
  leads: {
    heading: 'Prospectos priorizados por interés',
    explain: 'La calificación suma el peso del canal de origen y las interacciones, y resta según los días sin respuesta. Con datos reales, un modelo aprende qué señales anticipan una compra.',
    action: 'Marcar contactado',
    done: 'Contactado',
    items: [
      { id: 1, name: 'Constructora Bahía', channel: 'Referido', touches: 4, days: 2 },
      { id: 2, name: 'Panadería La Espiga', channel: 'Redes sociales', touches: 2, days: 6 },
      { id: 3, name: 'Colegio Nuevo Horizonte', channel: 'Sitio web', touches: 5, days: 1 },
      { id: 4, name: 'Agroinsumos El Llano', channel: 'Feria', touches: 2, days: 4 },
      { id: 5, name: 'Clínica Vida Plena', channel: 'Sitio web', touches: 3, days: 3 },
      { id: 6, name: 'Logística Andina', channel: 'Redes sociales', touches: 4, days: 9 },
    ],
  },
};
export const STAGE_WEIGHT = { 'Primer contacto': 0, 'Cotización enviada': 6, 'Propuesta en revisión': 10, 'Negociación': 15 };
export const CHANNEL_WEIGHT = { Referido: 30, Feria: 20, 'Sitio web': 15, 'Redes sociales': 10 };

export const TASK_SEEDS = {
  admin: [
    { title: 'Registrar facturas de proveedores de la semana', priority: 'alta', due: 'hoy', owner: 'Contabilidad' },
    { title: 'Enviar cuentas de cobro pendientes', priority: 'alta', due: 'manana', owner: 'Cartera' },
    { title: 'Conciliar pagos con el extracto bancario', priority: 'media', due: 'jueves', owner: 'Tesorería' },
    { title: 'Archivar soportes de nómina de octubre', priority: 'baja', due: 'viernes', owner: 'Talento humano' },
    { title: 'Actualizar la base de proveedores', priority: 'media', due: 'proxima', owner: 'Compras', done: true },
  ],
  agenda: [
    { title: 'Confirmar reunión con el proveedor principal', priority: 'alta', due: 'hoy', owner: 'Gerencia' },
    { title: 'Revisar agenda de visitas comerciales', priority: 'alta', due: 'manana', owner: 'Comercial' },
    { title: 'Preparar informe semanal de operaciones', priority: 'media', due: 'jueves', owner: 'Operaciones' },
    { title: 'Programar mantenimiento de equipos', priority: 'baja', due: 'viernes', owner: 'Mantenimiento' },
    { title: 'Enviar acta de la reunión del lunes', priority: 'media', due: 'hoy', owner: 'Gerencia', done: true },
  ],
};
export const DUE = [
  { id: 'hoy', label: 'Hoy', order: 0 },
  { id: 'manana', label: 'Mañana', order: 1 },
  { id: 'jueves', label: 'Jueves', order: 3 },
  { id: 'viernes', label: 'Viernes', order: 4 },
  { id: 'proxima', label: 'Próxima semana', order: 7 },
];
export const PRIORITIES = [
  { id: 'alta', label: 'Alta', weight: 3 },
  { id: 'media', label: 'Media', weight: 2 },
  { id: 'baja', label: 'Baja', weight: 1 },
];

// [producto, unidad, existencia, mínimo, consumo semanal]
export const INVENTORY = {
  metalurgia: [['Lámina de acero 1/8"', 'láminas', 42, 60, 18], ['Perfil en C de 4"', 'unid.', 130, 80, 25], ['Soldadura E6013', 'kg', 18, 40, 12], ['Disco de corte 7"', 'unid.', 95, 50, 20], ['Pintura anticorrosiva', 'galones', 22, 15, 4]],
  automocion: [['Filtro de aceite', 'unid.', 34, 40, 15], ['Pastillas de freno', 'juegos', 12, 20, 6], ['Aceite 20W-50', 'galones', 60, 30, 14], ['Bujías', 'unid.', 140, 80, 30], ['Correa de distribución', 'unid.', 6, 8, 2]],
  mineria: [['Brocas de perforación', 'unid.', 14, 20, 5], ['Lubricante hidráulico', 'canecas', 9, 6, 2], ['Guantes de seguridad', 'pares', 210, 150, 60], ['Filtros de aire', 'unid.', 18, 24, 6], ['Cable de acero', 'm', 340, 200, 45]],
  agroindustria: [['Fertilizante NPK', 'bultos', 85, 60, 22], ['Cajas de cartón', 'unid.', 1200, 1500, 450], ['Semilla certificada', 'kg', 140, 100, 20], ['Fungicida', 'litros', 16, 25, 7], ['Estibas', 'unid.', 75, 40, 12]],
  cemento: [['Cemento gris', 'bultos', 480, 600, 220], ['Arena lavada', 'm³', 36, 30, 10], ['Varilla de 1/2"', 'unid.', 260, 200, 70], ['Bloque No. 5', 'unid.', 2100, 1500, 600], ['Aditivo impermeabilizante', 'galones', 9, 12, 3]],
  salud: [['Guantes de nitrilo', 'cajas', 46, 60, 18], ['Jeringas de 5 ml', 'unid.', 900, 600, 250], ['Gasa estéril', 'paquetes', 120, 150, 45], ['Alcohol antiséptico', 'litros', 30, 20, 8], ['Tapabocas', 'cajas', 70, 40, 12]],
  gastronomia: [['Harina de trigo', 'kg', 38, 50, 22], ['Aceite vegetal', 'litros', 44, 30, 15], ['Queso campesino', 'kg', 9, 12, 7], ['Café en grano', 'kg', 15, 10, 4], ['Empaques para domicilio', 'unid.', 320, 500, 180]],
  turismo: [['Kits de bienvenida', 'unid.', 28, 40, 12], ['Toallas', 'unid.', 160, 120, 20], ['Amenidades de baño', 'kits', 90, 120, 45], ['Folletos de rutas', 'unid.', 400, 250, 80], ['Café para habitaciones', 'cajas', 6, 10, 3]],
  educacion: [['Resmas de papel', 'unid.', 24, 40, 9], ['Marcadores borrables', 'cajas', 7, 10, 3], ['Tóner para impresora', 'unid.', 2, 4, 1], ['Carnés estudiantiles', 'unid.', 180, 100, 15], ['Kits de laboratorio', 'unid.', 22, 15, 4]],
  tecnologia: [['Portátiles de préstamo', 'unid.', 5, 6, 1], ['Cables HDMI', 'unid.', 34, 20, 6], ['Licencias disponibles', 'licencias', 12, 15, 4], ['Discos SSD de 1 TB', 'unid.', 8, 10, 3], ['Routers', 'unid.', 11, 6, 2]],
  otro: [['Insumo principal', 'unid.', 70, 100, 30], ['Material de empaque', 'unid.', 400, 300, 90], ['Repuestos', 'unid.', 15, 20, 5], ['Papelería', 'paquetes', 18, 10, 3], ['Producto terminado', 'unid.', 120, 80, 35]],
};

export const MONTHS = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
export const MONTHS_LONG = ['mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre'];

export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function seeded(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeSeries(company) {
  const r = seeded(hashStr((company || 'empresa').toLowerCase()));
  const base = 80 + r() * 90;
  const trend = -0.02 + r() * 0.07;
  const ventas = MONTHS.map((_, i) => +(base * (1 + trend * i + (r() - 0.5) * 0.12)).toFixed(1));
  const ticket = 0.32 + r() * 0.4;
  const pedidos = ventas.map((v) => Math.round((v / ticket) * (1 + (r() - 0.5) * 0.08)));
  const r0 = 8 + r() * 10;
  const respuesta = MONTHS.map((_, i) => +Math.max(2, r0 * (1 - 0.035 * i) + (r() - 0.5) * 1.6).toFixed(1));
  return { ventas, pedidos, respuesta };
}
