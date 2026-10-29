"use client";

import { useState, type FormEvent } from "react";
import { SAMPLES } from "@/lib/radar/bank";
import type { CentralProblem } from "@/lib/radar/solution";
import type { IndustryId } from "@/lib/radar/types";

/* ============================================================================
   Capa de la consultoría sobre la página generada: explica el problema
   central de la empresa y muestra, con datos de ejemplo que se pueden
   tocar, cómo la página lo resuelve. Va después de la plantilla, sin
   modificarla, con un botón flotante para llegar.
   ========================================================================== */

const TODAY = "Hoy";

type Field = { label: string; options?: string[]; numeric?: boolean };

type Schema = { fields: Field[]; seed: string[][]; submit: string };

/** Registro general según la industria, cuando el problema es de datos y no de una pregunta puntual. */
function industrySchema(industryId: IndustryId | "", items: string[], customers: string[]): Schema | null {
  switch (industryId) {
    case "mineria":
      return {
        fields: [{ label: "Frente", options: ["Frente 1", "Frente 2", "Frente 3"] }, { label: "Turno", options: ["Día", "Noche"] }, { label: "Toneladas", numeric: true }],
        seed: [["Frente 1", "Día", "42"], ["Frente 2", "Noche", "35"]],
        submit: "Registrar producción",
      };
    case "agro":
      return {
        fields: [{ label: "Lote", options: ["Lote 1", "Lote 2", "Lote 3"] }, { label: "Producto", options: items }, { label: "Kilos cosechados", numeric: true }],
        seed: [["Lote 1", items[0], "1.200"], ["Lote 3", items[1], "640"]],
        submit: "Registrar cosecha",
      };
    case "salud":
      return {
        fields: [{ label: "Servicio", options: items }, { label: "Paciente" }, { label: "Estado", options: ["Agendada", "Atendida", "No asistió"] }],
        seed: [[items[0], customers[0], "Atendida"], [items[1], customers[1], "No asistió"]],
        submit: "Agendar cita",
      };
    case "turismo":
      return {
        fields: [{ label: "Tipo", options: items }, { label: "Huésped" }, { label: "Canal", options: ["Directo", "Booking", "Agencia"] }],
        seed: [[items[0], customers[0], "Directo"], [items[2], customers[1], "Agencia"]],
        submit: "Reservar",
      };
    case "construccion":
      return {
        fields: [{ label: "Material", options: items }, { label: "Obra", options: ["Torres del Lago", "Casa Becerra"] }, { label: "Cantidad", numeric: true }],
        seed: [[items[0], "Torres del Lago", "80"], [items[1], "Casa Becerra", "30"]],
        submit: "Registrar salida",
      };
    case "transporte":
      return {
        fields: [{ label: "Envío", options: items }, { label: "Cliente" }, { label: "Kilos", numeric: true }],
        seed: [[items[0], customers[0], "850"], [items[1], customers[1], "320"]],
        submit: "Registrar envío",
      };
    default:
      return null;
  }
}

/** Columnas del registro según el problema: incidente, paro de máquina, labor por lote o el registro de la industria. */
function recordSchema(questionId: string, industryId: IndustryId | "", items: string[], customers: string[]): Schema {
  if (questionId === "mineria-1") {
    return {
      fields: [{ label: "Frente", options: ["Frente 1", "Frente 2", "Frente 3"] }, { label: "Tipo", options: ["Casi-accidente", "Condición insegura", "Incidente"] }, { label: "Causa" }],
      seed: [["Frente 2", "Casi-accidente", "Ventilación insuficiente"], ["Frente 1", "Condición insegura", "Sostenimiento flojo"]],
      submit: "Reportar evento",
    };
  }
  if (questionId === "manufactura-1") {
    return {
      fields: [{ label: "Máquina", options: ["Troqueladora", "Soldadora", "Torno CNC"] }, { label: "Causa", options: ["Falta de material", "Falla mecánica", "Cambio de referencia"] }, { label: "Minutos", numeric: true }],
      seed: [["Torno CNC", "Falla mecánica", "45"], ["Troqueladora", "Falta de material", "20"]],
      submit: "Registrar paro",
    };
  }
  if (questionId === "agro-1") {
    return {
      fields: [{ label: "Lote", options: ["Lote 1", "Lote 2", "Lote 3"] }, { label: "Labor", options: ["Fertilización", "Fumigación", "Cosecha"] }, { label: "Cantidad (kg)", numeric: true }],
      seed: [["Lote 2", "Fertilización", "50"], ["Lote 1", "Cosecha", "1.200"]],
      submit: "Registrar labor",
    };
  }
  const byIndustry = industrySchema(industryId, items, customers);
  if (byIndustry) return byIndustry;
  return {
    fields: [{ label: "Producto", options: items }, { label: "Cantidad", numeric: true }, { label: "Cliente" }],
    seed: [[items[0], "24", customers[0]], [items[1], "6", customers[1]]],
    submit: "Hacer pedido",
  };
}

function RegistroDemo({ questionId, industryId, items, customers }: { questionId: string; industryId: IndustryId | ""; items: string[]; customers: string[] }) {
  const schema = recordSchema(questionId, industryId, items, customers);
  const [rows, setRows] = useState(schema.seed.map((row, index) => [index === 0 ? "Ayer" : TODAY, ...row]));
  const [values, setValues] = useState<string[]>(schema.fields.map((field) => field.options?.[0] ?? ""));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (values.some((value) => !value.trim())) return;
    setRows([[TODAY, ...values], ...rows]);
    setValues(schema.fields.map((field) => field.options?.[0] ?? ""));
  }

  return (
    <div className="sol-demo">
      <form className="sol-form" onSubmit={submit}>
        {schema.fields.map((field, index) => (
          <label key={field.label}>
            <span>{field.label}</span>
            {field.options ? (
              <select value={values[index]} onChange={(event) => setValues(values.map((v, i) => (i === index ? event.target.value : v)))}>
                {field.options.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input
                inputMode={field.numeric ? "numeric" : undefined}
                value={values[index]}
                placeholder={field.numeric ? "0" : "Escriba aquí"}
                onChange={(event) => setValues(values.map((v, i) => (i === index ? event.target.value : v)))}
              />
            )}
          </label>
        ))}
        <button type="submit" className="sol-btn">{schema.submit}</button>
      </form>
      <div className="sol-table-wrap">
        <table className="sol-table">
          <thead>
            <tr><th>Fecha</th>{schema.fields.map((field) => <th key={field.label}>{field.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={index === 0 && rows.length > schema.seed.length ? "is-new" : undefined}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sol-note">{rows.length} registros guardados en una sola tabla. Pruebe agregar uno: aparece arriba al instante.</p>
    </div>
  );
}

function MermaDemo({ items }: { items: string[] }) {
  const sold = [94, 61, 9];
  const [produced, setProduced] = useState([120, 64, 14]);
  const waste = produced.map((value, index) => Math.max(0, value - sold[index]));
  const total = waste.reduce((a, b) => a + b, 0) / produced.reduce((a, b) => a + b, 0);
  return (
    <div className="sol-demo">
      <div className="sol-table-wrap">
        <table className="sol-table">
          <thead><tr><th>Producto</th><th>Producido</th><th>Vendido</th><th>Sobrante</th><th>Merma</th><th>Sugerido mañana</th></tr></thead>
          <tbody>
            {items.map((item, index) => {
              const pct = produced[index] ? waste[index] / produced[index] : 0;
              return (
                <tr key={item}>
                  <td>{item}</td>
                  <td>
                    <input
                      className="sol-cell-input"
                      inputMode="numeric"
                      aria-label={`Producido de ${item}`}
                      value={produced[index]}
                      onChange={(event) => setProduced(produced.map((v, i) => (i === index ? Number(event.target.value.replace(/\D/g, "")) || 0 : v)))}
                    />
                  </td>
                  <td>{sold[index]}</td>
                  <td>{waste[index]}</td>
                  <td><span className={pct > 0.1 ? "sol-bad" : "sol-good"}>{Math.round(pct * 100)} %</span></td>
                  <td>{Math.ceil(sold[index] * 1.05)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sol-note">Merma total del día: <strong>{Math.round(total * 100)} %</strong>. Cambie lo producido y vea cómo baja; el «sugerido» sale de lo que se vende.</p>
    </div>
  );
}

function ClientesDemo({ customers }: { customers: string[] }) {
  const [list, setList] = useState(customers.map((name, index) => ({ id: `CL-000${index + 1}`, name, buys: index === 0 ? 4 : 1 })));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const valid = name.trim().length > 1 && /^\d{10}$/.test(phone) && consent;
  return (
    <div className="sol-demo">
      <form
        className="sol-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          setList([{ id: `CL-${String(list.length + 1).padStart(4, "0")}`, name: name.trim(), buys: 1 }, ...list]);
          setName("");
          setPhone("");
          setConsent(false);
        }}
      >
        <label><span>Nombre</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Escriba aquí" /></label>
        <label><span>WhatsApp (10 dígitos)</span><input inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="3001234567" /></label>
        <label className="sol-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Autorizo el tratamiento de mis datos (Ley 1581 de 2012)</label>
        <button type="submit" className="sol-btn" disabled={!valid}>Unirme</button>
      </form>
      <ul className="sol-list">
        {list.map((client) => (
          <li key={client.id}><code>{client.id}</code> {client.name} <span>{client.buys > 1 ? `${client.buys} compras · frecuente` : "1 compra"}</span></li>
        ))}
      </ul>
      <p className="sol-note">Cada cliente queda con un código único: no hay duplicados y se puede medir quién vuelve.</p>
    </div>
  );
}

const STATES = ["Recibida", "En curso", "Resuelta"];

function SolicitudesDemo({ items }: { items: string[] }) {
  const [list, setList] = useState([
    { id: 1042, text: `Consulta por ${items[0].toLowerCase()}`, state: 2, hours: 3 },
    { id: 1043, text: `Cambio en ${items[1].toLowerCase()}`, state: 1, hours: 5 },
    { id: 1044, text: `Queja: demora con ${items[2].toLowerCase()}`, state: 0, hours: 0 },
  ]);
  const [text, setText] = useState("");
  const resolved = list.filter((item) => item.state === 2);
  return (
    <div className="sol-demo">
      <form
        className="sol-form sol-form-inline"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) return;
          setList([{ id: Math.max(...list.map((item) => item.id)) + 1, text: text.trim(), state: 0, hours: 0 }, ...list]);
          setText("");
        }}
      >
        <label><span>Nueva solicitud</span><input value={text} onChange={(event) => setText(event.target.value)} placeholder="¿En qué le podemos ayudar?" /></label>
        <button type="submit" className="sol-btn">Enviar</button>
      </form>
      <ul className="sol-list">
        {list.map((item) => (
          <li key={item.id}>
            <code>#{item.id}</code> {item.text}
            <button type="button" className={`sol-state is-${item.state}`} disabled={item.state === 2} onClick={() => setList(list.map((entry) => (entry.id === item.id ? { ...entry, state: entry.state + 1, hours: entry.hours + 2 } : entry)))}>
              {STATES[item.state]}{item.state < 2 ? " → avanzar" : ""}
            </button>
          </li>
        ))}
      </ul>
      <p className="sol-note">{resolved.length} resueltas · tiempo promedio de respuesta {resolved.length ? Math.round(resolved.reduce((a, b) => a + b.hours, 0) / resolved.length) : 0} h. El cliente ve el estado de su solicitud.</p>
    </div>
  );
}

function InventarioDemo({ items }: { items: string[] }) {
  const [stock, setStock] = useState([18, 6, 40]);
  const minimum = [10, 8, 12];
  return (
    <div className="sol-demo">
      <ul className="sol-list">
        {items.map((item, index) => (
          <li key={item}>
            <strong>{item}</strong> {stock[index]} en existencia (mínimo {minimum[index]})
            {stock[index] <= minimum[index] ? <span className="sol-bad">● Pedir ya</span> : <span className="sol-good">Disponible</span>}
            <button type="button" className="sol-state" disabled={stock[index] === 0} onClick={() => setStock(stock.map((v, i) => (i === index ? v - 1 : v)))}>Vender 1</button>
          </li>
        ))}
      </ul>
      <p className="sol-note">Cada venta descuenta del inventario y avisa cuando un producto llega al mínimo.</p>
    </div>
  );
}

const MONTHS = ["Agosto", "Septiembre", "Octubre"];

function IndicadoresDemo() {
  const [month, setMonth] = useState(2);
  const kpis = [
    { label: "Ventas del mes", values: [14.2, 15.1, 16.4], goal: 18, unit: " M" },
    { label: "Clientes que vuelven", values: [24, 28, 31], goal: 40, unit: " %" },
    { label: "Pedidos a tiempo", values: [81, 86, 92], goal: 95, unit: " %" },
  ];
  return (
    <div className="sol-demo">
      <div className="sol-tabs" role="tablist">
        {MONTHS.map((name, index) => (
          <button key={name} type="button" role="tab" aria-selected={month === index} className={month === index ? "on" : undefined} onClick={() => setMonth(index)}>{name}</button>
        ))}
      </div>
      <div className="sol-kpis">
        {kpis.map((kpi) => {
          const value = kpi.values[month];
          return (
            <div key={kpi.label} className="sol-kpi">
              <span>{kpi.label}</span>
              <strong>{value}{kpi.unit}</strong>
              <span className="sol-bar"><span style={{ width: `${Math.min(100, (value / kpi.goal) * 100)}%` }} /></span>
              <span className="sol-note">Meta {kpi.goal}{kpi.unit}</span>
            </div>
          );
        })}
      </div>
      <p className="sol-note">Los indicadores se calculan solos a partir de los registros. Cifras de ejemplo.</p>
    </div>
  );
}

function RespaldoDemo() {
  const checks = ["Copia automática diaria en la nube", "Restauración probada este trimestre", "Una cuenta por persona con verificación en dos pasos", "Reglas escritas de qué información va a herramientas de IA"];
  const [done, setDone] = useState([true, false, false, false]);
  const score = done.filter(Boolean).length;
  return (
    <div className="sol-demo">
      <ul className="sol-list">
        {checks.map((check, index) => (
          <li key={check}>
            <label className="sol-check">
              <input type="checkbox" checked={done[index]} onChange={() => setDone(done.map((v, i) => (i === index ? !v : v)))} /> {check}
            </label>
          </li>
        ))}
      </ul>
      <p className="sol-note">Riesgo de perder la información: <strong className={score >= 3 ? "sol-good" : "sol-bad"}>{["muy alto", "alto", "medio", "bajo", "muy bajo"][score]}</strong>. Marque las medidas para verlo bajar.</p>
    </div>
  );
}

function Demo({ central }: { central: CentralProblem }) {
  const sample = SAMPLES[(central.industryId || "otra") as IndustryId];
  switch (central.kind) {
    case "registro": return <RegistroDemo questionId={central.questionId} industryId={central.industryId} items={sample.items} customers={sample.customers} />;
    case "merma": return <MermaDemo items={sample.items} />;
    case "clientes": return <ClientesDemo customers={sample.customers} />;
    case "solicitudes": return <SolicitudesDemo items={sample.items} />;
    case "inventario": return <InventarioDemo items={sample.items} />;
    case "indicadores": return <IndicadoresDemo />;
    case "respaldo": return <RespaldoDemo />;
  }
}

export function SolutionSpotlight({ central, companyName }: { central: CentralProblem; companyName: string }) {
  return (
    <>
      <a className="sol-pill" href="#solucion-consultoria">
        <span aria-hidden="true">◎</span> Cómo esta página resuelve: {central.name.toLowerCase()}
      </a>
      <section id="solucion-consultoria" className="sol-section" aria-labelledby="sol-title">
        <div className="sol-inner">
          <p className="sol-kicker">Radar IA · solución de la consultoría para {companyName}</p>
          <h2 id="sol-title">{central.headline}</h2>
          <div className="sol-problem">
            <span className="sol-tag">Problema central · {central.dimensionLabel}</span>
            <p>{central.problem}</p>
          </div>
          <div className="sol-grid">
            <div>
              <h3>{central.name}</h3>
              <ul className="sol-changes">
                {central.changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
              {central.also.length ? (
                <>
                  <p className="sol-small">La página también ayuda con:</p>
                  <ul className="sol-also">
                    {central.also.map((item) => <li key={item.kind}><strong>{item.name}.</strong> {item.problem}</li>)}
                  </ul>
                </>
              ) : null}
            </div>
            <Demo central={central} />
          </div>
          <p className="sol-small">Demostración con datos de ejemplo. Nada de lo que escriba aquí se envía ni se guarda.</p>
        </div>
      </section>
    </>
  );
}
