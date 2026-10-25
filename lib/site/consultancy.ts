import type { SiteBrief } from "@/lib/site/engine";
import { formatCompanyName } from "@/lib/site/format-company-name";
import type { SectorId } from "@/types/site";
import { sectorLabels } from "@/lib/site/catalog";

export type SignalStatus = "attention" | "progress" | "ready";

export interface ConsultancySignal {
  status: SignalStatus;
  title: string;
  insight: string;
  remedy: string;
}

export interface ConsultancyReport {
  headline: string;
  intro: string;
  highlights: string[];
  signals: ConsultancySignal[];
  solutionPitch: string;
}

export function buildConsultancy(brief: SiteBrief): ConsultancyReport {
  const name = formatCompanyName(brief.companyName);
  const sectorId = brief.sectorId as SectorId;
  const sector = sectorLabels[sectorId];

  const signals: ConsultancySignal[] = [
    {
      status: "ready",
      title: "Base web lista",
      insight: `Tu sector (${sector}) ya tiene una página de referencia con tu nombre en la cabecera.`,
      remedy: "Revisa la página generada y compártela con tu equipo para comentarios.",
    },
  ];

  if (!brief.activity.trim()) {
    signals.push({
      status: "attention",
      title: "Actividad sin describir",
      insight: "Sin una frase sobre qué hace la empresa, el mensaje queda genérico.",
      remedy: "Completa la actividad en el formulario en una siguiente vuelta.",
    });
  } else {
    signals.push({
      status: "progress",
      title: "Actividad registrada",
      insight: "Hay contexto para afinar el discurso cuando conectemos contenido real.",
      remedy: "Por ahora el sitio usa textos de ejemplo del sector.",
    });
  }

  if (!brief.goal) {
    signals.push({
      status: "attention",
      title: "Objetivo no indicado",
      insight: "Sin objetivo declarado, no priorizamos llamadas a la acción concretas.",
      remedy: "Define un objetivo en el formulario cuando quieras iterar.",
    });
  } else {
    signals.push({
      status: "progress",
      title: "Objetivo anotado",
      insight: "Queda registrado para cuando el análisis use más datos del formulario.",
      remedy: "Hoy es informativo; la página no cambia por este dato.",
    });
  }

  if (!brief.audience) {
    signals.push({
      status: "progress",
      title: "Público por definir",
      insight: "Aún no se precisa si el mensaje va a personas, empresas o ambos.",
      remedy: "Indica audiencia en el formulario en una siguiente pasada.",
    });
  }

  signals.push({
    status: "attention",
    title: "Contenido de ejemplo",
    insight: "Imágenes, precios y testimonios son ilustrativos en esta versión.",
    remedy: "Sustituye por material real antes de publicar.",
  });

  return {
    headline: name,
    intro: `Resumen orientativo a partir de tus respuestas. La solución propuesta es la página web generada para ${name}.`,
    highlights: [
      `Nombre en el sitio: ${name}.`,
      "Puedes abrir la página y compartirla desde el enlace o el código QR.",
      "Este informe es local; la animación de carga es solo demostrativa.",
    ],
    signals,
    solutionPitch:
      "La consultora recomienda revisar la página web generada: ahí ves cómo quedaría tu presencia con el nombre de tu empresa.",
  };
}
