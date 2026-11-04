import { NextResponse } from "next/server";
import { z } from "zod";
import { readOpsWorkspace, saveOpsWorkspace } from "@/lib/store/ops-workspace";

const rowSchema = z.record(z.string().max(40), z.string().max(500));

const bodySchema = z.object({
  workspaceId: z.string().trim().min(3).max(80),
  companyName: z.string().trim().max(80).default(""),
  industryId: z.string().trim().max(40).default(""),
  activityId: z.string().trim().max(60).default(""),
  recordCode: z.string().trim().max(40).default(""),
  crm: z.record(z.string().max(40), z.array(rowSchema).max(2000)),
  chat: z.object({
    used: z.number().int().min(0).max(10000),
    thread: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          text: z.string().max(4000),
        }),
      )
      .max(80),
  }),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() ?? "";
  if (!/^[\w:.-]{3,80}$/.test(workspaceId)) {
    return NextResponse.json({ error: "Espacio de trabajo no válido." }, { status: 400 });
  }
  try {
    const record = await readOpsWorkspace(workspaceId);
    return NextResponse.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer la base.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Los datos de la empresa no tienen el formato esperado." }, { status: 400 });
  }
  const result = await saveOpsWorkspace(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 502 });
  return NextResponse.json({ ok: true, updatedAt: result.updatedAt, skipped: Boolean(result.skipped) });
}
