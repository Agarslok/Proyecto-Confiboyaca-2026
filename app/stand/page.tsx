import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Stand",
  description: "Consultoría y generador de página web.",
};

export default function StandPage() {
  redirect("/consultoria");
}
