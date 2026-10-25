"use client";

import { useState } from "react";
import {
  clientsFor,
  CRM_STAGES,
  nextStage,
  stageLabels,
  type CrmStage,
  type DemoClient,
} from "@/lib/data/demos";
import type { SectorTemplateKey } from "@/types/domain";

export function CrmDemo({ templateKey }: { templateKey: SectorTemplateKey }) {
  const [clients, setClients] = useState<DemoClient[]>(() => clientsFor(templateKey));
  const [filter, setFilter] = useState<CrmStage | "todas">("todas");
  const visible = clients.filter((client) => filter === "todas" || client.stage === filter);

  function advance(id: string) {
    setClients((current) =>
      current.map((client) => {
        if (client.id !== id) return client;
        const stage = nextStage(client.stage);
        return stage ? { ...client, stage } : client;
      }),
    );
  }

  return (
    <div className="demo-block">
      <div className="filters" role="toolbar" aria-label="Filtrar cuentas de demostración">
        <button
          type="button"
          className={filter === "todas" ? "filter is-selected" : "filter"}
          aria-pressed={filter === "todas"}
          onClick={() => setFilter("todas")}
        >
          Todas ({clients.length})
        </button>
        {CRM_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            className={filter === stage ? "filter is-selected" : "filter"}
            aria-pressed={filter === stage}
            onClick={() => setFilter(stage)}
          >
            {stageLabels[stage]} ({clients.filter((client) => client.stage === stage).length})
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="empty-inline">Ningún registro de demostración en este estado.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption>Cuentas ficticias de seguimiento comercial</caption>
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Asunto</th>
                <th>Estado</th>
                <th>Siguiente paso</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((client) => {
                const upcoming = nextStage(client.stage);
                return (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.account}</td>
                    <td>{stageLabels[client.stage]}</td>
                    <td>{client.nextStep}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={!upcoming}
                        onClick={() => advance(client.id)}
                      >
                        {upcoming ? `Pasar a ${stageLabels[upcoming].toLowerCase()}` : "Sin avance"}
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
