import { Suspense } from "react";
import type { Metadata } from "next";
import { StandSectorNote } from "@/features/stand/stand-sector-note";
import { Wizard } from "@/components/diagnostic/Wizard";

export const metadata: Metadata = {
  title: "Diagnóstico del stand",
  description: "Formulario del stand para describir la empresa y generar un diagnóstico local.",
};

export default function StandDiagnosisPage() {
  return (
    <>
      <StandSectorNote />
      <Suspense fallback={<p>Cargando el formulario…</p>}>
        <Wizard homeHref="/stand" resultHref="/stand/resultado" />
      </Suspense>
    </>
  );
}
