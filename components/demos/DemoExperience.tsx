"use client";

import { AnalyticsDemo } from "@/components/demos/AnalyticsDemo";
import { CrmDemo } from "@/components/demos/CrmDemo";
import { InventoryDemo } from "@/components/demos/InventoryDemo";
import { TasksDemo } from "@/components/demos/TasksDemo";
import { useWalkthrough } from "@/components/layout/useWalkthrough";
import { Button } from "@/components/ui/Button";
import { demos } from "@/config/catalog";

export function DemoExperience({
  emptyFormHref = "/diagnostico",
  diagnosisHref = "/resultado",
  correctHref = "/diagnostico",
}: {
  emptyFormHref?: string;
  diagnosisHref?: string;
  correctHref?: string;
}) {
  const state = useWalkthrough();
  const diagnosis = state.diagnosis;

  if (!diagnosis) {
    return (
      <section className="panel empty-state">
        <p className="kicker">Demostración</p>
        <h1>Todavía no hay una solución que mostrar</h1>
        <p>La demostración se elige cuando el motor de reglas termina el diagnóstico.</p>
        <Button href={emptyFormHref}>Ir al formulario</Button>
      </section>
    );
  }

  const description = demos[diagnosis.demoType].description;

  return (
    <section className="demo">
      <p className="kicker">Demostración interactiva</p>
      <h1>{diagnosis.demoTitle}</h1>
      <p className="lede">
        Vista de ejemplo para {diagnosis.companyName}, ligada a {diagnosis.primaryProblemLabel.toLowerCase()}. {description} Los registros no pertenecen a esa empresa.
      </p>
      <p className="banner" role="note">
        Datos de demostración. No son información real de una empresa.
      </p>
      {diagnosis.demoType === "crm" ? <CrmDemo key={diagnosis.templateKey} templateKey={diagnosis.templateKey} /> : null}
      {diagnosis.demoType === "tasks" ? <TasksDemo key={diagnosis.templateKey} templateKey={diagnosis.templateKey} /> : null}
      {diagnosis.demoType === "inventory" ? (
        <InventoryDemo key={diagnosis.templateKey} templateKey={diagnosis.templateKey} />
      ) : null}
      {diagnosis.demoType === "analytics" ? (
        <AnalyticsDemo key={diagnosis.templateKey} templateKey={diagnosis.templateKey} />
      ) : null}
      <div className="actions">
        <Button href={diagnosisHref} variant="secondary">
          Volver al diagnóstico
        </Button>
        <Button href={correctHref} variant="ghost">
          Corregir respuestas
        </Button>
      </div>
    </section>
  );
}
