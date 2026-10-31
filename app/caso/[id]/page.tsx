import type { Metadata } from "next";
import { CaseDetailView } from "@/components/radar/CaseDetailView";

export const metadata: Metadata = {
  title: "Detalle del caso",
  description: "Cómo tiene hoy la empresa el dato, cómo debería tenerlo y los pasos para llegar.",
};

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseDetailView id={id} />;
}
