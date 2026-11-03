import assert from "node:assert/strict";
import test from "node:test";
import {
  agendaConfirmLine,
  agendaPartyPrompt,
  agendaQuestion,
  assistantHello,
  demoContextTable,
  exampleCell,
  fieldQuestion,
  isConfirm,
  matchOption,
  parseCommaFields,
  parseParty,
  solutionSlotKicker,
  tableConfirmLine,
  valueMatchesColumn,
} from "../lib/site/demo-chat";

test("elige una opción escrita o parecida", () => {
  const options = [
    { id: "consulta", label: "Consulta general" },
    { id: "control", label: "Control" },
  ];
  assert.equal(matchOption("consulta general", options)?.id, "consulta");
  assert.equal(matchOption("Control", options)?.id, "control");
  assert.equal(matchOption("quizá", options), null);
});

test("parte una fila por comas y rechaza un conteo distinto", () => {
  assert.deepEqual(parseCommaFields("Pan, 4, Ana, Listo", 4), ["Pan", "4", "Ana", "Listo"]);
  assert.equal(parseCommaFields("Pan, 4", 4), null);
});

test("pide número en cantidad y acepta un código en el número de solicitud", () => {
  assert.equal(valueMatchesColumn("Cantidad", "12"), true);
  assert.equal(valueMatchesColumn("Cantidad", "doce"), false);
  assert.equal(valueMatchesColumn("Número", "SOL-1042"), true);
  assert.equal(valueMatchesColumn("Estado", "Recibida"), true);
  assert.equal(exampleCell("Número", 0), "SOL-1042");
  assert.equal(exampleCell("Mesa", 0), "4");
});

test("saluda con la empresa y pregunta un campo a la vez", () => {
  assert.match(assistantHello("registro", "Laguna Verde"), /asistente de registro en Laguna Verde/);
  assert.match(assistantHello("registro", "Laguna Verde"), /lista de al lado/);
  assert.match(agendaQuestion("Confirmar reserva"), /reserva/);
  assert.match(agendaQuestion("Confirmar reunión"), /reunión/);
  assert.match(agendaQuestion("Confirmar toma"), /toma/);
  assert.equal(fieldQuestion("Huésped"), "¿A nombre de quién va la estadía?");
  assert.equal(fieldQuestion("Noches"), "¿Cuántas noches?");
  assert.match(fieldQuestion("Mesa"), /mesa/);
  assert.equal(fieldQuestion("Solicitud", { action: "solicitudes" }), "¿Cuál es el número de la solicitud? (por ejemplo SOL-1042)");
});

test("resume filas y da contexto de tabla", () => {
  assert.match(
    demoContextTable("registro", "Huésped, habitación y noches quedan en la misma lista.", ["Huésped", "Habitación", "Noches"]),
    /Huésped, Habitación, Noches/,
  );
  assert.match(tableConfirmLine(["Mesa", "Comensales", "Cliente"], ["4", "2", "Ana"]), /mesa 4/);
  assert.match(tableConfirmLine(["Mesa", "Comensales", "Cliente"], ["4", "2", "Ana"]), /2 comensales/);
  assert.match(agendaPartyPrompt("Comensales", 1, 8), /Cuántas comensales/);
  assert.match(agendaConfirmLine({ choiceLabel: "Mesa terraza", choiceDetail: "", dateLabel: "vie 3 nov", party: 2, partyLabel: "Comensales", guest: "Ana" }), /2 comensales/);
});

test("encabezado del hueco según la acción del catálogo", () => {
  assert.equal(solutionSlotKicker("agenda"), "Chat para agendar con un asistente");
  assert.equal(solutionSlotKicker("registro"), "Chat para llevar el registro con un asistente");
  assert.equal(solutionSlotKicker("inventario"), "Chat para consultar inventario con un asistente");
  assert.equal(solutionSlotKicker("solicitudes"), "Chat para atender solicitudes con un asistente");
});

test("lee la cantidad y la confirmación", () => {
  assert.equal(parseParty("somos 3", 1, 8), 3);
  assert.equal(parseParty("20", 1, 8), null);
  assert.equal(isConfirm("Sí"), true);
});
