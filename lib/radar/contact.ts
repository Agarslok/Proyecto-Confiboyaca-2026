import type { RadarAnswers } from "@/lib/radar/types";

/* ============================================================================
   Datos de contacto: obligatorios, porque con ellos el equipo hace el
   seguimiento. La misma validación corre en el formulario y en el servidor.
   ========================================================================== */

/** Municipios sugeridos (Boyacá primero). Se puede escribir cualquier otro. */
export const CITY_SUGGESTIONS = [
  "Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Puerto Boyacá", "Villa de Leyva", "Moniquirá",
  "Garagoa", "Aquitania", "Samacá", "Nobsa", "Tibasosa", "Soatá", "Miraflores", "Ramiriquí", "Socha",
  "Santa Rosa de Viterbo", "Ventaquemada", "Toca", "Tuta", "Cómbita", "Motavita", "Siachoque", "Soracá",
  "Jenesano", "Tibaná", "Turmequé", "Nuevo Colón", "Sáchica", "Sutamarchán", "Ráquira", "Saboyá",
  "Otanche", "Muzo", "Guateque", "Belén", "Cerinza", "Firavitoba", "Iza", "Pesca", "Tota", "Mongua",
  "Gámeza", "Tópaga", "Corrales", "Paz de Río", "El Cocuy", "Güicán",
  "Bogotá", "Medellín", "Bucaramanga", "Yopal", "Villavicencio",
];

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
}

function isName(value: string): boolean {
  return /^[\p{L}][\p{L}\s'.-]{1,59}$/u.test(value.trim());
}

/** Errores de la pantalla «Empresa», por campo. Vacío = todo bien. */
export function contactErrors(answers: Pick<RadarAnswers, "companyName" | "size" | "city" | "contactName" | "contactLastName" | "email" | "phone" | "consent">): Record<string, string> {
  const errors: Record<string, string> = {};
  if (answers.companyName.trim().length < 2) errors.companyName = "Escriba el nombre de la empresa.";
  if (!answers.size) errors.size = "Elija el tamaño de la empresa.";
  if (answers.city.trim().length < 3) errors.city = "Escriba o elija la ciudad o municipio.";
  if (!isName(answers.contactName)) errors.contactName = "Escriba el nombre de la persona de contacto.";
  if (!isName(answers.contactLastName)) errors.contactLastName = "Escriba el apellido.";
  if (!isEmail(answers.email)) errors.email = "Escriba un correo válido, por ejemplo nombre@empresa.com.";
  const digits = phoneDigits(answers.phone);
  if (digits.length < 10) errors.phone = "El teléfono debe tener al menos 10 números.";
  else if (digits.length > 13) errors.phone = "Revise el teléfono: tiene demasiados números.";
  if (!answers.consent) errors.consent = "Para guardar el diagnóstico necesitamos su autorización.";
  return errors;
}
