import type { Metadata } from "next";
import { DiagnosisScreen } from "@/components/diagnostic/DiagnosisView";
import { StandSectorNote } from "@/features/stand/stand-sector-note";

export const metadata: Metadata = {
  title: "Resultado del stand",
  description: "Lectura generada con el motor de reglas del stand.",
};

export default function StandResultPage() {
  return (
    <>
      <StandSectorNote />
      <DiagnosisScreen formHref="/stand/diagnostico" demoHref="/stand/demo" />
    </>
  );
}
