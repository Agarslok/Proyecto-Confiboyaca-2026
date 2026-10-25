import type { Metadata } from "next";
import { ExternadoHomePage } from "@/components/externado/home-page";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Presentación del diagnóstico empresarial y acceso al formulario.",
};

export default function HomePage() {
  return <ExternadoHomePage />;
}
