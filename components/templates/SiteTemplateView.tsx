import type { SiteConfig } from "@/types/site";
import { AgroindustriaTemplate } from "./AgroindustriaTemplate";
import { GastronomiaTemplate } from "./GastronomiaTemplate";
import { MetalurgiaTemplate } from "./MetalurgiaTemplate";
import { RetailTemplate } from "./RetailTemplate";
import { ServiciosTemplate } from "./ServiciosTemplate";
import { TurismoTemplate } from "./TurismoTemplate";

export function SiteTemplateView({ config }: { config: SiteConfig }) {
  switch (config.templateId) {
    case "turismo":
      return <TurismoTemplate config={config} />;
    case "metalurgia":
      return <MetalurgiaTemplate config={config} />;
    case "agroindustria":
      return <AgroindustriaTemplate config={config} />;
    case "gastronomia":
      return <GastronomiaTemplate config={config} />;
    case "retail":
      return <RetailTemplate config={config} />;
    case "servicios":
      return <ServiciosTemplate config={config} />;
    default:
      return null;
  }
}
