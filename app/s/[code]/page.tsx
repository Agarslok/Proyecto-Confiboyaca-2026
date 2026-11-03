import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteTemplateView } from "@/components/templates/SiteTemplateView";
import { siteConfigFromDiagnosis } from "@/lib/site/from-radar";
import { getDiagnosisStore, StoreNotConfiguredError } from "@/lib/store/diagnoses";

export const metadata: Metadata = {
  title: "Solución guardada",
  robots: { index: false, follow: false },
};

function SolutionShell({ children }: { children: ReactNode }) {
  return <div className="saved-solution-page">{children}</div>;
}

export default async function SavedSolutionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const label = code.trim().toUpperCase();

  try {
    const record = await (await getDiagnosisStore()).get(label);
    const config = record ? siteConfigFromDiagnosis(record) : null;
    if (!record || !config) {
      return (
        <SolutionShell>
          <main className="wrap empty-state">
            <p className="micro accent">Solución</p>
            <h1 className="display r-title">No encontramos ese código</h1>
            <p className="lead sm">
              El enlace <strong>/s/{label}</strong> no corresponde a un diagnóstico guardado. Revise el código del QR o
              vuelva a generar la consultoría.
            </p>
          </main>
        </SolutionShell>
      );
    }

    return (
      <SolutionShell>
        <SiteTemplateView config={config} />
      </SolutionShell>
    );
  } catch (error) {
    const message = error instanceof StoreNotConfiguredError ? error.message : "No se pudo abrir la base de diagnósticos.";
    return (
      <SolutionShell>
        <main className="wrap empty-state">
          <p className="micro accent">Solución</p>
          <h1 className="display r-title">La base todavía no está conectada</h1>
          <p className="lead sm">{message}</p>
        </main>
      </SolutionShell>
    );
  }
}
