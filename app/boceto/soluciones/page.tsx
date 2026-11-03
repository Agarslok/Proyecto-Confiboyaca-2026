import type { Metadata } from "next";
import { SolutionCatalogSketch } from "@/components/templates/SolutionCatalogSketch";

export const metadata: Metadata = {
  title: "Boceto · catálogo de soluciones",
  description: "Combina plantilla sectorial y tipo de solución en el hueco bajo la portada.",
};

export default function SolutionCatalogPage() {
  return <SolutionCatalogSketch />;
}
