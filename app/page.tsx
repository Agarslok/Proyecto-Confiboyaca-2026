import type { Metadata } from "next";
import { ExperienceGate } from "@/features/entry/experience-gate";

export const metadata: Metadata = {
  title: "Experiencias",
  description: "Entrada para elegir entre la presentación y el stand interactivo.",
};

export default function HomePage() {
  return <ExperienceGate />;
}
