import type { OptionKey, RadarAnswers } from "../../lib/radar/types";
import { emptyRadarAnswers, screensFor } from "../../lib/radar/engine";

const BASE: Partial<RadarAnswers> = {
  companyName: "Empresa de prueba",
  size: "micro",
  goals: ["costos"],
  consent: true,
  city: "Tunja",
  contactName: "Ana",
  contactLastName: "Pérez",
  email: "ana@ejemplo.co",
  phone: "3001234567",
  contactPhone: "3011234567",
};

/** Arma respuestas completas eligiendo A–E por pregunta visible. */
export function buildRadarAnswers(
  base: Partial<RadarAnswers>,
  choose: (questionId: string) => OptionKey | undefined,
): RadarAnswers {
  let answers: RadarAnswers = { ...emptyRadarAnswers(), ...BASE, ...base };
  for (let round = 0; round < 4; round += 1) {
    for (const screen of screensFor(answers)) {
      if (screen.kind !== "question") continue;
      const pick = choose(screen.question.id);
      if (pick) answers = { ...answers, choices: { ...answers.choices, [screen.question.id]: pick } };
    }
  }
  return answers;
}

export function answerAll(base: Partial<RadarAnswers>, pick: OptionKey): RadarAnswers {
  return buildRadarAnswers(base, () => pick);
}

export function answerMixed(base: Partial<RadarAnswers>): RadarAnswers {
  const keys: OptionKey[] = ["A", "B", "C", "D"];
  let index = 0;
  return buildRadarAnswers(base, () => keys[index++ % keys.length]);
}

/** Perfiles de la matriz pequeña (paso 10). */
export const MATRIX = {
  panaderiaRegistro: () =>
    answerAll({ companyName: "Panadería Carlitos", industry: "alimentos", activity: "alimentos-produccion" }, "A"),

  hotelOcupacion: () =>
    buildRadarAnswers(
      { companyName: "Hotel La Casona", industry: "turismo", activity: "turismo-hotel" },
      (id) => {
        if (id === "datos-registro") return "D";
        if (id === "turismo-1") return "A";
        return "D";
      },
    ),

  tiendaInventario: () =>
    buildRadarAnswers(
      { companyName: "Tienda El Punto", industry: "comercio", activity: "comercio-fisica" },
      (id) => {
        if (id === "datos-registro") return "D";
        if (id === "comercio-1" || id === "comercial-1") return "A";
        return "D";
      },
    ),

  ipsSolicitudes: () =>
    buildRadarAnswers({ companyName: "IPS Salud Total", industry: "salud", activity: "salud-ips" }, (id) => {
      if (id === "datos-registro") return "D";
      if (id === "salud-1" || id === "servicio-1") return "A";
      return "D";
    }),

  otraMixta: () => answerMixed({ industry: "otra", activity: "otra-mixto" }),

  problemaRespaldo: () =>
    buildRadarAnswers({ industry: "comercio", activity: "comercio-fisica" }, (id) => {
      if (id === "tec-proteccion" || id === "ia-reglas") return "A";
      if (id === "datos-registro" || id.startsWith("datos-")) return "D";
      return "C";
    }),

  hallazgoRaro: () =>
    buildRadarAnswers({ industry: "otra", activity: "otra-mixto" }, (id) => {
      if (id === "otra-1") return "A";
      if (id === "datos-registro") return "D";
      return "D";
    }),
};
