import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/* ============================================================================
   Sesión del panel de consultores.

   Una contraseña compartida por el equipo (CONSULTOR_PASSWORD) y una cookie
   firmada con HMAC (SESSION_SECRET) que dura 8 horas. Las dos van en
   .env.local, que no se sube a git. Para cuentas por persona, se reemplaza
   por un proveedor de identidad (por ejemplo Supabase Auth).
   ========================================================================== */

export const SESSION_COOKIE = "radar_consultor";
export const SESSION_HOURS = 8;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Compara en tiempo constante para no filtrar la contraseña por tiempos de respuesta. */
export function passwordMatches(candidate: string, expected: string | undefined): boolean {
  if (!expected || expected.length < 10) return false;
  return timingSafeEqual(digest(candidate), digest(expected));
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ role: "consultor", exp: now + SESSION_HOURS * 3600_000 })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!token || !secret || secret.length < 32) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; exp?: number };
    return data.role === "consultor" && typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

/* Freno sencillo contra adivinar la contraseña: 5 intentos fallidos bloquean 5 minutos. */
const attempts = new Map<string, { count: number; until: number }>();

export function loginBlocked(key: string, now = Date.now()): boolean {
  const entry = attempts.get(key);
  return Boolean(entry && entry.count >= 5 && entry.until > now);
}

export function registerFailure(key: string, now = Date.now()): void {
  const entry = attempts.get(key);
  const count = entry && entry.until > now ? entry.count + 1 : 1;
  attempts.set(key, { count, until: now + 5 * 60_000 });
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
