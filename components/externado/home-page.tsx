"use client";

import { useRouter } from "next/navigation";
import { AIStory } from "@/components/externado/ai-story";
import { Icon } from "@/components/externado/icons";
import { SOLUTION_CARDS } from "@/components/externado/solution-cards";
import { TEAM } from "@/components/externado/team-config";
import { TeamCarousel } from "@/components/externado/team-carousel";
import { scrollToSection, useReveal } from "@/components/externado/use-reveal";

export function ExternadoHomePage() {
  const router = useRouter();
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
          Responde el formulario y recibe una consultoría sobre tu página web y la solución generada en este
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
            <h3>Recibe la consultoría</h3>
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

      <section id="equipo" tabIndex={-1} className="wrap section team-section" aria-labelledby="team-title">
        <div className="section-head center reveal">
          <p className="eyebrow">Equipo</p>
          <h2 id="team-title" className="section-title">{TEAM.name}</h2>
          <p className="section-lead">{TEAM.summary}</p>
        </div>
        <div className="reveal">
          <TeamCarousel members={TEAM.members} />
        </div>
      </section>
    </>
  );
}
