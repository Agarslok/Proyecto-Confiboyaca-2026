import { getStandSector, type StandSectorId } from "@/features/stand/sectors";

export const STAND_SECTOR_KEY = "confi.stand.sector.v1";

export function readStandSector(): StandSectorId | null {
  if (typeof window === "undefined") return null;
  try {
    return getStandSector(sessionStorage.getItem(STAND_SECTOR_KEY))?.id ?? null;
  } catch {
    return null;
  }
}

export function writeStandSector(id: StandSectorId): void {
  sessionStorage.setItem(STAND_SECTOR_KEY, id);
}
