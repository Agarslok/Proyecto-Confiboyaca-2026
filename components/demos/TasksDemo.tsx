"use client";

import { useState } from "react";
import {
  TASK_STATUSES,
  taskStatusLabels,
  tasksFor,
  type DemoTask,
  type TaskStatus,
} from "@/lib/data/demos";
import type { SectorTemplateKey } from "@/types/domain";

export function TasksDemo({ templateKey }: { templateKey: SectorTemplateKey }) {
  const [tasks, setTasks] = useState<DemoTask[]>(() => tasksFor(templateKey));
  const [filter, setFilter] = useState<TaskStatus | "todas">("todas");
  const visible = tasks.filter((task) => filter === "todas" || task.status === filter);

  function update(id: string, status: TaskStatus) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
  }

  return (
    <div className="demo-block">
      <div className="filters" role="toolbar" aria-label="Filtrar tareas de demostración">
        <button
          type="button"
          className={filter === "todas" ? "filter is-selected" : "filter"}
          aria-pressed={filter === "todas"}
          onClick={() => setFilter("todas")}
        >
          Todas ({tasks.length})
        </button>
        {TASK_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={filter === status ? "filter is-selected" : "filter"}
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
          >
            {taskStatusLabels[status]} ({tasks.filter((task) => task.status === status).length})
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="empty-inline">Ninguna tarea de demostración en este estado.</p>
      ) : (
        <ul className="task-list">
          {visible.map((task) => (
            <li key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.owner}</span>
              </div>
              <label>
                Estado
                <select
                  value={task.status}
                  onChange={(event) => update(task.id, event.target.value as TaskStatus)}
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {taskStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
