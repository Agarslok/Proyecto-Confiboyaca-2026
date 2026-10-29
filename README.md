# Confi

Aplicación de la feria con dos experiencias separadas y una consultoría de página web que ya existía.

Esta versión no llama a Gemini ni a una base de datos. El diagnóstico del stand sale del motor de reglas local. Las demostraciones usan datos ficticios.

## Rutas

| Ruta | Responsabilidad |
| --- | --- |
| `/` | Entrada. Elige pitch, stand o la consultoría existente. |
| `/pitch` | Presentación de siete diapositivas. El avatar ocupa la sexta y todavía no está conectado. |
| `/stand` | Abre la misma consultoría y el generador de página que `/consultoria`. |
| `/stand/diagnostico` | Formulario del motor de diagnóstico ya existente. |
| `/stand/resultado` | Lectura generada con reglas locales. |
| `/stand/demo` | Demostración interactiva con datos ficticios. |
| `/consultoria` | Página principal anterior: presentación, formulario de página web y consultoría. |
| `/diagnostico`, `/resultado`, `/sitio`, `/preview` | Recorrido de la consultoría y de la página generada. Siguen operativos. |
| `/demo` | Demostración del diagnóstico clásico, fuera del recorrido del stand. |

## Dónde vive cada cosa

- `app/pitch/` y `app/stand/` componen las rutas. No contienen la lógica del diagnóstico.
- `features/pitch/` guarda el guion, el escenario y las siete diapositivas. Las notas del presentador se abren con N.
- `features/pitch/components/avatar-stage.tsx` reserva el avatar. No simula una conexión.
- `features/stand/` guarda el sector del stand y el marco de navegación. El estado del sector vive en `sessionStorage` (`confi.stand.sector.v1`) y no se mezcla con el pitch.
- `components/diagnostic/`, `components/demos/`, `lib/diagnostic/` y `lib/data/demos.ts` siguen siendo el motor y las demostraciones reutilizadas.
- `components/externado/` y `components/site/` siguen siendo la consultoría.
- Turismo y agro todavía no tienen textos propios en el motor. Esas entradas usan la plantilla de servicios profesionales hasta que existan lentes sectoriales. Metalurgia usa la plantilla industrial.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Pitch está en `/pitch`. Stand abre http://localhost:3000/consultoria.

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
