"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import type { SiteConfig } from "@/types/site";
import { SectorImg } from "@/components/templates/SectorImg";
import { SolutionBlock } from "@/components/templates/SolutionBlock";
import styles from "./agro.module.css";

/* ============================================================================
   AGROINDUSTRIA — landing a pantalla completa (referencia: Arva)

   Mantiene el contrato anterior:
   · Props: <AgroindustriaTemplate config={config} />
   · Contenido: companyName y templateCopy { nav, heroKicker, heroLead,
     aboutTitle, aboutBody, cards[], sustainability, contactCta, footerNote }.
   · Ancla #contacto-demo en el pie.

   Novedades:
   · Portada con video de fondo (con póster y respaldo si el video falla).
   · El nombre viene del formulario (config.companyName), sin edición en la página.
   · Opcionales en el config (todos tienen valor por defecto):
       heroVideoUrl, heroPoster, productImages[], impactImage, ctaImage,
       stats[], testimonials[]
   ========================================================================== */

type AgroCard = {
  tag?: string;
  title?: string;
  location?: string;
  price?: string;
  image?: string;
  description?: string;
};

type Stat = { to: number; label: string; prefix?: string; suffix?: string; decimals?: number };
type Testimonial = { quote: string; name: string; role: string };

type AgroExtras = {
  heroVideoUrl?: string;
  heroPoster?: string;
  productImages?: string[];
  impactImage?: string;
  ctaImage?: string;
  stats?: Stat[];
  testimonials?: Testimonial[];
};

type Props = {
  config: SiteConfig;
};

/* Archivos por defecto: copiar la carpeta /media a public/media del proyecto. */
const MEDIA = {
  video: "/media/hero-campo.mp4",
  poster: "/media/hero-campo.jpg",
  products: ["/media/cosecha.jpg", "/media/campo-verde.jpg", "/media/finca.jpg", "/media/hojas.jpg", "/media/hero-campo.jpg"],
  impact: "/media/hojas.jpg",
  cta: "/media/finca.jpg",
};

const DEFAULT_STATS: Stat[] = [
  { to: 40, suffix: " ha", label: "en producción" },
  { to: 18, label: "familias productoras aliadas" },
  { to: 62, suffix: "%", label: "de la energía de planta es solar" },
  { to: 100, suffix: "%", label: "del agua de lavado se recircula" },
];

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote: "Nos entregan siempre a tiempo y con la calidad pactada. Ya no tenemos que revisar cada lote.",
    name: "Marcela Rojas",
    role: "Compras, central de abastos",
  },
  {
    quote: "Trabajar con ellos nos dio precios claros desde la siembra. Eso cambió cómo planeamos el año.",
    name: "Andrés Pineda",
    role: "Productor aliado",
  },
  {
    quote: "La trazabilidad por lote nos facilitó entrar a mercados que antes nos pedían papeles que no teníamos.",
    name: "Lucía Herrera",
    role: "Exportadora de fruta",
  },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----------------------------------- Iconos ---------------------------------- */

const I = {
  leaf: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 3C7 3 3 6 3 10.5c0 1 .3 1.9.9 2.5C5 9.5 7.5 7.5 10 6.5 8 8 6.3 10 5.3 12.6c.8.3 1.6.4 2.2.4C11.5 13 13 8.5 13 3Z" fill="currentColor" />
    </svg>
  ),
  right: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  left: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 8h-11M7 3.5 2.5 8 7 12.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  rightBig: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 5.5h14M2 12.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  pause: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <rect x="2" y="1.5" width="3" height="9" rx="1" />
      <rect x="7" y="1.5" width="3" height="9" rx="1" />
    </svg>
  ),
  play: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M3 1.8v8.4L10 6 3 1.8Z" />
    </svg>
  ),
};

/* --------------------------- Fotografía con respaldo -------------------------- */

function Photo({ src, mobile, alt, className, caption }: { src?: string; mobile?: string; alt: string; className: string; caption: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src, mobile]);

  if (!src || failed) {
    return (
      <div className={styles.photoFallback} role="img" aria-label={alt}>
        {caption}
      </div>
    );
  }
  return <SectorImg desktop={src} mobile={mobile} alt={alt} className={className} onError={() => setFailed(true)} />;
}

/* ---------------------------- Número que sube al verse ------------------------ */

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
          const p = Math.min(1, (now - start) / 1600);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(stat.to * eased);
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

  const d = stat.decimals ?? 0;
  const text = value.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <span ref={ref} className={styles.statNum} aria-label={`${stat.prefix ?? ""}${stat.to}${stat.suffix ?? ""}`}>
      <span aria-hidden="true">
        {stat.prefix}
        {text}
        {stat.suffix}
      </span>
    </span>
  );
}

/* ------------------------- Ventana modal accesible ---------------------------- */

function Modal({
  label,
  onClose,
  wide,
  children,
}: {
  label: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const box = boxRef.current;
    const focusables = () =>
      Array.from(
        box?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []
      ).filter((el) => !el.hasAttribute("disabled"));

    const auto = box?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0];
    auto?.focus();

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
      <div
        ref={boxRef}
        className={`${styles.dialog}${wide ? ` ${styles.dialogWide}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
          {I.close}
        </button>
        {children}
      </div>
    </div>
  );
}

/* ================================= Plantilla ================================== */

export function AgroindustriaTemplate({ config }: Props) {
  const copy = config.templateCopy;
  const extras = config as SiteConfig & AgroExtras;
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const companyName = (config.companyName ?? "").replace(/\s+/g, " ").trim() || "Tu empresa";

  /* ------------------------------ Contenido --------------------------------- */
  const cards = useMemo(() => (copy?.cards ?? []) as unknown as AgroCard[], [copy?.cards]);
  const navItems = useMemo(() => (copy?.nav ?? []) as string[], [copy?.nav]);
  const hasSustain = Boolean(copy?.sustainability);
  const stats = extras.stats?.length ? extras.stats : DEFAULT_STATS;
  const usingDemoStats = !extras.stats?.length;
  const quotes = extras.testimonials?.length ? extras.testimonials : DEFAULT_TESTIMONIALS;
  const usingDemoQuotes = !extras.testimonials?.length;
  const productImages = extras.productImages?.length ? extras.productImages : MEDIA.products;
  const tags = useMemo(() => Array.from(new Set(cards.map((c) => c.tag).filter(Boolean))) as string[], [cards]);

  const sections = useMemo(() => {
    const list = [
      { id: "inicio" },
      { id: "nosotros" },
      { id: "productos" },
    ];
    if (hasSustain) list.push({ id: "impacto" });
    list.push({ id: "socios" }, { id: "contacto-demo" });
    return list;
  }, [hasSustain]);

  /* ------------------------------- Scroll ----------------------------------- */
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("inicio");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const line = window.scrollY + window.innerHeight * 0.4;
      let current = sections[0].id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= line) current = s.id;
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
  }, [sections]);

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
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cards.length, hasSustain, quotes.length]);

  /* ----------------------------- Menú móvil --------------------------------- */
  const [sheet, setSheet] = useState(false);

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

  /* ------------------------------ Video de portada -------------------------- */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoSrc = extras.heroVideoUrl ?? (config.sectorPhotos?.hero ? undefined : MEDIA.video);
  const posterSrc = config.sectorPhotos?.hero.desktop ?? extras.heroPoster ?? MEDIA.poster;
  const posterMobile = extras.heroPoster ? undefined : config.sectorPhotos?.hero.mobile;

  useEffect(() => {
    if (prefersReducedMotion()) setPlaying(false);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [playing, videoFailed]);

  /* ------------------------------ Ficha de producto ------------------------- */
  const [openCard, setOpenCard] = useState<number | null>(null);
  const active = openCard !== null ? cards[openCard] : null;
  const shotAt = (i: number) => {
    const shots = config.sectorPhotos?.shots ?? [];
    return shots.length ? shots[i % shots.length] : undefined;
  };
  const imageFor = (card: AgroCard, i: number) => {
    if (card.image) return { src: card.image, mobile: undefined as string | undefined };
    const shot = shotAt(i);
    if (shot) return { src: shot.desktop, mobile: shot.mobile };
    return { src: productImages[i % productImages.length], mobile: undefined as string | undefined };
  };

  /* ------------------------------ Testimonios ------------------------------- */
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const syncArrows = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 4);
    setCanNext(t.scrollLeft + t.clientWidth < t.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncArrows();
    window.addEventListener("resize", syncArrows);
    return () => window.removeEventListener("resize", syncArrows);
  }, [syncArrows, quotes.length]);

  const slide = (dir: 1 | -1) => {
    const t = trackRef.current;
    if (!t) return;
    const first = t.firstElementChild as HTMLElement | null;
    const step = (first?.offsetWidth ?? 380) + 20;
    t.scrollBy({ left: dir * step, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  /* --------------------------------- Vista ---------------------------------- */
  const len = companyName.length;
  const heroStyle = {
    "--hero-k": len <= 12 ? 9.5 : len <= 22 ? 7 : 5.4,
    "--hero-min": len > 26 ? "30px" : len > 16 ? "38px" : "46px",
  } as CSSProperties;

  const year = new Date().getFullYear();

  const reveal = (n = 0): { className: string; "data-reveal": boolean; style?: CSSProperties } => ({
    className: styles.reveal,
    "data-reveal": true,
    style: n ? ({ "--d": `${n * 90}ms` } as CSSProperties) : undefined,
  });

  return (
    <div className={styles.root} ref={rootRef}>
      {/* Aviso superior */}
      <div className={styles.notice}>{copy.heroKicker}</div>

      {/* Navegación */}
      <header className={`${styles.nav}${scrolled ? ` ${styles.navScrolled}` : ""}`}>
        <div className={styles.navBar}>
          <button type="button" className={styles.logo} onClick={toTop} aria-label={`${companyName}. Ir al inicio`}>
            <span className={styles.logoMark}>{I.leaf}</span>
            <span className={styles.logoText}>{companyName}</span>
          </button>

          <nav aria-label="Secciones">
            <ul className={styles.navLinks}>
              {navItems.map((item, i) => {
                const target = sections[Math.min(i, sections.length - 1)].id;
                const on = activeId === target;
                return (
                  <li key={`${item}-${i}`}>
                    <button
                      type="button"
                      className={`${styles.navLink}${on ? ` ${styles.navLinkOn}` : ""}`}
                      aria-current={on ? "true" : undefined}
                      onClick={() => goTo(target)}
                    >
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.navActions}>
            <button type="button" className={`${styles.btn} ${styles.btnLeaf} ${styles.btnSm} ${styles.navHide}`} onClick={() => goTo("contacto-demo")}>
              {copy.contactCta}
            </button>
            <button type="button" className={styles.burger} onClick={() => setSheet(true)} aria-label="Abrir menú" aria-expanded={sheet}>
              {I.menu}
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <div ref={sheetRef} className={`${styles.sheet}${sheet ? ` ${styles.sheetOpen}` : ""}`} role="dialog" aria-modal="true" aria-label="Menú" aria-hidden={!sheet}>
        <div className={styles.sheetHead}>
          <span className={styles.logo}>
            <span className={styles.logoMark}>{I.leaf}</span>
            <span className={styles.logoText}>{companyName}</span>
          </span>
          <button type="button" className={styles.burger} onClick={() => setSheet(false)} aria-label="Cerrar menú">
            {I.close}
          </button>
        </div>
        <ul className={styles.sheetList}>
          {navItems.map((item, i) => (
            <li key={`${item}-${i}`}>
              <button type="button" className={styles.sheetLink} onClick={() => goTo(sections[Math.min(i, sections.length - 1)].id)}>
                {item}
                {I.rightBig}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.sheetFoot}>
          <button type="button" className={`${styles.btn} ${styles.btnLeaf}`} onClick={() => goTo("contacto-demo")}>
            {copy.contactCta}
          </button>
        </div>
      </div>

      {/* Portada */}
      <section className={styles.hero} id="inicio" style={heroStyle}>
        <div className={styles.heroMedia} aria-hidden="true">
          {videoFailed || !videoSrc ? (
            <Photo src={posterSrc} mobile={posterMobile} alt="" caption="" className={styles.heroPoster} />
          ) : (
            <video
              ref={videoRef}
              className={styles.heroVideo}
              src={videoSrc}
              poster={posterSrc}
              muted
              loop
              playsInline
              autoPlay={!prefersReducedMotion()}
              preload="auto"
              onError={() => setVideoFailed(true)}
            />
          )}
        </div>
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{companyName}</h1>
          <p className={styles.heroLead}>{copy.heroLead}</p>
          <div className={styles.heroCtas}>
            <button type="button" className={`${styles.btn} ${styles.btnLeaf}`} onClick={() => goTo("contacto-demo")}>
              {copy.contactCta} <span className={styles.arrow}>{I.right}</span>
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => goTo("productos")}>
              Ver productos
            </button>
          </div>
        </div>

        <button type="button" className={styles.scrollHint} onClick={() => goTo("nosotros")}>
          Desliza para explorar
          <span className={styles.scrollLine} aria-hidden="true" />
        </button>

        {videoSrc && !videoFailed ? (
          <button type="button" className={styles.playBtn} onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
            {playing ? I.pause : I.play}
            {playing ? "Pausar video" : "Reproducir video"}
          </button>
        ) : null}
      </section>

      <SolutionBlock solution={config.solution} tone="agroindustria" site={config} />

      {/* Propósito */}
      <section className={styles.section} id="nosotros">
        <div className={styles.wrap}>
          <div className={styles.purpose}>
            <div {...reveal()}>
              <p className={styles.eyebrow}>Quiénes somos</p>
              <h2 className={styles.h2}>{copy.aboutTitle}</h2>
            </div>
            <div className={`${styles.purposeSide} ${styles.reveal}`} data-reveal style={{ "--d": "120ms" } as CSSProperties}>
              <p className={styles.lead}>{copy.aboutBody}</p>
              {tags.length ? (
                <div className={styles.pills}>
                  {tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={styles.pill}
                      style={{ cursor: "pointer" }}
                      onClick={() => goTo("productos")}
                    >
                      <span className={styles.pillDot} aria-hidden="true" />
                      {t}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Productos */}
      <section className={styles.section} id="productos">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
            <div>
              <p className={styles.eyebrow}>Productos</p>
              <h2 className={styles.h2}>
                Lo que produce
                <br />
                {companyName}
              </h2>
            </div>
            <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => goTo("contacto-demo")}>
              {copy.contactCta} <span className={styles.arrow}>{I.right}</span>
            </button>
          </div>

          <div className={styles.grid}>
            {cards.map((card, i) => (
              <button
                key={`${card.title ?? "producto"}-${i}`}
                type="button"
                className={`${styles.card} ${styles.reveal}`}
                data-reveal
                style={{ "--d": `${(i % 3) * 90}ms` } as CSSProperties}
                onClick={() => setOpenCard(i)}
                aria-haspopup="dialog"
              >
                <span className={styles.cardMedia}>
                  <Photo src={imageFor(card, i).src} mobile={imageFor(card, i).mobile} alt={card.title ?? "Producto"} caption={card.title ?? "Producto"} className={styles.cardImg} />
                  {card.tag ? <span className={styles.cardTag}>{card.tag}</span> : null}
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{card.title}</span>
                  <span className={styles.cardRow}>
                    <span>{card.location}</span>
                    <span className={styles.cardPrice}>{card.price}</span>
                  </span>
                  <span className={styles.cardGo}>
                    Ver detalle <span className={styles.arrow}>{I.right}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Impacto */}
      {hasSustain ? (
        <section className={styles.impact} id="impacto">
          <Photo src={extras.impactImage ?? shotAt(0)?.desktop ?? MEDIA.impact} mobile={extras.impactImage ? undefined : shotAt(0)?.mobile} alt="" caption="" className={styles.impactBg} />
          <div className={styles.impactShade} aria-hidden="true" />
          <div className={styles.wrap}>
            <div {...reveal()}>
              <p className={`${styles.eyebrow} ${styles.eyebrowLight}`}>Sostenibilidad</p>
              <h2 className={styles.impactTitle}>Nuestro impacto</h2>
              <p className={styles.impactText}>{copy.sustainability}</p>
            </div>
            <div className={styles.stats}>
              {stats.map((s) => (
                <div key={s.label}>
                  <CountUp stat={s} />
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
            {usingDemoStats ? <p className={styles.sample}>Cifras de ejemplo. Reemplázalas con las de tu empresa.</p> : null}
          </div>
        </section>
      ) : null}

      {/* Socios */}
      <section className={styles.section} id="socios">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
            <div>
              <p className={styles.eyebrow}>Socios</p>
              <h2 className={styles.h2}>
                Lo que dicen quienes
                <br />
                trabajan con nosotros
              </h2>
            </div>
            <div className={styles.arrows}>
              <button type="button" className={styles.roundBtn} onClick={() => slide(-1)} disabled={!canPrev} aria-label="Anterior">
                {I.left}
              </button>
              <button type="button" className={styles.roundBtn} onClick={() => slide(1)} disabled={!canNext} aria-label="Siguiente">
                {I.rightBig}
              </button>
            </div>
          </div>

          <div className={styles.quotes} ref={trackRef} onScroll={syncArrows} tabIndex={0} aria-label="Testimonios">
            {quotes.map((q) => (
              <figure key={q.name} className={styles.quote}>
                <blockquote className={styles.quoteText} style={{ margin: 0 }}>
                  “{q.quote}”
                </blockquote>
                <figcaption className={styles.quoteWho}>
                  <span className={styles.avatar} aria-hidden="true">
                    {q.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>
                    <span className={styles.quoteName}>{q.name}</span>
                    <span className={styles.quoteRole}>{q.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          {usingDemoQuotes ? (
            <p className={styles.help} style={{ marginTop: 18 }}>
              Testimonios de ejemplo. Reemplázalos con los de tus clientes.
            </p>
          ) : null}
        </div>
      </section>

      {/* Cierre */}
      <section className={styles.cta}>
        <Photo src={extras.ctaImage ?? shotAt(1)?.desktop ?? config.sectorPhotos?.hero.desktop ?? MEDIA.cta} mobile={extras.ctaImage ? undefined : shotAt(1)?.mobile ?? config.sectorPhotos?.hero.mobile} alt="" caption="" className={styles.ctaBg} />
        <h2 className={styles.ctaTitle}>
          Comienza a trabajar con <em>{companyName}</em>
        </h2>
        <div className={styles.ctaRow}>
          <a className={`${styles.btn} ${styles.btnLeaf}`} href="#contacto-demo">
            {copy.contactCta} <span className={styles.arrow}>{I.right}</span>
          </a>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => goTo("productos")}>
            Ver productos
          </button>
        </div>
      </section>

      {/* Pie */}
      <footer className={styles.footer} id="contacto-demo">
        <div className={styles.wrap}>
          <div className={styles.footGrid}>
            <div>
              <p className={styles.footLogo}>{companyName}</p>
              <p className={styles.footNote}>{copy.footerNote}</p>
            </div>
            <div>
              <p className={styles.footTitle}>Explorar</p>
              <ul className={styles.footList}>
                {navItems.map((item, i) => (
                  <li key={`${item}-${i}`}>
                    <button type="button" className={styles.footLink} onClick={() => goTo(sections[Math.min(i, sections.length - 1)].id)}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.footTitle}>Navegación</p>
              <ul className={styles.footList}>
                <li>
                  <button type="button" className={styles.footLink} onClick={toTop}>
                    Volver arriba
                  </button>
                </li>
              </ul>
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

      {/* Ficha de producto */}
      {active ? (
        <Modal label={active.title ?? "Producto"} onClose={() => setOpenCard(null)} wide>
          <div className={styles.dialogMedia}>
            <Photo src={imageFor(active, openCard as number).src} mobile={imageFor(active, openCard as number).mobile} alt={active.title ?? "Producto"} caption={active.title ?? "Producto"} className={styles.cardImg} />
          </div>
          <div className={styles.dialogBody}>
            {active.tag ? <p className={styles.eyebrow} style={{ margin: 0 }}>{active.tag}</p> : null}
            <h3 className={styles.dialogTitle}>{active.title}</h3>
            <p className={styles.dialogText}>
              {active.description ??
                `Ficha de demostración de ${companyName}. Aquí va la descripción del producto: presentación, variedad, empaque y disponibilidad.`}
            </p>
            <dl className={styles.facts}>
              {active.location ? (
                <div className={styles.fact}>
                  <dt>Origen</dt>
                  <dd>{active.location}</dd>
                </div>
              ) : null}
              {active.price ? (
                <div className={styles.fact}>
                  <dt>Precio</dt>
                  <dd>{active.price}</dd>
                </div>
              ) : null}
              <div className={styles.fact}>
                <dt>Productor</dt>
                <dd>{companyName}</dd>
              </div>
            </dl>
            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDark}`}
                onClick={() => {
                  setOpenCard(null);
                  window.setTimeout(() => goTo("contacto-demo"), 60);
                }}
              >
                {copy.contactCta} <span className={styles.arrow}>{I.right}</span>
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

    </div>
  );
}