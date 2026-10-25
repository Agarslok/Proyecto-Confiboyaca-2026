import { memoryRepositories } from "@/lib/repositories/memory";
import type { Repositories } from "@/lib/repositories/contracts";

export type { Repositories } from "@/lib/repositories/contracts";
export { resetMemoryStore } from "@/lib/repositories/memory";

export class PersistenceNotReadyError extends Error {
  constructor() {
    super(
      "La persistencia en Supabase no está conectada. Esta versión guarda el recorrido solo en este navegador y, en el servidor, en memoria del proceso.",
    );
    this.name = "PersistenceNotReadyError";
  }
}

export function getRepositories(): Repositories {
  const selected = process.env.DATA_PROVIDER ?? "memory";
  if (selected === "memory" || selected === "") return memoryRepositories;
  throw new PersistenceNotReadyError();
}
