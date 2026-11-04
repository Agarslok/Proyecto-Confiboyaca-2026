import assert from "node:assert/strict";
import test from "node:test";
import { crmCatalogFromVoice } from "../lib/assistant/crm-catalog";
import { capturedRowFromReply, opsTablesFromEntities, shouldDeferCaptureToGemini, tryLocalOpsQuery, tryLocalOpsReply } from "../lib/assistant/ops-capture";
import { addDays, formatSpanishDay } from "../lib/assistant/relative-dates";
import { appendCapturedRow, cloneCrmCatalog, type CrmEntityState } from "../lib/assistant/crm-state";
import { CRM_META_RECORDED_AT, CRM_META_SOURCE, CRM_META_STATUS } from "../lib/assistant/crm-row-meta";
import { solutionVoice } from "../lib/radar/solution-voice";

function hotelEntitiesWithDemoRows(): CrmEntityState[] {
  const voice = solutionVoice({ companyName: "Laguna Verde", industryId: "turismo", activityId: "turismo-hotel" });
  const entities = cloneCrmCatalog(crmCatalogFromVoice(voice, "turismo"));
  const reservas = entities.find((entity) => entity.id === "reservas");
  if (reservas) {
    reservas.rows = [
      { guest: "Familia Moreno", arrival: "Vie 7 nov", guestCount: "2", room: "Habitación doble" },
      { guest: "Agencia Viajes Sol", arrival: "Sáb 8 nov", guestCount: "3", room: "Suite" },
      { guest: "Huésped de paso", arrival: "Dom 9 nov", guestCount: "2", room: "Plan fin de semana" },
    ];
  }
  const estadias = entities.find((entity) => entity.id === "estadias");
  if (estadias) {
    estadias.rows = [
      { guest: "Familia Moreno", arrival: "Hoy", nights: "2", room: "Habitación doble" },
      { guest: "Agencia Viajes Sol", arrival: "Hoy", nights: "1", room: "Suite" },
    ];
  }
  const cupos = entities.find((entity) => entity.id === "cupos");
  if (cupos) {
    cupos.rows = [{ staff: "Recepción", when: "Hoy", free: "2", roomType: "Suite" }];
  }
  return entities;
}

function hotelTables() {
  return opsTablesFromEntities(hotelEntitiesWithDemoRows());
}

test("servicio y logística: verbos del perfil abren captura local", () => {
  const voice = solutionVoice({ companyName: "IPS Norte", industryId: "salud", activityId: "salud-ips" });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "salud", "salud-ips")));
  assert.ok(tryLocalOpsReply("Agenda servicios para mañana", tables, []));
  assert.ok(tryLocalOpsReply("Reserva consulta para 2 pacientes el jueves", tables, []));

  const cargo = solutionVoice({ companyName: "Carga Boyacá", industryId: "transporte", activityId: "transporte-carga" });
  const cargoTables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(cargo, "transporte", "transporte-carga")));
  assert.ok(tryLocalOpsReply("Programa despacho de envíos para mañana", cargoTables, []));
});

test("anotar llena quién-cuándo-cuántos-qué y pregunta el que falta", () => {
  const today = formatSpanishDay(new Date());
  const reply = tryLocalOpsReply("Hoy llegan 4 huéspedes a habitación doble", hotelTables(), []);
  assert.ok(reply);
  assert.equal(
    reply,
    [
      "Perfecto.",
      "",
      "Huésped: Por definir",
      `Llegada: ${today}`,
      "Cantidad de huéspedes: 4",
      "Habitación: Habitación doble",
      "",
      "¿Cuál es el Huésped?",
    ].join("\n"),
  );
});

test("consulta las filas reales: conteo, persona y día", () => {
  const tables = hotelTables();
  assert.match(tryLocalOpsQuery("¿Cuántas reservas tengo?", tables) ?? "", /Reservas hay 3 registros/);
  assert.match(tryLocalOpsQuery("¿Cuántos huéspedes esperamos?", tables) ?? "", /suman 7/);
  assert.match(tryLocalOpsQuery("¿Quién es Familia Moreno?", tables) ?? "", /Familia Moreno/);
  assert.match(tryLocalOpsQuery("¿Quién es Familia Moreno?", tables) ?? "", /Habitación doble/);
  assert.match(tryLocalOpsQuery("¿Quién llega el sábado?", tables) ?? "", /Agencia Viajes Sol/);
  assert.equal(tryLocalOpsQuery("¿Qué pan hay hoy?", tables), null);
  const ocupacion = tryLocalOpsQuery("¿cómo va la ocupación del hotel?", tables) ?? "";
  assert.match(ocupacion, /3 reservas/);
  assert.match(ocupacion, /7 huéspedes esperados/);
  assert.match(ocupacion, /En casa hoy: Familia Moreno, Agencia Viajes Sol/);
  assert.match(ocupacion, /Suite 2 libres/);
});

test("una consulta no usa la plantilla de anotar", () => {
  assert.equal(tryLocalOpsReply("¿Cuántas reservas tengo esta semana?", hotelTables(), []), null);
  assert.equal(tryLocalOpsReply("Muéstrame el dashboard", hotelTables(), []), null);
});

test("después de anotar, una consulta nueva no sigue preguntando el huésped", () => {
  const capture = tryLocalOpsReply("Hoy llegan 4 huéspedes a habitación doble", hotelTables(), []);
  assert.ok(capture);
  const reply = tryLocalOpsReply("¿Cuántas reservas tengo esta semana?", hotelTables(), [
    { role: "user", text: "Hoy llegan 4 huéspedes a habitación doble" },
    { role: "assistant", text: capture },
  ]);
  assert.equal(reply, null);
});

test("el nombre que falta sí completa la ficha", () => {
  const capture = tryLocalOpsReply("Hoy llegan 4 huéspedes a habitación doble", hotelTables(), []);
  assert.ok(capture);
  const reply = tryLocalOpsReply("Familia Moreno", hotelTables(), [
    { role: "user", text: "Hoy llegan 4 huéspedes a habitación doble" },
    { role: "assistant", text: capture },
  ]);
  assert.ok(reply);
  assert.match(reply, /Familia Moreno/);
  assert.match(reply, /Listo, quedó en Reservas/);
});

test("interpreta huésped y cantidad en una sola respuesta (delegado a Gemini)", () => {
  const tables = hotelTables();
  const opening = tryLocalOpsReply("hoy llegan los huéspedes a una suite", tables, []);
  assert.ok(opening);
  const history = [
    { role: "user" as const, text: "hoy llegan los huéspedes a una suite" },
    { role: "assistant" as const, text: opening },
  ];
  const compound = "el huésped es Samuel la cantidad de huéspedes son cuatro";
  assert.equal(shouldDeferCaptureToGemini(compound, history), true);
  assert.equal(tryLocalOpsReply(compound, tables, history), null);
});

test("cantidad es 4 completa solo el campo numérico", () => {
  const tables = hotelTables();
  const opening = tryLocalOpsReply("hoy llegan los huéspedes a una suite", tables, []);
  assert.ok(opening);
  const partial = tryLocalOpsReply("Samuel", tables, [
    { role: "user", text: "hoy llegan los huéspedes a una suite" },
    { role: "assistant", text: opening },
  ]);
  assert.ok(partial);
  assert.match(partial, /Samuel/);
  const reply = tryLocalOpsReply("cantidad es 4", tables, [
    { role: "user", text: "hoy llegan los huéspedes a una suite" },
    { role: "assistant", text: opening },
    { role: "user", text: "Samuel" },
    { role: "assistant", text: partial },
  ]);
  assert.ok(reply);
  assert.match(reply, /Cantidad de huéspedes: 4/);
  assert.match(reply, /Listo, quedó en Reservas/);
});

test("al cerrar la ficha, Salomón Villegas queda como fila de Reservas", () => {
  const tables = hotelTables();
  const entities = hotelEntitiesWithDemoRows();
  const opening = tryLocalOpsReply("Hoy llegan 4 huéspedes a habitación doble", tables, []);
  assert.ok(opening);
  const reply = tryLocalOpsReply("Salomón Villegas", tables, [
    { role: "user", text: "Hoy llegan 4 huéspedes a habitación doble" },
    { role: "assistant", text: opening },
  ]);
  assert.ok(reply);
  const captured = capturedRowFromReply(reply, tables);
  assert.deepEqual(captured, {
    tableLabel: "Reservas",
    values: {
      guest: "Salomón Villegas",
      arrival: formatSpanishDay(new Date()),
      guestCount: "4",
      room: "Habitación doble",
    },
  });
  const before = entities.find((entity) => entity.id === "reservas")?.rows.length ?? 0;
  const next = appendCapturedRow(entities, captured!);
  const reservas = next.find((entity) => entity.id === "reservas");
  assert.equal(reservas?.rows.length, before + 1);
  const saved = reservas?.rows.at(-1);
  assert.equal(saved?.guest, "Salomón Villegas");
  assert.equal(saved?.arrival, formatSpanishDay(new Date()));
  assert.equal(saved?.guestCount, "4");
  assert.equal(saved?.room, "Habitación doble");
  assert.equal(saved?.[CRM_META_SOURCE], "assistant");
  assert.ok(saved?.[CRM_META_RECORDED_AT]);
  assert.equal(saved?.[CRM_META_STATUS], "Confirmado");
  assert.equal(appendCapturedRow(next, captured!).find((entity) => entity.id === "reservas")?.rows.length, before + 1);
  assert.equal(capturedRowFromReply(opening, tables), null);
});

test("un sector genérico también usa cuatro campos", () => {
  const voice = solutionVoice({
    companyName: "Panadería Carlitos",
    industryId: "alimentos",
    activityId: "alimentos-produccion",
  });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "alimentos")));
  assert.equal(tables[0]?.columns.length, 4);
  assert.deepEqual(
    tables[0]?.columns.map((column) => column.slot),
    ["who", "when", "howMany", "what"],
  );
});

test("servicios: «el cliente se llama Juan» conserva la frase y no inventa cantidad", () => {
  const voice = solutionVoice({ companyName: "IPS Norte", industryId: "salud", activityId: "salud-ips" });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "salud", "salud-ips")));
  const tomorrow = formatSpanishDay(addDays(new Date(), 1));
  const opening = tryLocalOpsReply("Agenda servicios para mañana con 5 personas", tables, []);
  assert.ok(opening);
  assert.match(opening, new RegExp(`Fecha y hora: ${tomorrow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(opening, /Personas: 5/);
  const reply = tryLocalOpsReply("el cliente se llama Juan", tables, [
    { role: "user", text: "Agenda servicios para mañana con 5 personas" },
    { role: "assistant", text: opening },
  ]);
  assert.ok(reply);
  assert.match(reply, /Cliente o paciente: el cliente se llama Juan/i);
  assert.match(reply, /Personas: 5/);
});

test("manufactura: lote + cantidad + producto en ficha abierta se delega a Gemini", () => {
  const voice = solutionVoice({ companyName: "Taller Boyacá", industryId: "manufactura", activityId: "manufactura-planta" });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "manufactura", "manufactura-planta")));
  const opening = tryLocalOpsReply("Registra producción de hoy", tables, []);
  assert.ok(opening);
  const history = [
    { role: "user" as const, text: "Registra producción de hoy" },
    { role: "assistant" as const, text: opening! },
  ];
  const compound = "lote 3 cantidad 20 toneladas y el producto son esmeraldas";
  assert.equal(shouldDeferCaptureToGemini(compound, history), true);
  assert.equal(tryLocalOpsReply(compound, tables, history), null);
  assert.equal(shouldDeferCaptureToGemini("lote 3", history), false);
  assert.ok(tryLocalOpsReply("lote 3", tables, history));
});

test("mensaje compuesto en ficha abierta se delega a Gemini (no captura local)", () => {
  const voice = solutionVoice({ companyName: "Consulta Andina", industryId: "salud", activityId: "salud-ips" });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "salud", "salud-ips")));
  const opening = tryLocalOpsReply("Agenda cita para mañana", tables, []);
  assert.ok(opening);
  const history = [
    { role: "user" as const, text: "Agenda cita para mañana" },
    { role: "assistant" as const, text: opening! },
  ];
  const compound = "el cliente es juan, son 6 perosna sy el servici es odontolgia";
  assert.equal(shouldDeferCaptureToGemini(compound, history), true);
  assert.equal(tryLocalOpsReply(compound, tables, history), null);
});

test("servicios: no guarda el comando en cliente y avanza servicio o plan", () => {
  const voice = solutionVoice({ companyName: "Consulta Andina", industryId: "salud", activityId: "salud-ips" });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "salud", "salud-ips")));
  const opening = tryLocalOpsReply("Agenda servicios (ips, clínica o consultorio) para mañana", tables, []);
  assert.ok(opening);
  assert.match(opening, /Cliente o paciente: Por definir/);
  assert.doesNotMatch(opening, /Cliente o paciente: Agenda/i);

  const history: { role: "user" | "assistant"; text: string }[] = [
    { role: "user", text: "Agenda servicios (ips, clínica o consultorio) para mañana" },
    { role: "assistant", text: opening! },
  ];

  const whoStep = tryLocalOpsReply("Agenda cita para mañana", tables, history);
  assert.ok(whoStep);
  assert.match(whoStep, /Cliente o paciente: Por definir/);
  assert.match(whoStep, /¿Cuál es el Cliente o paciente\?/);

  history.push({ role: "user", text: "Agenda cita para mañana" }, { role: "assistant", text: whoStep! });

  const nameStep = tryLocalOpsReply("María López", tables, history);
  assert.ok(nameStep);
  assert.match(nameStep, /Cliente o paciente: María López/);

  history.push({ role: "user", text: "María López" }, { role: "assistant", text: nameStep! });

  const countStep = tryLocalOpsReply("5", tables, history);
  assert.ok(countStep);
  assert.match(countStep, /Personas: 5/);
  assert.match(countStep, /Servicio o plan: Por definir/);

  history.push({ role: "user", text: "5" }, { role: "assistant", text: countStep! });

  const whatStep = tryLocalOpsReply("el servicio es odontologia", tables, history);
  assert.ok(whatStep);
  assert.match(whatStep, /Servicio o plan: odontologia/i);
  assert.match(whatStep, /Personas: 5/);
  assert.match(whatStep, /Listo,/);

  const parsed = capturedRowFromReply(whatStep!, tables);
  assert.ok(parsed);
  assert.match(parsed!.values[tables[0]!.columns.find((c) => c.slot === "what")!.key], /odontologia/i);
});

test("mañana mañana resuelve pasado mañana en fecha concreta", () => {
  const voice = solutionVoice({ companyName: "IPS Norte", industryId: "salud", activityId: "salud-ips" });
  const tables = opsTablesFromEntities(cloneCrmCatalog(crmCatalogFromVoice(voice, "salud", "salud-ips")));
  const dayAfter = formatSpanishDay(addDays(new Date(), 2));
  const reply = tryLocalOpsReply("Reserva consulta mañana mañana para 1 persona", tables, []);
  assert.ok(reply);
  assert.match(reply, new RegExp(`Fecha y hora: ${dayAfter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});
