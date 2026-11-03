"use client";

/**
 * Integración del avatar en vivo (Tavus + Gemini) para la diapositiva 6.
 * Reservada: hoy el pitch usa `video-stage.tsx`. Para reactivar, monte `AvatarStage`
 * en `slide-views.tsx` y envuelva `PitchDeck` con `TavusCviProvider`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarDockVideo } from "@/components/catch/AvatarDockVideo";
import { TavusAiEcho } from "@/components/catch/TavusAiEcho";
import { useTavusCvi } from "@/components/catch/TavusCviProvider";
import { AVATAR_SOLUTION_HREF } from "@/features/pitch/avatar-solution";
import { answerOffersAvatarSolution } from "@/lib/avatar/solution-offer";
import { useIaVoiceDictation } from "@/hooks/useIaVoiceDictation";

type Line = { role: "user" | "assistant"; text: string };

function statusText(status: string): string {
  if (status === "connected") return "En vivo";
  if (status === "starting") return "Conectando";
  if (status === "ended") return "Sesión cerrada";
  if (status === "error") return "Sin conexión";
  return "Listo para iniciar";
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.2a2.8 2.8 0 0 0-2.8 2.8v5a2.8 2.8 0 0 0 5.6 0v-5A2.8 2.8 0 0 0 12 3.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M6.2 11.2a5.8 5.8 0 0 0 11.6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 17v3.2M9.2 20.2h5.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {listening ? null : <path d="M5 5.2 19 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.2v7.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.2 6.4a7 7 0 1 0 9.6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type AvatarStageProps = {
  /** En el formulario radar: video a ancho completo y columna de chat compacta. */
  foldSideColumn?: boolean;
};

function TypewriterBubble({
  text,
  animate,
  onTick,
}: {
  text: string;
  animate: boolean;
  onTick?: () => void;
}) {
  const [shown, setShown] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate) {
      setShown(text);
      return;
    }
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      onTick?.();
      return;
    }

    setShown("");
    let index = 0;
    let timer: number | undefined;

    const step = () => {
      index += 1;
      setShown(text.slice(0, index));
      onTick?.();
      if (index < text.length) {
        const ch = text[index - 1] ?? "";
        const pause = ch === "." || ch === "?" || ch === "!" ? 120 : ch === "," ? 70 : ch === " " ? 28 : 16;
        timer = window.setTimeout(step, pause);
      }
    };

    timer = window.setTimeout(step, 48);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [text, animate, onTick]);

  const typing = animate && shown.length < text.length;

  return (
    <p className="pd-bubble pd-bubble-ai">
      {shown}
      {typing ? <span className="pd-type-cursor" aria-hidden="true" /> : null}
    </p>
  );
}

export function AvatarStage({ foldSideColumn = false }: AvatarStageProps) {
  const tavus = useTavusCvi();
  const logRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<Line[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [echoId, setEchoId] = useState(-1);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);
  const [chatScrollTick, setChatScrollTick] = useState(0);
  const askingRef = useRef(false);
  const sendTimerRef = useRef<number | null>(null);
  const bargeInRef = useRef(false);
  const submitRef = useRef<(raw?: string) => Promise<void>>(async () => {});
  const tavusRef = useRef(tavus);
  tavusRef.current = tavus;

  const onVoiceText = useCallback((text: string, isFinal: boolean) => {
    const spoken = text.trim();
    if (!spoken) return;
    setQuestion(spoken);
    const session = tavusRef.current;
    if (session.tavusActive && !bargeInRef.current) {
      session.interruptSpeech();
      bargeInRef.current = true;
    }
    if (sendTimerRef.current) window.clearTimeout(sendTimerRef.current);
    const wait = isFinal ? 700 : 1400;
    sendTimerRef.current = window.setTimeout(() => {
      sendTimerRef.current = null;
      bargeInRef.current = false;
      void submitRef.current(spoken);
    }, wait);
  }, []);

  const voice = useIaVoiceDictation(onVoiceText);
  const sessionOpen = tavus.status === "connected" || tavus.status === "starting";

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [thread, asking, chatScrollTick]);

  const bumpChatScroll = useCallback(() => {
    setChatScrollTick((value) => value + 1);
  }, []);

  function toggleAvatar() {
    if (sessionOpen) {
      void tavus.endSession();
      return;
    }
    void tavus.startSession();
  }

  function toggleMic() {
    voice.toggle();
  }

  async function submitQuestion(raw?: string) {
    const text = (raw ?? question).trim();
    if (!text || askingRef.current) return;
    if (sendTimerRef.current) {
      window.clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
    }
    askingRef.current = true;
    setAsking(true);
    setThread((prev) => [...prev, { role: "user", text }]);
    setQuestion("");
    if (voice.listening) voice.stop();
    try {
      const response = await fetch("/api/pitch/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = (await response.json()) as { answer?: string; error?: string; solutionReady?: boolean };
      if (!response.ok || !data.answer) {
        setThread((prev) => [
          ...prev,
          { role: "assistant", text: data.error || "No se pudo consultar al asistente." },
        ]);
        return;
      }
      setThread((prev) => [...prev, { role: "assistant", text: data.answer! }]);
      setAnswer(data.answer);
      setEchoId((value) => value + 1);
      if (data.solutionReady ?? answerOffersAvatarSolution(data.answer)) {
        setSolutionUnlocked(true);
        window.dispatchEvent(
          new CustomEvent("avatar-solution-ready", {
            detail: { href: AVATAR_SOLUTION_HREF, answer: data.answer },
          }),
        );
      }
    } catch {
      setThread((prev) => [...prev, { role: "assistant", text: "No se pudo consultar al asistente." }]);
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }

  submitRef.current = submitQuestion;

  useEffect(() => {
    return () => {
      if (sendTimerRef.current) window.clearTimeout(sendTimerRef.current);
    };
  }, []);

  const stageBlock = (
    <div className={`pd-avatar-stage pd-avatar-stage--fluid${foldSideColumn ? " pd-avatar-stage--radar" : ""}`}>
      <div className={`pd-avatar-live${foldSideColumn ? " pd-avatar-live--fill" : ""}`} onClick={(event) => event.stopPropagation()}>
        <AvatarDockVideo active tavusUi="dock" showRaiseHand={false} micSupported={false} />
        <div className="pd-avatar-tools">
          <div className="pd-avatar-tools-left">
            <a
              className={`pd-avatar-solution-chip${solutionUnlocked ? " is-ready" : ""}`}
              href={solutionUnlocked ? AVATAR_SOLUTION_HREF : undefined}
              target={solutionUnlocked ? "_blank" : undefined}
              rel={solutionUnlocked ? "noreferrer" : undefined}
              aria-disabled={!solutionUnlocked}
              tabIndex={solutionUnlocked ? 0 : -1}
              title={solutionUnlocked ? "Abrir solución del avatar" : "La solución se activa cuando el consultor la indique"}
              onClick={(event) => {
                if (!solutionUnlocked) event.preventDefault();
              }}
            >
              <span className="pd-avatar-solution-mark">S</span>
              <span className="pd-avatar-solution-label">Solución del avatar</span>
            </a>
          </div>
          <div className="pd-avatar-tools-right">
            <button
              type="button"
              className={sessionOpen ? "pd-avatar-icon is-on" : "pd-avatar-icon"}
              onClick={toggleAvatar}
              aria-pressed={sessionOpen}
              aria-label={sessionOpen ? "Desactivar avatar" : "Activar avatar"}
              title={sessionOpen ? "Desactivar avatar" : "Activar avatar"}
            >
              <PowerIcon />
            </button>
            <button
              type="button"
              className={voice.listening ? "pd-avatar-icon pd-avatar-mic is-on" : "pd-avatar-icon pd-avatar-mic"}
              onClick={toggleMic}
              disabled={!voice.supported}
              aria-pressed={voice.listening}
              aria-label={voice.listening ? "Apagar micrófono" : "Prender micrófono"}
              title={
                voice.supported
                  ? voice.listening
                    ? "Apagar micrófono"
                    : "Prender micrófono"
                  : "Este navegador no tiene dictado por voz"
              }
            >
              <MicIcon listening={voice.listening} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const sideBlock = (
    <aside className="pd-avatar-side" onClick={(event) => event.stopPropagation()}>
      <div className="pd-side-head pd-side-head--inline">
        <p className="pd-kicker">Estado</p>
        <p className="pd-status">{statusText(tavus.status)}</p>
      </div>
      {tavus.error ? <p className="pd-side-note">{tavus.error}</p> : null}
      <div className="pd-chat" role="group" aria-label="Chat con el consultor">
        <div className="pd-chat-log" ref={logRef} aria-live="polite" aria-label="Historial del chat">
          {thread.length === 0 ? (
            <p className="pd-chat-empty">Pregunte por turismo, metalurgia o agro.</p>
          ) : (
            thread.map((line, index) => {
              if (line.role === "user") {
                return (
                  <p key={`user-${index}`} className="pd-bubble pd-bubble-user">
                    {line.text}
                  </p>
                );
              }
              const animate = index === thread.length - 1;
              return (
                <TypewriterBubble
                  key={`ai-${index}-${line.text.length}`}
                  text={line.text}
                  animate={animate}
                  onTick={animate ? bumpChatScroll : undefined}
                />
              );
            })
          )}
        </div>
        <div className="pd-chat-row pd-chat-row--flat">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitQuestion();
              }
            }}
            placeholder="Escriba su consulta"
            aria-label="Pregunta para el consultor"
            autoComplete="off"
            disabled={asking}
          />
          <button type="button" disabled={asking || !question.trim()} onClick={() => void submitQuestion()}>
            {asking ? "…" : "Enviar"}
          </button>
        </div>
      </div>
    </aside>
  );

  if (foldSideColumn) {
    return (
      <>
        <TavusAiEcho answer={answer} echoId={echoId} />
        <div className="pd-avatar-radar-split">
          {stageBlock}
          {sideBlock}
        </div>
      </>
    );
  }

  return (
    <>
      <TavusAiEcho answer={answer} echoId={echoId} />
      {stageBlock}
      {sideBlock}
    </>
  );
}
