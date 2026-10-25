import type { Metadata } from "next";
import { PreviewScreen } from "@/components/site/PreviewScreen";

export const metadata: Metadata = {
  title: "Página generada",
  description: "Vista de la página construida con las respuestas del formulario.",
};

export default function PreviewPage() {
  return <PreviewScreen />;
}
