import { Suspense } from "react";
import type { Metadata } from "next";
import { RadarWizard } from "@/components/radar/RadarWizard";

export const metadata: Metadata = {
  title: "Formulario",
  description: "Radar IA: diagnóstico de madurez en datos e IA, adaptado a la industria de la empresa.",
};

export default function DiagnosticPage() {
  return (
    <Suspense fallback={<p className="status">Cargando el formulario…</p>}>
      <RadarWizard />
    </Suspense>
  );
}
