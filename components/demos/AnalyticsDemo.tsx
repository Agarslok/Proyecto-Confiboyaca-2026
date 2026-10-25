"use client";

import { useState } from "react";
import { analyticsFor } from "@/lib/data/demos";
import type { SectorTemplateKey } from "@/types/domain";

export function AnalyticsDemo({ templateKey }: { templateKey: SectorTemplateKey }) {
  const periods = analyticsFor(templateKey);
  const [periodId, setPeriodId] = useState(periods[0].id);
  const period = periods.find((item) => item.id === periodId) ?? periods[0];
  const max = Math.max(...period.bars.map((bar) => bar.value));

  return (
    <div className="demo-block">
      <div className="filters" role="toolbar" aria-label="Periodo de la demostración">
        {periods.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === period.id ? "filter is-selected" : "filter"}
            aria-pressed={item.id === period.id}
            onClick={() => setPeriodId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="metric-grid">
        {period.metrics.map((metric) => (
          <article className="metric" key={metric.id}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>
      <div className="chart">
        <h2>Casos ficticios por área</h2>
        <ul className="bars">
          {period.bars.map((bar) => (
            <li key={bar.label}>
              <span>{bar.label}</span>
              <span className="bar-track" aria-hidden="true">
                <span className="bar-fill" style={{ width: `${(bar.value / max) * 100}%` }} />
              </span>
              <span>{bar.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
