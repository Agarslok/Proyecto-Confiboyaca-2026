import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { crmCatalogFromVoice } from "../lib/assistant/crm-catalog";
import { cloneCrmCatalog } from "../lib/assistant/crm-state";
import { stampRowMeta } from "../lib/assistant/crm-row-meta";
import { opsTablesFromEntities } from "../lib/assistant/ops-capture";
import { opsBriefFromEntities } from "../lib/assistant/ops-brief";
import { solutionVoice } from "../lib/radar/solution-voice";
import { sanitizeAssistantPayload } from "../lib/radar/assistant-payload";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(4000),
});

const contextSchema = z.object({
  companyName: z.string().trim().min(1).max(80),
  index: z.number().int().min(0).max(100),
  level: z.string().trim().max(20).default(""),
  findings: z.array(z.string().trim().max(240)).max(8).default([]),
  industry: z.string().default(""),
  activity: z.string().default(""),
  size: z.string().default(""),
  items: z.array(z.string().max(80)).max(6).default([]),
  customers: z.array(z.string().max(80)).max(4).default([]),
  role: z.string().default(""),
  focus: z.string().default(""),
  productos: z.string().default(""),
  clientes: z.string().default(""),
  punto: z.string().default(""),
  opsBrief: z.string().trim().max(4000).optional(),
  opsTables: z
    .array(
      z.object({
        tableLabel: z.string().trim().max(80),
        columns: z
          .array(
            z.object({
              key: z.string().trim().max(40),
              label: z.string().trim().max(80),
              slot: z.enum(["who", "when", "howMany", "what"]),
              options: z.array(z.string().trim().max(120)).max(24).default([]),
            }),
          )
          .max(4),
        rows: z.array(z.record(z.string().max(40), z.string().max(500))).max(12).optional(),
      }),
    )
    .max(8)
    .optional(),
});

test("payload largo del chat y filas CRM pasan la validación del API", () => {
  const voice = solutionVoice({ companyName: "Finca La Esperanza", industryId: "agro", activityId: "agro-cultivo" });
  const entities = cloneCrmCatalog(crmCatalogFromVoice(voice, "agro", "agro-cultivo"));
  const reservas = entities.find((entity) => entity.id === "existencias");
  if (reservas) {
    reservas.rows.push({
      ...stampRowMeta("assistant"),
      ...(reservas.columns.reduce(
        (row, column) => ({ ...row, [column.key]: "Cultivo de prueba con nombre muy largo para validar recorte sin error 400 en consultas de existencias" }),
        {} as Record<string, string>,
      ) as Record<string, string>),
    });
  }
  const opsTables = opsTablesFromEntities(entities);
  const longReply = `${"Perfecto.\n\n".repeat(40)}Cliente: Juan`;
  const payload = sanitizeAssistantPayload({
    context: {
      companyName: "Finca La Esperanza",
      industry: "Agro",
      activity: "Cultivo",
      industryId: "agro",
      activityId: "agro-cultivo",
      size: "",
      index: 72.4 as unknown as number,
      level: "bajo",
      findings: [],
      items: [],
      customers: [],
      role: "Asistente",
      focus: "",
      productos: "cosechas",
      clientes: "compradores",
      punto: "finca",
      opsBrief: opsBriefFromEntities(entities, "Agro"),
      opsTables,
    },
    history: [
      { role: "user", text: "Registra cosecha" },
      { role: "assistant", text: longReply },
    ],
  });

  assert.ok(contextSchema.safeParse(payload.context).success);
  assert.ok(
    z
      .object({
        question: z.string().max(500),
        history: z.array(turnSchema).max(8),
        context: contextSchema,
      })
      .safeParse({ question: "¿Qué cosechas quedan en existencias?", history: payload.history, context: payload.context })
      .success,
  );
  assert.equal(payload.context.index, 72);
});
