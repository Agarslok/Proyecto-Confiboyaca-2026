import type { Metadata } from "next";
import { SiteDiagnosis } from "@/components/site/SiteDiagnosis";

export const metadata: Metadata = {
  title: "Resultado",
  description: "Consultoría digital simulada y acceso a la página generada.",
};

export default function ResultPage() {
  return <SiteDiagnosis />;
}
