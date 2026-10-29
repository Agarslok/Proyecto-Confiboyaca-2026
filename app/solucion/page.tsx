import { SiteTemplateView } from "@/components/templates/SiteTemplateView";
import { buildSite } from "@/lib/site/engine";
import "./solucion.css";

const example = buildSite({
  companyName: "Sendero Andino",
  sectorId: "turismo",
  activity: "Recorridos de ejemplo para mostrar cómo se vería una página del sector.",
  audience: "personas",
  goal: "reservas",
  otherGoal: "",
  features: ["presentacion", "galeria", "contacto"],
});

export default function SolucionPage() {
  return (
    <>
      <a className="solucion-back" href="/pitch">
        Volver a la presentación
      </a>
      <SiteTemplateView config={example} />
    </>
  );
}
