import type { Metadata } from "next";
import Link from "next/link";
import { logoutConsultor } from "@/app/actions/radar";
import { requireConsultor } from "@/lib/auth/dal";
import { LEVELS } from "@/lib/radar/bank";
import type { LevelId } from "@/lib/radar/types";
import { getDiagnosisStore } from "@/lib/store/diagnoses";

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
  searchParams: Promise<{ q?: string; nivel?: string; pagina?: string }>;
}) {
  await requireConsultor();
  const params = await searchParams;
  const search = (params.q ?? "").slice(0, 80);
  const level = (["alto", "moderado", "bajo"].includes(params.nivel ?? "") ? params.nivel : "") as LevelId | "";
  const page = Math.max(1, Number(params.pagina) || 1);
  const store = getDiagnosisStore();
  const stats = store.stats();
  const { items, total } = store.list({ search, level, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (next: Record<string, string | number>) => {
    const query = new URLSearchParams({ ...(search && { q: search }), ...(level && { nivel: level }), ...Object.fromEntries(Object.entries(next).map(([k, v]) => [k, String(v)])) });
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
        {(Object.keys(LEVELS) as LevelId[]).map((id) => (
          <Link key={id} href={link({ nivel: level === id ? "" : id })} className={`card is-${id}${level === id ? " on" : ""}`}>
            <span className="fine">{LEVELS[id].icon} {LEVELS[id].label}</span>
            <strong>{stats.byLevel[id]}</strong>
          </Link>
        ))}
      </div>

      <form className="consultor-search" action="/consultor">
        <input name="q" defaultValue={search} className="text-in sm" placeholder="Buscar por empresa, código, contacto, ciudad o industria" aria-label="Buscar" />
        {level ? <input type="hidden" name="nivel" value={level} /> : null}
        <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
      </form>

      {items.length === 0 ? (
        <p className="lead sm">{stats.total === 0 ? "Todavía no hay diagnósticos guardados. Aparecen aquí cuando una empresa termina la encuesta." : "Ningún diagnóstico coincide con la búsqueda."}</p>
      ) : (
        <div className="card consultor-table">
          <table>
            <thead>
              <tr><th>Empresa</th><th>Código</th><th>Industria · actividad</th><th>Índice</th><th>Problema central</th><th>Actualizado</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/consultor/${item.id}`}>{item.companyName}</Link><span className="fine">{[item.city, item.contactName].filter(Boolean).join(" · ")}</span></td>
                  <td><code>{item.code}</code></td>
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
    </section>
  );
}
