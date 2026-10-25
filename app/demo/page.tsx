import type { Metadata } from "next";
import { DemoExperience } from "@/components/demos/DemoExperience";

export const metadata: Metadata = {
  title: "Demostración",
  description: "Demostración interactiva con datos ficticios.",
};

export default function DemoPage() {
  return <DemoExperience />;
}
