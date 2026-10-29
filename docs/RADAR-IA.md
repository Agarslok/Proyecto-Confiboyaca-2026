# Radar IA en la rama `prueba/radar-ia`

Rama de pruebas creada a partir de `fase_inicial`. No se ha subido a GitHub.

## Qué cambia

| Ruta | Antes | En esta rama |
|---|---|---|
| `/diagnostico` | Formulario de 3 pasos (nombre, objetivo, elementos) | Radar IA: una pregunta por pantalla, adaptada a la industria |
| `/resultado` | Consultoría con semáforo | Índice 0–100, nivel de riesgo, radar de 6 dimensiones, hallazgos, 6 casos, ruta y cursos |
| `/sitio` | Plantilla por sector con el nombre | La misma plantilla, con textos de la actividad y una sección que resuelve el problema central |
| `/encuestas` | — | Catálogo de los 48 nichos: preguntas de cada uno y botón «Aplicar encuesta» |
| `/caso/[id]` | — | Detalle de cada caso: cómo lo tiene hoy, cómo debería tenerlo, tabla propuesta y pasos |

Las plantillas de `components/templates/` no se tocaron. El formulario anterior (`SiteWizard`) sigue en el código; solo dejó de usarse en `/diagnostico`.

## Cómo se eligieron las preguntas

Fuentes: el esquema Radar IA (21 preguntas) y la propuesta de diagnóstico (35 ítems).

- **Se quitaron** de la propuesta: caja de compensación y año del curso (P7), temas vistos en el curso (P8), quién participó (P6), fecha (P9), y las preguntas que suponían «la persona que tomó el curso».
- **Se fusionaron** las que medían lo mismo: dónde se registra la información (DA1 + Datos 1), cómo se decide (DE2 + Analítica 1), responsable de los datos (DA4 + Equipo 1), uso de IA (TH3 + Analítica 3), dónde se guardan y cómo se protegen los datos (Tecnología 1 + ES4).
- **Se tomaron de la propuesta** porque el esquema no las tenía: papel de la gerencia (DE1), quién lideraría la IA (PC3), reglas de uso de IA (ES1) y la prueba práctica de la lista de clientes (DA2, reemplaza «¿qué tan confiables son sus datos?»).
- **Se adoptó** de la propuesta la opción «No sé»: cuenta 0 y el hallazgo queda «por confirmar».
- **Se dejó fuera** «¿cuánto tardan en tener el informe del mes?» para no alargar.

Resultado: **15 a 18 pantallas** (antes 21), unos 4 minutos.

## Lo dinámico

1. **Industria → actividad**: al elegir la industria aparecen sus 4 actividades en la misma pantalla.
2. **2 preguntas de la industria + 1 del eslabón**. La del eslabón se salta si repite un tema que la industria ya preguntó (una panadería no ve dos veces «¿cuánto producen?»).
3. **Vocabulario**: {productos}, {clientes} y {punto} cambian por industria y actividad (huéspedes, pacientes, cosechas…).
4. Si todo está **en papel**, no se pregunta por la lista de clientes (se infiere 0).
5. La pregunta de **reglas de IA** solo aparece si ya usan IA.
6. El **radar se dibuja en vivo** al lado del formulario.

## Puntaje

Igual que el esquema: 0–3 puntos por respuesta, promedio por dimensión llevado a 0–100, índice ponderado (Negocio 15 %, Datos 25 %, Tecnología 15 %, Analítica e IA 20 %, Equipo 15 %, Estrategia 10 %). Niveles: alto 0–34, moderado 35–61, bajo 62–100. Reglas de coherencia: Datos < 30 → riesgo alto; Datos < 55 → no puede quedar en riesgo bajo.

Casos: 6 de la biblioteca de 60, por prioridad industria (+100), eslabón (+50), transversal, y +10 por objetivo coincidente. **Los objetivos de cada caso no venían en el esquema; se asignaron en `lib/radar/cases.ts`** y conviene revisarlos.

Las gráficas de cada caso usan **datos simulados** y lo dicen en pantalla.

## Industria → plantilla de página

| Industria | Plantilla |
|---|---|
| Moda y textil, Comercio y retail | Retail |
| Alimentos y bebidas | Gastronomía |
| Salud, Servicios profesionales, Otra | Servicios |
| Manufactura, Transporte y logística, Minería y energía, Construcción | Metalurgia (industrial) |
| Agro y agroindustria | Agroindustria |
| Turismo y hotelería | Turismo |

Si el nombre de una empresa de alimentos dice «panadería», «pastelería» o «café», la página recibe textos, productos y bebidas de ese tipo de negocio (`lib/radar/site-voice.ts`).

## Archivos

- `lib/radar/bank.ts`: preguntas, industrias, actividades, cursos, rutas y niveles.
- `lib/radar/cases.ts`: los 60 casos.
- `lib/radar/engine.ts`: pantallas dinámicas, puntaje y selección de casos.
- `lib/radar/site-voice.ts`: tono de la página por actividad.
- `components/radar/`: formulario, radar SVG, diagnóstico y minigráficas.
- `tests/radar.test.ts`: pruebas (`npm test`).

## Nichos nuevos

Se agregaron **Minería y energía** (extracción, beneficio, comercialización, transporte) y **Construcción e inmobiliario** (obras, materiales, inmobiliaria, mantenimiento), con 2 preguntas propias cada una y 2 casos por industria. Quedan 12 industrias × 4 actividades = 48 nichos y 64 casos.

Para aplicar la encuesta a un nicho concreto: `/encuestas` → «Aplicar encuesta», o directo `/diagnostico?nicho=turismo-hotel`.

## Problema central → página web

El problema central sale de la dimensión donde la empresa pierde más puntos del índice, (100 − puntaje) × peso, y es su hallazgo más grave. Cada pregunta apunta a una solución (`lib/radar/solution.ts`): registro digital, producción según lo que se vende, base de clientes, solicitudes con estado, inventario, tablero de indicadores o respaldo de datos.

En `/sitio` la portada usa un mensaje de esa solución y, después de la plantilla, aparece la sección «Solución de la consultoría» con una demostración interactiva (datos de ejemplo, no se guardan) y un botón flotante para llegar. Las plantillas siguen sin modificarse; por eso la sección va al final de la página.
