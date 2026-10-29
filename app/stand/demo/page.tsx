import type { Metadata } from "next";
import { DemoExperience } from "@/components/demos/DemoExperience";

export const metadata: Metadata = {
  title: "Demostración del stand",
  description: "Demostración interactiva con datos ficticios, ligada al diagnóstico del stand.",
};

export default function StandDemoPage() {
  return (
    <DemoExperience
      emptyFormHref="/stand/diagnostico"
      diagnosisHref="/stand/resultado"
      correctHref="/stand/diagnostico"
    />
  );
}
