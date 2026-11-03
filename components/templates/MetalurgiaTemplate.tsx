"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import type { SiteConfig } from "@/types/site";
import { SectorImg } from "@/components/templates/SectorImg";
import { SolutionBlock } from "@/components/templates/SolutionBlock";
import styles from "./metalurgia.module.css";

/* ============================================================================
   METALURGIA — industria metalmecánica en Boyacá (referencia: t1energy.com)

   Mantiene el contrato anterior:
   · Props: <MetalurgiaTemplate config={config} />
   · Contenido: companyName y templateCopy { nav, heroKicker, heroLead,
     statement, aboutTitle, aboutBody, capabilities[{title,text}], cards[],
     contactCta, footerNote }. Ancla #contacto-demo en el pie.

   Novedades:
   · Portada a pantalla completa: video si hay heroVideoUrl; si no, una escena
     animada de fundición (brasas, resplandor, planta entre montañas).
   · El nombre viene del formulario (config.companyName), sin edición en la página.
   · Capacidades con selector, proceso paso a paso, cifras que suben, noticias
     con ficha y formulario de cotización (demostración, sin envío).
   · Opcionales: heroVideoUrl, announcement, steps[], stats[], quoteMaterials[],
     email, phone.
   ========================================================================== */

type MetCard = { tag?: string; title?: string; location?: string; price?: string; description?: string };
type Capability = { title: string; text: string };
type Step = { title: string; text: string };
type Stat = { to: number; label: string; prefix?: string; suffix?: string };

type MetExtras = {
  heroVideoUrl?: string;
  announcement?: string;
  steps?: Step[];
  stats?: Stat[];
  quoteMaterials?: string[];
  email?: string;
  phone?: string;
};

type Props = {
  config: SiteConfig;
};

const DEFAULT_STEPS: Step[] = [
  { title: "Diseño y planos", text: "Revisamos el plano, el material y la tolerancia antes de tocar el metal. Aquí se evitan los errores caros." },
  { title: "Fundición", text: "Fundimos y colamos la aleación acordada en el molde de la pieza, con control de temperatura en cada colada." },
  { title: "Mecanizado", text: "Torno, fresa y taladro llevan la pieza a su medida final, con las tolerancias que pide el plano." },
  { title: "Tratamiento térmico", text: "Temple o revenido para darle a la pieza la dureza que necesita según el uso que va a tener." },
  { title: "Control de calidad", text: "Medimos y registramos cada lote antes de despacharlo, para que sepas exactamente qué recibes." },
];

const DEFAULT_STATS: Stat[] = [
  { to: 1200, suffix: " t", label: "de capacidad anual de fundición" },
  { to: 35, label: "personas en planta" },
  { to: 98, suffix: "%", label: "de entregas a tiempo" },
];

const DEFAULT_MATERIALS = ["Acero al carbono", "Acero inoxidable", "Fundición gris", "Aluminio", "Bronce", "Aún no lo sé"];
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Destino de cada enlace del menú, según lo que diga */
function targetFor(label: string, index: number, ids: string[]): string {
  const t = label.toLowerCase();
  const rules: [RegExp, string][] = [
    [/inicio|home/, "inicio"],
    [/empresa|nosotros|qui[eé]nes|misi[oó]n/, "nosotros"],
    [/capac|servicio|producto|tecnolog|fundici/, "capacidades"],
    [/proceso|planta|manufact|fabric/, "proceso"],
    [/cifra|impacto|n[uú]mero/, "cifras"],
    [/noticia|blog|prensa|novedad/, "noticias"],
    [/cotiz|solicit|presupuesto/, "cotizar"],
    [/contact/, "contacto-demo"],
  ];
  for (const [re, id] of rules) if (re.test(t) && ids.includes(id)) return id;
  return ids[Math.min(index, ids.length - 1)];
}

/* --------------------------------- Iconos ------------------------------------ */

const I = {
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  up: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 12V2.5M7 2.5 2.8 6.7M7 2.5l4.2 4.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  pause: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <rect x="2" y="1.5" width="3" height="9" />
      <rect x="7" y="1.5" width="3" height="9" />
    </svg>
  ),
  play: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M3 1.8v8.4L10 6 3 1.8Z" />
    </svg>
  ),
};

/* ============================ Escenas industriales ============================ */
/* Ilustraciones propias (SVG) para que la página se vea completa sin fotos. */

type SceneKind = "horno" | "colada" | "torno" | "temple" | "calidad" | "planta";

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function Scene({ kind, label }: { kind: SceneKind; label: string }) {
  const uid = useId().replace(/:/g, "");
  const g = (n: string) => `${uid}-${n}`;
  const r = rng(kind.length * 13 + 5);
  let body: ReactNode = null;

  const sparks = (cx: number, cy: number, n: number, spread: number) =>
    Array.from({ length: n }, (_, i) => (
      <circle key={i} cx={cx + (r() - 0.5) * spread} cy={cy - r() * spread * 0.9} r={2 + r() * 4} fill={r() > 0.4 ? "#ffd21f" : "#ff8a2a"} opacity={0.6 + r() * 0.4} />
    ));

  if (kind === "horno") {
    body = (
      <>
        <rect x={0} y={700} width={1600} height={200} fill="#17181b" />
        <rect x={520} y={200} width={560} height={500} rx={24} fill="#2c2e33" />
        <rect x={560} y={240} width={480} height={420} rx={16} fill="#1f2023" />
        <rect x={640} y={380} width={320} height={220} rx={110} fill={`url(#${g("glow")})`} />
        <rect x={700} y={120} width={90} height={110} fill="#35373d" />
        <rect x={880} y={150} width={70} height={90} fill="#35373d" />
        <rect x={500} y={680} width={600} height={30} fill="#3a3c42" />
        {sparks(800, 460, 26, 420)}
      </>
    );
  } else if (kind === "colada") {
    body = (
      <>
        <rect x={0} y={720} width={1600} height={180} fill="#17181b" />
        <g transform="rotate(-24 560 300)">
          <path d="M420 220 H720 L690 400 Q570 450 450 400 Z" fill="#3a3c42" />
          <path d="M440 232 H700 L684 300 H456Z" fill={`url(#${g("glow")})`} />
        </g>
        <path d="M690 380 Q740 520 800 640" stroke="#ffb02e" strokeWidth={18} strokeLinecap="round" fill="none" />
        <path d="M690 380 Q740 520 800 640" stroke="#fff3b0" strokeWidth={6} strokeLinecap="round" fill="none" />
        <rect x={700} y={640} width={320} height={120} fill="#2c2e33" />
        <rect x={720} y={660} width={280} height={30} fill={`url(#${g("glow")})`} />
        {sparks(800, 640, 18, 260)}
      </>
    );
  } else if (kind === "torno") {
    body = (
      <>
        <rect x={0} y={700} width={1600} height={200} fill="#17181b" />
        <rect x={300} y={560} width={1000} height={80} fill="#2c2e33" />
        <rect x={300} y={470} width={190} height={170} fill="#3a3c42" />
        <circle cx={430} cy={500} r={78} fill="#4a4d55" />
        <rect x={490} y={440} width={560} height={120} fill={`url(#${g("steel")})`} />
        <polygon points="1100,520 1190,470 1190,520" fill="#ffd21f" />
        <rect x={1060} y={520} width={200} height={50} fill="#2c2e33" />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={1060 - i * 6} y1={496} x2={1010 - i * 22} y2={460 - (i % 5) * 18} stroke="#ffd21f" strokeWidth={3} opacity={0.8} />
        ))}
      </>
    );
  } else if (kind === "temple") {
    body = (
      <>
        <rect x={0} y={720} width={1600} height={180} fill="#17181b" />
        <rect x={420} y={240} width={760} height={480} rx={20} fill="#2c2e33" />
        <rect x={470} y={290} width={500} height={380} rx={12} fill="#1b1c1f" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={510} y={340 + i * 96} width={420} height={44} rx={8} fill={`url(#${g("hot")})`} />
        ))}
        <circle cx={1070} cy={380} r={70} fill="#1b1c1f" stroke="#8b8f98" strokeWidth={6} />
        <line x1={1070} y1={380} x2={1110} y2={345} stroke="#ffd21f" strokeWidth={6} strokeLinecap="round" />
        <circle cx={1070} cy={380} r={8} fill="#ffd21f" />
        <rect x={1020} y={500} width={100} height={20} rx={10} fill="#ff6a1a" />
      </>
    );
  } else if (kind === "calidad") {
    body = (
      <>
        <rect x={0} y={640} width={1600} height={260} fill="#202226" />
        <rect x={0} y={640} width={1600} height={6} fill="#ffd21f" />
        <rect x={470} y={470} width={420} height={170} rx={14} fill={`url(#${g("steel")})`} />
        <circle cx={580} cy={555} r={34} fill="#17181b" />
        <circle cx={780} cy={555} r={34} fill="#17181b" />
        <path d="M980 640 V500 H1180" stroke="#c9ccd2" strokeWidth={14} fill="none" />
        <path d="M1180 500 V560" stroke="#c9ccd2" strokeWidth={14} />
        <circle cx={1240} cy={400} r={110} fill="#2c2e33" stroke="#ffd21f" strokeWidth={10} />
        <path d="M1190 400 l36 38 l70 -82" stroke="#ffd21f" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  } else {
    const smoke = Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx={640 + i * 34} cy={250 - i * 52} rx={50 + i * 22} ry={26 + i * 8} fill="#3a3c42" opacity={0.5 - i * 0.07} />);
    body = (
      <>
        <rect width={1600} height={900} fill={`url(#${g("dusk")})`} />
        <path d="M0 640 L180 520 L330 600 L520 470 L720 590 L920 500 L1120 600 L1340 480 L1600 610 V900 H0Z" fill="#26272c" />
        <path d="M0 720 L260 620 L520 700 L800 610 L1080 700 L1360 630 L1600 700 V900 H0Z" fill="#1b1c20" />
        {smoke}
        <rect x={600} y={330} width={46} height={400} fill="#0f1012" />
        <rect x={700} y={400} width={36} height={330} fill="#0f1012" />
        <rect x={420} y={560} width={780} height={170} fill="#0f1012" />
        <polygon points="420,560 520,500 620,560 720,500 820,560 920,500 1020,560 1120,500 1200,560" fill="#0f1012" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={460 + i * 100} y={620} width={36} height={50} fill="#ffb02e" opacity={0.85} />
        ))}
        <rect x={0} y={730} width={1600} height={170} fill="#0b0b0c" />
      </>
    );
  }

  return (
    <svg className={styles.scene} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <defs>
        <radialGradient id={g("glow")} cx="50%" cy="55%" r="65%">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="0.35" stopColor="#ffb02e" />
          <stop offset="0.75" stopColor="#ff5a14" />
          <stop offset="1" stopColor="#8a1f06" />
        </radialGradient>
        <linearGradient id={g("hot")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff5a14" />
          <stop offset="0.6" stopColor="#ffb02e" />
          <stop offset="1" stopColor="#fff3b0" />
        </linearGradient>
        <linearGradient id={g("steel")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4e6ea" />
          <stop offset="0.5" stopColor="#9a9ea8" />
          <stop offset="1" stopColor="#5a5d66" />
        </linearGradient>
        <linearGradient id={g("dusk")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15161a" />
          <stop offset="0.6" stopColor="#3b2a22" />
          <stop offset="1" stopColor="#c0541b" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={kind === "planta" ? "#15161a" : "#0f1012"} />
      {body}
    </svg>
  );
}

const STEP_SCENES: SceneKind[] = ["calidad", "horno", "torno", "temple", "colada"];
const STEP_SCENE_FOR = (i: number): SceneKind => ["calidad", "colada", "torno", "temple", "horno"][i % 5] as SceneKind;
void STEP_SCENES;

/* Chispas que suben en la portada (solo CSS) */
function Embers({ paused }: { paused: boolean }) {
  const dots = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 34 }, () => ({
      left: 6 + r() * 88,
      delay: -r() * 9,
      dur: 5 + r() * 6,
      size: 2 + r() * 4,
      drift: (r() - 0.5) * 120,
    }));
  }, []);
  return (
    <div className={`${styles.embers}${paused ? ` ${styles.embersPaused}` : ""}`} aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={i}
          className={styles.ember}
          style={{ left: `${d.left}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, "--dx": `${d.drift}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}

/* ---------------------------- Número que sube al verse ----------------------- */

function CountUp({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(prefersReducedMotion() ? stat.to : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setValue(stat.to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const run = (now: number) => {
          const p = Math.min(1, (now - start) / 1700);
          setValue(stat.to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) raf = requestAnimationFrame(run);
        };
        raf = requestAnimationFrame(run);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [stat.to]);

  const text = Math.round(value).toLocaleString("es-CO");
  return (
    <span ref={ref} className={styles.statNum} aria-label={`${stat.prefix ?? ""}${stat.to.toLocaleString("es-CO")}${stat.suffix ?? ""}`}>
      <span aria-hidden="true">
        {stat.prefix}
        {text}
        {stat.suffix}
      </span>
    </span>
  );
}

/* ------------------------- Ventana modal accesible ---------------------------- */

function Modal({ label, onClose, wide, children }: { label: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const box = boxRef.current;
    const focusables = () =>
      Array.from(box?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (el) => !el.hasAttribute("disabled")
      );
    (box?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0])?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={boxRef} className={`${styles.dialog}${wide ? ` ${styles.dialogWide}` : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
          {I.close}
        </button>
        {children}
      </div>
    </div>
  );
}

/* ================================ Plantilla =================================== */

export function MetalurgiaTemplate({ config }: Props) {
  const copy = config.templateCopy as typeof config.templateCopy & { statement?: string; capabilities?: Capability[] };
  const extras = config as SiteConfig & MetExtras;
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const companyName = (config.companyName ?? "").replace(/\s+/g, " ").trim() || "Tu empresa";
  const [menu, setMenu] = useState(false);

  /* ------------------------------ Contenido --------------------------------- */
  const cards = useMemo(() => (copy?.cards ?? []) as unknown as MetCard[], [copy?.cards]);
  const navItems = useMemo(() => (copy?.nav ?? []) as string[], [copy?.nav]);
  const caps = useMemo(() => (copy?.capabilities ?? []) as Capability[], [copy?.capabilities]);
  const steps = extras.steps?.length ? extras.steps : DEFAULT_STEPS;
  const stats = extras.stats?.length ? extras.stats : DEFAULT_STATS;
  const usingDemoStats = !extras.stats?.length;
  const materials = extras.quoteMaterials?.length ? extras.quoteMaterials : DEFAULT_MATERIALS;
  const email = extras.email ?? "ventas@ejemplo.co";
  const phone = extras.phone ?? "+57 300 000 0000";
  const hasStatement = Boolean(copy?.statement);

  const sectionIds = useMemo(() => {
    const ids = ["inicio"];
    if (hasStatement) ids.push("mision");
    ids.push("nosotros");
    if (caps.length) ids.push("capacidades");
    ids.push("proceso", "cifras", "noticias", "cotizar", "contacto-demo");
    return ids;
  }, [hasStatement, caps.length]);
  const target = useCallback((label: string, i: number) => targetFor(label, i, sectionIds), [sectionIds]);

  /* ------------------------------- Scroll ----------------------------------- */
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setScrolled(window.scrollY > 60);
      setShowTop(window.scrollY > 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const goTo = useCallback((id: string) => {
    setMenu(false);
    window.setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }),
      30
    );
  }, []);

  const toTop = () => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  useEffect(() => {
    const host = rootRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(host.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealOn);
            io.unobserve(entry.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cards.length, caps.length, steps.length]);

  /* Menú */
  useEffect(() => {
    const el = menuRef.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (el) el.inert = !menu;
    if (!menu) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  /* ------------------------------ Portada ----------------------------------- */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const useVideo = Boolean(extras.heroVideoUrl) && !videoFailed;

  useEffect(() => {
    if (prefersReducedMotion()) setPlaying(false);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => setPlaying(false));
    } else v.pause();
  }, [playing, useVideo]);

  const len = companyName.length;
  const heroStyle = { "--k": len <= 12 ? 13 : len <= 20 ? 10 : len <= 30 ? 7.4 : 5.8 } as CSSProperties;

  /* ----------------------------- Capacidades -------------------------------- */
  const [cap, setCap] = useState(0);

  /* ------------------------------- Proceso ---------------------------------- */
  const [step, setStep] = useState(0);

  /* ------------------------------- Noticias --------------------------------- */
  const [openNews, setOpenNews] = useState<number | null>(null);
  const news = openNews !== null ? cards[openNews] : null;

  /* ------------------------------ Cotización -------------------------------- */
  const [q, setQ] = useState({ type: "", material: materials[0], qty: "", term: "", who: "", company: "", contact: "", notes: "" });
  const [qErr, setQErr] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const setField = (k: keyof typeof q, v: string) => {
    setQ((s) => ({ ...s, [k]: v }));
    if (qErr[k]) setQErr((e) => ({ ...e, [k]: "" }));
  };

  const submitQuote = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const qty = Number(q.qty);
    if (!q.qty || !Number.isFinite(qty) || qty < 1) errs.qty = "Escribe una cantidad de 1 en adelante.";
    if (q.who.trim().length < 2) errs.who = "Escribe tu nombre.";
    if (!/^\S+@\S+\.\S+$/.test(q.contact.trim()) && !/^[+\d][\d\s()-]{6,}$/.test(q.contact.trim())) errs.contact = "Escribe un correo o un teléfono válido.";
    setQErr(errs);
    if (Object.keys(errs).length) {
      window.setTimeout(() => document.getElementById(`met-q-${Object.keys(errs)[0]}`)?.focus(), 0);
      return;
    }
    setSent(true);
  };

  const year = new Date().getFullYear();
  const reveal = (n = 0) => ({
    className: styles.reveal,
    "data-reveal": true as const,
    style: n ? ({ "--d": `${n * 90}ms` } as CSSProperties) : undefined,
  });

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressBar} style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Barra */}
      <header className={`${styles.top}${scrolled ? ` ${styles.topSolid}` : ""}`}>
        <div className={styles.topIn}>
          <button type="button" className={styles.logo} onClick={toTop} aria-label={`${companyName}. Ir al inicio`}>
            <span className={styles.logoMark} aria-hidden="true" />
            <span className={styles.logoText}>{companyName}</span>
          </button>
          <div className={styles.topActions}>
            <button type="button" className={`${styles.btn} ${styles.btnYellow} ${styles.btnSm} ${styles.hideSm}`} onClick={() => goTo("cotizar")}>
              {copy.contactCta}
            </button>
            <button type="button" className={styles.menuBtn} onClick={() => setMenu(true)} aria-expanded={menu} aria-haspopup="dialog">
              <span>Menú</span>
              <span className={styles.burger} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú a pantalla completa */}
      <div ref={menuRef} className={`${styles.menu}${menu ? ` ${styles.menuOpen}` : ""}`} role="dialog" aria-modal="true" aria-label="Menú" aria-hidden={!menu}>
        <div className={styles.menuHead}>
          <span className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            <span className={styles.logoText}>{companyName}</span>
          </span>
          <button type="button" className={styles.menuBtn} onClick={() => setMenu(false)} aria-label="Cerrar menú">
            <span>Cerrar</span>
            {I.close}
          </button>
        </div>
        <div className={styles.menuBody}>
          <ul className={styles.menuList}>
            {navItems.map((item, i) => (
              <li key={`${item}-${i}`}>
                <button type="button" className={styles.menuLink} onClick={() => goTo(target(item, i))}>
                  <span className={styles.menuNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.menuText}>{item}</span>
                  <span className={styles.menuArrow}>{I.arrow}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.menuSide}>
            <p className={styles.tag}>Contacto</p>
            <a className={styles.menuContact} href={`mailto:${email}`}>
              {email}
            </a>
            <span className={styles.menuContact}>{phone}</span>
            <div className={styles.menuBtns}>
              <button type="button" className={`${styles.btn} ${styles.btnYellow}`} onClick={() => goTo("cotizar")}>
                {copy.contactCta}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Portada */}
      <section className={styles.hero} id="inicio" style={heroStyle}>
        <div className={styles.heroMedia} aria-hidden="true">
          {config.sectorPhotos?.hero ? (
            <SectorImg desktop={config.sectorPhotos.hero.desktop} mobile={config.sectorPhotos.hero.mobile} alt="" className={styles.heroVideo} />
          ) : useVideo ? (
            <video ref={videoRef} className={styles.heroVideo} src={extras.heroVideoUrl} muted loop playsInline autoPlay={!prefersReducedMotion()} onError={() => setVideoFailed(true)} />
          ) : (
            <>
              <Scene kind="planta" label="" />
              <div className={`${styles.heroGlow}${playing ? "" : ` ${styles.heroGlowStill}`}`} />
              <Embers paused={!playing} />
            </>
          )}
          <div className={styles.heroShade} />
        </div>

        <div className={styles.heroContent}>
          <p className={styles.kicker}>{copy.heroKicker}</p>
          <h1 className={styles.title}>{companyName}</h1>
          <p className={styles.lead}>{copy.heroLead}</p>
          <div className={styles.heroCtas}>
            <button type="button" className={`${styles.btn} ${styles.btnYellow}`} onClick={() => goTo("cotizar")}>
              {copy.contactCta} {I.arrow}
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnLineLight}`} onClick={() => goTo(caps.length ? "capacidades" : "proceso")}>
              Ver capacidades
            </button>
          </div>
        </div>

        <div className={styles.heroFoot}>
          <button type="button" className={styles.discover} onClick={() => goTo(hasStatement ? "mision" : "nosotros")}>
            <span className={styles.discoverLine} aria-hidden="true" />
            Descubre
          </button>
          {extras.announcement ? <span className={styles.announce}>{extras.announcement}</span> : null}
          <button type="button" className={styles.ghost} onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
            {playing ? I.pause : I.play} {playing ? "Pausar" : "Reproducir"}
          </button>
        </div>
      </section>

      <SolutionBlock solution={config.solution} tone="metalurgia" site={config} />

      {/* Banda de declaración */}
      {hasStatement ? (
        <section className={styles.band} id="mision">
          <div className={styles.wrap}>
            <p className={styles.bandLabel}>Misión</p>
            <p className={`${styles.bandText} ${styles.reveal}`} data-reveal>
              {copy.statement}
            </p>
            <button type="button" className={`${styles.btn} ${styles.btnBlack}`} onClick={() => goTo("nosotros")}>
              Conocer más {I.arrow}
            </button>
          </div>
        </section>
      ) : null}

      {/* Quiénes somos + capacidades */}
      <section className={styles.light} id="nosotros">
        <div className={styles.wrap}>
          <div className={styles.aboutGrid}>
            <div {...reveal()}>
              <p className={styles.tagDark}>Empresa</p>
              <h2 className={styles.h2}>{copy.aboutTitle}</h2>
            </div>
            <p className={`${styles.bodyDark} ${styles.reveal}`} data-reveal style={{ "--d": "100ms" } as CSSProperties}>
              {copy.aboutBody}
            </p>
          </div>
        </div>
      </section>

      {caps.length ? (
        <section className={styles.light} id="capacidades" style={{ paddingTop: 0 }}>
          <div className={styles.wrap}>
            <p className={styles.tagDark}>Capacidades</p>
            <div className={styles.capLayout}>
              <div className={styles.capList} role="tablist" aria-label="Capacidades" aria-orientation="vertical">
                {caps.map((c, i) => (
                  <button
                    key={c.title}
                    id={`met-cap-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={cap === i}
                    aria-controls="met-cap-panel"
                    className={`${styles.capTab}${cap === i ? ` ${styles.capTabOn}` : ""}`}
                    onClick={() => setCap(i)}
                  >
                    <span className={styles.capNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.capName}>{c.title}</span>
                    <span className={styles.capArrow}>{I.arrow}</span>
                  </button>
                ))}
              </div>
              <div className={styles.capPanel} id="met-cap-panel" role="tabpanel" aria-labelledby={`met-cap-tab-${cap}`} key={cap}>
                <span className={styles.capBig} aria-hidden="true">
                  {String(cap + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.capTitle}>{caps[cap].title}</h3>
                <p className={styles.capText}>{caps[cap].text}</p>
                <button type="button" className={`${styles.btn} ${styles.btnBlack}`} onClick={() => goTo("cotizar")}>
                  Cotizar esta capacidad {I.arrow}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Proceso */}
      <section className={styles.dark} id="proceso">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
            <div>
              <p className={styles.tag}>Planta</p>
              <h2 className={`${styles.h2} ${styles.h2Light}`}>Del metal a la pieza terminada</h2>
            </div>
          </div>

          <div className={styles.proc}>
            <div className={styles.procMedia}>
              {steps.map((s, i) => (
                <div key={s.title} className={`${styles.procScene}${i === step ? ` ${styles.procSceneOn}` : ""}`} aria-hidden={i === step ? undefined : "true"}>
                  {config.sectorPhotos?.shots.length ? (
                    <SectorImg
                      desktop={(config.sectorPhotos.shots[i % config.sectorPhotos.shots.length] ?? config.sectorPhotos.hero).desktop}
                      mobile={(config.sectorPhotos.shots[i % config.sectorPhotos.shots.length] ?? config.sectorPhotos.hero).mobile}
                      alt={s.title}
                      className={styles.heroVideo}
                    />
                  ) : (
                    <Scene kind={STEP_SCENE_FOR(i)} label={s.title} />
                  )}
                </div>
              ))}
              <span className={styles.procBadge}>
                P{String(step + 1).padStart(2, "0")}_{steps[step].title.split(" ")[0].toUpperCase()}
              </span>
            </div>

            <div className={styles.procSide}>
              <ol className={styles.procList}>
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <button type="button" className={`${styles.procBtn}${i === step ? ` ${styles.procBtnOn}` : ""}`} onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}>
                      <span className={styles.procNum}>{String(i + 1).padStart(2, "0")}</span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className={styles.procText} key={step}>
                {steps[step].text}
              </p>
              <div className={styles.procBar} aria-hidden="true">
                <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cifras */}
      <section className={styles.light} id="cifras">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
            <div>
              <p className={styles.tagDark}>Empresa en cifras</p>
              <h2 className={styles.h2}>Lo que hacemos cada año</h2>
            </div>
          </div>
          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <CountUp stat={s} />
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
          {usingDemoStats ? <p className={styles.sample}>Cifras de ejemplo. Reemplázalas con las de tu empresa.</p> : null}
        </div>
      </section>

      {/* Noticias */}
      <section className={styles.dark} id="noticias">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
            <div>
              <p className={styles.tag}>Noticias de ejemplo</p>
              <h2 className={`${styles.h2} ${styles.h2Light}`}>Novedades de {companyName}</h2>
            </div>
          </div>
          <ul className={styles.newsList}>
            {cards.map((c, i) => (
              <li key={`${c.title ?? "n"}-${i}`} className={`${styles.reveal}`} data-reveal style={{ "--d": `${(i % 4) * 70}ms` } as CSSProperties}>
                <button type="button" className={styles.newsItem} onClick={() => setOpenNews(i)} aria-haspopup="dialog">
                  <span className={styles.newsMeta}>{c.tag}</span>
                  <span className={styles.newsTitle}>{c.title}</span>
                  <span className={styles.newsMeta}>
                    {c.location}
                    {c.price ? ` · ${c.price}` : ""}
                  </span>
                  <span className={styles.newsArrow}>{I.arrow}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.newsCta}>
            <a className={`${styles.btn} ${styles.btnYellow}`} href="#contacto-demo">
              {copy.contactCta} {I.arrow}
            </a>
          </div>
        </div>
      </section>

      {/* Cotización */}
      <section className={styles.light} id="cotizar">
        <div className={styles.wrap}>
          <div className={styles.quoteGrid}>
            <div {...reveal()}>
              <p className={styles.tagDark}>Cotización</p>
              <h2 className={styles.h2}>Cuéntanos qué pieza necesitas</h2>
              <p className={styles.bodyDark} style={{ marginTop: 20 }}>
                Dinos el material, la cantidad y el plazo. Te respondemos con precio y tiempo de entrega. No pedimos pago en este paso.
              </p>
            </div>

            <div {...reveal(1)}>
              {sent ? (
                <div className={styles.confirm} role="status">
                  <p className={styles.tagDark}>Solicitud lista</p>
                  <h3 className={styles.confirmTitle}>Gracias, {q.who.trim().split(" ")[0]}.</h3>
                  <dl className={styles.summary}>
                    <div className={styles.row}>
                      <dt>Capacidad</dt>
                      <dd>{q.type || "Por definir"}</dd>
                    </div>
                    <div className={styles.row}>
                      <dt>Material</dt>
                      <dd>{q.material}</dd>
                    </div>
                    <div className={styles.row}>
                      <dt>Cantidad</dt>
                      <dd>{Number(q.qty).toLocaleString("es-CO")} piezas</dd>
                    </div>
                    <div className={styles.row}>
                      <dt>Plazo</dt>
                      <dd>{q.term || "Sin fecha"}</dd>
                    </div>
                  </dl>
                  <p className={styles.help}>Esto es una demostración: la solicitud no se envió a ningún lugar. Te escribiríamos a {q.contact.trim()}.</p>
                  <div className={styles.formActions}>
                    <button type="button" className={`${styles.btn} ${styles.btnBlack}`} onClick={() => setSent(false)}>
                      Editar solicitud
                    </button>
                  </div>
                </div>
              ) : (
                <form className={styles.quoteForm} onSubmit={submitQuote} noValidate>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="met-q-type">
                        Capacidad
                      </label>
                      <select id="met-q-type" className={styles.input} value={q.type} onChange={(e) => setField("type", e.target.value)}>
                        <option value="">Aún no lo sé</option>
                        {caps.map((c) => (
                          <option key={c.title} value={c.title}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="met-q-material">
                        Material
                      </label>
                      <select id="met-q-material" className={styles.input} value={q.material} onChange={(e) => setField("material", e.target.value)}>
                        {materials.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="met-q-qty">
                        Cantidad de piezas
                      </label>
                      <input id="met-q-qty" type="number" inputMode="numeric" min={1} className={`${styles.input}${qErr.qty ? ` ${styles.inputBad}` : ""}`} value={q.qty} onChange={(e) => setField("qty", e.target.value)} aria-invalid={qErr.qty ? true : undefined} />
                      {qErr.qty ? <p className={styles.error} role="alert">{qErr.qty}</p> : null}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="met-q-term">
                        Fecha límite (opcional)
                      </label>
                      <input id="met-q-term" type="date" className={styles.input} value={q.term} onChange={(e) => setField("term", e.target.value)} />
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="met-q-who">
                        Tu nombre
                      </label>
                      <input id="met-q-who" className={`${styles.input}${qErr.who ? ` ${styles.inputBad}` : ""}`} value={q.who} onChange={(e) => setField("who", e.target.value)} autoComplete="name" aria-invalid={qErr.who ? true : undefined} />
                      {qErr.who ? <p className={styles.error} role="alert">{qErr.who}</p> : null}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor="met-q-company">
                        Empresa (opcional)
                      </label>
                      <input id="met-q-company" className={styles.input} value={q.company} onChange={(e) => setField("company", e.target.value)} autoComplete="organization" />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="met-q-contact">
                      Correo o teléfono
                    </label>
                    <input id="met-q-contact" className={`${styles.input}${qErr.contact ? ` ${styles.inputBad}` : ""}`} value={q.contact} onChange={(e) => setField("contact", e.target.value)} autoComplete="email" aria-invalid={qErr.contact ? true : undefined} />
                    {qErr.contact ? <p className={styles.error} role="alert">{qErr.contact}</p> : null}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="met-q-notes">
                      <span>Detalles (medidas, plano, norma)</span>
                      <span className={styles.count}>{q.notes.length}/500</span>
                    </label>
                    <textarea id="met-q-notes" rows={3} className={styles.input} value={q.notes} maxLength={500} onChange={(e) => setField("notes", e.target.value)} />
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={`${styles.btn} ${styles.btnBlack}`}>
                      Solicitar cotización {I.arrow}
                    </button>
                  </div>
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
              <p className={styles.footNote}>{copy.footerNote}</p>
            </div>
            <div>
              <p className={styles.tag}>Explorar</p>
              <ul className={styles.footList}>
                {navItems.map((item, i) => (
                  <li key={`${item}-${i}`}>
                    <button type="button" className={styles.footLink} onClick={() => goTo(target(item, i))}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.tag}>Contacto</p>
              <ul className={styles.footList}>
                <li>
                  <a className={styles.footLink} href={`mailto:${email}`}>
                    {email}
                  </a>
                </li>
                <li>
                  <span className={styles.footText}>{phone}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.footBase}>
            <span>
              © {year} {companyName} · Boyacá, Colombia
            </span>
            <span>Sitio de demostración</span>
          </div>
        </div>
      </footer>

      <button type="button" className={`${styles.backTop}${showTop ? ` ${styles.backTopOn}` : ""}`} onClick={toTop} aria-label="Volver arriba" tabIndex={showTop ? 0 : -1}>
        {I.up}
      </button>

      {news ? (
        <Modal label={news.title ?? "Noticia"} onClose={() => setOpenNews(null)} wide>
          <div className={styles.dialogBody}>
            {news.tag ? <p className={styles.tag}>{news.tag}</p> : null}
            <h3 className={styles.dialogTitle}>{news.title}</h3>
            <p className={styles.dialogText}>
              {news.description ?? `Texto de ejemplo de ${companyName}. Aquí va el contenido de la noticia: qué pasó, quién participó y qué significa para tus clientes.`}
            </p>
            <dl className={styles.summary}>
              {news.location ? (
                <div className={styles.rowLight}>
                  <dt>Dato</dt>
                  <dd>{news.location}</dd>
                </div>
              ) : null}
              {news.price ? (
                <div className={styles.rowLight}>
                  <dt>Detalle</dt>
                  <dd>{news.price}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Modal>
      ) : null}

    </div>
  );
}
