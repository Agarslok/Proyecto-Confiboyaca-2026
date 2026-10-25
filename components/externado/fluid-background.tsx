"use client";

import { useEffect, useRef, useState } from "react";

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
  return field(p) + u_hover * pow(0.0175 * grow / (dot(dm, dm) + 0.003), 1.45);
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
  vec3 teal   = vec3(0.137, 0.322, 0.298);
  vec3 pulse  = vec3(0.200, 0.600, 0.549);
  vec3 mint   = vec3(0.592, 0.988, 0.843);
  vec3 halo = mix(forest, abyss, smoothstep(0.15, 0.95, s)) + pulse * 0.10 * smoothstep(0.45, 0.98, s);
  vec3 body = mix(abyss, teal, clamp(diff * 0.85 + depth * 0.15 - 0.05, 0.0, 1.0));
  vec3 col = mix(halo, body, inside);
  col += pulse * exp(-pow((s - 1.0) * 5.0, 2.0)) * 0.42;
  col += mint * spec * inside * 0.26;
  vec2 dmc = p - m;
  col += mint * exp(-dot(dmc, dmc) * 30.0) * 0.12 * u_hover;
  vec2 cp = (u_cpos - 0.5 * u_res) / u_res.y; cp.y -= u_scroll * 0.28;
  float ring = exp(-pow((length(p - cp) - u_click * 0.55) * 16.0, 2.0)) * (1.0 - u_click);
  col += mint * ring * 0.35;
  col *= 1.0 - 0.30 * smoothstep(0.45, 1.05, length(uv - vec2(0.5, 0.45)));
  gl_FragColor = vec4(col, 1.0);
}`;

const FLUID_VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";

function reduceMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
    if (!canvas || !gl) {
      setFallback(true);
      return;
    }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(gl.VERTEX_SHADER, FLUID_VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FLUID_FRAG);
    if (!vs || !fs) {
      setFallback(true);
      return;
    }
    const prog = gl.createProgram();
    if (!prog) {
      setFallback(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("u_res");
    const uTime = U("u_time");
    const uMouse = U("u_mouse");
    const uScroll = U("u_scroll");
    const uHover = U("u_hover");
    const uClick = U("u_click");
    const uCpos = U("u_cpos");
    let clickAt = -1e9;
    let cx = 0;
    let cy = 0;

    const QUALITY = 0.5;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = Math.max(1, Math.round(window.innerWidth * QUALITY));
      h = Math.max(1, Math.round(window.innerHeight * QUALITY));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();
    const target = { x: w * 0.72, y: h * 0.38, hover: 0.6 };
    const cur = { ...target };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX * QUALITY;
      target.y = h - e.clientY * QUALITY;
      target.hover = 1;
    };
    const onLeave = () => {
      target.hover = 0.6;
    };
    const onDown = (e: PointerEvent) => {
      clickAt = performance.now();
      cx = e.clientX * QUALITY;
      cy = h - e.clientY * QUALITY;
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);

    const still = reduceMotion();
    let raf = 0;
    const t0 = performance.now();
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / 45) return;
      last = now;
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      cur.hover += (target.hover - cur.hover) * 0.04;
      const sc = Math.min(1.5, window.scrollY / Math.max(1, window.innerHeight));
      gl.uniform1f(uTime, still ? 12.0 : (now - t0) / 1000 + 12.0);
      gl.uniform2f(uMouse, cur.x, cur.y);
      gl.uniform1f(uHover, cur.hover);
      gl.uniform1f(uScroll, sc);
      gl.uniform1f(uClick, Math.min(1, (now - clickAt) / 1100));
      gl.uniform2f(uCpos, cx, cy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="backdrop" aria-hidden="true">
      {fallback ? (
        <>
          <div className="blob b-abyss" />
          <div className="blob b-lagoon" />
          <div className="blob b-teal" />
          <div className="blob b-rim" />
        </>
      ) : (
        <canvas ref={canvasRef} className="fluid" />
      )}
    </div>
  );
}
