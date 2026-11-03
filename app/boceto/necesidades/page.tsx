import type { Metadata } from "next";
import { SolutionBlock } from "@/components/templates/SolutionBlock";
import { industryById } from "@/lib/radar/bank";
import { emptyRadarAnswers, screensFor } from "@/lib/radar/engine";
import type { IndustryId, OptionKey, RadarAnswers } from "@/lib/radar/types";
import { buildSite } from "@/lib/site/engine";
import type { SiteConfig } from "@/types/site";
import styles from "./necesidades.module.css";

export const metadata: Metadata = {
  title: "Boceto · qué necesita cada negocio",
  description: "El hueco muestra el problema principal y, si hace falta, una segunda pieza distinta.",
};

const CASES: { id: string; companyName: string; industry: IndustryId; activity: string; note: string }[] = [
  {
    id: "panaderia",
    companyName: "Panadería Carlitos",
    industry: "alimentos",
    activity: "alimentos-produccion",
    note: "Produce y anota lo que sobra. No recibe visitas con hora.",
  },
  {
    id: "hotel",
    companyName: "Laguna Verde",
    industry: "turismo",
    activity: "turismo-hotel",
    note: "La reserva es lo principal. Lo que entra y sale también queda escrito.",
  },
  {
    id: "farmacia",
    companyName: "Farmacia Centro",
    industry: "salud",
    activity: "salud-farmacia",
    note: "La venta queda en la lista. Los pedidos van aparte, sin convertirse en agenda de citas.",
  },
  {
    id: "clinica",
    companyName: "Consulta Andina",
    industry: "salud",
    activity: "salud-ips",
    note: "Atiende con cita. El registro de la atención va aparte.",
  },
  {
    id: "consultoria",
    companyName: "Estudio Norte",
    industry: "servicios",
    activity: "servicios-consultoria",
    note: "El dato flojo sigue en su lista. Las visitas se agendan al lado.",
  },
  {
    id: "laboratorio",
    companyName: "Laboratorio del Alto",
    industry: "salud",
    activity: "salud-laboratorio",
    note: "El análisis queda registrado. La toma de muestra se agenda aparte.",
  },
];

function answerAll(base: Partial<RadarAnswers>, pick: OptionKey): RadarAnswers {
  let answers: RadarAnswers = {
    ...emptyRadarAnswers(),
    companyName: "Negocio",
    size: "micro",
    goals: ["costos"],
    ...base,
  };
  for (let round = 0; round < 4; round += 1) {
    for (const screen of screensFor(answers)) {
      if (screen.kind !== "question") continue;
      answers = { ...answers, choices: { ...answers.choices, [screen.question.id]: pick } };
    }
  }
  return answers;
}

function preview(item: (typeof CASES)[number]): { config: SiteConfig; summary: string } {
  const industry = industryById(item.industry);
  const site = buildSite({
    companyName: item.companyName,
    sectorId: industry?.template ?? "servicios",
    activity: "",
    audience: "",
    goal: "",
    otherGoal: "",
    features: [],
    radar: answerAll({ companyName: item.companyName, industry: item.industry, activity: item.activity }, "A"),
  });
  const presentation = site.radar?.presentation;
  const solution = presentation?.fallback;
  const summary =
    !presentation
      ? "Sin enfoque"
      : presentation.mode === "asistente"
        ? "Asistente"
        : presentation.companion
          ? `${presentation.action} y ${presentation.companion.spec.action}`
          : presentation.action;
  return { config: { ...site, solution }, summary };
}

export default function NecesidadesPage() {
  const cases = CASES.map((item) => ({ ...item, ...preview(item) }));

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>Diagnóstico de ejemplo</p>
        <h1>Qué necesita cada negocio</h1>
        <p>
          Cada bloque sale del problema principal. Si el negocio tiene otra necesidad distinta, aparece una segunda pieza.
          Una panadería no recibe agenda de visitas. Un hotel, una clínica o una consultoría sí.
        </p>
        <nav className={styles.nav} aria-label="Negocios de ejemplo">
          {cases.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.companyName}
              <span>{item.summary}</span>
            </a>
          ))}
        </nav>
      </header>
      {cases.map((item) => (
        <section key={item.id} id={item.id} className={styles.case}>
          <div className={styles.caption}>
            <h2>{item.companyName}</h2>
            <p>{item.note}</p>
            <p className={styles.pair}>{item.summary}</p>
          </div>
          <SolutionBlock solution={item.config.solution} tone={item.config.templateId} site={item.config} slotId={item.id} />
        </section>
      ))}
    </main>
  );
}
