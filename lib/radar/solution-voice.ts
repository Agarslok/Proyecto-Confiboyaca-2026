import type { SolutionKind } from "@/lib/radar/solution";
import type { IndustryId } from "@/lib/radar/types";

/* ============================================================================
   Texto del hueco según la actividad del negocio.

   Un hotel reserva habitación. Una experiencia no habla de habitaciones.
   Un restaurante reserva mesa. Una cita es una cita. Campo, mina y tienda
   toman un pedido con fecha, no una visita.
   ========================================================================== */

type GuideStep = { title: string; detail: string; outcome?: string };

type GuideBit = { title: string; change: string; steps: GuideStep[] };

type TableVoice = {
  visitorTitle: string;
  businessChange: string;
  submitLabel: string;
  columns: string[];
  rows: string[][];
};

type ChoiceVoice = { label: string; detail: string; price: number };

export type SolutionVoice = {
  hint: string;
  agenda: {
    visitorTitle: string;
    businessChange: string;
    submitLabel: string;
    dateLabel: string;
    partyLabel: string;
    partyMin: number;
    partyMax: number;
    choices: ChoiceVoice[];
  };
  registro: TableVoice;
  inventario: TableVoice;
  solicitudes: TableVoice;
  guides: Partial<Record<SolutionKind, GuideBit>>;
};

type LensId =
  | "hotel"
  | "plan"
  | "entrada"
  | "experiencia"
  | "evento"
  | "traslado"
  | "mesa"
  | "alimento"
  | "cita"
  | "visita"
  | "tienda"
  | "mostrador"
  | "muestra"
  | "asesoria"
  | "campo"
  | "mineral"
  | "despacho"
  | "obra"
  | "taller"
  | "general";

const LENS_OF: Record<string, LensId> = {
  "turismo-hotel": "hotel",
  "turismo-agencia": "plan",
  "turismo-atraccion": "entrada",
  "turismo-experiencias": "experiencia",
  "turismo-eventos": "evento",
  "turismo-transporte": "traslado",
  "alimentos-restaurante": "mesa",
  "alimentos-catering": "evento",
  "alimentos-produccion": "alimento",
  "alimentos-bebidas": "alimento",
  "alimentos-venta": "alimento",
  "alimentos-domicilios": "alimento",
  "salud-ips": "cita",
  "salud-laboratorio": "muestra",
  "salud-estetica": "cita",
  "salud-deporte": "cita",
  "salud-farmacia": "mostrador",
  "salud-hogar": "visita",
  "servicios-consultoria": "asesoria",
  "servicios-financieros": "cita",
  "servicios-software": "cita",
  "servicios-educacion": "cita",
  "servicios-comunicacion": "cita",
  "servicios-bpo": "cita",
  "construccion-diseno": "cita",
  "construccion-inmobiliaria": "visita",
  "construccion-mantenimiento": "visita",
  "madera-instalacion": "visita",
  "moda-textil": "tienda",
  "moda-confeccion": "tienda",
  "moda-calzado": "tienda",
  "moda-compraventa": "tienda",
  "moda-online": "tienda",
  "moda-mayorista": "tienda",
  "comercio-fisica": "tienda",
  "comercio-autoservicio": "tienda",
  "comercio-online": "tienda",
  "comercio-marketplace": "tienda",
  "comercio-mayorista": "tienda",
  "comercio-posventa": "taller",
  "agro-primaria": "campo",
  "agro-poscosecha": "campo",
  "agro-transformacion": "campo",
  "agro-insumos": "campo",
  "agro-exportacion": "campo",
  "agro-acopio": "campo",
  "pecuaria-bovinos": "campo",
  "pecuaria-porcinos": "campo",
  "pecuaria-aves": "campo",
  "pecuaria-piscicultura": "campo",
  "pecuaria-derivados": "campo",
  "pecuaria-comercial": "campo",
  "mineria-extraccion": "mineral",
  "mineria-beneficio": "mineral",
  "mineria-comercio": "mineral",
  "mineria-energia": "despacho",
  "mineria-servicios": "obra",
  "mineria-transporte": "despacho",
  "transporte-carga": "despacho",
  "transporte-mensajeria": "despacho",
  "transporte-pasajeros": "traslado",
  "transporte-bodegaje": "despacho",
  "transporte-comercio-ext": "despacho",
  "transporte-operador": "despacho",
  "construccion-obra": "obra",
  "construccion-instalaciones": "obra",
  "construccion-materiales": "campo",
  "manufactura-planta": "taller",
  "manufactura-taller": "taller",
  "manufactura-maquila": "taller",
  "manufactura-compras": "taller",
  "manufactura-b2b": "taller",
  "manufactura-posventa": "visita",
  "madera-bosque": "campo",
  "madera-aserradero": "taller",
  "madera-carpinteria": "taller",
  "madera-deposito": "tienda",
  "madera-estructuras": "obra",
};

const INDUSTRY_LENS: Partial<Record<IndustryId, LensId>> = {
  turismo: "hotel",
  alimentos: "alimento",
  salud: "cita",
  moda: "tienda",
  comercio: "tienda",
  agro: "campo",
  pecuaria: "campo",
  mineria: "mineral",
  transporte: "despacho",
  construccion: "obra",
  manufactura: "taller",
  madera: "taller",
  servicios: "cita",
};

function guiasDeOperacion(cosa: string, quien: string, stock: string): SolutionVoice["guides"] {
  return {
    registro: {
      title: `Cómo dejar cada ${cosa} por escrito`,
      change: `Cada ${cosa} queda el mismo día, con cantidad y ${quien}.`,
      steps: [
        { title: "Anota en el momento", detail: `Cuando entra o sale un ${cosa}, se escribe antes de cerrar el turno.` },
        { title: "Usa siempre las mismas columnas", detail: `Qué fue, cuánto y para qué ${quien}. Si falta un dato, se deja en blanco.` },
        { title: "Cierra con la lista", detail: "El total del día sale de esa lista, no de la memoria.", outcome: "El cuaderno deja de ser la única copia." },
      ],
    },
    inventario: {
      title: `Cómo saber qué ${stock} queda`,
      change: `Las existencias de ${stock} bajan con cada salida y avisan al llegar al mínimo.`,
      steps: [
        { title: "Define el mínimo", detail: `Cada ${stock} tiene una cantidad por debajo de la cual hay que reponer.` },
        { title: "Descuenta al salir", detail: "Toda venta o despacho baja esa cantidad el mismo día." },
        { title: "Avisa al mínimo", detail: "Ese aviso reemplaza la revisión a ojo del fin de semana.", outcome: "Se ve qué se agota y qué no se mueve." },
      ],
    },
    solicitudes: {
      title: `Cómo no perder un ${cosa}`,
      change: `Cada ${cosa} queda con número y estado, fuera del chat.`,
      steps: [
        { title: "Entra con número", detail: "Lo que hoy llega por WhatsApp se anota con un número, en el momento." },
        { title: "Cambia el estado", detail: "Recibido, en curso o listo. Una sola persona actualiza ese estado." },
        { title: "Revisa lo que se repite", detail: "A la semana se ve qué piden más y qué quedó sin respuesta.", outcome: "Ningún pedido depende de buscar en el chat." },
      ],
    },
    merma: {
      title: `Cómo ver lo que se pierde de ${stock}`,
      change: `La diferencia entre lo producido y lo que sí salió de ${stock} queda escrita cada día.`,
      steps: [
        { title: "Anota lo producido", detail: "Al terminar la jornada, apunta cuánto quedó listo." },
        { title: "Anota lo que salió", detail: "Al lado, lo que se vendió o se despachó ese día." },
        { title: "Mira la diferencia", detail: "Esa diferencia es la merma. Al día siguiente se produce con ese número.", outcome: "La merma deja de ser un cálculo aproximado." },
      ],
    },
    clientes: {
      title: `Cómo saber qué ${quien} vuelve`,
      change: `Cada ${quien} queda una sola vez y se puede ver quién volvió a comprar.`,
      steps: [
        { title: "Pide autorización", detail: `Antes de guardar a un ${quien}, pregunta si puedes escribirle.` },
        { title: "Un registro por persona", detail: "Si ya existe, se actualiza. No se abre otro con el mismo nombre." },
        { title: "Mira quién volvió", detail: "Al cierre del mes se ve quién compró otra vez y quién no." },
      ],
    },
  };
}

function agenda(
  visitorTitle: string,
  businessChange: string,
  submitLabel: string,
  dateLabel: string,
  partyLabel: string,
  partyMax: number,
  choices: ChoiceVoice[],
): SolutionVoice["agenda"] {
  return { visitorTitle, businessChange, submitLabel, dateLabel, partyLabel, partyMin: 1, partyMax, choices };
}

function tabla(
  visitorTitle: string,
  businessChange: string,
  submitLabel: string,
  columns: string[],
  rows: string[][],
): TableVoice {
  return { visitorTitle, businessChange, submitLabel, columns, rows };
}

const LENSES: Record<LensId, SolutionVoice> = {
  hotel: {
    hint: "Es un alojamiento: reserva de habitación o plan de estadía. No hables de mesa, cita médica ni pedido de mercancía.",
    agenda: agenda(
      "Haz tu reserva aquí",
      "Cada reserva queda con llegada, habitación y valor. Se deja de armar por WhatsApp.",
      "Confirmar reserva",
      "Llegada",
      "Huéspedes",
      8,
      [
        { label: "Habitación doble", detail: "Cama doble o dos sencillas", price: 180000 },
        { label: "Suite", detail: "Sala y vista al patio", price: 260000 },
        { label: "Plan fin de semana", detail: "Dos noches con desayuno", price: 420000 },
      ],
    ),
    registro: tabla(
      "Cada estadía queda registrada",
      "Huésped, habitación y noches quedan en la misma lista. El cierre no sale de un cuaderno.",
      "Registrar estadía",
      ["Huésped", "Habitación", "Noches", "Estado"],
      [
        ["Familia Moreno", "Habitación doble", "2", "Confirmada"],
        ["Agencia Viajes Sol", "Suite", "3", "En casa"],
        ["Huésped de paso", "Plan fin de semana", "2", "Por llegar"],
      ],
    ),
    inventario: tabla(
      "Mira qué habitaciones hay",
      "Cada tipo de habitación muestra cupos libres y avisa cuando el hotel se llena.",
      "Consultar cupos",
      ["Habitación", "Libres", "Mínimo"],
      [
        ["Habitación doble", "6", "2"],
        ["Suite", "2", "1"],
        ["Plan fin de semana", "4", "1"],
      ],
    ),
    solicitudes: tabla(
      "Cuéntanos tu reserva especial",
      "Un grupo, una luna de miel o un evento queda con número y estado, fuera del chat.",
      "Enviar solicitud",
      ["Solicitud", "Detalle", "Estado"],
      [
        ["SOL-1042", "Grupo de 12, dos noches", "Recibida"],
        ["SOL-1043", "Decoración de aniversario", "En curso"],
        ["SOL-1044", "Late check-out", "Por confirmar"],
      ],
    ),
    guides: {
      registro: {
        title: "Cómo dejar cada estadía por escrito",
        change: "Cada huésped queda con habitación, noches y estado el mismo día.",
        steps: [
          { title: "Anota al reservar", detail: "Nombre, habitación, llegada y noches se escriben cuando se confirma, no al final de la semana." },
          { title: "Usa siempre las mismas columnas", detail: "Si falta un dato, se deja en blanco. No se abre otro cuaderno para el fin de semana." },
          { title: "Cierra con la ocupación", detail: "Las noches vendidas salen de esa lista.", outcome: "Se ve qué habitación se llenó y cuál quedó libre." },
        ],
      },
      inventario: {
        title: "Cómo saber qué habitación queda",
        change: "Los cupos bajan con cada reserva y avisan cuando un tipo de habitación se agota.",
        steps: [
          { title: "Define el cupo", detail: "Cada tipo de habitación tiene un número real de puertas, no un estimado." },
          { title: "Descuenta al reservar", detail: "Una reserva confirmada baja ese cupo el mismo día." },
          { title: "Avisa al llenarse", detail: "Ese aviso evita prometer una habitación que ya no está.", outcome: "La disponibilidad deja de vivir en el chat." },
        ],
      },
      solicitudes: {
        title: "Cómo no perder una reserva especial",
        change: "Cada pedido especial queda con número y estado, fuera de WhatsApp.",
        steps: [
          { title: "Entra con número", detail: "Grupo, decoración o cambio de hora se anota en el momento." },
          { title: "Cambia el estado", detail: "Recibida, en curso o lista. Una sola persona lo actualiza." },
          { title: "Revisa lo que se repite", detail: "A la semana se ve qué piden los huéspedes además de la habitación.", outcome: "Nada depende de buscar el mensaje." },
        ],
      },
      clientes: {
        title: "Cómo saber qué huésped vuelve",
        change: "Cada huésped queda una sola vez y se puede ver quién reservó otra vez.",
        steps: [
          { title: "Pide autorización", detail: "Antes de guardar a alguien, pregunta si puedes escribirle." },
          { title: "Un registro por persona", detail: "Si ya se hospedó, se actualiza. No se abre otra ficha con el mismo nombre." },
          { title: "Mira quién volvió", detail: "Al cierre del mes se ve quién reservó de nuevo." },
        ],
      },
    },
  },
  plan: {
    hint: "Es una agencia o un operador de planes. Habla de planes, salidas y viajeros. No menciones habitaciones ni mesas.",
    agenda: agenda(
      "Arma tu plan aquí",
      "Cada plan queda con fecha de salida, viajeros y valor. Se deja de cotizar solo por chat.",
      "Confirmar plan",
      "Salida",
      "Viajeros",
      12,
      [
        { label: "Villa de Leyva, un día", detail: "Pueblo, almuerzo y regreso", price: 145000 },
        { label: "Ruta del café", detail: "Finca, beneficio y cata", price: 190000 },
        { label: "Laguna, fin de semana", detail: "Dos días con transporte", price: 320000 },
      ],
    ),
    registro: tabla(
      "Cada plan vendido queda registrado",
      "Viajero, plan y fecha de salida quedan en la misma lista.",
      "Registrar plan",
      ["Viajero", "Plan", "Personas", "Estado"],
      [
        ["Familia Moreno", "Villa de Leyva, un día", "4", "Confirmado"],
        ["Colegio San Martín", "Ruta del café", "18", "Por salir"],
        ["Agencia del Norte", "Laguna, fin de semana", "8", "Cotizado"],
      ],
    ),
    inventario: tabla(
      "Mira qué planes tienen cupo",
      "Cada salida muestra cupos libres y avisa cuando el grupo se llena.",
      "Consultar cupos",
      ["Plan", "Cupos", "Mínimo"],
      [
        ["Villa de Leyva, un día", "12", "4"],
        ["Ruta del café", "8", "4"],
        ["Laguna, fin de semana", "6", "2"],
      ],
    ),
    solicitudes: tabla(
      "Pide un plan a tu medida",
      "Cada cotización queda con número y estado. No se queda solo en el chat.",
      "Enviar solicitud",
      ["Solicitud", "Plan", "Estado"],
      [
        ["SOL-1042", "Grupo escolar, 20 personas", "Recibida"],
        ["SOL-1043", "Aniversario en Villa de Leyva", "En curso"],
        ["SOL-1044", "Plan privado de dos días", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("plan", "viajero", "cupo de la salida"),
  },
  entrada: {
    hint: "Es un atractivo con taquilla. Habla de entradas y fecha de visita. No menciones habitaciones.",
    agenda: agenda(
      "Compra tu entrada aquí",
      "Cada entrada queda con fecha y cupo. Se deja la fila de WhatsApp.",
      "Comprar entrada",
      "Día de visita",
      "Personas",
      10,
      [
        { label: "Entrada general", detail: "Acceso al atractivo", price: 25000 },
        { label: "Entrada con guía", detail: "Recorrido de una hora", price: 45000 },
        { label: "Combo familiar", detail: "Hasta 4 personas", price: 80000 },
      ],
    ),
    registro: tabla(
      "Cada entrada queda registrada",
      "Fecha, tipo de entrada y personas salen de la lista, no de la taquilla de memoria.",
      "Registrar entrada",
      ["Visitante", "Entrada", "Personas", "Estado"],
      [
        ["Familia Moreno", "Combo familiar", "4", "Pagada"],
        ["Colegio San Martín", "Entrada con guía", "20", "Reservada"],
        ["Visitante de paso", "Entrada general", "1", "Por pagar"],
      ],
    ),
    inventario: tabla(
      "Mira el cupo del día",
      "Cada tipo de entrada muestra cupos y avisa cuando la jornada se llena.",
      "Consultar cupo",
      ["Entrada", "Cupos", "Mínimo"],
      [
        ["Entrada general", "80", "10"],
        ["Entrada con guía", "20", "4"],
        ["Combo familiar", "15", "2"],
      ],
    ),
    solicitudes: tabla(
      "Pide una visita de grupo",
      "Colegios y grupos quedan con número y estado, fuera del chat.",
      "Enviar solicitud",
      ["Solicitud", "Grupo", "Estado"],
      [
        ["SOL-1042", "Colegio, 30 estudiantes", "Recibida"],
        ["SOL-1043", "Empresa, jornada de integración", "En curso"],
        ["SOL-1044", "Guía en inglés", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("entrada", "visitante", "cupo del día"),
  },
  experiencia: {
    hint: "Es guianza o una experiencia local. Habla de la salida, el cupo y el punto de encuentro. No menciones habitaciones ni reservas de hotel.",
    agenda: agenda(
      "Reserva tu experiencia aquí",
      "Cada salida queda con fecha, cupo y punto de encuentro. Se deja de confirmar por chat.",
      "Reservar experiencia",
      "Fecha de salida",
      "Personas",
      12,
      [
        { label: "Caminata al páramo", detail: "Medio día con guía local", price: 90000 },
        { label: "Avistamiento de aves", detail: "Salida al amanecer", price: 110000 },
        { label: "Recorrido gastronómico", detail: "Tres paradas del pueblo", price: 130000 },
      ],
    ),
    registro: tabla(
      "Cada salida queda registrada",
      "Experiencia, fecha y cupo quedan en la misma lista.",
      "Registrar salida",
      ["Viajero", "Experiencia", "Cupos", "Estado"],
      [
        ["Familia Moreno", "Caminata al páramo", "4", "Confirmada"],
        ["Grupo Andino", "Avistamiento de aves", "6", "Por salir"],
        ["Ana Gómez", "Recorrido gastronómico", "2", "Lista de espera"],
      ],
    ),
    inventario: tabla(
      "Mira qué salidas tienen cupo",
      "Cada experiencia muestra lugares libres y avisa cuando el grupo se cierra.",
      "Consultar cupos",
      ["Experiencia", "Cupos", "Mínimo"],
      [
        ["Caminata al páramo", "8", "3"],
        ["Avistamiento de aves", "6", "2"],
        ["Recorrido gastronómico", "10", "4"],
      ],
    ),
    solicitudes: tabla(
      "Pide una salida a tu medida",
      "Un grupo privado queda con número y estado, fuera del chat.",
      "Enviar solicitud",
      ["Solicitud", "Experiencia", "Estado"],
      [
        ["SOL-1042", "Caminata privada, 8 personas", "Recibida"],
        ["SOL-1043", "Aves al amanecer, familia", "En curso"],
        ["SOL-1044", "Recorrido en inglés", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("salida", "viajero", "cupo de la experiencia"),
  },
  evento: {
    hint: "Es un salón, un evento o un catering. Habla de fecha, aforo y montaje. No hables de habitación de hotel ni de mesa suelta de restaurante.",
    agenda: agenda(
      "Cotiza tu evento aquí",
      "Cada evento queda con fecha, aforo y espacio. Se deja de armar la cotización por chat.",
      "Enviar cotización",
      "Fecha del evento",
      "Invitados",
      20,
      [
        { label: "Salón medio día", detail: "Hasta 40 invitados", price: 0 },
        { label: "Salón día completo", detail: "Montaje y sonido básico", price: 0 },
        { label: "Menú para evento", detail: "Catering por persona", price: 45000 },
      ],
    ),
    registro: tabla(
      "Cada evento queda registrado",
      "Fecha, aforo y estado salen de la lista, no de una nota en el celular.",
      "Registrar evento",
      ["Cliente", "Evento", "Invitados", "Estado"],
      [
        ["Familia Moreno", "Salón medio día", "30", "Confirmado"],
        ["Empresa Andina", "Salón día completo", "80", "Cotizado"],
        ["Colegio San Martín", "Menú para evento", "40", "Por confirmar"],
      ],
    ),
    inventario: tabla(
      "Mira qué fechas siguen libres",
      "Cada espacio muestra disponibilidad y avisa cuando el día ya está tomado.",
      "Consultar fechas",
      ["Espacio", "Fechas libres", "Mínimo"],
      [
        ["Salón principal", "4", "1"],
        ["Terraza", "2", "1"],
        ["Menú para evento", "3", "1"],
      ],
    ),
    solicitudes: tabla(
      "Cuéntanos tu evento",
      "Cada cotización queda con número y estado. Nada se queda solo en el chat.",
      "Enviar solicitud",
      ["Solicitud", "Evento", "Estado"],
      [
        ["SOL-1042", "Matrimonio, 80 personas", "Recibida"],
        ["SOL-1043", "Grado, refrigerio", "En curso"],
        ["SOL-1044", "Reunión de empresa", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("evento", "cliente", "espacio"),
  },
  traslado: {
    hint: "Es transporte de personas o un tour en vehículo. Habla de ruta, fecha y pasajeros. No menciones habitaciones.",
    agenda: agenda(
      "Reserva tu traslado aquí",
      "Cada ruta queda con fecha, pasajeros y valor. Se deja de coordinar solo por chat.",
      "Confirmar traslado",
      "Fecha",
      "Pasajeros",
      16,
      [
        { label: "Traslado al aeropuerto", detail: "Tunja o Duitama, ida", price: 160000 },
        { label: "Tour en chiva", detail: "Medio día por el pueblo", price: 70000 },
        { label: "Día de laguna", detail: "Ida, espera y regreso", price: 95000 },
      ],
    ),
    registro: tabla(
      "Cada ruta queda registrada",
      "Pasajero, ruta y fecha quedan en la misma lista.",
      "Registrar ruta",
      ["Pasajero", "Ruta", "Personas", "Estado"],
      [
        ["Familia Moreno", "Día de laguna", "4", "Confirmada"],
        ["Hotel del Parque", "Traslado al aeropuerto", "2", "Por salir"],
        ["Agencia Sol", "Tour en chiva", "12", "Cotizada"],
      ],
    ),
    inventario: tabla(
      "Mira qué vehículos están libres",
      "Cada servicio muestra cupos y avisa cuando la flota del día se llena.",
      "Consultar cupos",
      ["Servicio", "Cupos", "Mínimo"],
      [
        ["Traslado al aeropuerto", "3", "1"],
        ["Tour en chiva", "1", "1"],
        ["Día de laguna", "2", "1"],
      ],
    ),
    solicitudes: tabla(
      "Pide una ruta a tu medida",
      "Cada cotización queda con número y estado, fuera del chat.",
      "Enviar solicitud",
      ["Solicitud", "Ruta", "Estado"],
      [
        ["SOL-1042", "Grupo al páramo, 15 personas", "Recibida"],
        ["SOL-1043", "Traslado nocturno", "En curso"],
        ["SOL-1044", "Varios días, agencia", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("ruta", "pasajero", "cupo del vehículo"),
  },
  mesa: {
    hint: "Es un restaurante. Habla de mesa, comensales y hora. No hables de habitación ni de un pedido de fábrica.",
    agenda: agenda(
      "Reserva tu mesa aquí",
      "Cada mesa queda con fecha, hora y comensales. Se deja de confirmar por WhatsApp.",
      "Reservar mesa",
      "Fecha",
      "Comensales",
      10,
      [
        { label: "Mesa en salón", detail: "Hasta 4 comensales", price: 0 },
        { label: "Mesa en terraza", detail: "Hasta 4, al aire libre", price: 0 },
        { label: "Mesa para grupo", detail: "De 5 a 10 comensales", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada mesa del día queda registrada",
      "Hora, mesa y comensales salen de la lista. El servicio no depende de la memoria del salón.",
      "Registrar mesa",
      ["Mesa", "Turno", "Comensales", "Estado"],
      [
        ["Salón 4", "Almuerzo", "2", "Sentados"],
        ["Terraza 1", "Cena", "4", "Reservada"],
        ["Grupo", "Almuerzo", "8", "Por llegar"],
      ],
    ),
    inventario: tabla(
      "Mira qué se puede servir hoy",
      "Cada plato muestra porciones y avisa cuando se acaba, antes de prometerlo en la carta.",
      "Consultar carta",
      ["Plato", "Porciones", "Mínimo"],
      [
        ["Ajiaco", "18", "6"],
        ["Trucha", "10", "4"],
        ["Postre de cuajada", "14", "4"],
      ],
    ),
    solicitudes: tabla(
      "Pide un menú o un evento",
      "Un cumpleaños o un menú especial queda con número y estado, fuera del chat.",
      "Enviar solicitud",
      ["Solicitud", "Pedido", "Estado"],
      [
        ["SOL-1042", "Cumpleaños, 15 personas", "Recibida"],
        ["SOL-1043", "Menú sin gluten", "En curso"],
        ["SOL-1044", "Almuerzo de empresa", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("mesa", "comensal", "plato del día"),
  },
  alimento: {
    hint: "Es producción o venta de alimentos, no un restaurante de mesas. Habla de pedido, entrega y lo que se elaboró. No pidas reservar una mesa.",
    agenda: agenda(
      "Haz tu pedido aquí",
      "Cada pedido queda con fecha de entrega y cantidad. Se deja el cuaderno del mostrador.",
      "Enviar pedido",
      "Entrega",
      "Unidades",
      20,
      [
        { label: "Almojábana", detail: "Por unidad, horneada del día", price: 2500 },
        { label: "Pan de yuca", detail: "Por unidad", price: 2000 },
        { label: "Torta de cuajada", detail: "Por encargo, un día antes", price: 38000 },
      ],
    ),
    registro: tabla(
      "Cada horneada queda registrada",
      "Lo elaborado, lo vendido y lo que sobra quedan por producto. La merma pasa a ser un número.",
      "Registrar el día",
      ["Producto", "Elaborado", "Sobra", "Cliente"],
      [
        ["Almojábana", "80", "6", "Cafetería El Puente"],
        ["Pan de yuca", "60", "4", "Marta Rojas"],
        ["Torta de cuajada", "8", "1", "Pedido por encargo"],
      ],
    ),
    inventario: tabla(
      "Mira qué queda para vender",
      "Cada producto baja con la venta y avisa cuando toca hornear o reponer.",
      "Consultar existencias",
      ["Producto", "Disponible", "Mínimo"],
      [
        ["Almojábana", "24", "12"],
        ["Pan de yuca", "18", "10"],
        ["Torta de cuajada", "3", "1"],
      ],
    ),
    solicitudes: tabla(
      "Deja tu pedido o tu encargo",
      "Cada encargo queda con número y fecha. No se queda solo en el chat.",
      "Enviar pedido",
      ["Número", "Pedido", "Estado"],
      [
        ["SOL-1042", "Torta de cuajada, sábado", "Recibida"],
        ["SOL-1043", "Almojábanas x 40", "En curso"],
        ["SOL-1044", "Desayuno para oficina", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("pedido", "cliente", "producto"),
  },
  cita: {
    hint: "Es una cita o un cupo de atención: consulta, sesión, clase o reunión. No hables de habitación, mesa ni pedido de mercancía.",
    agenda: agenda(
      "Agenda tu cita aquí",
      "Cada cita queda con fecha, hora y cupo. Se deja de armar por WhatsApp.",
      "Confirmar cita",
      "Fecha",
      "Personas",
      4,
      [
        { label: "Consulta general", detail: "30 minutos", price: 0 },
        { label: "Control", detail: "Seguimiento de 20 minutos", price: 0 },
        { label: "Valoración", detail: "Primera vez, 40 minutos", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada atención queda registrada",
      "Paciente o cliente, servicio y hora quedan en la misma lista.",
      "Registrar atención",
      ["Persona", "Servicio", "Hora", "Estado"],
      [
        ["Ana Torres", "Consulta general", "08:30", "Atendida"],
        ["Jorge Niño", "Control", "09:00", "En sala"],
        ["Pedro Castro", "Valoración", "10:00", "Por llegar"],
      ],
    ),
    inventario: tabla(
      "Mira qué cupos hay hoy",
      "Cada servicio muestra cupos libres y avisa cuando la agenda del día se llena.",
      "Consultar cupos",
      ["Servicio", "Cupos", "Mínimo"],
      [
        ["Consulta general", "8", "2"],
        ["Control", "6", "2"],
        ["Valoración", "4", "1"],
      ],
    ),
    solicitudes: tabla(
      "Solicita tu cita",
      "Cada solicitud queda con número y estado. Nadie depende de buscar el chat.",
      "Enviar solicitud",
      ["Número", "Motivo", "Estado"],
      [
        ["SOL-1042", "Control de la próxima semana", "Recibida"],
        ["SOL-1043", "Resultado de exámenes", "En curso"],
        ["SOL-1044", "Cambio de hora", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("cita", "paciente o cliente", "cupo de atención"),
  },
  visita: {
    hint: "Alguien del negocio se desplaza: visita técnica, domicilio o cita en el inmueble. No es una reserva de hotel ni un pedido de mostrador.",
    agenda: agenda(
      "Agenda tu visita aquí",
      "Cada visita queda con fecha, dirección y motivo. Se deja de cuadrar solo por chat.",
      "Confirmar visita",
      "Fecha",
      "Personas",
      4,
      [
        { label: "Visita técnica", detail: "Revisión en el sitio", price: 0 },
        { label: "Cotización en casa", detail: "Medidas y propuesta", price: 0 },
        { label: "Seguimiento", detail: "Segunda visita, más corta", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada visita queda registrada",
      "Fecha, motivo y estado salen de la lista, no del chat.",
      "Registrar visita",
      ["Cliente", "Motivo", "Zona", "Estado"],
      [
        ["Ana Torres", "Visita técnica", "Norte", "Hecha"],
        ["Obra Los Pinos", "Cotización en casa", "Centro", "Programada"],
        ["Pedro Castro", "Seguimiento", "Sur", "Por confirmar"],
      ],
    ),
    inventario: tabla(
      "Mira qué visitas caben esta semana",
      "Cada tipo de visita muestra cupos y avisa cuando la ruta del día se llena.",
      "Consultar cupos",
      ["Visita", "Cupos", "Mínimo"],
      [
        ["Visita técnica", "6", "1"],
        ["Cotización en casa", "4", "1"],
        ["Seguimiento", "5", "1"],
      ],
    ),
    solicitudes: tabla(
      "Pide una visita",
      "Cada solicitud queda con número, zona y estado.",
      "Enviar solicitud",
      ["Número", "Motivo", "Estado"],
      [
        ["SOL-1042", "Humedad en el baño", "Recibida"],
        ["SOL-1043", "Medidas para closet", "En curso"],
        ["SOL-1044", "Revisión de garantía", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("visita", "cliente", "cupo de la ruta"),
  },
  tienda: {
    hint: "Es una tienda o un catálogo. Habla de pedido, prenda o producto y fecha de entrega o recogida. No pidas agendar una visita ni reservar una habitación.",
    agenda: agenda(
      "Haz tu pedido aquí",
      "Cada pedido queda con prenda, cantidad y fecha. Se deja de anotar solo en el chat.",
      "Enviar pedido",
      "Entrega o recogida",
      "Prendas",
      12,
      [
        { label: "Camisa M azul", detail: "Tallas S a XL", price: 89900 },
        { label: "Jean 32", detail: "Tiro alto, varias tallas", price: 119900 },
        { label: "Chaqueta S negra", detail: "Stock de temporada", price: 159900 },
      ],
    ),
    registro: tabla(
      "Cada venta queda registrada",
      "Prenda, cantidad y cliente quedan en la misma lista. El cierre no sale de un cuaderno.",
      "Registrar venta",
      ["Prenda", "Cantidad", "Cliente", "Estado"],
      [
        ["Camisa M azul", "2", "Laura Gómez", "Pagada"],
        ["Jean 32", "1", "Almacén La 10", "Apartada"],
        ["Chaqueta S negra", "1", "Pedido en línea", "Por entregar"],
      ],
    ),
    inventario: tabla(
      "Mira qué hay en la tienda",
      "Cada prenda baja con la venta y avisa cuando una talla se agota.",
      "Consultar existencias",
      ["Prenda", "Disponible", "Mínimo"],
      [
        ["Camisa M azul", "8", "2"],
        ["Jean 32", "5", "2"],
        ["Chaqueta S negra", "3", "1"],
      ],
    ),
    solicitudes: tabla(
      "Aparta una talla o haz un pedido",
      "Cada apartado queda con número y estado. No se pierde en el chat.",
      "Enviar pedido",
      ["Número", "Pedido", "Estado"],
      [
        ["SOL-1042", "Jean 32, color negro", "Recibida"],
        ["SOL-1043", "Camisa para evento, 6 unidades", "En curso"],
        ["SOL-1044", "Cambio de talla", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("pedido", "cliente", "prenda"),
  },
  mostrador: {
    hint: "Es una farmacia o droguería. Habla de medicamento, fórmula y pedido para recoger. No hables de prendas, tallas ni de una cita médica.",
    agenda: agenda(
      "Pide el medicamento para recoger",
      "Cada pedido queda con producto y hora de recogida. La fórmula no se queda en un chat.",
      "Encargar",
      "Recogida",
      "Unidades",
      6,
      [
        { label: "Fórmula completa", detail: "Se alista para recoger en el día", price: 0 },
        { label: "Medicamento de mostrador", detail: "Una caja o un frasco", price: 0 },
        { label: "Pedido a domicilio", detail: "Sale con la ruta del día", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada venta queda registrada",
      "Medicamento, cantidad y cliente quedan en la misma lista. El cierre no sale de un cuaderno.",
      "Registrar venta",
      ["Producto", "Cantidad", "Cliente", "Estado"],
      [
        ["Acetaminofén 500 mg", "2 cajas", "Laura Gómez", "Entregada"],
        ["Losartán 50 mg", "1 caja", "Fórmula 1842", "Alistada"],
        ["Suero oral", "3", "Pedido en línea", "Por entregar"],
      ],
    ),
    inventario: tabla(
      "Mira qué hay en el mostrador",
      "Cada producto baja con la venta y avisa cuando toca pedir al distribuidor.",
      "Consultar existencias",
      ["Producto", "Existencias", "Mínimo"],
      [
        ["Acetaminofén 500 mg", "24", "8"],
        ["Losartán 50 mg", "6", "4"],
        ["Suero oral", "15", "6"],
      ],
    ),
    solicitudes: tabla(
      "Deja la fórmula o el pedido",
      "Cada pedido queda con número y estado. No se pierde entre mensajes.",
      "Enviar pedido",
      ["Número", "Pedido", "Estado"],
      [
        ["SOL-1042", "Fórmula de tensión, 30 días", "Recibida"],
        ["SOL-1043", "Acetaminofén para la oficina", "En curso"],
        ["SOL-1044", "Suero oral, 6 unidades", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("pedido", "cliente", "medicamento"),
  },
  muestra: {
    hint: "Es un laboratorio. Habla de toma de muestra, análisis y entrega de resultado. No hables de habitación ni de una consulta médica larga.",
    agenda: agenda(
      "Agenda la toma de muestra",
      "Cada cita queda con análisis, fecha y hora. El paciente no depende de una llamada.",
      "Confirmar toma",
      "Fecha",
      "Personas",
      4,
      [
        { label: "Toma en sede", detail: "Ayuno, 15 minutos", price: 0 },
        { label: "Toma a domicilio", detail: "Ruta de la mañana", price: 0 },
        { label: "Entrega de resultados", detail: "Pasa por la sede", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada análisis queda registrado",
      "Paciente, análisis y fecha quedan en la misma lista.",
      "Registrar análisis",
      ["Paciente", "Análisis", "Fecha", "Estado"],
      [
        ["Ana Torres", "Cuadro hemático", "Hoy", "En proceso"],
        ["Jorge Niño", "Glucosa", "Hoy", "Tomada"],
        ["Pedro Castro", "Perfil lipídico", "Mañana", "Por tomar"],
      ],
    ),
    inventario: tabla(
      "Mira qué cupos de toma hay",
      "Cada tipo de toma muestra cupos y avisa cuando la mañana se llena.",
      "Consultar cupos",
      ["Toma", "Cupos", "Mínimo"],
      [
        ["Toma en sede", "12", "2"],
        ["Toma a domicilio", "6", "1"],
        ["Entrega de resultados", "10", "1"],
      ],
    ),
    solicitudes: tabla(
      "Pide un resultado o una toma",
      "Cada solicitud queda con número y estado.",
      "Enviar solicitud",
      ["Número", "Solicitud", "Estado"],
      [
        ["SOL-1042", "Resultado de glucosa", "Recibida"],
        ["SOL-1043", "Toma a domicilio, norte", "En curso"],
        ["SOL-1044", "Copia de cuadro hemático", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("análisis", "paciente", "muestra"),
  },
  asesoria: {
    hint: "Es una consultoría o un estudio. Habla de reunión, visita y seguimiento. No hables de paciente, habitación ni de mercancía.",
    agenda: agenda(
      "Agenda la reunión",
      "Cada visita queda con tema, fecha y hora. Se deja de cuadrar solo por WhatsApp.",
      "Confirmar reunión",
      "Fecha",
      "Personas",
      6,
      [
        { label: "Primera reunión", detail: "45 minutos, en la sede o virtual", price: 0 },
        { label: "Visita al negocio", detail: "Recorrido de una hora", price: 0 },
        { label: "Seguimiento", detail: "Avance de 30 minutos", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada reunión queda registrada",
      "Cliente, tema y fecha quedan en la misma lista.",
      "Registrar reunión",
      ["Cliente", "Tema", "Fecha", "Estado"],
      [
        ["Taller Boyacá", "Primera reunión", "Lunes", "Hecha"],
        ["Finca del Alba", "Visita al negocio", "Martes", "Programada"],
        ["Panadería Carlitos", "Seguimiento", "Jueves", "Por confirmar"],
      ],
    ),
    inventario: tabla(
      "Mira qué horas hay esta semana",
      "Cada tipo de reunión muestra cupos y avisa cuando la semana se llena.",
      "Consultar cupos",
      ["Reunión", "Cupos", "Mínimo"],
      [
        ["Primera reunión", "4", "1"],
        ["Visita al negocio", "3", "1"],
        ["Seguimiento", "6", "1"],
      ],
    ),
    solicitudes: tabla(
      "Pide una reunión",
      "Cada solicitud queda con número, tema y estado.",
      "Enviar solicitud",
      ["Número", "Tema", "Estado"],
      [
        ["SOL-1042", "Diagnóstico inicial", "Recibida"],
        ["SOL-1043", "Visita a la planta", "En curso"],
        ["SOL-1044", "Revisión del informe", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("reunión", "cliente", "visita"),
  },
  campo: {
    hint: "Es finca, ganado, cosecha o insumos del campo. Habla de pedido, lote y fecha de entrega. No pidas agendar una visita al predio como si fuera un hotel.",
    agenda: agenda(
      "Haz tu pedido aquí",
      "Cada pedido queda con producto, cantidad y fecha de entrega. El comprador no depende de una llamada.",
      "Enviar pedido",
      "Entrega",
      "Cantidad",
      20,
      [
        { label: "Leche cruda", detail: "Por litro, recogida del día", price: 1800 },
        { label: "Queso campesino", detail: "Por libra", price: 12000 },
        { label: "Novillo gordo", detail: "Por cabeza, con pesaje", price: 2800000 },
      ],
    ),
    registro: tabla(
      "Cada despacho queda registrado",
      "Producto, cantidad y comprador quedan el mismo día. El cuaderno de la finca deja de ser la única copia.",
      "Registrar despacho",
      ["Producto", "Cantidad", "Comprador", "Estado"],
      [
        ["Leche cruda", "120 L", "Lácteos El Roble", "Entregada"],
        ["Queso campesino", "8 lb", "Carnes Andinas", "Por salir"],
        ["Novillo gordo", "1", "Feria del jueves", "Pesado"],
      ],
    ),
    inventario: tabla(
      "Mira qué hay para despachar",
      "Cada producto baja con la salida y avisa cuando toca reponer o dejar de vender.",
      "Consultar existencias",
      ["Producto", "Disponible", "Mínimo"],
      [
        ["Leche cruda", "80 L", "40 L"],
        ["Queso campesino", "12 lb", "4 lb"],
        ["Novillo gordo", "3", "1"],
      ],
    ),
    solicitudes: tabla(
      "Deja tu pedido de compra",
      "Cada pedido de un comprador queda con número y estado, fuera del chat.",
      "Enviar pedido",
      ["Número", "Pedido", "Estado"],
      [
        ["SOL-1042", "Leche, 200 litros semanales", "Recibida"],
        ["SOL-1043", "Queso para tienda", "En curso"],
        ["SOL-1044", "Novillo para el viernes", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("despacho", "comprador", "lote"),
  },
  mineral: {
    hint: "Es mina, beneficio o venta de mineral. Habla de pedido, toneladas y fecha de despacho. No pidas agendar una visita a la mina.",
    agenda: agenda(
      "Haz tu pedido aquí",
      "Cada pedido queda con mineral, toneladas y fecha de despacho. Se deja de cerrar solo por teléfono.",
      "Enviar pedido",
      "Despacho",
      "Toneladas",
      20,
      [
        { label: "Carbón térmico", detail: "Por tonelada, en boca de mina", price: 180000 },
        { label: "Carbón coquizable", detail: "Por tonelada, según calidad", price: 240000 },
        { label: "Coque", detail: "Por tonelada, puesto en planta", price: 310000 },
      ],
    ),
    registro: tabla(
      "Cada despacho queda registrado",
      "Mineral, toneladas y comprador quedan en la misma lista.",
      "Registrar despacho",
      ["Mineral", "Toneladas", "Comprador", "Estado"],
      [
        ["Carbón térmico", "20", "Acerías Paz del Río", "Despachado"],
        ["Carbón coquizable", "12", "Coquizadora del Norte", "En patio"],
        ["Coque", "8", "Pedido semanal", "Por cargar"],
      ],
    ),
    inventario: tabla(
      "Mira qué mineral hay en patio",
      "Cada producto baja con el despacho y avisa cuando el patio llega al mínimo.",
      "Consultar patio",
      ["Mineral", "Toneladas", "Mínimo"],
      [
        ["Carbón térmico", "40", "15"],
        ["Carbón coquizable", "22", "10"],
        ["Coque", "9", "4"],
      ],
    ),
    solicitudes: tabla(
      "Solicita una oferta",
      "Cada oferta queda con número, mineral y estado. No se queda solo en la llamada.",
      "Enviar solicitud",
      ["Número", "Oferta", "Estado"],
      [
        ["SOL-1042", "20 t de carbón térmico", "Recibida"],
        ["SOL-1043", "Coque, entrega mensual", "En curso"],
        ["SOL-1044", "Ficha de calidad del lote", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("despacho", "comprador", "mineral en patio"),
  },
  despacho: {
    hint: "Es logística o despacho. Habla de envío, ruta y fecha. No hables de habitación ni de cita médica.",
    agenda: agenda(
      "Programa tu envío aquí",
      "Cada envío queda con ruta, fecha y carga. Se deja de coordinar solo por chat.",
      "Programar envío",
      "Recogida",
      "Bultos",
      20,
      [
        { label: "Tunja–Bogotá", detail: "Carga del día", price: 180000 },
        { label: "Duitama, mismo día", detail: "Paquete urbano", price: 25000 },
        { label: "Sogamoso, programado", detail: "Ruta de la tarde", price: 70000 },
      ],
    ),
    registro: tabla(
      "Cada envío queda registrado",
      "Ruta, carga y estado salen de la lista, no de un grupo de WhatsApp.",
      "Registrar envío",
      ["Envío", "Ruta", "Carga", "Estado"],
      [
        ["ENV-220", "Tunja–Bogotá", "8 bultos", "En ruta"],
        ["ENV-221", "Duitama", "2 cajas", "Entregado"],
        ["ENV-222", "Sogamoso", "1 estiba", "Por recoger"],
      ],
    ),
    inventario: tabla(
      "Mira qué cupo de carga hay",
      "Cada ruta muestra espacio libre y avisa cuando el vehículo se llena.",
      "Consultar cupo",
      ["Ruta", "Cupo", "Mínimo"],
      [
        ["Tunja–Bogotá", "4", "1"],
        ["Duitama", "10", "2"],
        ["Sogamoso", "3", "1"],
      ],
    ),
    solicitudes: tabla(
      "Pide una recogida",
      "Cada solicitud queda con número y estado, fuera del chat.",
      "Enviar solicitud",
      ["Número", "Envío", "Estado"],
      [
        ["SOL-1042", "Estiba a Bogotá, viernes", "Recibida"],
        ["SOL-1043", "Recogida en la tarde", "En curso"],
        ["SOL-1044", "Ruta nueva, Semana", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("envío", "cliente", "cupo de la ruta"),
  },
  obra: {
    hint: "Es obra, instalación o un servicio en sitio. Habla de cotización, frente y fecha. No hables de habitación de hotel.",
    agenda: agenda(
      "Pide tu cotización aquí",
      "Cada obra o servicio queda con fecha y alcance. Se deja de cerrar solo por chat.",
      "Enviar cotización",
      "Fecha de inicio",
      "Frentes",
      6,
      [
        { label: "Visita de obra", detail: "Medidas y alcance", price: 0 },
        { label: "Instalación", detail: "Un frente, un día", price: 0 },
        { label: "Mantenimiento", detail: "Revisión programada", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada frente queda registrado",
      "Obra, material o servicio y estado quedan en la misma lista.",
      "Registrar frente",
      ["Obra", "Concepto", "Cantidad", "Estado"],
      [
        ["Torres del Lago", "Cemento 50 kg", "40", "En obra"],
        ["Casa Becerra", "Instalación", "1", "Programada"],
        ["Local del centro", "Mantenimiento", "1", "Por cotizar"],
      ],
    ),
    inventario: tabla(
      "Mira qué material hay para la obra",
      "Cada material baja con la salida a obra y avisa al llegar al mínimo.",
      "Consultar material",
      ["Material", "Disponible", "Mínimo"],
      [
        ["Cemento 50 kg", "80", "20"],
        ["Varilla 1/2", "30", "10"],
        ["Bloque #5", "200", "50"],
      ],
    ),
    solicitudes: tabla(
      "Deja tu solicitud de obra",
      "Cada cotización queda con número y estado, fuera del chat.",
      "Enviar solicitud",
      ["Número", "Solicitud", "Estado"],
      [
        ["SOL-1042", "Cerramiento, 40 metros", "Recibida"],
        ["SOL-1043", "Instalación eléctrica", "En curso"],
        ["SOL-1044", "Reparación de cubierta", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("frente", "cliente", "material"),
  },
  taller: {
    hint: "Es taller, planta o un encargo a medida. Habla de pedido, pieza y fecha de entrega. No pidas agendar una visita turística.",
    agenda: agenda(
      "Haz tu pedido aquí",
      "Cada pedido queda con pieza, cantidad y fecha de entrega. Se deja de anotar solo en el chat.",
      "Enviar pedido",
      "Entrega",
      "Piezas",
      20,
      [
        { label: "Soporte B-40", detail: "Serie corta", price: 45000 },
        { label: "Pieza A-120", detail: "Según plano", price: 80000 },
        { label: "Lámina C-8", detail: "Corte a medida", price: 32000 },
      ],
    ),
    registro: tabla(
      "Cada orden queda registrada",
      "Pieza, cantidad y cliente quedan en la misma lista. El cierre sale de ahí.",
      "Registrar orden",
      ["Orden", "Pieza", "Cantidad", "Estado"],
      [
        ["OP-120", "Soporte B-40", "20", "En proceso"],
        ["OP-121", "Pieza A-120", "8", "Lista"],
        ["OP-122", "Lámina C-8", "15", "Por cortar"],
      ],
    ),
    inventario: tabla(
      "Mira qué hay para entregar",
      "Cada pieza baja con la salida y avisa cuando el stock llega al mínimo.",
      "Consultar existencias",
      ["Pieza", "Disponible", "Mínimo"],
      [
        ["Soporte B-40", "30", "10"],
        ["Pieza A-120", "6", "4"],
        ["Lámina C-8", "18", "6"],
      ],
    ),
    solicitudes: tabla(
      "Deja tu orden de trabajo",
      "Cada pedido queda con número y estado, fuera del chat.",
      "Enviar pedido",
      ["Número", "Pedido", "Estado"],
      [
        ["SOL-1042", "20 soportes para el viernes", "Recibida"],
        ["SOL-1043", "Corte según plano", "En curso"],
        ["SOL-1044", "Repuesto de garantía", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("orden", "cliente", "pieza"),
  },
  general: {
    hint: "Usa las palabras de la actividad. Si venden, es un pedido. Si atienden con hora, es una cita. No uses «agenda tu visita» por defecto.",
    agenda: agenda(
      "Haz tu pedido aquí",
      "Cada pedido queda con fecha y cantidad. Se deja de armar por WhatsApp.",
      "Enviar pedido",
      "Fecha",
      "Cantidad",
      12,
      [
        { label: "Pedido estándar", detail: "Entrega en la semana", price: 0 },
        { label: "Pedido urgente", detail: "Para el día siguiente", price: 0 },
        { label: "Pedido por mayor", detail: "A convenir con ventas", price: 0 },
      ],
    ),
    registro: tabla(
      "Cada movimiento queda registrado",
      "Qué fue, cuánto y para quién quedan en la misma lista.",
      "Dejar registrado",
      ["Concepto", "Cantidad", "Destino", "Estado"],
      [
        ["Pedido estándar", "4", "Cliente del día", "Listo"],
        ["Pedido urgente", "1", "Entrega local", "En curso"],
        ["Pedido por mayor", "12", "Tienda asociada", "Por confirmar"],
      ],
    ),
    inventario: tabla(
      "Mira qué hay disponible",
      "Las existencias bajan con cada salida y avisan al llegar al mínimo.",
      "Consultar",
      ["Concepto", "Disponible", "Mínimo"],
      [
        ["Pedido estándar", "10", "3"],
        ["Pedido urgente", "4", "1"],
        ["Pedido por mayor", "6", "2"],
      ],
    ),
    solicitudes: tabla(
      "Deja tu solicitud",
      "Cada solicitud queda con número y estado. Nada se queda solo en el chat.",
      "Enviar solicitud",
      ["Número", "Solicitud", "Estado"],
      [
        ["SOL-1042", "Pedido de la semana", "Recibida"],
        ["SOL-1043", "Cambio de fecha", "En curso"],
        ["SOL-1044", "Cotización nueva", "Por confirmar"],
      ],
    ),
    guides: guiasDeOperacion("movimiento", "cliente", "existencias"),
  },
};

function lensFor(industryId: IndustryId | "", activityId: string, companyName: string): LensId {
  if (industryId === "alimentos" && /panader|pasteler|reposter|horno|bizcoch/i.test(companyName)) return "alimento";
  return LENS_OF[activityId] ?? (industryId ? INDUSTRY_LENS[industryId] : undefined) ?? "general";
}

/** Textos del hueco para esta actividad. El nombre de una panadería fuerza el lente de pedido, no el de mesa. */
export function solutionVoice(input: {
  companyName: string;
  industryId: IndustryId | "";
  activityId: string;
}): SolutionVoice {
  return LENSES[lensFor(input.industryId, input.activityId, input.companyName)];
}
