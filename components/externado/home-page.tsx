"use client";

import { useRouter } from "next/navigation";
import { AIStory } from "@/components/externado/ai-story";
import { ExtIcon, Icon } from "@/components/externado/icons";
import { SOLUTION_CARDS } from "@/components/externado/solution-cards";
import { DEPT_URL, TEAM } from "@/components/externado/team-config";
import { scrollToSection, useReveal } from "@/components/externado/use-reveal";

function TeamLink({ kind, href, person }: { kind: string; href: string; person: string }) {
  const labels: Record<string, string> = { linkedin: "LinkedIn", github: "GitHub", email: "Correo" };
  if (!href) {
    return (
      <span className="team-link pending" aria-label={`${labels[kind]} pendiente`}>{labels[kind]}</span>
    );
  }
  if (kind === "email") return <span className="team-link mail">{href}</span>;
  return (
    <a className="team-link" href={href} target="_blank" rel="noopener noreferrer">
      {labels[kind]} <ExtIcon />
      <span className="sr-only"> de {person} (se abre en una pestaña nueva)</span>
    </a>
  );
}

export function ExternadoHomePage() {
  const router = useRouter();
  const teamName = TEAM.name.trim();
  const pending = !teamName || TEAM.members.some((m) => !m.name.trim());
  useReveal([]);

  const onStart = () => router.push("/diagnostico");
  const onSection = (id: string) => scrollToSection(id);
  const onDemo = () => router.push("/diagnostico");

  return (
    <>
      <section className="wrap welcome" aria-labelledby="w-title">
        <span className="hero-tag">
          <span className="pulse-dot" aria-hidden="true" />
          Diagnóstico empresarial con datos e IA
        </span>
        <h1 id="w-title" className="display w-title">Descubre nuevas oportunidades para tu empresa</h1>
        <p className="lead w-lead">
          Responde el formulario y recibe una lectura sobre tu página web y una vista previa generada en este
          navegador, con reglas locales.
        </p>
        <div className="w-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
            Comenzar formulario <Icon.arrow />
          </button>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => onSection("como-funciona")}>
            Cómo funciona
          </button>
        </div>
        <p className="w-meta">
          <Icon.clock /> 3 pasos · Sin registro · Resultado en este equipo
        </p>
        <button type="button" className="scroll-cue" onClick={() => onSection("como-funciona")}>
          <span>Desliza para entender qué es la IA</span>
          <span className="cue-line" aria-hidden="true" />
        </button>
      </section>

      <section id="como-funciona" tabIndex={-1} className="wrap section" aria-labelledby="how-title">
        <div className="section-head center reveal">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="how-title" className="section-title">¿Qué es la inteligencia artificial?</h2>
          <p className="section-lead">
            Sin tecnicismos: es una herramienta que aprende de los datos de tu empresa para sugerirte qué hacer.
            Desliza y míralo paso a paso.
          </p>
        </div>
        <AIStory />
        <div className="section-head center reveal sub-head">
          <h2 className="section-title sm">Y así funciona este recorrido</h2>
        </div>
        <ol className="how-grid">
          <li className="card reveal">
            <span className="how-n" aria-hidden="true">1</span>
            <h3>Responde el formulario</h3>
            <p>Empresa, objetivo, características de la página e identidad visual opcional.</p>
          </li>
          <li className="card reveal">
            <span className="how-n" aria-hidden="true">2</span>
            <h3>Recibe una lectura</h3>
            <p>Diagnóstico local sobre qué entra en el sitio, qué falta y qué se asume.</p>
          </li>
          <li className="card reveal">
            <span className="how-n" aria-hidden="true">3</span>
            <h3>Ve la página generada</h3>
            <p>Una vista previa editable con textos de ejemplo donde haga falta.</p>
          </li>
        </ol>
        <div className="center-row reveal">
          <button type="button" className="btn btn-primary" onClick={onStart}>
            Comenzar formulario <Icon.arrow />
          </button>
        </div>
      </section>

      <section id="soluciones" tabIndex={-1} className="wrap section" aria-labelledby="sol-title">
        <div className="section-head center reveal">
          <p className="eyebrow">Soluciones</p>
          <h2 id="sol-title" className="section-title">Lo que se puede construir</h2>
          <p className="section-lead">Cada desafío lleva a una solución. Empieza el formulario para armar tu página.</p>
        </div>
        <ul className="sol-grid">
          {SOLUTION_CARDS.map((s) => (
            <li key={s.id} className="card sol-card reveal">
              <span className="tag">{s.problem}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <button type="button" className="link-btn sol-go" onClick={onDemo}>
                Ir al formulario <Icon.arrow />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="equipo" tabIndex={-1} className="wrap section" aria-labelledby="team-title">
        <div className="section-head center reveal">
          <p className="eyebrow">Equipo</p>
          <h2 id="team-title" className="section-title">{teamName || "Nombre del equipo"}</h2>
          <p className="section-lead">{TEAM.summary}</p>
          {pending ? (
            <p className="pending-note">
              <span className="tag">Pendiente</span> Faltan el nombre del equipo y los datos de los integrantes.
            </p>
          ) : null}
        </div>
        <ul className="team-grid">
          {TEAM.members.map((m, i) => {
            const name = m.name.trim();
            return (
              <li key={i} className={`card team-card reveal${name ? "" : " is-pending"}`}>
                <span className="avatar" aria-hidden="true">
                  {name
                    ? name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                    : String(i + 1)}
                </span>
                <div className="team-id">
                  <h3>{name || `Integrante ${i + 1}`}</h3>
                  <p>{m.role.trim() || "Rol por confirmar"}</p>
                </div>
                <div className="team-links">
                  {(["linkedin", "github", "email"] as const).map((k) => (
                    <TeamLink key={k} kind={k} href={(m.links[k] || "").trim()} person={name || `Integrante ${i + 1}`} />
                  ))}
                </div>
              </li>
            );
          })}
          <li className="card team-card dept-card reveal">
            <p className="micro accent">Departamento de Matemáticas</p>
            <h3>Universidad Externado de Colombia</h3>
            <p>Programas, docentes y educación continuada del departamento.</p>
            <a className="btn btn-ghost btn-sm" href={DEPT_URL} target="_blank" rel="noopener noreferrer">
              Visitar el departamento <ExtIcon />
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
