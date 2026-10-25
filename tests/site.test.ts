import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSite, type SiteBrief } from "../lib/site/engine";
import { formatCompanyName } from "../lib/site/format-company-name";
import { selectTemplate } from "../lib/site/select-template";
import { parseSiteBrief, validateSiteStep } from "../lib/validation/site";
import { emptyDraft } from "../lib/session/site-session";

function brief(overrides: Partial<SiteBrief> = {}): SiteBrief {
  return {
    companyName: "Andes Viajes",
    sectorId: "turismo",
    activity: "",
    audience: "",
    goal: "",
    otherGoal: "",
    features: [],
    ...overrides,
  };
}

describe("formato del nombre", () => {
  it("capitaliza cada palabra", () => {
    assert.equal(formatCompanyName("  parra me queda "), "Parra Me Queda");
    assert.equal(formatCompanyName("harry styles"), "Harry Styles");
  });
});

describe("selección de plantilla", () => {
  it("mapea cada sector a su plantilla", () => {
    assert.equal(selectTemplate("turismo"), "turismo");
    assert.equal(selectTemplate("metalurgia"), "metalurgia");
    assert.equal(selectTemplate("agroindustria"), "agroindustria");
    assert.equal(selectTemplate("gastronomia"), "gastronomia");
    assert.equal(selectTemplate("retail"), "retail");
    assert.equal(selectTemplate("servicios"), "servicios");
  });
});

describe("generación de la página", () => {
  it("usa el sector para la plantilla y el nombre para personalizar", () => {
    const page = buildSite(brief());
    assert.equal(page.templateId, "turismo");
    assert.match(page.templateCopy.heroLead, /Andes Viajes/);
    assert.ok(page.consultancy.signals.length >= 3);
    assert.match(page.consultancy.headline, /Andes Viajes/);

    const industrial = buildSite(brief({ companyName: "Acero Norte", sectorId: "metalurgia" }));
    assert.equal(industrial.templateId, "metalurgia");
    assert.match(industrial.templateCopy.heroLead, /Acero Norte/);
  });

  it("no cambia la plantilla cuando solo cambian campos informativos", () => {
    const base = buildSite(brief());
    const withGoal = buildSite(
      brief({
        goal: "clientes",
        audience: "empresas",
        features: ["personalizacion", "faq"],
        activity: "Operador de rutas culturales.",
      }),
    );
    assert.equal(base.templateId, withGoal.templateId);
    assert.equal(base.sectorId, withGoal.sectorId);
  });

  it("cambia la plantilla al cambiar el sector", () => {
    const agro = buildSite(brief({ sectorId: "agroindustria" }));
    assert.equal(agro.templateId, "agroindustria");
    assert.notEqual(agro.templateCopy.aboutTitle, buildSite(brief()).templateCopy.aboutTitle);
  });
});

describe("validación del formulario", () => {
  it("solo exige nombre y sector para generar", () => {
    const draft = emptyDraft();
    draft.companyName = "X";
    draft.sectorId = "turismo";
    const parsed = parseSiteBrief(draft);
    assert.equal(parsed.ok, false);
    draft.companyName = "Mi Empresa";
    const ok = parseSiteBrief(draft);
    assert.equal(ok.ok, true);
    if (ok.ok) {
      const site = buildSite(ok.brief);
      assert.equal(site.companyName, "Mi Empresa");
    }
  });

  it("permite pasos opcionales sin respuestas", () => {
    const draft = emptyDraft();
    draft.companyName = "Demo SA";
    draft.sectorId = "metalurgia";
    assert.deepEqual(validateSiteStep(1, draft), {});
    assert.deepEqual(validateSiteStep(2, draft), {});
  });

  it("bloquea el paso 0 sin sector", () => {
    const draft = emptyDraft();
    draft.companyName = "Demo SA";
    const errors = validateSiteStep(0, draft);
    assert.ok(errors.sectorId);
  });
});
