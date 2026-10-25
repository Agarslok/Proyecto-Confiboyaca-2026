"use client";

import { useState } from "react";
import { isLowStock, stockFor, type DemoStockItem } from "@/lib/data/demos";
import type { SectorTemplateKey } from "@/types/domain";

export function InventoryDemo({ templateKey }: { templateKey: SectorTemplateKey }) {
  const [items, setItems] = useState<DemoStockItem[]>(() => stockFor(templateKey));
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const visible = items.filter((item) => !onlyAlerts || isLowStock(item.stock, item.minimum));
  const alerts = items.filter((item) => isLowStock(item.stock, item.minimum)).length;

  function adjust(id: string, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    );
  }

  return (
    <div className="demo-block">
      <div className="filters">
        <button
          type="button"
          className={onlyAlerts ? "filter is-selected" : "filter"}
          aria-pressed={onlyAlerts}
          onClick={() => setOnlyAlerts((current) => !current)}
        >
          Solo alertas ({alerts})
        </button>
        <p className="hint" role="status">
          {alerts === 0
            ? "Ningún material de ejemplo está en o bajo el mínimo."
            : `${alerts} materiales de ejemplo están en o bajo el mínimo.`}
        </p>
      </div>
      {visible.length === 0 ? (
        <p className="empty-inline">Ningún material de demostración coincide con el filtro.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption>Existencias ficticias con mínimo de reposición</caption>
            <thead>
              <tr>
                <th>Código</th>
                <th>Material</th>
                <th>Existencia</th>
                <th>Mínimo</th>
                <th>Aviso</th>
                <th>Ajuste</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const low = isLowStock(item.stock, item.minimum);
                return (
                  <tr key={item.id}>
                    <td>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>
                      {item.stock} {item.unit}
                    </td>
                    <td>
                      {item.minimum} {item.unit}
                    </td>
                    <td>
                      <span className={low ? "tag tag-warn" : "tag"}>{low ? "Bajo mínimo" : "En rango"}</span>
                    </td>
                    <td className="qty">
                      <button type="button" onClick={() => adjust(item.id, -1)} aria-label={`Reducir ${item.name}`}>
                        −
                      </button>
                      <button type="button" onClick={() => adjust(item.id, 1)} aria-label={`Aumentar ${item.name}`}>
                        +
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
