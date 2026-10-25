import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import colibriUrl from './assets/colibri.webp';
import { SECTORS, CHALLENGES, HOURS, GOALS, STEPS, EMPTY_ANSWERS, labelOf, companyOr, stepCopy, SECTOR_CONTEXT, HOURS_RULES, GOAL_RULES, CHALLENGE_RULES, buildDiagnosis, localProvider, ACTIVE_PROVIDER, PIPELINE, STAGE_WEIGHT, CHANNEL_WEIGHT, TASK_SEEDS, DUE, PRIORITIES, INVENTORY, MONTHS, MONTHS_LONG, hashStr, seeded, makeSeries } from './data.js';
import './styles.css';

/* Recurso oficial del colibrí. Dentro de un Artifact el navegador bloquea
   imágenes de otros dominios, por eso se muestra un respaldo. Para usar el
   colibrí real, reemplaza este valor por el archivo embebido (data URI). */
const COLIBRI_SRC = colibriUrl;

const fmt = (n, d = 0) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const cop = (n) => '$' + fmt(n);
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Iconos mínimos (SVG) ---------------- */
const Icon = {
  arrow: (p) => <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" {...p}><path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  back: (p) => <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" {...p}><path d="M16 10H5M9 5.5 4.5 10 9 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  check: (p) => <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...p}><path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  clock: (p) => <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...p}><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v4.2l2.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  plus: (p) => <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...p}><path d="M10 4.5v11M4.5 10h11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  minus: (p) => <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...p}><path d="M4.5 10h11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  x: (p) => <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...p}><path d="m5.5 5.5 9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  edit: (p) => <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" {...p}><path d="M4 16h3l8.5-8.5-3-3L4 13v3Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
};

function useFocusOnMount(enabled = true) {
  const ref = useRef(null);
  useEffect(() => { if (enabled && ref.current) ref.current.focus({ preventScroll: true }); }, []);
  return ref;
}

/* ---------------- Datos del equipo (editar aquí) ----------------
   Reemplaza los valores pendientes por los datos reales. Un enlace vacío
   se muestra como "Enlace pendiente" y no es clicable. */
const TEAM = {
  name: '',  // p. ej. 'Equipo Colibrí Analítica'
  summary: 'Prototipo académico desarrollado en el Departamento de Matemáticas de la Universidad Externado de Colombia para explorar cómo los datos, la automatización y la inteligencia artificial pueden apoyar a las empresas.',
  members: [
    { name: '', role: '', links: { linkedin: '', github: '', email: '' } },
    { name: '', role: '', links: { linkedin: '', github: '', email: '' } },
    { name: '', role: '', links: { linkedin: '', github: '', email: '' } },
  ],
};
const DEPT_URL = 'https://www.uexternado.edu.co/departamento-de-matematicas/';
const UNI_URL = 'https://www.uexternado.edu.co/';

const SECTIONS = [
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'soluciones', label: 'Soluciones' },
  { id: 'equipo', label: 'Equipo' },
];

/* ---------------- Fondo interactivo (WebGL) ----------------
   Campo de ruido con deformación de dominio: masas orgánicas verdes que se
   transforman despacio, con brillo de borde y un abultamiento que sigue al
   cursor. Se dibuja a baja resolución (el contenido es suave) y se pausa
   cuando la pestaña no está visible. */
const FLUID_FRAG = `
precision mediump float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform float u_scroll; uniform float u_hover; uniform float u_click; uniform vec2 u_cpos;
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float t;
float field(vec2 p){
  float s = 0.0;
  for (int i = 0; i < 6; i++){
    float fi = float(i);
    vec2 c = vec2(sin(t * (0.42 + 0.07 * fi) + fi * 1.9) * 0.78, cos(t * (0.33 + 0.05 * fi) + fi * 2.7) * 0.42);
    float r = 0.17 + 0.05 * sin(fi * 3.1);
    vec2 d = p - c;
    s += pow(r * r / (dot(d, d) + 0.0008), 1.45);
  }
  return s;
}
float scene(vec2 p, vec2 m){
  vec2 dm = p - m;
  float grow = 1.0 + 0.9 * (1.0 - u_click) * step(u_click, 0.999);
  return field(p) + u_hover * pow(0.0175 * grow / (dot(dm, dm) + 0.003), 1.45);  // el cursor atrae una masa líquida
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  t = u_time * 0.16;
  p.y -= u_scroll * 0.28;
  vec2 m = (u_mouse - 0.5 * u_res) / u_res.y;
  m.y -= u_scroll * 0.28;
  vec2 w = vec2(snoise(p * 0.9 + vec2(t * 0.35, 0.0)), snoise(p * 0.9 + vec2(3.7, -t * 0.35)));
  vec2 q = p + w * 0.07;
  float s = scene(q, m);
  float e = 0.004;
  // Altura saturada: el interior de cada masa es una superficie lisa, sin singularidades
  float h0 = 1.0 - exp(-max(s - 0.85, 0.0) * 1.1);
  float hx = 1.0 - exp(-max(scene(q + vec2(e, 0.0), m) - 0.85, 0.0) * 1.1);
  float hy = 1.0 - exp(-max(scene(q + vec2(0.0, e), m) - 0.85, 0.0) * 1.1);
  vec2 g = vec2(hx - h0, hy - h0) / e;
  float inside = smoothstep(0.94, 1.08, s);
  float depth = h0;
  vec3 n = normalize(vec3(-g * 0.055, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.65, 0.75));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 22.0);
  vec3 forest = vec3(0.027, 0.153, 0.141);
  vec3 abyss  = vec3(0.071, 0.176, 0.157);
  vec3 lagoon = vec3(0.110, 0.247, 0.220);
  vec3 teal   = vec3(0.137, 0.322, 0.298);
  vec3 pulse  = vec3(0.200, 0.600, 0.549);
  vec3 mint   = vec3(0.592, 0.988, 0.843);
  vec3 halo = mix(forest, abyss, smoothstep(0.15, 0.95, s)) + pulse * 0.10 * smoothstep(0.45, 0.98, s);
  vec3 body = mix(abyss, teal, clamp(diff * 0.85 + depth * 0.15 - 0.05, 0.0, 1.0));
  vec3 col = mix(halo, body, inside);
  col += pulse * exp(-pow((s - 1.0) * 5.0, 2.0)) * 0.42;     // luz de borde
  col += mint * spec * inside * 0.26;                          // reflejo suave
  vec2 dmc = p - m;
  col += mint * exp(-dot(dmc, dmc) * 30.0) * 0.12 * u_hover;    // núcleo luminoso del cursor
  vec2 cp = (u_cpos - 0.5 * u_res) / u_res.y; cp.y -= u_scroll * 0.28;
  float ring = exp(-pow((length(p - cp) - u_click * 0.55) * 16.0, 2.0)) * (1.0 - u_click);
  col += mint * ring * 0.35;                                    // onda al hacer clic
  col *= 1.0 - 0.30 * smoothstep(0.45, 1.05, length(uv - vec2(0.5, 0.45)));
  gl_FragColor = vec4(col, 1.0);
}`;
const FLUID_VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

function FluidBackground() {
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas && (canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }) || canvas.getContext('experimental-webgl'));
    if (!gl) { setFallback(true); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, FLUID_VERT), fs = sh(gl.FRAGMENT_SHADER, FLUID_FRAG);
    if (!vs || !fs) { setFallback(true); return; }
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFallback(true); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U('u_res'), uTime = U('u_time'), uMouse = U('u_mouse'), uScroll = U('u_scroll'), uHover = U('u_hover'), uClick = U('u_click'), uCpos = U('u_cpos');
    let clickAt = -1e9, cx = 0, cy = 0;

    const QUALITY = 0.5;  // resolución interna: el campo es suave, no necesita más
    let w = 0, h = 0;
    const resize = () => {
      w = Math.max(1, Math.round(window.innerWidth * QUALITY)); h = Math.max(1, Math.round(window.innerHeight * QUALITY));
      canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h);
    };
    resize();
    const target = { x: w * 0.72, y: h * 0.38, hover: 0.6 };
    const cur = { ...target };
    const onMove = (e) => { target.x = e.clientX * QUALITY; target.y = h - e.clientY * QUALITY; target.hover = 1; };
    const onLeave = () => { target.hover = 0.6; };
    const onDown = (e) => { clickAt = performance.now(); cx = e.clientX * QUALITY; cy = h - e.clientY * QUALITY; };
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', resize);

    const still = reduceMotion();
    let raf = 0, t0 = performance.now(), last = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / 45) return; // tope de 45 fps
      last = now;
      cur.x += (target.x - cur.x) * 0.06; cur.y += (target.y - cur.y) * 0.06; cur.hover += (target.hover - cur.hover) * 0.04;
      const sc = Math.min(1.5, window.scrollY / Math.max(1, window.innerHeight));
      gl.uniform1f(uTime, still ? 12.0 : (now - t0) / 1000 + 12.0);
      gl.uniform2f(uMouse, cur.x, cur.y); gl.uniform1f(uHover, cur.hover); gl.uniform1f(uScroll, sc);
      gl.uniform1f(uClick, Math.min(1, (now - clickAt) / 1100)); gl.uniform2f(uCpos, cx, cy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    start();
    return () => {
      stop(); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown); document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return (
    <div className="backdrop" aria-hidden="true">
      {fallback
        ? <><div className="blob b-abyss" /><div className="blob b-lagoon" /><div className="blob b-teal" /><div className="blob b-rim" /></>
        : <canvas ref={canvasRef} className="fluid" />}
    </div>
  );
}

/* ---------------- Barra superior blanca ---------------- */
function RestartButton({ onConfirm, variant = 'ghost', label = 'Nueva empresa' }) {
  const [open, setOpen] = useState(false);
  const yesRef = useRef(null);
  useEffect(() => { if (open && yesRef.current) yesRef.current.focus(); }, [open]);
  return (
    <div className="restart" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
      <button type="button" className={'btn btn-' + variant} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{label}</button>
      {open && (
        <div className="restart-pop" role="dialog" aria-label="Confirmar reinicio">
          <p>¿Empezar de nuevo? Se borrarán las respuestas actuales.</p>
          <div className="row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="button" ref={yesRef} className="btn btn-primary btn-sm" onClick={() => { setOpen(false); onConfirm(); }}>Sí, reiniciar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const ExtIcon = () => <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M6 3h7v7M13 3 4.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

function Header({ screen, active, onHome, onSection, onStart, onRestart }) {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hl, setHl] = useState(null);   // resaltado que se desliza entre enlaces
  const listRef = useRef(null);
  const drawerRef = useRef(null);
  const menuBtnRef = useRef(null);
  const inFlow = screen !== 'welcome';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menú lateral: bloquea el scroll, Escape cierra, el foco entra y vuelve
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = drawerRef.current && drawerRef.current.querySelector('button, a');
    if (first) first.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawer(false);
      if (e.key === 'Tab' && drawerRef.current) {
        const f = drawerRef.current.querySelectorAll('button, a');
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); if (menuBtnRef.current) menuBtnRef.current.focus({ preventScroll: true }); };
  }, [drawer]);

  const moveHl = (el) => {
    if (!el || !listRef.current) return;
    const a = el.getBoundingClientRect(), b = listRef.current.getBoundingClientRect();
    setHl({ left: a.left - b.left, width: a.width });
  };
  const go = (id) => { setDrawer(false); onSection(id); };
  const isOn = (id) => !inFlow && active === id;

  const links = (variant) => (
    <>
      {SECTIONS.map((s) => (
        <li key={s.id}>
          <button type="button" className={'nav-link' + (isOn(s.id) ? ' on' : '')} aria-current={isOn(s.id) ? 'true' : undefined}
            onMouseEnter={variant === 'bar' ? (e) => moveHl(e.currentTarget) : undefined}
            onFocus={variant === 'bar' ? (e) => moveHl(e.currentTarget) : undefined}
            onClick={() => go(s.id)}>{s.label}</button>
        </li>
      ))}
      <li>
        <a className="nav-link ext" href={DEPT_URL} target="_blank" rel="noopener noreferrer"
          onMouseEnter={variant === 'bar' ? (e) => moveHl(e.currentTarget) : undefined}
          onFocus={variant === 'bar' ? (e) => moveHl(e.currentTarget) : undefined}>
          Departamento de Matemáticas <ExtIcon /><span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </li>
    </>
  );

  return (
    <>
      <header className={'top' + (scrolled ? ' scrolled' : '')}>
        <div className="top-in">
          <button ref={menuBtnRef} type="button" className="menu-btn" aria-expanded={drawer} aria-controls="drawer" onClick={() => setDrawer(true)}>
            <span className="sr-only">Abrir menú</span>
            <span className="burger" aria-hidden="true"><span /><span /><span /></span>
          </button>
          <button type="button" className="brand" onClick={onHome} aria-label="Universidad Externado de Colombia. Ir al inicio">
            <span className="logo logo-dark" aria-hidden="true" />
            <span className="brand-sep" aria-hidden="true" />
            <span className="brand-sub">Departamento de<br />Matemáticas</span>
          </button>
          <nav className="nav" aria-label="Secciones">
            <ul ref={listRef} onMouseLeave={() => setHl(null)}>
              <span className={'nav-hl' + (hl ? ' show' : '')} style={hl ? { transform: `translateX(${hl.left}px)`, width: hl.width } : undefined} aria-hidden="true" />
              {links('bar')}
            </ul>
          </nav>
          <div className="top-actions">
            {inFlow
              ? <RestartButton onConfirm={onRestart} variant="dark" />
              : <button type="button" className="btn btn-dark btn-cta" onClick={onStart}><span>Comenzar<span className="cta-long"> diagnóstico</span></span> <Icon.arrow /></button>}
          </div>
        </div>
      </header>

      <div className={'scrim' + (drawer ? ' show' : '')} onClick={() => setDrawer(false)} aria-hidden="true" />
      <aside id="drawer" ref={drawerRef} className={'drawer' + (drawer ? ' open' : '')} aria-label="Menú" aria-hidden={!drawer} inert={drawer ? undefined : ''}>
        <div className="drawer-head">
          <span className="logo logo-dark" role="img" aria-label="Universidad Externado de Colombia" />
          <button type="button" className="icon-btn drawer-close" onClick={() => setDrawer(false)} aria-label="Cerrar menú"><Icon.x /></button>
        </div>
        <p className="drawer-sub">Departamento de Matemáticas</p>
        <ul className="drawer-links">{links('drawer')}</ul>
        <div className="drawer-foot">
          {inFlow
            ? <RestartButton onConfirm={() => { setDrawer(false); onRestart(); }} variant="dark" />
            : <button type="button" className="btn btn-dark btn-block" onClick={() => { setDrawer(false); onStart(); }}>Comenzar diagnóstico <Icon.arrow /></button>}
          <p className="drawer-note">2 minutos · Sin registro</p>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Inicio: portada y secciones ---------------- */
const SOLUTION_CARDS = CHALLENGES.filter((c) => c.id !== 'otro').map((c) => ({
  id: c.id, problem: c.label, title: CHALLENGE_RULES[c.id].solutionTitle, text: CHALLENGE_RULES[c.id].opportunity, demo: CHALLENGE_RULES[c.id].demoName,
}));

function TeamLink({ kind, href, person }) {
  const labels = { linkedin: 'LinkedIn', github: 'GitHub', email: 'Correo' };
  if (!href) return <span className="team-link pending" aria-label={`${labels[kind]} pendiente`}>{labels[kind]}</span>;
  const url = kind === 'email' ? null : href;
  return kind === 'email'
    ? <span className="team-link mail">{href}</span>
    : <a className="team-link" href={url} target="_blank" rel="noopener noreferrer">{labels[kind]} <ExtIcon /><span className="sr-only"> de {person} (se abre en una pestaña nueva)</span></a>;
}

/* Aparición con zoom al desplazarse. El contenido que ya está en pantalla al
   cargar no se oculta nunca; solo lo que está más abajo parte reducido. */
function useReveal(deps) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || reduceMotion()) return;
    const els = [...document.querySelectorAll('.reveal')];
    const vh = window.innerHeight;
    els.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add('pre'); });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);
}

/* ---------------- ¿Qué es la IA? Explicación por pasos ---------------- */
const NET = { layers: [4, 5, 3, 1], w: 520, h: 380 };  // lienzo: w + 215 de ancho
const INPUTS = ['Día de la semana', 'Promociones', 'Clima', 'Ventas pasadas'];
const STORY = [
  { k: 'datos', title: 'Todo empieza con datos', text: 'Ventas, inventario, mensajes de clientes. Tu empresa ya produce información todos los días, aunque esté en cuadernos u hojas de cálculo.', tip: 'Estas son las entradas: lo que la IA observa.' },
  { k: 'aprende', title: 'La IA aprende de ejemplos', text: 'Como un empleado nuevo que aprende viendo casos, la IA revisa muchos ejemplos del pasado y nota qué suele repetirse.', tip: 'Las líneas son conexiones. Se refuerzan con cada ejemplo.' },
  { k: 'patrones', title: 'Encuentra patrones', text: 'Cada círculo combina señales. Algunas pesan más que otras: por ejemplo, que los viernes se venda más pan que los martes.', tip: 'Las líneas gruesas son las señales que más pesan.' },
  { k: 'sugiere', title: 'Te da una recomendación', text: 'Al final entrega una respuesta concreta y fácil de usar, como "conviene pedir más harina para el viernes".', tip: 'La salida: una sugerencia, no una orden.' },
  { k: 'prueba', title: 'Pruébalo tú', text: 'Activa o desactiva las señales y mira cómo cambia la predicción de ventas. Así decide una red neuronal: suma señales con distinto peso.', tip: '' },
];
// Pesos fijos del ejemplo (determinísticos)
const WEIGHTS = { viernes: 2, promo: 1.5, lluvia: -1.2, historial: 0.6 };

function netLayout() {
  const { layers, w, h } = NET;
  const xs = layers.map((_, i) => 160 + i * ((w - 160) / (layers.length - 1)));
  return layers.map((n, li) => Array.from({ length: n }, (_, k) => ({ x: xs[li], y: n === 1 ? h / 2 : 40 + k * ((h - 80) / (n - 1)) })));
}
const NODES = netLayout();
const EDGES = (() => {
  const out = [];
  for (let l = 0; l < NODES.length - 1; l++) NODES[l].forEach((a, i) => NODES[l + 1].forEach((b, j) => {
    const w = Math.abs(Math.sin((l + 1) * 12.9898 + i * 78.233 + j * 37.719)); // peso visual estable
    out.push({ l, i, j, a, b, w });
  }));
  return out;
})();

function NeuralNet({ step, signals }) {
  const k = STORY[step].k;
  const play = k === 'prueba';
  const activeInputs = play ? [signals.viernes, signals.promo, signals.lluvia, signals.historial] : [true, true, true, true];
  const score = WEIGHTS.historial * (signals.historial ? 1 : 0) + (signals.viernes ? WEIGHTS.viernes : 0) + (signals.promo ? WEIGHTS.promo : 0) + (signals.lluvia ? WEIGHTS.lluvia : 0);
  const level = score >= 2.2 ? 'Altas' : score >= 0.8 ? 'Normales' : 'Bajas';
  const lit = (layer) => {
    if (k === 'datos') return layer === 0;
    if (k === 'aprende') return layer <= 1;
    if (k === 'patrones') return layer <= 2;
    return true;
  };
  const edgeOn = (e) => {
    if (k === 'datos') return false;
    if (k === 'aprende') return e.l === 0;
    if (k === 'patrones') return e.l <= 1;
    if (play) return e.l > 0 || activeInputs[e.i];
    return true;
  };
  const strong = (e) => (k === 'patrones' || k === 'sugiere' || play) && e.w > 0.62;
  const outText = play ? `Ventas esperadas: ${level}` : 'Pedir más harina para el viernes';
  return (
    <svg viewBox={`0 0 ${NET.w + 215} ${NET.h}`} className={'net step-' + k} role="img"
      aria-label={play ? `Red neuronal de ejemplo. Predicción: ventas ${level.toLowerCase()}.` : `Red neuronal de ejemplo, paso: ${STORY[step].title}.`}>
      <g className="edges">
        {EDGES.map((e, n) => (
          <line key={n} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
            className={'edge' + (edgeOn(e) ? ' on' : '') + (strong(e) ? ' strong' : '')}
            style={{ animationDelay: `${(n % 9) * -0.17}s` }} />
        ))}
      </g>
      {NODES.map((layer, li) => layer.map((p, ni) => {
        const on = lit(li) && (li !== 0 || activeInputs[ni]);
        return <circle key={li + '-' + ni} cx={p.x} cy={p.y} r={li === NODES.length - 1 ? 22 : 13} className={'node l' + li + (on ? ' on' : '')} style={{ transitionDelay: `${li * 0.09}s` }} />;
      }))}
      {NODES[0].map((p, i) => (
        <text key={'t' + i} x={p.x - 24} y={p.y + 4} textAnchor="end" className={'net-label' + (activeInputs[i] ? ' on' : '')}>{INPUTS[i]}</text>
      ))}
      <g className={'out' + (k === 'sugiere' || play ? ' show' : '')}>
        <text x={NODES[3][0].x + 36} y={NODES[3][0].y - 6} className="net-out-k">Resultado</text>
        <text x={NODES[3][0].x + 36} y={NODES[3][0].y + 16} className="net-out">{play ? `Ventas ${level.toLowerCase()}` : 'Pedir más harina'}</text>
        {!play && <text x={NODES[3][0].x + 36} y={NODES[3][0].y + 36} className="net-out-s">para el viernes</text>}
      </g>
      <text x={NODES[1][0].x} y={NET.h - 6} textAnchor="middle" className="net-cap">Entradas → capas ocultas → salida</text>
      <desc>{outText}</desc>
    </svg>
  );
}

function AIStory() {
  const [step, setStep] = useState(0);
  const [signals, setSignals] = useState({ viernes: true, promo: false, lluvia: false, historial: true });
  const stepRefs = useRef([]);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setStep(Number(e.target.dataset.i)); });
    }, { rootMargin: '-52% 0px -38% 0px' });
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const toggle = (key) => setSignals((s) => ({ ...s, [key]: !s[key] }));
  const toggles = [['viernes', 'Es viernes'], ['promo', 'Hay promoción'], ['lluvia', 'Está lloviendo'], ['historial', 'Hay historial de ventas']];
  return (
    <div className="story">
      <div className="story-stage">
        <div className="stage-card">
          <div className="stage-top">
            <span className="tag">Ejemplo: una panadería</span>
            <ol className="stage-dots" aria-label="Pasos de la explicación">
              {STORY.map((s, i) => (
                <li key={s.k}>
                  <button type="button" className={'dot' + (i === step ? ' on' : '')} aria-label={`Paso ${i + 1}: ${s.title}`} aria-current={i === step ? 'step' : undefined}
                    onClick={() => stepRefs.current[i] && stepRefs.current[i].scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' })} />
                </li>
              ))}
            </ol>
          </div>
          <NeuralNet step={step} signals={signals} />
          <p className="stage-tip" aria-live="polite">{STORY[step].tip || 'La IA sugiere; las personas deciden.'}</p>
        </div>
      </div>
      <div className="story-steps">
        {STORY.map((s, i) => (
          <article key={s.k} data-i={i} ref={(el) => (stepRefs.current[i] = el)} className={'story-step' + (i === step ? ' on' : '')}>
            <p className="story-n">{String(i + 1).padStart(2, '0')}</p>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {s.k === 'prueba' && (
              <div className="toggles" role="group" aria-label="Señales de entrada">
                {toggles.map(([key, label]) => (
                  <button key={key} type="button" className={'toggle' + (signals[key] ? ' on' : '')} aria-pressed={signals[key]} onClick={() => { toggle(key); setStep(4); }}>
                    <span className="sw" aria-hidden="true" />{label}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Inicio ---------------- */
function Welcome({ onStart, onSection, onDemo }) {
  const teamName = TEAM.name.trim();
  const pending = !teamName || TEAM.members.some((m) => !m.name.trim());
  useReveal([]);
  return (
    <>
      <section className="wrap welcome" aria-labelledby="w-title">
        <span className="hero-tag"><span className="pulse-dot" aria-hidden="true" />Diagnóstico empresarial con datos e IA</span>
        <h1 id="w-title" className="display w-title">Descubre nuevas oportunidades para tu empresa</h1>
        <p className="lead w-lead">Responde cinco preguntas y recibe una propuesta concreta para mejorar un proceso con datos e inteligencia artificial.</p>
        <div className="w-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>Comenzar diagnóstico <Icon.arrow /></button>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => onSection('como-funciona')}>Cómo funciona</button>
        </div>
        <p className="w-meta"><Icon.clock /> 2 minutos · Sin registro · Resultado preliminar</p>
        <button type="button" className="scroll-cue" onClick={() => onSection('como-funciona')}>
          <span>Desliza para entender qué es la IA</span>
          <span className="cue-line" aria-hidden="true" />
        </button>
      </section>

      <section id="como-funciona" tabIndex={-1} className="wrap section" aria-labelledby="how-title">
        <div className="section-head center reveal">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="how-title" className="section-title">¿Qué es la inteligencia artificial?</h2>
          <p className="section-lead">Sin tecnicismos: es una herramienta que aprende de los datos de tu empresa para sugerirte qué hacer. Desliza y míralo paso a paso.</p>
        </div>
        <AIStory />
        <div className="section-head center reveal sub-head">
          <h2 className="section-title sm">Y así funciona este diagnóstico</h2>
        </div>
        <ol className="how-grid">
          <li className="card reveal"><span className="how-n" aria-hidden="true">1</span><h3>Responde cinco preguntas</h3><p>Nombre, sector, desafío principal, tiempo que le dedican y resultado esperado.</p></li>
          <li className="card reveal"><span className="how-n" aria-hidden="true">2</span><h3>Recibe una propuesta</h3><p>Diagnóstico, oportunidad de mejora, solución recomendada y tres pasos.</p></li>
          <li className="card reveal"><span className="how-n" aria-hidden="true">3</span><h3>Pruébala en una demo</h3><p>Una versión funcional con datos de ejemplo, con el nombre de tu empresa.</p></li>
        </ol>
        <div className="center-row reveal">
          <button type="button" className="btn btn-primary" onClick={onStart}>Comenzar diagnóstico <Icon.arrow /></button>
        </div>
      </section>

      <section id="soluciones" tabIndex={-1} className="wrap section" aria-labelledby="sol-title">
        <div className="section-head center reveal">
          <p className="eyebrow">Soluciones</p>
          <h2 id="sol-title" className="section-title">Lo que se puede construir</h2>
          <p className="section-lead">Cada desafío lleva a una solución. Prueba cualquiera con datos de ejemplo.</p>
        </div>
        <ul className="sol-grid">
          {SOLUTION_CARDS.map((s) => (
            <li key={s.id} className="card sol-card reveal">
              <span className="tag">{s.problem}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <button type="button" className="link-btn sol-go" onClick={() => onDemo(s.id)}>Ver demostración <Icon.arrow /></button>
            </li>
          ))}
        </ul>
      </section>

      <section id="equipo" tabIndex={-1} className="wrap section" aria-labelledby="team-title">
        <div className="section-head center reveal">
          <p className="eyebrow">Equipo</p>
          <h2 id="team-title" className="section-title">{teamName || 'Nombre del equipo'}</h2>
          <p className="section-lead">{TEAM.summary}</p>
          {pending && <p className="pending-note"><span className="tag">Pendiente</span> Faltan el nombre del equipo y los datos de los integrantes.</p>}
        </div>
        <ul className="team-grid">
          {TEAM.members.map((m, i) => {
            const name = m.name.trim();
            return (
              <li key={i} className={'card team-card reveal' + (name ? '' : ' is-pending')}>
                <span className="avatar" aria-hidden="true">{name ? name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() : String(i + 1)}</span>
                <div className="team-id">
                  <h3>{name || `Integrante ${i + 1}`}</h3>
                  <p>{m.role.trim() || 'Rol por confirmar'}</p>
                </div>
                <div className="team-links">
                  {['linkedin', 'github', 'email'].map((k) => <TeamLink key={k} kind={k} href={(m.links[k] || '').trim()} person={name || `Integrante ${i + 1}`} />)}
                </div>
              </li>
            );
          })}
          <li className="card team-card dept-card reveal">
            <p className="micro accent">Departamento de Matemáticas</p>
            <h3>Universidad Externado de Colombia</h3>
            <p>Programas, docentes y educación continuada del departamento.</p>
            <a className="btn btn-ghost btn-sm" href={DEPT_URL} target="_blank" rel="noopener noreferrer">Visitar el departamento <ExtIcon /><span className="sr-only"> (se abre en una pestaña nueva)</span></a>
          </li>
        </ul>
      </section>
    </>
  );
}

/* ---------------- Formulario paso a paso ---------------- */
function Progress({ step, maxStep, onJump }) {
  return (
    <nav className="progress" aria-label="Progreso del diagnóstico">
      <p className="progress-label" aria-live="polite">Paso {step + 1} de {STEPS.length}</p>
      <ol>
        {STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'todo';
          const reachable = i <= maxStep && i !== step;
          return (
            <li key={s.id} className={'seg ' + state}>
              <button type="button" disabled={!reachable} aria-current={i === step ? 'step' : undefined} onClick={() => onJump(i)}>
                <span className="seg-bar" />
                <span className="seg-name">{s.short}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function OptionGrid({ name, options, value, onChange, labelledBy, compact, invalid, onEnter }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} aria-invalid={invalid || undefined} className={'opts' + (compact ? ' compact' : '')}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } }}>
      {options.map((o) => (
        <label key={o.id} className={'opt' + (value === o.id ? ' on' : '')}>
          <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
          <span className="opt-body">
            <span className="opt-mark" aria-hidden="true"><Icon.check /></span>
            <span className="opt-text">
              <span className="opt-label">{o.label}</span>
              {o.hint && <span className="opt-hint">{o.hint}</span>}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

function AnswersAside({ answers, step, maxStep, onJump }) {
  const rows = [
    ['Empresa', answers.company.trim()],
    ['Sector', answers.sector === 'otro' ? (answers.sectorOther.trim() || 'Otro') : labelOf(SECTORS, answers.sector)],
    ['Desafío', answers.challenge === 'otro' ? (answers.challengeOther.trim() || 'Otro') : labelOf(CHALLENGES, answers.challenge)],
    ['Tiempo semanal', labelOf(HOURS, answers.hours)],
    ['Objetivo', labelOf(GOALS, answers.goal)],
  ];
  return (
    <aside className="aside" aria-label="Tus respuestas">
      <p className="micro">Tus respuestas</p>
      <dl>
        {rows.map(([k, v], i) => (
          <div key={k} className={'aside-row' + (i === step ? ' current' : '')}>
            <dt>{k}</dt>
            <dd>
              {v ? <span>{v}</span> : <span className="empty">Pendiente</span>}
              {v && i <= maxStep && i !== step && (
                <button type="button" className="link-btn" onClick={() => onJump(i)} aria-label={'Editar ' + k.toLowerCase()}><Icon.edit /> Editar</button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="aside-note">Las respuestas se quedan en esta pestaña. Puedes regresar a cualquier paso sin perderlas.</p>
    </aside>
  );
}

function Wizard({ answers, setAnswers, step, maxStep, goStep, onFinish }) {
  const [error, setError] = useState('');
  const [dir, setDir] = useState(1);
  const headRef = useRef(null);
  const inputRef = useRef(null);
  const cfg = STEPS[step];
  const copy = stepCopy(step, answers);
  const value = answers[cfg.id];

  useEffect(() => {
    setError('');
    const target = cfg.type === 'text' ? inputRef.current : headRef.current;
    if (target) target.focus({ preventScroll: true });
  }, [step]);

  const update = (k, v) => { setAnswers((a) => ({ ...a, [k]: v })); setError(''); };

  function validate() {
    if (cfg.type === 'text') {
      const v = answers.company.trim();
      if (!v) return 'Escribe el nombre de tu empresa para continuar.';
      if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
      return '';
    }
    return value ? '' : 'Elige una opción para continuar.';
  }
  function next(e) {
    if (e) e.preventDefault();
    const err = validate();
    if (err) { setError(err); if (cfg.type === 'text' && inputRef.current) inputRef.current.focus(); return; }
    if (cfg.type === 'text') update('company', answers.company.trim().replace(/\s+/g, ' '));
    if (step < STEPS.length - 1) { setDir(1); goStep(step + 1); } else onFinish();
  }
  function prev() { if (step > 0) { setDir(-1); goStep(step - 1); } }
  function jump(i) { setDir(i > step ? 1 : -1); goStep(i); }

  const isLast = step === STEPS.length - 1;
  const showOther = cfg.otherKey && value === 'otro';

  return (
    <section className="wrap flow" aria-label="Diagnóstico">
      <Progress step={step} maxStep={maxStep} onJump={jump} />
      <div className="flow-grid">
        <form className="q-card" onSubmit={next} noValidate>
          <div key={step} className={'q-anim ' + (dir > 0 ? 'fwd' : 'bwd')}>
            <p className="q-num">{String(step + 1).padStart(2, '0')} <span>/ {String(STEPS.length).padStart(2, '0')}</span></p>
            <h1 id="q-title" ref={headRef} tabIndex={-1} className="q-title">{copy.title}</h1>
            <p id="q-help" className="q-help">{copy.help}</p>

            {cfg.type === 'text' ? (
              <div className="field">
                <label htmlFor="company" className="sr-only">Nombre de la empresa</label>
                <input id="company" ref={inputRef} className="text-in" type="text" autoComplete="organization" maxLength={60}
                  placeholder="Ej.: Metalmecánica del Sur" value={answers.company}
                  aria-invalid={!!error} aria-describedby={'q-help' + (error ? ' q-err' : '')}
                  onChange={(e) => update('company', e.target.value)} />
                <span className="count" aria-hidden="true">{answers.company.length}/60</span>
              </div>
            ) : (
              <OptionGrid name={cfg.id} options={cfg.options} value={value} labelledBy="q-title" compact={cfg.compact}
                invalid={!!error} onChange={(v) => update(cfg.id, v)} onEnter={next} />
            )}

            {showOther && (
              <div className="field other">
                <label htmlFor={cfg.otherKey} className="other-label">Cuéntanos brevemente <span>(opcional)</span></label>
                <input id={cfg.otherKey} className="text-in sm" type="text" maxLength={60}
                  placeholder={cfg.id === 'sector' ? 'Ej.: Logística, textiles, comercio…' : 'Ej.: Rotación de personal, cobranza…'}
                  value={answers[cfg.otherKey]} onChange={(e) => update(cfg.otherKey, e.target.value)} />
              </div>
            )}

            <p id="q-err" className="err" role="alert">{error}</p>
          </div>

          <div className="q-nav">
            <button type="button" className="btn btn-ghost" onClick={prev} disabled={step === 0}><Icon.back /> Atrás</button>
            <button type="submit" className="btn btn-primary">{isLast ? 'Ver propuesta' : 'Continuar'} <Icon.arrow /></button>
          </div>
        </form>
        <AnswersAside answers={answers} step={step} maxStep={maxStep} onJump={jump} />
      </div>
    </section>
  );
}

/* ---------------- Transición de análisis ---------------- */
function Analyzing({ answers, onDone }) {
  const company = answers.company.trim();
  const msgs = ['Analizando las respuestas', 'Identificando oportunidades de mejora', `Preparando una propuesta para ${company}`];
  const [i, setI] = useState(0);
  const headRef = useFocusOnMount();
  useEffect(() => {
    const d = reduceMotion() ? 450 : 1050;
    let alive = true;
    const t = [setTimeout(() => setI(1), d), setTimeout(() => setI(2), d * 2),
      setTimeout(async () => { const dx = await ACTIVE_PROVIDER.diagnose(answers); if (alive) onDone(dx); }, d * 3 + 250)];
    return () => { alive = false; t.forEach(clearTimeout); };
  }, []);
  return (
    <section className="wrap analyzing" aria-labelledby="a-title">
      <div className="orbit" aria-hidden="true"><span /><span /><span /></div>
      <h1 id="a-title" ref={headRef} tabIndex={-1} className="a-title">Un momento</h1>
      <ol className="a-list" aria-live="polite">
        {msgs.map((m, k) => (
          <li key={k} className={k < i ? 'done' : k === i ? 'now' : 'todo'}>
            <span className="a-dot" aria-hidden="true">{k < i ? <Icon.check /> : null}</span>
            <span>{m}</span>
          </li>
        ))}
      </ol>
      <p className="fine center">Prototipo: la propuesta se arma con reglas locales a partir de tus respuestas. No se consultan fuentes externas ni datos de la empresa.</p>
    </section>
  );
}

/* ---------------- Resultados ---------------- */
function Urgency({ u }) {
  return (
    <div className="urg" aria-label={'Prioridad del proceso: ' + u.level}>
      <span className="urg-bars" aria-hidden="true">
        {[1, 2, 3].map((b) => <span key={b} className={u.bars === 0 ? 'dash' : b <= u.bars ? 'on' : ''} />)}
      </span>
      <span>{u.level}</span>
    </div>
  );
}

function Results({ dx, onExplore, onEdit, onRestart }) {
  const headRef = useFocusOnMount();
  return (
    <section className="wrap results" aria-labelledby="r-title">
      <div className="r-head">
        <p className="eyebrow">Propuesta preliminar</p>
        <h1 id="r-title" ref={headRef} tabIndex={-1} className="display r-title">{dx.company}</h1>
        <dl className="r-facts">
          <div><dt>Sector</dt><dd>{dx.sectorLabel}</dd></div>
          <div><dt>Problema prioritario</dt><dd>{dx.problemLabel}</dd></div>
          <div><dt>Prioridad del proceso</dt><dd><Urgency u={dx.urgency} /></dd></div>
          <div><dt>Objetivo</dt><dd>{dx.goalLabel}</dd></div>
        </dl>
      </div>

      {dx.needsValidation && (
        <div className="callout" role="note">
          <span className="tag">Requiere validación</span>
          <p><strong>Propuesta general.</strong> Elegiste “Otro” en {dx.sector === 'otro' ? 'el sector' : 'el desafío'}, así que las recomendaciones son amplias y conviene confirmarlas en una conversación con el equipo.</p>
        </div>
      )}

      <div className="r-grid">
        <div className="r-main">
          <article className="r-block">
            <h2 className="h2">Resumen del diagnóstico</h2>
            {dx.summary.map((p, i) => <p key={i}>{p}</p>)}
            <p className="muted">{dx.hoursNote}</p>
          </article>

          <article className="r-block">
            <h2 className="h2">Oportunidad de mejora</h2>
            <p>{dx.opportunity}</p>
          </article>

          <article className="r-block solution glow-card">
            <p className="micro accent">Solución recomendada</p>
            <h2 className="sol-title">{dx.solution.title}</h2>
            <p>{dx.solution.text}</p>
            <p className="muted">{dx.solution.focus}</p>
            <button type="button" className="btn btn-primary" onClick={onExplore}>Explorar solución <Icon.arrow /></button>
          </article>

          <article className="r-block">
            <h2 className="h2">Pasos de implementación</h2>
            {dx.premeasure && (
              <p className="pre-step"><strong>Antes de empezar:</strong> registren durante dos semanas cuánto tiempo toma el proceso. Esa medición será la línea base para comparar.</p>
            )}
            <ol className="steps">
              {dx.steps.map(([t, d], i) => (
                <li key={i}>
                  <span className="step-n" aria-hidden="true">{i + 1}</span>
                  <div><h3>{t}</h3><p>{d}</p></div>
                </li>
              ))}
            </ol>
          </article>

          <article className="r-block">
            <h2 className="h2">Beneficios potenciales</h2>
            <ul className="benefits">
              {dx.benefits.map((b) => <li key={b}><Icon.check /> {b}</li>)}
            </ul>
            <p className="fine">Son beneficios posibles. Su alcance depende de la implementación, la calidad de los datos y la adopción del equipo; no se garantizan resultados.</p>
          </article>
        </div>

        <aside className="r-side">
          <div className="card side-card">
            <p className="micro">Siguiente paso</p>
            <p className="side-text">Mira cómo funcionaría “{dx.demoName.toLowerCase()}” con datos de ejemplo.</p>
            <button type="button" className="btn btn-ghost btn-block" onClick={onExplore}>Explorar solución <Icon.arrow /></button>
            <button type="button" className="btn btn-ghost btn-block" onClick={onEdit}><Icon.edit /> Ajustar respuestas</button>
            <RestartButton onConfirm={onRestart} label="Diagnosticar otra empresa" />
          </div>
          <p className="fine">Generado con reglas locales del prototipo. No incluye búsqueda web ni análisis de datos reales.</p>
        </aside>
      </div>
    </section>
  );
}

/* ---------------- Demostraciones ---------------- */
const prioOfScore = (s) => (s >= 60 ? 'alta' : s >= 35 ? 'media' : 'baja');
const PRIO_LABEL = { alta: 'Alta', media: 'Media', baja: 'Baja' };

function scoreItem(mode, it) {
  if (mode === 'clients') return Math.min(100, Math.round(it.value * 0.8 + it.days * 2.4 + (STAGE_WEIGHT[it.stage] || 0)));
  return Math.max(0, Math.min(100, Math.round(it.touches * 11 + (CHANNEL_WEIGHT[it.channel] || 0) - it.days * 2)));
}

function PipelineDemo({ mode, company, notify }) {
  const cfg = PIPELINE[mode];
  const [items, setItems] = useState(() => cfg.items.map((x) => ({ ...x })));
  const [filter, setFilter] = useState('todas');
  const scored = items.map((it) => ({ ...it, score: scoreItem(mode, it) })).map((it) => ({ ...it, prio: prioOfScore(it.score) }));
  const sorted = [...scored].sort((a, b) => (a.contacted === b.contacted ? b.score - a.score : a.contacted ? 1 : -1));
  const shown = sorted.filter((it) => filter === 'todas' || it.prio === filter);
  const counts = { alta: 0, media: 0, baja: 0 };
  scored.forEach((it) => { if (!it.contacted) counts[it.prio]++; });

  function contact(id) {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, contacted: true, days: mode === 'clients' ? 0 : it.days } : it)));
    const it = items.find((x) => x.id === id);
    notify(`${it.name}: contacto registrado. La lista se reordenó.`);
  }

  return (
    <div className="demo-body">
      <div className="demo-toolbar">
        <div className="filters" role="group" aria-label="Filtrar por prioridad">
          {['todas', 'alta', 'media', 'baja'].map((f) => (
            <button key={f} type="button" className={'filter ' + f + (filter === f ? ' on' : '')} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'todas' ? 'Todas' : PRIO_LABEL[f]}
              {f !== 'todas' && <span className="count-pill">{counts[f]}</span>}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setItems(cfg.items.map((x) => ({ ...x }))); setFilter('todas'); notify('Datos de ejemplo restablecidos.'); }}>Restablecer ejemplo</button>
      </div>
      <p className="demo-explain">{cfg.explain}</p>

      <ul className="pipe" aria-label={cfg.heading}>
        {shown.length === 0 && <li className="pipe-empty">No hay registros pendientes con esta prioridad.</li>}
        {shown.map((it) => (
          <li key={it.id} className={'pipe-row' + (it.contacted ? ' is-done' : '')}>
            <div className="pipe-main">
              <p className="pipe-name">{it.name}</p>
              <p className="pipe-meta">
                {mode === 'clients'
                  ? <>{it.stage} · ${fmt(it.value)} M estimados · {it.days === 0 ? 'contactado hoy' : `${it.days} días sin contacto`}</>
                  : <>{it.channel} · {it.touches} interacciones · {it.days} {it.days === 1 ? 'día' : 'días'} sin respuesta</>}
              </p>
            </div>
            <div className="pipe-score" aria-label={`Calificación ${it.score} de 100`}>
              <span className="meter"><span style={{ width: it.score + '%' }} className={it.prio} /></span>
              <span className="num">{it.score}</span>
            </div>
            <span className={'prio ' + (it.contacted ? 'done' : it.prio)}>{it.contacted ? cfg.done : PRIO_LABEL[it.prio]}</span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={it.contacted} onClick={() => contact(it.id)}>
              {it.contacted ? <><Icon.check /> Listo</> : cfg.action}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TasksDemo({ mode, company, notify }) {
  const seed = () => TASK_SEEDS[mode].map((t, i) => ({ id: i + 1, done: false, ...t }));
  const [tasks, setTasks] = useState(seed);
  const [title, setTitle] = useState('');
  const [prio, setPrio] = useState('media');
  const [due, setDue] = useState('manana');
  const [view, setView] = useState('pendientes');
  const [suggested, setSuggested] = useState(false);
  const [err, setErr] = useState('');
  const nextId = useRef(100);

  const w = (p) => PRIORITIES.find((x) => x.id === p).weight;
  const o = (d) => DUE.find((x) => x.id === d).order;
  let list = tasks.filter((t) => (view === 'todas' ? true : view === 'pendientes' ? !t.done : t.done));
  if (suggested) list = [...list].sort((a, b) => (a.done - b.done) || (w(b.priority) - w(a.priority)) || (o(a.due) - o(b.due)));
  const pending = tasks.filter((t) => !t.done).length;

  function add(e) {
    e.preventDefault();
    const t = title.trim();
    if (t.length < 3) { setErr('Escribe una tarea de al menos 3 caracteres.'); return; }
    setTasks((ts) => [{ id: nextId.current++, title: t, priority: prio, due, owner: 'Sin asignar', done: false }, ...ts]);
    setTitle(''); setErr(''); setView('pendientes');
    notify('Tarea creada.');
  }
  const cycle = (id) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, priority: t.priority === 'alta' ? 'media' : t.priority === 'media' ? 'baja' : 'alta' } : t)));
  const toggle = (id) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => { setTasks((ts) => ts.filter((t) => t.id !== id)); notify('Tarea eliminada.'); };

  return (
    <div className="demo-body">
      <form className="task-form" onSubmit={add} noValidate>
        <div className="tf-field grow">
          <label htmlFor="task-title">Nueva tarea</label>
          <input id="task-title" className="in" type="text" maxLength={80} placeholder="Ej.: Revisar facturas vencidas" value={title}
            aria-invalid={!!err} aria-describedby={err ? 'task-err' : undefined} onChange={(e) => { setTitle(e.target.value); setErr(''); }} />
        </div>
        <div className="tf-field">
          <label htmlFor="task-prio">Prioridad</label>
          <select id="task-prio" className="in" value={prio} onChange={(e) => setPrio(e.target.value)}>
            {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="tf-field">
          <label htmlFor="task-due">Fecha</label>
          <select id="task-due" className="in" value={due} onChange={(e) => setDue(e.target.value)}>
            {DUE.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-primary tf-add"><Icon.plus /> Agregar</button>
        <p id="task-err" className="err" role="alert">{err}</p>
      </form>

      <div className="demo-toolbar">
        <div className="filters" role="group" aria-label="Mostrar tareas">
          {[['pendientes', `Pendientes`, pending], ['completadas', 'Completadas', tasks.length - pending], ['todas', 'Todas', tasks.length]].map(([id, l, n]) => (
            <button key={id} type="button" className={'filter' + (view === id ? ' on' : '')} aria-pressed={view === id} onClick={() => setView(id)}>{l}<span className="count-pill">{n}</span></button>
          ))}
        </div>
        <button type="button" className={'btn btn-sm ' + (suggested ? 'btn-soft' : 'btn-ghost')} aria-pressed={suggested}
          onClick={() => { setSuggested((s) => !s); if (!suggested) notify('Tareas ordenadas por prioridad y fecha.'); }}>
          {suggested ? <><Icon.check /> Orden sugerido</> : 'Sugerir orden de trabajo'}
        </button>
      </div>
      <p className="demo-explain">El orden sugerido pone primero las tareas de prioridad alta y, entre ellas, las que vencen antes. Toca la prioridad de una tarea para cambiarla.</p>

      <ul className="tasks" aria-label={'Tareas de ' + company}>
        {list.length === 0 && <li className="pipe-empty">{view === 'completadas' ? 'Aún no hay tareas completadas.' : 'No hay tareas pendientes. Agrega una arriba.'}</li>}
        {list.map((t) => (
          <li key={t.id} className={'task' + (t.done ? ' is-done' : '')}>
            <label className="task-check">
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span className="box" aria-hidden="true"><Icon.check /></span>
              <span className="sr-only">Marcar como {t.done ? 'pendiente' : 'completada'}: {t.title}</span>
            </label>
            <div className="task-main">
              <p className="task-title">{t.title}</p>
              <p className="pipe-meta">{t.owner} · {DUE.find((d) => d.id === t.due).label}</p>
            </div>
            <button type="button" className={'prio prio-btn ' + t.priority} onClick={() => cycle(t.id)} aria-label={`Prioridad ${PRIO_LABEL[t.priority]}. Cambiar prioridad`}>{PRIO_LABEL[t.priority]}</button>
            <button type="button" className="icon-btn" onClick={() => remove(t.id)} aria-label={'Eliminar tarea: ' + t.title}><Icon.x /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function stockStatus(it) {
  if (it.stock <= it.min) return 'reponer';
  if (it.stock <= it.min * 1.3) return 'bajo';
  return 'ok';
}
const STOCK_LABEL = { reponer: 'Reponer', bajo: 'Bajo', ok: 'Óptimo' };

function InventoryDemo({ sector, company, notify }) {
  const seed = () => (INVENTORY[sector] || INVENTORY.otro).map(([name, unit, stock, min, weekly], i) => ({ id: i, name, unit, stock, min, weekly }));
  const [items, setItems] = useState(seed);
  const [order, setOrder] = useState(null);
  const adjust = (id, sign) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, stock: Math.max(0, x.stock + sign * Math.max(1, Math.round(x.min * 0.1))) } : x)));
  const withStatus = items.map((x) => ({ ...x, status: stockStatus(x), cover: x.weekly ? x.stock / x.weekly : 0 }));
  const toReorder = withStatus.filter((x) => x.status !== 'ok');

  function suggest() {
    const lines = toReorder.map((x) => ({ name: x.name, unit: x.unit, qty: Math.max(0, Math.ceil(x.min * 1.5 + x.weekly - x.stock)) })).filter((l) => l.qty > 0);
    setOrder(lines);
    notify(lines.length ? `Pedido sugerido con ${lines.length} productos.` : 'No hay productos por reponer.');
  }

  return (
    <div className="demo-body">
      <div className="kpis three">
        <div className="kpi"><span className="kpi-l">Productos</span><span className="kpi-v">{items.length}</span></div>
        <div className="kpi"><span className="kpi-l">Por reponer</span><span className="kpi-v hi">{withStatus.filter((x) => x.status === 'reponer').length}</span></div>
        <div className="kpi"><span className="kpi-l">En nivel bajo</span><span className="kpi-v">{withStatus.filter((x) => x.status === 'bajo').length}</span></div>
      </div>
      <p className="demo-explain">Un producto pasa a “Reponer” cuando su existencia llega al mínimo, y a “Bajo” cuando queda a menos del 30 % por encima. Usa − y + para simular entradas y salidas.</p>

      <div className="table-wrap">
        <table className="inv">
          <caption className="sr-only">Existencias de ejemplo para {company}</caption>
          <thead><tr><th scope="col">Producto</th><th scope="col" className="r">Existencia</th><th scope="col" className="r">Mínimo</th><th scope="col" className="r">Cobertura</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Ajustar</span></th></tr></thead>
          <tbody>
            {withStatus.map((x) => (
              <tr key={x.id} className={'st-' + x.status}>
                <th scope="row"><span className="inv-name">{x.name}</span><span className="inv-unit">{x.unit}</span></th>
                <td className="r num">{fmt(x.stock)}</td>
                <td className="r num muted">{fmt(x.min)}</td>
                <td className="r num">{fmt(x.cover, 1)} sem.</td>
                <td><span className={'prio ' + (x.status === 'reponer' ? 'alta' : x.status === 'bajo' ? 'media' : 'ok')}>{STOCK_LABEL[x.status]}</span></td>
                <td>
                  <div className="stepper">
                    <button type="button" className="icon-btn" aria-label={'Restar existencias de ' + x.name} onClick={() => adjust(x.id, -1)}><Icon.minus /></button>
                    <button type="button" className="icon-btn" aria-label={'Sumar existencias de ' + x.name} onClick={() => adjust(x.id, 1)}><Icon.plus /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="demo-toolbar">
        <button type="button" className="btn btn-primary btn-sm" onClick={suggest}>Generar pedido sugerido</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setItems(seed()); setOrder(null); notify('Datos de ejemplo restablecidos.'); }}>Restablecer ejemplo</button>
      </div>
      {order && (
        <div className="order card" aria-live="polite">
          <p className="micro">Pedido sugerido · ejemplo</p>
          {order.length === 0 ? <p>Todos los productos están en nivel óptimo.</p> : (
            <ul>{order.map((l) => <li key={l.name}><span>{l.name}</span><span className="num">{fmt(l.qty)} {l.unit}</span></li>)}</ul>
          )}
          <p className="fine">Cantidad = 1,5 veces el mínimo + una semana de consumo − existencia actual.</p>
        </div>
      )}
    </div>
  );
}

function niceStep(max) {
  const raw = max / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}
function BarChart({ values, labels, format, title }) {
  const W = 640, H = 260, L = 52, R = 12, T = 22, B = 34;
  const step = niceStep(Math.max(...values));
  const top = step * Math.ceil(Math.max(...values) / step);
  const ticks = []; for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const bw = (W - L - R) / values.length;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={title + ': ' + values.map((v, i) => `${labels[i]} ${format(v)}`).join(', ')}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="tick">{format(t)}</text>
          </g>
        ))}
        {values.map((v, i) => {
          const x = L + i * bw + bw * 0.2, w = bw * 0.6, last = i === values.length - 1;
          return (
            <g key={i}>
              <rect x={x} y={y(v)} width={w} height={y(0) - y(v)} rx="6" className={'bar' + (last ? ' last' : '')} />
              <text x={x + w / 2} y={y(v) - 7} textAnchor="middle" className={'val' + (last ? ' strong' : '')}>{format(v)}</text>
              <text x={x + w / 2} y={H - 12} textAnchor="middle" className="tick">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AnalyticsDemo({ company, notify }) {
  const s = useMemo(() => makeSeries(company), [company]);
  const [metric, setMetric] = useState('ventas');
  const last = (a) => a[a.length - 1], prev = (a) => a[a.length - 2];
  const pct = (a) => ((last(a) - prev(a)) / prev(a)) * 100;
  const ticket = s.ventas.map((v, i) => (v * 1e6) / s.pedidos[i]);
  const M = {
    ventas: { label: 'Ventas', subj: 'las ventas', pl: true, data: s.ventas, f: (v) => `$${fmt(v, v < 10 ? 1 : 0)} M`, good: 1 },
    pedidos: { label: 'Pedidos', subj: 'los pedidos', pl: true, data: s.pedidos, f: (v) => fmt(v), good: 1 },
    respuesta: { label: 'Tiempo de respuesta', subj: 'el tiempo de respuesta', pl: false, data: s.respuesta, f: (v) => `${fmt(v, 1)} h`, good: -1 },
  };
  const m = M[metric];
  const kpis = [
    ['Ventas de octubre', `$${fmt(last(s.ventas), 1)} M`, pct(s.ventas), 1],
    ['Pedidos', fmt(last(s.pedidos)), pct(s.pedidos), 1],
    ['Ticket promedio', cop(Math.round(last(ticket) / 1000) * 1000), pct(ticket), 1],
    ['Tiempo de respuesta', `${fmt(last(s.respuesta), 1)} h`, pct(s.respuesta), -1],
  ];
  const first = m.data[0], end = last(m.data), change = ((end - first) / first) * 100;
  const peak = m.data.indexOf(Math.max(...m.data)), low = m.data.indexOf(Math.min(...m.data));
  const better = change * m.good > 0;
  const reading = `En los datos de ejemplo, ${m.subj} ${change >= 0 ? (m.pl ? 'subieron' : 'subió') : (m.pl ? 'bajaron' : 'bajó')} de ${m.f(first)} a ${m.f(end)} entre mayo y octubre (${change >= 0 ? '+' : ''}${fmt(change, 1)} %). `
    + `El valor más alto fue en ${MONTHS_LONG[peak]} y el más bajo en ${MONTHS_LONG[low]}. `
    + (better ? 'La tendencia es favorable; conviene identificar qué la explica para sostenerla.' : 'La tendencia es desfavorable; vale la pena revisar qué cambió en los meses de caída.');

  return (
    <div className="demo-body">
      <div className="kpis">
        {kpis.map(([l, v, c, g]) => {
          const good = c * g >= 0;
          return (
            <div className="kpi" key={l}>
              <span className="kpi-l">{l}</span>
              <span className="kpi-v">{v}</span>
              <span className={'delta ' + (good ? 'up' : 'down')}><span aria-hidden="true">{c >= 0 ? '▲' : '▼'}</span> {fmt(Math.abs(c), 1)} % vs. septiembre</span>
            </div>
          );
        })}
      </div>
      <div className="card chart-card">
        <div className="chart-head">
          <h3 className="h3">{m.label} por mes</h3>
          <div className="filters" role="group" aria-label="Indicador del gráfico">
            {Object.entries(M).map(([k, v]) => (
              <button key={k} type="button" className={'filter' + (metric === k ? ' on' : '')} aria-pressed={metric === k} onClick={() => setMetric(k)}>{v.label}</button>
            ))}
          </div>
        </div>
        <BarChart values={m.data} labels={MONTHS} format={m.f} title={m.label + ' por mes, datos de ejemplo'} />
        <div className="reading">
          <p className="micro accent">Lectura automática · ejemplo</p>
          <p>{reading}</p>
        </div>
      </div>
    </div>
  );
}

function Demo({ dx, onBack, onRestart, notify }) {
  const headRef = useFocusOnMount();
  let body;
  if (dx.demo === 'pipeline') body = <PipelineDemo mode={dx.demoMode} company={dx.company} notify={notify} />;
  else if (dx.demo === 'tasks') body = <TasksDemo mode={dx.demoMode} company={dx.company} notify={notify} />;
  else if (dx.demo === 'inventory') body = <InventoryDemo sector={dx.sector} company={dx.company} notify={notify} />;
  else body = <AnalyticsDemo company={dx.company} notify={notify} />;
  return (
    <section className="wrap demo" aria-labelledby="d-title">
      <button type="button" className="link-btn back" onClick={onBack}><Icon.back /> Volver a la propuesta</button>
      <div className="demo-head">
        <div>
          <p className="eyebrow">Demostración · {dx.demoName}</p>
          <h1 id="d-title" ref={headRef} tabIndex={-1} className="display d-title">Así podría funcionar en {dx.company}</h1>
          <p className="lead sm">{dx.solution.title}.</p>
        </div>
      </div>
      <div className="sample-banner" role="note">
        <span className="tag">Datos ficticios</span>
        <span>Todos los nombres, cifras y registros son ejemplos. No corresponden a {dx.company}.</span>
      </div>
      <div className="card demo-card">{body}</div>
      <div className="demo-foot">
        <button type="button" className="btn btn-ghost" onClick={onBack}><Icon.back /> Volver a la propuesta</button>
        <RestartButton onConfirm={onRestart} label="Diagnosticar otra empresa" />
      </div>
    </section>
  );
}

/* ---------------- Colibrí institucional (botón) ---------------- */
function ColibriButton({ onClick, btnRef, hidden, imgOk }) {
  return (
    <button type="button" ref={btnRef} className={'colibri' + (hidden ? ' is-hidden' : '')} onClick={onClick}
      aria-label="Universidad Externado de Colombia. Enlace disponible próximamente" tabIndex={hidden ? -1 : 0}>
      {imgOk
        ? <img src={COLIBRI_SRC} alt="" width="120" height="120" decoding="async" />
        : <span className="colibri-fallback" aria-hidden="true"><span>Externado</span></span>}
      <span className="colibri-tip" aria-hidden="true">Próximamente</span>
    </button>
  );
}

/* ---------------- Apertura: vuelo del colibrí ----------------
   Coreografía (≈2,6 s): entra desde abajo a la izquierda, se acerca a
   la pantalla, sostiene el vuelo, da una vuelta, la interfaz se revela
   en círculo desde el centro y el colibrí se posa en su botón. */
const BIRD = 380;          // tamaño máximo en pantalla (px). Las escalas nunca pasan de 1,
                           // así el navegador solo reduce la imagen y no la pixela.
const INTRO_MS = 2600;     // duración del vuelo
const REVEAL_AT = 0.58;    // momento (fracción) en que empieza la revelación
const REVEAL_MS = 780;

function loadImage(src, timeout = 900) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (ok) => { if (!settled) { settled = true; resolve(ok); } };
    img.onload = () => done(true);
    img.onerror = () => done(false);
    setTimeout(() => done(false), timeout);
    img.src = src;
  });
}

function flightFrames(W, H, target, imgOk) {
  const cx = W / 2, cy = H * 0.46, r = Math.min(W, H) * 0.17;
  const near = Math.min(1, (Math.min(W, H) * 0.58) / BIRD);   // acercamiento a la cámara
  const land = target ? target.width / BIRD : 0.5;
  const tx = target ? target.left + target.width / 2 : W - 76;
  const ty = target ? target.top + target.height / 2 : H - 76;
  const k = (x, y, s, rot, o, offset, easing) => ({
    transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${rot}deg) scale(${s.toFixed(3)})`,
    opacity: o, offset, easing,
  });
  return {
    center: [cx, cy],
    frames: [
      k(-0.1 * W, H * 0.86, near * 0.18, -16, 0, 0, 'cubic-bezier(.3,0,.25,1)'),
      k(0.24 * W, H * 0.64, near * 0.42, -9, 1, 0.17, 'cubic-bezier(.45,0,.2,1)'),
      k(cx, cy, near, 0, 1, 0.38, 'ease-in-out'),            // se acerca
      k(cx, cy - 6, near * 0.94, 2, 1, 0.47, 'cubic-bezier(.45,0,.55,1)'), // aletea en el sitio
      k(cx + r, cy - r * 0.3, near * 0.62, 16, 1, 0.58, 'linear'),         // vuelta
      k(cx, cy - r, near * 0.5, 0, 1, 0.67, 'linear'),
      k(cx - r, cy - r * 0.3, near * 0.5, -16, 1, 0.76, 'linear'),
      k(cx, cy + r * 0.3, near * 0.52, 0, 1, 0.84, 'cubic-bezier(.5,0,.2,1)'),
      imgOk ? k(tx, ty, land, 0, 0.38, 1) : k(tx, ty, land * 0.4, 0, 0, 1), // se posa en el botón
    ],
  };
}

function Intro({ appRef, targetRef, imgOk, onDone }) {
  const birdRef = useRef(null);
  const ghostRefs = [useRef(null), useRef(null)];
  const fgRef = useRef(null);
  const bgRef = useRef(null);
  const barRef = useRef(null);
  const skipRef = useRef(null);
  const anims = useRef([]);
  const done = useRef(false);
  const [phase, setPhase] = useState('loading');

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    anims.current.forEach((a) => { try { a.cancel(); } catch (e) {} });
    if (appRef.current) appRef.current.style.clipPath = '';
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (skipRef.current) skipRef.current.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    const app = appRef.current;
    const canAnimate = app && typeof app.animate === 'function' && birdRef.current;
    if (!canAnimate) { finish(); return () => window.removeEventListener('keydown', onKey); }

    if (reduceMotion()) {
      const a = bgRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      app.style.clipPath = '';
      anims.current.push(a);
      a.onfinish = finish;
      return () => window.removeEventListener('keydown', onKey);
    }

    setPhase('flying');
    const W = window.innerWidth, H = window.innerHeight;
    const target = targetRef.current ? targetRef.current.getBoundingClientRect() : null;
    const { center: [cx, cy], frames } = flightFrames(W, H, target, imgOk);
    const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 24;

    const bird = birdRef.current.animate(frames, { duration: INTRO_MS, fill: 'forwards' });
    anims.current.push(bird);
    ghostRefs.forEach((g, i) => {
      if (!g.current) return;
      const fade = [0.22, 0.1][i];
      const gf = frames.map((f, j) => ({ ...f, opacity: j === frames.length - 1 ? 0 : f.opacity * fade }));
      anims.current.push(g.current.animate(gf, { duration: INTRO_MS, delay: 55 * (i + 1), fill: 'forwards' }));
    });
    anims.current.push(barRef.current.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: INTRO_MS, easing: 'linear', fill: 'forwards' }));
    anims.current.push(app.animate(
      [{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)` }],
      { duration: REVEAL_MS, delay: INTRO_MS * REVEAL_AT, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' },
    ));
    anims.current.push(fgRef.current.querySelector('.intro-chrome').animate(
      [{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: INTRO_MS * REVEAL_AT + REVEAL_MS * 0.5, fill: 'forwards' },
    ));
    bird.onfinish = finish;
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const birdInner = imgOk
    ? <img src={COLIBRI_SRC} alt="" width={BIRD} height={BIRD} decoding="async" />
    : <span className="bird-orb" />;

  return (
    <>
      <div ref={bgRef} className="intro-bg" aria-hidden="true">
        <div className="intro-mark">
          <span className="logo intro-logo" />
          <span>Departamento de Matemáticas</span>
        </div>
      </div>
      <div ref={fgRef} className={'intro-fg ' + phase} role="dialog" aria-modal="true" aria-label="Apertura del diagnóstico">
        {ghostRefs.map((g, i) => <div key={i} ref={g} className="bird ghost" aria-hidden="true">{birdInner}</div>)}
        <div ref={birdRef} className="bird" aria-hidden="true"><div className="bird-hover">{birdInner}</div></div>
        <div className="intro-chrome">
          <button ref={skipRef} type="button" className="btn btn-ghost btn-sm intro-skip" onClick={finish}>Saltar intro</button>
          <div className="intro-bar" aria-hidden="true"><span ref={barRef} /></div>
        </div>
        <p className="sr-only" aria-live="polite">Cargando el diagnóstico empresarial. Pulsa Escape o el botón Saltar intro para continuar.</p>
      </div>
    </>
  );
}

function Footer({ onReplay, onSection }) {
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <span className="logo" role="img" aria-label="Universidad Externado de Colombia" />
          <p>Prototipo académico del Departamento de Matemáticas. Resultados orientativos generados con reglas locales y datos de demostración.</p>
        </div>
        <nav className="foot-col" aria-label="Secciones del pie">
          <p className="micro">Explorar</p>
          {SECTIONS.map((s) => <button key={s.id} type="button" className="foot-link" onClick={() => onSection(s.id)}>{s.label}</button>)}
          <button type="button" className="foot-link" onClick={onReplay}>Repetir apertura</button>
        </nav>
        <div className="foot-col">
          <p className="micro">Universidad</p>
          <a className="foot-link" href={DEPT_URL} target="_blank" rel="noopener noreferrer">Departamento de Matemáticas <ExtIcon /></a>
          <a className="foot-link" href={UNI_URL} target="_blank" rel="noopener noreferrer">Universidad Externado de Colombia <ExtIcon /></a>
        </div>
      </div>
      <div className="wrap foot-base"><p>© 2026 · Prototipo académico. No es un servicio oficial de la Universidad.</p></div>
    </footer>
  );
}

/* ---------------- Aplicación ---------------- */
// La apertura se reproduce en cada carga de la página.
function introPending() { return true; }

function sampleDiagnosis(challenge) {
  return buildDiagnosis({ ...EMPTY_ANSWERS, company: 'Empresa de ejemplo', sector: 'tecnologia', challenge, hours: '5a10', goal: 'tiempo' });
}

function App() {
  const [screen, setScreen] = useState('welcome');
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [dx, setDx] = useState(null);
  const [toast, setToast] = useState(null);
  const [intro, setIntro] = useState(introPending() ? 'preload' : 'off'); // preload → on → off
  const [imgOk, setImgOk] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const [active, setActive] = useState('');
  const [pendingSection, setPendingSection] = useState(null);
  const appRef = useRef(null);
  const colibriRef = useRef(null);

  const notify = useCallback((msg) => setToast({ msg, id: Date.now() }), []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3400); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (!pendingSection) window.scrollTo(0, 0); }, [screen, step]);

  // Precarga del colibrí: decide si se usa la imagen o el respaldo
  useEffect(() => { let alive = true; loadImage(COLIBRI_SRC).then((ok) => { if (!alive) return; setImgOk(ok); setIntro((v) => (v === 'preload' ? 'on' : v)); }); return () => { alive = false; }; }, []);
  // Mientras corre la apertura, la interfaz no recibe foco
  useEffect(() => { if (appRef.current) appRef.current.inert = intro !== 'off'; }, [intro]);

  // Desplazamiento a una sección (también desde otras pantallas)
  useEffect(() => {
    if (screen !== 'welcome' || !pendingSection) return;
    const id = pendingSection;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); el.focus({ preventScroll: true }); }
      setPendingSection(null);
    });
  }, [screen, pendingSection]);

  // Sección activa en la barra superior
  useEffect(() => {
    if (screen !== 'welcome' || typeof IntersectionObserver === 'undefined') { setActive(''); return; }
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    const onTop = () => { if (window.scrollY < 200) setActive(''); };
    window.addEventListener('scroll', onTop, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', onTop); };
  }, [screen]);

  const endIntro = useCallback(() => setIntro('off'), []);
  const replay = () => { window.scrollTo(0, 0); setIntroKey((k) => k + 1); setIntro('on'); };
  const goStep = (s) => { setStep(s); setMaxStep((m) => Math.max(m, s)); };
  const start = () => { setScreen('form'); goStep(0); };
  const home = () => { setScreen('welcome'); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); };
  const goSection = (id) => { setPendingSection(id); setScreen('welcome'); };
  const openSampleDemo = (challenge) => { setDx(sampleDiagnosis(challenge)); setScreen('demo'); };
  const restart = () => { setAnswers(EMPTY_ANSWERS); setStep(0); setMaxStep(0); setDx(null); setScreen('welcome'); notify('Listo. Puedes diagnosticar otra empresa.'); };
  const hiddenStyle = intro !== 'off' ? { clipPath: 'circle(0px at 50% 46%)' } : undefined;

  return (
    <>
      {intro === 'preload' && <div className="intro-bg" aria-hidden="true" />}
      {intro === 'on' && <Intro key={introKey} appRef={appRef} targetRef={colibriRef} imgOk={imgOk} onDone={endIntro} />}
      <div className="app" ref={appRef} style={hiddenStyle}>
        <FluidBackground />
        <Header screen={screen} active={active} onHome={home} onSection={goSection} onStart={start} onRestart={restart} />
        <main id="main" className={'main screen-' + screen}>
          {screen === 'welcome' && <Welcome onStart={start} onSection={goSection} onDemo={openSampleDemo} />}
          {screen === 'form' && <Wizard answers={answers} setAnswers={setAnswers} step={step} maxStep={maxStep} goStep={goStep} onFinish={() => setScreen('analyzing')} />}
          {screen === 'analyzing' && <Analyzing answers={answers} onDone={(d) => { setDx(d); setScreen('results'); }} />}
          {screen === 'results' && dx && <Results dx={dx} onExplore={() => setScreen('demo')} onEdit={() => { setMaxStep(STEPS.length - 1); setStep(0); setScreen('form'); }} onRestart={restart} />}
          {screen === 'demo' && dx && <Demo dx={dx} onBack={() => setScreen('results')} onRestart={restart} notify={notify} />}
        </main>
        <Footer onReplay={replay} onSection={goSection} />
        <ColibriButton btnRef={colibriRef} imgOk={imgOk} hidden={intro !== 'off'} onClick={() => notify('El acceso a la Universidad Externado estará disponible próximamente.')} />
        <div className="toast-zone" aria-live="polite">{toast && <div key={toast.id} className="toast">{toast.msg}</div>}</div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
