import type { Metadata } from "next";
import Link from "next/link";
import { logoutConsultor } from "@/app/actions/radar";
import { DataTools } from "@/components/consultor/DataTools";
import { requireConsultor } from "@/lib/auth/dal";
import { LEVELS } from "@/lib/radar/bank";
import type { LevelId } from "@/lib/radar/types";
import { LEAD_LABELS, LEAD_STATUSES, getDiagnosisStore, type LeadStatus } from "@/lib/store/diagnoses";

export const metadata: Metadata = {
  title: "Diagnósticos guardados",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;

function date(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ConsultorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; nivel?: string; estado?: string; pagina?: string }>;
}) {
  await requireConsultor();
  const params = await searchParams;
  const search = (params.q ?? "").slice(0, 80);
  const level = (["alto", "moderado", "bajo"].includes(params.nivel ?? "") ? params.nivel : "") as LevelId | "";
  const status = ((LEAD_STATUSES as readonly string[]).includes(params.estado ?? "") ? params.estado : "") as LeadStatus | "";
  const page = Math.max(1, Number(params.pagina) || 1);
  const store = getDiagnosisStore();
  const stats = store.stats();
  const { items, total } = store.list({ search, level, status, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (next: Record<string, string | number>) => {
    const merged: Record<string, string> = { ...(search && { q: search }), ...(level && { nivel: level }), ...(status && { estado: status }) };
    for (const [key, value] of Object.entries(next)) {
      if (value === "") delete merged[key];
      else merged[key] = String(value);
    }
    const query = new URLSearchParams(merged);
    return `/consultor?${query.toString()}`;
  };

  return (
    <section className="wrap consultor-panel">
      <header className="consultor-head">
        <div>
          <p className="micro accent">Radar IA · panel de consultores</p>
          <h1 className="display niche-title">Diagnósticos guardados</h1>
        </div>
        <form action={logoutConsultor}>
          <button type="submit" className="btn btn-ghost btn-sm">Cerrar sesión</button>
        </form>
      </header>

      <div className="consultor-stats">
        <div className="card"><span className="fine">Total</span><strong>{stats.total}</strong></div>
        <Link href={link({ estado: status === "interesado" ? "" : "interesado", pagina: "" })} className={`card is-lead${status === "interesado" ? " on" : ""}`}>
          <span className="fine">☎ Pidieron que los llamen</span>
          <strong>{stats.interested}</strong>
        </Link>
        {(Object.keys(LEVELS) as LevelId[]).map((id) => (
          <Link key={id} href={link({ nivel: level === id ? "" : id, pagina: "" })} className={`card is-${id}${level === id ? " on" : ""}`}>
            <span className="fine">{LEVELS[id].icon} {LEVELS[id].label}</span>
            <strong>{stats.byLevel[id]}</strong>
          </Link>
        ))}
      </div>

      <form className="consultor-search" action="/consultor">
        <input name="q" defaultValue={search} className="text-in sm" placeholder="Buscar por empresa, código, contacto, ciudad o industria" aria-label="Buscar" />
        {level ? <input type="hidden" name="nivel" value={level} /> : null}
        <select name="estado" defaultValue={status} className="text-in sm consultor-status-filter" aria-label="Estado del seguimiento">
          <option value="">Todos los estados</option>
          {LEAD_STATUSES.map((value) => <option key={value} value={value}>{LEAD_LABELS[value]}</option>)}
        </select>
        <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
      </form>

      {items.length === 0 ? (
        <p className="lead sm">{stats.total === 0 ? "Todavía no hay diagnósticos guardados. Aparecen aquí cuando una empresa termina la encuesta." : "Ningún diagnóstico coincide con la búsqueda."}</p>
      ) : (
        <div className="card consultor-table">
          <table>
            <thead>
              <tr><th>Empresa</th><th>Seguimiento</th><th>Industria · actividad</th><th>Índice</th><th>Problema central</th><th>Actualizado</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/consultor/${item.id}`}>{item.companyName}</Link><span className="fine">{[item.city, item.contactName].filter(Boolean).join(" · ")}</span></td>
                  <td><span className={`consultor-status is-${item.status}`}>{LEAD_LABELS[item.status]}</span><code>{item.code}</code></td>
                  <td>{item.industry}<span className="fine">{item.activity}</span></td>
                  <td><span className={`radar-level is-${item.level}`}>{LEVELS[item.level].icon} {item.index}</span></td>
                  <td className="consultor-problem">{item.centralProblem}</td>
                  <td className="fine">{date(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <nav className="consultor-pages" aria-label="Páginas">
          {page > 1 ? <Link href={link({ pagina: page - 1 })}>← Anterior</Link> : <span />}
          <span className="fine">Página {page} de {pages} · {total} diagnósticos</span>
          {page < pages ? <Link href={link({ pagina: page + 1 })}>Siguiente →</Link> : <span />}
        </nav>
      ) : null}
      <DataTools total={stats.total} />
    </section>
  );
}
