"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FluidBackground } from "@/components/externado/fluid-background";

const CHOICES = [
  {
    href: "/pitch",
    kicker: "Presentación",
    title: "Pitch",
    text: "Una presentación guiada sobre inteligencia artificial y su lugar en la empresa.",
  },
  {
    href: "/consultoria",
    kicker: "Demostración",
    title: "Stand",
    text: "Una experiencia práctica: la consultoría y el generador de página, con datos de ejemplo.",
  },
] as const;

export function ExperienceGate() {
  const router = useRouter();
  const [leaving, setLeaving] = useState<string | null>(null);

  function open(href: string) {
    if (leaving) return;
    setLeaving(href);
    window.setTimeout(() => router.push(href), 280);
  }

  return (
    <div className="gate-root">
      <FluidBackground />
      <div className="gate-copy">
        <p className="eyebrow">Universidad Externado de Colombia</p>
        <h1 className="display section-title">Elige una experiencia</h1>
        <p className="lead">El pitch recorre la idea. El stand deja probar la consultoría.</p>
      </div>
      <div className="gate-grid">
        {CHOICES.map((choice) => (
          <a
            key={choice.href}
            href={choice.href}
            className={leaving === choice.href ? "gate-card is-leaving" : "gate-card"}
            onClick={(event) => {
              event.preventDefault();
              open(choice.href);
            }}
          >
            <span className="gate-mark" aria-hidden="true" />
            <p className="micro accent">{choice.kicker}</p>
            <h2>{choice.title}</h2>
            <p>{choice.text}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
