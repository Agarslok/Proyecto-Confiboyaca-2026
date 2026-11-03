"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import type { SiteConfig } from "@/types/site";
import { SectorImg } from "@/components/templates/SectorImg";
import { SolutionBlock } from "@/components/templates/SolutionBlock";
import styles from "./servicios.module.css";

/* ============================================================================
   SALUD — servicios de salud en general (consultorio, clínica, centro médico,
   laboratorio, odontología, bienestar…). Estructura inspirada en kindbody.com:
   cabecera con "Agendar", portada cálida con guía de necesidades, servicios y
   precios, cómo funciona, equipo, sedes y atención virtual, pagos y seguros,
   opiniones, preguntas frecuentes, cita en 2 pasos y pie.

   Mismo contrato que las otras plantillas:
   · <SaludTemplate config={config} />
   · config.companyName y config.templateCopy { nav, heroKicker, heroLead,
     aboutTitle, aboutBody, cards[], contactCta, footerNote }. Ancla
     #contacto-demo en el pie.
   · Cada card es un SERVICIO: tag = área, title = servicio,
     location = modalidad ("Presencial", "Virtual", "Presencial y virtual"),
     price = precio ("Desde $80.000").

   EL NOMBRE viene del formulario (config.companyName), sin botón de edición.

   Opcionales por servicio: description, duration.
   Opcionales en config: team[], locations[], faqs[], steps[], payments[],
   reviews[], stats[], slots[], email, phone, emergency, hours.

   Esto es una demostración: no guarda datos de pacientes ni agenda de verdad.
   No pide información clínica.
   ========================================================================== */

type Service = { tag?: string; title?: string; location?: string; price?: string; description?: string; duration?: string };
type Member = { name: string; role: string; bio: string };
type Place = { name: string; address: string; hours: string[]; virtual?: boolean };
type Faq = { q: string; a: string };
type Step = { title: string; text: string };
type Pay = { title: string; text: string };
type Review = { text: string; author: string; place?: string };
type Stat = { to: number; label: string; prefix?: string; suffix?: string };

type Extras = {
  team?: Member[];
  locations?: Place[];
  faqs?: Faq[];
  steps?: Step[];
  payments?: Pay[];
  reviews?: Review[];
  stats?: Stat[];
  slots?: string[];
  email?: string;
  phone?: string;
  emergency?: string;
  hours?: string;
};

const DEFAULT_STEPS: Step[] = [
  { title: "Cuéntanos qué necesitas", text: "Elige el servicio y la modalidad. Si no estás seguro, usa la guía de la portada." },
  { title: "Escoge día y hora", text: "Ves los horarios libres y reservas el que mejor te quede, sin llamadas." },
  { title: "Te confirmamos", text: "Recibes la confirmación y un recordatorio antes de tu cita." },
  { title: "Te atendemos", text: "Llegas, o te conectas desde tu casa, y te explicamos todo con calma." },
];

const DEFAULT_TEAM: Member[] = [
  { name: "Dra. Laura Martínez", role: "Medicina general", bio: "Atiende consultas de control, orientación y seguimiento. Le gusta explicar cada paso con palabras sencillas." },
  { name: "Dr. Andrés Rojas", role: "Medicina interna", bio: "Acompaña el seguimiento de adultos y la revisión de resultados de laboratorio y exámenes." },
  { name: "Dra. Camila Torres", role: "Psicología", bio: "Ofrece espacios de escucha y acompañamiento, en sede o por videollamada." },
  { name: "Dr. Felipe Vargas", role: "Pediatría", bio: "Cuida el crecimiento y el bienestar de niñas, niños y adolescentes, y orienta a sus familias." },
];

const DEFAULT_PLACES: Place[] = [
  { name: "Sede principal", address: "Calle 10 # 5-20, Centro, Boyacá", hours: ["Lunes a viernes · 7:00 – 18:00", "Sábados · 8:00 – 13:00"] },
  { name: "Atención virtual", address: "Desde tu casa, por videollamada", hours: ["Lunes a sábado · 7:00 – 19:00"], virtual: true },
];

const DEFAULT_FAQS: Faq[] = [
  { q: "¿Cómo agendo una cita?", a: "Elige el servicio, el día y la hora en la sección Agenda. Toma menos de dos minutos y no necesitas crear una cuenta." },
  { q: "¿Qué debo llevar a mi primera visita?", a: "Tu documento de identidad, el carné de tu EPS o plan si tienes, y los exámenes anteriores que quieras mostrarnos." },
  { q: "¿Puedo cambiar o cancelar mi cita?", a: "Sí. Avísanos con al menos un día de anticipación por teléfono o correo y la movemos sin costo." },
  { q: "¿Atienden por videollamada?", a: "Sí, varios servicios tienen modalidad virtual. Te enviamos el enlace por mensaje antes de la cita." },
  { q: "¿Qué hago si es una urgencia?", a: "Esta página no es para urgencias. Llama a la línea de emergencias o acude al servicio de urgencias más cercano." },
];

const DEFAULT_PAYMENTS: Pay[] = [
  { title: "Particular", text: "Pagas directamente la consulta o el examen. Los precios están publicados y no hay cobros ocultos." },
  { title: "Con tu EPS o seguro", text: "Trabajamos con varias aseguradoras y planes. Dinos cuál tienes y verificamos cobertura antes de tu visita." },
  { title: "Planes y paquetes", text: "Paquetes de varias sesiones o chequeos a un valor menor. Pregunta por convenios con empresas." },
];

const DEFAULT_REVIEWS: Review[] = [
  { text: "Me explicaron todo sin afán y me sentí escuchada. Conseguí cita el mismo día.", author: "Marcela R.", place: "Sede principal" },
  { text: "La consulta virtual fue ágil y clara. No tuve que viajar desde mi vereda.", author: "Jhon E.", place: "Virtual" },
  { text: "Llevé a mi hijo y el trato fue muy amable. Volveremos para los controles.", author: "Paula G.", place: "Sede principal" },
];

const DEFAULT_STATS: Stat[] = [
  { to: 12000, suffix: "+", label: "consultas al año" },
  { to: 15, label: "profesionales en el equipo" },
  { to: 98, suffix: "%", label: "de pacientes que volverían" },
];

const DEFAULT_SLOTS = ["8:00", "9:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

const prefersReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function targetFor(label: string, index: number, ids: string[]): string {
  const t = norm(label);
  const rules: [RegExp, string][] = [
    [/inicio|home/, "inicio"],
    [/servicio|especialidad|tratamiento|atencion/, "servicios"],
    [/proceso|como funciona|pasos/, "servicios"],
    [/equipo|medic|profesional|doctor|nosotros/, "equipo"],
    [/sede|ubicacion|clinica|consultorio|virtual/, "sedes"],
    [/pago|plan|precio|seguro|eps/, "pagos"],
    [/opinion|testimon|resena/, "opiniones"],
    [/pregunta|faq|ayuda/, "preguntas"],
    [/agend|cita|reserv/, "agenda"],
    [/contact/, "contacto-demo"],
  ];
  for (const [re, id] of rules) if (re.test(t) && ids.includes(id)) return id;
  return ids[Math.min(index + 1, ids.length - 1)];
}

/* Modalidades que ofrece un servicio, según su texto */
function modesOf(loc?: string): ("presencial" | "virtual")[] {
  const t = norm(loc ?? "");
  const v = /virtual|video|remot/.test(t);
  const p = /presencial|sede|consultorio|clinica/.test(t);
  if (v && !p) return ["virtual"];
  if (p && !v) return ["presencial"];
  return ["presencial", "virtual"];
}

/* ------------------------------ Iconos de línea ------------------------------ */

const I = {
  close: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="currentColor" strokeWidth="1.8" /></svg>),
  arrow: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" /></svg>),
  menu: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.5 6h15M2.5 14h15" stroke="currentColor" strokeWidth="1.8" /></svg>),
  plus: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" /></svg>),
  check: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.3 3.3L13 5" stroke="currentColor" strokeWidth="2" /></svg>),
  phone: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h3l1 3-1.8 1.2a8 8 0 0 0 3.6 3.6L10 8.5l3 1v3c0 .6-.5 1-1 1C6.5 13.5 2.5 9.5 2.5 3.5c0-.6.4-1 .5-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>),
};

type IconKind = "heart" | "tooth" | "eye" | "baby" | "mind" | "flask" | "cross" | "bone";
function iconFor(text: string): IconKind {
  const t = norm(text);
  if (/cardio|corazon|tension|presion/.test(t)) return "heart";
  if (/odont|dent|sonrisa|oral/.test(t)) return "tooth";
  if (/ojo|visual|oftal|optom|vista/.test(t)) return "eye";
  if (/pediat|nino|mujer|ginec|materno|embarazo|fertil|obstet/.test(t)) return "baby";
  if (/psico|mental|mente|terapia|emocional|psiqui/.test(t)) return "mind";
  if (/lab|examen|diagnost|imagen|sangre|muestra/.test(t)) return "flask";
  if (/fisio|ortoped|rehab|hueso|trauma|deporte/.test(t)) return "bone";
  return "cross";
}

function Glyph({ kind }: { kind: IconKind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let d: ReactNode;
  if (kind === "heart") d = <path d="M24 40S6 29 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 23-18 23Z" {...common} />;
  else if (kind === "tooth") d = <path d="M14 8c-5 0-8 4-7 10 1 6 3 8 4 14 .5 4 2 8 4 8s3-6 5-6 3 6 5 6 3.500-4 4-8c1-6 3-8 4-14 1-6-2-10-7-10-4 0-5 2-6 2s-2-2-6-2Z" {...common} />;
  else if (kind === "eye") d = (<><path d="M3 24s8-13 21-13 21 13 21 13-8 13-21 13S3 24 3 24Z" {...common} /><circle cx="24" cy="24" r="6" {...common} /></>);
  else if (kind === "baby") d = (<><circle cx="24" cy="20" r="12" {...common} /><path d="M19 22v.5M29 22v.5M20 28c2 2 6 2 8 0M24 8c0-3 3-4 5-3" {...common} /><path d="M12 40c2-4 6-6 12-6s10 2 12 6" {...common} /></>);
  else if (kind === "mind") d = (<><path d="M24 40V28M16 20a8 8 0 1 1 8 8M32 20a8 8 0 1 0-8 8" {...common} /><path d="M18 40h12" {...common} /></>);
  else if (kind === "flask") d = (<><path d="M18 6h12M20 6v14L8 40a3 3 0 0 0 3 4h26a3 3 0 0 0 3-4L28 20V6" {...common} /><path d="M14 32h20" {...common} /></>);
  else if (kind === "bone") d = <path d="M13 13a5 5 0 1 1 6 6l10 10a5 5 0 1 1 6 6 5 5 0 1 1-6-6L9 19a5 5 0 1 1 4-6Z" {...common} />;
  else d = <path d="M18 6h12v12h12v12H30v12H18V30H6V18h12Z" {...common} />;
  return (<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">{d}</svg>);
}

/* Formas orgánicas de la portada (se "respiran" con CSS) */
function HeroArt() {
  return (
    <svg className={styles.heroArt} viewBox="0 0 600 600" role="img" aria-label="Ilustración de formas suaves">
      <g className={styles.blobA}><path d="M300 40c110 0 230 80 250 200s-40 240-170 290S120 560 70 430 20 140 130 80c50-28 110-40 170-40Z" fill="var(--blush)" /></g>
      <g className={styles.blobB}><path d="M320 120c90 10 170 70 170 160s-60 180-160 200-190-40-210-130 20-190 100-220c32-12 66-13 100-10Z" fill="var(--sage)" /></g>
      <g className={styles.blobC}><circle cx="300" cy="300" r="120" fill="var(--sun)" /></g>
      <path d="M300 250v100M250 300h100" stroke="var(--plum)" strokeWidth="18" strokeLinecap="round" />
      <path d="M96 470c40-30 80-30 120 0M430 130c30-20 60-20 90 0" stroke="var(--coral)" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ---------------------------- Número que sube al verse ----------------------- */

function CountUp({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(prefersReducedMotion() ? stat.to : 0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") { setValue(stat.to); return; }
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const run = (now: number) => { const p = Math.min(1, (now - start) / 1600); setValue(stat.to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(run); };
      raf = requestAnimationFrame(run);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [stat.to]);
  return (<span ref={ref} className={styles.statNum} aria-label={`${stat.prefix ?? ""}${stat.to.toLocaleString("es-CO")}${stat.suffix ?? ""}`}><span aria-hidden="true">{stat.prefix}{Math.round(value).toLocaleString("es-CO")}{stat.suffix}</span></span>);
}

/* ------------------------- Ventana / panel accesible -------------------------- */

function Layer({ label, onClose, side, children }: { label: string; onClose: () => void; side?: boolean; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const box = boxRef.current;
    const focusables = () => Array.from(box?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((el) => !el.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); opener?.focus?.({ preventScroll: true }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={`${styles.overlay}${side ? ` ${styles.overlaySide}` : ""}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={boxRef} className={`${styles.dialog}${side ? ` ${styles.drawer}` : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">{I.close}</button>
        {children}
      </div>
    </div>
  );
}

/* ================================ Plantilla =================================== */

export function SaludTemplate({ config }: { config: SiteConfig }) {
  const copy = config.templateCopy;
  const extras = config as SiteConfig & Extras;
  const sectorShots = config.sectorPhotos?.shots ?? [];
  const rootRef = useRef<HTMLDivElement>(null);

  /* El nombre sale del formulario */
  const companyName = (config.companyName ?? "").replace(/\s+/g, " ").trim() || "Tu centro de salud";

  const services = useMemo(() => (copy?.cards ?? []) as unknown as Service[], [copy?.cards]);
  const navItems = useMemo(() => (copy?.nav ?? []) as string[], [copy?.nav]);
  const team = extras.team?.length ? extras.team : DEFAULT_TEAM;
  const usingDemoTeam = !extras.team?.length;
  const places = extras.locations?.length ? extras.locations : DEFAULT_PLACES;
  const faqs = extras.faqs?.length ? extras.faqs : DEFAULT_FAQS;
  const pays = extras.payments?.length ? extras.payments : DEFAULT_PAYMENTS;
  const reviews = extras.reviews?.length ? extras.reviews : DEFAULT_REVIEWS;
  const usingDemoReviews = !extras.reviews?.length;
  const stats = extras.stats?.length ? extras.stats : DEFAULT_STATS;
  const usingDemoStats = !extras.stats?.length;
  const slots = extras.slots?.length ? extras.slots : DEFAULT_SLOTS;
  const email = extras.email ?? "citas@ejemplo.co";
  const phone = extras.phone ?? "+57 300 000 0000";
  const emergency = extras.emergency ?? "123";
  const areas = useMemo(() => Array.from(new Set(services.map((s) => s.tag).filter(Boolean))) as string[], [services]);

  const ids = useMemo(() => ["inicio", "servicios", "equipo", "sedes", "pagos", "opiniones", "preguntas", "agenda", "contacto-demo"], []);
  const target = useCallback((label: string, i: number) => targetFor(label, i, ids), [ids]);

  /* ------------------------------ Interfaz ----------------------------------- */
  const [menu, setMenu] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => { setStuck(window.scrollY > 40); setShowTop(window.scrollY > 900); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(t); }, [toast]);

  const goTo = useCallback((id: string) => {
    setMenu(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }), 30);
  }, []);

  useEffect(() => {
    const host = rootRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(host.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add(styles.revealOn); io.unobserve(en.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [services.length, team.length, reviews.length]);

  const reveal = (n = 0, extra = "") => ({ className: extra ? `${styles.reveal} ${extra}` : styles.reveal, "data-reveal": true as const, style: n ? ({ "--d": `${n * 80}ms` } as CSSProperties) : undefined });

  /* --------------------------- Guía de necesidades --------------------------- */
  const [need, setNeed] = useState<string | null>(null);
  const rec = need ? services.findIndex((s) => s.tag === need) : -1;

  /* ------------------------------- Servicios --------------------------------- */
  const [area, setArea] = useState("Todo");
  const [modeF, setModeF] = useState<"todas" | "presencial" | "virtual">("todas");
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { setArea("Todo"); }, [areas.join("|")]);
  const visible = services.map((s, i) => ({ s, i })).filter(({ s }) => (area === "Todo" || s.tag === area) && (modeF === "todas" || modesOf(s.location).includes(modeF)));

  /* ---------------------------------- Equipo --------------------------------- */
  const [member, setMember] = useState<number | null>(null);

  /* ------------------------------- Sedes / pagos ------------------------------ */
  const [place, setPlace] = useState(0);
  const [pay, setPay] = useState(0);
  const [faq, setFaq] = useState<number | null>(0);

  /* --------------------------------- Agenda ---------------------------------- */
  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (out.length < 7) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) out.push(new Date(d)); }
    return out;
  }, []);
  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  /* Horarios "ocupados" de ejemplo, estables por día y hora */
  const taken = (d: Date, t: string) => { let h = 0; for (const c of `${dayKey(d)}${t}`) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 4 === 0; };

  const [b, setB] = useState({ service: 0, mode: "presencial" as "presencial" | "virtual", day: 0, time: "", who: "", phone: "", email: "", reason: "", consent: false });
  const [bStep, setBStep] = useState(1);
  const [bErr, setBErr] = useState<Record<string, string>>({});
  const [booked, setBooked] = useState(false);
  const svc = services[b.service];
  const svcModes = modesOf(svc?.location);
  const setF = <K extends keyof typeof b>(k: K, v: (typeof b)[K]) => { setB((s) => ({ ...s, [k]: v })); if (bErr[k as string]) setBErr((e) => ({ ...e, [k as string]: "" })); };
  useEffect(() => { if (!svcModes.includes(b.mode)) setB((s) => ({ ...s, mode: svcModes[0] })); }, [b.service, svcModes.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const startBooking = (i: number) => { setB((s) => ({ ...s, service: i, time: "" })); setBStep(1); setBooked(false); setOpen(null); goTo("agenda"); };
  const dateLabel = (d: Date) => d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

  const nextStep = () => {
    const errs: Record<string, string> = {};
    if (bStep === 1 && !b.time) errs.time = "Elige una hora para continuar.";
    setBErr(errs);
    if (!Object.keys(errs).length) setBStep(2);
  };

  const submitBooking = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (b.who.trim().length < 2) errs.who = "Escribe tu nombre.";
    if (!/^[+\d][\d\s()-]{6,}$/.test(b.phone.trim())) errs.phone = "Escribe un teléfono válido.";
    if (b.email.trim() && !/^\S+@\S+\.\S+$/.test(b.email.trim())) errs.email = "Revisa el correo.";
    if (!b.consent) errs.consent = "Necesitamos tu autorización para contactarte.";
    setBErr(errs);
    const first = Object.keys(errs)[0];
    if (first) { window.setTimeout(() => document.getElementById(`sal-b-${first}`)?.focus(), 0); return; }
    setBooked(true);
    setToast("Cita de demostración reservada");
  };

  const downloadIcs = () => {
    const d = days[b.day];
    const [hh, mm] = (b.time || "9:00").split(":").map(Number);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm || 0);
    const end = new Date(start.getTime() + 30 * 60000);
    const f = (x: Date) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
    const esc = (s: string) => s.replace(/[,;\\]/g, " ").replace(/\n/g, " ");
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Plantilla Salud//ES", "BEGIN:VEVENT", `UID:${Date.now()}@plantilla-salud`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:${esc(`${svc?.title ?? "Cita"} · ${companyName}`)}`, `DESCRIPTION:${esc(`Cita de demostración (${b.mode}).`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cita.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const year = new Date().getFullYear();
  const len = companyName.length;
  const titleStyle = { "--k": len <= 14 ? 9 : len <= 24 ? 6.4 : len <= 36 ? 4.8 : 3.8 } as CSSProperties;
  const openSvc = open !== null ? services[open] : null;

  return (
    <div className={styles.root} ref={rootRef}>
      <a className={styles.skip} href="#servicios" onClick={(e) => { e.preventDefault(); goTo("servicios"); }}>Saltar al contenido</a>

      {/* Cabecera */}
      <header className={`${styles.header}${stuck ? ` ${styles.headerStuck}` : ""}${!stuck ? ` ${styles.headerOnHero}` : ""}`}>
        <div className={styles.headIn}>
          <button type="button" className={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })} title={companyName} aria-label={`${companyName}. Ir al inicio`}>
            <span className={styles.logoMark} aria-hidden="true">{I.plus}</span>
            <span className={styles.logoText}>{companyName}</span>
          </button>
          <nav className={styles.nav} aria-label="Secciones">
            {navItems.map((item, i) => (<button key={`${item}-${i}`} type="button" className={styles.navLink} onClick={() => goTo(target(item, i))}>{item}</button>))}
          </nav>
          <div className={styles.headBtns}>
            <a className={styles.phoneLink} href={`tel:${phone.replace(/\s/g, "")}`}>{I.phone}<span>{phone}</span></a>
            <button type="button" className={`${styles.btn} ${styles.btnCoral} ${styles.btnSm}`} onClick={() => goTo("agenda")}>{copy.contactCta}</button>
            <button type="button" className={styles.burger} onClick={() => setMenu(true)} aria-label="Abrir menú" aria-haspopup="dialog">{I.menu}</button>
          </div>
        </div>
      </header>

      {menu ? (
        <Layer label="Menú" onClose={() => setMenu(false)} side>
          <div className={styles.menuBody}>
            <p className={styles.menuTitle}>{companyName}</p>
            <ul>{navItems.map((item, i) => (<li key={`${item}-${i}`}><button type="button" className={styles.menuLink} onClick={() => goTo(target(item, i))}>{item}{I.arrow}</button></li>))}</ul>
            <button type="button" className={`${styles.btn} ${styles.btnCoral}`} onClick={() => goTo("agenda")}>{copy.contactCta}</button>
            <a className={styles.phoneLink} href={`tel:${phone.replace(/\s/g, "")}`}>{I.phone}<span>{phone}</span></a>
          </div>
        </Layer>
      ) : null}

      {/* Portada */}
      <section className={styles.hero} id="inicio">
        <div className={styles.heroMedia} aria-hidden="true">
          {config.sectorPhotos?.hero ? (
            <SectorImg desktop={config.sectorPhotos.hero.desktop} mobile={config.sectorPhotos.hero.mobile} alt="" className={styles.heroPhotoFull} />
          ) : (
            <HeroArt />
          )}
          <div className={styles.heroShade} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>{copy.heroKicker}</p>
          <h1 className={styles.title} style={titleStyle}>{companyName}</h1>
          <p className={styles.lead}>{copy.heroLead}</p>
          <div className={styles.heroBtns}>
            <button type="button" className={`${styles.btn} ${styles.btnCoral}`} onClick={() => goTo("agenda")}>{copy.contactCta} {I.arrow}</button>
            <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => goTo("servicios")}>Ver servicios</button>
          </div>

          {areas.length ? (
            <div className={styles.finder}>
              <p className={styles.finderTitle} id="sal-finder">¿En qué te podemos ayudar hoy?</p>
              <div className={styles.finderChips} role="group" aria-labelledby="sal-finder">
                {areas.map((a) => (<button key={a} type="button" className={`${styles.pill}${need === a ? ` ${styles.pillOn}` : ""}`} aria-pressed={need === a} onClick={() => setNeed(need === a ? null : a)}>{a}</button>))}
              </div>
              {rec >= 0 ? (
                <div className={styles.finderRes} role="status">
                  <span className={styles.finderIcon}><Glyph kind={iconFor(`${services[rec].tag} ${services[rec].title}`)} /></span>
                  <span className={styles.finderInfo}>
                    <span className={styles.finderLabel}>Te sugerimos</span>
                    <strong>{services[rec].title}</strong>
                    <span className={styles.small}>{services[rec].location} · {services[rec].price}</span>
                  </span>
                  <button type="button" className={`${styles.btn} ${styles.btnDark} ${styles.btnSm}`} onClick={() => startBooking(rec)}>Agendar</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className={styles.urgent}>¿Es una urgencia? Esta página no es para emergencias. Llama al <strong>{emergency}</strong> o ve al servicio de urgencias más cercano.</p>
      </section>

      <SolutionBlock solution={config.solution} tone="servicios" site={config} />

      {/* Pilares (como las 3 tarjetas de Kindbody) */}
      <section className={styles.pillars} aria-label="Por qué elegirnos">
        <ul className={styles.pillarRow}>
          {[
            { t: "Nuestros servicios", x: "Precios claros desde el primer día.", to: "servicios" },
            { t: "Cómo pagar", x: "Particular, EPS, seguros y paquetes.", to: "pagos" },
            { t: "Atención virtual", x: "Consulta desde tu casa, sin viajar.", to: "sedes" },
          ].map((p, n) => (
            <li key={p.t} {...reveal(n)}>
              <button type="button" className={styles.pillar} onClick={() => goTo(p.to)}>
                <span className={styles.pillarT}>{p.t}</span>
                <span className={styles.pillarX}>{p.x}</span>
                <span className={styles.pillarGo}>{I.arrow}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Servicios */}
      <section className={styles.section} id="servicios">
        <div className={styles.wrap}>
          <div {...reveal(0, styles.head)}>
            <div>
              <p className={styles.kicker}>Servicios y precios</p>
              <h2 className={styles.h2}>{copy.aboutTitle}</h2>
            </div>
            <p className={styles.headText}>{copy.aboutBody}</p>
          </div>

          {sectorShots.length >= 2 ? (
            <ul className={styles.svcPhotos} aria-hidden="true">
              {sectorShots.slice(0, 3).map((shot, i) => (
                <li key={shot.desktop}>
                  <SectorImg desktop={shot.desktop} mobile={shot.mobile} alt="" className={styles.svcPhoto} />
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.filters}>
            {areas.length > 1 ? (
              <div className={styles.pills} role="group" aria-label="Filtrar por área">
                {["Todo", ...areas].map((a) => (<button key={a} type="button" className={`${styles.pill}${area === a ? ` ${styles.pillOn}` : ""}`} aria-pressed={area === a} onClick={() => setArea(a)}>{a}</button>))}
              </div>
            ) : <span />}
            <div className={styles.seg} role="group" aria-label="Modalidad">
              {([["todas", "Todas"], ["presencial", "Presencial"], ["virtual", "Virtual"]] as const).map(([v, t]) => (
                <button key={v} type="button" className={`${styles.segBtn}${modeF === v ? ` ${styles.segOn}` : ""}`} aria-pressed={modeF === v} onClick={() => setModeF(v)}>{t}</button>
              ))}
            </div>
          </div>

          {visible.length ? (
            <ul className={styles.svcGrid}>
              {visible.map(({ s, i }, n) => (
                <li key={i} className={styles.reveal} data-reveal style={{ "--d": `${(n % 3) * 70}ms` } as CSSProperties}>
                  <article className={styles.svc} style={{ "--tone": `var(--tone${i % 4})` } as CSSProperties}>
                    <span className={styles.svcIcon}><Glyph kind={iconFor(`${s.tag} ${s.title}`)} /></span>
                    <span className={styles.svcTag}>{s.tag}</span>
                    <h3 className={styles.svcName}>{s.title}</h3>
                    <p className={styles.svcMode}>{s.location}</p>
                    <p className={styles.svcPrice}>{s.price}</p>
                    <div className={styles.svcBtns}>
                      <button type="button" className={`${styles.btn} ${styles.btnDark} ${styles.btnSm}`} onClick={() => startBooking(i)}>Agendar</button>
                      <button type="button" className={styles.linkBtn} onClick={() => setOpen(i)} aria-haspopup="dialog">Ver más</button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}><p>No hay servicios con esa combinación.</p><button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => { setArea("Todo"); setModeF("todas"); }}>Ver todos</button></div>
          )}
        </div>
      </section>

      {/* Cifras */}
      <section className={styles.statsBand} aria-label="Cifras">
        <div className={styles.wrap}>
          <ul className={styles.stats}>
            {stats.map((s) => (<li key={s.label} className={styles.stat}><CountUp stat={s} /><span className={styles.statLabel}>{s.label}</span></li>))}
          </ul>
          {usingDemoStats ? <p className={styles.sample}>Cifras de ejemplo. Reemplázalas con las de tu centro.</p> : null}
        </div>
      </section>

      {/* Cifras */}
      <section className={`${styles.section} ${styles.alt}`} id="equipo">
        <div className={styles.wrap}>
          <div {...reveal(0, styles.head)}>
            <div><p className={styles.kicker}>Nuestro equipo</p><h2 className={styles.h2}>Personas que te escuchan</h2></div>
          </div>
          <ul className={styles.teamGrid}>
            {team.map((m, i) => (
              <li key={m.name} className={styles.reveal} data-reveal style={{ "--d": `${(i % 4) * 70}ms` } as CSSProperties}>
                <button type="button" className={styles.person} onClick={() => setMember(i)} aria-haspopup="dialog">
                  <span className={styles.avatar} style={{ "--tone": `var(--tone${i % 4})` } as CSSProperties} aria-hidden="true">{m.name.replace(/^(Dra?\.)\s*/, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                  <span className={styles.personName}>{m.name}</span>
                  <span className={styles.personRole}>{m.role}</span>
                  <span className={styles.personMore}>Ver perfil {I.arrow}</span>
                </button>
              </li>
            ))}
          </ul>
          {usingDemoTeam ? <p className={styles.sample}>Perfiles de ejemplo. Reemplázalos con tu equipo real.</p> : null}
        </div>
      </section>

      {/* Sedes */}
      <section className={styles.section} id="sedes">
        <div className={styles.wrap}>
          <div {...reveal(0, styles.head)}>
            <div><p className={styles.kicker}>Dónde atendemos</p><h2 className={styles.h2}>En sede o desde casa</h2></div>
          </div>
          <div className={styles.placeGrid}>
            <div className={styles.placeTabs} role="tablist" aria-label="Sedes">
              {places.map((p, i) => (
                <button key={p.name} type="button" role="tab" aria-selected={place === i} className={`${styles.placeTab}${place === i ? ` ${styles.placeOn}` : ""}`} onClick={() => setPlace(i)}>
                  <span>{p.name}</span><span className={styles.tabTag}>{p.virtual ? "Virtual" : "Presencial"}</span>
                </button>
              ))}
            </div>
            <div className={styles.placeCard} role="tabpanel" key={place}>
              <h3 className={styles.h3}>{places[place].name}</h3>
              <p className={styles.body}>{places[place].address}</p>
              <ul className={styles.hours}>{places[place].hours.map((h) => (<li key={h}>{h}</li>))}</ul>
              <button type="button" className={`${styles.btn} ${styles.btnDark}`} onClick={() => { setB((s) => ({ ...s, mode: places[place].virtual ? "virtual" : "presencial" })); goTo("agenda"); }}>Agendar aquí {I.arrow}</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pagos */}
      <section className={`${styles.section} ${styles.alt}`} id="pagos">
        <div className={styles.wrap}>
          <div {...reveal(0, styles.head)}>
            <div><p className={styles.kicker}>Pagos y seguros</p><h2 className={styles.h2}>Cuidarte no debería ser complicado</h2></div>
          </div>
          <div className={styles.payGrid}>
            <div className={styles.payTabs} role="tablist" aria-label="Formas de pago">
              {pays.map((p, i) => (<button key={p.title} type="button" role="tab" aria-selected={pay === i} className={`${styles.payTab}${pay === i ? ` ${styles.payOn}` : ""}`} onClick={() => setPay(i)}>{p.title}</button>))}
            </div>
            <div className={styles.payCard} role="tabpanel" key={pay}>
              <h3 className={styles.h3}>{pays[pay].title}</h3>
              <p className={styles.body}>{pays[pay].text}</p>
              <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => goTo("agenda")}>Agendar y consultar cobertura</button>
            </div>
          </div>
        </div>
      </section>

      {/* Opiniones */}
      <section className={styles.section} id="opiniones">
        <div className={styles.wrap}>
          <div {...reveal(0, styles.head)}>
            <div><p className={styles.kicker}>Opiniones</p><h2 className={styles.h2}>Lo que dicen quienes nos visitan</h2></div>
          </div>
          <ul className={styles.revGrid}>
            {reviews.map((r, i) => (
              <li key={`${r.author}-${i}`} className={`${styles.rev} ${styles.reveal}`} data-reveal style={{ "--d": `${(i % 3) * 70}ms`, "--tone": `var(--tone${i % 4})` } as CSSProperties}>
                <span className={styles.quote} aria-hidden="true">“</span>
                <p className={styles.revText}>{r.text}</p>
                <p className={styles.revBy}><strong>{r.author}</strong>{r.place ? ` · ${r.place}` : ""}</p>
              </li>
            ))}
          </ul>
          {usingDemoReviews ? <p className={styles.sample}>Opiniones de ejemplo. Usa solo reseñas reales y con permiso de quien las escribió.</p> : null}
        </div>
      </section>

      {/* Preguntas */}
      <section className={`${styles.section} ${styles.alt}`} id="preguntas">
        <div className={styles.wrap}>
          <div className={styles.faqGrid}>
            <div {...reveal()}><p className={styles.kicker}>Preguntas frecuentes</p><h2 className={styles.h2}>¿Tienes dudas?</h2><p className={styles.body} style={{ marginTop: 16 }}>Si no encuentras tu respuesta, escríbenos a <a className={styles.inlineLink} href={`mailto:${email}`}>{email}</a>.</p></div>
            <ul className={styles.faqList}>
              {faqs.map((f, i) => (
                <li key={f.q} className={styles.faqItem}>
                  <h3 className={styles.faqH}>
                    <button type="button" id={`sal-faq-b-${i}`} className={styles.faqBtn} aria-expanded={faq === i} aria-controls={`sal-faq-${i}`} onClick={() => setFaq(faq === i ? null : i)}>
                      <span>{f.q}</span><span className={`${styles.faqIcon}${faq === i ? ` ${styles.faqIconOn}` : ""}`}>{I.plus}</span>
                    </button>
                  </h3>
                  <div id={`sal-faq-${i}`} role="region" aria-labelledby={`sal-faq-b-${i}`} className={`${styles.faqBody}${faq === i ? ` ${styles.faqBodyOn}` : ""}`}>
                    <div><p>{f.a}</p></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className={`${styles.section} ${styles.agenda}`} id="agenda">
        <div className={styles.wrap}>
          <div className={styles.agendaGrid}>
            <div {...reveal()}>
              <p className={`${styles.kicker} ${styles.kickerLight}`}>Agenda tu cita</p>
              <h2 className={`${styles.h2} ${styles.h2Light}`}>Hablemos. Estamos para ti en {companyName}.</h2>
              <p className={`${styles.body} ${styles.bodyLight}`}>Reserva en dos pasos. Es una demostración: no se guarda ni se envía nada, y no te pedimos datos de salud.</p>
              <p className={`${styles.small} ${styles.bodyLight}`}>¿Prefieres llamar? <a className={styles.inlineLinkLight} href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></p>
            </div>

            <div {...reveal(1, styles.book)}>
              {booked ? (
                <div className={styles.done} role="status">
                  <span className={styles.doneIcon}>{I.check}</span>
                  <h3 className={styles.doneBig}>¡Listo, {b.who.trim().split(" ")[0]}!</h3>
                  <dl className={styles.summary}>
                    <div className={styles.sumRow}><dt>Servicio</dt><dd>{svc?.title}</dd></div>
                    <div className={styles.sumRow}><dt>Modalidad</dt><dd>{b.mode === "virtual" ? "Virtual" : "Presencial"}</dd></div>
                    <div className={styles.sumRow}><dt>Día</dt><dd>{dateLabel(days[b.day])}</dd></div>
                    <div className={styles.sumRow}><dt>Hora</dt><dd>{b.time}</dd></div>
                  </dl>
                  <p className={styles.small}>Te contactaríamos al {b.phone.trim()} para confirmar. Esto es solo una demostración.</p>
                  <div className={styles.bookBtns}>
                    <button type="button" className={`${styles.btn} ${styles.btnDark}`} onClick={downloadIcs}>Agregar a mi calendario</button>
                    <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => { setBooked(false); setBStep(1); setB((s) => ({ ...s, time: "", consent: false })); }}>Nueva cita</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitBooking} noValidate>
                  <ol className={styles.stepper} aria-label="Pasos">
                    {["Servicio y hora", "Tus datos"].map((t, i) => (<li key={t} className={`${styles.stepDot}${bStep >= i + 1 ? ` ${styles.stepOn}` : ""}`} aria-current={bStep === i + 1 ? "step" : undefined}><span>{i + 1}</span>{t}</li>))}
                  </ol>

                  {bStep === 1 ? (
                    <div className={styles.fields}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="sal-b-service">Servicio</label>
                        <select id="sal-b-service" className={styles.input} value={b.service} onChange={(e) => { setF("service", Number(e.target.value)); setF("time", ""); }}>
                          {services.map((s, i) => (<option key={i} value={i}>{s.title} · {s.price}</option>))}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.label} id="sal-mode-l">Modalidad</span>
                        <div className={styles.seg} role="group" aria-labelledby="sal-mode-l">
                          {svcModes.map((m) => (<button key={m} type="button" className={`${styles.segBtn}${b.mode === m ? ` ${styles.segOn}` : ""}`} aria-pressed={b.mode === m} onClick={() => setF("mode", m)}>{m === "virtual" ? "Virtual" : "Presencial"}</button>))}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.label} id="sal-day-l">Día</span>
                        <div className={styles.days} role="group" aria-labelledby="sal-day-l">
                          {days.map((d, i) => (
                            <button key={dayKey(d)} type="button" className={`${styles.day}${b.day === i ? ` ${styles.dayOn}` : ""}`} aria-pressed={b.day === i} onClick={() => { setF("day", i); setF("time", ""); }}>
                              <span>{d.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "")}</span><strong>{d.getDate()}</strong>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.label} id="sal-time-l">Hora</span>
                        <div className={styles.slots} role="group" aria-labelledby="sal-time-l">
                          {slots.map((t) => {
                            const off = taken(days[b.day], t);
                            return (<button key={t} type="button" disabled={off} className={`${styles.slot}${b.time === t ? ` ${styles.slotOn}` : ""}`} aria-pressed={b.time === t} onClick={() => setF("time", t)}>{t}</button>);
                          })}
                        </div>
                        {bErr.time ? <p className={styles.error} role="alert" id="sal-b-time" tabIndex={-1}>{bErr.time}</p> : <p className={styles.help}>Los horarios grisáceos ya están ocupados (ejemplo).</p>}
                      </div>
                      <button type="button" className={`${styles.btn} ${styles.btnCoral} ${styles.btnFull}`} onClick={nextStep}>Continuar {I.arrow}</button>
                    </div>
                  ) : (
                    <div className={styles.fields}>
                      <p className={styles.recap}><strong>{svc?.title}</strong> · {b.mode === "virtual" ? "Virtual" : "Presencial"} · {dateLabel(days[b.day])}, {b.time}<button type="button" className={styles.linkBtn} onClick={() => setBStep(1)}>Cambiar</button></p>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="sal-b-who">Nombre completo</label>
                        <input id="sal-b-who" className={`${styles.input}${bErr.who ? ` ${styles.inputBad}` : ""}`} value={b.who} onChange={(e) => setF("who", e.target.value)} autoComplete="name" aria-invalid={bErr.who ? true : undefined} />
                        {bErr.who ? <p className={styles.error} role="alert">{bErr.who}</p> : null}
                      </div>
                      <div className={styles.row2}>
                        <div className={styles.field}>
                          <label className={styles.label} htmlFor="sal-b-phone">Teléfono / WhatsApp</label>
                          <input id="sal-b-phone" type="tel" className={`${styles.input}${bErr.phone ? ` ${styles.inputBad}` : ""}`} value={b.phone} onChange={(e) => setF("phone", e.target.value)} autoComplete="tel" aria-invalid={bErr.phone ? true : undefined} />
                          {bErr.phone ? <p className={styles.error} role="alert">{bErr.phone}</p> : null}
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label} htmlFor="sal-b-email">Correo (opcional)</label>
                          <input id="sal-b-email" type="email" className={`${styles.input}${bErr.email ? ` ${styles.inputBad}` : ""}`} value={b.email} onChange={(e) => setF("email", e.target.value)} autoComplete="email" aria-invalid={bErr.email ? true : undefined} />
                          {bErr.email ? <p className={styles.error} role="alert">{bErr.email}</p> : null}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="sal-b-reason">Algo que quieras contarnos (opcional)</label>
                        <textarea id="sal-b-reason" rows={2} maxLength={200} className={styles.input} value={b.reason} onChange={(e) => setF("reason", e.target.value)} placeholder="Ej.: prefiero horario de la mañana" />
                        <p className={styles.help}>Por tu privacidad, no escribas aquí información clínica.</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.check}>
                          <input id="sal-b-consent" type="checkbox" checked={b.consent} onChange={(e) => setF("consent", e.target.checked)} aria-invalid={bErr.consent ? true : undefined} />
                          <span>Autorizo que {companyName} me contacte para confirmar mi cita (demostración).</span>
                        </label>
                        {bErr.consent ? <p className={styles.error} role="alert">{bErr.consent}</p> : null}
                      </div>
                      <div className={styles.bookBtns}>
                        <button type="submit" className={`${styles.btn} ${styles.btnCoral}`}>Reservar cita</button>
                        <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => setBStep(1)}>Volver</button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pie */}
      <footer className={styles.footer} id="contacto-demo">
        <div className={styles.wrap}>
          <div className={styles.footGrid}>
            <div>
              <p className={styles.footName}>{companyName}</p>
              <p className={styles.footText}>{copy.footerNote}</p>
            </div>
            <div>
              <p className={styles.footHead}>Explorar</p>
              <ul className={styles.footList}>{navItems.map((item, i) => (<li key={`${item}-${i}`}><button type="button" className={styles.footLink} onClick={() => goTo(target(item, i))}>{item}</button></li>))}</ul>
            </div>
            <div>
              <p className={styles.footHead}>Contacto</p>
              <ul className={styles.footList}>
                <li className={styles.footText}>{phone}</li>
                <li><a className={styles.footLink} href={`mailto:${email}`}>{email}</a></li>
                <li className={styles.footText}>{extras.hours ?? places[0]?.hours[0]}</li>
              </ul>
            </div>
          </div>
          <p className={styles.legal}>La información de este sitio es orientativa y no reemplaza la consulta con un profesional de la salud. En caso de emergencia llama al {emergency}.</p>
          <div className={styles.footBase}><span>© {year} {companyName}</span><span>Sitio de demostración</span></div>
        </div>
      </footer>

      <button type="button" className={`${styles.stickyBook}`} onClick={() => goTo("agenda")}>{copy.contactCta} {I.arrow}</button>
      <button type="button" className={`${styles.backTop}${showTop ? ` ${styles.backTopOn}` : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })} aria-label="Volver arriba" tabIndex={showTop ? 0 : -1}>↑</button>

      {openSvc && open !== null ? (
        <Layer label={openSvc.title ?? "Servicio"} onClose={() => setOpen(null)}>
          <div className={styles.dlgBody}>
            <span className={styles.svcIcon} style={{ "--tone": `var(--tone${open % 4})` } as CSSProperties}><Glyph kind={iconFor(`${openSvc.tag} ${openSvc.title}`)} /></span>
            <p className={styles.kicker}>{openSvc.tag}</p>
            <h3 className={styles.dlgTitle}>{openSvc.title}</h3>
            <p className={styles.body}>{openSvc.description ?? `Servicio de ${companyName}. Te explicamos en qué consiste, cuánto dura y qué necesitas antes de tu visita.`}</p>
            <dl className={styles.summary}>
              <div className={styles.sumRow}><dt>Modalidad</dt><dd>{openSvc.location}</dd></div>
              <div className={styles.sumRow}><dt>Precio</dt><dd>{openSvc.price}</dd></div>
              {openSvc.duration ? <div className={styles.sumRow}><dt>Duración</dt><dd>{openSvc.duration}</dd></div> : null}
            </dl>
            <div className={styles.bookBtns}>
              <button type="button" className={`${styles.btn} ${styles.btnCoral}`} onClick={() => startBooking(open)}>Agendar este servicio</button>
              <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => setOpen(null)}>Cerrar</button>
            </div>
          </div>
        </Layer>
      ) : null}

      {member !== null ? (
        <Layer label={team[member].name} onClose={() => setMember(null)}>
          <div className={styles.dlgBody}>
            <span className={styles.avatar} style={{ "--tone": `var(--tone${member % 4})` } as CSSProperties} aria-hidden="true">{team[member].name.replace(/^(Dra?\.)\s*/, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <p className={styles.kicker}>{team[member].role}</p>
            <h3 className={styles.dlgTitle}>{team[member].name}</h3>
            <p className={styles.body}>{team[member].bio}</p>
            <div className={styles.bookBtns}>
              <button type="button" className={`${styles.btn} ${styles.btnCoral}`} onClick={() => { setMember(null); goTo("agenda"); }}>{copy.contactCta}</button>
              <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => setMember(null)}>Cerrar</button>
            </div>
          </div>
        </Layer>
      ) : null}

      <div aria-live="polite">{toast ? <div className={styles.toast} key={toast}>{I.check} {toast}</div> : null}</div>
    </div>
  );
}

/** Sector «Servicios» del formulario — misma plantilla que SaludTemplate. */
export function ServiciosTemplate(props: { config: SiteConfig }) {
  return <SaludTemplate {...props} />;
}
