import assert from "node:assert/strict";
import test from "node:test";
import { opsTablesFromEntities } from "../lib/assistant/ops-capture";
import { cloneCrmCatalog } from "../lib/assistant/crm-state";
import { crmCatalogFromVoice } from "../lib/assistant/crm-catalog";
import { askBusinessAssistant, assistantContextFromAnswers } from "../lib/radar/ask-assistant";
import { solutionVoice } from "../lib/radar/solution-voice";
import { answerAll } from "./helpers/radar-answers";

test("consultas operativas resuelven en local sin llamar a Gemini", async () => {
  const answers = answerAll(
    { companyName: "Laguna Verde", industry: "turismo", activity: "turismo-hotel" },
    "D",
  );
  const context = assistantContextFromAnswers(answers);
  const voice = solutionVoice({ companyName: "Laguna Verde", industryId: "turismo", activityId: "turismo-hotel" });
  const entities = cloneCrmCatalog(crmCatalogFromVoice(voice, "turismo"));
  const reservas = entities.find((entity) => entity.id === "reservas");
  if (reservas) {
    reservas.rows.push({
      guest: "Familia Moreno",
      arrival: "Hoy",
      guestCount: "2",
      room: "Habitación doble",
    });
  }
  context.opsTables = opsTablesFromEntities(entities);

  let fetchCalls = 0;
  const reply = await askBusinessAssistant(
    { question: "¿Cuántas reservas tengo?", history: [], context },
    {
      fetchImpl: async () => {
        fetchCalls += 1;
        return new Response("{}", { status: 500 });
      },
    },
  );
  assert.equal(reply.engine, "local");
  assert.match(reply.answer, /reserva/i);
  assert.equal(fetchCalls, 0);
});
