import { redirect } from "next/navigation";
import { SHOWCASE_HUB_PATH } from "@/lib/site/operations-showcase";

/** El catálogo antiguo (agenda/registro/inventario) fue reemplazado por la vitrina operativa única. */
export default function LegacySolucionesCatalogPage() {
  redirect(SHOWCASE_HUB_PATH);
}
