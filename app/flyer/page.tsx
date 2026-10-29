import type { Metadata } from "next";
import { RadarFlyer } from "@/components/radar/RadarFlyer";

export const metadata: Metadata = {
  title: "Flyer del diagnóstico",
  description: "Resumen de una página del diagnóstico Radar IA, listo para guardar como PDF.",
};

export default function FlyerPage() {
  return <RadarFlyer />;
}
