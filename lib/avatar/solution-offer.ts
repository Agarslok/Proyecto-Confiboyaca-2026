/** Detecta si la respuesta del consultor invita a abrir «Solución del avatar». */
export function answerOffersAvatarSolution(text: string): boolean {
  const normalized = text.toLowerCase();
  if (/soluci[oó]n del avatar/.test(normalized)) return true;
  if (normalized.includes("/solucion")) return true;
  if (/(bot[oó]n|pulse|oprim|toque|presione|use|usa|abre|abra).{0,48}soluci/.test(normalized)) return true;
  if (/soluci[oó]n.{0,32}(bot[oó]n|abajo|en pantalla)/.test(normalized)) return true;
  return false;
}
