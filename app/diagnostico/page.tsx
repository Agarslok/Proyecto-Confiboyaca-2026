import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteWizard } from "@/components/site/SiteWizard";

export const metadata: Metadata = {
  title: "Formulario",
  description: "Formulario para describir la empresa y generar una página de demostración.",
};

export default function DiagnosticPage() {
  return (
    <Suspense fallback={<p className="status">Cargando el formulario…</p>}>
      <SiteWizard />
    </Suspense>
  );
}
