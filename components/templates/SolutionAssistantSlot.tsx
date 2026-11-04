"use client";

import { useEffect, useRef, useState } from "react";
import { opsBriefFromSector, opsTablesFromSector } from "@/lib/assistant/ops-brief";
import {
  quotaRemaining,
  quotaSpendForTurn,
  readOpsChatSession,
  sessionStorageKey,
  SESSION_QUOTA,
  SESSION_REACTIVATE_PASSWORD,
  writeOpsChatSession,
  type AssistantEngine,
} from "@/lib/assistant/session-quota";
import { workspaceScope } from "@/lib/assistant/workspace";
import { activityProfile, compactProfileGuidance } from "@/lib/ops/sector/profile-builder";
import { samplesFor, type AssistantChatContext } from "@/lib/radar/assistant";
import type { IndustryId } from "@/lib/radar/types";
import { SessionReactivateModal } from "@/components/templates/SessionReactivateModal";
import type { SolutionAssistantSpec } from "@/lib/site/solution-slot";
import type { SiteConfig } from "@/types/site";
import type { TemplateId } from "@/types/site";
import slotStyles from "./solution-slot.module.css";
import styles from "./solution-assistant-slot.module.css";

type Turn = { role: "user" | "assistant"; text: string };

export function SolutionAssistantSlot({
  spec,
  tone,
  site,
}: {
  spec: SolutionAssistantSpec;
  tone: TemplateId;
  site?: Pick<SiteConfig, "companyName" | "recordCode" | "industryId" | "activityId" | "radar">;
}) {
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<Turn[]>([{ role: "assistant", text: spec.greeting }]);
  const [asking, setAsking] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const askingRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const storageKey = sessionStorageKey(site?.recordCode, workspaceScope(site?.industryId, site?.activityId));
  const context = chatContext(spec, site);
  const remaining = quotaRemaining(quotaUsed);
  const locked = remaining <= 0;

  useEffect(() => {
    const saved = readOpsChatSession(storageKey);
    if (saved?.used) setQuotaUsed(saved.used);
  }, [storageKey]);

  useEffect(() => {
    const saved = readOpsChatSession(storageKey);
    writeOpsChatSession(storageKey, { used: Math.max(saved?.used ?? 0, quotaUsed), thread });
  }, [quotaUsed, storageKey, thread]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [thread, asking]);

  async function send(raw?: string) {
    const text = (raw ?? question).trim();
    if (!text || askingRef.current || locked) return;
    askingRef.current = true;
    setAsking(true);
    setThread((prev) => [...prev, { role: "user", text }]);
    setQuestion("");
    try {
      const history = thread
        .filter((turn) => turn.text !== spec.greeting)
        .slice(-8)
        .map((turn) => ({ role: turn.role, text: turn.text }));
      const response = await fetch("/api/radar/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          history,
          code: site?.recordCode,
          context,
        }),
      });
      const data = (await response.json()) as { answer?: string; error?: string; engine?: AssistantEngine };
      const answer = data.answer || data.error || "No se pudo consultar al asistente.";
      const engine: AssistantEngine = data.engine === "gemini" ? "gemini" : "local";
      setThread((prev) => [...prev, { role: "assistant", text: answer }]);
      setQuotaUsed((used) => Math.min(SESSION_QUOTA, used + quotaSpendForTurn({ engine, question: text, answer })));
    } catch {
      setThread((prev) => [...prev, { role: "assistant", text: "No se pudo consultar al asistente." }]);
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }

  return (
    <section className={`${slotStyles.slot} ${slotStyles[tone]} ${styles.assistant}`} aria-labelledby="solution-assistant-title">
      <div className={slotStyles.inner}>
        <header className={slotStyles.head}>
          <p className={slotStyles.kicker}>Asistente virtual · {site?.radar?.industryLabel || "IA del negocio"}</p>
          <h2 id="solution-assistant-title" className={slotStyles.title}>
            {spec.visitorTitle}
          </h2>
          <p className={slotStyles.change}>{spec.businessChange}</p>
          <p className={styles.quotaLine} aria-live="polite">
            Cupo de esta sesión: {remaining <= 0 ? "agotado" : `${remaining} de ${SESSION_QUOTA}`}
            {remaining <= 0 ? (
              <button type="button" className={styles.quotaReactivate} onClick={() => setReactivateOpen(true)}>
                Reactivar
              </button>
            ) : null}
          </p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.proposal}>
            <p className={styles.proposalKicker}>Cómo entra la IA</p>
            <p className={styles.proposalText}>{spec.focus}</p>
            <p className={styles.disclaimer}>{spec.disclaimer}</p>
          </aside>

          <div className={styles.chatPanel}>
            <div className={styles.log} ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
              {thread.map((turn, index) => (
                <p key={`${turn.role}-${index}`} className={turn.role === "user" ? styles.user : styles.bot}>
                  <span className={styles.who}>{turn.role === "user" ? "Tú" : spec.role}</span>
                  {turn.text}
                </p>
              ))}
              {asking ? <p className={styles.pending}>Escribiendo…</p> : null}
            </div>
            <div className={styles.starters}>
              {spec.starters.map((starter) => (
                <button key={starter} type="button" className={styles.chip} disabled={asking || locked} onClick={() => void send(starter)}>
                  {starter}
                </button>
              ))}
            </div>
            <form
              className={styles.composer}
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <label className={slotStyles.srOnly} htmlFor="assistant-question">
                Pregunta al asistente
              </label>
              <input
                id="assistant-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={500}
                placeholder="Escribe una pregunta…"
                disabled={asking || locked}
                autoComplete="off"
              />
              <button type="submit" className={`${slotStyles.submit} ${styles.send}`} disabled={asking || locked || !question.trim()}>
                {asking ? "Enviando…" : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <SessionReactivateModal
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={(password) => {
          if (password.trim() !== SESSION_REACTIVATE_PASSWORD) return false;
          const saved = readOpsChatSession(storageKey);
          writeOpsChatSession(storageKey, { used: 0, thread: saved?.thread ?? thread });
          setQuotaUsed(0);
          setReactivateOpen(false);
          return true;
        }}
      />
    </section>
  );
}

function chatContext(
  spec: SolutionAssistantSpec,
  site?: Pick<SiteConfig, "companyName" | "recordCode" | "industryId" | "activityId" | "radar">,
): AssistantChatContext {
  const samples = samplesFor(site?.industryId);
  const radar = site?.radar;
  return {
    companyName: site?.companyName || "El negocio",
    industry: radar?.industryLabel ?? "",
    activity: radar?.activityLabel ?? "",
    industryId: site?.industryId,
    activityId: site?.activityId,
    size: radar?.sizeLabel ?? "",
    index: radar?.index ?? 0,
    level: radar?.level ?? "bajo",
    findings: (radar?.findings ?? []).map((finding) => finding.text),
    items: samples.items,
    customers: samples.customers,
    role: spec.role,
    focus: spec.focus,
    productos: radar?.presentation?.vocab.productos ?? "productos",
    clientes: radar?.presentation?.vocab.clientes ?? "clientes",
    punto: radar?.presentation?.vocab.punto ?? "sede",
    opsBrief: opsBriefFromSector({
      companyName: site?.companyName || "El negocio",
      industryId: site?.industryId,
      activityId: site?.activityId,
    }),
    opsTables: opsTablesFromSector({
      companyName: site?.companyName || "El negocio",
      industryId: site?.industryId,
      activityId: site?.activityId,
    }),
    opsProfileGuidance:
      site?.industryId
        ? compactProfileGuidance(activityProfile(site.industryId as IndustryId, site.activityId || ""))
        : undefined,
  };
}
