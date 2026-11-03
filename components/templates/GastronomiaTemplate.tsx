"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import type { SiteConfig } from "@/types/site";
import { SectorImg } from "@/components/templates/SectorImg";
import { SolutionBlock } from "@/components/templates/SolutionBlock";
import styles from "./gastronomia.module.css";

/* ============================================================================
   GASTRONOMÍA — restaurante en Boyacá (referencia: amritpalace.com)

   Mismo contrato que las otras plantillas:
   · <GastronomiaTemplate config={config} />
   · config.companyName y config.templateCopy { nav, heroKicker, heroLead,
     aboutTitle, aboutBody, cards[], contactCta, footerNote }.

   EL NOMBRE viene del formulario (config.companyName), sin botón de edición
   dentro del sitio: cuando el formulario cambia el valor, todo se actualiza
   (barra, portada, carta, reservas, pie) y el nombre gigante de la portada
   se ajusta solo al ancho, sin importar si es corto o largo.

   Opcionales (config as extras): heroImage, since, rating, statement,
   drinks[], events[], reviews[], locations[], email, phone, reserveTimes[],
   y por plato: image, description, veg.
   ========================================================================== */

type Dish = { tag?: string; title?: string; location?: string; price?: string; image?: string; description?: string; veg?: boolean };
type Drink = { title: string; price: string; text?: string };
type EventItem = { title: string; text: string };
type Review = { text: string; author: string; source: string };
type Place = { name: string; address: string; phone?: string; hours: string[] };

type Extras = {
  heroImage?: string;
  since?: number;
  rating?: { score: number; count: number; source?: string };
  statement?: string;
  drinks?: Drink[];
  events?: EventItem[];
  reviews?: Review[];
  locations?: Place[];
  email?: string;
  phone?: string;
  reserveTimes?: string[];
};

const DEFAULT_DRINKS: Drink[] = [
  { title: "Chicha de maíz", price: "$9.000", text: "Fermentada en casa, servida fría." },
  { title: "Canelazo", price: "$12.000", text: "Aguardiente, panela y canela, caliente." },
  { title: "Masato", price: "$8.000", text: "Arroz fermentado, clavos y canela." },
  { title: "Limonada de panela", price: "$7.000", text: "Con hierbabuena del patio." },
  { title: "Café de Boyacá", price: "$6.000", text: "Origen local, tostión media." },
  { title: "Agua de panela con queso", price: "$7.500", text: "Como en la finca." },
];

const DEFAULT_EVENTS: EventItem[] = [
  { title: "Buffets para celebraciones", text: "Montaje completo para bodas, grados y reuniones familiares." },
  { title: "Equipo de servicio", text: "Meseros y cocineros que se encargan de todo, para que tú disfrutes." },
  { title: "Años de experiencia", text: "Atendemos eventos de 20 a 300 personas con cocina boyacense." },
];

const DEFAULT_REVIEWS: Review[] = [
  { text: "El cocido boyacense es como el de mi abuela. La atención fue cálida y el lugar es hermoso.", author: "Camila R.", source: "Google" },
  { text: "Fuimos en familia desde Bogotá. La trucha estaba perfecta y el postre de cuajada, increíble.", author: "Andrés M.", source: "TripAdvisor" },
  { text: "Hicimos nuestro matrimonio aquí. Todo salió impecable y la comida encantó a los invitados.", author: "Laura y Felipe", source: "Google" },
  { text: "Ambiente tranquilo, buen precio y porciones generosas. Volveremos en el próximo viaje.", author: "Javier T.", source: "Instagram" },
];

const DEFAULT_PLACES: Place[] = [
  { name: "Sede principal", address: "Calle 10 # 5-20, Centro, Boyacá", phone: "+57 300 000 0000", hours: ["Mar a Sáb · 12:00 – 21:00", "Domingo · 12:00 – 17:00", "Lunes · cerrado"] },
];

const DEFAULT_TIMES = ["12:00", "12:30", "13:00", "13:30", "14:00", "18:00", "18:30", "19:00", "19:30", "20:00"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function targetFor(label: string, index: number, ids: string[]): string {
  const t = label.toLowerCase();
  const rules: [RegExp, string][] = [
    [/inicio|home/, "inicio"],
    [/carta|men[uú]|plato|comida|cocina/, "carta"],
    [/bebida|trago|coctel|c[oó]ctel/, "bebidas"],
    [/evento|catering|celebra|banquete/, "eventos"],
    [/nosotros|historia|qui[eé]nes|acerca/, "nosotros"],
    [/opini|rese[nñ]a|testimon/, "opiniones"],
    [/reserv|mesa|cotiz/, "reservas"],
    [/contact|ubic|horario|visit/, "contacto-demo"],
  ];
  for (const [re, id] of rules) if (re.test(t) && ids.includes(id)) return id;
  return ids[Math.min(index, ids.length - 1)];
}

const I = {
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  star: (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.2l2 4.3 4.7.6-3.4 3.2.9 4.7L8 11.7l-4.2 2.3.9-4.7L1.3 6.1 6 5.5z" fill="currentColor" />
    </svg>
  ),
  leaf: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 13C3 7 7 3 13 3c0 6-4 10-10 10Zm0 0 6-6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
};

/* ============================ Ilustraciones planas ============================ */
/* Naturalezas muertas planas sobre fondo oscuro (sin degradados, como pide el
   sistema). Se usan cuando no hay fotografías. */

type SceneKind = "hall" | "bowl" | "plate" | "tray" | "glass";
const DISH_KINDS: SceneKind[] = ["bowl", "plate", "tray", "glass"];

function Scene({ kind, seed = 0, label }: { kind: SceneKind; seed?: number; label: string }) {
  const P = "#d8cbb8";
  const L = "#bfb4a3";
  const W = "#978e81";
  const S = "#d49653";
  const E = "#615b53";
  let body: ReactNode = null;
  const x = (seed * 37) % 60;

  if (kind === "hall") {
    body = (
      <>
        <rect width="1600" height="900" fill="#292622" />
        {[220, 520, 820, 1120, 1420].map((cx, i) => (
          <path key={i} d={`M${cx - 70} 560 V330 a70 70 0 0 1 140 0 V560Z`} fill="none" stroke={E} strokeWidth="2" opacity={0.7} />
        ))}
        <rect x="0" y="600" width="1600" height="300" fill="#211f1b" />
        <rect x="0" y="600" width="1600" height="2" fill={E} />
        <rect x="140" y="640" width="1320" height="22" fill={P} opacity="0.9" />
        {[360, 800, 1240].map((cx, i) => (
          <g key={i}>
            <ellipse cx={cx} cy="712" rx="130" ry="26" fill={L} />
            <ellipse cx={cx} cy="708" rx="82" ry="15" fill={P} />
          </g>
        ))}
        {[580, 1020].map((cx, i) => (
          <g key={i}>
            <rect x={cx - 11} y="520" width="22" height="120" fill={P} />
            <ellipse cx={cx} cy="496" rx="9" ry="22" fill={S} />
            <ellipse cx={cx} cy="500" rx="4" ry="12" fill="#f0d9b0" />
          </g>
        ))}
      </>
    );
  } else if (kind === "bowl") {
    body = (
      <>
        <rect width="800" height="600" fill="#292622" />
        <path d={`M${240 + x} 330 h${320 - x * 2} a${160 - x} 170 0 0 1 -${160 - x} 170 a${160 - x} 170 0 0 1 -${160 - x} -170Z`} fill={P} />
        <ellipse cx="400" cy="330" rx={160 - x} ry="34" fill={L} />
        <ellipse cx="400" cy="330" rx={132 - x} ry="22" fill={S} opacity="0.92" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${350 + i * 50} 280 q-14 -34 0 -66 q14 -34 0 -66`} fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" />
        ))}
        <circle cx="440" cy="326" r="9" fill={P} />
        <rect x="150" y="500" width="500" height="3" fill={E} />
      </>
    );
  } else if (kind === "plate") {
    body = (
      <>
        <rect width="800" height="600" fill="#292622" />
        <circle cx="400" cy="320" r="220" fill={P} />
        <circle cx="400" cy="320" r="176" fill="none" stroke={L} strokeWidth="3" />
        <ellipse cx={360 + x / 2} cy="320" rx="96" ry="64" fill={S} />
        <ellipse cx="470" cy="360" rx="60" ry="40" fill={L} />
        <ellipse cx="440" cy="270" rx="46" ry="26" fill={W} />
        <circle cx="352" cy="300" r="7" fill={P} />
        <circle cx="388" cy="338" r="6" fill={P} />
        <rect x="90" y="150" width="8" height="340" fill={L} />
        <rect x="700" y="150" width="8" height="340" fill={L} />
      </>
    );
  } else if (kind === "tray") {
    body = (
      <>
        <rect width="800" height="600" fill="#292622" />
        <rect x="110" y="140" width="580" height="330" fill={P} />
        <rect x="126" y="156" width="548" height="298" fill="none" stroke={L} strokeWidth="3" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={215 + i * 123} cy={235 + (i % 2) * 90} r="52" fill={i % 2 ? L : "#292622"} />
            <circle cx={215 + i * 123} cy={235 + (i % 2) * 90} r="34" fill={i % 2 ? S : W} />
          </g>
        ))}
        <rect x="160" y="400" width="480" height="10" fill={S} />
      </>
    );
  } else {
    body = (
      <>
        <rect width="800" height="600" fill="#292622" />
        <path d="M290 120 H510 L474 500 H326Z" fill="none" stroke={P} strokeWidth="4" />
        <path d={`M${300 + x / 4} 230 H${500 - x / 4} L474 500 H326Z`} fill={S} opacity="0.95" />
        <rect x="240" y="500" width="320" height="6" fill={L} />
        <path d="M470 60 L420 400" stroke={P} strokeWidth="8" strokeLinecap="round" />
        <circle cx="520" cy="130" r="26" fill="none" stroke={L} strokeWidth="4" />
        <circle cx="360" cy="320" r="8" fill={P} />
        <circle cx="410" cy="360" r="6" fill={P} />
      </>
    );
  }

  return (
    <svg className={styles.scene} viewBox={kind === "hall" ? "0 0 1600 900" : "0 0 800 600"} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      {body}
    </svg>
  );
}

/* Foto con respaldo: si falla o no hay, se dibuja la ilustración */
function Photo({ src, mobile, kind, seed, label }: { src?: string; mobile?: string; kind: SceneKind; seed?: number; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src, mobile]);
  if (src && !failed) {
    return <SectorImg className={styles.photo} desktop={src} mobile={mobile} alt={label} onError={() => setFailed(true)} />;
  }
  return <Scene kind={kind} seed={seed} label={label} />;
}

/* ====================== Nombre gigante que se ajusta ========================== */

function splitName(name: string): string[] {
  const words = name.split(" ").filter(Boolean);
  if (words.length < 2) return [name];
  let best = 1;
  let diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/* Mide el nombre en una y en dos líneas y usa la versión que queda más grande.
   Si aun así no cabe (una sola palabra enorme), parte la palabra. */
function Wordmark({ name }: { name: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const oneRef = useRef<HTMLSpanElement>(null);
  const twoRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ size: number; two: boolean; wrap: boolean }>({ size: 96, two: false, wrap: false });
  const split = useMemo(() => splitName(name), [name]);
  const canSplit = split.length > 1;

  const measure = useCallback(() => {
    const box = boxRef.current;
    const one = oneRef.current;
    const two = twoRef.current;
    if (!box || !one) return;
    const w = box.clientWidth;
    const size1 = (w * 100) / Math.max(1, one.offsetWidth);
    let widest2 = 1;
    two?.querySelectorAll<HTMLElement>("span").forEach((s) => (widest2 = Math.max(widest2, s.offsetWidth)));
    const size2 = canSplit ? (w * 100) / widest2 : 0;
    const useTwo = canSplit && size2 > size1 * 1.3;
    const raw = Math.floor(useTwo ? size2 : size1);
    setFit({ size: Math.max(20, Math.min(199, raw)), two: useTwo, wrap: raw < 20 });
  }, [canSplit]);

  useLayoutEffect(() => {
    measure();
    const box = boxRef.current;
    const ro = typeof ResizeObserver !== "undefined" && box ? new ResizeObserver(measure) : null;
    if (box) ro?.observe(box);
    window.addEventListener("resize", measure);
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready.then(measure).catch(() => undefined);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, name]);

  const lines = fit.two ? split : [name];
  return (
    <div ref={boxRef} className={styles.wordBox}>
      <div className={styles.wordMeasure} aria-hidden="true">
        <span ref={oneRef}>{name}</span>
        <div ref={twoRef} className={styles.wordMeasureTwo}>
          {split.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
      <h1 className={styles.wordmark} style={{ fontSize: `${fit.size}px` }} aria-label={name}>
        {lines.map((l) => (
          <span key={l} className={`${styles.wordLine}${fit.wrap ? ` ${styles.wordWrap}` : ""}`} aria-hidden="true">
            {l}
          </span>
        ))}
      </h1>
    </div>
  );
}

/* ------------------------- Ventana modal accesible ---------------------------- */

function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const box = boxRef.current;
    const focusables = () =>
      Array.from(box?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((el) => !el.hasAttribute("disabled"));
    focusables()[0]?.focus();
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
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={boxRef} className={styles.dialog} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
          {I.close}
        </button>
        {children}
      </div>
    </div>
  );
}

/* ================================ Plantilla =================================== */

export function GastronomiaTemplate({ config }: { config: SiteConfig }) {
  const copy = config.templateCopy as typeof config.templateCopy & { statement?: string };
  const extras = config as SiteConfig & Extras;
  const sectorShots = config.sectorPhotos?.shots ?? [];
  const shotAt = (i: number) => (sectorShots.length ? sectorShots[i % sectorShots.length] : undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* El nombre sale del formulario; si llega vacío se muestra un genérico */
  const companyName = (config.companyName ?? "").replace(/\s+/g, " ").trim() || "Tu restaurante";

  const dishes = useMemo(() => (copy?.cards ?? []) as unknown as Dish[], [copy?.cards]);
  const navItems = useMemo(() => (copy?.nav ?? []) as string[], [copy?.nav]);
  const drinks = extras.drinks?.length ? extras.drinks : DEFAULT_DRINKS;
  const events = extras.events?.length ? extras.events : DEFAULT_EVENTS;
  const reviews = extras.reviews?.length ? extras.reviews : DEFAULT_REVIEWS;
  const usingDemoReviews = !extras.reviews?.length;
  const places = extras.locations?.length ? extras.locations : DEFAULT_PLACES;
  const times = extras.reserveTimes?.length ? extras.reserveTimes : DEFAULT_TIMES;
  const email = extras.email ?? "hola@ejemplo.co";
  const phone = extras.phone ?? places[0]?.phone ?? "+57 300 000 0000";
  const rating = extras.rating ?? { score: 4.8, count: 1240, source: "Google" };
  const since = extras.since ?? 1996;
  const statement = extras.statement ?? copy?.statement ?? "El espíritu de la cocina boyacense";

  const sectionIds = useMemo(() => ["inicio", "carta", "bebidas", "eventos", "nosotros", "opiniones", "reservas", "contacto-demo"], []);
  const target = useCallback((label: string, i: number) => targetFor(label, i, sectionIds), [sectionIds]);

  /* Estado de interfaz */
  const [menu, setMenu] = useState(false);
  const [solid, setSolid] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 80);
      setShowTop(window.scrollY > 800);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const goTo = useCallback((id: string) => {
    setMenu(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }), 30);
  }, []);
  const toTop = () => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

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

  useEffect(() => {
    const host = rootRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(host.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add(styles.revealOn);
            io.unobserve(en.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dishes.length, drinks.length, reviews.length]);

  const reveal = (n = 0) => ({ className: styles.reveal, "data-reveal": true as const, style: n ? ({ "--d": `${n * 90}ms` } as CSSProperties) : undefined });

  /* ------------------------------- Carta ------------------------------------ */
  const tags = useMemo(() => Array.from(new Set(dishes.map((d) => d.tag).filter(Boolean))) as string[], [dishes]);
  const [filter, setFilter] = useState("Todo");
  useEffect(() => setFilter("Todo"), [tags.join("|")]);
  const [openDish, setOpenDish] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const dish = openDish !== null ? dishes[openDish] : null;
  const togglePick = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const visible = dishes.map((d, i) => ({ d, i })).filter(({ d }) => filter === "Todo" || d.tag === filter);
  const marquee = dishes.map((d) => d.title).filter(Boolean) as string[];

  /* ------------------------------ Reservas ---------------------------------- */
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [r, setR] = useState({ place: 0, date: "", time: times[0], people: 2, who: "", phone: "", notes: "" });
  const [rErr, setRErr] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const setF = <K extends keyof typeof r>(k: K, v: (typeof r)[K]) => {
    setR((s) => ({ ...s, [k]: v }));
    if (rErr[k as string]) setRErr((e) => ({ ...e, [k as string]: "" }));
  };

  const submitReserve = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!r.date) errs.date = "Elige una fecha.";
    else if (r.date < todayStr) errs.date = "La fecha no puede ser anterior a hoy.";
    if (r.who.trim().length < 2) errs.who = "Escribe tu nombre.";
    if (!/^[+\d][\d\s()-]{6,}$/.test(r.phone.trim())) errs.phone = "Escribe un teléfono válido.";
    setRErr(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      window.setTimeout(() => document.getElementById(`gas-r-${first}`)?.focus(), 0);
      return;
    }
    setSent(true);
    setToast("Reserva de demostración lista");
  };

  const dateLabel = r.date
    ? new Date(`${r.date}T12:00:00`).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const year = today.getFullYear();

  return (
    <div className={styles.root} ref={rootRef}>
      {/* Barra */}
      <header className={`${styles.top}${solid ? ` ${styles.topSolid}` : ""}`}>
        <div className={styles.topIn}>
          <button type="button" className={styles.logo} onClick={toTop} aria-label={`${companyName}. Ir al inicio`}>
            <span className={styles.logoMark} aria-hidden="true" />
            <span className={styles.logoText}>{companyName}</span>
          </button>
          <nav className={styles.topNav} aria-label="Secciones">
            {navItems.map((item, i) => (
              <button key={`${item}-${i}`} type="button" className={styles.navLink} onClick={() => goTo(target(item, i))}>
                {item}
              </button>
            ))}
          </nav>
          <div className={styles.topActions}>
            <button type="button" className={`${styles.btn} ${styles.hideSm}`} onClick={() => goTo("reservas")}>
              Reservar mesa
            </button>
            <button type="button" className={styles.menuBtn} onClick={() => setMenu(true)} aria-haspopup="dialog" aria-expanded={menu}>
              Menú
            </button>
          </div>
        </div>
      </header>

      {/* Menú superpuesto */}
      <div ref={menuRef} className={`${styles.menu}${menu ? ` ${styles.menuOpen}` : ""}`} role="dialog" aria-modal="true" aria-label="Menú" aria-hidden={!menu}>
        <div className={styles.menuHead}>
          <span className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            <span className={styles.logoText}>{companyName}</span>
          </span>
          <button type="button" className={styles.menuBtn} onClick={() => setMenu(false)}>
            Cerrar {I.close}
          </button>
        </div>
        <ul className={styles.menuList}>
          {navItems.map((item, i) => (
            <li key={`${item}-${i}`}>
              <button type="button" className={styles.menuLink} onClick={() => goTo(target(item, i))}>
                <span className={styles.menuNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.menuText}>{item}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.menuFoot}>
          <button type="button" className={`${styles.btn} ${styles.btnLight}`} onClick={() => goTo("reservas")}>
            {copy.contactCta}
          </button>
          <span className={styles.menuSmall}>{phone}</span>
        </div>
      </div>

      {/* Portada */}
      <section className={styles.hero} id="inicio">
        <div className={styles.heroMedia} aria-hidden="true">
          <Photo src={extras.heroImage ?? config.sectorPhotos?.hero.desktop} mobile={extras.heroImage ? undefined : config.sectorPhotos?.hero.mobile} kind="hall" label="" />
          <div className={styles.heroShade} />
        </div>

        <div className={styles.heroOverlay}>
          <div className={styles.heroMeta}>
            <span className={styles.meta}>{copy.heroKicker}</span>
            <span className={styles.meta}>Desde {since}</span>
          </div>

          <div className={styles.heroMain}>
            <Wordmark name={companyName} />
            <div className={styles.heroRow}>
              <p className={styles.lead}>{copy.heroLead}</p>
              <div className={styles.heroSide}>
                <div className={styles.ratingRow} aria-label={`Calificación ${rating.score} de 5`}>
                  <span className={styles.stars} aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <span key={n}>{I.star}</span>
                    ))}
                  </span>
                  <span className={styles.ratingText}>
                    {rating.score.toLocaleString("es-CO", { minimumFractionDigits: 1 })}/5 · {rating.count.toLocaleString("es-CO")} reseñas en {rating.source ?? "Google"}
                  </span>
                </div>
                <div className={styles.heroBtns}>
                  <button type="button" className={`${styles.btn} ${styles.btnLight}`} onClick={() => goTo("carta")}>
                    Ver la carta
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnLight}`} onClick={() => goTo("reservas")}>
                    {copy.contactCta}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SolutionBlock solution={config.solution} tone="gastronomia" site={config} />

      {/* Cinta de platos */}
      {marquee.length ? (
        <div className={styles.marquee} aria-hidden="true">
          <div className={styles.marqueeTrack}>
            {[0, 1].map((k) => (
              <ul key={k} className={styles.marqueeList}>
                {marquee.map((m, i) => (
                  <li key={`${m}-${i}`} className={styles.marqueeItem}>
                    {m}
                    <span className={styles.dot} />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      ) : null}

      {/* Espíritu */}
      <section className={styles.spirit} id="nosotros">
        <div className={styles.wrap}>
          <div className={styles.spiritGrid}>
            <div {...reveal()}>
              <p className={styles.caption}>Nuestra historia</p>
              <h2 className={styles.h2}>{copy.aboutTitle}</h2>
            </div>
            <div {...reveal(1)}>
              <p className={styles.bodyLg}>{statement}</p>
              <p className={styles.body}>{copy.aboutBody}</p>
              <button type="button" className={styles.btn} onClick={() => goTo("carta")}>
                Conocer la carta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Carta */}
      <section className={styles.section} id="carta">
        <div className={styles.wrap}>
          <hr className={styles.rule} />
          <div className={`${styles.head} ${styles.reveal}`} data-reveal>
            <div>
              <p className={styles.caption}>Platos de la casa</p>
              <h2 className={styles.h2}>Nuestra carta</h2>
            </div>
            {tags.length > 1 ? (
              <div className={styles.filters} role="group" aria-label="Filtrar platos">
                {["Todo", ...tags].map((t) => (
                  <button key={t} type="button" className={`${styles.tagBtn}${filter === t ? ` ${styles.tagOn}` : ""}`} aria-pressed={filter === t} onClick={() => setFilter(t)}>
                    {t}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <ul className={styles.dishGrid}>
            {visible.map(({ d, i }, n) => (
              <li key={`${d.title ?? "p"}-${i}`} className={styles.reveal} data-reveal style={{ "--d": `${(n % 4) * 70}ms` } as CSSProperties}>
                <button type="button" className={styles.dish} onClick={() => setOpenDish(i)} aria-haspopup="dialog">
                  <span className={styles.dishImg}>
                    <Photo src={d.image ?? shotAt(i)?.desktop} mobile={d.image ? undefined : shotAt(i)?.mobile} kind={DISH_KINDS[i % DISH_KINDS.length]} seed={i} label={d.title ?? "Plato"} />
                    {picked.includes(i) ? <span className={styles.pickedTag}>En tu visita</span> : null}
                  </span>
                  <span className={styles.dishTop}>
                    <span className={styles.caption}>{d.tag}</span>
                    {d.veg ? (
                      <span className={styles.veg}>
                        {I.leaf} Vegetariano
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.dishName}>{d.title}</span>
                  <span className={styles.dishBottom}>
                    <span className={styles.dishLoc}>{d.location}</span>
                    <span className={styles.dishPrice}>{d.price}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => goTo("bebidas")}>
              Ver bebidas
            </button>
            <button type="button" className={styles.btn} onClick={() => goTo("reservas")}>
              Reservar mesa
            </button>
          </div>
        </div>
      </section>

      {/* Eventos (catering) */}
      <section className={styles.dark} id="eventos">
        <div className={styles.wrap}>
          <div className={`${styles.head} ${styles.reveal}`} data-reveal>
            <div>
              <p className={`${styles.caption} ${styles.captionLight}`}>Eventos y catering</p>
              <h2 className={`${styles.h2} ${styles.h2Light}`}>Llevamos el fogón a tu celebración</h2>
            </div>
          </div>
          <ul className={styles.eventGrid}>
            {events.map((ev, i) => (
              <li key={ev.title} {...reveal(i)}>
                <div className={styles.eventImg}>
                  <Photo
                    src={shotAt(i + 2)?.desktop}
                    mobile={shotAt(i + 2)?.mobile}
                    kind={(["tray", "hall", "plate"] as SceneKind[])[i % 3]}
                    seed={i + 3}
                    label={ev.title}
                  />
                </div>
                <h3 className={styles.eventTitle}>{ev.title}</h3>
                <p className={styles.eventText}>{ev.text}</p>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <button type="button" className={`${styles.btn} ${styles.btnLight}`} onClick={() => goTo("contacto-demo")}>
              Cotizar un evento
            </button>
          </div>
        </div>
      </section>

      {/* Bebidas */}
      <section className={styles.section} id="bebidas">
        <div className={styles.wrap}>
          <div className={styles.drinkGrid}>
            <div {...reveal()}>
              <p className={styles.caption}>Para acompañar</p>
              <h2 className={styles.h2}>Bebidas</h2>
              <div className={styles.drinkImg}>
                <Scene kind="glass" seed={2} label="Bebida de la casa" />
              </div>
            </div>
            <ul className={styles.drinkList}>
              {drinks.map((d, i) => (
                <li key={d.title} className={styles.reveal} data-reveal style={{ "--d": `${(i % 6) * 60}ms` } as CSSProperties}>
                  <div className={styles.drinkRow}>
                    <span className={styles.drinkName}>{d.title}</span>
                    <span className={styles.leader} aria-hidden="true" />
                    <span className={styles.dishPrice}>{d.price}</span>
                  </div>
                  {d.text ? <p className={styles.drinkText}>{d.text}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Opiniones */}
      <section className={`${styles.section} ${styles.linen}`} id="opiniones">
        <div className={styles.wrap}>
          <div className={`${styles.head} ${styles.reveal}`} data-reveal>
            <div>
              <p className={styles.caption}>Lo que dicen nuestros comensales</p>
              <h2 className={styles.h2}>Opiniones</h2>
            </div>
            <p className={styles.score}>
              <span className={styles.scoreNum}>{rating.score.toLocaleString("es-CO", { minimumFractionDigits: 1 })}</span>
              <span className={styles.caption}>{rating.count.toLocaleString("es-CO")} reseñas</span>
            </p>
          </div>
          <ul className={styles.reviewRow}>
            {reviews.map((rv, i) => (
              <li key={`${rv.author}-${i}`} className={`${styles.review} ${styles.reveal}`} data-reveal style={{ "--d": `${(i % 4) * 70}ms` } as CSSProperties}>
                <span className={styles.reviewSource}>{rv.source}</span>
                <span className={styles.stars} aria-label="5 de 5 estrellas">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <span key={n}>{I.star}</span>
                  ))}
                </span>
                <p className={styles.reviewText}>{rv.text}</p>
                <span className={styles.reviewAuthor}>{rv.author}</span>
              </li>
            ))}
          </ul>
          {usingDemoReviews ? <p className={styles.sample}>Opiniones de ejemplo. Reemplázalas por reseñas reales de tus clientes.</p> : null}
        </div>
      </section>

      {/* Reservas */}
      <section className={styles.section} id="reservas">
        <div className={styles.wrap}>
          <div className={styles.reserveGrid}>
            <div {...reveal()}>
              <p className={styles.caption}>Reservas</p>
              <h2 className={styles.h2}>Reserva tu mesa en {companyName}</h2>
              <p className={styles.body}>Elige día, hora y cuántas personas son. Es una demostración: no se envía ni se cobra nada.</p>
              {picked.length ? (
                <div className={styles.pickedBox}>
                  <p className={styles.caption}>Platos que quieres probar</p>
                  <div className={styles.chips}>
                    {picked.map((i) => (
                      <button key={i} type="button" className={styles.chip} onClick={() => togglePick(i)} aria-label={`Quitar ${dishes[i]?.title}`}>
                        {dishes[i]?.title} {I.close}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div {...reveal(1)}>
              {sent ? (
                <div className={styles.confirm} role="status">
                  <p className={styles.caption}>Reserva lista</p>
                  <h3 className={styles.confirmTitle}>Gracias, {r.who.trim().split(" ")[0]}.</h3>
                  <dl className={styles.summary}>
                    <div className={styles.sumRow}>
                      <dt>Restaurante</dt>
                      <dd>{companyName}</dd>
                    </div>
                    {places.length > 1 ? (
                      <div className={styles.sumRow}>
                        <dt>Sede</dt>
                        <dd>{places[r.place]?.name}</dd>
                      </div>
                    ) : null}
                    <div className={styles.sumRow}>
                      <dt>Día</dt>
                      <dd>{dateLabel}</dd>
                    </div>
                    <div className={styles.sumRow}>
                      <dt>Hora</dt>
                      <dd>{r.time}</dd>
                    </div>
                    <div className={styles.sumRow}>
                      <dt>Personas</dt>
                      <dd>{r.people}</dd>
                    </div>
                    {picked.length ? (
                      <div className={styles.sumRow}>
                        <dt>Platos</dt>
                        <dd>{picked.map((i) => dishes[i]?.title).join(", ")}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className={styles.help}>Te llamaríamos al {r.phone.trim()} para confirmar. Esto es solo una demostración.</p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.btn} onClick={() => setSent(false)}>
                      Cambiar reserva
                    </button>
                  </div>
                </div>
              ) : (
                <form className={styles.form} onSubmit={submitReserve} noValidate>
                  {places.length > 1 ? (
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="gas-r-place">
                        Sede
                      </label>
                      <select id="gas-r-place" className={styles.input} value={r.place} onChange={(e) => setF("place", Number(e.target.value))}>
                        {places.map((p, i) => (
                          <option key={p.name} value={i}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="gas-r-date">
                        Día
                      </label>
                      <input id="gas-r-date" type="date" min={todayStr} className={`${styles.input}${rErr.date ? ` ${styles.inputBad}` : ""}`} value={r.date} onChange={(e) => setF("date", e.target.value)} aria-invalid={rErr.date ? true : undefined} />
                      {rErr.date ? <p className={styles.error} role="alert">{rErr.date}</p> : null}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="gas-r-time">
                        Hora
                      </label>
                      <select id="gas-r-time" className={styles.input} value={r.time} onChange={(e) => setF("time", e.target.value)}>
                        {times.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label} id="gas-people-label">
                      Personas
                    </span>
                    <div className={styles.stepper} role="group" aria-labelledby="gas-people-label">
                      <button type="button" className={styles.stepBtn} onClick={() => setF("people", Math.max(1, r.people - 1))} aria-label="Una persona menos" disabled={r.people <= 1}>
                        −
                      </button>
                      <output className={styles.stepVal} aria-live="polite">
                        {r.people}
                      </output>
                      <button type="button" className={styles.stepBtn} onClick={() => setF("people", Math.min(12, r.people + 1))} aria-label="Una persona más" disabled={r.people >= 12}>
                        +
                      </button>
                      <span className={styles.help}>{r.people >= 12 ? "Para grupos grandes, escríbenos." : "Hasta 12 personas."}</span>
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="gas-r-who">
                        Tu nombre
                      </label>
                      <input id="gas-r-who" className={`${styles.input}${rErr.who ? ` ${styles.inputBad}` : ""}`} value={r.who} onChange={(e) => setF("who", e.target.value)} autoComplete="name" aria-invalid={rErr.who ? true : undefined} />
                      {rErr.who ? <p className={styles.error} role="alert">{rErr.who}</p> : null}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="gas-r-phone">
                        Teléfono
                      </label>
                      <input id="gas-r-phone" type="tel" className={`${styles.input}${rErr.phone ? ` ${styles.inputBad}` : ""}`} value={r.phone} onChange={(e) => setF("phone", e.target.value)} autoComplete="tel" aria-invalid={rErr.phone ? true : undefined} />
                      {rErr.phone ? <p className={styles.error} role="alert">{rErr.phone}</p> : null}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="gas-r-notes">
                      <span>Notas (alergias, cumpleaños…)</span>
                      <span className={styles.count}>{r.notes.length}/300</span>
                    </label>
                    <textarea id="gas-r-notes" rows={3} maxLength={300} className={styles.input} value={r.notes} onChange={(e) => setF("notes", e.target.value)} />
                  </div>

                  <div className={styles.actions}>
                    <button type="submit" className={`${styles.btn} ${styles.btnSolid}`}>
                      {copy.contactCta}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pie / ubicación */}
      <footer className={styles.footer} id="contacto-demo">
        <div className={styles.wrap}>
          <p className={styles.footBig}>{companyName}</p>
          <hr className={`${styles.rule} ${styles.ruleLight}`} />
          <div className={styles.footGrid}>
            <div>
              <p className={`${styles.caption} ${styles.captionLight}`}>Dónde estamos</p>
              {places.map((p) => (
                <div key={p.name} className={styles.place}>
                  <p className={styles.placeName}>{p.name}</p>
                  <p className={styles.footText}>{p.address}</p>
                  {p.phone ? <p className={styles.footText}>{p.phone}</p> : null}
                  <ul className={styles.hours}>
                    {p.hours.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div>
              <p className={`${styles.caption} ${styles.captionLight}`}>Explorar</p>
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
              <p className={`${styles.caption} ${styles.captionLight}`}>Escríbenos</p>
              <a className={styles.footLink} href={`mailto:${email}`}>
                {email}
              </a>
              <p className={styles.footNote}>{copy.footerNote}</p>
            </div>
          </div>
          <div className={styles.footBase}>
            <span>
              © {year} {companyName}
            </span>
            <span>Sitio de demostración</span>
          </div>
        </div>
      </footer>

      <button type="button" className={`${styles.backTop}${showTop ? ` ${styles.backTopOn}` : ""}`} onClick={toTop} aria-label="Volver arriba" tabIndex={showTop ? 0 : -1}>
        ↑
      </button>

      {dish ? (
        <Modal label={dish.title ?? "Plato"} onClose={() => setOpenDish(null)}>
          <div className={styles.dlgImg}>
            <Photo src={dish.image ?? shotAt(openDish ?? 0)?.desktop} mobile={dish.image ? undefined : shotAt(openDish ?? 0)?.mobile} kind={DISH_KINDS[(openDish ?? 0) % DISH_KINDS.length]} seed={openDish ?? 0} label={dish.title ?? "Plato"} />
          </div>
          <div className={styles.dlgBody}>
            <p className={styles.caption}>{dish.tag}</p>
            <h3 className={styles.dlgTitle}>{dish.title}</h3>
            <p className={styles.body}>
              {dish.description ?? `Receta de la casa de ${companyName}, preparada con ingredientes de la región. Pregunta por el punto de cocción y los acompañamientos.`}
            </p>
            <dl className={styles.summary}>
              {dish.location ? (
                <div className={styles.sumRow}>
                  <dt>Origen</dt>
                  <dd>{dish.location}</dd>
                </div>
              ) : null}
              {dish.price ? (
                <div className={styles.sumRow}>
                  <dt>Precio</dt>
                  <dd>{dish.price}</dd>
                </div>
              ) : null}
            </dl>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${picked.includes(openDish ?? -1) ? styles.btnSolid : ""}`} aria-pressed={picked.includes(openDish ?? -1)} onClick={() => togglePick(openDish ?? 0)}>
                {picked.includes(openDish ?? -1) ? "Quitar de mi visita" : "Añadir a mi visita"}
              </button>
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  setOpenDish(null);
                  goTo("reservas");
                }}
              >
                Reservar mesa {I.arrow}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      <div aria-live="polite">
        {toast ? (
          <div className={styles.toast} key={toast}>
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}
