"use client";

import { useEffect, useMemo, useState } from "react";
import { buildQrMatrix, QR_MATRIX_SIZE } from "@/lib/site/qr-matrix";

interface ConsultoriaQrProps {
  siteId: string;
  path?: string;
}

export function ConsultoriaQr({ siteId, path = "/sitio" }: ConsultoriaQrProps) {
  const [targetUrl, setTargetUrl] = useState("");

  useEffect(() => {
    setTargetUrl(`${window.location.origin}${path}`);
  }, [path]);

  const matrix = useMemo(
    () => buildQrMatrix(`${siteId}|${targetUrl || path}`),
    [siteId, targetUrl, path],
  );

  const label = targetUrl || `Tu solución en ${path}`;

  return (
    <figure className="consultoria-qr" aria-label={`Código QR hacia ${label}`}>
      <svg
        className="consultoria-qr-svg"
        viewBox={`0 0 ${QR_MATRIX_SIZE} ${QR_MATRIX_SIZE}`}
        role="img"
        aria-hidden={targetUrl ? undefined : true}
      >
        <rect width={QR_MATRIX_SIZE} height={QR_MATRIX_SIZE} className="consultoria-qr-bg" />
        {matrix.map((row, y) =>
          row.map((on, x) =>
            on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className="consultoria-qr-cell" /> : null,
          ),
        )}
      </svg>
      <figcaption className="fine consultoria-qr-caption">
        {targetUrl ? "Escanea con la cámara del móvil" : "Generando enlace…"}
      </figcaption>
    </figure>
  );
}
