import { frequencies, goals, methods, problems, sizes } from "@/config/catalog";
import { industries } from "@/config/industries";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { TextField } from "@/components/ui/TextField";
import { selectIndustry } from "@/lib/session/browser-session";
import type {
  CurrentMethod,
  DraftAnswers,
  GoalId,
  PainFrequency,
  ProblemId,
  SizeId,
} from "@/types/domain";

interface StepProps {
  draft: DraftAnswers;
  errors: Record<string, string>;
  onChange: (partial: Partial<DraftAnswers>) => void;
  onEdit?: (step: number) => void;
}

function toggle<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function CompanyStep({ draft, errors, onChange }: StepProps) {
  return (
    <div className="step-body">
      <TextField
        id="companyName"
        label="Nombre de la empresa"
        value={draft.companyName}
        onChange={(companyName) => onChange({ companyName })}
        error={errors.companyName}
        placeholder="Por ejemplo, Taller Andino"
        hint="Solo se guarda en este navegador."
      />
      <fieldset className="choice-set">
        <legend>Sector</legend>
        <p className="hint">Al elegirlo cambia la plantilla visual de todo el recorrido.</p>
        <div className="choices">
          {Object.values(industries).map((industry) => (
            <ChoiceCard
              key={industry.id}
              type="radio"
              name="industry"
              value={industry.id}
              title={industry.name}
              description={industry.summary}
              checked={draft.industryId === industry.id}
              onChange={() => {
                selectIndustry(industry.id);
                onChange({ industryId: industry.id });
              }}
            />
          ))}
        </div>
        {errors.industryId ? (
          <p className="field-error" role="alert">
            {errors.industryId}
          </p>
        ) : null}
      </fieldset>
      <fieldset className="choice-set">
        <legend>Tamaño aproximado</legend>
        <div className="choices choices-compact">
          {(Object.entries(sizes) as [SizeId, string][]).map(([id, label]) => (
            <ChoiceCard
              key={id}
              type="radio"
              name="size"
              value={id}
              title={label}
              checked={draft.size === id}
              onChange={() => onChange({ size: id })}
            />
          ))}
        </div>
        {errors.size ? (
          <p className="field-error" role="alert">
            {errors.size}
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}

export function ProblemsStep({ draft, errors, onChange }: StepProps) {
  return (
    <div className="step-body">
      <fieldset className="choice-set">
        <legend>Problemas principales</legend>
        <p className="hint">Puede marcar más de uno. Después elegirá cuál pesa más.</p>
        <div className="choices">
          {(Object.entries(problems) as [ProblemId, (typeof problems)[ProblemId]][]).map(
            ([id, problem]) => (
              <ChoiceCard
                key={id}
                type="checkbox"
                name="problems"
                value={id}
                title={problem.label}
                description={problem.description}
                checked={draft.problems.includes(id)}
                onChange={() => onChange({ problems: toggle(draft.problems, id) })}
              />
            ),
          )}
        </div>
        {errors.problems ? (
          <p className="field-error" role="alert">
            {errors.problems}
          </p>
        ) : null}
      </fieldset>
      {draft.problems.includes("otro") ? (
        <TextField
          id="otherProblem"
          label="Describa el otro problema"
          value={draft.otherProblem}
          onChange={(otherProblem) => onChange({ otherProblem })}
          error={errors.otherProblem}
          multiline
          hint="Una frase basta. No hace falta un informe."
        />
      ) : null}
    </div>
  );
}

export function GoalsStep({ draft, errors, onChange }: StepProps) {
  return (
    <fieldset className="choice-set">
      <legend>Qué le gustaría lograr</legend>
      <p className="hint">Puede marcar más de uno. El primero que elija orienta uno de los beneficios.</p>
      <div className="choices">
        {(Object.entries(goals) as [GoalId, string][]).map(([id, label]) => (
          <ChoiceCard
            key={id}
            type="checkbox"
            name="goals"
            value={id}
            title={label}
            checked={draft.goals.includes(id)}
            onChange={() => onChange({ goals: toggle(draft.goals, id) })}
          />
        ))}
      </div>
      {errors.goals ? (
        <p className="field-error" role="alert">
          {errors.goals}
        </p>
      ) : null}
    </fieldset>
  );
}

export function SituationStep({ draft, errors, onChange, onEdit }: StepProps) {
  const focus =
    draft.primaryProblem || (draft.problems.length === 1 ? draft.problems[0] : "");
  const prompt =
    focus && draft.industryId
      ? industries[draft.industryId].prompts[focus]
      : "Cuando elija el problema principal, la pregunta se ajusta a ese caso.";

  return (
    <div className="step-body">
      {draft.problems.length > 1 ? (
        <fieldset className="choice-set">
          <legend>Cuál pesa más ahora</legend>
          <div className="choices">
            {draft.problems.map((id) => (
              <ChoiceCard
                key={id}
                type="radio"
                name="primary"
                value={id}
                title={problems[id].label}
                checked={draft.primaryProblem === id}
                onChange={() => onChange({ primaryProblem: id })}
              />
            ))}
          </div>
          {errors.primaryProblem ? (
            <p className="field-error" role="alert">
              {errors.primaryProblem}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <fieldset className="choice-set">
        <legend>{prompt}</legend>
        <div className="choices">
          {(Object.entries(methods) as [CurrentMethod, (typeof methods)[CurrentMethod]][]).map(
            ([id, method]) => (
              <ChoiceCard
                key={id}
                type="radio"
                name="method"
                value={id}
                title={method.label}
                checked={draft.currentMethod === id}
                onChange={() => onChange({ currentMethod: id })}
              />
            ),
          )}
        </div>
        {errors.currentMethod ? (
          <p className="field-error" role="alert">
            {errors.currentMethod}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="choice-set">
        <legend>Con qué frecuencia aparece</legend>
        <div className="choices choices-compact">
          {(
            Object.entries(frequencies) as [PainFrequency, (typeof frequencies)[PainFrequency]][]
          ).map(([id, frequency]) => (
            <ChoiceCard
              key={id}
              type="radio"
              name="frequency"
              value={id}
              title={frequency.label}
              checked={draft.painFrequency === id}
              onChange={() => onChange({ painFrequency: id })}
            />
          ))}
        </div>
        {errors.painFrequency ? (
          <p className="field-error" role="alert">
            {errors.painFrequency}
          </p>
        ) : null}
      </fieldset>

      <div className="review">
        <h3>Respuestas hasta ahora</h3>
        <ReviewRow label="Empresa" value={draft.companyName || "Sin nombre"} onEdit={() => onEdit?.(0)} />
        <ReviewRow
          label="Sector"
          value={draft.industryId ? industries[draft.industryId].name : "Sin sector"}
          onEdit={() => onEdit?.(0)}
        />
        <ReviewRow
          label="Problemas"
          value={
            draft.problems.length
              ? draft.problems.map((id) => problems[id].label).join(", ")
              : "Sin problemas"
          }
          onEdit={() => onEdit?.(1)}
        />
        <ReviewRow
          label="Objetivos"
          value={draft.goals.length ? draft.goals.map((id) => goals[id]).join(", ") : "Sin objetivos"}
          onEdit={() => onEdit?.(2)}
        />
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="review-row">
      <span>{label}</span>
      <strong>{value}</strong>
      <button type="button" onClick={onEdit}>
        Editar
      </button>
    </div>
  );
}
