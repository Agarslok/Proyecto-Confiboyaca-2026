"use client";

import { useRouter } from "next/navigation";
import { AIStory } from "@/components/externado/ai-story";
import { Icon } from "@/components/externado/icons";
import { SolutionShowcase } from "@/components/externado/solution-showcase";
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
          Responde unas 15 preguntas sobre tu negocio y recibe tu diagnóstico: cuál es tu problema central, cómo
          lo resolvemos contigo y una página web de muestra para tu empresa.
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
          <Icon.clock /> Unos 4 minutos · Preguntas según tu industria · Sin lenguaje técnico
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
          <h2 className="section-title sm">Y así trabajamos contigo</h2>
        </div>
        <ol className="how-grid">
          <li className="card reveal">
            <span className="how-n" aria-hidden="true">1</span>
            <h3>Respondes unas preguntas</h3>
            <p>Una por pantalla, sobre cómo trabajas hoy. Cambian según tu industria: no es lo mismo un hotel que una mina.</p>
          </li>
          <li className="card reveal">
            <span className="how-n" aria-hidden="true">2</span>
            <h3>Ves tu problema central</h3>
            <p>Un puntaje de 0 a 100, lo que más le cuesta hoy a tu negocio y casos concretos para empezar.</p>
          </li>
          <li className="card reveal">
            <span className="how-n" aria-hidden="true">3</span>
            <h3>Te lo dejamos funcionando</h3>
            <p>Acompañamiento por horas en tu negocio: montamos la solución en tu celular o tus sistemas y te mostramos cómo usarla.</p>
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
          <p className="section-lead">No te lo contamos: pruébalo. Así pasa un negocio del cuaderno a tener sus datos ordenados.</p>
        </div>
        <SolutionShowcase onStart={onDemo} />
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
