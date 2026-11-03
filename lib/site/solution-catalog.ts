import { activityOf, emptyRadarAnswers, screensFor } from "@/lib/radar/engine";
import type { SketchHoleId } from "@/lib/radar/presentation";
import { sketchHole } from "@/lib/radar/presentation";
import type { IndustryId, OptionKey, RadarAnswers } from "@/lib/radar/types";
import { buildSite } from "@/lib/site/engine";
import type { SiteConfig } from "@/types/site";
import type { SectorId } from "@/types/site";

export type CatalogSector = {
  label: string;
  companyName: string;
  sectorId: SectorId;
  industry: IndustryId;
  activity: string;
  activityLabel: string;
};

export const CATALOG_SECTORS: CatalogSector[] = [
  {
    label: "Turismo",
    companyName: "Laguna Verde",
    sectorId: "turismo",
    industry: "turismo",
    activity: "turismo-hotel",
    activityLabel: "Hotel o alojamiento",
  },
  {
    label: "Gastronomía",
    companyName: "Cocina del Roble",
    sectorId: "gastronomia",
    industry: "alimentos",
    activity: "alimentos-restaurante",
    activityLabel: "Restaurante",
  },
  {
    label: "Servicios",
    companyName: "Consulta Andina",
    sectorId: "servicios",
    industry: "salud",
    activity: "salud-ips",
    activityLabel: "IPS, clínica o consultorio",
  },
  {
    label: "Agro",
    companyName: "Finca del Alba",
    sectorId: "agroindustria",
    industry: "pecuaria",
    activity: "pecuaria-bovinos",
    activityLabel: "Ganadería bovina",
  },
  {
    label: "Metalurgia",
    companyName: "Taller Boyacá",
    sectorId: "metalurgia",
    industry: "mineria",
    activity: "mineria-extraccion",
    activityLabel: "Extracción minera",
  },
  {
    label: "Tienda",
    companyName: "Vitrina Centro",
    sectorId: "retail",
    industry: "moda",
    activity: "moda-compraventa",
    activityLabel: "Tienda física de moda",
  },
];

export const CATALOG_HOLES: { id: SketchHoleId; label: string }[] = [
  { id: "agenda", label: "Agenda" },
  { id: "registro", label: "Registro" },
  { id: "inventario", label: "Inventario" },
  { id: "solicitudes", label: "Solicitudes" },
  { id: "asistente", label: "Asistente" },
];

function demoAnswers(base: Partial<RadarAnswers>, pick: OptionKey): RadarAnswers {
  let answers: RadarAnswers = {
    ...emptyRadarAnswers(),
    companyName: "Demo",
    size: "pequena",
    goals: ["costos"],
    consent: true,
    city: "Tunja",
    contactName: "Ana",
    contactLastName: "Pérez",
    email: "ana@ejemplo.co",
    phone: "3001234567",
    contactPhone: "3011234567",
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

/** Página de muestra para el catálogo sector × tipo de solución. */
export function buildCatalogConfig(sector: CatalogSector, hole: SketchHoleId): SiteConfig {
  const { industry, activity } = activityOf({ industry: sector.industry, activity: sector.activity });
  const vocab = industry
    ? { ...industry.vocab, ...activity?.vocab }
    : { productos: "productos", clientes: "clientes", punto: "sede" };
  const activityLabel = activity?.label ?? sector.activityLabel;
  const solution = sketchHole(
    {
      companyName: sector.companyName,
      industryId: sector.industry,
      activityId: sector.activity,
      activityLabel,
      vocab,
    },
    hole,
  );
  const radar =
    hole === "asistente"
      ? demoAnswers(
          {
            companyName: sector.companyName,
            industry: sector.industry,
            activity: sector.activity,
          },
          "D",
        )
      : {
          ...emptyRadarAnswers(),
          companyName: sector.companyName,
          industry: sector.industry,
          activity: sector.activity,
        };

  return buildSite({
    companyName: sector.companyName,
    sectorId: sector.sectorId,
    activity: "",
    audience: "",
    goal: "",
    otherGoal: "",
    features: [],
    radar,
    solution,
  });
}
