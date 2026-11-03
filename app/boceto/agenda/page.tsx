import type { Metadata } from "next";
import { AgendaSketch } from "@/components/templates/AgendaSketch";
import { emptyRadarAnswers } from "@/lib/radar/engine";
import type { IndustryId } from "@/lib/radar/types";
import { agendaVisitSketch } from "@/lib/site/solution-slot";
import { buildSite } from "@/lib/site/engine";
import type { SectorId } from "@/types/site";

export const metadata: Metadata = {
  title: "Boceto · agenda tu visita",
  description: "Misma acción de agendamiento, pintada con los colores de cada plantilla.",
};

const SITES: { label: string; companyName: string; sectorId: SectorId; industry: IndustryId; activity: string }[] = [
  { label: "Turismo", companyName: "Laguna Verde", sectorId: "turismo", industry: "turismo", activity: "turismo-hotel" },
  { label: "Gastronomía", companyName: "Mesa del Páramo", sectorId: "gastronomia", industry: "alimentos", activity: "alimentos-restaurante" },
  { label: "Servicios", companyName: "Consulta Andina", sectorId: "servicios", industry: "salud", activity: "salud-ips" },
  { label: "Agro", companyName: "Finca del Alba", sectorId: "agroindustria", industry: "pecuaria", activity: "pecuaria-bovinos" },
  { label: "Metalurgia", companyName: "Taller Boyacá", sectorId: "metalurgia", industry: "mineria", activity: "mineria-extraccion" },
  { label: "Tienda", companyName: "Vitrina Centro", sectorId: "retail", industry: "moda", activity: "moda-confeccion" },
];

export default function AgendaSketchPage() {
  const sketch = agendaVisitSketch();
  const sites = SITES.map((site) => ({
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
        radar: { ...emptyRadarAnswers(), companyName: site.companyName, industry: site.industry, activity: site.activity },
      }),
      solution: sketch,
    },
  }));

  return <AgendaSketch sites={sites} />;
}
