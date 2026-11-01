"use client";

import { useState } from "react";
import { NicheIcon, type NicheIconName } from "@/components/externado/niche-icons";
import { SolutionDemo } from "@/components/radar/SolutionSpotlight";
import { SAMPLES } from "@/lib/radar/bank";
import { SOLUTIONS, solutionHeadline, type SolutionKind } from "@/lib/radar/solution";
import type { IndustryId } from "@/lib/radar/types";

/* ============================================================================
   «Lo que se puede construir», mostrado en vez de contado: para tres
   negocios de ejemplo, cada solución con su «antes» (cuaderno) y su
   «después» funcionando con datos de ejemplo que se pueden tocar.
   ========================================================================== */

const EXAMPLES: { id: IndustryId; label: string; icon: NicheIconName }[] = [
  { id: "alimentos", label: "Panadería", icon: "bakery" },
  { id: "turismo", label: "Hotel", icon: "hotel-demo" },
  { id: "mineria", label: "Mina de carbón", icon: "mine-demo" },
];

const KINDS: { kind: SolutionKind; problem: string }[] = [
  { kind: "registro", problem: "Todo está en cuadernos" },
  { kind: "merma", problem: "Sobra o falta producto" },
  { kind: "clientes", problem: "No sé quiénes son mis clientes" },
  { kind: "solicitudes", problem: "Los pedidos se pierden en el chat" },
  { kind: "inventario", problem: "No sé qué se está agotando" },
  { kind: "indicadores", problem: "Decido a ojo" },
];

function before(kind: SolutionKind, industry: IndustryId): string[] {
  const [a, b] = SAMPLES[industry].items;
  const [c1] = SAMPLES[industry].customers;
  switch (kind) {
    case "registro":
      return [`lunes: 40 ${a.toLowerCase()} (creo)`, `${c1} pidió… ¿cuánto?`, "lo demás quedó en el WhatsApp"];
    case "merma":
      return [`sobraron como 20 ${a.toLowerCase()}`, `el viernes faltó ${b.toLowerCase()}`, "mañana hago lo mismo"];
    case "clientes":
      return ["la señora del martes", `${c1} → teléfono en otro cuaderno`, "¿quién volvió este mes?"];
    case "solicitudes":
      return [`«¿tiene ${a.toLowerCase()}?» respondido al otro día`, "queja sin respuesta", "40 chats sin leer"];
    case "inventario":
      return [`¿quedan ${b.toLowerCase()}?`, "contar a mano el sábado", "se acabó y nadie avisó"];
    default:
      return ["«este mes fue bueno, creo»", "¿más que el año pasado?", "decisión: hacer lo mismo"];
  }
}

export function SolutionShowcase({ onStart }: { onStart: () => void }) {
  const [industry, setIndustry] = useState<IndustryId>("alimentos");
  const [kind, setKind] = useState<SolutionKind>("registro");
  const solution = SOLUTIONS[kind];

  return (
    <div className="showcase reveal">
      <div className="showcase-bar">
        <div className="showcase-bar-copy">
          <p className="showcase-kicker">Lee el ejemplo interactivo</p>
          <p className="fine showcase-hint">
            Elija un tipo de negocio y un problema. Los números son ficticios: puede tocar botones y ver cómo cambia la
            solución.
          </p>
        </div>
        <div className="showcase-examples" role="radiogroup" aria-label="Negocio de ejemplo">
          {EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              role="radio"
              aria-checked={industry === example.id}
              className={industry === example.id ? "showcase-chip on" : "showcase-chip"}
              onClick={() => setIndustry(example.id)}
            >
              <span className="showcase-chip-icon">
                <NicheIcon name={example.icon} />
              </span>
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="showcase-body">
        <ul className="showcase-problems" role="tablist" aria-label="Problemas">
          {KINDS.map((item) => (
            <li key={item.kind}>
              <button
                type="button"
                role="tab"
                aria-selected={kind === item.kind}
                className={kind === item.kind ? "showcase-problem on" : "showcase-problem"}
                onClick={() => setKind(item.kind)}
              >
                <span className="showcase-problem-q">«{item.problem}»</span>
                <span className="showcase-problem-a">{SOLUTIONS[item.kind].name}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="showcase-stage" role="tabpanel">
          <div className="showcase-before">
            <p className="micro">Antes</p>
            <figure className="case-notebook">
              <ul>{before(kind, industry).map((line) => <li key={line}>{line}</li>)}</ul>
            </figure>
          </div>
          <div className="showcase-after">
            <p className="micro accent">Después · {solution.name}</p>
            <h3>{solutionHeadline(kind, industry)}</h3>
            <SolutionDemo key={`${industry}-${kind}`} kind={kind} industryId={industry} />
          </div>
        </div>
      </div>

      <div className="center-row">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Ver cuál es el problema central de mi empresa
        </button>
      </div>
    </div>
  );
}
