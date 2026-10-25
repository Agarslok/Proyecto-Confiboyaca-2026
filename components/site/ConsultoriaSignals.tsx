import type { ConsultancySignal } from "@/lib/site/consultancy";

const STATUS_LABEL: Record<ConsultancySignal["status"], string> = {
  attention: "Atención",
  progress: "En progreso",
  ready: "Listo",
};

interface ConsultoriaSignalsProps {
  signals: ConsultancySignal[];
}

export function ConsultoriaSignals({ signals }: ConsultoriaSignalsProps) {
  return (
    <div className="consultoria-signals-panel" role="list" aria-label="Prioridades de la consultoría">
      {signals.map((signal, index) => (
        <article
          key={`${signal.title}-${index}`}
          className={`consultoria-signal is-${signal.status}`}
          role="listitem"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="consultoria-signal-head">
            <span className="consultoria-signal-lamp" aria-hidden="true">
              <span className="consultoria-signal-glow" />
            </span>
            <p className="consultoria-signal-tag">{STATUS_LABEL[signal.status]}</p>
          </div>
          <h3 className="consultoria-signal-title">{signal.title}</h3>
          <p className="consultoria-signal-insight">{signal.insight}</p>
          <p className="consultoria-signal-remedy">
            <span className="consultoria-signal-remedy-label">En tu página web</span>
            {signal.remedy}
          </p>
        </article>
      ))}
    </div>
  );
}
