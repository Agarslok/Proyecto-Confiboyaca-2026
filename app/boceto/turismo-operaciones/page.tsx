import type { Metadata } from "next";
import { TurismoTemplate } from "@/components/templates/TurismoTemplate";
import { buildSite } from "@/lib/site/engine";
import { emptyRadarAnswers } from "@/lib/radar/engine";

export const metadata: Metadata = {
  title: "Boceto · turismo · operación",
  description: "Tres secciones con asistente, base de datos y dashboard en plantilla hotel.",
};

export default function TurismoOperacionesBocetoPage() {
  const config = buildSite({
    companyName: "Laguna Verde",
    sectorId: "turismo",
    activity: "",
    audience: "",
    goal: "",
    otherGoal: "",
    features: [],
    radar: {
      ...emptyRadarAnswers(),
      companyName: "Laguna Verde",
      industry: "turismo",
      activity: "turismo-hotel",
      size: "pequena",
    },
  });

  return <TurismoTemplate config={config} />;
}
