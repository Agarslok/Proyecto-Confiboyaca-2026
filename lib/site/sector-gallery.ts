import files from "@/lib/site/sector-files.json";
import type { IndustryId } from "@/lib/radar/types";

/* ============================================================================
   Fotos de public/media/sectores/<industria>/. El manifiesto sale de esa
   carpeta: portada (y portadav) es la imagen grande; el resto son apoyos.
   El archivo que termina en «v» antes de la extensión es el de celular.
   ========================================================================== */

export interface SectorFrame {
  desktop: string;
  mobile?: string;
}

export interface SectorPhotos {
  hero: SectorFrame;
  shots: SectorFrame[];
}

interface RawFrame {
  desktop: string | null;
  mobile: string | null;
}

const CATALOG = files as Record<string, RawFrame[]>;

function url(industry: string, file: string): string {
  return `/media/sectores/${industry}/${encodeURIComponent(file)}`;
}

function frame(industry: string, row: RawFrame): SectorFrame | null {
  const desktopFile = row.desktop ?? row.mobile;
  if (!desktopFile) return null;
  const mobileFile = row.mobile && row.mobile !== desktopFile ? row.mobile : undefined;
  return {
    desktop: url(industry, desktopFile),
    mobile: mobileFile ? url(industry, mobileFile) : undefined,
  };
}

/** Fotos de la carpeta de esa industria. Vacío si no hay archivos. */
export function photosFor(industry: IndustryId | ""): SectorPhotos | undefined {
  if (!industry) return undefined;
  const rows = CATALOG[industry];
  if (!rows?.length) return undefined;
  const frames = rows.map((row) => frame(industry, row)).filter((item): item is SectorFrame => item !== null);
  const [hero, ...shots] = frames;
  if (!hero) return undefined;
  return { hero, shots };
}
