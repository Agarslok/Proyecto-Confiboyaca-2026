"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createRadarSolution, saveRadarDiagnosis } from "@/app/actions/radar";
import { SOLUTION_GUIDE_LIMITS_SUMMARY, SOLUTION_LOADING_NOTE } from "@/lib/radar/solution-limits";
import { applySolutionToSiteSession } from "@/lib/site/apply-solution-session";
import { Icon } from "@/components/externado/icons";
import { NicheIcon } from "@/components/externado/niche-icons";
import { RadarChart } from "@/components/radar/RadarChart";
import { RadarAvatarOverlay } from "@/components/radar/RadarAvatarOverlay";
import { ConsultoriaLoading } from "@/components/site/ConsultoriaLoading";
import { useSite } from "@/components/site/useSite";
import { Button } from "@/components/ui/Button";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { TextField } from "@/components/ui/TextField";
import { GOALS, INDUSTRIES, LINKS, SIZES } from "@/lib/radar/bank";
import { CITY_SUGGESTIONS, contactErrors } from "@/lib/radar/contact";
import { activityOf, scoreRadar, screenIsDone, screensFor, type Screen } from "@/lib/radar/engine";
import { patchRadar, radarOf, startNiche } from "@/lib/radar/store";
import type { OptionKey, RadarAnswers, RadarGoalId, SizeId } from "@/lib/radar/types";
import { buildSite } from "@/lib/site/engine";
import { formatCompanyName } from "@/lib/site/format-company-name";
import { getSiteSnapshot, saveSiteConfig } from "@/lib/session/site-session";
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

/** Campo de contacto: obligatorio, con su tipo de teclado y, si aplica, sugerencias. */
function ContactField({
  id,
  label,
  value,
  error,
  type = "text",
  autoComplete,
  list,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  list?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label className="q-help" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
        className="text-in sm"
        value={value}
        list={list}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        required
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={`${id}-error`} className="err" role="alert">{error ?? ""}</p>
    </div>
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
      <p className="fine radar-contact-note">Todos los datos son obligatorios: con ellos le enviamos el diagnóstico y la solucción que le ofrecemos.</p>
      <div className="radar-contact">
        <ContactField id="contactName" label="Nombre de contacto" value={radar.contactName} error={errors.contactName} autoComplete="given-name" onChange={(contactName) => patchRadar({ contactName })} />
        <ContactField id="contactLastName" label="Apellido" value={radar.contactLastName} error={errors.contactLastName} autoComplete="family-name" onChange={(contactLastName) => patchRadar({ contactLastName })} />
        <ContactField id="email" type="email" label="Correo" value={radar.email} error={errors.email} autoComplete="email" placeholder="nombre@empresa.com" onChange={(email) => patchRadar({ email: email.trim() })} />
        <ContactField id="companyPhone" type="tel" label="Teléfono de la empresa" value={radar.phone} error={errors.phone} autoComplete="tel-local" placeholder="601 123 4567" onChange={(phone) => patchRadar({ phone: phone.replace(/[^\d+ ]/g, "") })} />
        <ContactField id="city" label="Ciudad o municipio" value={radar.city} error={errors.city} autoComplete="address-level2" list="radar-cities" placeholder="Escriba o elija" onChange={(city) => patchRadar({ city })} />
        <datalist id="radar-cities">
          {CITY_SUGGESTIONS.map((city) => <option key={city} value={city} />)}
        </datalist>
      </div>
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
      <div>
        <label className={radar.consent ? "radar-consent on" : "radar-consent"}>
          <input type="checkbox" checked={radar.consent} onChange={(event) => patchRadar({ consent: event.target.checked })} />
          <span>
            Autorizo a la Universidad Externado de Colombia a tratar los datos de esta encuesta para elaborar el
            diagnóstico y contactarme, según la Ley 1581 de 2012. Puedo pedir que se corrijan o eliminen.
          </span>
        </label>
        <p className="err" role="alert">{errors.consent ?? ""}</p>
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
            <span className="radar-industry-icon" aria-hidden="true">
              <NicheIcon name={item.icon} />
            </span>
            <span className="radar-industry-label">{item.label}</span>
          </label>
        ))}
      </div>
      <p className="err" role="alert">{errors.industry ?? ""}</p>
      <p className="fine">
        ¿Quiere ver las preguntas de cada nicho antes de empezar? <Link href="/encuestas">Catálogo de encuestas por nicho</Link>
      </p>
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

/** En celular el radar lateral no cabe: una franja con el índice que se mueve con cada respuesta. */
function MobileLive({ radar }: { radar: RadarAnswers }) {
  const live = useMemo(() => scoreRadar(radar), [radar]);
  if (!live.dimensions.some((dimension) => dimension.answered)) return null;
  return (
    <div className="radar-mobile-live" aria-hidden="true">
      <span>Índice preliminar</span>
      <span className="radar-mobile-bar"><span style={{ width: `${Math.max(4, live.index)}%` }} /></span>
      <strong>{live.index}</strong>
    </div>
  );
}

function LiveAside({ radar, onOpenAvatar }: { radar: RadarAnswers; onOpenAvatar: () => void }) {
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
          <dd>
            <span>
              {industry ? (
                <span className="radar-aside-industry">
                  <NicheIcon name={industry.icon} />
                  {industry.label}
                </span>
              ) : (
                <span className="empty">Pendiente</span>
              )}
            </span>
          </dd>
        </div>
        <div className="aside-row">
          <dt>Actividad</dt>
          <dd><span>{activity?.label ?? <span className="empty">Pendiente</span>}</span></dd>
        </div>
      </dl>
      <p className="aside-note">Las preguntas cambian según su industria, su actividad y lo que vaya respondiendo.</p>
      <button type="button" className="link-btn radar-avatar-open" onClick={onOpenAvatar}>
        Hacer formulario con el avatar
      </button>
    </aside>
  );
}

export function RadarWizard() {
  const router = useRouter();
  const nicho = useSearchParams().get("nicho");
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
  const [avatarFormOpen, setAvatarFormOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveReady = useRef(false);
  const animReady = useRef(false);
  const resultOpened = useRef(false);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const nichoStarted = useRef<string | null>(null);

  /* Desde el catálogo: /diagnostico?nicho=turismo-hotel abre una encuesta nueva para ese nicho. */
  useEffect(() => {
    if (!nicho || nichoStarted.current === nicho) return;
    nichoStarted.current = nicho;
    startNiche(nicho);
    router.replace("/diagnostico");
  }, [nicho, router]);

  function errorsFor(target: Screen): Record<string, string> {
    if (target.kind === "empresa") return contactErrors(radar);
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

  function openResultIfReady() {
    if (!saveReady.current || !animReady.current || resultOpened.current) return;
    resultOpened.current = true;
    router.push("/resultado");
  }

  function generate() {
    if (radar.recordCode === "") patchRadar({ recordCode: undefined });
    const parsed = parseSiteBrief(state.draft);
    if (!parsed.ok) {
      patchRadar({ cursor: 0 });
      setErrors(errorsFor(screens[0]));
      return;
    }
    saveSiteConfig(buildSite(parsed.brief));
    saveReady.current = false;
    animReady.current = false;
    resultOpened.current = false;
    setGenerating(true);
    /* El informe espera el RAD (o un tope) para que «Ver la página» y el QR ya tengan enlace. */
    const giveUp = window.setTimeout(() => {
      saveReady.current = true;
      openResultIfReady();
    }, 15000);
    void saveRadarDiagnosis(radarOf(getSiteSnapshot()))
      .then(async (saved) => {
        if (saved.ok) {
          patchRadar({ recordId: saved.id, recordCode: saved.code, editToken: saved.editToken || radar.editToken });
          const again = parseSiteBrief(getSiteSnapshot().draft);
          if (again.ok) saveSiteConfig(buildSite(again.brief));
          const solution = await createRadarSolution(saved.id, saved.editToken);
          if (solution.ok) applySolutionToSiteSession(solution.spec);
        } else {
          /* Código vacío = no se guardó; el informe abre /sitio con lo de este navegador. */
          patchRadar({ recordCode: "" });
          console.warn(saved.error);
          const again = parseSiteBrief(getSiteSnapshot().draft);
          if (again.ok) saveSiteConfig(buildSite(again.brief));
        }
      })
      .catch((error) => {
        patchRadar({ recordCode: "" });
        console.warn(error);
      })
      .finally(() => {
        window.clearTimeout(giveUp);
        saveReady.current = true;
        openResultIfReady();
      });
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
    return (
      <ConsultoriaLoading
        companyName={radar.companyName}
        note={`${SOLUTION_LOADING_NOTE} ${SOLUTION_GUIDE_LIMITS_SUMMARY}`}
        onComplete={() => {
          animReady.current = true;
          openResultIfReady();
        }}
      />
    );
  }
  if (!screen) return null;

  const isLast = cursor === screens.length - 1;
  const remaining = Math.max(0, screens.length - cursor - 1);
  const minutes = Math.max(1, Math.round((remaining * SECONDS_PER_QUESTION) / 60));
  const sectionIndex = sections.indexOf(screen.section);

  let title = "";
  let help = "";
  if (screen.kind === "empresa") {
    title = "Cuéntenos de su empresa";
    help = "";
  } else if (screen.kind === "sector") {
    title = "¿En qué industria está su empresa?";
    help = "La industria y la actividad definen las preguntas que verá y el diseño de su página.";
  } else if (screen.kind === "question") {
    title = screen.question.text;
    help = "";
  } else {
    title = "¿Qué quieren lograr con los datos?";
    help = "Elija hasta 2. No puntúa: sirve para priorizar los casos que le mostramos.";
  }

  return (
    <>
    <form
      noValidate
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

      <MobileLive radar={radar} />

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

        <LiveAside radar={radar} onOpenAvatar={() => setAvatarFormOpen(true)} />
      </div>
    </form>
    <RadarAvatarOverlay open={avatarFormOpen} onClose={() => setAvatarFormOpen(false)} />
    </>
  );
}
