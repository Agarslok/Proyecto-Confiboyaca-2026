import type { LinkId } from "@/lib/radar/types";
import type { Vocab } from "@/lib/radar/types";

export type LinkOpsTemplate = {
  operationTypes: string[];
  primaryLabel: string;
  primaryDesc: string;
  secondaryLabel: string;
  secondaryDesc: string;
  whoLabel: string;
  whenLabel: string;
  howManyLabel: string;
  whatLabel: string;
  starters: (vocab: Vocab, activityLabel: string) => [string, string, string];
  followUps: string[];
  frequentQueries: (primary: string) => string[];
  charts: string[];
  examples: (primary: string, vocab: Vocab) => ConversationExamplePair[];
};

type ConversationExamplePair = { user: string; assistant: string };

export const LINK_TEMPLATES: Record<LinkId, LinkOpsTemplate> = {
  produccion: {
    operationTypes: ["Registrar lote o turno", "Anotar insumo consumido", "Cerrar producción del día", "Reportar merma o reproceso"],
    primaryLabel: "Producción del día",
    primaryDesc: "Lotes, turnos o pedidos en planta/taller",
    secondaryLabel: "Insumos y existencias",
    secondaryDesc: "Materia prima, insumos o piezas en bodega",
    whoLabel: "Responsable o lote",
    whenLabel: "Fecha o turno",
    howManyLabel: "Cantidad producida",
    whatLabel: "Producto o referencia",
    starters: (vocab, activity) => [
      `Anota un lote de ${vocab.productos} para hoy en ${activity.toLowerCase()}`,
      `¿Cuántos registros de producción hay esta semana?`,
      `¿Qué ${vocab.productos} quedan en existencias?`,
    ],
    followUps: ["¿Cuál es el responsable o el lote?", "¿Para qué fecha o turno?", "¿Cuántas unidades?", "¿Qué referencia o producto?"],
    frequentQueries: (primary) => [
      `¿Cuántos registros hay en ${primary}?`,
      "¿Cuántas unidades suman esta semana?",
      "¿Qué hay en existencias hoy?",
    ],
    charts: ["Volumen por referencia", "Mix de producción", "Existencias por ítem", "Tendencia acumulada"],
    examples: (primary, vocab) => [
      {
        user: `Registra 120 ${vocab.productos} del turno de la mañana`,
        assistant: `Perfecto.\n\nResponsable: Por definir\nFecha: Hoy\nCantidad: 120\nProducto: Por definir\n\n¿Cuál es el Responsable?`,
      },
      {
        user: `¿Cuántos registros hay en ${primary}?`,
        assistant: `En ${primary} hay 3 registros.`,
      },
    ],
  },
  comercial: {
    operationTypes: ["Registrar pedido o venta", "Reservar entrega", "Anotar cliente nuevo", "Consultar cartera abierta"],
    primaryLabel: "Pedidos y ventas",
    primaryDesc: "Lo que vendes o comprometes con clientes",
    secondaryLabel: "Existencias",
    secondaryDesc: "Lo que tienes disponible para vender",
    whoLabel: "Cliente",
    whenLabel: "Fecha de entrega",
    howManyLabel: "Cantidad",
    whatLabel: "Producto o servicio",
    starters: (vocab, activity) => [
      `El cliente pide 6 ${vocab.productos} para mañana`,
      `¿Cuántos pedidos abiertos tengo?`,
      `¿Qué ${vocab.productos} quedan en existencias?`,
    ],
    followUps: ["¿Quién es el cliente?", "¿Para cuándo?", "¿Cuántas unidades?", "¿Qué producto o servicio?"],
    frequentQueries: (primary) => [`¿Cuántos pedidos hay en ${primary}?`, "¿Qué clientes llegan mañana?", "¿Cuánto hay en existencias?"],
    charts: ["Ventas por producto", "Mix de pedidos", "Existencias", "Tendencia de pedidos"],
    examples: (primary, vocab) => [
      {
        user: `Anota pedido de 10 ${vocab.productos} para el viernes`,
        assistant: `Perfecto.\n\nCliente: Por definir\nFecha: Vie\nCantidad: 10\nProducto: Por definir\n\n¿Cuál es el Cliente?`,
      },
      { user: `¿Cuántos pedidos hay?`, assistant: `En ${primary} hay 4 registros.` },
    ],
  },
  logistica: {
    operationTypes: ["Programar despacho", "Registrar envío", "Anotar llegada a bodega", "Consultar trazabilidad"],
    primaryLabel: "Despachos y movimientos",
    primaryDesc: "Envíos, rutas o acopios",
    secondaryLabel: "Cupos y bodega",
    secondaryDesc: "Espacio, vehículos o unidades disponibles",
    whoLabel: "Cliente o destino",
    whenLabel: "Salida o llegada",
    howManyLabel: "Bultos o toneladas",
    whatLabel: "Ruta o mercancía",
    starters: (vocab, activity) => [
      `Mañana salen 3 ${vocab.productos} a Duitama`,
      `¿Cuántos despachos tengo esta semana?`,
      `¿Cuántos cupos libres hay hoy?`,
    ],
    followUps: ["¿Para quién o qué destino?", "¿Qué día sale?", "¿Cuántos bultos?", "¿Qué ruta o mercancía?"],
    frequentQueries: (primary) => [`¿Cuántos despachos en ${primary}?`, "¿Quién sale mañana?", "¿Cuánto cupo libre hay?"],
    charts: ["Carga por ruta", "Mix de despachos", "Cupos libres", "Tendencia de movimientos"],
    examples: (primary, vocab) => [
      {
        user: `Registra envío de 2 toneladas de ${vocab.productos}`,
        assistant: `Perfecto.\n\nCliente: Por definir\nFecha: Mañana\nCantidad: 2\nRuta: Por definir\n\n¿Cuál es el Cliente?`,
      },
      { user: "¿Cuántos despachos hay?", assistant: `En ${primary} hay 5 registros.` },
    ],
  },
  servicio: {
    operationTypes: ["Agendar cita o reserva", "Registrar solicitud", "Anotar servicio en curso", "Cerrar caso atendido"],
    primaryLabel: "Agenda y solicitudes",
    primaryDesc: "Citas, reservas o casos abiertos",
    secondaryLabel: "Capacidad y cupos",
    secondaryDesc: "Horarios, salas o cupos disponibles",
    whoLabel: "Cliente o paciente",
    whenLabel: "Fecha y hora",
    howManyLabel: "Personas",
    whatLabel: "Servicio o plan",
    starters: (vocab, activity) => [
      `Hoy entra una solicitud de ${vocab.clientes} para mañana`,
      `¿Cuántas citas tengo esta semana?`,
      `¿Cuántos cupos quedan el sábado?`,
    ],
    followUps: ["¿Quién es el cliente?", "¿Para cuándo?", "¿Cuántas personas?", "¿Qué servicio?"],
    frequentQueries: (primary) => [`¿Cuántas solicitudes en ${primary}?`, "¿Quién llega mañana?", "¿Cuántos cupos libres?"],
    charts: ["Servicios agendados", "Mix por tipo", "Cupos libres", "Tendencia de atenciones"],
    examples: (primary, vocab) => [
      {
        user: `Reserva consulta para 2 ${vocab.clientes} el jueves`,
        assistant: `Perfecto.\n\nCliente: Por definir\nFecha: Jue\nCantidad: 2\nServicio: Por definir\n\n¿Cuál es el Cliente?`,
      },
      { user: "¿Cuántas citas hay?", assistant: `En ${primary} hay 6 registros.` },
    ],
  },
};
