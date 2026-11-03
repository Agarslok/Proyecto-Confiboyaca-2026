import type { Metadata } from "next";
import { PitchDeck } from "@/features/pitch/components/pitch-deck";

export const metadata: Metadata = {
  title: "Pitch clásico",
  description: "Presentación guiada sobre inteligencia artificial aplicada a la empresa (versión anterior).",
};

export default function ClassicPitchPage() {
  return <PitchDeck />;
}
