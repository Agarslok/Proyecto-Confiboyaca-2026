"use client";

import { useState } from "react";
import type { Effort } from "@/lib/radar/effort";
import { REFERENCE_RATES, costEstimate, money, type Rates } from "@/lib/radar/pricing";

const FIELDS: { key: keyof Rates; label: string; percent?: boolean }[] = [
  { key: "hourCost", label: "Costo hora del equipo (salario + prestaciones)" },
  { key: "transportPerVisit", label: "Transporte por visita" },
  { key: "perDiemPerVisit", label: "Viáticos por visita" },
  { key: "toolsPerMonth", label: "Licencias y herramientas por mes" },
  { key: "overhead", label: "Gastos administrativos", percent: true },
  { key: "margin", label: "Margen", percent: true },
];

/** Costo y precio sugerido del plan. Valores de referencia editables; no se guardan. */
export function CostCalculator({ effort, plan }: { effort: Effort; plan: string }) {
  const [rates, setRates] = useState<Rates>(REFERENCE_RATES);
  const cost = costEstimate(effort, rates);

  return (
    <section className="card consultor-cost" aria-labelledby="cost-title">
      <div>
        <p className="micro accent">Solo para el equipo · no lo ve el cliente</p>
        <h2 id="cost-title">Costo del {plan}</h2>
        <p className="fine">
          {effort.total} horas · {effort.visits} visitas · ≈ {effort.months} meses. Los valores son de referencia:
          cámbielos por las tarifas reales.
        </p>
        <div className="consultor-cost-fields">
          {FIELDS.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              <input
                inputMode="numeric"
                value={field.percent ? Math.round(rates[field.key] * 100) : rates[field.key]}
                onChange={(event) => {
                  const value = Number(event.target.value.replace(/[^\d]/g, "")) || 0;
                  setRates({ ...rates, [field.key]: field.percent ? value / 100 : value });
                }}
              />
              {field.percent ? <em>%</em> : null}
            </label>
          ))}
        </div>
      </div>
      <dl className="consultor-cost-total">
        <div><dt>Horas del equipo</dt><dd>{money(cost.team)}</dd></div>
        <div><dt>Transporte y viáticos</dt><dd>{money(cost.travel)}</dd></div>
        <div><dt>Herramientas</dt><dd>{money(cost.tools)}</dd></div>
        <div><dt>Administración</dt><dd>{money(cost.overhead)}</dd></div>
        <div className="is-sub"><dt>Costo total</dt><dd>{money(cost.cost)}</dd></div>
        <div className="is-total"><dt>Precio sugerido</dt><dd>{money(cost.price)}</dd></div>
        <div><dt>Equivale a</dt><dd>{money(cost.perHour)} por hora</dd></div>
      </dl>
    </section>
  );
}
