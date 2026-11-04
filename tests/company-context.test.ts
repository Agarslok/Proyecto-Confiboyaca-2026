import assert from "node:assert/strict";
import test from "node:test";
import { companyNameHint } from "../lib/assistant/company-context";

test("companyNameHint infiere panadería o carnicería sin cambiar sector del formulario", () => {
  assert.match(companyNameHint("Panadería Carlitos"), /panader/i);
  assert.match(companyNameHint("Carnicería El Prado"), /carnicer/i);
  assert.equal(companyNameHint("Empresa genérica S.A.S."), "");
});
