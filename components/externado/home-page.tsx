"use client";

import { useRouter } from "next/navigation";
import { AIStory } from "@/components/externado/ai-story";
import { Icon } from "@/components/externado/icons";
import { SolutionShowcase } from "@/components/externado/solution-showcase";
import { TEAM } from "@/components/externado/team-config";
import { TeamCarousel } from "@/components/externado/team-carousel";
import { scrollToSection, useReveal } from "@/components/externado/use-reveal";
import { beginFreshDiagnosis } from "@/lib/radar/store";

import { NicheIcon, type NicheIconName } from "@/components/externado/niche-icons";

/** Atajos de la portada: el negocio elegido abre la encuesta ya ubicada en su nicho. */
const QUICK_NICHES: { icon: NicheIconName; label: string; nicho: string }[] = [
  { icon: "bakery", label: "Panadería o alimentos", nicho: "alimentos-produccion" },
  { icon: "restaurant", label: "Restaurante o cafetería", nicho: "alimentos-restaurante" },
  { icon: "retail", label: "Tienda o supermercado", nicho: "comercio-fisica" },
  { icon: "fashion", label: "Ropa", nicho: "moda-compraventa" },
  { icon: "hotel", label: "Hotel u hospedaje", nicho: "turismo-hotel" },
  { icon: "health", label: "Salud o estética", nicho: "salud-ips" },
  { icon: "farm", label: "Finca o agro", nicho: "agro-primaria" },
  { icon: "cattle", label: "Ganadería", nicho: "pecuaria-bovinos" },
  { icon: "wood", label: "Madera o carpintería", nicho: "madera-carpinteria" },
  { icon: "factory", label: "Taller o fábrica", nicho: "manufactura-planta" },
  { icon: "mining", label: "Minería", nicho: "mineria-extraccion" },
];

export function ExternadoHomePage() {
  const router = useRouter();
  useReveal([]);

  const onStart = () => {
    beginFreshDiagnosis();
    router.push("/diagnostico");
  };
  const onSection = (id: string) => scrollToSection(id);
  const onDemo = () => {
    beginFreshDiagnosis();
    router.push("/diagnostico");
  };

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
          lo resolvemos contigo.
        </p>
        <div className="w-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
            Comenzar formulario <Icon.arrow />
          </button>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => onSection("como-funciona")}>
            Cómo funciona
          </button>
        </div>
        <div className="w-niches" aria-labelledby="w-niches-title">
          <p id="w-niches-title" className="w-niches-title">¿Qué tipo de negocio tiene?</p>
          <div className="w-niches-list">
            {QUICK_NICHES.map((item) => (
              <button key={item.nicho} type="button" className="w-niche" onClick={() => router.push(`/diagnostico?nicho=${item.nicho}`)}>
                <span className="w-niche-icon">
                  <NicheIcon name={item.icon} />
                </span>
                {item.label}
              </button>
            ))}
            <button type="button" className="w-niche is-more" onClick={() => router.push("/encuestas")}>
              Otro negocio →
            </button>
          </div>
        </div>
        <p className="w-meta">
          <Icon.clock /> Unos 6 minutos · Preguntas según tu industria · Sin lenguaje técnico
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
