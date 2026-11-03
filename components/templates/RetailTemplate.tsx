"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import type { SiteConfig } from "@/types/site";
import type { SectorFrame } from "@/lib/site/sector-gallery";
import { SectorImg } from "@/components/templates/SectorImg";
import { SolutionBlock } from "@/components/templates/SolutionBlock";
import styles from "./retail.module.css";

/* ============================================================================
   RETAIL — tienda para cualquier rubro (canasta familiar, ferretería,
   materiales de construcción, hogar…). Estructura de tienda en línea:
   barra de aviso, cabecera con buscador y carrito, banner rotativo, categorías,
   catálogo con filtros, ofertas, beneficios, nosotros y pie.

   Mismo contrato que las otras plantillas:
   · <RetailTemplate config={config} />
   · config.companyName y config.templateCopy { nav, heroKicker, heroLead,
     aboutTitle, aboutBody, cards[], contactCta, footerNote }. Ancla
     #contacto-demo en el pie.
   · Cada card es un PRODUCTO: tag = categoría, title = nombre,
     location = presentación/marca, price = precio ("$7.800").

   EL NOMBRE viene del formulario (config.companyName), sin botón de edición.

   Opcionales por producto: oldPrice, badge, image, description.
   Opcionales en config: slides[], benefits[], freeShippingFrom (número),
   whatsapp, email, phone, address, hours, nameSuggestions (no se usa).
   ========================================================================== */

type Product = { tag?: string; title?: string; location?: string; price?: string; oldPrice?: string; badge?: string; image?: string; description?: string };
type Slide = { kicker: string; title: string; text: string; cta: string; target: string };
type Benefit = { title: string; text: string };
type Extras = {
  slides?: Slide[];
  benefits?: Benefit[];
  freeShippingFrom?: number;
  whatsapp?: string;
  email?: string;
  phone?: string;
  address?: string;
  hours?: string;
};

const DEFAULT_BENEFITS: Benefit[] = [
  { title: "Entrega a domicilio", text: "Llevamos tu pedido a la puerta, en tu barrio o en tu obra." },
  { title: "Recoge en tienda", text: "Pide hoy y recoge sin hacer fila." },
  { title: "Pago al recibir", text: "Paga en efectivo o transferencia cuando llegue." },
  { title: "Cambios sin drama", text: "Si algo no es lo que pediste, lo cambiamos." },
];

const prefersReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const num = (s?: string) => Number((s ?? "").replace(/[^\d]/g, "")) || 0;
const money = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function targetFor(label: string, index: number, ids: string[]): string {
  const t = label.toLowerCase();
  const rules: [RegExp, string][] = [
    [/inicio|home/, "inicio"],
    [/categor/, "categorias"],
    [/producto|cat[aá]logo|tienda|comprar|art[ií]culo/, "productos"],
    [/oferta|promo|descuento/, "ofertas"],
    [/nosotros|empresa|qui[eé]nes|historia/, "nosotros"],
    [/contact|ayuda|ubic|sedes?/, "contacto-demo"],
  ];
  for (const [re, id] of rules) if (re.test(t) && ids.includes(id)) return id;
  return ids[Math.min(index + 1, ids.length - 1)];
}

const I = {
  close: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="currentColor" strokeWidth="1.8" /></svg>),
  search: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12.5 12.5 16 16" stroke="currentColor" strokeWidth="1.8" /></svg>),
  cart: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M1.5 2.5h3l2 10h9l1.8-7H5.3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="8" cy="16.5" r="1.4" fill="currentColor" /><circle cx="14.5" cy="16.5" r="1.4" fill="currentColor" /></svg>),
  menu: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" strokeWidth="1.8" /></svg>),
  arrow: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" /></svg>),
  left: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 2.5 4.5 8l5.5 5.5" stroke="currentColor" strokeWidth="1.8" /></svg>),
  right: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2.5 11.5 8 6 13.5" stroke="currentColor" strokeWidth="1.8" /></svg>),
  check: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.3 3.3L13 5" stroke="currentColor" strokeWidth="2" /></svg>),
  truck: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M2 7h14v12H2zM16 11h5l4 4v4h-9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="8" cy="20.5" r="2.3" fill="var(--paper)" stroke="currentColor" strokeWidth="1.7" /><circle cx="21" cy="20.5" r="2.3" fill="var(--paper)" stroke="currentColor" strokeWidth="1.7" /></svg>),
  store: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M3 10 5 4h18l2 6M3 10h22v14H3zM11 24v-8h6v8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>),
  cash: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2.5" y="7" width="23" height="14" stroke="currentColor" strokeWidth="1.7" /><circle cx="14" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.7" /></svg>),
  swap: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 10h17l-4-4M23 18H6l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>),
};
const BENEFIT_ICONS = [I.truck, I.store, I.cash, I.swap];

/* ========================== Ilustraciones de producto ========================= */
/* Formas planas y genéricas (costal, botella, caja, ladrillo, lata, cartón).
   Se usan cuando el producto no trae foto. */

type Kind = "sack" | "bottle" | "box" | "brick" | "can" | "carton";
const KINDS: Kind[] = ["sack", "bottle", "box", "brick", "can", "carton"];
const TINTS = ["#e8efe6", "#f3e9d9", "#e4ecf5", "#f4e1de", "#ece6f3", "#e6f0ef"];
const INKS = ["#2f6b4f", "#b5651d", "#2b5ea8", "#b23a30", "#6b4aa0", "#1f7a74"];

/* Elige la forma según palabras del nombre; si no, rota */
function kindFor(title: string | undefined, i: number): Kind {
  const t = norm(title ?? "");
  if (/cemento|arroz|harina|azucar|sal |abono|cal |arena|costal|bulto|papa/.test(t + " ")) return "sack";
  if (/ladrillo|bloque|teja|adoquin|tolete/.test(t)) return "brick";
  if (/aceite|leche|jabon|agua|detergente|suavizante|gaseosa|jugo|liquido|cloro|botella/.test(t)) return "bottle";
  if (/pintura|atun|lata|conserva|sardina|galon/.test(t)) return "can";
  if (/huevo|caja|cuaderno|paquete|pasta|cereal/.test(t)) return "box";
  return KINDS[i % KINDS.length];
}

function Art({ kind, i, label }: { kind: Kind; i: number; label: string }) {
  const tint = TINTS[i % TINTS.length];
  const ink = INKS[i % INKS.length];
  let body: ReactNode = null;
  if (kind === "sack") {
    body = (<><path d="M70 60 Q100 40 130 60 L150 190 Q100 210 50 190Z" fill={ink} /><path d="M70 60 Q100 78 130 60" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" /><rect x="68" y="108" width="64" height="40" rx="4" fill="#fff" fillOpacity=".92" /><rect x="76" y="118" width="48" height="6" fill={ink} /><rect x="76" y="130" width="30" height="5" fill={ink} fillOpacity=".5" /></>);
  } else if (kind === "bottle") {
    body = (<><rect x="88" y="34" width="24" height="26" rx="4" fill={ink} /><path d="M82 60 H118 Q132 76 132 100 V186 Q132 196 122 196 H78 Q68 196 68 186 V100 Q68 76 82 60Z" fill={ink} fillOpacity=".92" /><rect x="68" y="108" width="64" height="52" fill="#fff" fillOpacity=".92" /><rect x="78" y="120" width="44" height="6" fill={ink} /><rect x="78" y="133" width="28" height="5" fill={ink} fillOpacity=".5" /></>);
  } else if (kind === "box") {
    body = (<><path d="M50 80 L100 58 L150 80 V160 L100 184 L50 160Z" fill={ink} /><path d="M50 80 L100 102 L150 80" stroke="#fff" strokeOpacity=".55" strokeWidth="3" fill="none" /><path d="M100 102 V184" stroke="#fff" strokeOpacity=".55" strokeWidth="3" /><rect x="112" y="118" width="26" height="22" fill="#fff" fillOpacity=".9" /></>);
  } else if (kind === "brick") {
    body = (<><rect x="34" y="104" width="132" height="52" rx="3" fill={ink} /><rect x="34" y="104" width="132" height="12" fill="#fff" fillOpacity=".18" />{[62, 90, 118, 146].map((x) => (<circle key={x} cx={x} cy="132" r="7" fill={tint} fillOpacity=".75" />))}<rect x="52" y="64" width="96" height="36" rx="3" fill={ink} fillOpacity=".78" /></>);
  } else if (kind === "can") {
    body = (<><rect x="62" y="64" width="76" height="120" rx="6" fill={ink} /><ellipse cx="100" cy="64" rx="38" ry="9" fill="#fff" fillOpacity=".55" /><rect x="62" y="104" width="76" height="40" fill="#fff" fillOpacity=".92" /><rect x="72" y="116" width="56" height="6" fill={ink} /><rect x="72" y="128" width="34" height="5" fill={ink} fillOpacity=".5" /></>);
  } else {
    body = (<><path d="M64 70 L100 54 L136 70 V186 H64Z" fill={ink} /><path d="M64 70 L100 86 L136 70" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" /><rect x="76" y="108" width="48" height="44" rx="4" fill="#fff" fillOpacity=".92" /><rect x="84" y="120" width="32" height="6" fill={ink} /><rect x="84" y="132" width="20" height="5" fill={ink} fillOpacity=".5" /></>);
  }
  return (
    <svg className={styles.art} viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <rect width="200" height="240" fill={tint} />
      <ellipse cx="100" cy="206" rx="56" ry="8" fill="#000" fillOpacity=".08" />
      {body}
    </svg>
  );
}

function Pic({ p, i, frame }: { p: Product; i: number; frame?: SectorFrame }) {
  const [bad, setBad] = useState(false);
  const own = p.image && !p.image.startsWith("data:") ? p.image : undefined;
  const src = own ?? frame?.desktop;
  useEffect(() => setBad(false), [src, frame?.mobile]);
  if (src && !bad) return <SectorImg className={styles.photo} desktop={src} mobile={own ? undefined : frame?.mobile} alt={p.title ?? "Producto"} onError={() => setBad(true)} />;
  return <Art kind={kindFor(p.title, i)} i={i} label={p.title ?? "Producto"} />;
}

/* ------------------------- Panel / ventana accesible -------------------------- */

function Layer({ label, onClose, side, children }: { label: string; onClose: () => void; side?: boolean; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const box = boxRef.current;
    const focusables = () => Array.from(box?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((el) => !el.hasAttribute("disabled"));
    (box?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0])?.focus();
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

function Qty({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className={styles.qty} role="group" aria-label={`Cantidad de ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label={`Quitar una unidad de ${label}`}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(99, value + 1))} aria-label={`Agregar una unidad de ${label}`}>+</button>
    </div>
  );
}

/* ================================ Plantilla =================================== */

export function RetailTemplate({ config }: { config: SiteConfig }) {
  const copy = config.templateCopy;
  const extras = config as SiteConfig & Extras;
  const rootRef = useRef<HTMLDivElement>(null);

  /* El nombre sale del formulario */
  const companyName = (config.companyName ?? "").replace(/\s+/g, " ").trim() || "Tu tienda";

  const products = useMemo(() => (copy?.cards ?? []) as unknown as Product[], [copy?.cards]);
  const sectorFrames = config.sectorPhotos ? [config.sectorPhotos.hero, ...config.sectorPhotos.shots] : [];
  const frameAt = (i: number) => (sectorFrames.length ? sectorFrames[i % sectorFrames.length] : undefined);
  const navItems = useMemo(() => (copy?.nav ?? []) as string[], [copy?.nav]);
  const benefits = extras.benefits?.length ? extras.benefits : DEFAULT_BENEFITS;
  const freeFrom = extras.freeShippingFrom ?? 150000;
  const email = extras.email ?? "pedidos@ejemplo.co";
  const phone = extras.phone ?? "+57 300 000 0000";
  const address = extras.address ?? "Calle 10 # 5-20, Boyacá";
  const hours = extras.hours ?? "Lunes a sábado · 7:00 – 19:00";

  const cats = useMemo(() => Array.from(new Set(products.map((p) => p.tag).filter(Boolean))) as string[], [products]);
  const deals = useMemo(() => products.map((p, i) => ({ p, i })).filter(({ p }) => num(p.oldPrice) > num(p.price) && num(p.price) > 0), [products]);

  const ids = useMemo(() => ["inicio", "categorias", "productos", ...(deals.length ? ["ofertas"] : []), "nosotros", "contacto-demo"], [deals.length]);
  const target = useCallback((label: string, i: number) => targetFor(label, i, ids), [ids]);

  /* ------------------------------ Interfaz ----------------------------------- */
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => { setShowTop(window.scrollY > 900); setStuck(window.scrollY > 120); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const goTo = useCallback((id: string) => {
    setMenu(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }), 30);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  useEffect(() => {
    const host = rootRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(host.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add(styles.revealOn); io.unobserve(en.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [products.length, deals.length]);

  const reveal = (n = 0, extra = "") => ({ className: extra ? `${styles.reveal} ${extra}` : styles.reveal, "data-reveal": true as const, style: n ? ({ "--d": `${n * 80}ms` } as CSSProperties) : undefined });

  /* ------------------------------- Banner ------------------------------------ */
  const slides: Slide[] = useMemo(() => {
    if (extras.slides?.length) return extras.slides;
    return [
      { kicker: copy.heroKicker, title: `Todo lo que necesitas en ${companyName}`, text: copy.heroLead, cta: "Ver productos", target: "productos" },
      deals.length
        ? { kicker: "Ofertas de la semana", title: "Precios que sí rinden", text: "Aprovecha los descuentos en productos de uso diario.", cta: "Ver ofertas", target: "ofertas" }
        : { kicker: "Catálogo", title: "Encuentra por categoría", text: "Filtra, busca y compara precios en segundos.", cta: "Ver categorías", target: "categorias" },
      { kicker: "Pedidos fáciles", title: "Pide hoy, recibe o recoge", text: `Arma tu pedido y envíalo por WhatsApp a ${companyName}. Sin registro.`, cta: "Armar mi pedido", target: "@cart" },
    ];
  }, [extras.slides, copy.heroKicker, copy.heroLead, companyName, deals.length]);
  const [slide, setSlide] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hoverBanner, setHoverBanner] = useState(false);
  useEffect(() => { if (slide >= slides.length) setSlide(0); }, [slides.length, slide]);
  useEffect(() => {
    if (!auto || hoverBanner || prefersReducedMotion() || slides.length < 2) return;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % slides.length), 6500);
    return () => window.clearInterval(t);
  }, [auto, hoverBanner, slides.length]);

  /* ------------------------------ Catálogo ----------------------------------- */
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todo");
  const [sort, setSort] = useState("rel");
  const [limit, setLimit] = useState(8);
  const [sugOpen, setSugOpen] = useState(false);
  const [view, setView] = useState<number | null>(null);

  useEffect(() => { setCat("Todo"); }, [cats.join("|")]);
  useEffect(() => { setLimit(8); }, [q, cat, sort]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    let out = products.map((p, i) => ({ p, i })).filter(({ p }) => (cat === "Todo" || p.tag === cat) && (!nq || norm(`${p.title ?? ""} ${p.tag ?? ""} ${p.location ?? ""}`).includes(nq)));
    if (sort === "asc") out = [...out].sort((a, b) => num(a.p.price) - num(b.p.price));
    if (sort === "desc") out = [...out].sort((a, b) => num(b.p.price) - num(a.p.price));
    return out;
  }, [products, q, cat, sort]);
  const suggestions = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return [];
    return products.map((p, i) => ({ p, i })).filter(({ p }) => norm(p.title ?? "").includes(nq)).slice(0, 5);
  }, [products, q]);

  const pickCat = (c: string) => { setCat(c); setQ(""); goTo("productos"); };

  /* -------------------------------- Carrito ---------------------------------- */
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "form" | "done">("cart");
  const lines = Object.entries(cart).map(([k, n]) => ({ i: Number(k), n })).filter(({ i, n }) => n > 0 && products[i]);
  const count = lines.reduce((a, l) => a + l.n, 0);
  const subtotal = lines.reduce((a, l) => a + num(products[l.i].price) * l.n, 0);
  const savings = lines.reduce((a, l) => a + Math.max(0, num(products[l.i].oldPrice) - num(products[l.i].price)) * l.n, 0);
  const missing = Math.max(0, freeFrom - subtotal);

  const setQty = (i: number, n: number) => setCart((c) => { const next = { ...c }; if (n <= 0) delete next[i]; else next[i] = Math.min(99, n); return next; });
  const add = (i: number, n = 1) => { setCart((c) => ({ ...c, [i]: Math.min(99, (c[i] ?? 0) + n) })); setToast(`Agregado: ${products[i]?.title}`); };
  const openCart = () => { setStep("cart"); setCartOpen(true); setMenu(false); };

  const [co, setCo] = useState({ who: "", phone: "", mode: "domicilio", addr: "", notes: "" });
  const [coErr, setCoErr] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<{ n: string; total: number; count: number; who: string } | null>(null);
  const setC = <K extends keyof typeof co>(k: K, v: (typeof co)[K]) => { setCo((s) => ({ ...s, [k]: v })); if (coErr[k as string]) setCoErr((e) => ({ ...e, [k as string]: "" })); };

  const submitOrder = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (co.who.trim().length < 2) errs.who = "Escribe tu nombre.";
    if (!/^[+\d][\d\s()-]{6,}$/.test(co.phone.trim())) errs.phone = "Escribe un teléfono válido.";
    if (co.mode === "domicilio" && co.addr.trim().length < 5) errs.addr = "Escribe la dirección de entrega.";
    setCoErr(errs);
    const first = Object.keys(errs)[0];
    if (first) { window.setTimeout(() => document.getElementById(`ret-c-${first}`)?.focus(), 0); return; }
    setOrder({ n: String(Math.floor(1000 + Math.random() * 9000)), total: subtotal, count, who: co.who.trim().split(" ")[0] });
    setCart({});
    setStep("done");
  };

  /* Newsletter (demo) */
  const [mail, setMail] = useState("");
  const [mailErr, setMailErr] = useState("");
  const [mailOk, setMailOk] = useState(false);
  const submitMail = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(mail.trim())) { setMailErr("Escribe un correo válido."); return; }
    setMailErr(""); setMailOk(true);
  };

  const onSlideTarget = (t: string) => (t === "@cart" ? openCart() : goTo(t));
  const year = new Date().getFullYear();
  const cur = slides[Math.min(slide, slides.length - 1)];
  const viewP = view !== null ? products[view] : null;
  const viewQty = view !== null ? cart[view] ?? 0 : 0;

  const renderCard = (p: Product, i: number, n: number) => {
    const old = num(p.oldPrice);
    const now = num(p.price);
    const off = old > now && now > 0 ? Math.round((1 - now / old) * 100) : 0;
    const inCart = cart[i] ?? 0;
    return (
      <li key={i} className={styles.reveal} data-reveal style={{ "--d": `${(n % 4) * 60}ms` } as CSSProperties}>
        <article className={styles.card}>
          <button type="button" className={styles.cardPic} onClick={() => setView(i)} aria-label={`Ver ${p.title}`} aria-haspopup="dialog">
            <Pic p={p} i={i} frame={frameAt(i)} />
            {off ? <span className={styles.off}>-{off}%</span> : p.badge ? <span className={styles.badge}>{p.badge}</span> : null}
          </button>
          <div className={styles.cardBody}>
            <span className={styles.cardTag}>{p.tag}</span>
            <button type="button" className={styles.cardName} onClick={() => setView(i)} aria-haspopup="dialog">{p.title}</button>
            <span className={styles.cardMeta}>{p.location}</span>
            <div className={styles.priceRow}>
              <span className={styles.price}>{p.price}</span>
              {old > now ? <s className={styles.old}>{p.oldPrice}</s> : null}
            </div>
            {inCart ? (
              <Qty value={inCart} onChange={(v) => setQty(i, v)} label={p.title ?? "producto"} />
            ) : (
              <button type="button" className={styles.addBtn} onClick={() => add(i)}>Agregar</button>
            )}
          </div>
        </article>
      </li>
    );
  };

  return (
    <div className={styles.root} ref={rootRef}>
      {/* Aviso */}
      <div className={styles.notice}>
        <span>{freeFrom > 0 ? `Envío gratis desde ${money(freeFrom)}` : "Pide hoy y recibe en casa"}</span>
        <span className={styles.noticeSep} aria-hidden="true">·</span>
        <span className={styles.noticeHide}>Pedidos: {phone}</span>
      </div>

      {/* Cabecera */}
      <header className={`${styles.header}${stuck ? ` ${styles.headerStuck}` : ""}`}>
        <div className={styles.headIn}>
          <button type="button" className={styles.burger} onClick={() => setMenu(true)} aria-label="Abrir menú" aria-haspopup="dialog">{I.menu}</button>
          <button type="button" className={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })} title={companyName} aria-label={`${companyName}. Ir al inicio`}>
            <span className={styles.logoMark} aria-hidden="true">{companyName.charAt(0).toUpperCase()}</span>
            <span className={styles.logoText}>{companyName}</span>
          </button>

          <form className={styles.search} role="search" onSubmit={(e) => { e.preventDefault(); setSugOpen(false); goTo("productos"); }}>
            <label className={styles.srOnly} htmlFor="ret-search">Buscar productos</label>
            <input id="ret-search" className={styles.searchInput} type="search" placeholder="Busca productos, marcas o categorías" value={q} autoComplete="off"
              onChange={(e) => { setQ(e.target.value); setSugOpen(true); }} onFocus={() => setSugOpen(true)} onBlur={() => window.setTimeout(() => setSugOpen(false), 150)}
              role="combobox" aria-expanded={sugOpen && suggestions.length > 0} aria-controls="ret-sug" aria-autocomplete="list" />
            {q ? <button type="button" className={styles.searchClear} onClick={() => setQ("")} aria-label="Borrar búsqueda">{I.close}</button> : null}
            <button type="submit" className={styles.searchBtn} aria-label="Buscar">{I.search}</button>
            {sugOpen && suggestions.length ? (
              <ul className={styles.sug} id="ret-sug" role="listbox">
                {suggestions.map(({ p, i }) => (
                  <li key={i} role="option" aria-selected="false">
                    <button type="button" className={styles.sugItem} onMouseDown={(e) => e.preventDefault()} onClick={() => { setSugOpen(false); setView(i); }}>
                      <span className={styles.sugPic}><Pic p={p} i={i} frame={frameAt(i)} /></span>
                      <span className={styles.sugName}>{p.title}</span>
                      <span className={styles.sugPrice}>{p.price}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>

          <button type="button" className={styles.cartBtn} onClick={openCart} aria-label={`Abrir carrito, ${count} productos`}>
            {I.cart}
            <span className={styles.cartText}>Carrito</span>
            {count ? <span className={styles.cartCount} key={count}>{count}</span> : null}
          </button>
        </div>
        <nav className={styles.nav} aria-label="Secciones">
          {navItems.map((item, i) => (<button key={`${item}-${i}`} type="button" className={styles.navLink} onClick={() => goTo(target(item, i))}>{item}</button>))}
        </nav>
      </header>

      {/* Menú móvil */}
      {menu ? (
        <Layer label="Menú" onClose={() => setMenu(false)} side>
          <div className={styles.menuBody}>
            <p className={styles.menuTitle}>{companyName}</p>
            <ul className={styles.menuList}>
              {navItems.map((item, i) => (<li key={`${item}-${i}`}><button type="button" className={styles.menuLink} onClick={() => goTo(target(item, i))}>{item}{I.arrow}</button></li>))}
              {cats.length ? <li><button type="button" className={styles.menuLink} onClick={() => goTo("categorias")}>Categorías{I.arrow}</button></li> : null}
            </ul>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCart}>Ver mi carrito ({count})</button>
          </div>
        </Layer>
      ) : null}

      {/* Banner */}
      <section className={styles.hero} id="inicio" aria-roledescription="carrusel" aria-label="Destacados" onMouseEnter={() => setHoverBanner(true)} onMouseLeave={() => setHoverBanner(false)}>
        <div className={`${styles.slide} ${styles[`tone${slide % 3}`]}`} key={slide} aria-live={auto ? "off" : "polite"}>
          <div className={styles.slideText}>
            <p className={styles.kicker}>{cur.kicker}</p>
            <h1 className={styles.heroTitle}>{cur.title}</h1>
            <p className={styles.heroLead}>{cur.text}</p>
            <div className={styles.heroBtns}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onSlideTarget(cur.target)}>{cur.cta} {I.arrow}</button>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={openCart}>{copy.contactCta}</button>
            </div>
          </div>
          <div className={styles.slideArt} aria-hidden="true">
            {[0, 1, 2].map((k) => {
              const idx = (slide * 3 + k) % Math.max(1, products.length);
              const p = products[idx];
              return p ? (<div key={k} className={styles.heroItem} style={{ "--k": k } as CSSProperties}><Pic p={p} i={idx} frame={frameAt(idx)} /></div>) : null;
            })}
          </div>
        </div>
        <div className={styles.heroCtl}>
          <button type="button" className={styles.iconBtn} onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)} aria-label="Anterior">{I.left}</button>
          <div className={styles.dots}>
            {slides.map((s, i) => (<button key={s.title} type="button" className={`${styles.dotBtn}${i === slide ? ` ${styles.dotOn}` : ""}`} aria-label={`Ir al destacado ${i + 1}`} aria-current={i === slide ? "true" : undefined} onClick={() => setSlide(i)} />))}
          </div>
          <button type="button" className={styles.iconBtn} onClick={() => setSlide((s) => (s + 1) % slides.length)} aria-label="Siguiente">{I.right}</button>
          <button type="button" className={styles.textBtn} onClick={() => setAuto((a) => !a)} aria-pressed={!auto}>{auto ? "Pausar" : "Reanudar"}</button>
        </div>
      </section>

      <SolutionBlock solution={config.solution} tone="retail" site={config} />

      {/* Beneficios */}
      <section className={styles.benefits} aria-label="Beneficios">
        <ul className={styles.benefitRow}>
          {benefits.slice(0, 4).map((b, i) => (
            <li key={b.title} className={styles.benefit}>
              <span className={styles.benefitIcon}>{BENEFIT_ICONS[i % 4]}</span>
              <span><strong>{b.title}</strong><span className={styles.benefitText}>{b.text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* Categorías */}
      {cats.length ? (
        <section className={styles.section} id="categorias">
          <div className={styles.wrap}>
            <div {...reveal(0, styles.head)}><h2 className={styles.h2}>Compra por categoría</h2></div>
            <ul className={styles.catGrid}>
              {cats.map((c, n) => {
                const first = products.findIndex((p) => p.tag === c);
                const total = products.filter((p) => p.tag === c).length;
                return (
                  <li key={c} className={styles.reveal} data-reveal style={{ "--d": `${(n % 6) * 60}ms` } as CSSProperties}>
                    <button type="button" className={styles.catTile} onClick={() => pickCat(c)}>
                      <span className={styles.catPic}><Pic p={products[first] ?? {}} i={first} frame={frameAt(first)} /></span>
                      <span className={styles.catName}>{c}</span>
                      <span className={styles.catCount}>{total} {total === 1 ? "producto" : "productos"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Catálogo */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="productos">
        <div className={styles.wrap}>
          <div {...reveal(0, styles.head)}>
            <h2 className={styles.h2}>Productos</h2>
            <label className={styles.sort}>
              <span>Ordenar</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rel">Más relevantes</option>
                <option value="asc">Precio: menor a mayor</option>
                <option value="desc">Precio: mayor a menor</option>
              </select>
            </label>
          </div>
          {cats.length > 1 ? (
            <div className={styles.chips} role="group" aria-label="Filtrar por categoría">
              {["Todo", ...cats].map((c) => (<button key={c} type="button" className={`${styles.chip}${cat === c ? ` ${styles.chipOn}` : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>))}
            </div>
          ) : null}
          <p className={styles.result} aria-live="polite">
            {list.length} {list.length === 1 ? "producto" : "productos"}{q ? ` para “${q}”` : ""}
            {q || cat !== "Todo" ? (<button type="button" className={styles.linkBtn} onClick={() => { setQ(""); setCat("Todo"); }}>Quitar filtros</button>) : null}
          </p>
          {list.length ? (
            <ul className={styles.grid}>{list.slice(0, limit).map(({ p, i }, n) => renderCard(p, i, n))}</ul>
          ) : (
            <div className={styles.empty}>
              <p>No encontramos productos con esa búsqueda.</p>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => { setQ(""); setCat("Todo"); }}>Ver todo el catálogo</button>
            </div>
          )}
          {list.length > limit ? (<div className={styles.more}><button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setLimit((l) => l + 8)}>Ver más productos</button></div>) : null}
        </div>
      </section>

      {/* Ofertas */}
      {deals.length ? (
        <section className={styles.section} id="ofertas">
          <div className={styles.wrap}>
            <div {...reveal(0, styles.head)}><h2 className={styles.h2}>Ofertas de la semana</h2></div>
            <ul className={styles.grid}>{deals.slice(0, 4).map(({ p, i }, n) => renderCard(p, i, n))}</ul>
          </div>
        </section>
      ) : null}

      {/* Nosotros */}
      <section className={`${styles.section} ${styles.about}`} id="nosotros">
        <div className={styles.wrap}>
          <div className={styles.aboutGrid}>
            <div {...reveal()}>
              <p className={styles.kickerDark}>Quiénes somos</p>
              <h2 className={styles.h2}>{copy.aboutTitle}</h2>
            </div>
            <div {...reveal(1)}>
              <p className={styles.aboutBody}>{copy.aboutBody}</p>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCart}>{copy.contactCta} {I.arrow}</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pie */}
      <footer className={styles.footer} id="contacto-demo">
        <div className={styles.wrap}>
          <div className={styles.news}>
            <div>
              <p className={styles.footBig}>Recibe ofertas en tu correo</p>
              <p className={styles.footText}>Una vez por semana, sin spam. Demostración: no se guarda tu correo.</p>
            </div>
            {mailOk ? (
              <p className={styles.mailOk} role="status">{I.check} Listo, te avisaremos de las ofertas de {companyName}.</p>
            ) : (
              <form className={styles.mailForm} onSubmit={submitMail} noValidate>
                <label className={styles.srOnly} htmlFor="ret-mail">Correo electrónico</label>
                <input id="ret-mail" type="email" className={`${styles.input}${mailErr ? ` ${styles.inputBad}` : ""}`} placeholder="tucorreo@ejemplo.com" value={mail} onChange={(e) => { setMail(e.target.value); setMailErr(""); }} aria-invalid={mailErr ? true : undefined} autoComplete="email" />
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Suscribirme</button>
                {mailErr ? <p className={styles.error} role="alert">{mailErr}</p> : null}
              </form>
            )}
          </div>
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
              <p className={styles.footHead}>Atención</p>
              <ul className={styles.footList}>
                <li className={styles.footText}>{address}</li>
                <li className={styles.footText}>{hours}</li>
                <li className={styles.footText}>{phone}</li>
                <li><a className={styles.footLink} href={`mailto:${email}`}>{email}</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footBase}><span>© {year} {companyName}</span><span>Sitio de demostración</span></div>
        </div>
      </footer>

      {count > 0 && !cartOpen ? (
        <button type="button" className={styles.fabCart} onClick={openCart}>{I.cart}<span>Ver pedido · {money(subtotal)}</span><span className={styles.fabCount}>{count}</span></button>
      ) : null}
      <button type="button" className={`${styles.backTop}${showTop ? ` ${styles.backTopOn}` : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })} aria-label="Volver arriba" tabIndex={showTop ? 0 : -1}>↑</button>

      {/* Producto */}
      {viewP && view !== null ? (
        <Layer label={viewP.title ?? "Producto"} onClose={() => setView(null)}>
          <div className={styles.viewGrid}>
            <div className={styles.viewPic}><Pic p={viewP} i={view} frame={frameAt(view)} /></div>
            <div className={styles.viewBody}>
              <span className={styles.cardTag}>{viewP.tag}</span>
              <h3 className={styles.viewTitle}>{viewP.title}</h3>
              <p className={styles.cardMeta}>{viewP.location}</p>
              <div className={styles.priceRow}>
                <span className={`${styles.price} ${styles.priceBig}`}>{viewP.price}</span>
                {num(viewP.oldPrice) > num(viewP.price) ? <s className={styles.old}>{viewP.oldPrice}</s> : null}
              </div>
              <p className={styles.viewText}>{viewP.description ?? `Producto disponible en ${companyName}. Consulta disponibilidad y presentaciones al hacer tu pedido.`}</p>
              {viewQty ? (
                <div className={styles.viewActions}><Qty value={viewQty} onChange={(v) => setQty(view, v)} label={viewP.title ?? "producto"} /><button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setView(null); openCart(); }}>Ver mi pedido</button></div>
              ) : (
                <div className={styles.viewActions}><button type="button" className={`${styles.btn} ${styles.btnPrimary}`} data-autofocus onClick={() => add(view)}>Agregar al pedido</button></div>
              )}
            </div>
          </div>
        </Layer>
      ) : null}

      {/* Carrito */}
      {cartOpen ? (
        <Layer label="Mi pedido" onClose={() => setCartOpen(false)} side>
          <div className={styles.cartWrap}>
            <h3 className={styles.cartTitle}>{step === "done" ? "Pedido listo" : step === "form" ? "Tus datos" : "Mi pedido"}</h3>

            {step === "done" && order ? (
              <div className={styles.done} role="status">
                <span className={styles.doneIcon}>{I.check}</span>
                <p className={styles.doneBig}>Gracias, {order.who}.</p>
                <p>Tu pedido <strong>#{order.n}</strong> ({order.count} {order.count === 1 ? "producto" : "productos"}) por <strong>{money(order.total)}</strong> quedó registrado en {companyName}.</p>
                <p className={styles.small}>Es una demostración: no se envió a ningún lugar ni se cobró nada.</p>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setCartOpen(false); setStep("cart"); }}>Seguir comprando</button>
              </div>
            ) : null}

            {step === "cart" ? (
              lines.length ? (
                <>
                  {freeFrom > 0 ? (
                    <div className={styles.ship}>
                      <p>{missing > 0 ? <>Te faltan <strong>{money(missing)}</strong> para el envío gratis</> : <strong>¡Tu envío es gratis!</strong>}</p>
                      <div className={styles.shipBar} aria-hidden="true"><span style={{ width: `${Math.min(100, (subtotal / freeFrom) * 100)}%` }} /></div>
                    </div>
                  ) : null}
                  <ul className={styles.lines}>
                    {lines.map(({ i, n }) => (
                      <li key={i} className={styles.line}>
                        <span className={styles.linePic}><Pic p={products[i]} i={i} frame={frameAt(i)} /></span>
                        <span className={styles.lineInfo}>
                          <span className={styles.lineName}>{products[i].title}</span>
                          <span className={styles.cardMeta}>{products[i].price}</span>
                          <Qty value={n} onChange={(v) => setQty(i, v)} label={products[i].title ?? "producto"} />
                        </span>
                        <span className={styles.lineTotal}>{money(num(products[i].price) * n)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className={styles.totals}>
                    {savings > 0 ? (<div className={styles.totRow}><dt>Ahorras</dt><dd className={styles.green}>{money(savings)}</dd></div>) : null}
                    <div className={`${styles.totRow} ${styles.totBig}`}><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
                  </dl>
                  <div className={styles.cartActions}>
                    <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`} onClick={() => setStep("form")}>Continuar con mi pedido {I.arrow}</button>
                    <button type="button" className={styles.linkBtn} onClick={() => setCart({})}>Vaciar carrito</button>
                  </div>
                </>
              ) : (
                <div className={styles.empty}>
                  <p>Tu carrito está vacío.</p>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setCartOpen(false); goTo("productos"); }}>Ver productos</button>
                </div>
              )
            ) : null}

            {step === "form" ? (
              <form className={styles.form} onSubmit={submitOrder} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ret-c-who">Tu nombre</label>
                  <input id="ret-c-who" className={`${styles.input}${coErr.who ? ` ${styles.inputBad}` : ""}`} value={co.who} onChange={(e) => setC("who", e.target.value)} autoComplete="name" aria-invalid={coErr.who ? true : undefined} />
                  {coErr.who ? <p className={styles.error} role="alert">{coErr.who}</p> : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ret-c-phone">Teléfono / WhatsApp</label>
                  <input id="ret-c-phone" type="tel" className={`${styles.input}${coErr.phone ? ` ${styles.inputBad}` : ""}`} value={co.phone} onChange={(e) => setC("phone", e.target.value)} autoComplete="tel" aria-invalid={coErr.phone ? true : undefined} />
                  {coErr.phone ? <p className={styles.error} role="alert">{coErr.phone}</p> : null}
                </div>
                <fieldset className={styles.modes}>
                  <legend className={styles.label}>¿Cómo lo recibes?</legend>
                  {[["domicilio", "A domicilio"], ["tienda", "Recojo en tienda"]].map(([v, t]) => (
                    <label key={v} className={`${styles.mode}${co.mode === v ? ` ${styles.modeOn}` : ""}`}>
                      <input type="radio" name="ret-mode" value={v} checked={co.mode === v} onChange={() => setC("mode", v)} />
                      {t}
                    </label>
                  ))}
                </fieldset>
                {co.mode === "domicilio" ? (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ret-c-addr">Dirección de entrega</label>
                    <input id="ret-c-addr" className={`${styles.input}${coErr.addr ? ` ${styles.inputBad}` : ""}`} value={co.addr} onChange={(e) => setC("addr", e.target.value)} autoComplete="street-address" aria-invalid={coErr.addr ? true : undefined} />
                    {coErr.addr ? <p className={styles.error} role="alert">{coErr.addr}</p> : null}
                  </div>
                ) : (
                  <p className={styles.small}>Recoges en: {address}. {hours}.</p>
                )}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ret-c-notes">Notas (opcional)</label>
                  <textarea id="ret-c-notes" rows={2} maxLength={200} className={styles.input} value={co.notes} onChange={(e) => setC("notes", e.target.value)} />
                </div>
                <div className={styles.totRow + " " + styles.totBig}><span>Total a pagar al recibir</span><strong>{money(subtotal)}</strong></div>
                <div className={styles.cartActions}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}>Confirmar pedido</button>
                  <button type="button" className={styles.linkBtn} onClick={() => setStep("cart")}>Volver al carrito</button>
                </div>
              </form>
            ) : null}
          </div>
        </Layer>
      ) : null}

      <div aria-live="polite">{toast ? <div className={styles.toast} key={toast}>{I.check} {toast}</div> : null}</div>
    </div>
  );
}
