"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  agendaQuestion,
  assistantHello,
  fieldQuestion,
  fold,
  isConfirm,
  isRestart,
  matchOption,
  parseParty,
  valueMatchesColumn,
} from "@/lib/site/demo-chat";
import type { SolutionActionId, SolutionSectionSpec } from "@/lib/site/solution-slot";
import styles from "./solution-slot.module.css";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

type Turn = { role: "user" | "bot"; text: string };

function pauseMs(): number {
  const pauses = [2000, 3000, 4000];
  return pauses[Math.floor(Math.random() * pauses.length)] ?? 3000;
}

/** Muestra lo que escribió la persona al momento y la respuesta unos segundos después. */
function useDemoTurns(hello: string) {
  const [turns, setTurns] = useState<Turn[]>([{ role: "bot", text: hello }]);
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    busy.current = false;
    setTyping(false);
  }, []);

  useEffect(() => stop, [stop]);

  const greet = useCallback(
    (text: string, next: string) => {
      stop();
      setTurns([{ role: "bot", text }]);
      busy.current = true;
      setTyping(true);
      timer.current = setTimeout(() => {
        timer.current = null;
        setTurns((current) => [...current, { role: "bot", text: next }]);
        busy.current = false;
        setTyping(false);
      }, pauseMs());
    },
    [stop],
  );

  const later = useCallback((botTexts: string[], apply?: () => void) => {
    timer.current = setTimeout(() => {
      timer.current = null;
      setTurns((current) => [...current, ...botTexts.map((text) => ({ role: "bot" as const, text }))]);
      apply?.();
      busy.current = false;
      setTyping(false);
    }, pauseMs());
  }, []);

  const reply = useCallback(
    (userText: string, botTexts: string[], apply?: () => void) => {
      if (busy.current) return false;
      busy.current = true;
      setTyping(true);
      setTurns((current) => [...current, { role: "user", text: userText }]);
      later(botTexts, apply);
      return true;
    },
    [later],
  );

  const aside = useCallback(
    (botText: string, apply?: () => void) => {
      if (busy.current) return false;
      busy.current = true;
      setTyping(true);
      later([botText], apply);
      return true;
    },
    [later],
  );

  return { turns, typing, reply, aside, greet, stop };
}

function ChatPane({
  role,
  turns,
  chips,
  placeholder,
  input,
  typing,
  onInput,
  onSend,
}: {
  role: string;
  turns: Turn[];
  chips: string[];
  placeholder: string;
  input: string;
  typing: boolean;
  onInput: (value: string) => void;
  onSend: (text: string) => void;
}) {
  const inputId = useId();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns, chips, typing]);

  return (
    <div className={styles.demoChat}>
      <div className={styles.demoLog} ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
        {turns.map((turn, index) => (
          <p key={`${turn.role}-${index}`} className={turn.role === "user" ? styles.demoUser : styles.demoBot}>
            <span className={styles.demoWho}>{turn.role === "user" ? "Tú" : role}</span>
            {turn.text}
          </p>
        ))}
        {typing ? (
          <p className={styles.demoBot}>
            <span className={styles.demoWho}>{role}</span>
            <span className={styles.demoTyping} aria-label="Escribiendo">
              <i />
              <i />
              <i />
            </span>
          </p>
        ) : null}
      </div>
      {chips.length > 0 ? (
        <div className={styles.demoChips}>
          {chips.map((chip) => (
            <button key={chip} type="button" className={styles.demoChip} disabled={typing} onClick={() => onSend(chip)}>
              {chip}
            </button>
          ))}
        </div>
      ) : null}
      <form
        className={styles.demoComposer}
        onSubmit={(event) => {
          event.preventDefault();
          onSend(input);
        }}
      >
        <label className={styles.srOnly} htmlFor={inputId}>
          Respuesta
        </label>
        <input
          id={inputId}
          value={input}
          maxLength={240}
          placeholder={typing ? "Escribiendo…" : placeholder}
          disabled={typing}
          onChange={(event) => onInput(event.target.value)}
        />
        <button type="submit" className={styles.submit} disabled={typing}>
          Enviar
        </button>
      </form>
    </div>
  );
}

function upcomingDates(count: number): { iso: string; label: string }[] {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index + 1);
    return {
      iso: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short" }).format(date),
    };
  });
}

function listNoun(submitLabel: string): string {
  const label = submitLabel.toLowerCase();
  if (label.includes("pedido")) return "pedidos";
  if (label.includes("cita")) return "citas";
  if (label.includes("reunión") || label.includes("reunion")) return "reuniones";
  if (label.includes("toma")) return "tomas";
  if (label.includes("entrada")) return "entradas";
  if (label.includes("envío") || label.includes("envio")) return "envíos";
  if (label.includes("cotiz")) return "cotizaciones";
  if (label.includes("plan")) return "planes";
  if (label.includes("visita")) return "visitas";
  return "reservas";
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `demo-${Date.now()}`;
}

type Booking = { id: string; choiceId: string; date: string; dateLabel: string; party: number; guest: string };
type AgendaStep = "choice" | "date" | "party" | "guest" | "confirm" | "idle";
type Draft = { choiceId: string; date: string; dateLabel: string; party: number; guest: string };

const EMPTY_DRAFT: Draft = { choiceId: "", date: "", dateLabel: "", party: 1, guest: "" };

export function AgendaChat({ spec, companyName }: { spec: SolutionSectionSpec; companyName?: string }) {
  const choices = spec.choices ?? [];
  const min = spec.partyMin ?? 1;
  const max = spec.partyMax ?? 8;
  const partyName = spec.partyLabel ?? "Personas";
  const listed = listNoun(spec.submitLabel);
  const hello = assistantHello("agenda", companyName ?? "");
  const firstAsk = agendaQuestion(spec.submitLabel);

  const [dates, setDates] = useState<{ iso: string; label: string }[]>([]);
  const [step, setStep] = useState<AgendaStep>("choice");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const { turns, typing, reply, aside, greet, stop } = useDemoTurns(hello);

  const seed = `${spec.submitLabel}|${choices.map((item) => item.id).join(",")}|${hello}`;

  useEffect(() => {
    setDates(upcomingDates(6));
  }, []);

  useEffect(() => {
    greet(hello, firstAsk);
    setBookings([]);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setStep("choice");
    setInput("");
    return () => stop();
  }, [seed, hello, firstAsk, greet, stop]);

  function askChoice(userText: string | null, lead: string) {
    const apply = () => setStep("choice");
    if (userText) {
      if (reply(userText, [lead], apply)) setInput("");
      return;
    }
    aside(lead, apply);
  }

  function onSend(raw: string) {
    const text = raw.trim();
    if (!text) return;

    if (step === "idle") {
      if (fold(text) === "agendar otra" || text.length > 0) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
        askChoice(text, firstAsk);
      }
      return;
    }

    if (step === "choice") {
      const match = matchOption(text, choices);
      if (!match) {
        if (reply(text, ["Elige una de estas opciones, o escríbela tal como aparece."])) setInput("");
        return;
      }
      if (
        reply(text, [`${match.label}. ${match.detail} ¿Qué fecha te sirve? Elige una o escríbela.`], () => {
          setDraft({ ...EMPTY_DRAFT, choiceId: match.id });
          setStep("date");
        })
      ) {
        setInput("");
      }
      return;
    }

    if (step === "date") {
      const match = matchOption(
        text,
        dates.map((item) => ({ id: item.iso, label: item.label })),
      );
      const typed = text.length >= 4 ? text : "";
      const date = match?.id ?? typed;
      const dateLabel = match?.label ?? typed;
      if (!date) {
        if (reply(text, ["Escribe la fecha o elige una de la lista."])) setInput("");
        return;
      }
      if (
        reply(text, [`¿${partyQuestion(partyName)} Escribe un número entre ${min} y ${max}.`], () => {
          setDraft((current) => ({ ...current, date, dateLabel }));
          setStep("party");
        })
      ) {
        setInput("");
      }
      return;
    }

    if (step === "party") {
      const party = parseParty(text, min, max);
      if (party == null) {
        if (reply(text, [`Necesito un número entre ${min} y ${max}.`])) setInput("");
        return;
      }
      if (
        reply(text, ["¿A nombre de quién queda?"], () => {
          setDraft((current) => ({ ...current, party }));
          setStep("guest");
        })
      ) {
        setInput("");
      }
      return;
    }

    if (step === "guest") {
      if (text.length < 2) {
        if (reply(text, ["Escribe el nombre de quien reserva."])) setInput("");
        return;
      }
      const next = { ...draft, guest: text };
      if (
        reply(text, [confirmLine(next)], () => {
          setDraft(next);
          setStep("confirm");
        })
      ) {
        setInput("");
      }
      return;
    }

    if (isConfirm(text)) {
      const choice = choices.find((item) => item.id === draft.choiceId) ?? choices[0];
      if (!choice || !draft.date || !draft.guest) {
        askChoice(text, firstAsk);
        return;
      }
      const updating = editingId;
      const booking: Booking = {
        id: updating ?? newId(),
        choiceId: choice.id,
        date: draft.date,
        dateLabel: draft.dateLabel,
        party: draft.party,
        guest: draft.guest,
      };
      if (
        reply(
          text,
          [
            updating
              ? `Listo. Actualicé esa reserva. Si quieres otra, dilo.`
              : `Listo. Quedó en ${listed}. Si quieres otra, dilo.`,
          ],
          () => {
            setBookings((current) =>
              updating ? current.map((item) => (item.id === updating ? booking : item)) : [...current, booking],
            );
            setEditingId(null);
            setDraft(EMPTY_DRAFT);
            setStep("idle");
          },
        )
      ) {
        setInput("");
      }
      return;
    }

    if (isRestart(text)) {
      setDraft(EMPTY_DRAFT);
      askChoice(text, firstAsk);
      return;
    }

    if (reply(text, ["Responde Confirmar para dejarla, o Cambiar para empezar de nuevo."])) setInput("");
  }

  function confirmLine(next: Draft): string {
    const choice = choices.find((item) => item.id === next.choiceId) ?? choices[0];
    const money = choice && choice.price > 0 ? ` Total ${pesos.format(choice.price * next.party)}.` : "";
    return `Quedaría así: ${choice?.label ?? "Reserva"} · ${next.dateLabel} · ${next.party} ${partyName.toLowerCase()} · ${next.guest}.${money} ¿La confirmo?`;
  }

  const chips =
    step === "choice"
      ? choices.map((item) => item.label)
      : step === "date"
        ? dates.map((item) => item.label)
        : step === "party"
          ? partyChips(min, max)
          : step === "guest"
            ? []
            : step === "confirm"
              ? ["Confirmar", "Cambiar"]
              : ["Agendar otra"];

  const placeholder =
    step === "choice"
      ? "Escribe una opción…"
      : step === "date"
        ? "Escribe una fecha…"
        : step === "party"
          ? "Escribe un número…"
          : step === "guest"
            ? "Nombre de quien reserva…"
            : step === "confirm"
              ? "Confirmar o cambiar…"
              : "Escribe para agendar otra…";

  return (
    <>
      <ChatPane
        role="Asistente"
        turns={turns}
        chips={chips}
        placeholder={placeholder}
        input={input}
        typing={typing}
        onInput={setInput}
        onSend={onSend}
      />
      <div className={styles.bookings}>
        <h3 className={styles.editorTitle}>{`${listed[0]?.toUpperCase() ?? ""}${listed.slice(1)}`}</h3>
        {bookings.length === 0 ? (
          <p className={styles.empty}>{`Todavía no hay ${listed}. Responde en el chat para agregar una.`}</p>
        ) : (
          <ul className={styles.bookingList}>
            {bookings.map((item) => {
              const booked = choices.find((choice) => choice.id === item.choiceId) ?? choices[0];
              return (
                <li key={item.id} className={editingId === item.id ? styles.bookingOn : undefined}>
                  <div>
                    <strong>{booked?.label}</strong>
                    <p>
                      {item.dateLabel} · {item.party} {partyName.toLowerCase()}
                      {item.guest ? ` · ${item.guest}` : ""}
                    </p>
                  </div>
                  <div className={styles.bookingFooter}>
                    <button
                      type="button"
                      className={styles.linkish}
                      onClick={() => {
                        aside(`Vamos a cambiar esa reserva. ${firstAsk}`, () => {
                          setEditingId(item.id);
                          setDraft({
                            choiceId: item.choiceId,
                            date: item.date,
                            dateLabel: item.dateLabel,
                            party: item.party,
                            guest: item.guest,
                          });
                          setStep("choice");
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.linkish}
                      onClick={() => {
                        const dropEdit = editingId === item.id;
                        aside("Cancelé esa reserva.", () => {
                          setBookings((current) => current.filter((booking) => booking.id !== item.id));
                          if (dropEdit) {
                            setEditingId(null);
                            setStep("idle");
                          }
                        });
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function partyQuestion(label: string): string {
  const word = label.toLowerCase();
  const feminine = /(as|a)$/.test(word) || /personas|toneladas|unidades|piezas|citas|visitas|entradas/.test(word);
  return feminine ? `Cuántas ${word}` : `Cuántos ${word}`;
}

function partyChips(min: number, max: number): string[] {
  const values = [min, min + 1, min + 2, Math.min(max, Math.max(min, 4))];
  return [...new Set(values.filter((value) => value >= min && value <= max))].map(String);
}

const TABLE_TITLE: Record<Exclude<SolutionActionId, "agenda">, string> = {
  registro: "Registros",
  inventario: "Existencias",
  solicitudes: "Solicitudes",
};

const TABLE_KIND: Record<Exclude<SolutionActionId, "agenda">, string> = {
  registro: "registro",
  inventario: "inventario",
  solicitudes: "solicitudes",
};

function padRow(columns: string[], row: string[] | undefined): string[] {
  return columns.map((_, index) => row?.[index]?.trim() ?? "");
}

export function TableChat({ spec, companyName }: { spec: SolutionSectionSpec; companyName?: string }) {
  const columns = spec.columns ?? [];
  const action = spec.action === "agenda" ? "registro" : spec.action;
  const hello = assistantHello(TABLE_KIND[action], companyName ?? "");
  const firstAsk = fieldQuestion(columns[0] ?? "dato");
  const seed = JSON.stringify({ columns, rows: spec.rows ?? [], hello, firstAsk });

  const [rows, setRows] = useState<string[][]>(() => (spec.rows ?? []).map((row) => padRow(columns, row)));
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<"field" | "confirm" | "idle">("field");
  const [draft, setDraft] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const { turns, typing, reply, aside, greet, stop } = useDemoTurns(hello);

  useEffect(() => {
    const parsed = JSON.parse(seed) as { columns: string[]; rows: string[][]; hello: string; firstAsk: string };
    greet(parsed.hello, parsed.firstAsk);
    setRows(parsed.rows.map((row) => padRow(parsed.columns, row)));
    setEditIndex(null);
    setCursor(0);
    setDraft([]);
    setPhase("field");
    setInput("");
    return () => stop();
  }, [seed, greet, stop]);

  if (columns.length === 0) return null;

  function columnError(column: string): string {
    const code = /n[uú]mero|numero|pedido|orden|solicitud|c[oó]digo/i.test(column);
    return code
      ? `«${column}» tiene que ser un número o un código como SOL-1042.`
      : `«${column}» tiene que ser un número.`;
  }

  function restart(userText: string | null) {
    const apply = () => {
      setEditIndex(null);
      setCursor(0);
      setDraft([]);
      setPhase("field");
    };
    if (userText) {
      if (reply(userText, [firstAsk], apply)) setInput("");
      return;
    }
    aside(firstAsk, apply);
  }

  function onSend(raw: string) {
    const text = raw.trim();
    if (!text) return;

    if (phase === "idle") {
      restart(text);
      return;
    }

    if (phase === "confirm") {
      if (isConfirm(text)) {
        const saved = draft;
        const index = editIndex;
        if (
          reply(text, [index != null ? "Listo. Actualicé ese registro. Si quieres otro, dilo." : "Listo. Ya quedó anotado. Si quieres otro, dilo."], () => {
            setRows((current) =>
              index != null ? current.map((row, rowIndex) => (rowIndex === index ? saved : row)) : [...current, saved],
            );
            setEditIndex(null);
            setDraft([]);
            setCursor(0);
            setPhase("idle");
          })
        ) {
          setInput("");
        }
        return;
      }
      if (isRestart(text)) {
        restart(text);
        return;
      }
      if (reply(text, ["Responde Confirmar para dejarlo, o Cambiar para empezar de nuevo."])) setInput("");
      return;
    }

    const column = columns[cursor] ?? "Dato";
    if (!valueMatchesColumn(column, text)) {
      if (reply(text, [columnError(column)])) setInput("");
      return;
    }
    const next = columns.map((_, index) => (index === cursor ? text : (draft[index] ?? "")));
    const following = cursor + 1;
    if (following < columns.length) {
      if (
        reply(text, [fieldQuestion(columns[following] ?? "dato")], () => {
          setDraft(next);
          setCursor(following);
        })
      ) {
        setInput("");
      }
      return;
    }
    if (
      reply(text, [`Quedaría así: ${next.join(" · ")}. ¿Lo confirmo?`], () => {
        setDraft(next);
        setPhase("confirm");
      })
    ) {
      setInput("");
    }
  }

  const chips = phase === "confirm" ? ["Confirmar", "Cambiar"] : phase === "idle" ? ["Anotar otro"] : [];
  const placeholder =
    phase === "confirm" ? "Confirmar o cambiar…" : phase === "idle" ? "Escribe para anotar otro…" : "Escribe tu respuesta…";

  return (
    <>
      <ChatPane
        role="Asistente"
        turns={turns}
        chips={chips}
        placeholder={placeholder}
        input={input}
        typing={typing}
        onInput={setInput}
        onSend={onSend}
      />
      <div className={styles.bookings}>
        <h3 className={styles.editorTitle}>{TABLE_TITLE[action]}</h3>
        {rows.length === 0 ? (
          <p className={styles.empty}>Todavía no hay nada anotado. Responde en el chat para agregar el primero.</p>
        ) : (
          <ul className={styles.bookingList}>
            {rows.map((row, index) => (
              <li key={`${index}-${row.join("|")}`} className={editIndex === index ? styles.bookingOn : undefined}>
                <div>
                  <strong>{row[0] || "—"}</strong>
                  <p>
                    {columns
                      .slice(1)
                      .map((column, cell) => `${column}: ${row[cell + 1] || "—"}`)
                      .join(" · ")}
                  </p>
                </div>
                <div className={styles.bookingFooter}>
                  <button
                    type="button"
                    className={styles.linkish}
                    onClick={() => {
                      aside(`Vamos a cambiar ese registro. ${firstAsk}`, () => {
                        setEditIndex(index);
                        setCursor(0);
                        setDraft([]);
                        setPhase("field");
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={styles.linkish}
                    onClick={() => {
                      const dropping = editIndex === index;
                      aside("Quité ese registro.", () => {
                        setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
                        if (dropping) {
                          setEditIndex(null);
                          setPhase("idle");
                        }
                      });
                    }}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
