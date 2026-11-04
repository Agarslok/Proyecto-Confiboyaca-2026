import { workspaceId } from "@/lib/assistant/workspace";

/** Contraseña de demo para volver a cargar el cupo (solo demostración). */
export const SESSION_REACTIVATE_PASSWORD = "admin";

/** Cupo de conversación por sesión (no es el conteo real de la API). */
export const SESSION_QUOTA = 200;

export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Costo por mensaje según palabras.
 * Un intercambio corto (~8 + ~20 palabras) gasta ~20; caben unos 10 en 200.
 */
export function quotaCost(text: string): number {
  const words = wordCount(text);
  if (words <= 0) return 0;
  if (words <= 10) return 8;
  if (words <= 25) return 12;
  if (words <= 50) return 18;
  return 24;
}

export function quotaRemaining(used: number, limit = SESSION_QUOTA): number {
  return Math.max(0, limit - Math.max(0, used));
}

export type AssistantEngine = "local" | "gemini";

/** Solo las respuestas vía Gemini descuentan cupo (consultas locales / CRM = 0). */
export function quotaSpendForTurn(input: {
  engine: AssistantEngine;
  question: string;
  answer: string;
}): number {
  if (input.engine === "local") return 0;
  return quotaCost(input.question) + quotaCost(input.answer);
}

export type OpsChatTurn = { role: "user" | "assistant"; text: string };

export type OpsChatSession = {
  used: number;
  thread: OpsChatTurn[];
};

/** Misma identidad de empresa que la base de datos: código RAD, o industria+actividad en demos. */
export function sessionStorageKey(code: string | undefined, scope?: string): string {
  return `ops-chat:${workspaceId(code, scope)}`;
}

/** La copia vigente es localStorage; la de sessionStorage solo se migra una vez y se borra. */
export function readOpsChatSession(key: string): OpsChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const current = parseOpsChatSession(window.localStorage.getItem(key));
    if (current) return current;
    const legacy = parseOpsChatSession(window.sessionStorage.getItem(key));
    if (legacy) {
      window.localStorage.setItem(key, JSON.stringify(legacy));
      window.sessionStorage.removeItem(key);
    }
    return legacy;
  } catch {
    return null;
  }
}

function parseOpsChatSession(raw: string | null): OpsChatSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OpsChatSession;
    if (!Array.isArray(parsed.thread) || typeof parsed.used !== "number") return null;
    return { used: Math.max(0, parsed.used), thread: parsed.thread };
  } catch {
    return null;
  }
}

export function writeOpsChatSession(key: string, session: OpsChatSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(session));
  } catch {
    /* cupo de almacenamiento lleno: se sigue en memoria */
  }
}
