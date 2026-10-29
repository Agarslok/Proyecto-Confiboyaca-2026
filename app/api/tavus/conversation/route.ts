import { NextResponse } from "next/server";
import { tavusConfigPresence, tavusIsConfigured } from "@/lib/tavus/config";

/** Solo lectura. La sala del avatar se crea en /api/async/avatar, sin reunión. */
export async function GET() {
  if (tavusIsConfigured()) {
    return NextResponse.json({ configured: true });
  }
  return NextResponse.json({
    configured: false,
    error:
      "Tavus no está configurado en el servidor. Defina TAVUS_API_KEY, TAVUS_REPLICA_ID y TAVUS_PERSONA_ID.",
    checks: tavusConfigPresence(),
  });
}
