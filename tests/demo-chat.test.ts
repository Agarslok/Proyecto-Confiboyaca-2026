import assert from "node:assert/strict";
import test from "node:test";
import { agendaQuestion, assistantHello, exampleCell, fieldQuestion, isConfirm, matchOption, parseCommaFields, parseParty, valueMatchesColumn } from "../lib/site/demo-chat";

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
  assert.equal(exampleCell("Número", 0), "1042");
});

test("saluda con la empresa y pregunta un campo a la vez", () => {
  assert.match(assistantHello("registro", "Laguna Verde"), /asistente de registro en Laguna Verde/);
  assert.equal(agendaQuestion("Confirmar reserva"), "¿Qué tipo de reserva quieres hacer?");
  assert.equal(agendaQuestion("Confirmar reunión"), "¿Qué tipo de reunión quieres agendar?");
  assert.equal(agendaQuestion("Confirmar toma"), "¿Qué toma quieres agendar?");
  assert.equal(fieldQuestion("Huésped"), "¿Qué huésped anoto?");
  assert.equal(fieldQuestion("Noches"), "¿Cuántas noches?");
  assert.equal(fieldQuestion("Solicitud"), "¿Cuál es el número?");
});

test("lee la cantidad y la confirmación", () => {
  assert.equal(parseParty("somos 3", 1, 8), 3);
  assert.equal(parseParty("20", 1, 8), null);
  assert.equal(isConfirm("Sí"), true);
});
