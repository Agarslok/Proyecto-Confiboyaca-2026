import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionToken, loginBlocked, passwordMatches, registerFailure, verifySessionToken } from "../lib/auth/session";
import { emptyRadarAnswers, screensFor } from "../lib/radar/engine";
import type { RadarAnswers } from "../lib/radar/types";
import { createSqliteStore } from "../lib/store/diagnoses";

function complete(overrides: Partial<RadarAnswers> = {}): RadarAnswers {
  let answers: RadarAnswers = {
    ...emptyRadarAnswers(),
    companyName: "Panadería Carlitos",
    city: "Tunja",
    email: "carlos@ejemplo.co",
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
