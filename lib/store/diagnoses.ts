import { join, resolve } from "node:path";
import { createSupabaseStore } from "@/lib/store/supabase";
import type { DiagnosisStore } from "@/lib/store/shared";

/* ============================================================================
   Diagnósticos guardados en el servidor. Se elige el almacén con RADAR_STORE:

     sqlite    (por defecto) archivo local data/radar.db o RADAR_DB_PATH.
               Para trabajar en un computador.
     supabase  Postgres en Supabase, con SUPABASE_URL y SUPABASE_SECRET_KEY.
               Para Netlify, donde no hay disco que se conserve.

   SQLite se importa solo cuando se usa, para que en Netlify no se cargue.
   Solo se importa desde Server Actions, Server Components y rutas.
   ========================================================================== */

export { LEAD_LABELS, LEAD_STATUSES, type LeadStatus } from "@/lib/store/lead-status";
export type { ClearResult, DiagnosisRecord, DiagnosisStore, DiagnosisSummary, ListQuery, SaveResult } from "@/lib/store/shared";
export { validateForStorage } from "@/lib/store/shared";

export class StoreNotConfiguredError extends Error {}

let store: Promise<DiagnosisStore> | null = null;

async function open(): Promise<DiagnosisStore> {
  const kind = (process.env.RADAR_STORE || "sqlite").toLowerCase();
  if (kind === "supabase") {
    /* Sin espacios ni comillas de más: es fácil pegarlos al copiar la llave. */
    const url = process.env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
    const key = process.env.SUPABASE_SECRET_KEY?.trim().replace(/^["']|["']$/g, "");
    if (!url || !key) throw new StoreNotConfiguredError("Faltan SUPABASE_URL y SUPABASE_SECRET_KEY para RADAR_STORE=supabase.");
    /* Supabase muestra la llave enmascarada con «•»: si se copia así, no es la llave. */
    if (/[^!-~]/.test(key)) {
      throw new StoreNotConfiguredError("SUPABASE_SECRET_KEY tiene caracteres no válidos (¿se copió enmascarada con «•»?). Muéstrela con el ojo en Supabase y cópiela completa.");
    }
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
      throw new StoreNotConfiguredError("SUPABASE_URL debe ser la Project URL de Supabase, como https://xxxx.supabase.co.");
    }
    return createSupabaseStore(url, key);
  }
  if (kind !== "sqlite") throw new StoreNotConfiguredError(`RADAR_STORE no reconocido: «${kind}». Use sqlite o supabase.`);
  const { createSqliteStore } = await import("@/lib/store/sqlite");
  /* La ruta viene del entorno: se le dice a Turbopack que no la rastree, para no empaquetar todo el proyecto. */
  const path = process.env.RADAR_DB_PATH
    ? resolve(/* turbopackIgnore: true */ process.env.RADAR_DB_PATH)
    : join(process.cwd(), "data", "radar.db");
  return createSqliteStore(path);
}

export function getDiagnosisStore(): Promise<DiagnosisStore> {
  if (!store) store = open().catch((error) => {
    store = null;
    throw error;
  });
  return store;
}

/** Qué almacén está activo, para mostrarlo en el panel. */
export function storeLabel(): string {
  return (process.env.RADAR_STORE || "sqlite").toLowerCase() === "supabase" ? "Supabase" : "SQLite local";
}
