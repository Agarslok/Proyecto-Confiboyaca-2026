import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OperationsShowcaseView } from "@/components/site/OperationsShowcaseView";
import { SHOWCASE_ENTRIES } from "@/lib/site/operations-showcase";
import { TEMPLATE_IDS, type TemplateId } from "@/types/site";

type Props = { params: Promise<{ templateId: string }> };

export function generateStaticParams() {
  return TEMPLATE_IDS.map((templateId) => ({ templateId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { templateId } = await params;
  const entry = SHOWCASE_ENTRIES.find((item) => item.templateId === templateId);
  if (!entry) return { title: "Plantilla" };
  return {
    title: `Boceto · ${entry.label}`,
    description: `${entry.sector.companyName} — solución operativa (asistente, CRM, dashboard).`,
  };
}

export default async function PlantillaShowcasePage({ params }: Props) {
  const { templateId } = await params;
  if (!TEMPLATE_IDS.includes(templateId as TemplateId)) notFound();
  return <OperationsShowcaseView activeId={templateId as TemplateId} />;
}
