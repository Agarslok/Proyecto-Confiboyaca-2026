"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/externado/icons";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useSite } from "@/components/site/useSite";
import {
  audienceLabels,
  featureHints,
  featureLabels,
  goalLabels,
  sectorLabels,
} from "@/lib/site/catalog";
import { ConsultoriaLoading } from "@/components/site/ConsultoriaLoading";
import { buildSite } from "@/lib/site/engine";
import { formatCompanyName } from "@/lib/site/format-company-name";
import { patchSiteDraft, saveSiteConfig, setSiteStep } from "@/lib/session/site-session";
import { parseSiteBrief, validateSiteStep } from "@/lib/validation/site";
import { SECTOR_IDS, type AudienceId, type FeatureId, type GoalId, type SiteDraft } from "@/types/site";

const STEP_TITLES = ["La empresa", "El objetivo", "Elementos opcionales"];

const STEP_HEADINGS = [
  "Cuénteme de la empresa",
  "¿Qué quiere conseguir con la página?",
  "¿Qué le gustaría incluir?",
];

const STEP_HELP = [
  "Solo el nombre y el sector son obligatorios. El resto puede quedar vacío.",
  "Opcional. Esta respuesta es informativa y no cambia la plantilla elegida.",
  "Opcional. Marque lo que le interese; la demostración sectorial se mantiene igual.",
];

function StepIntro({ step, title, help }: { step: number; title: string; help: string }) {
  return (
    <>
      <p className="q-num">
        {String(step + 1).padStart(2, "0")} <span>/ 03</span>
      </p>
      <h2 className="q-title display">{title}</h2>
      <p className="q-help">{help}</p>
    </>
  );
}

function ChoiceBlock({
  legend,
  hint,
  error,
  compact,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="q-help">
        <strong>{legend}</strong>
      </p>
      {hint ? <p className="fine">{hint}</p> : null}
      <div className={compact ? "opts compact" : "opts"} aria-invalid={error ? true : undefined}>
        {children}
      </div>
      <p className="err" role="alert">{error ?? ""}</p>
    </div>
  );
}

function WizardAside({ step, draft }: { step: number; draft: SiteDraft }) {
  const sector = draft.sectorId ? sectorLabels[draft.sectorId] : null;

  return (
    <aside className="aside">
      <p className="micro accent">Resumen</p>
      <dl>
        <div className={step === 0 ? "aside-row current" : "aside-row"}>
          <dt>Empresa</dt>
          <dd>
            <span>{draft.companyName || <span className="empty">Pendiente</span>}</span>
          </dd>
        </div>
        <div className="aside-row">
          <dt>Sector</dt>
          <dd>
            <span>{sector || <span className="empty">Pendiente</span>}</span>
          </dd>
        </div>
        <div className={step === 1 ? "aside-row current" : "aside-row"}>
          <dt>Objetivo</dt>
          <dd>
            <span>
              {draft.goal ? goalLabels[draft.goal] : <span className="empty">Opcional</span>}
            </span>
          </dd>
        </div>
        <div className={step === 2 ? "aside-row current" : "aside-row"}>
          <dt>Elementos</dt>
          <dd>
            <span>
              {draft.features.length > 0
                ? `${draft.features.length} marcados`
                : <span className="empty">Opcional</span>}
            </span>
          </dd>
        </div>
      </dl>
      <p className="aside-note">La plantilla depende solo del sector. Los datos se guardan en este navegador.</p>
    </aside>
  );
}

export function SiteWizard() {
  const router = useRouter();
  const state = useSite();
  const draft = state.draft;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  function toggleFeature(feature: FeatureId) {
    const features = draft.features.includes(feature)
      ? draft.features.filter((item) => item !== feature)
      : [...draft.features, feature];
    patchSiteDraft({ features });
  }

  function go(next: number) {
    if (next > state.step) {
      const stepErrors = validateSiteStep(state.step, draft);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) return;
    }
    setErrors({});
    setSiteStep(next);
  }

  function generate() {
    const stepErrors = validateSiteStep(0, draft);
    const parsed = parseSiteBrief(draft);
    const fieldErrors = parsed.ok ? stepErrors : { ...stepErrors, ...parsed.fieldErrors };
    setErrors(fieldErrors);
    if (!parsed.ok || Object.keys(stepErrors).length > 0) {
      setSiteStep(0);
      return;
    }
    const config = buildSite(parsed.brief);
    saveSiteConfig(config);
    setGenerating(true);
  }

  if (generating) {
    return (
      <ConsultoriaLoading
        companyName={draft.companyName}
        onComplete={() => router.push("/resultado")}
      />
    );
  }

  return (
    <form
      className="wrap flow"
      onSubmit={(event) => {
        event.preventDefault();
        if (state.step < 2) go(state.step + 1);
        else generate();
      }}
    >
      <div className="progress">
        <p className="progress-label">
          Paso {state.step + 1} de 3 · {STEP_TITLES[state.step]}
        </p>
        <ol className="confi-progress">
          {STEP_TITLES.map((title, index) => (
            <li
              key={title}
              className={`seg${index < state.step ? " done" : ""}${index === state.step ? " current" : ""}`}
            >
              <button type="button" disabled={index > state.maxStep} onClick={() => go(index)}>
                <span className="seg-bar" />
                <span className="seg-name">{title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="flow-grid">
        <div className="q-card">
          <div className="q-anim">
            <StepIntro step={state.step} title={STEP_HEADINGS[state.step]} help={STEP_HELP[state.step]} />

            {state.step === 0 ? (
              <>
                <TextField
                  id="companyName"
                  label="Nombre de la empresa"
                  value={draft.companyName}
                  error={errors.companyName}
                  onChange={(companyName) => patchSiteDraft({ companyName })}
                  onBlur={() => {
                    const formatted = formatCompanyName(draft.companyName);
                    if (formatted && formatted !== draft.companyName) {
                      patchSiteDraft({ companyName: formatted });
                    }
                  }}
                />
                <ChoiceBlock legend="Sector" error={errors.sectorId}>
                  {SECTOR_IDS.map((sector) => (
                    <ChoiceCard
                      key={sector}
                      type="radio"
                      name="sectorId"
                      value={sector}
                      title={sectorLabels[sector]}
                      checked={draft.sectorId === sector}
                      onChange={() => patchSiteDraft({ sectorId: sector })}
                    />
                  ))}
                </ChoiceBlock>
                <TextField
                  id="activity"
                  label="Descripción breve de la actividad"
                  value={draft.activity}
                  error={errors.activity}
                  hint="Opcional. No cambia la plantilla ni la lógica del demo."
                  multiline
                  onChange={(activity) => patchSiteDraft({ activity })}
                />
                <ChoiceBlock legend="Público objetivo" compact hint="Opcional. Solo informativo.">
                  {(Object.keys(audienceLabels) as AudienceId[]).map((audience) => (
                    <ChoiceCard
                      key={audience}
                      type="radio"
                      name="audience"
                      value={audience}
                      title={audienceLabels[audience]}
                      checked={draft.audience === audience}
                      onChange={() => patchSiteDraft({ audience })}
                    />
                  ))}
                </ChoiceBlock>
              </>
            ) : null}

            {state.step === 1 ? (
              <>
                <ChoiceBlock legend="Objetivo principal" hint="Opcional. No altera la plantilla.">
                  {(Object.keys(goalLabels) as GoalId[]).map((goal) => (
                    <ChoiceCard
                      key={goal}
                      type="radio"
                      name="goal"
                      value={goal}
                      title={goalLabels[goal]}
                      checked={draft.goal === goal}
                      onChange={() => patchSiteDraft({ goal })}
                    />
                  ))}
                </ChoiceBlock>
                {draft.goal === "otro" ? (
                  <TextField
                    id="otherGoal"
                    label="Describa el objetivo"
                    value={draft.otherGoal}
                    error={errors.otherGoal}
                    hint="Opcional."
                    onChange={(otherGoal) => patchSiteDraft({ otherGoal })}
                  />
                ) : null}
              </>
            ) : null}

            {state.step === 2 ? (
              <ChoiceBlock
                legend="Elementos que desea incluir"
                hint="Todo es opcional. La vista final sigue la plantilla del sector."
              >
                {(Object.keys(featureLabels) as FeatureId[]).map((feature) => (
                  <ChoiceCard
                    key={feature}
                    type="checkbox"
                    name="features"
                    value={feature}
                    title={featureLabels[feature]}
                    description={featureHints[feature]}
                    checked={draft.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                  />
                ))}
              </ChoiceBlock>
            ) : null}

            <div className="q-nav">
              {state.step > 0 ? (
                <Button type="button" variant="ghost" onClick={() => go(state.step - 1)}>
                  <Icon.back /> Atrás
                </Button>
              ) : (
                <Button href="/" variant="ghost">
                  Volver al inicio
                </Button>
              )}
              {state.step < 2 ? (
                <Button type="submit">Continuar <Icon.arrow /></Button>
              ) : (
                <Button type="submit">Generar consultoría <Icon.arrow /></Button>
              )}
            </div>
          </div>
        </div>

        <WizardAside step={state.step} draft={draft} />
      </div>
    </form>
  );
}
