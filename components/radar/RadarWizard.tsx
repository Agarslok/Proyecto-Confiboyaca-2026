"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/externado/icons";
import { RadarChart } from "@/components/radar/RadarChart";
import { ConsultoriaLoading } from "@/components/site/ConsultoriaLoading";
import { useSite } from "@/components/site/useSite";
import { Button } from "@/components/ui/Button";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { TextField } from "@/components/ui/TextField";
import { GOALS, INDUSTRIES, LINKS, SIZES } from "@/lib/radar/bank";
import { activityOf, scoreRadar, screenIsDone, screensFor, type Screen } from "@/lib/radar/engine";
import { patchRadar, radarOf } from "@/lib/radar/store";
import type { OptionKey, RadarAnswers, RadarGoalId, SizeId } from "@/lib/radar/types";
import { buildSite } from "@/lib/site/engine";
import { formatCompanyName } from "@/lib/site/format-company-name";
import { saveSiteConfig } from "@/lib/session/site-session";
import { parseSiteBrief } from "@/lib/validation/site";

const KEYS: OptionKey[] = ["A", "B", "C", "D"];
const SECONDS_PER_QUESTION = 14;
const ADVANCE_MS = 320;

function sectionsOf(screens: Screen[]): string[] {
  return Array.from(new Set(screens.map((screen) => screen.section)));
}

function QuestionOption({
  letter,
  label,
  checked,
  onSelect,
}: {
  letter: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label className={checked ? "opt radar-opt on" : "opt radar-opt"}>
      <input type="radio" name="radar-option" value={letter} checked={checked} readOnly onClick={onSelect} />
      <span className="opt-body">
        <span className="radar-key" aria-hidden="true">{letter}</span>
        <span className="opt-text">
          <span className="opt-label">{label}</span>
        </span>
      </span>
    </label>
  );
}

function CompanyScreen({ radar, errors }: { radar: RadarAnswers; errors: Record<string, string> }) {
  return (
    <>
      <TextField
        id="companyName"
        label="Nombre de la empresa"
        value={radar.companyName}
        error={errors.companyName}
        placeholder="Ej. Panadería Carlitos"
        onChange={(companyName) => patchRadar({ companyName })}
        onBlur={() => {
          const formatted = formatCompanyName(radar.companyName);
          if (formatted && formatted !== radar.companyName) patchRadar({ companyName: formatted });
        }}
      />
      <TextField
        id="city"
        label="Ciudad o municipio"
        hint="Opcional."
        value={radar.city}
        large={false}
        onChange={(city) => patchRadar({ city })}
      />
      <div>
        <p className="q-help"><strong>¿Cuántas personas trabajan en la empresa?</strong></p>
        <div className="opts compact" aria-invalid={errors.size ? true : undefined}>
          {(Object.keys(SIZES) as SizeId[]).map((size) => (
            <ChoiceCard
              key={size}
              type="radio"
              name="size"
              value={size}
              title={SIZES[size].label}
              description={SIZES[size].detail}
              checked={radar.size === size}
              onChange={() => patchRadar({ size })}
            />
          ))}
        </div>
        <p className="err" role="alert">{errors.size ?? ""}</p>
      </div>
    </>
  );
}

function SectorScreen({ radar, errors }: { radar: RadarAnswers; errors: Record<string, string> }) {
  const { industry } = activityOf(radar);
  return (
    <>
      <div className="radar-industries" role="radiogroup" aria-label="Industria">
        {INDUSTRIES.map((item) => (
          <label key={item.id} className={radar.industry === item.id ? "radar-industry on" : "radar-industry"}>
            <input
              type="radio"
              name="industry"
              value={item.id}
              checked={radar.industry === item.id}
              onChange={() => patchRadar({ industry: item.id, activity: "" })}
            />
            <span className="radar-industry-icon" aria-hidden="true">{item.icon}</span>
            <span className="radar-industry-label">{item.label}</span>
          </label>
        ))}
      </div>
      <p className="err" role="alert">{errors.industry ?? ""}</p>
      {industry ? (
        <div className="radar-reveal" key={industry.id}>
          <p className="q-help"><strong>¿Cuál es su actividad principal en {industry.label.toLowerCase()}?</strong></p>
          <p className="fine">Define las preguntas de su negocio y los casos que verá al final.</p>
          <div className="opts">
            {industry.activities.map((activity) => (
              <ChoiceCard
                key={activity.id}
                type="radio"
                name="activity"
                value={activity.id}
                title={activity.label}
                description={`${activity.description} · ${LINKS[activity.link]}`}
                checked={radar.activity === activity.id}
                onChange={() => patchRadar({ activity: activity.id })}
              />
            ))}
          </div>
          <p className="err" role="alert">{errors.activity ?? ""}</p>
        </div>
      ) : null}
    </>
  );
}

function GoalsScreen({ radar }: { radar: RadarAnswers }) {
  function toggle(goal: RadarGoalId) {
    if (radar.goals.includes(goal)) patchRadar({ goals: radar.goals.filter((item) => item !== goal) });
    else if (goal === "nose") patchRadar({ goals: ["nose"] });
    else patchRadar({ goals: [...radar.goals.filter((item) => item !== "nose"), goal].slice(-2) });
  }
  return (
    <div className="opts">
      {(Object.keys(GOALS) as RadarGoalId[]).map((goal) => (
        <ChoiceCard
          key={goal}
          type="checkbox"
          name="goals"
          value={goal}
          title={GOALS[goal].label}
          description={GOALS[goal].detail}
          checked={radar.goals.includes(goal)}
          onChange={() => toggle(goal)}
        />
      ))}
    </div>
  );
}

function LiveAside({ radar }: { radar: RadarAnswers }) {
  const live = useMemo(() => scoreRadar(radar), [radar]);
  const { industry, activity } = activityOf(radar);
  const answered = live.dimensions.some((dimension) => dimension.answered);
  return (
    <aside className="aside radar-aside" aria-label="Radar en vivo">
      <p className="micro accent">Radar en vivo</p>
      <RadarChart dimensions={live.dimensions} size={190} />
      <div className="radar-live-index">
        <span className="radar-live-num display">{answered ? live.index : "—"}</span>
        <span className="fine">Índice preliminar de 0 a 100. Se actualiza con cada respuesta.</span>
      </div>
      <dl>
        <div className="aside-row">
          <dt>Empresa</dt>
          <dd><span>{radar.companyName || <span className="empty">Pendiente</span>}</span></dd>
        </div>
        <div className="aside-row">
          <dt>Industria</dt>
          <dd><span>{industry ? `${industry.icon} ${industry.label}` : <span className="empty">Pendiente</span>}</span></dd>
        </div>
        <div className="aside-row">
          <dt>Actividad</dt>
          <dd><span>{activity?.label ?? <span className="empty">Pendiente</span>}</span></dd>
        </div>
      </dl>
      <p className="aside-note">Las preguntas cambian según su industria, su actividad y lo que vaya respondiendo.</p>
    </aside>
  );
}

export function RadarWizard() {
  const router = useRouter();
  const state = useSite();
  const radar = radarOf(state);
  const screens = useMemo(() => screensFor(radar), [radar]);
  const firstPending = screens.findIndex((screen) => !screenIsDone(screen, radar));
  const reachable = firstPending === -1 ? screens.length - 1 : firstPending;
  const cursor = Math.min(radar.cursor, reachable, screens.length - 1);
  const screen = screens[cursor];
  const sections = sectionsOf(screens);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<"fwd" | "bwd">("fwd");
  const [generating, setGenerating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function errorsFor(target: Screen): Record<string, string> {
    if (target.kind === "empresa") {
      const next: Record<string, string> = {};
      if (radar.companyName.trim().length < 2) next.companyName = "Escriba el nombre de la empresa.";
      if (!radar.size) next.size = "Elija el tamaño de la empresa.";
      return next;
    }
    if (target.kind === "sector") {
      if (!radar.industry) return { industry: "Elija una industria." };
      if (!activityOf(radar).activity) return { activity: "Elija la actividad principal." };
    }
    return {};
  }

  function go(next: number) {
    if (timer.current) clearTimeout(timer.current);
    if (next > cursor) {
      const stepErrors = errorsFor(screen);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0 || !screenIsDone(screen, radar)) return;
    } else {
      setErrors({});
    }
    setDirection(next >= cursor ? "fwd" : "bwd");
    patchRadar({ cursor: Math.max(0, Math.min(next, screens.length - 1)) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function choose(questionId: string, key: OptionKey) {
    patchRadar({ choices: { ...radar.choices, [questionId]: key } });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDirection("fwd");
      patchRadar({ cursor: cursor + 1 });
    }, ADVANCE_MS);
  }

  function generate() {
    const parsed = parseSiteBrief(state.draft);
    if (!parsed.ok) {
      patchRadar({ cursor: 0 });
      setErrors(errorsFor(screens[0]));
      return;
    }
    saveSiteConfig(buildSite(parsed.brief));
    setGenerating(true);
  }

  useEffect(() => {
    if (screen?.kind !== "question") return;
    const questionId = screen.question.id;
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.target.type === "text") return;
      }
      const key = event.key.toUpperCase();
      const index = ["A", "B", "C", "D", "E"].indexOf(key);
      const digit = ["1", "2", "3", "4", "5"].indexOf(event.key);
      const picked = index >= 0 ? index : digit;
      if (picked >= 0) choose(questionId, (["A", "B", "C", "D", "E"] as OptionKey[])[picked]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (generating) {
    return <ConsultoriaLoading companyName={radar.companyName} onComplete={() => router.push("/resultado")} />;
  }
  if (!screen) return null;

  const isLast = cursor === screens.length - 1;
  const remaining = Math.max(0, screens.length - cursor - 1);
  const minutes = Math.max(1, Math.round((remaining * SECONDS_PER_QUESTION) / 60));
  const sectionIndex = sections.indexOf(screen.section);
  const { industry } = activityOf(radar);

  let title = "";
  let help = "";
  if (screen.kind === "empresa") {
    title = "Cuéntenos de su empresa";
    help = "El nombre aparece en el diagnóstico y en la página web que le generamos.";
  } else if (screen.kind === "sector") {
    title = "¿En qué industria está su empresa?";
    help = "La industria y la actividad definen las preguntas que verá y el diseño de su página.";
  } else if (screen.kind === "question") {
    title = screen.question.text;
    help = industry && screen.question.dimension === "negocio" ? `Pregunta propia de ${industry.label.toLowerCase()}.` : "";
  } else {
    title = "¿Qué quieren lograr con los datos?";
    help = "Elija hasta 2. No puntúa: sirve para priorizar los casos que le mostramos.";
  }

  return (
    <form
      className="wrap flow radar-flow"
      onSubmit={(event) => {
        event.preventDefault();
        if (isLast) generate();
        else go(cursor + 1);
      }}
    >
      <div className="progress">
        <p className="progress-label">
          Pregunta {cursor + 1} de {screens.length} · {screen.section}
          <span className="radar-eta"> · {remaining === 0 ? "última" : `≈ ${minutes} min restantes`}</span>
        </p>
        <ol className="confi-progress radar-progress" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map((section, index) => {
            const first = screens.findIndex((item) => item.section === section);
            return (
              <li
                key={section}
                className={`seg${index < sectionIndex ? " done" : ""}${index === sectionIndex ? " current" : ""}`}
              >
                <button type="button" disabled={first > reachable} onClick={() => go(first)}>
                  <span className="seg-bar" />
                  <span className="seg-name">{section}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flow-grid">
        <div className="q-card">
          <div className={direction === "bwd" ? "q-anim bwd" : "q-anim"} key={`${cursor}-${screen.kind}`}>
            <p className="q-num">
              {String(cursor + 1).padStart(2, "0")} <span>/ {String(screens.length).padStart(2, "0")}</span>
            </p>
            <h2 className="q-title display radar-q-title">{title}</h2>
            {help ? <p className="q-help">{help}</p> : null}

            {screen.kind === "empresa" ? <CompanyScreen radar={radar} errors={errors} /> : null}
            {screen.kind === "sector" ? <SectorScreen radar={radar} errors={errors} /> : null}
            {screen.kind === "objetivos" ? <GoalsScreen radar={radar} /> : null}
            {screen.kind === "question" ? (
              <>
                <div className="opts radar-opts" role="radiogroup" aria-label={screen.question.text}>
                  {screen.question.options.map((label, index) => (
                    <QuestionOption
                      key={KEYS[index]}
                      letter={KEYS[index]}
                      label={label}
                      checked={radar.choices[screen.question.id] === KEYS[index]}
                      onSelect={() => choose(screen.question.id, KEYS[index])}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className={radar.choices[screen.question.id] === "E" ? "radar-unsure on" : "radar-unsure"}
                  onClick={() => choose(screen.question.id, "E")}
                >
                  <span className="radar-key" aria-hidden="true">E</span> No sé · lo confirmo después
                </button>
                {screen.question.consultantNote ? (
                  <details className="radar-note">
                    <summary>Nota para el consultor</summary>
                    <p>{screen.question.consultantNote}</p>
                  </details>
                ) : null}
                <p className="fine radar-keys-hint">Atajo: teclas A–E o 1–5.</p>
              </>
            ) : null}

            <div className="q-nav">
              {cursor > 0 ? (
                <Button type="button" variant="ghost" onClick={() => go(cursor - 1)}>
                  <Icon.back /> Atrás
                </Button>
              ) : (
                <Button href="/" variant="ghost">Volver al inicio</Button>
              )}
              {isLast ? (
                <Button type="submit" disabled={!screenIsDone(screen, radar)}>Ver mi diagnóstico <Icon.arrow /></Button>
              ) : (
                <Button type="submit" disabled={screen.kind === "question" && !screenIsDone(screen, radar)}>
                  Continuar <Icon.arrow />
                </Button>
              )}
            </div>
          </div>
        </div>

        <LiveAside radar={radar} />
      </div>
    </form>
  );
}
