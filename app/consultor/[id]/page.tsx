import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CostCalculator } from "@/components/consultor/CostCalculator";
import { LeadStatusForm } from "@/components/consultor/LeadStatusForm";
import { ReopenButtons } from "@/components/consultor/ReopenButtons";
import { RadarChart } from "@/components/radar/RadarChart";
import { SolutionPresentationBadge } from "@/components/radar/SolutionPresentationBadge";
import { requireConsultor } from "@/lib/auth/dal";
import { LEVELS, PLANS, SIZES } from "@/lib/radar/bank";
import { buildRadarResult } from "@/lib/radar/engine";
import { samplePageHref, solutionPresentationBadge } from "@/lib/site/solution-presentation";
import { getDiagnosisStore } from "@/lib/store/diagnoses";

export const metadata: Metadata = {
  title: "Diagnóstico guardado",
  robots: { index: false, follow: false },
};

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export default async function SavedDiagnosisPage({ params }: { params: Promise<{ id: string }> }) {
  await requireConsultor();
  const { id } = await params;
  const record = await (await getDiagnosisStore()).get(id);
  if (!record) notFound();
  const result = buildRadarResult(record.answers);
  const level = LEVELS[result.level];
  const solutionBadge = solutionPresentationBadge(record.solutionSpec, result.presentation);
  const pageHref = samplePageHref(record.code);

  return (
    <section className="wrap consultor-panel">
      <p><Link href="/consultor" className="link-btn">← Todos los diagnósticos</Link></p>
      <header className="consultoria-report-head">
        <p className="micro accent">Código {record.code}</p>
        <h1 className="display niche-title">{record.companyName}</h1>
        <p>
          <Link href={pageHref} className="link-btn" target="_blank" rel="noopener noreferrer">
            Ver la página
          </Link>
        </p>
        <p className="radar-chips">
          <span className="tag">{record.industry}</span>
          <span className="tag">{record.activity}</span>
          {solutionBadge ? <SolutionPresentationBadge badge={solutionBadge} /> : null}
          {record.answers.size ? <span className="tag">{SIZES[record.answers.size].detail}</span> : null}
          {record.city ? <span className="tag">{record.city}</span> : null}
        </p>
      </header>

      <div className="consultor-detail">
        <div className="card consultor-card">
          <p className={`radar-level is-${result.level}`}><span aria-hidden="true">{level.icon}</span> {level.label} · {result.index}/100</p>
          <p className="radar-reading">{level.reading}</p>
          {result.central ? (
            <p><span className="fine">Problema central:</span><br />{result.central.problem}</p>
          ) : null}
          <p><span className="fine">Plan recomendado:</span><br />{PLANS[result.plan].name} · {result.effort.range[0]}–{result.effort.range[1]} h · {result.effort.visits} visitas</p>
          {record.interestAt ? <p className="consultor-interest">☎ Pidió que lo llamen el {dateTime(record.interestAt)}</p> : null}
          <dl className="consultor-contact">
            <div><dt>Contacto</dt><dd>{record.contactName || "—"}</dd></div>
            <div><dt>Correo</dt><dd>{record.email ? <a href={`mailto:${record.email}`}>{record.email}</a> : "—"}</dd></div>
            <div><dt>Teléfono empresa</dt><dd>{record.phone || "—"}</dd></div>
            <div><dt>Teléfono contacto</dt><dd>{record.contactPhone || "—"}</dd></div>
            <div><dt>Autorizó datos</dt><dd>{dateTime(record.consentAt)}</dd></div>
            <div><dt>Última actualización</dt><dd>{dateTime(record.updatedAt)}</dd></div>
          </dl>
        </div>
        <div className="card radar-shape">
          <RadarChart dimensions={result.dimensions} size={230} showValues />
        </div>
      </div>

      <LeadStatusForm id={record.id} status={record.status} notes={record.notes} />

      <CostCalculator effort={result.effort} plan={PLANS[result.plan].name} />

      <ReopenButtons answers={record.answers} />
      <p className="fine">«Abrir» carga este diagnóstico en este navegador para revisarlo con el cliente. Si edita las respuestas, al terminar se actualiza este mismo registro.</p>
    </section>
  );
}
