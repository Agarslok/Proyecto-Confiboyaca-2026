import type { SizeId } from "@/lib/radar/types";

/* ============================================================================
   Los casos en el idioma del dueño del negocio.

   La biblioteca del esquema describe cada caso con su técnica de ciencia de
   datos (XGBoost, k-means, Apriori…). Al cliente se le muestra «qué se hace»
   en palabras del día a día; la técnica queda como nota para el consultor.

   minSize: tamaño mínimo para que el caso tenga sentido. A una micro o
   pequeña empresa no se le muestran casos que solo funcionan con escala
   (sensores, visión artificial, modelos de abandono).
   ========================================================================== */

interface Plain {
  title?: string;
  plain: string;
  minSize?: SizeId;
}

export const PLAIN: Record<string, Plain> = {
  /* Riesgo alto · transversales */
  "Información dispersa en papel, chats y memoria": { plain: "Una sola tabla con todas las ventas, siempre con las mismas columnas, que se llena desde el celular." },
  "Duplicados y errores de digitación": { plain: "Cada cliente y producto con un código; la hoja no deja guardar datos incompletos o repetidos." },
  "El negocio depende de una sola persona": { plain: "Escribir dónde está cada dato y quién lo mantiene, para que el negocio no se detenga si esa persona falta." },
  "Riesgo de perder toda la información": { plain: "Pasar los archivos a la nube con copia automática y una clave por persona." },
  "Precios fijados sin conocer el costo real": { title: "Precios sin saber cuánto cuesta hacer cada producto", plain: "Sacar el costo de cada producto (insumos y mano de obra) y ver cuáles dejan ganancia y cuáles no." },
  "Decisiones sin indicadores": { plain: "Elegir 3 a 5 números clave del negocio, con su meta, y revisarlos cada semana en una hoja sencilla." },
  "Producción «al ojo»: sobrantes y faltantes": { plain: "Anotar lo producido y lo vendido cada día y producir según el promedio de ese día de la semana." },
  "Insumos que se agotan o se vencen": { plain: "Una lista de insumos con cantidad mínima: avisa cuándo pedir y qué usar primero porque se vence antes." },
  "No se sabe qué se vende más": { plain: "Registrar las ventas por producto y ver cuáles son los que más venden y más dejan." },
  "Clientes anónimos": { plain: "Guardar nombre y WhatsApp de los clientes, con su autorización, para avisarles de novedades." },
  "Rutas armadas a mano": { plain: "Ordenar las entregas del día en un mapa para recorrer menos kilómetros." },
  "Pedidos sin trazabilidad": { plain: "Cada pedido con su estado (recibido, en camino, entregado) y un mensaje automático al cliente." },
  "Quejas que se pierden en WhatsApp": { plain: "Cada solicitud o queja con número y estado, para que ninguna quede sin respuesta." },
  "La satisfacción no se mide": { plain: "Preguntarle al cliente después de cada compra, con una sola pregunta de 0 a 10." },

  /* Riesgo moderado · transversales y eslabón */
  "Reportes que tardan días en Excel": { plain: "Que el informe del mes se arme solo a partir de las tablas, en vez de copiar y pegar." },
  "Cada área tiene su propia verdad": { plain: "Una sola fuente de cifras para todas las áreas, con las mismas definiciones.", minSize: "mediana" },
  "Las caídas en ventas se detectan tarde": { plain: "Una alerta cuando las ventas de la semana bajan más de lo normal." },
  "Todos los clientes reciben el mismo trato": { title: "Clientes frecuentes, ocasionales y perdidos", plain: "Separar a los clientes según cada cuánto compran y cuánto gastan, para tratar distinto a cada grupo." },
  "Calidad de datos irregular": { plain: "Revisar cada mes los datos incompletos o repetidos y corregir la causa." },
  "Presupuesto sin seguimiento": { plain: "Comparar cada mes lo que se gastó con lo que se había planeado." },
  "Paros y cuellos de botella invisibles": { plain: "Medir cuánto tiempo de verdad produce cada máquina y por qué para." },
  "Plan de producción desconectado de ventas": { plain: "Planear la producción de la semana con lo que se vendió las semanas anteriores." },
  "Capital inmovilizado en inventario": { plain: "Ver qué productos llevan mucho tiempo en la bodega sin venderse y dejar de comprarlos." },
  "Promociones sin medir el resultado": { plain: "Comparar las ventas antes y después de cada promoción para saber si valió la pena." },
  "Flota sin indicadores": { plain: "Ver en un tablero las entregas a tiempo y el costo por vehículo." },
  "Bodega sin orden por rotación": { plain: "Poner adelante lo que más sale para alistar los pedidos más rápido." },
  "Clientes que se van sin avisar": { plain: "Ver cada mes qué clientes dejaron de comprar y llamarlos antes de perderlos." },
  "Capacidad mal dimensionada": { plain: "Ver a qué horas y qué días hay más clientes y ajustar los turnos del personal." },

  /* Riesgo bajo · transversales y eslabón */
  "Pronóstico de demanda con machine learning": { title: "Saber cuánto se va a vender la próxima semana", plain: "Un pronóstico semanal por producto, que tiene en cuenta el día, la quincena y los festivos." },
  "Predicción de abandono de clientes": { plain: "Un aviso mensual de qué clientes tienen más probabilidad de irse.", minSize: "mediana" },
  "Precios basados en elasticidad": { plain: "Medir cuánto cambian las ventas al subir o bajar el precio de cada producto.", minSize: "mediana" },
  "Asistente de IA generativa para atención": { title: "Un asistente que responde el WhatsApp", plain: "Un asistente que responde las preguntas de siempre (precios, horarios, pedidos) y pasa a una persona lo demás." },
  "Recomendaciones personalizadas": { plain: "Sugerir a cada cliente productos según lo que ha comprado.", minSize: "mediana" },
  "Detección de anomalías y fraude": { plain: "Alertas automáticas cuando una venta, un pago o un descuento se sale de lo normal.", minSize: "mediana" },
  "Mantenimiento predictivo": { plain: "Sensores en las máquinas que avisan antes de que se dañen.", minSize: "mediana" },
  "Control de calidad con visión artificial": { plain: "Una cámara que revisa cada producto y separa los defectuosos.", minSize: "grande" },
  "Reabastecimiento automático": { title: "Pedido sugerido a proveedores", plain: "Que el sistema proponga cada semana cuánto pedir de cada producto según lo que se vende." },
  "Priorización de prospectos (lead scoring)": { plain: "Ordenar los posibles clientes según qué tan probable es que compren.", minSize: "mediana" },
  "Optimización de rutas": { plain: "Una app que arma la mejor ruta del día con todas las entregas." },
  "Hora de llegada predictiva": { plain: "Avisarle al cliente a qué hora llega su pedido, según el tráfico.", minSize: "mediana" },
  "Análisis de sentimiento de opiniones": { title: "Leer las reseñas con IA", plain: "La IA lee las reseñas y mensajes y resume cada semana de qué se quejan y qué les gusta." },
  "Agenda y personal según la demanda prevista": { plain: "Programar turnos y citas según cuántos clientes se esperan cada día." },

  /* Por industria */
  "Tallas y colores que no rotan": { plain: "Ver qué tallas y colores se venden y comprar la próxima temporada con esa proporción." },
  "Pronóstico de tendencias por temporada": { plain: "Mirar qué se está buscando en internet y en las ventas para comprar mejor cada temporada." },
  "Producto que sobra al cierre": { plain: "Anotar lo que sobra cada día y producir menos de lo que no se vende." },
  "Pronóstico por clima, festivos y quincena": { title: "Cuánto producir según el día, la quincena y los festivos", plain: "Una tabla que sugiere cuánto producir mañana según el día, la quincena, los festivos y el clima." },
  "Surtido igual en todas las tiendas": { plain: "Ver qué se vende en cada tienda y surtir cada una según sus clientes." },
  "Canasta de mercado y venta cruzada": { title: "Qué se compra junto: combos que se venden más", plain: "Ver qué productos se compran juntos para armar combos y ubicarlos cerca." },
  "Inasistencia a citas": { plain: "Recordatorio automático por WhatsApp el día anterior a cada cita." },
  "Identificación temprana de pacientes en riesgo": { plain: "Un modelo que avisa qué pacientes tienen más riesgo de volver a hospitalizarse.", minSize: "mediana" },
  "Costos de producción sin desagregar": { plain: "Saber cuánto cuesta de verdad cada pedido u orden de producción." },
  "Consumo de energía optimizado": { plain: "Medidores en las máquinas para encontrar dónde se gasta más energía.", minSize: "mediana" },
  "Viajes de regreso vacíos": { plain: "Buscar carga para los viajes de regreso con un tablero de rutas y ocupación." },
  "Combustible y hábitos de conducción": { plain: "Revisar el consumo de cada vehículo y conductor para bajar el gasto en combustible." },
  "Rendimiento por lote sin registro": { plain: "Anotar en el celular lo que se le aplica y lo que da cada lote." },
  "Agricultura de precisión": { plain: "Imágenes de satélite para ver qué parte del cultivo necesita agua o abono.", minSize: "mediana" },
  "Proyectos que pierden dinero": { plain: "Registrar las horas de cada proyecto para saber cuáles dejan ganancia." },
  "Propuestas e informes con IA generativa": { title: "Propuestas e informes en minutos con IA", plain: "Usar IA con plantillas propias para escribir propuestas e informes que luego revisa una persona." },
  "Accidentes que se repiten sin registro": { plain: "Registrar cada incidente desde el celular y atacar las causas que más se repiten." },
  "Predicción de la calidad del mineral": { plain: "Anticipar la calidad de cada frente con los análisis de laboratorio.", minSize: "mediana" },
  "Obras que se pasan del presupuesto": { plain: "Comparar cada semana lo gastado y lo avanzado contra lo presupuestado en cada obra." },
  "Pronóstico de sobrecostos y retrasos": { plain: "Usar el historial de obras para anticipar cuáles se van a retrasar o pasar del presupuesto.", minSize: "mediana" },
  "Comisiones sin control por canal": { plain: "Ver cuánto deja cada reserva según de dónde viene (directo, Booking, agencia)." },
  "Tarifas dinámicas (revenue management)": { title: "Tarifas según temporada y ocupación", plain: "Subir o bajar la tarifa según la temporada y qué tan lleno está el hotel." },
};

const SIZE_ORDER: SizeId[] = ["micro", "pequena", "mediana", "grande"];

/** ¿El caso tiene sentido para una empresa de este tamaño? */
export function fitsSize(minSize: SizeId | undefined, size: SizeId | ""): boolean {
  if (!minSize || !size) return true;
  return SIZE_ORDER.indexOf(size) >= SIZE_ORDER.indexOf(minSize);
}
