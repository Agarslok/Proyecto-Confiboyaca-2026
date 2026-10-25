import type { Metadata } from "next";
import { StandaloneSitePage } from "@/components/site/StandaloneSitePage";

export const metadata: Metadata = {
  title: "Sitio generado",
  description: "Vista completa de la página generada por sector.",
};

export default function SitioPage() {
  return <StandaloneSitePage />;
}
