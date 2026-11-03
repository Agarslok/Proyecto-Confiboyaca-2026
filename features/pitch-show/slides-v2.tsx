"use client";

/* Logo estático del pitch: no necesita optimización de next/image. */
/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react";
import { FAIR_STEPS } from "./deck";
import { Marquee, Qr, Slam } from "./fx";
import { SlideAntesDespues, SlideHoras, SlideMorir, SlideQueEs, SlideVideo, type ShowSlideProps } from "./slides";

const b = (step: number, beat: number, extra = "") => `ps-b${step >= beat ? " on" : ""}${extra ? ` ${extra}` : ""}`;

function Lockup({ className = "" }: { className?: string }) {
  return <img className={`ps-lockup ${className}`} src="/pitch/externado-dept-lockup-transparent.png" alt="Universidad Externado de Colombia · Departamento de Matemáticas" width={1024} height={275} />;
}

/* 1 · Título: corto, porque el gancho grande lo hace el video */
export function SlideTitulo({ step }: ShowSlideProps) {
  return (
    <div className="ps-wrap ps-title2">
      <Lockup />
      <p className="ps-kicker on">Feria empresarial</p>
      <h1 className="ps-h1"><Slam text="Cómo implementar la IA" on /></h1>
      <h1 className="ps-h1 ps-mint"><Slam text="sin morir en el intento" on delay={420} /></h1>
      <ol className={b(step, 1, "ps-agenda")}>
        <li><span>1</span>Qué es la IA, sin humo</li>
        <li><span>2</span>Por qué tantos fallan</li>
        <li><span>3</span>Cómo hacerlo, paso a paso</li>
      </ol>
    </div>
  );
}

/* 2 · Pregunta para pensar (sin que nadie tenga que responder): un resaltado
   recorre las tres opciones como si «escaneara» la sala; en el siguiente paso
   se encienden las tres y cada una muestra su siguiente paso, porque hay ruta
   para todas (también para quien ya usa IA). La barra de cada tarjeta es
   ilustrativa (cuánto usa hoy la IA esa empresa), no una cifra. */
const OPTIONS = [
  { key: "A", title: "Ya la usamos", text: "En algo del día a día", level: 85, next: "Sacarle más: modelos, tableros y automatización" },
  { key: "B", title: "Hemos oído, pero…", text: "No sabemos por dónde empezar", level: 38, next: "Un primer uso con tus propios datos" },
  { key: "C", title: "No sabemos bien qué es", text: "Y queremos entenderlo", level: 10, next: "Entenderla y ordenar tus datos" },
] as const;

export function SlideEncuesta({ step }: ShowSlideProps) {
  const settled = step >= 1;
  return (
    <div className="ps-wrap ps-poll">
      <p className="ps-kicker on">Una pregunta para pensar · no hace falta responder</p>
      <h2 className="ps-h2"><Slam text="¿En cuál está tu empresa?" on accent="tu empresa?" /></h2>
      <div className={`ps-poll-grid${settled ? " settled" : " scanning"}`}>
        {OPTIONS.map((option, i) => (
          <article key={option.key} className={`ps-poll-card${settled ? " pick" : ""}`} style={{ "--i": i } as CSSProperties}>
            <span className="ps-poll-key">{option.key}</span>
            <h3>{option.title}</h3>
            <p>{option.text}</p>
            <div className="ps-poll-bar" aria-hidden="true"><i style={{ height: `${option.level}%` }} /></div>
            <p className="ps-poll-scale">IA en el día a día</p>
            <p className="ps-poll-next"><span>Tu siguiente paso</span>{option.next}</p>
          </article>
        ))}
      </div>
      <p className={`ps-poll-think${settled ? " off" : ""}`} aria-hidden="true">Piénsalo<span>.</span><span>.</span><span>.</span></p>
      <div className={b(step, 1, "ps-poll-msg")}>
        <p>Muchas empresas ya han oído hablar de la IA. <strong>Pocas le sacan todo el provecho en su día a día.</strong></p>
        <p className="ps-mint">Estés donde estés, hay un siguiente paso para tu empresa.</p>
      </div>
    </div>
  );
}

/* 8 · Solo en la feria: pasos, rutas y la ventana de 12 horas */
const ROUTES = [
  { k: "Mentoría", title: "Visual Analytics Ejecutivo", text: "Tableros e historias con datos para decidir." },
  { k: "Mentoría", title: "IA con Copilot", text: "Correos, documentos y tareas con un asistente." },
  { k: "A la medida", title: "Curso para tu equipo", text: "Temas y horas según lo que necesite tu empresa." },
  { k: "Acompañamiento", title: "Por horas", text: "Arranque, Orden o Crecer: lo hacemos contigo." },
] as const;

export function SlideOferta({ step }: ShowSlideProps) {
  return (
    <div className="ps-wrap ps-offer2">
      <p className="ps-kicker on">Solo en la feria</p>
      <h2 className="ps-h2"><Slam text="Tu siguiente paso, hoy" on accent="hoy" /></h2>
      <ol className={b(step, 1, "ps-offer2-steps")}>
        {FAIR_STEPS.map((item, i) => (
          <li key={item.title}><span>0{i + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>
        ))}
      </ol>
      <div className="ps-offer2-body">
        <div className="ps-offer2-routes">
          {ROUTES.map((route, i) => (
            <article key={route.title} className={b(step, 2, "ps-offer2-route")} style={{ "--d": `${i * 120}ms` } as CSSProperties}>
              <p className="k">{route.k}</p>
              <h3>{route.title}</h3>
              <p>{route.text}</p>
            </article>
          ))}
        </div>
        <div className={b(step, 3, "ps-clock")}>
          <svg viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="96" className="track" /><circle cx="110" cy="110" r="96" className="arc" pathLength={100} /></svg>
          <p className="ps-clock-num">12 h</p>
          <p className="ps-fine">con condiciones de feria</p>
        </div>
      </div>
    </div>
  );
}

/* 9 · Te esperamos en el stand: qué pasa allá, en tres pasos, y el QR */
const STAND_STEPS = [
  { n: "1", title: "Escanea el QR", text: "o acércate al stand" },
  { n: "2", title: "Responde unos 6 minutos", text: "Preguntas según tu negocio" },
  { n: "3", title: "Llévate tu diagnóstico", text: "Y una página con tu solución" },
] as const;

export function SlideStand({ step }: ShowSlideProps) {
  return (
    <div className="ps-stand">
      <div className="ps-stand-tape" aria-hidden="true"><Marquee text="RADAR IA · STAND" outline seconds={40} /></div>
      <div className="ps-stand-main">
        <div className="ps-stand-text">
          <p className="ps-kicker on">Sigamos en el stand</p>
          <h1 className="ps-h1"><Slam text="Te esperamos en el stand" on accent="stand" /></h1>
          <ol className="ps-stand-steps">
            {STAND_STEPS.map((item, i) => (
              <li key={item.n} style={{ "--d": `${600 + i * 180}ms` } as CSSProperties}><span>{item.n}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>
            ))}
          </ol>
          <p className={b(step, 1, "ps-stand-tag")}>Cómo implementar la IA <strong>sin morir en el intento</strong></p>
        </div>
        <div className="ps-stand-qr">
          <Qr path="/diagnostico" caption={<strong>Escanea y empieza</strong>} />
          <Lockup className="ps-stand-lockup" />
        </div>
      </div>
    </div>
  );
}

export const SHOW_VIEWS_V2 = [SlideTitulo, SlideEncuesta, SlideQueEs, SlideMorir, SlideVideo, SlideAntesDespues, SlideHoras, SlideOferta, SlideStand] as const;
