import type { SectorTemplateKey } from "@/types/domain";

export const CRM_STAGES = ["nuevo", "contactado", "propuesta", "ganado", "pausado"] as const;
export type CrmStage = (typeof CRM_STAGES)[number];

export const TASK_STATUSES = ["pendiente", "en_curso", "lista"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface DemoClient {
  id: string;
  name: string;
  account: string;
  stage: CrmStage;
  nextStep: string;
}

export interface DemoTask {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
}

export interface DemoStockItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  minimum: number;
  unit: string;
}

export interface DemoMetric {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface DemoBar {
  label: string;
  value: number;
}

export interface AnalyticsPeriod {
  id: "semana" | "mes";
  label: string;
  metrics: DemoMetric[];
  bars: DemoBar[];
}

const NEXT_STAGE: Record<CrmStage, CrmStage | null> = {
  nuevo: "contactado",
  contactado: "propuesta",
  propuesta: "ganado",
  ganado: null,
  pausado: "contactado",
};

export const stageLabels: Record<CrmStage, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  propuesta: "Propuesta",
  ganado: "Ganado",
  pausado: "Pausado",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  lista: "Lista",
};

export function nextStage(stage: CrmStage): CrmStage | null {
  return NEXT_STAGE[stage];
}

export function isLowStock(stock: number, minimum: number): boolean {
  return stock <= minimum;
}

export function clientsFor(templateKey: SectorTemplateKey): DemoClient[] {
  if (templateKey === "industrial") {
    return [
      { id: "c1", name: "Cuenta demostración Andes", account: "Obra ejemplo Norte", stage: "nuevo", nextStep: "Confirmar alcance" },
      { id: "c2", name: "Cuenta demostración Taller", account: "Pedido muestra 14", stage: "contactado", nextStep: "Enviar cotización" },
      { id: "c3", name: "Cuenta demostración Lámina", account: "Marco de acero", stage: "propuesta", nextStep: "Revisar plazos" },
      { id: "c4", name: "Cuenta demostración Puerto", account: "Repuestos de línea", stage: "pausado", nextStep: "Retomar en dos semanas" },
    ];
  }
  return [
    { id: "c1", name: "Cuenta demostración Norte", account: "Propuesta de diagnóstico", stage: "nuevo", nextStep: "Agendar conversación" },
    { id: "c2", name: "Cuenta demostración Estudio", account: "Acompañamiento mensual", stage: "contactado", nextStep: "Enviar alcance" },
    { id: "c3", name: "Cuenta demostración Roble", account: "Renovación anual", stage: "propuesta", nextStep: "Resolver dudas" },
    { id: "c4", name: "Cuenta demostración Valle", account: "Taller interno", stage: "pausado", nextStep: "Escribir de nuevo" },
  ];
}

export function tasksFor(templateKey: SectorTemplateKey): DemoTask[] {
  if (templateKey === "industrial") {
    return [
      { id: "t1", title: "Conciliar la orden de compra 204", owner: "Administración", status: "pendiente" },
      { id: "t2", title: "Revisar la factura del proveedor de gas", owner: "Planta", status: "en_curso" },
      { id: "t3", title: "Cerrar el parte de la semana", owner: "Taller", status: "pendiente" },
      { id: "t4", title: "Archivar el certificado del lote 18", owner: "Calidad", status: "lista" },
    ];
  }
  return [
    { id: "t1", title: "Emitir la cuenta de cobro de marzo", owner: "Administración", status: "pendiente" },
    { id: "t2", title: "Revisar el contrato de la cuenta Roble", owner: "Legal", status: "en_curso" },
    { id: "t3", title: "Pedir los insumos de la entrega", owner: "Operación", status: "pendiente" },
    { id: "t4", title: "Confirmar la agenda de la próxima visita", owner: "Coordinación", status: "lista" },
  ];
}

export function stockFor(templateKey: SectorTemplateKey): DemoStockItem[] {
  if (templateKey === "industrial") {
    return [
      { id: "s1", sku: "DEMO-AC-12", name: "Acero de ejemplo 12 mm", stock: 18, minimum: 20, unit: "barras" },
      { id: "s2", sku: "DEMO-EL-04", name: "Electrodo de ejemplo", stock: 40, minimum: 15, unit: "cajas" },
      { id: "s3", sku: "DEMO-DI-02", name: "Disco de corte de ejemplo", stock: 6, minimum: 12, unit: "unidades" },
      { id: "s4", sku: "DEMO-PI-09", name: "Pintura de ejemplo", stock: 9, minimum: 4, unit: "galones" },
    ];
  }
  return [
    { id: "s1", sku: "DEMO-CU-01", name: "Cuaderno de entrega", stock: 12, minimum: 20, unit: "unidades" },
    { id: "s2", sku: "DEMO-LI-03", name: "Licencia de ejemplo", stock: 8, minimum: 8, unit: "puestos" },
    { id: "s3", sku: "DEMO-KI-02", name: "Kit de bienvenida", stock: 25, minimum: 10, unit: "kits" },
    { id: "s4", sku: "DEMO-IM-07", name: "Insumo de impresión", stock: 2, minimum: 5, unit: "cajas" },
  ];
}

export function analyticsFor(templateKey: SectorTemplateKey): AnalyticsPeriod[] {
  const commercial = templateKey === "industrial" ? "Pedidos sin seguimiento" : "Propuestas sin seguimiento";
  const stock = templateKey === "industrial" ? "Materiales bajo mínimo" : "Insumos bajo mínimo";
  return [
    {
      id: "semana",
      label: "Esta semana",
      metrics: [
        { id: "m1", label: commercial, value: "7", note: "Cifra ficticia de la semana" },
        { id: "m2", label: "Tareas vencidas", value: "4", note: "Cifra ficticia de la semana" },
        { id: "m3", label: stock, value: "2", note: "Cifra ficticia de la semana" },
        { id: "m4", label: "Registros sin actualizar", value: "5", note: "Cifra ficticia de la semana" },
      ],
      bars: [
        { label: "Comercial", value: 7 },
        { label: "Administración", value: 4 },
        { label: "Existencias", value: 2 },
        { label: "Datos", value: 5 },
      ],
    },
    {
      id: "mes",
      label: "Último mes",
      metrics: [
        { id: "m1", label: commercial, value: "19", note: "Cifra ficticia del mes" },
        { id: "m2", label: "Tareas vencidas", value: "11", note: "Cifra ficticia del mes" },
        { id: "m3", label: stock, value: "6", note: "Cifra ficticia del mes" },
        { id: "m4", label: "Registros sin actualizar", value: "14", note: "Cifra ficticia del mes" },
      ],
      bars: [
        { label: "Comercial", value: 19 },
        { label: "Administración", value: 11 },
        { label: "Existencias", value: 6 },
        { label: "Datos", value: 14 },
      ],
    },
  ];
}
