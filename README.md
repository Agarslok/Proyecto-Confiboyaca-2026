# Confi

Prototipo local de diagnóstico y consultoría empresarial. Una empresa indica su sector y sus problemas, el motor de reglas prepara una lectura y la interfaz abre una demostración ficticia relacionada.

Esta versión no llama a Gemini ni a una base de datos. Sirve para revisar el recorrido completo antes de conectar servicios externos.

## Requisitos

- Node.js 22.22.3
- npm 10

## Puesta en marcha

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Recorrido

1. Abra la aplicación. La apertura muestra el colibrí y se puede saltar con el botón o con Escape.
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

El formulario y la página se guardan en `localStorage`, bajo la clave `confi.site.v1`. Sobreviven a una recarga en el mismo navegador. No es una base de datos: no se comparte con otros equipos y desaparece al reiniciar o al borrar los datos del sitio. Al recargar, la página se reconstruye con las respuestas guardadas. La apertura del colibrí se recuerda solo durante la pestaña, en `sessionStorage`.

El servidor, además, escribe la empresa y el diagnóstico en memoria del proceso para ejercitar los repositorios. Esa copia se pierde al detener `npm run dev` y la interfaz no la usa como fuente de verdad.

## Cómo se conectará después

`lib/repositories` define las operaciones de empresas, diagnósticos, sesiones y plantillas. `DATA_PROVIDER=memory` es la implementación actual. `DATA_PROVIDER=supabase` falla con un mensaje explícito hasta que exista un adaptador para una cuenta propia. Las variables previstas están en `.env.example`, vacías, sin claves de ejemplo.

`lib/diagnostic/provider.ts` expone el mismo contrato para reglas y para un futuro proveedor Gemini. `DIAGNOSIS_PROVIDER=gemini` todavía no llama a ningún modelo.

La interfaz pide un diagnóstico tipado. No necesita saber si la respuesta salió de reglas o de un modelo.

## Diseño

Las plantillas usan variables CSS en `app/globals.css`, activadas con `data-template` en el documento. Refero estaba conectado, pero la suscripción no permitió leer las referencias. Los colores y la tipografía de esta versión son propios.

## Límites del diagnóstico

El motor no mide ahorros, ventas ni tiempos. Si las respuestas son débiles, el resultado lo dice y lo trata como hipótesis. La demostración nunca presenta sus cifras como datos de la empresa.
