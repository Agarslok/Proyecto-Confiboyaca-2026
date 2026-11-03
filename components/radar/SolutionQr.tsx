"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { samplePageHref } from "@/lib/site/solution-presentation";

/** QR ISO a la misma URL que «Ver la página»: /s/RAD-… si ya hay código, si no /sitio. */
export function SolutionQr({ code }: { code?: string }) {
  const [src, setSrc] = useState("");
  const [url, setUrl] = useState("");
  const saved = Boolean(code?.trim());

  useEffect(() => {
    const next = `${window.location.origin}${samplePageHref(code)}`;
    setUrl(next);
    setSrc("");
    void QRCode.toDataURL(next, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: { dark: "#072724", light: "#ffffff" },
    }).then(setSrc);
  }, [code]);

  return (
    <figure className="radar-solution-qr">
      {src ? <img src={src} width={168} height={168} alt="" /> : <p className="fine">Generando código QR…</p>}
      <figcaption className="fine">
        {saved
          ? "Escanee para abrir la página guardada de esta empresa. No vuelve a generar la solución."
          : "Escanee para abrir la página generada en este navegador. El enlace permanente aparece cuando el diagnóstico queda guardado."}
        {url ? <span className="radar-solution-url">{url}</span> : null}
      </figcaption>
    </figure>
  );
}
