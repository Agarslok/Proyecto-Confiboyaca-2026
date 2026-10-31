"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfigured, isConsultor } from "@/lib/auth/dal";
import {
  SESSION_COOKIE,
  SESSION_HOURS,
  clearFailures,
  createSessionToken,
  loginBlocked,
  passwordMatches,
  registerFailure,
} from "@/lib/auth/session";
import { getDiagnosisStore, type LeadStatus, type SaveResult } from "@/lib/store/diagnoses";

/**
 * Deja el motivo real en el log del servidor (en Netlify: Functions → log).
 * Los mensajes de error del almacén no incluyen llaves ni datos personales.
 */
function logStoreError(action: string, error: unknown): void {
  console.error(`[radar] No se pudo ${action}:`, error instanceof Error ? `${error.name}: ${error.message}` : error);
}

/**
 * Guarda el diagnóstico al terminar la encuesta. Es pública (la llena el
 * cliente), pero solo crea registros: para modificar uno existente hace falta
 * el token que recibió el mismo navegador, o una sesión de consultor.
 */
export async function saveRadarDiagnosis(raw: unknown): Promise<SaveResult> {
  try {
    const record = raw && typeof raw === "object" ? (raw as { recordId?: unknown; editToken?: unknown }) : {};
    const id = typeof record.recordId === "string" ? record.recordId : undefined;
    const editToken = typeof record.editToken === "string" ? record.editToken : undefined;
    const asConsultant = id ? await isConsultor() : false;
    return await (await getDiagnosisStore()).save(raw as never, { id, editToken, asConsultant });
  } catch (error) {
    logStoreError("guardar el diagnóstico", error);
    return { ok: false, error: "No se pudo guardar el diagnóstico en el servidor." };
  }
}

export interface LoginState {
  error?: string;
}

export async function loginConsultor(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!authConfigured()) {
    return { error: "El acceso no está configurado: faltan CONSULTOR_PASSWORD y SESSION_SECRET en .env.local." };
  }
  const requestHeaders = await headers();
  const key = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (loginBlocked(key)) return { error: "Demasiados intentos. Espere 5 minutos y vuelva a intentarlo." };

  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password, process.env.CONSULTOR_PASSWORD)) {
    registerFailure(key);
    return { error: "Contraseña incorrecta." };
  }

  clearFailures(key);
  (await cookies()).set(SESSION_COOKIE, createSessionToken(process.env.SESSION_SECRET!), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  redirect("/consultor");
}

export async function logoutConsultor(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/consultor/ingresar");
}

/** El cliente pide desde su diagnóstico que lo llamen. */
export async function requestFollowUp(recordId: string, editToken: string): Promise<boolean> {
  try {
    return await (await getDiagnosisStore()).requestFollowUp(String(recordId), String(editToken));
  } catch (error) {
    logStoreError("registrar la solicitud de llamada", error);
    return false;
  }
}

/** Solo consultores: estado del seguimiento y notas. */
export async function updateLeadStatus(_previous: { saved?: boolean; error?: string }, formData: FormData): Promise<{ saved?: boolean; error?: string }> {
  if (!(await isConsultor())) return { error: "La sesión terminó. Vuelva a entrar." };
  const ok = await (await getDiagnosisStore()).setStatus(
    String(formData.get("id") ?? ""),
    String(formData.get("status") ?? "") as LeadStatus,
    String(formData.get("notes") ?? ""),
  );
  return ok ? { saved: true } : { error: "No se pudo guardar el estado." };
}

/**
 * Solo consultores: deja la base en cero (por ejemplo, antes del despliegue
 * final). Hay que escribir BORRAR; antes se guarda una copia de respaldo.
 */
export async function resetAllDiagnoses(_previous: { done?: string; error?: string }, formData: FormData): Promise<{ done?: string; error?: string }> {
  if (!(await isConsultor())) return { error: "La sesión terminó. Vuelva a entrar." };
  if (String(formData.get("confirm") ?? "").trim() !== "BORRAR") return { error: "Escriba BORRAR, en mayúsculas, para confirmar." };
  try {
    const { removed, backup } = await (await getDiagnosisStore()).clear();
    revalidatePath("/consultor");
    return { done: removed ? `Se borraron ${removed} diagnósticos. Copia de respaldo: ${backup}.` : "La base ya estaba vacía." };
  } catch (error) {
    logStoreError("reiniciar la base", error);
    return { error: "No se pudo reiniciar la base." };
  }
}
