/**
 * Identidad de un espacio de trabajo (una empresa).
 * Con código RAD, ese código es la empresa. Sin código (demos), el espacio se
 * separa por industria y subactividad para que dos demos no compartan datos.
 */
export function workspaceScope(industryId?: string, activityId?: string): string {
  return `${(industryId || "-").trim()}:${(activityId || "-").trim()}`;
}

export function workspaceId(code: string | undefined, scope?: string): string {
  const company = (code ?? "").trim().toUpperCase();
  if (company) return company;
  return `DEMO:${(scope || "-").trim()}`;
}
