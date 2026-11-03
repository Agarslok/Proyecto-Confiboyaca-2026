"use client";

import { useEffect, useState } from "react";

/** Foto de sector: la horizontal en computador y la que termina en «v» en celular. */
export function SectorImg({
  desktop,
  mobile,
  alt,
  className,
  onError,
}: {
  desktop: string;
  mobile?: string;
  alt: string;
  className?: string;
  onError?: () => void;
}) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <img
      className={className}
      src={narrow && mobile ? mobile : desktop}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  );
}
