import type { Metadata } from "next";
import { OperationsShowcaseHub } from "@/components/site/OperationsShowcaseView";

export const metadata: Metadata = {
  title: "Boceto · plantillas operativas",
  description: "Índice de las seis plantillas con asistente, base de datos y dashboard unificados.",
};

export default function PlantillasOperativasHubPage() {
  return <OperationsShowcaseHub />;
}
