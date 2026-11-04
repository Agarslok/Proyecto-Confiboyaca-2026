import assert from "node:assert/strict";
import test from "node:test";
import { quotaCost, quotaRemaining, quotaSpendForTurn, SESSION_QUOTA, wordCount } from "../lib/assistant/session-quota";

test("un mensaje corto gasta poco; uno largo gasta más, sin pasar de 24", () => {
  assert.equal(wordCount("Hoy llegan 4 huéspedes"), 4);
  assert.equal(quotaCost("Hoy llegan 4"), 8);
  assert.equal(quotaCost("uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno"), 12);
  assert.equal(quotaCost(Array.from({ length: 60 }, (_, i) => `p${i}`).join(" ")), 24);
  assert.equal(quotaRemaining(0), SESSION_QUOTA);
  assert.equal(quotaRemaining(SESSION_QUOTA), 0);
  assert.ok(SESSION_QUOTA / 20 >= 10);
});

test("respuesta local no descuenta cupo; Gemini sí", () => {
  assert.equal(quotaSpendForTurn({ engine: "local", question: "¿Cuántas reservas?", answer: "Hay 3." }), 0);
  assert.ok(quotaSpendForTurn({ engine: "gemini", question: "Hola", answer: "Hola, ¿en qué ayudo?" }) > 0);
});
