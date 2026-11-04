import assert from "node:assert/strict";
import test from "node:test";
import { INDUSTRIES } from "../lib/radar/bank";
import { allActivityProfiles, activityProfile } from "../lib/ops/sector/profile-builder";
import { sectorOpsConfig } from "../lib/ops/sector/registry";

test("cada subactividad del formulario tiene perfil operativo completo", () => {
  const expected = INDUSTRIES.flatMap((industry) => industry.activities.map((activity) => `${industry.id}:${activity.id}`));
  const profiles = allActivityProfiles();
  assert.equal(profiles.length, expected.length);

  for (const profile of profiles) {
    assert.ok(profile.businessContext.length > 40, profile.activityId);
    assert.ok(profile.assistantRole.length > 20, profile.activityId);
    assert.equal(profile.mainActivities.length >= 3, true, profile.activityId);
    assert.equal(profile.initialQuestions.length, 3, profile.activityId);
    assert.equal(profile.followUpQuestions.length, 4, profile.activityId);
    assert.ok(profile.operationTypes.length >= 3, profile.activityId);
    assert.equal(profile.entities.primary.fields.length, 4, profile.activityId);
    assert.equal(profile.validationRules.length >= 3, true, profile.activityId);
    assert.equal(profile.dashboardIndicators.length, 4, profile.activityId);
    assert.equal(profile.recommendedCharts.length, 4, profile.activityId);
    assert.ok(profile.frequentQueries.length >= 3, profile.activityId);
    assert.equal(profile.conversationExamples.length, 2, profile.activityId);
    assert.ok(profile.guidanceForModel.includes("No preguntes solo"), profile.activityId);
    assert.equal(profile.initialQuestions.some((q) => /cuánto vendiste/i.test(q)), false, profile.activityId);
    assert.doesNotMatch(profile.initialQuestions[0], /[()]/, profile.activityId);
    assert.ok(profile.initialQuestions[0].length <= 48, `${profile.activityId}: ${profile.initialQuestions[0]}`);
  }
});

test("sectorOpsConfig expone dashboard sectorial fuera de turismo hotel", () => {
  const cfg = sectorOpsConfig({
    industryId: "moda",
    activityId: "moda-confeccion",
    sectorLabel: "Moda · confección",
  });
  assert.equal(cfg.profile.activityId, "moda-confeccion");
  assert.ok(cfg.dashboard);
  assert.equal(cfg.dashboard?.primaryId, "registro");
  assert.deepEqual(cfg.starters, cfg.profile.initialQuestions);
});

test("inmobiliaria vive bajo construcción con perfil comercial", () => {
  const profile = activityProfile("construccion", "construccion-inmobiliaria");
  assert.equal(profile.activityLabel, "Inmobiliaria");
  assert.equal(profile.link, "comercial");
  assert.match(profile.initialQuestions[0], /inmueble/i);
});
