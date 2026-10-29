import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionToken, loginBlocked, passwordMatches, registerFailure, verifySessionToken } from "../lib/auth/session";
import { emptyRadarAnswers, screensFor } from "../lib/radar/engine";
import type { RadarAnswers } from "../lib/radar/types";
import { createSqliteStore } from "../lib/store/diagnoses";
import { contactErrors } from "../lib/radar/contact";

function complete(overrides: Partial<RadarAnswers> = {}): RadarAnswers {
  let answers: RadarAnswers = {
    ...emptyRadarAnswers(),
    companyName: "Panadería Carlitos",
    city: "Tunja",
    contactName: "Carlos",
    contactLastName: "Rodríguez",
    email: "carlos@ejemplo.co",
    phone: "300 123 4567",
    size: "micro",
    industry: "alimentos",
    activity: "alimentos-produccion",
    goals: ["costos"],
    consent: true,
    ...overrides,
  };
  for (let round = 0; round < 3; round += 1) {
    for (const screen of screensFor(answers)) {
      if (screen.kind === "question") answers = { ...answers, choices: { ...answers.choices, [screen.question.id]: "A" } };
    }
  }
  return answers;
}

describe("diagnósticos guardados", () => {
  it("guarda, busca y recupera por id o por código", () => {
    const store = createSqliteStore(":memory:");
    const saved = store.save(complete());
    assert.ok(saved.ok);
    if (!saved.ok) return;
    assert.match(saved.code, /^RAD-[A-Z2-9]{6}$/);
    const record = store.get(saved.id);
    assert.equal(record?.companyName, "Panadería Carlitos");
    assert.equal(record?.level, "alto");
    assert.equal(record?.answers.recordCode, saved.code);
    assert.equal(store.get(saved.code.toLowerCase())?.id, saved.id);
    assert.equal(store.list({ search: "carlitos" }).total, 1);
    assert.equal(store.list({ search: "tunja", level: "bajo" }).total, 0);
    assert.equal(store.stats().byLevel.alto, 1);
  });

  it("calcula el índice en el servidor, no confía en el navegador", () => {
    const store = createSqliteStore(":memory:");
    const saved = store.save({ ...complete(), index: 99, level: "bajo" } as never);
    assert.ok(saved.ok && store.get(saved.id)?.index === 0);
  });

  it("rechaza sin autorización de datos o incompleto", () => {
    const store = createSqliteStore(":memory:");
    const noConsent = store.save(complete({ consent: false }));
    assert.equal(noConsent.ok, false);
    const incomplete = store.save({ ...complete(), choices: {} });
    assert.equal(incomplete.ok, false);
    assert.equal(store.stats().total, 0);
  });

  it("solo actualiza con el token del mismo navegador o con sesión de consultor", () => {
    const store = createSqliteStore(":memory:");
    const saved = store.save(complete());
    assert.ok(saved.ok);
    if (!saved.ok) return;
    const changed = complete({ companyName: "Panadería Carlitos Centro" });
    assert.equal(store.save(changed, { id: saved.id, editToken: "otro" }).ok, false);
    assert.equal(store.save(changed, { id: saved.id, editToken: saved.editToken }).ok, true);
    assert.equal(store.save(complete({ companyName: "Panadería Carlitos Centro", city: "Paipa" }), { id: saved.id, asConsultant: true }).ok, true);
    const record = store.get(saved.id);
    assert.equal(record?.companyName, "Panadería Carlitos Centro");
    assert.equal(record?.city, "Paipa");
    assert.equal(store.stats().total, 1);
  });
});

describe("sesión de consultores", () => {
  const secret = "s".repeat(40);

  it("acepta un token vigente y rechaza uno alterado o vencido", () => {
    const token = createSessionToken(secret, 1_000);
    assert.equal(verifySessionToken(token, secret, 2_000), true);
    assert.equal(verifySessionToken(token, "x".repeat(40), 2_000), false);
    assert.equal(verifySessionToken(`${token}x`, secret, 2_000), false);
    assert.equal(verifySessionToken(token, secret, 1_000 + 9 * 3600_000), false);
  });

  it("compara la contraseña y exige una mínima", () => {
    assert.equal(passwordMatches("clave-larga-123", "clave-larga-123"), true);
    assert.equal(passwordMatches("otra", "clave-larga-123"), false);
    assert.equal(passwordMatches("corta", "corta"), false);
  });

  it("bloquea tras 5 intentos fallidos", () => {
    for (let i = 0; i < 5; i += 1) registerFailure("1.2.3.4", 0);
    assert.equal(loginBlocked("1.2.3.4", 1_000), true);
    assert.equal(loginBlocked("1.2.3.4", 6 * 60_000), false);
  });
});

describe("datos de contacto obligatorios", () => {
  const ok = { companyName: "Panadería Carlitos", size: "micro" as const, city: "Tunja", contactName: "Carlos", contactLastName: "Rodríguez", email: "carlos@ejemplo.co", phone: "300 123 4567", consent: true };

  it("acepta un contacto completo", () => {
    assert.deepEqual(contactErrors(ok), {});
  });

  it("exige teléfono de al menos 10 números, correo válido, nombre, apellido y ciudad", () => {
    assert.ok(contactErrors({ ...ok, phone: "300 123" }).phone);
    assert.ok(contactErrors({ ...ok, email: "carlos@" }).email);
    assert.ok(contactErrors({ ...ok, email: "carlos.ejemplo.co" }).email);
    assert.ok(contactErrors({ ...ok, contactLastName: "" }).contactLastName);
    assert.ok(contactErrors({ ...ok, contactName: "123" }).contactName);
    assert.ok(contactErrors({ ...ok, city: "" }).city);
  });

  it("el servidor rechaza un registro sin contacto completo", () => {
    const store = createSqliteStore(":memory:");
    assert.equal(store.save(complete({ phone: "12345" })).ok, false);
    const saved = store.save(complete());
    assert.ok(saved.ok && store.get(saved.id)?.contactName === "Carlos Rodríguez");
  });
});

describe("horas del plan y seguimiento", () => {
  it("un producto pequeño para una micro en papel cae en 60–85 horas, y crece con el tamaño", async () => {
    const { estimateEffort } = await import("../lib/radar/effort");
    const paper = estimateEffort("arranque", { size: "micro", choices: { "datos-registro": "A" } });
    assert.ok(paper.total >= 60 && paper.total <= 85, String(paper.total));
    assert.ok(paper.range[0] >= 60);
    const excel = estimateEffort("arranque", { size: "micro", choices: { "datos-registro": "B" } });
    assert.ok(excel.total < paper.total);
    const bigger = estimateEffort("arranque", { size: "mediana", choices: { "datos-registro": "A" } });
    assert.ok(bigger.total > paper.total * 1.5 && bigger.visits > paper.visits);
  });

  it("el costo suma horas, transporte, herramientas y administración", async () => {
    const { estimateEffort } = await import("../lib/radar/effort");
    const { costEstimate } = await import("../lib/radar/pricing");
    const effort = estimateEffort("arranque", { size: "micro", choices: { "datos-registro": "A" } });
    const cost = costEstimate(effort, { hourCost: 10, transportPerVisit: 5, perDiemPerVisit: 0, toolsPerMonth: 0, overhead: 0, margin: 0 });
    assert.equal(cost.price, effort.total * 10 + effort.visits * 5);
  });

  it("el cliente solo puede pedir que lo llamen con su token; el consultor cambia el estado", () => {
    const store = createSqliteStore(":memory:");
    const saved = store.save(complete());
    assert.ok(saved.ok);
    if (!saved.ok) return;
    assert.equal(store.requestFollowUp(saved.id, "otro"), false);
    assert.equal(store.requestFollowUp(saved.id, saved.editToken), true);
    assert.equal(store.get(saved.id)?.status, "interesado");
    assert.equal(store.stats().interested, 1);
    assert.equal(store.setStatus(saved.id, "visita", "Martes 10 a. m."), true);
    assert.equal(store.get(saved.id)?.notes, "Martes 10 a. m.");
    assert.equal(store.list({ status: "visita" }).total, 1);
    assert.equal(store.setStatus(saved.id, "inventado" as never, ""), false);
  });
});

describe("encuesta nueva en el mismo navegador", () => {
  it("no queda atada al registro de la empresa anterior", async () => {
    const values = new Map<string, string>();
    (globalThis as { window?: unknown }).window = globalThis;
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    };
    const { patchRadar, radarOf, startNiche } = await import("../lib/radar/store");
    const { getSiteSnapshot } = await import("../lib/session/site-session");
    patchRadar({ companyName: "Hotel Villa del Sol", recordId: "registro-hotel", recordCode: "RAD-AAAAAA", editToken: "token-hotel", followUpRequested: true });
    startNiche("moda-compraventa");
    const fresh = radarOf(getSiteSnapshot());
    assert.equal(fresh.recordId, undefined);
    assert.equal(fresh.editToken, undefined);
    assert.equal(fresh.followUpRequested, undefined);
    assert.equal(fresh.activity, "moda-compraventa");
    delete (globalThis as { window?: unknown }).window;
  });
});
