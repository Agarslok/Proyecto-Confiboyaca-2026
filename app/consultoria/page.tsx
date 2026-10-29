import type { Metadata } from "next";
import { ExternadoHomePage } from "@/components/externado/home-page";

export const metadata: Metadata = {
  title: "Consultoría",
  description: "Presentación del diagnóstico empresarial y acceso al formulario de página web.",
};

export default function ConsultoriaPage() {
  return <ExternadoHomePage />;
}
