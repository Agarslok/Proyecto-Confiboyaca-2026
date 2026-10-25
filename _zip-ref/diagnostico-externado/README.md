# Diagnóstico Empresarial · Universidad Externado (prototipo académico)

Proyecto Vite + React 18. Es la misma interfaz del prototipo publicado; `REFERENCIA-diagnostico-externado.html`
es el resultado final de referencia (ábrelo en el navegador para comparar).

## Ejecutar
    npm install
    npm run dev      # http://localhost:5173
    npm run build

## Estructura
- `index.html` — documento base (fuentes Inter Tight + Inter desde Google Fonts).
- `src/styles.css` — TODO el CSS (tokens, barra flotante, drawer móvil, historia de IA, formulario, resultados, demos, intro).
- `src/main.jsx` — componentes React: FluidBackground (WebGL), Header flotante, Welcome (hero, Cómo funciona con red neuronal, Soluciones, Equipo), Wizard de 5 pasos, Analyzing, Results, Demos, ColibriButton, Intro, Footer, App.
- `src/data.js` — preguntas, reglas locales (`buildDiagnosis`), proveedor intercambiable (`ACTIVE_PROVIDER`, listo para Gemini) y datos ficticios de demos.
- `src/assets/colibri.webp` — colibrí oficial reescalado a 560×560.
- `src/assets/logo-mask.png` — máscara del logo de Externado (se colorea con CSS).

## Reglas para quien edite (Cursor)
1. NO cambiar el diseño: colores, tipografías, espaciados, animaciones y textos deben quedar idénticos a la referencia.
2. No agregar librerías de UI/animación; todo es React + CSS + Web Animations API + WebGL propio.
3. Pendiente: constante `TEAM` en `src/main.jsx` (nombre del equipo, integrantes, enlaces).
4. Mantener `prefers-reduced-motion`, foco accesible, `inert` durante la intro y el fallback sin WebGL.
5. Integración futura con Gemini: reemplazar `ACTIVE_PROVIDER` en `src/data.js`; sin claves en el cliente.
