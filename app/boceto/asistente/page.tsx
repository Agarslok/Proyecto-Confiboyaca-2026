import type { Metadata } from "next";
import { AgendaSketch } from "@/components/templates/AgendaSketch";
import { assistantSketch } from "@/lib/radar/assistant";
import { emptyRadarAnswers } from "@/lib/radar/engine";
import type { IndustryId } from "@/lib/radar/types";
import { buildSite } from "@/lib/site/engine";
import type { SectorId } from "@/types/site";

export const metadata: Metadata = {
  title: "Boceto · asistente virtual",
  description: "Hueco de asistente, pintado con los colores de cada plantilla.",
};

const SITES: {
  label: string;
  companyName: string;
  sectorId: SectorId;
  industry: IndustryId;
  activity: string;
  activityLabel: string;
}[] = [
  { label: "Turismo", companyName: "Laguna Verde", sectorId: "turismo", industry: "turismo", activity: "turismo-hotel", activityLabel: "Hotel o alojamiento" },
  { label: "Gastronomía", companyName: "Panadería Carlitos", sectorId: "gastronomia", industry: "alimentos", activity: "alimentos-produccion", activityLabel: "Producción de alimentos" },
  { label: "Servicios", companyName: "Consulta Andina", sectorId: "servicios", industry: "salud", activity: "salud-ips", activityLabel: "IPS, clínica o consultorio" },
  { label: "Agro", companyName: "Finca del Alba", sectorId: "agroindustria", industry: "pecuaria", activity: "pecuaria-bovinos", activityLabel: "Ganadería bovina" },
  { label: "Madera", companyName: "Bosque Alto", sectorId: "servicios", industry: "madera", activity: "madera-bosque", activityLabel: "Aprovechamiento forestal" },
  { label: "Textil", companyName: "Telares del Valle", sectorId: "retail", industry: "moda", activity: "moda-textil", activityLabel: "Textil e insumos" },
];

export default function AssistantSketchPage() {
  const sites = SITES.map((site) => {
    const sketch = assistantSketch(site.companyName, site.industry, site.activity, site.activityLabel);
    return {
      label: site.label,
      config: {
        ...buildSite({
          companyName: site.companyName,
          sectorId: site.sectorId,
          activity: "",
          audience: "",
          goal: "",
          otherGoal: "",
          features: [],
          radar: {
            ...emptyRadarAnswers(),
            companyName: site.companyName,
            industry: site.industry,
            activity: site.activity,
            size: "pequena",
            choices: { "datos-registro": "D", "ia-uso": "D" },
          },
          solution: sketch,
        }),
        solution: sketch,
      },
    };
  });

  return <AgendaSketch sites={sites} />;
}
