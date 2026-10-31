import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/* Capa de acceso: toda lectura de diagnósticos guardados pasa por aquí. */

export const isConsultor = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, process.env.SESSION_SECRET);
});

export async function requireConsultor(): Promise<void> {
  if (!(await isConsultor())) redirect("/consultor/ingresar");
}

export function authConfigured(): boolean {
  return Boolean(process.env.CONSULTOR_PASSWORD && process.env.CONSULTOR_PASSWORD.length >= 10 && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}
