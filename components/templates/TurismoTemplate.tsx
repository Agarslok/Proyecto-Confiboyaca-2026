"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { SiteConfig } from "@/types/site";
import type { SectorFrame } from "@/lib/site/sector-gallery";
import { SectorImg } from "@/components/templates/SectorImg";
import { TourismOperationsSuite } from "@/components/templates/TourismOperationsSuite";
import styles from "./turismo.module.css";

/* ============================================================================
   TURISMO — hotel boutique en Boyacá (sistema "Kobu" de Refero · referencia kobu.co)

   Mantiene el contrato anterior:
   · Props: <TurismoTemplate config={config} />
   · Contenido: companyName y templateCopy { nav, heroKicker, heroLead,
     aboutTitle, aboutBody, cards[] (con featured), contactCta, footerNote }.
   · Ancla #contacto-demo en el pie y la marca "Demo local".

   Novedades:
   · El nombre del hotel es el titular y se ajusta solo al ancho de la página.
   · El nombre viene del formulario (config.companyName), sin edición en la página.
   · Habitaciones con filtro y ficha, Boyacá cerca (índice desplegable),
     diario y formulario de consulta de estadía (demostración, sin envío).
   · Sin fotos, dibuja paisajes propios en SVG. Con fotos, úsalas:
       heroVideoUrl, heroImages[], card.image, impactImage
   · Opcionales: facts[], nearby[], journal[], email.
   ========================================================================== */

type TurCard = {
  tag?: string;
  title?: string;
  location?: string;
  price?: string;
  featured?: boolean;
  image?: string;
  description?: string;
};

type Fact = { label: string; value: string };
type Nearby = { title: string; meta: string; text: string };
type Note = { kind: string; title: string; excerpt: string };

type TurExtras = {
  heroVideoUrl?: string;
  heroImages?: string[];
  locationImage?: string;
  facts?: Fact[];
  nearby?: Nearby[];
  journal?: Note[];
  email?: string;
};

type Props = {
  config: SiteConfig;
};

const SLIDE_MS = 6000;

const DEFAULT_FACTS: Fact[] = [
  { label: "Altitud", value: "2.150 m" },
  { label: "Habitaciones", value: "12" },
  { label: "Llegada", value: "15:00" },
  { label: "Salida", value: "12:00" },
];

const DEFAULT_NEARBY: Nearby[] = [
  {
    title: "Plaza Mayor de Villa de Leyva",
    meta: "A pie",
    text: "Una de las plazas empedradas más grandes de Colombia. Al atardecer se llena de gente, café y música.",
  },
  {
    title: "Santuario de Flora y Fauna Iguaque",
    meta: "Medio día",
    text: "Bosque de niebla y páramo con la laguna sagrada de los muiscas. Se camina con guía y desde temprano.",
  },
  {
    title: "Ráquira",
    meta: "Excursión",
    text: "Pueblo de casas de colores y talleres de cerámica. Aquí se compra barro hecho a mano, directo del artesano.",
  },
  {
    title: "Pozos Azules",
    meta: "Excursión",
    text: "Pozos de agua verde y azul en medio del desierto. Mejor al mediodía, cuando la luz es más fuerte.",
  },
  {
    title: "Termales de Paipa",
    meta: "Día completo",
    text: "Aguas termales a una hora y media de camino. Un plan tranquilo para cerrar el viaje.",
  },
];

const DEFAULT_JOURNAL: Note[] = [
  {
    kind: "Guía",
    title: "Tres días en Villa de Leyva sin correr",
    excerpt: "Qué hacer en la mañana, cuándo ir a la plaza y por qué conviene dejar la tarde libre.",
  },
  {
    kind: "Nota",
    title: "Qué empacar para un fin de semana en el altiplano",
    excerpt: "Hace sol a mediodía y frío al caer la tarde. Capas, zapatos cómodos y algo de abrigo.",
  },
  {
    kind: "Conversación",
    title: "La cocina boyacense, contada por quien la prepara",
    excerpt: "Mazorca, cuchuco y papas criollas: lo que hay detrás del desayuno de la casa.",
  },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Nombre en una o dos líneas, repartido para que el titular quede parejo */
function splitName(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (name.length <= 13 || words.length < 2) return [name];
  let best = 1;
  let diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    if (Math.abs(a - b) < diff) {
      diff = Math.abs(a - b);
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/* Etiqueta de destino para cada enlace del menú, según lo que diga */
function targetFor(label: string, index: number, ids: string[]): string {
  const t = label.toLowerCase();
  const rules: [RegExp, string][] = [
    [/inicio|home/, "inicio"],
    [/hotel|casa|nosotros|historia/, "hotel"],
    [/habita|cuarto|suite|aloja|caba/, "habitaciones"],
    [/boyac|destino|experien|explor|cerca/, "boyaca"],
    [/diario|blog|journal|noticias/, "diario"],
    [/reserv|disponib|book/, "contacto-demo"],
    [/contact/, "contacto-demo"],
  ];
  for (const [re, id] of rules) if (re.test(t) && ids.includes(id)) return id;
  return ids[Math.min(index, ids.length - 1)];
}

/* ---------------------------------- Iconos ----------------------------------- */

const I = {
  menu: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 5.5h14M2 12.5h14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  up: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 11.5V2.5M7 2.5 2.8 6.7M7 2.5l4.2 4.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  plus: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  minus: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1.5 6h9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
};

/* ============================= Paisajes en SVG ================================ */
/* Ilustraciones propias, de paleta apagada, para que la página se vea completa
   aun sin fotografías. Se reemplazan pasando URLs (heroImages, card.image). */

type SceneKind = "paramo" | "laguna" | "pueblo" | "habitacion" | "jardin";

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function Scene({ kind, seed = 1, label }: { kind: SceneKind; seed?: number; label: string }) {
  const uid = useId().replace(/:/g, "");
  const r = rng(seed * 97 + kind.length);
  const g = (n: string) => `${uid}-${n}`;

  const mountains = (y: number, amp: number, color: string, k: number, opacity = 1) => {
    const rr = rng(seed * 31 + k);
    let d = `M0 900 L0 ${y}`;
    for (let x = 0; x <= 1600; x += 100) d += ` L${x} ${y - rr() * amp}`;
    d += " L1600 900 Z";
    return <path d={d} fill={color} opacity={opacity} />;
  };

  let body: ReactNode = null;
  let sky: [string, string] = ["#efe6dc", "#f6d9c0"];

  if (kind === "paramo") {
    sky = ["#e9e4dc", "#f4d7bd"];
    const plants = Array.from({ length: 16 }, (_, i) => {
      const x = 60 + i * 98 + r() * 50;
      const h = 50 + r() * 90;
      const y = 770 + r() * 90;
      const s = 0.7 + (y - 770) / 160;
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x={-11} y={-h} width={22} height={h} rx={6} fill="#8a7a55" />
          <rect x={-11} y={-h * 0.5} width={22} height={h * 0.5} rx={6} fill="#6f6246" opacity={0.5} />
          {[-62, -38, -14, 14, 38, 62].map((a) => (
            <path key={a} d={`M0 ${-h} Q${a * 0.7} ${-h - 34} ${a * 0.95} ${-h - 8}`} stroke="#b4bd8a" strokeWidth={9} strokeLinecap="round" fill="none" />
          ))}
          <ellipse cx={0} cy={-h - 8} rx={26} ry={16} fill="#cdd5a6" />
        </g>
      );
    });
    body = (
      <>
        <circle cx={1180} cy={300} r={96} fill="#fbe9cf" opacity={0.95} />
        {mountains(560, 120, "#b9bac6", 1)}
        {mountains(640, 110, "#93a0b0", 2)}
        {mountains(720, 90, "#6f8478", 3)}
        <rect x={0} y={760} width={1600} height={140} fill="#5d6f58" />
        <rect x={0} y={760} width={1600} height={140} fill={`url(#${g("fog")})`} />
        {plants}
      </>
    );
  } else if (kind === "laguna") {
    sky = ["#dde6e9", "#f3eee4"];
    const ridge = (op: number, flip = false) => (
      <g opacity={op} transform={flip ? "translate(0 1160) scale(1 -1)" : undefined}>
        {mountains(560, 150, "#7f93a0", 4)}
        {mountains(620, 100, "#5f7a73", 5)}
      </g>
    );
    body = (
      <>
        <circle cx={420} cy={240} r={70} fill="#fff7e6" opacity={0.9} />
        {ridge(1)}
        <rect x={0} y={580} width={1600} height={320} fill={`url(#${g("water")})`} />
        {ridge(0.28, true)}
        <rect x={0} y={560} width={1600} height={90} fill="#fff" opacity={0.28} filter={`url(#${g("blur")})`} />
        <path d="M0 860 Q400 820 800 850 T1600 840 V900 H0Z" fill="#4f6350" />
      </>
    );
  } else if (kind === "pueblo") {
    sky = ["#f4e3cf", "#fbf3e6"];
    const houses = Array.from({ length: 9 }, (_, i) => {
      const w = 150 + r() * 40;
      const h = 130 + r() * 70;
      const x = i * 175 - 10;
      const y = 700 - h;
      return (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#f4efe6" />
          <polygon points={`${x - 8},${y} ${x + w / 2},${y - 46} ${x + w + 8},${y}`} fill="#b4623f" />
          <rect x={x + 22} y={y + 36} width={26} height={44} fill="#5a4636" />
          <rect x={x + w - 52} y={y + 36} width={26} height={44} fill="#5a4636" />
          <rect x={x + w / 2 - 14} y={y + h - 62} width={28} height={62} fill="#7b5a3c" />
        </g>
      );
    });
    body = (
      <>
        {mountains(520, 90, "#b3baad", 6)}
        {mountains(580, 70, "#97a595", 7)}
        <g>
          <rect x={720} y={380} width={96} height={320} fill="#f7f2e9" />
          <polygon points="712,380 768,320 824,380" fill="#a9573a" />
          <rect x={752} y={420} width={32} height={60} fill="#3f3128" />
          <rect x={745} y={540} width={46} height={80} fill="#5a4636" />
        </g>
        {houses}
        <rect x={0} y={700} width={1600} height={200} fill="#cdbfae" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={0} x2={1600} y1={720 + i * 22} y2={720 + i * 22} stroke="#b8a892" strokeWidth={2} />
        ))}
      </>
    );
  } else if (kind === "habitacion") {
    sky = ["#e9e1d4", "#e9e1d4"];
    body = (
      <>
        <rect x={0} y={0} width={1600} height={900} fill="#e9e1d4" />
        <rect x={0} y={690} width={1600} height={210} fill="#b99a78" />
        <clipPath id={g("win")}>
          <rect x={1030} y={120} width={380} height={420} />
        </clipPath>
        <g clipPath={`url(#${g("win")})`}>
          <rect x={1030} y={120} width={380} height={420} fill="#f2dcc4" />
          <path d="M1030 420 L1130 330 L1210 400 L1300 300 L1410 410 V540 H1030Z" fill="#8fa0ad" />
          <path d="M1030 470 L1140 400 L1250 460 L1330 410 L1410 470 V540 H1030Z" fill="#6f8478" />
        </g>
        <rect x={1030} y={120} width={380} height={420} fill="none" stroke="#7b5a3c" strokeWidth={14} />
        <line x1={1220} y1={120} x2={1220} y2={540} stroke="#7b5a3c" strokeWidth={10} />
        <rect x={180} y={300} width={640} height={190} rx={6} fill="#7b5a3c" />
        <rect x={150} y={470} width={700} height={200} rx={14} fill="#f6f1e8" />
        <rect x={150} y={560} width={700} height={120} rx={10} fill="#a35d3f" />
        <rect x={210} y={430} width={170} height={70} rx={20} fill="#fffaf0" />
        <rect x={420} y={430} width={170} height={70} rx={20} fill="#fffaf0" />
        <rect x={880} y={560} width={80} height={130} fill="#6b4c33" />
        <circle cx={920} cy={520} r={44} fill="#f6d79a" opacity={0.85} />
        <rect x={160} y={700} width={680} height={90} fill="#c9b79b" opacity={0.7} />
      </>
    );
  } else {
    sky = ["#f2dfca", "#fbf1e2"];
    const arches = Array.from({ length: 5 }, (_, i) => {
      const x = 180 + i * 250;
      return <path key={i} d={`M${x} 700 V520 A90 90 0 0 1 ${x + 180} 520 V700 Z`} fill="#6e5a47" />;
    });
    const plants = Array.from({ length: 10 }, (_, i) => (
      <g key={i}>
        <circle cx={90 + i * 160 + r() * 40} cy={790 + r() * 40} r={34 + r() * 22} fill={i % 2 ? "#6f8a5c" : "#4f6b47"} />
      </g>
    ));
    body = (
      <>
        <circle cx={1360} cy={190} r={70} fill="#fff1d2" />
        {mountains(430, 70, "#b8bfae", 8)}
        <rect x={80} y={380} width={1440} height={330} fill="#efe4d2" />
        <polygon points="60,380 800,260 1540,380" fill="#b0633f" />
        {arches}
        <rect x={0} y={700} width={1600} height={200} fill="#cdb99c" />
        <ellipse cx={800} cy={800} rx={120} ry={34} fill="#9fb4b5" />
        <ellipse cx={800} cy={792} rx={90} ry={22} fill="#c6d6d4" />
        {plants}
      </>
    );
  }

  return (
    <svg className={styles.scene} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <defs>
        <linearGradient id={g("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <linearGradient id={g("water")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fb3b8" />
          <stop offset="1" stopColor="#c9d6d4" />
        </linearGradient>
        <linearGradient id={g("fog")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={g("blur")}>
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#${g("sky")})`} />
      {body}
    </svg>
  );
}

const SCENE_ORDER: SceneKind[] = ["paramo", "laguna", "pueblo", "jardin", "habitacion"];
const SCENE_CAPTION: Record<SceneKind, string> = {
  paramo: "Páramo al amanecer",
  laguna: "Laguna entre montañas",
  pueblo: "Plaza y casas coloniales",
  jardin: "Patio de la casona",
  habitacion: "Habitación con vista",
};

/* Fotografía si hay URL; si no (o si falla), el paisaje dibujado */
function Photo({
  src,
  mobile,
  kind,
  seed,
  alt,
  className,
}: {
  src?: string;
  mobile?: string;
  kind: SceneKind;
  seed: number;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src, mobile]);
  if (!src || failed) return <Scene kind={kind} seed={seed} label={alt} />;
  return <SectorImg desktop={src} mobile={mobile} alt={alt} className={className} onError={() => setFailed(true)} />;
}

/* ------------------------- Ventana modal accesible --------------------------- */

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

/* ============================== Plantilla ==================================== */

export function TurismoTemplate({ config }: Props) {
  const copy = config.templateCopy;
  const extras = config as SiteConfig & TurExtras;
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const companyName = (config.companyName ?? "").replace(/\s+/g, " ").trim() || "Tu hotel";
  const [sheet, setSheet] = useState(false);

  /* ------------------------------ Contenido --------------------------------- */
  const cards = useMemo(() => (copy?.cards ?? []) as unknown as TurCard[], [copy?.cards]);
  const navItems = useMemo(() => (copy?.nav ?? []) as string[], [copy?.nav]);
  const facts = extras.facts?.length ? extras.facts : DEFAULT_FACTS;
  const nearby = extras.nearby?.length ? extras.nearby : DEFAULT_NEARBY;
  const journal = extras.journal?.length ? extras.journal : DEFAULT_JOURNAL;
  const usingDemoCopy = !extras.nearby?.length || !extras.journal?.length;
  const email = extras.email ?? "reservas@ejemplo.co";

  const sectionIds = useMemo(() => ["inicio", "hotel", "habitaciones", "diario", "contacto-demo"], []);
  const target = useCallback((label: string, i: number) => targetFor(label, i, sectionIds), [sectionIds]);

  /* --------------------------- Titular ajustado al ancho -------------------- */
  const lines = useMemo(() => splitName(companyName), [companyName]);
  const boxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [wmSize, setWmSize] = useState(64);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const m = measureRef.current;
    if (!box || !m) return;
    const w = m.getBoundingClientRect().width;
    const avail = box.clientWidth;
    if (w > 0 && avail > 0) setWmSize(Math.max(22, Math.min((avail / w) * 100 * 0.995, 400)));
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [fit, lines]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(box);
    window.addEventListener("resize", fit);
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready.then(fit).catch(() => undefined);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [fit]);

  /* ------------------------------- Scroll ----------------------------------- */
  const [activeId, setActiveId] = useState("inicio");
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 600);
      const line = window.scrollY + window.innerHeight * 0.4;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= line) current = id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sectionIds]);

  const goTo = useCallback((id: string) => {
    setSheet(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  const toTop = () => {
    setSheet(false);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  /* Aparición al bajar */
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
  }, [cards.length, nearby.length, journal.length]);

  /* Menú móvil */
  useEffect(() => {
    const el = sheetRef.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (el) el.inert = !sheet;
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  /* --------------------------- Secuencia de portada ------------------------- */
  const heroImages = extras.heroImages?.filter(Boolean) ?? [];
  const sectorFrames: SectorFrame[] = config.sectorPhotos
    ? [config.sectorPhotos.hero, ...config.sectorPhotos.shots]
    : [];
  const roomShot = (i: number) => {
    const shots = config.sectorPhotos?.shots ?? [];
    return shots.length ? shots[i % shots.length] : undefined;
  };
  const slideCount = sectorFrames.length || heroImages.length || SCENE_ORDER.length;
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const useVideo = Boolean(extras.heroVideoUrl) && !videoFailed;

  useEffect(() => {
    if (prefersReducedMotion()) setPlaying(false);
  }, []);

  useEffect(() => {
    if (useVideo || !playing || slideCount < 2) return;
    const t = window.setInterval(() => setSlide((i) => (i + 1) % slideCount), SLIDE_MS);
    return () => window.clearInterval(t);
  }, [useVideo, playing, slideCount]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => setPlaying(false));
    } else v.pause();
  }, [playing, useVideo]);

  /* ------------------------ Habitaciones: filtro y ficha -------------------- */
  const tags = useMemo(() => Array.from(new Set(cards.map((c) => c.tag).filter(Boolean))) as string[], [cards]);
  const [filter, setFilter] = useState("all");
  const visible = useMemo(
    () => cards.map((c, i) => ({ c, i })).filter(({ c }) => filter === "all" || c.tag === filter),
    [cards, filter]
  );
  const [openCard, setOpenCard] = useState<number | null>(null);
  const active = openCard !== null ? cards[openCard] : null;
  const sceneFor = (i: number): SceneKind => (["habitacion", "jardin", "paramo", "laguna", "pueblo"] as SceneKind[])[i % 5];

  /* ----------------------------- Boyacá (índice) ---------------------------- */
  const [openNear, setOpenNear] = useState(0);

  /* --------------------------------- Vista ---------------------------------- */
  const year = new Date().getFullYear();
  const reveal = (n = 0) => ({
    className: styles.reveal,
    "data-reveal": true as const,
    style: n ? ({ "--d": `${n * 90}ms` } as CSSProperties) : undefined,
  });

  const slideAlt = (i: number) => (heroImages.length ? `${companyName}, fotografía ${i + 1}` : SCENE_CAPTION[SCENE_ORDER[i]]);

  return (
    <div className={styles.root} ref={rootRef}>
      {/* Barra superior */}
      <header className={styles.bar}>
        <div className={styles.barIn}>
          <button type="button" className={styles.menuBtn} onClick={() => setSheet(true)} aria-label="Abrir menú" aria-expanded={sheet}>
            {I.menu}
          </button>

          <nav className={styles.nav} aria-label="Secciones">
            <ul className={styles.navList}>
              {navItems.map((item, i) => {
                const id = target(item, i);
                const on = activeId === id;
                return (
                  <li key={`${item}-${i}`}>
                    <button type="button" className={`${styles.navLink}${on ? ` ${styles.navLinkOn}` : ""}`} aria-current={on ? "true" : undefined} onClick={() => goTo(id)}>
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button type="button" className={styles.brand} onClick={toTop} aria-label={`${companyName}. Ir al inicio`}>
            {companyName}
          </button>

          <div className={styles.barActions}>
            <button type="button" className={styles.textBtn} onClick={() => goTo("contacto-demo")}>
              Reservar ↗
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <div ref={sheetRef} className={`${styles.sheet}${sheet ? ` ${styles.sheetOpen}` : ""}`} role="dialog" aria-modal="true" aria-label="Menú" aria-hidden={!sheet}>
        <div className={styles.sheetHead}>
          <span className={styles.brandStatic}>{companyName}</span>
          <button type="button" className={styles.menuBtn} onClick={() => setSheet(false)} aria-label="Cerrar menú">
            {I.close}
          </button>
        </div>
        <ul className={styles.sheetList}>
          {navItems.map((item, i) => (
            <li key={`${item}-${i}`}>
              <button type="button" className={styles.sheetLink} onClick={() => goTo(target(item, i))}>
                <span>{item}</span>
                <span aria-hidden="true">↗</span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.sheetFoot}>
          <button type="button" className={`${styles.btn} ${styles.btnSolid}`} onClick={() => goTo("contacto-demo")}>
            {copy.contactCta}
          </button>
        </div>
      </div>

      {/* Portada */}
      <section className={styles.hero} id="inicio">
        <p className={styles.kicker}>{copy.heroKicker}</p>

        <div className={styles.wordmarkBox} ref={boxRef}>
          <h1 className={styles.wordmark} style={{ fontSize: `${wmSize}px` }} aria-label={companyName}>
            {lines.map((l, i) => (
              <span key={`${l}-${i}`} className={styles.wmLine} aria-hidden="true">
                {l}
              </span>
            ))}
          </h1>
          <span className={styles.wmMeasure} ref={measureRef} aria-hidden="true">
            {lines.map((l, i) => (
              <span key={`${l}-${i}`} className={styles.wmLine}>
                {l}
              </span>
            ))}
          </span>
        </div>

        <div className={styles.heroRow}>
          <p className={styles.lead}>{copy.heroLead}</p>
          <div className={styles.heroCtas}>
            <button type="button" className={`${styles.btn} ${styles.btnSolid}`} onClick={() => goTo("contacto-demo")}>
              {copy.contactCta}
            </button>
            <button type="button" className={styles.btn} onClick={() => goTo("habitaciones")}>
              Ver habitaciones
            </button>
          </div>
        </div>
      </section>

      {/* Secuencia visual */}
      <div className={styles.visualWrap}>
        <div className={styles.visual}>
          {useVideo ? (
            <video ref={videoRef} className={styles.visualVideo} src={extras.heroVideoUrl} muted loop playsInline autoPlay={!prefersReducedMotion()} onError={() => setVideoFailed(true)} />
          ) : (
            Array.from({ length: slideCount }, (_, i) => (
              <div key={i} className={`${styles.slide}${i === slide ? ` ${styles.slideOn}` : ""}`} aria-hidden={i === slide ? undefined : "true"}>
                <div className={`${styles.slideInner}${playing && i === slide ? ` ${styles.slideMoving}` : ""}`}>
                  <Photo src={sectorFrames[i]?.desktop ?? heroImages[i]} mobile={sectorFrames[i]?.mobile} kind={SCENE_ORDER[i % SCENE_ORDER.length]} seed={i + 3} alt={slideAlt(i)} className={styles.slideImg} />
                </div>
              </div>
            ))
          )}
          <span className={styles.badge}>· Boyacá, Colombia</span>
        </div>

        <div className={styles.visualBar}>
          <div className={styles.dots}>
            <button type="button" className={styles.textBtn} onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
              {playing ? "Pausar" : "Reproducir"}
            </button>
            {!useVideo
              ? Array.from({ length: slideCount }, (_, i) => (
                  <button key={i} type="button" className={`${styles.dot}${i === slide ? ` ${styles.dotOn}` : ""}`} onClick={() => setSlide(i)} aria-label={`Ver imagen ${i + 1}: ${slideAlt(i)}`} aria-current={i === slide ? "true" : undefined} />
                ))
              : null}
          </div>
          <span className={styles.caption}>
            {useVideo ? "Video de portada" : `${String(slide + 1).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")} · ${slideAlt(slide)}`}
          </span>
        </div>
      </div>

      <TourismOperationsSuite config={config} />

      {/* El hotel */}
      <section className={styles.section} id="hotel">
        <div className={styles.aboutGrid}>
          <div {...reveal()}>
            <p className={styles.label}>El hotel</p>
            <h2 className={styles.h2}>{copy.aboutTitle}</h2>
          </div>
          <div {...reveal(1)}>
            <p className={styles.body}>{copy.aboutBody}</p>
            <dl className={styles.facts}>
              {facts.map((f) => (
                <div key={f.label} className={styles.factRow}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Habitaciones */}
      <section className={styles.section} id="habitaciones">
        <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
          <div>
            <p className={styles.label}>Habitaciones y experiencias</p>
            <h2 className={styles.h2}>Dónde dormir en {companyName}</h2>
          </div>
          {tags.length > 1 ? (
            <div className={styles.tabs} role="tablist" aria-label="Filtrar por tipo">
              {["all", ...tags].map((t) => (
                <button key={t} type="button" role="tab" aria-selected={filter === t} className={`${styles.tab}${filter === t ? ` ${styles.tabOn}` : ""}`} onClick={() => setFilter(t)}>
                  {t === "all" ? "Todo" : t}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.collection}>
          {visible.map(({ c, i }, n) => {
            const featured = Boolean(c.featured) && filter === "all";
            return (
              <button
                key={`${c.title ?? "item"}-${i}`}
                type="button"
                className={`${styles.card} ${styles.reveal}${featured ? ` ${styles.cardFeatured}` : ""}${!featured && n % 3 === 2 ? ` ${styles.cardOffset}` : ""}`}
                data-reveal
                onClick={() => setOpenCard(i)}
                aria-haspopup="dialog"
              >
                <span className={styles.cardMedia}>
                  <Photo src={c.image ?? roomShot(i)?.desktop} mobile={c.image ? undefined : roomShot(i)?.mobile} kind={sceneFor(i)} seed={i + 11} alt={c.title ?? "Habitación"} className={styles.cardImg} />
                  {featured ? <span className={styles.badge}>· Destacado</span> : c.tag ? <span className={styles.badge}>{c.tag}</span> : null}
                  <span className={styles.cardOpen}>Ver ficha ↗</span>
                </span>
                <span className={styles.cardTitle}>{c.title}</span>
                <span className={styles.cardRow}>
                  <span className={styles.cardLoc}>{c.location}</span>
                  <span className={styles.cardPrice}>{c.price}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Diario */}
      <section className={styles.section} id="diario">
        <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
          <div>
            <p className={styles.label}>El diario</p>
            <h2 className={styles.h2}>Ideas para tu viaje</h2>
          </div>
          {usingDemoCopy ? <p className={styles.sample}>Textos de ejemplo. Reemplázalos con los tuyos.</p> : null}
        </div>
        <div className={styles.notes}>
          {journal.map((n, i) => (
            <article key={n.title} className={`${styles.note} ${styles.reveal}`} data-reveal style={{ "--d": `${i * 90}ms` } as CSSProperties}>
              <span className={styles.badgeInline}>{n.kind}</span>
              <h3 className={styles.noteTitle}>{n.title}</h3>
              <p className={styles.noteText}>{n.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pie */}
      <footer className={styles.footer} id="contacto-demo">
        <div className={styles.footGrid}>
          <div>
            <p className={styles.footName}>{companyName}</p>
            <p className={styles.footNote}>{copy.footerNote}</p>
            <span className={styles.demoBadge}>Demo local</span>
          </div>
          <div>
            <p className={styles.label}>Contacto</p>
            <ul className={styles.footList}>
              <li>
                <a className={styles.footLink} href={`mailto:${email}`}>
                  {email}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className={styles.label}>Explorar</p>
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
        </div>
        <div className={styles.footBase}>
          <span>
            © {year} {companyName}
          </span>
          <span>Boyacá · Colombia</span>
        </div>
      </footer>

      {/* Volver arriba */}
      <button type="button" className={`${styles.backTop}${showTop ? ` ${styles.backTopOn}` : ""}`} onClick={toTop} aria-label="Volver arriba" tabIndex={showTop ? 0 : -1}>
        {I.up}
      </button>

      {/* Ficha de habitación */}
      {active ? (
        <Modal label={active.title ?? "Habitación"} onClose={() => setOpenCard(null)} wide>
          <div className={styles.dialogMedia}>
            <Photo src={active.image ?? roomShot(openCard as number)?.desktop} mobile={active.image ? undefined : roomShot(openCard as number)?.mobile} kind={sceneFor(openCard as number)} seed={(openCard as number) + 11} alt={active.title ?? "Habitación"} className={styles.cardImg} />
          </div>
          <div className={styles.dialogBody}>
            {active.tag ? <p className={styles.label}>{active.tag}</p> : null}
            <h3 className={styles.dialogTitle}>{active.title}</h3>
            <p className={styles.dialogText}>
              {active.description ?? `Ficha de demostración de ${companyName}. Aquí va la descripción: camas, vista, baño, desayuno incluido y lo que hace especial este espacio.`}
            </p>
            <dl className={styles.facts}>
              {active.location ? (
                <div className={styles.factRow}>
                  <dt>Ubicación</dt>
                  <dd>{active.location}</dd>
                </div>
              ) : null}
              {active.price ? (
                <div className={styles.factRow}>
                  <dt>Tarifa</dt>
                  <dd>{active.price}</dd>
                </div>
              ) : null}
              <div className={styles.factRow}>
                <dt>Hotel</dt>
                <dd>{companyName}</dd>
              </div>
            </dl>
            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSolid}`}
                onClick={() => {
                  setOpenCard(null);
                  window.setTimeout(() => goTo("contacto-demo"), 60);
                }}
              >
                Consultar disponibilidad
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

    </div>
  );
}
