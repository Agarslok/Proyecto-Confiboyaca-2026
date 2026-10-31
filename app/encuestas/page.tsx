import type { Metadata } from "next";
import { NicheCatalog } from "@/components/radar/NicheCatalog";

export const metadata: Metadata = {
  title: "Encuestas por nicho",
  description: "Catálogo del Radar IA: preguntas de cada nicho y acceso directo para aplicar la encuesta.",
};

export default function EncuestasPage() {
  return <NicheCatalog />;
}
