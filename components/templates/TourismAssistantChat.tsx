"use client";

import { useEffect, useRef, useState } from "react";
import { opsBriefFromEntities } from "@/lib/assistant/ops-brief";
import { capturedRowFromReply, opsTablesFromEntities, type CapturedCrmRow } from "@/lib/assistant/ops-capture";
import type { CommitResult, CrmEntityState } from "@/lib/assistant/crm-state";
import {
  quotaSpendForTurn,
  readOpsChatSession,
  sessionStorageKey,
  writeOpsChatSession,
  type AssistantEngine,
} from "@/lib/assistant/session-quota";
import { samplesFor, type AssistantChatContext } from "@/lib/radar/assistant";
import { sanitizeAssistantPayload } from "@/lib/radar/assistant-payload";
import { companyNameHint } from "@/lib/assistant/company-context";
import type { SolutionAssistantSpec } from "@/lib/site/solution-slot";
import type { SiteConfig } from "@/types/site";
import styles from "./tourism-operations.module.css";

type Turn = { role: "user" | "assistant"; text: string };

function openingFor(company: string, orientation?: string): string {
  const base = `Hola, soy el asistente de ${company}. Puedes anotar operaciones o consultar lo que ya está en la base de datos.`;
  if (!orientation?.trim()) return base;
  return `${base}\n\n${orientation.trim()}`;
}

const TOURISM_STARTERS = [
  "Hoy llegan 4 huéspedes a habitación doble",
  "¿Cuántas reservas tengo esta semana?",
  "Quedan 2 suites libres para el fin de semana",
];

function assistantContext(
  spec: SolutionAssistantSpec,
  site: Pick<SiteConfig, "companyName" | "recordCode" | "industryId" | "activityId" | "radar">,
  entities: CrmEntityState[],
  sectorLabel: string,
  opsProfileGuidance?: string,
): AssistantChatContext {
  const samples = samplesFor(site?.industryId);
  const radar = site?.radar;
  return {
    companyName: site?.companyName || "El negocio",
    industry: radar?.industryLabel ?? "Turismo",
    activity: radar?.activityLabel ?? "Hotel",
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
    productos: radar?.presentation?.vocab.productos ?? "planes",
    clientes: radar?.presentation?.vocab.clientes ?? "viajeros",
    punto: radar?.presentation?.vocab.punto ?? "hotel",
    opsBrief: opsBriefFromEntities(entities, sectorLabel),
    opsProfileGuidance,
    companyNameHint: companyNameHint(site?.companyName || ""),
    opsTables: opsTablesFromEntities(entities),
  };
}

export function TourismAssistantChat({
  spec,
  site,
  entities,
  sectorLabel,
  locked = false,
  quotaUsed = 0,
  onSpend,
  onQuotaHydrate,
  onRecord,
  onReactivate,
  starters = TOURISM_STARTERS,
  placeholder = "Reserva, huéspedes, cupos…",
  companyFallback = "tu hotel",
  inputId = "tourism-assistant-input",
  opsProfileGuidance,
  orientationLine,
  scope,
  pendingStarter,
  onPendingStarterHandled,
  cloudRevision = 0,
  onPersisted,
}: {
  spec: SolutionAssistantSpec;
  site: SiteConfig;
  entities: CrmEntityState[];
  sectorLabel: string;
  locked?: boolean;
  quotaUsed?: number;
  onSpend?: (cost: number) => void;
  onQuotaHydrate?: (used: number) => void;
  /** Debe validar y guardar; el resultado decide qué se le confirma al usuario. */
  onRecord?: (row: CapturedCrmRow, opId: string) => CommitResult;
  /** Espacio de trabajo cuando no hay código RAD (industria + actividad). */
  scope?: string;
  onReactivate?: () => void;
  starters?: string[];
  placeholder?: string;
  companyFallback?: string;
  inputId?: string;
  opsProfileGuidance?: string;
  /** Una línea de contexto sectorial en el saludo inicial. */
  orientationLine?: string;
  pendingStarter?: string | null;
  onPendingStarterHandled?: () => void;
  /** Cambia cuando la copia de Supabase reemplaza la conversación local. */
  cloudRevision?: number;
  /** Tras guardar la conversación en el navegador, para copiarla a la base. */
  onPersisted?: () => void;
}) {
  const company = site.companyName.trim() || companyFallback;
  const title = `Habla con el asistente de ${company}`;
  const opening = openingFor(company, orientationLine ?? spec.focus);
  const storageKey = sessionStorageKey(site.recordCode, scope);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<Turn[]>(() => {
    const saved = typeof window !== "undefined" ? readOpsChatSession(storageKey) : null;
    return saved?.thread.length ? saved.thread : [{ role: "assistant", text: opening }];
  });
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const askingRef = useRef(false);
  const hydratedRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const transcriptRef = useRef("");
  const voiceErrorRef = useRef(false);
  const voiceTimerRef = useRef(0);
  const liveRef = useRef(true);
  const sendVoiceRef = useRef<(text: string) => void>(() => {});
  const context = assistantContext(spec, site, entities, sectorLabel, opsProfileGuidance);
  const blocked = locked || asking;

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [thread, asking]);

  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
      window.clearTimeout(voiceTimerRef.current);
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = readOpsChatSession(storageKey);
    if (saved) onQuotaHydrate?.(saved.used);
  }, [onQuotaHydrate, storageKey]);

  useEffect(() => {
    const saved = readOpsChatSession(storageKey);
    writeOpsChatSession(storageKey, { used: Math.max(saved?.used ?? 0, quotaUsed), thread });
    onPersisted?.();
  }, [onPersisted, quotaUsed, storageKey, thread]);

  useEffect(() => {
    if (!cloudRevision) return;
    const saved = readOpsChatSession(storageKey);
    if (saved?.thread.length) setThread(saved.thread);
  }, [cloudRevision, storageKey]);

  useEffect(() => {
    if (!pendingStarter?.trim() || locked) return;
    const starter = pendingStarter.trim();
    onPendingStarterHandled?.();
    void send(starter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send once per pendingStarter from CRM/dashboard
  }, [pendingStarter]);

  function confirmRecord(answer: string, captured: CapturedCrmRow, opId: string): string {
    if (!onRecord) return answer;
    const result = onRecord(captured, opId);
    if (!result.ok) {
      return result.reason === "storage"
        ? result.message
        : `${result.message} Dime ese dato y lo intento de nuevo; todavía no quedó registrado.`;
    }
    if (result.status === "duplicate") {
      return `Ese registro ya estaba en ${result.tableLabel}; no lo dupliqué.`;
    }
    return `${answer}\n\n✓ Guardado en ${result.tableLabel}. Ya aparece en Base de datos y en el Dashboard.`;
  }

  async function send(raw?: string) {
    const text = (raw ?? question).trim();
    if (!text || askingRef.current || locked) return;
    askingRef.current = true;
    setAsking(true);
    setThread((prev) => [...prev, { role: "user", text }]);
    setQuestion("");
    try {
      const history = thread
        .filter((turn) => turn.text !== opening)
        .slice(-8)
        .map((turn) => ({ role: turn.role, text: turn.text }));
      const payload = sanitizeAssistantPayload({ context, history });
      const response = await fetch("/api/radar/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          history: payload.history,
          code: site.recordCode,
          context: payload.context,
        }),
      });
      const data = (await response.json()) as { answer?: string; error?: string; engine?: AssistantEngine };
      const answer = data.answer || data.error || "No se pudo consultar al asistente.";
      const engine: AssistantEngine = data.engine === "gemini" ? "gemini" : "local";
      onSpend?.(quotaSpendForTurn({ engine, question: text, answer }));
      // Conversación → interpretación (respuesta) → validación + registro → confirmación.
      // Una ficha cerrada solo se muestra como registrada si el guardado quedó verificado.
      const captured = response.ok ? capturedRowFromReply(answer, context.opsTables) : null;
      const shown = captured ? confirmRecord(answer, captured, `op:${storageKey}:${thread.length}`) : answer;
      setThread((prev) => [...prev, { role: "assistant", text: shown }]);
    } catch {
      setThread((prev) => [...prev, { role: "assistant", text: "No se pudo consultar al asistente." }]);
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }

  sendVoiceRef.current = (text: string) => {
    void send(text);
  };

  function toggleVoice() {
    type SRCtor = new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: ((event?: { error?: string }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    const Win = window as Window & { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const SR = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    if (!SR) {
      setVoiceHint("Tu navegador aún no permite dictado por voz aquí. Escribe tu mensaje.");
      return;
    }
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      return;
    }
    setVoiceHint(null);
    transcriptRef.current = "";
    voiceErrorRef.current = false;
    setListening(true);
    const rec = new SR();
    rec.lang = "es-CO";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let said = "";
      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i]?.[0]?.transcript?.trim();
        if (chunk) said = said ? `${said} ${chunk}` : chunk;
      }
      if (said) {
        transcriptRef.current = said;
        setQuestion(said);
      }
    };
    rec.onerror = (event) => {
      const error = event?.error;
      if (error === "aborted" || error === "no-speech") return;
      voiceErrorRef.current = true;
      setVoiceHint("No se pudo usar el micrófono. Revisa permisos o escribe tu mensaje.");
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      window.clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = window.setTimeout(() => {
        const said = transcriptRef.current.trim();
        if (liveRef.current && !voiceErrorRef.current && said) sendVoiceRef.current(said);
      }, 80);
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
    }
  }

  return (
    <div className={styles.assistantShell}>
      <header className={styles.assistantHead}>
        <h3 className={styles.assistantTitle}>{title}</h3>
        <p className={styles.assistantSub}>{spec.businessChange}</p>
        <p className={styles.assistantOrient}>
          Te ayudo a registrar y consultar: pregunta en lenguaje natural, corrige datos en la conversación o revisa la
          base de datos y el tablero en las otras pestañas.
        </p>
      </header>

      <div className={styles.chatFrame}>
        <div className={styles.chatLog} ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
          {thread.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={`${styles.bubbleRow}${turn.role === "user" ? ` ${styles.bubbleRowUser}` : ""}`}
            >
              <div className={`${styles.bubble}${turn.role === "user" ? ` ${styles.bubbleUser}` : ` ${styles.bubbleBot}`}`}>
                <span className={styles.bubbleWho}>{turn.role === "user" ? "Tú" : "Asistente"}</span>
                <p className={styles.bubbleText}>{turn.text}</p>
              </div>
            </div>
          ))}
          {asking ? (
            <div className={styles.bubbleRow}>
              <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.bubbleTyping}`}>
                <span className={styles.bubbleWho}>Asistente</span>
                <p className={styles.bubbleText}>Un momento…</p>
              </div>
            </div>
          ) : null}
        </div>

        {locked ? (
          <div className={styles.quotaLockedBox} role="status">
            <p className={styles.quotaLocked}>
              Se agotó el cupo de esta sesión. El chat queda en pausa; la conversación se conserva si cambias de pestaña.
            </p>
            <button type="button" className={styles.quotaReactivateBtn} onClick={() => onReactivate?.()}>
              Reactivar
            </button>
          </div>
        ) : (
          <div className={styles.chatStarters}>
            {starters.map((starter) => (
              <button key={starter} type="button" className={styles.chatChip} disabled={blocked} onClick={() => void send(starter)}>
                {starter}
              </button>
            ))}
          </div>
        )}

        {locked ? null : voiceHint ? <p className={styles.voiceHint}>{voiceHint}</p> : null}

        {locked ? null : (
          <form
            className={styles.chatComposer}
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <button
              type="button"
              className={`${styles.micBtn}${listening ? ` ${styles.micBtnOn}` : ""}`}
              aria-label={listening ? "Escuchando…" : "Dictar mensaje"}
              aria-pressed={listening}
              disabled={blocked}
              onClick={toggleVoice}
            >
              <MicIcon />
            </button>
            <label className={styles.srOnly} htmlFor={inputId}>
              Mensaje para el asistente
            </label>
            <input
              id={inputId}
              className={styles.chatInput}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              placeholder={placeholder}
              disabled={blocked}
              autoComplete="off"
            />
            <button type="submit" className={styles.chatSend} disabled={blocked || !question.trim()}>
              {asking ? "…" : "Enviar"}
            </button>
          </form>
        )}
      </div>
      <p className={styles.assistantFine}>{spec.disclaimer}</p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
