# Confi

Aplicación de la feria: **pitch** (presentación con avatar) y **stand** (Radar IA + página de muestra).

## Rutas principales

| Ruta | Responsabilidad |
| --- | --- |
| `/` | Elige **Pitch** o **Stand**. |
| `/pitch` | Presentación de siete diapositivas; la sexta integra avatar + consultor (Gemini/Tavus con variables de entorno). |
| `/consultoria` | **Stand:** landing Radar IA (misma que en `prueba/radar-ia`). |
| `/stand` | Redirige a `/consultoria`. |
| `/diagnostico` | Formulario Radar IA por industria. |
| `/resultado` | Informe Radar IA y acceso a la página generada. |
| `/encuestas`, `/caso/[id]`, `/flyer` | Catálogo y detalle de casos Radar. |
| `/consultor` | Panel de consultores (requiere `.env.local`). |
| `/sitio`, `/preview` | Página generada de demostración. |
| `/solucion` | Ejemplo turismo enlazado desde el pitch. |

Documentación Radar: `docs/RADAR-IA.md` y `docs/DESPLIEGUE.md`.

## Dónde vive cada cosa

- `features/pitch/` — diapositivas, avatar Tavus/Gemini.
- `components/radar/`, `lib/radar/` — stand Radar IA.
- `features/entry/experience-gate.tsx` — tarjetas Pitch / Stand.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abra http://localhost:3000. **Pitch** → `/pitch`. **Stand** → `/consultoria` (Radar IA).

## Requisitos

- Node.js 22.22.3
- npm 10

## Recorrido de la consultoría

1. Abra `/consultoria`. La apertura muestra el colibrí y se puede saltar con el botón o con Escape.
2. Entre al formulario. Puede empezar por gastronomía o por servicios profesionales.
3. Responda la empresa, el objetivo, las características y la identidad.
4. Genere el diagnóstico. El texto sale de esas respuestas.
5. Abra la página generada. El nombre, las secciones y la paleta cambian con el formulario.
6. Edite las respuestas o reinicie. Puede repetir la apertura desde el pie.

La página generada vive en `/preview`. No es una captura: la arma `lib/site/engine.ts` y la pintan los componentes de `components/site`.

Dos perfiles de prueba:

- Gastronomía, perfil cálido, con productos.
- Servicios profesionales, perfil sobrio, con servicios.

El mismo sector con otro objetivo cambia el título, el botón y el orden de las secciones.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Qué queda en este navegador

El formulario de la página se guarda en `localStorage`, bajo la clave `confi.site.v1`. El diagnóstico del stand usa `confi.walkthrough.v1`. Esas dos copias sobreviven a una recarga en el mismo navegador y no salen de este equipo. El sector elegido en el stand usa `sessionStorage` y dura solo mientras la pestaña sigue abierta.

El servidor, además, escribe la empresa y el diagnóstico en memoria del proceso para ejercitar los repositorios. Esa copia se pierde al detener `npm run dev` y la interfaz no la usa como fuente de verdad.

## Cómo se conectará después

`lib/repositories` define las operaciones de empresas, diagnósticos, sesiones y plantillas. `DATA_PROVIDER=memory` es la implementación actual. `DATA_PROVIDER=supabase` falla con un mensaje explícito hasta que exista un adaptador para una cuenta propia. Las variables previstas están en `.env.example`, vacías, sin claves de ejemplo.

`lib/diagnostic/provider.ts` expone el mismo contrato para reglas y para un futuro proveedor Gemini. `DIAGNOSIS_PROVIDER=gemini` todavía no llama a ningún modelo.

La interfaz pide un diagnóstico tipado. No necesita saber si la respuesta salió de reglas o de un modelo.

## Diseño

Las plantillas usan variables CSS en `app/globals.css`, activadas con `data-template` en el documento. Refero estaba conectado, pero la suscripción no permitió leer las referencias. Los colores y la tipografía de esta versión son propios.

## Límites del diagnóstico

El motor no mide ahorros, ventas ni tiempos. Si las respuestas son débiles, el resultado lo dice y lo trata como hipótesis. La demostración nunca presenta sus cifras como datos de la empresa.
