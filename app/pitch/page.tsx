import type { Metadata } from "next";
import { PitchV2 } from "@/features/pitch-show/decks";

export const metadata: Metadata = {
  title: "Pitch · Cómo implementar la IA sin morir en el intento",
  description: "Presentación interactiva para pymes: qué es la IA, por qué fallan los intentos y cómo empezar, con el Radar IA.",
};

export default function PitchPage() {
  return <PitchV2 />;
}
