"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AvatarDockVideo } from "@/components/catch/AvatarDockVideo";
import { TavusAiEcho } from "@/components/catch/TavusAiEcho";
import { useTavusCvi } from "@/components/catch/TavusCviProvider";
import { AVATAR_SOLUTION_HREF } from "@/features/pitch/avatar-solution";
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

export function AvatarStage() {
  const tavus = useTavusCvi();
  const logRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<Line[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askStatus, setAskStatus] = useState("");
  const [answer, setAnswer] = useState("");
  const [echoId, setEchoId] = useState(-1);
  const [chatOpen, setChatOpen] = useState(true);
  const voice = useIaVoiceDictation((text) => setQuestion(text));
  const sessionOpen = tavus.status === "connected" || tavus.status === "starting";

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [thread, asking, chatOpen]);

  function toggleAvatar() {
    if (sessionOpen) {
      void tavus.endSession();
      return;
    }
    void tavus.startSession();
  }

  function toggleMic() {
    setChatOpen(true);
    voice.toggle();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || asking) return;
    setAsking(true);
    setAskStatus("");
    setThread((prev) => [...prev, { role: "user", text }]);
    setQuestion("");
    if (voice.listening) voice.stop();
    try {
      const response = await fetch("/api/pitch/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
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
      setAskStatus(tavus.tavusActive ? "El avatar está leyendo la respuesta." : "Inicia el avatar para escucharla.");
    } catch {
      setThread((prev) => [...prev, { role: "assistant", text: "No se pudo consultar al asistente." }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <TavusAiEcho answer={answer} echoId={echoId} />
      <div className="pd-avatar-stage">
        <div className="pd-avatar-live" onClick={(event) => event.stopPropagation()}>
          <AvatarDockVideo
            active
            tavusUi="dock"
            showRaiseHand={false}
            micSupported={false}
          />
          <div className="pd-avatar-tools">
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
      <aside className="pd-avatar-side" onClick={(event) => event.stopPropagation()}>
        <div className="pd-side-head">
          <div>
            <p className="pd-kicker">Estado</p>
            <p className="pd-status">{statusText(tavus.status)}</p>
          </div>
          <button
            type="button"
            className="pd-chat-toggle"
            aria-expanded={chatOpen}
            onClick={() => setChatOpen((open) => !open)}
          >
            {chatOpen ? "Ocultar chat" : "Mostrar chat"}
          </button>
        </div>
        {tavus.error && !chatOpen ? <p className="pd-side-note">{tavus.error}</p> : null}
        {chatOpen ? (
          <form className="pd-chat" onSubmit={(event) => void onSubmit(event)}>
            <div className="pd-chat-log" ref={logRef} aria-live="polite" aria-label="Historial del chat">
              {thread.length === 0 ? (
                <p className="pd-chat-empty">Pregunte por turismo, metalurgia o agro.</p>
              ) : (
                thread.map((line, index) => (
                  <p key={`${line.role}-${index}`} className={line.role === "user" ? "pd-bubble pd-bubble-user" : "pd-bubble pd-bubble-ai"}>
                    {line.text}
                  </p>
                ))
              )}
            </div>
            <p className="pd-chat-hint">Si el avatar está conectado, lee la respuesta en voz alta.</p>
            <div className="pd-chat-row">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Escriba su pregunta para el consultor…"
                aria-label="Pregunta para el consultor"
                autoComplete="off"
                disabled={asking}
              />
              <button type="submit" disabled={asking || !question.trim()}>
                {asking ? "…" : "Enviar"}
              </button>
            </div>
            {askStatus ? <p className="pd-chat-status">{askStatus}</p> : null}
          </form>
        ) : null}
        <a className="pd-btn pd-btn-solid pd-solution" href={AVATAR_SOLUTION_HREF} target="_blank" rel="noreferrer">
          Solución del avatar
        </a>
      </aside>
    </>
  );
}
