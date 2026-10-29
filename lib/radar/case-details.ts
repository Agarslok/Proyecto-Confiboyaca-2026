import { CORE_QUESTIONS, SAMPLES } from "@/lib/radar/bank";
import { simulatedSeries } from "@/lib/radar/simulated";
import { nicheQuestions } from "@/lib/radar/engine";
import type { CaseItem, IndustryId, OptionKey, RadarAnswers, RadarQuestion } from "@/lib/radar/types";

/* ============================================================================
   Detalle de cada caso: cómo lo tiene hoy la empresa (según su respuesta),
   cómo debería tenerlo, la estructura de datos propuesta y los pasos.
   Los casos transversales de riesgo alto tienen contenido escrito a mano;
   el resto se arma a partir de la técnica y del indicador del caso.
   Marcadores: {i1} {i2} {i3} productos de ejemplo · {c1} {c2} clientes.
   ========================================================================== */

interface Authored {
  question: string;
  notebook: string[];
  columns: string[];
  rows: string[][];
  steps: string[];
  benefit: string;
}

const AUTHORED: Record<string, Authored> = {
  "t-alto-0": {
    question: "datos-registro",
    notebook: ["Lunes: vendí 40 {i1}, fiado {c1}", "pedido {c2} → pendiente?", "martes igual que ayer + 12 {i2}", "(el resto quedó en el WhatsApp)"],
    columns: ["Fecha", "Producto", "Cantidad", "Cliente", "Forma de pago"],
    rows: [
      ["2026-10-27", "{i1}", "40", "{c1}", "Crédito"],
      ["2026-10-27", "{i2}", "12", "{c2}", "Efectivo"],
      ["2026-10-28", "{i3}", "3", "{c2}", "Transferencia"],
    ],
    steps: [
      "Definir una hoja maestra: una fila por venta, con las mismas columnas siempre.",
      "Capturar desde un formulario (celular o computador), no escribir directo en la tabla.",
      "Separar en tablas relacionadas: ventas, productos y clientes, unidas por un código.",
      "Cerrar el mes desde la tabla, sin volver a contar cuadernos.",
    ],
    benefit: "Con la información en una sola tabla, el cierre del mes pasa de días a minutos y aparece el primer histórico para analizar.",
  },
  "t-alto-1": {
    question: "datos-lista",
    notebook: ["{c1} · 310 555 0101", "{c1} (la misma?) · 3105550101", "Sra. Marta - sin teléfono", "{c2} ... dirección: ver otro cuaderno"],
    columns: ["ID cliente", "Nombre", "Teléfono", "Municipio", "Autoriza datos"],
    rows: [
      ["CL-0001", "{c1}", "3105550101", "Tunja", "Sí"],
      ["CL-0002", "{c2}", "3205550202", "Duitama", "Sí"],
      ["CL-0003", "Marta Rojas", "3005550303", "Sogamoso", "Pendiente"],
    ],
    steps: [
      "Darle a cada cliente un código único (ID) y usarlo en cada venta.",
      "Validar al capturar: teléfono de 10 dígitos, municipio de una lista, campos obligatorios.",
      "Unificar los duplicados que ya existen con una regla (mismo teléfono = mismo cliente).",
      "Revisar cada mes los registros incompletos.",
    ],
    benefit: "Sin duplicados, los totales por cliente cuadran y se puede medir quién vuelve a comprar.",
  },
  "t-alto-2": {
    question: "equipo-responsable",
    notebook: ["Solo el dueño sabe los precios", "¿la clave del correo? → preguntarle a él", "los pedidos grandes los anota él en su libreta"],
    columns: ["Dato", "Dónde está", "Responsable", "Cada cuánto se actualiza"],
    rows: [
      ["Precios de {i1}, {i2}, {i3}", "Hoja «Productos»", "Administración", "Cada mes"],
      ["Clientes", "Hoja «Clientes»", "Ventas", "Con cada venta"],
      ["Inventario", "Hoja «Inventario»", "Producción", "Cada día"],
    ],
    steps: [
      "Hacer un diccionario de datos: qué dato existe, qué significa y dónde está.",
      "Asignar un responsable por cada dato importante, no una sola persona para todo.",
      "Documentar las tareas que solo sabe hacer una persona.",
      "Dar accesos por cargo, con cuentas de la empresa.",
    ],
    benefit: "El negocio deja de depender de la memoria de una persona y las tareas manuales se reparten y se reducen.",
  },
  "t-alto-3": {
    question: "tec-proteccion",
    notebook: ["Todo está en el computador de la caja", "copia en una USB… del año pasado", "la clave es la misma para todo"],
    columns: ["Información", "Dónde se guarda", "Copia de seguridad", "Quién tiene acceso"],
    rows: [
      ["Ventas y clientes", "Nube de la empresa", "Automática, diaria", "Gerencia y ventas"],
      ["Facturas", "Software contable", "Automática, semanal", "Contabilidad"],
      ["Fotos y documentos", "Carpeta compartida", "Automática, diaria", "Todo el equipo"],
    ],
    steps: [
      "Pasar los archivos del computador o la USB a una nube con cuentas de la empresa.",
      "Activar la copia automática y probar una restauración cada trimestre.",
      "Una cuenta por persona y verificación en dos pasos.",
      "Quitar los accesos el mismo día en que alguien sale de la empresa.",
    ],
    benefit: "Un daño, un robo o un virus deja de significar perder toda la historia del negocio.",
  },
  "t-alto-4": {
    question: "analitica-decisiones",
    notebook: ["{i1} a $2.500 porque así lo vende la competencia", "¿cuánto me cuesta? harina + ... no sé", "subí {i2} a ojo"],
    columns: ["Producto", "Costo de insumos", "Costo de mano de obra", "Precio", "Margen"],
    rows: [
      ["{i1}", "$1.050", "$400", "$2.500", "42 %"],
      ["{i2}", "$900", "$350", "$2.000", "38 %"],
      ["{i3}", "$19.000", "$6.500", "$38.000", "33 %"],
    ],
    steps: [
      "Costear cada producto: insumos, mano de obra y gastos que le corresponden.",
      "Ordenar los productos por lo que aportan (análisis de Pareto 80/20).",
      "Armar un tablero de márgenes que se actualice con los precios de los insumos.",
      "Revisar los precios con el tablero, no a ojo.",
    ],
    benefit: "Se sabe qué productos dejan plata y cuáles se venden a pérdida.",
  },
  "t-alto-5": {
    question: "analitica-decisiones",
    notebook: ["«este mes se vendió bien, creo»", "¿más que el año pasado? ni idea", "decisión: hacer lo mismo"],
    columns: ["Indicador", "Cómo se calcula", "Meta", "Este mes"],
    rows: [
      ["Ventas del mes", "Suma de la tabla de ventas", "$18.000.000", "$16.400.000"],
      ["Ticket promedio", "Ventas ÷ número de ventas", "$12.000", "$10.800"],
      ["Clientes que vuelven", "Clientes con 2+ compras ÷ clientes", "40 %", "31 %"],
    ],
    steps: [
      "Elegir 3 a 5 indicadores que respondan a los objetivos del negocio.",
      "Definir cómo se calcula cada uno y cuál es su meta.",
      "Armar un tablero sencillo (Looker Studio o Excel) que lea la tabla de ventas.",
      "Revisarlo en una reunión fija, cada semana o cada mes.",
    ],
    benefit: "Las decisiones se toman mirando cifras y se nota a tiempo cuando algo empeora.",
  },
  "i-alimentos-b": {
    question: "alimentos-1",
    notebook: ["sobraron como 20 {i1}", "el pan de ayer se regaló", "viernes faltó {i2}"],
    columns: ["Fecha", "Producto", "Producido", "Vendido", "Sobrante", "Merma"],
    rows: [
      ["2026-10-27", "{i1}", "120", "96", "24", "20 %"],
      ["2026-10-27", "{i2}", "80", "79", "1", "1 %"],
      ["2026-10-28", "{i1}", "100", "94", "6", "6 %"],
    ],
    steps: [
      "Anotar cada día, por producto, cuánto se produjo y cuánto sobró.",
      "Calcular el promedio vendido por día de la semana.",
      "Producir con ese promedio más un margen pequeño.",
      "Revisar la merma en un tablero semanal.",
    ],
    benefit: "La merma se vuelve un número que se puede bajar, y deja de faltar producto los días fuertes.",
  },
  "i-mineria-b": {
    question: "mineria-1",
    notebook: ["turno noche: olor a gas en el frente 2", "se cayó parte del techo, nadie herido", "(no se reportó)"],
    columns: ["Fecha y turno", "Frente", "Tipo de evento", "Causa", "Acción y responsable"],
    rows: [
      ["2026-10-27 · Noche", "Frente 2", "Casi-accidente: gas", "Ventilación insuficiente", "Revisar ventilador · J. Pérez"],
      ["2026-10-28 · Día", "Frente 1", "Condición insegura", "Sostenimiento flojo", "Reforzar puntales · M. Díaz"],
      ["2026-10-28 · Día", "Frente 3", "Incidente menor", "Herramienta en mal estado", "Cambiar equipo · Almacén"],
    ],
    steps: [
      "Registrar todos los eventos, también los casi-accidentes, desde el celular y en el mismo turno.",
      "Clasificar por tipo y causa con una lista fija.",
      "Hacer un Pareto de causas cada mes.",
      "Hacer seguimiento a cada acción hasta cerrarla.",
    ],
    benefit: "Se atacan las causas que más se repiten antes de que terminen en un accidente.",
  },
};

export interface CaseDetail {
  item: CaseItem;
  question?: RadarQuestion;
  todayAnswer?: { key: OptionKey; text: string };
  target?: string;
  notebook: string[];
  columns: string[];
  rows: string[][];
  steps: string[];
  benefit: string;
}

function fill(text: string, industry: IndustryId | ""): string {
  const sample = SAMPLES[industry || "otra"];
  return text
    .replace(/\{i(\d)\}/g, (_, n: string) => sample.items[Number(n) - 1] ?? "")
    .replace(/\{c(\d)\}/g, (_, n: string) => sample.customers[Number(n) - 1] ?? "");
}

/** Pregunta del formulario más relacionada con el caso, cuando no hay texto escrito a mano. */
function relatedQuestion(item: CaseItem, answers: RadarAnswers): RadarQuestion | undefined {
  const authored = AUTHORED[item.id];
  const niche = nicheQuestions(answers);
  const all = [...niche, ...CORE_QUESTIONS];
  if (authored) return all.find((question) => question.id === authored.question);
  if (item.kind !== "transversal") return niche.find((question) => question.dimension === "negocio") ?? niche[0];
  return all.find((question) => question.id === "analitica-decisiones");
}

export function caseDetail(item: CaseItem, answers: RadarAnswers): CaseDetail {
  const authored = AUTHORED[item.id];
  const question = relatedQuestion(item, answers);
  const key = question ? answers.choices[question.id] : undefined;
  const todayAnswer = question && key
    ? { key, text: key === "E" ? "No sé (por confirmar)" : question.options["ABCD".indexOf(key)] }
    : undefined;

  if (authored) {
    return {
      item,
      question,
      todayAnswer,
      target: question?.options[3],
      notebook: authored.notebook.map((line) => fill(line, answers.industry)),
      columns: authored.columns,
      rows: authored.rows.map((row) => row.map((cell) => fill(cell, answers.industry))),
      steps: authored.steps,
      benefit: authored.benefit,
    };
  }

  const { history } = simulatedSeries(item);
  const months = ["May", "Jun", "Jul", "Ago", "Sep", "Oct"];
  const goal = item.better === "menor" ? 0.8 : 1.2;
  return {
    item,
    question,
    todayAnswer,
    target: question?.options[3],
    notebook: ["El dato existe, pero no se mide de forma periódica", "cada quien lo calcula distinto", "nadie revisa la tendencia"],
    columns: ["Mes", `${item.indicator} (índice)`, "Meta", "¿Cumple?"],
    rows: months.map((month, index) => {
      const value = history[6 + index];
      const target = 100 * goal;
      const ok = item.better === "menor" ? value <= target : value >= target;
      return [month, value.toFixed(0), target.toFixed(0), ok ? "Sí" : "No"];
    }),
    steps: item.technique.split(" · ").map((technique, index) => `${index + 1 === 1 ? "Empezar con" : "Sumar"} ${technique.charAt(0).toLowerCase()}${technique.slice(1)}.`),
    benefit: `El indicador «${item.indicator.toLowerCase()}» se mide cada mes contra una meta (${item.better} es mejor).`,
  };
}
