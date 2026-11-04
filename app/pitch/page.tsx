import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "IA sin morir en el intento",
  description:
    "Pitch del Radar IA · Departamento de Matemáticas, Universidad Externado de Colombia",
};

/** Presentación embebida (HTML standalone en /public/pitch). Regenerar con `node scripts/sync-pitch-html.mjs`. */
export default function PitchPage() {
  redirect("/pitch/pitch-ia-sin-morir.html");
}
