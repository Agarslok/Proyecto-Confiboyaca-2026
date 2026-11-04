import type { AssistantChatContext } from "@/lib/radar/assistant";

export type AssistantHistoryTurn = { role: "user" | "assistant"; text: string };

const clip = (value: string, max: number) => value.trim().slice(0, max);

export function sanitizeAssistantHistory(history: AssistantHistoryTurn[]): AssistantHistoryTurn[] {
  return history.slice(-8).map((turn) => ({
    role: turn.role,
    text: clip(turn.text, 4000),
  }));
}

/** Ajusta contexto e historial a los límites del API (evita 400 por filas o mensajes largos). */
export function sanitizeAssistantPayload(input: {
  context: AssistantChatContext;
  history: AssistantHistoryTurn[];
}): { context: AssistantChatContext; history: AssistantHistoryTurn[] } {
  const context = sanitizeAssistantContext(input.context);
  return { context, history: sanitizeAssistantHistory(input.history) };
}

export function sanitizeAssistantContext(context: AssistantChatContext): AssistantChatContext {
  const index = Number(context.index);
  return {
    ...context,
    companyName: clip(context.companyName, 80) || "El negocio",
    industry: clip(context.industry ?? "", 80),
    activity: clip(context.activity ?? "", 80),
    industryId: context.industryId ? clip(context.industryId, 40) : undefined,
    activityId: context.activityId ? clip(context.activityId, 60) : undefined,
    size: clip(context.size ?? "", 80),
    index: Number.isFinite(index) ? Math.min(100, Math.max(0, Math.round(index))) : 0,
    level: clip(context.level ?? "", 20),
    findings: (context.findings ?? []).slice(0, 8).map((item) => clip(item, 240)),
    items: (context.items ?? []).slice(0, 6).map((item) => clip(item, 80)),
    customers: (context.customers ?? []).slice(0, 4).map((item) => clip(item, 80)),
    role: clip(context.role ?? "", 80),
    focus: clip(context.focus ?? "", 240),
    productos: clip(context.productos ?? "productos", 60),
    clientes: clip(context.clientes ?? "clientes", 60),
    punto: clip(context.punto ?? "sede", 60),
    opsBrief: context.opsBrief ? clip(context.opsBrief, 4000) : undefined,
    opsProfileGuidance: context.opsProfileGuidance ? clip(context.opsProfileGuidance, 1200) : undefined,
    companyNameHint: context.companyNameHint ? clip(context.companyNameHint, 400) : undefined,
    opsTables: context.opsTables
      ?.slice(0, 8)
      .map((table) => ({
        tableLabel: clip(table.tableLabel, 80),
        columns: table.columns.slice(0, 4).map((column) => ({
          key: clip(column.key, 40),
          label: clip(column.label, 80),
          slot: column.slot,
          options: column.options.slice(0, 24).map((option) => clip(option, 120)),
        })),
        rows: table.rows?.slice(0, 12).map((row) =>
          Object.fromEntries(
            Object.entries(row)
              .filter(([key]) => key.length <= 40)
              .map(([key, value]) => [key, clip(String(value ?? ""), 500)]),
          ),
        ),
      })),
  };
}
