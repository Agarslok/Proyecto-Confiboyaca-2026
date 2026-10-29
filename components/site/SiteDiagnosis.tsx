"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConsultoriaQr } from "@/components/site/ConsultoriaQr";
import { ConsultoriaSignals } from "@/components/site/ConsultoriaSignals";
import { RadarReport } from "@/components/radar/RadarReport";
import { useSite } from "@/components/site/useSite";
import { buildConsultancy } from "@/lib/site/consultancy";
import { setSiteStep } from "@/lib/session/site-session";

export function SiteDiagnosis() {
  const router = useRouter();
  const state = useSite();
  const config = state.config;

  const consultancy = useMemo(() => {
    if (!config) return null;
    if (config.consultancy) return config.consultancy;
    return buildConsultancy({
      companyName: config.companyName,
      sectorId: config.sectorId,
      activity: "",
      audience: "",
      goal: "",
      otherGoal: "",
      features: [],
    });
  }, [config]);

  if (config?.radar) return <RadarReport config={{ ...config, radar: config.radar }} />;

  if (!config || !consultancy) {
    return (
      <section className="wrap empty-state">
        <p className="micro accent">Consultoría</p>
        <h1 className="display r-title">Todavía no hay una consultoría preparada</h1>
        <p className="lead sm">
          Complete el formulario. Si recargó el navegador antes de terminar, las respuestas guardadas siguen en el
          formulario.
        </p>
        <Button href="/diagnostico">Ir al formulario</Button>
      </section>
    );
  }

  return (
    <article className="wrap consultoria-report">
      <header className="consultoria-report-head">
        <h1 className="consultoria-report-title">
          <span className="consultoria-report-kicker">Consultoría para</span>
          <span className="consultoria-report-name display">{config.companyName}</span>
        </h1>
        <p className="lead sm">{consultancy.intro}</p>
      </header>

      <div className="consultoria-grid">
        <section className="consultoria-narrative card" aria-labelledby="consultoria-narrative-title">
          <h2 id="consultoria-narrative-title">Lo que encontró nuestra consultora</h2>
          <p>{consultancy.solutionPitch}</p>
          <ul className="consultoria-highlights">
            {consultancy.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="consultoria-priorities card" aria-labelledby="consultoria-priorities-title">
          <h2 id="consultoria-priorities-title">Señales prioritarias</h2>
          <p className="fine">Semáforo interpretativo: qué importa ahora y cómo lo abordamos en la web.</p>
          <ConsultoriaSignals signals={consultancy.signals} />
        </section>
      </div>

      <section className="consultoria-cta card" aria-label="Acceso a tu solución web">
        <div className="consultoria-cta-block">
          <h3>Conoce tu solución</h3>
          <ConsultoriaQr siteId={config.id} />
        </div>
        <div className="consultoria-cta-block is-visit">
          <h3>Visita tu solución</h3>
          <p className="fine">Se abre en una pestaña nueva para que sigas viendo este informe.</p>
          <Button href="/sitio" target="_blank" rel="noopener noreferrer" className="btn-block">
            Ver mi página web
          </Button>
        </div>
      </section>

      <div className="consultoria-report-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSiteStep(0);
            router.push("/diagnostico");
          }}
        >
          Editar respuestas
        </Button>
      </div>
    </article>
  );
}
