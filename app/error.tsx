"use client";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="panel empty-state">
      <h1>No se pudo mostrar esta vista</h1>
      <p>El recorrido guardado en este navegador sigue disponible. Puede intentar de nuevo.</p>
      <button className="btn btn-primary" type="button" onClick={reset}>
        Reintentar
      </button>
    </section>
  );
}
