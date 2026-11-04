import type { DashboardBinding, DashboardCopy, SectorLexicon } from "@/lib/ops/sector/types";

/** Léxico de consulta del hotel. El motor solo aplica estas pistas. */
export const tourismLexicon: SectorLexicon = {
  tableHints: [
    { message: /reserva/, table: /reserva/ },
    { message: /en casa|estadia/, table: /casa|estadia/ },
    { message: /habitacion|suite|cupo|libre/, table: /habitacion|cupo/ },
    { message: /pedido/, table: /pedido/ },
  ],
  summary: /ocupacion|como va|como esta|estado del hotel|resumen/,
  sumWhen: /huesped|persona|cantidad|suma|esperad|libre/,
  arrival: /huesped|persona|llega|viene/,
  primaryTable: /reserva/,
  presenceTable: /casa|estadia/,
  stockTable: /habitacion|cupo/,
  countWord: "reservas",
  expectedWord: "huéspedes esperados",
  presencePrefix: "En casa hoy",
  presenceEmpty: "Hoy no hay estadías marcadas.",
  stockPrefix: "Cupos",
  stockSuffix: "libres",
};

export const tourismDashboardBinding: DashboardBinding = {
  primaryId: "reservas",
  presenceId: "estadias",
  stockId: "cupos",
  ordersId: "pedidos",
  whoKey: "guest",
  whenKey: "arrival",
  countKey: "guestCount",
  whatKey: "room",
  stockCountKey: "free",
  stockWhatKey: "roomType",
  ordersWhatKey: "detail",
  presenceWhen: /hoy|casa/i,
  kpis: {
    primary: { label: "Reservas", hint: "En la tabla de reservas" },
    sum: { label: "Esperados", hint: "Suma de huéspedes reservados" },
    presence: { label: "En casa", hint: "Estadías activas" },
    orders: { label: "Pedidos", hint: "Especiales aún abiertos" },
  },
  stockHint: (free) => `${free} cupos libres`,
  emptyOrders: "Sin pedidos",
};

export const tourismDashboardCopy: DashboardCopy = {
  barsTitle: "Huéspedes por habitación",
  barsY: "Huéspedes",
  barsEmpty: "Anota reservas con habitación y huéspedes para ver este eje.",
  barsHint: "Eje X: tipo de habitación · Y: huéspedes",
  pieTitle: "Mix de reservas",
  pieEmpty: "Anota reservas para ver el mix de habitaciones.",
  pieCenter: "reservas",
  pieHint: "Cada porción es un tipo de habitación en reservas",
  ordersTitle: "Pedidos por estado",
  ordersX: "Pedidos",
  trendTitle: "Tendencia de huéspedes",
  trendY: "Huéspedes acum.",
  filterLabel: "Periodo",
  recentTitle: "Actividad reciente",
};

export const tourismStarters = [
  "Hoy llegan 4 huéspedes a habitación doble",
  "¿Cuántas reservas tengo esta semana?",
  "Quedan 2 suites libres para el fin de semana",
];
