"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitDiagnosis } from "@/app/actions/diagnosis";
import { CompanyStep, GoalsStep, ProblemsStep, SituationStep } from "@/components/diagnostic/steps";
import { useWalkthrough } from "@/components/layout/useWalkthrough";
import { Button } from "@/components/ui/Button";
import {
  getWalkthroughSnapshot,
  patchDraft,
  saveDiagnosis,
  setWalkthroughStep,
} from "@/lib/session/browser-session";
import { firstInvalidStep, STEP_COUNT, validateStep } from "@/lib/validation/steps";
import { PROBLEM_IDS, type DraftAnswers, type ProblemId } from "@/types/domain";

const TITLES = ["La empresa", "Problemas", "Objetivos", "Situación actual"];

function isProblemId(value: string | null): value is ProblemId {
  return PROBLEM_IDS.includes(value as ProblemId);
}

export function Wizard({
  homeHref = "/",
  resultHref = "/resultado",
}: {
  homeHref?: string;
  resultHref?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useWalkthrough();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const step = state.step;

  const requestedProblem = searchParams.get("problema");
  useEffect(() => {
    if (!isProblemId(requestedProblem)) return;
    if (getWalkthroughSnapshot().draft.problems.length > 0) return;
    patchDraft({ problems: [requestedProblem] });
  }, [requestedProblem]);

  function change(partial: Partial<DraftAnswers>) {
    setErrors({});
    setFormError(null);
    patchDraft(partial);
  }

  function goTo(nextStep: number) {
    setErrors({});
    setWalkthroughStep(nextStep);
  }

  function next() {
    const stepErrors = validateStep(step, state.draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    goTo(step + 1);
  }

  function generate() {
    const stepErrors = validateStep(3, state.draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = await submitDiagnosis(state.draft);
      if (!result.ok) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          setWalkthroughStep(firstInvalidStep(result.fieldErrors));
        }
        setFormError(result.formError ?? "Revise las respuestas antes de continuar.");
        return;
      }
      saveDiagnosis(result.diagnosis);
      router.push(resultHref);
    });
  }

  return (
    <form
      className="wizard"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < STEP_COUNT - 1) next();
        else generate();
      }}
    >
      <p className="kicker">Diagnóstico</p>
      <h1>{TITLES[step]}</h1>
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEP_COUNT}
        aria-valuenow={step + 1}
        aria-label="Progreso del formulario"
      >
        <span className="progress-label">
          Paso {step + 1} de {STEP_COUNT}
        </span>
        <span className="progress-track">
          <span className="progress-fill" style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }} />
        </span>
      </div>

      {formError ? (
        <p className="banner" role="alert">
          {formError}
        </p>
      ) : null}

      {step === 0 ? <CompanyStep draft={state.draft} errors={errors} onChange={change} /> : null}
      {step === 1 ? <ProblemsStep draft={state.draft} errors={errors} onChange={change} /> : null}
      {step === 2 ? <GoalsStep draft={state.draft} errors={errors} onChange={change} /> : null}
      {step === 3 ? (
        <SituationStep draft={state.draft} errors={errors} onChange={change} onEdit={goTo} />
      ) : null}

      <div className="wizard-nav">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={pending}>
            Atrás
          </Button>
        ) : (
          <Button href={homeHref} variant="ghost">
            Volver al inicio
          </Button>
        )}
        {step < STEP_COUNT - 1 ? (
          <Button type="submit">Continuar</Button>
        ) : state.diagnosis ? (
          <Button href={resultHref}>Ver el diagnóstico</Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? "Generando diagnóstico…" : "Ver diagnóstico"}
          </Button>
        )}
      </div>
    </form>
  );
}
