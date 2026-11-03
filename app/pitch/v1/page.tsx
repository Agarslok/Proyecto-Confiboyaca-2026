import type { Metadata } from "next";
import { PitchV1 } from "@/features/pitch-show/decks";

export const metadata: Metadata = {
  title: "Pitch v1 · Cómo implementar la IA sin morir en el intento",
  description: "Primera versión del pitch interactivo (14 diapositivas).",
};

export default function PitchV1Page() {
  return <PitchV1 />;
}
