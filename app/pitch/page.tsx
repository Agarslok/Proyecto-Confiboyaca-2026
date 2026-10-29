import type { Metadata } from "next";
import { PitchDeck } from "@/features/pitch/components/pitch-deck";

export const metadata: Metadata = {
  title: "Pitch",
  description: "Presentación guiada sobre inteligencia artificial aplicada a la empresa.",
};

export default function PitchPage() {
  return <PitchDeck />;
}
