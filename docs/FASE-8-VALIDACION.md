# Fase 8 — Pruebas y validación

Validación automatizada del flujo **conversación → interpretación → validación → registro → base de datos → dashboard** en todas las industrias del formulario Radar, con énfasis en tres sectores distintos (moda, alimentos, construcción/manufactura) y comprobación de que la plantilla de **turismo · hotel** sigue operando en el motor compartido.

## Cómo ejecutar

```bash
npm run typecheck
npm test
```

La suite dedicada a esta fase:

```bash
node --import tsx --test tests/phase8-validation.test.ts
```

## Qué se verifica

| Criterio | Dónde |
|----------|--------|
| Configuración sectorial por industria y subactividad | `tests/sector-profiles.test.ts`, `tests/phase8-validation.test.ts` (matriz completa) |
| Subactividades con comportamiento distinto (starters, campos, link operativo) | Fase 8 · moda / alimentos |
| Asistente local entiende preguntas iniciales y ejemplos del perfil | Matriz: `tryLocalOpsReply` en starter + `conversationExamples[0]` |
| Registros con campos correctos y metadatos (`_source`, `_recordedAt`) | `assertPersistedFlow` + `tests/records-sync.test.ts` |
| Base de datos = filas persistidas (sin filas demo en catálogo) | Matriz: `entity.rows.length === 0` antes de registrar |
| Dashboard desde registros reales | KPIs tras `commitAndPersist` + `dashboardMetrics` |
| Sincronización asistente / CRM / tablero | Misma clave `workspaceId`, recarga con `readCrmSession` + `applyCrmSnapshot` |
| Cuotas: local = 0, Gemini > 0, claves por empresa | Fase 8 · cuotas + `tests/session-quota.test.ts` |
| Aislamiento entre empresas y demos | `tests/records-sync.test.ts`, Fase 8 · cuotas |
| Turismo hotel (reservas, captura, dashboard hotelero) | Fase 8 · turismo + `tests/ops-capture.test.ts` |
| Consultas locales sin Gemini innecesario | `tests/gemini-routing.test.ts` |
| API: contexto cliente solo si coincide sector | `app/api/radar/assistant/route.ts` (cubierto en arquitectura) |

## Tres industrias ancla (validación explícita)

1. **Moda y textil** — `moda-confeccion` (producción) vs `moda-compraventa` (comercial): etiquetas de columnas, starters y persistencia.
2. **Alimentos y bebidas** — `alimentos-produccion` vs `alimentos-restaurante` (producción vs servicio).
3. **Construcción y manufactura** — `construccion-obra` y `manufactura-planta`: registro, releo y KPIs.

El resto de industrias y subactividades del formulario se recorren en el test **«todas las industrias»** (mismo número de perfiles que actividades en `INDUSTRIES`).

## Cambios de código en Fase 8

### `lib/assistant/ops-capture.ts`

Ampliación de `isCaptureIntent` para alinear el intérprete local con los verbos de captura del perfil sectorial:

- `agenda`, `programa`, `reserva` / `reservar`, `abre` (además de `anota`, `registra`, `solicitud`, etc.).

Así las preguntas iniciales tipo «Agenda servicios…», «Programa despacho…» o «Reserva consulta…» abren la plantilla guiada **sin llamar a Gemini**.

### `lib/ops/sector/profile-builder.ts`

Para **turismo · hotel**, los campos documentados en el perfil coinciden con el catálogo CRM (`Huésped`, `Llegada`, … y cupos `Responsable`, `Para`, `Libres`, `Habitación`). Evita discrepancia entre perfil, base de datos y pruebas.

### `tests/phase8-validation.test.ts` (nuevo)

Ocho pruebas que cubren anclas sectoriales, cuotas, hotel, matriz completa y cierre conversacional con `capturedRowFromReply`.

### `package.json`

Inclusión de `tests/phase8-validation.test.ts` en el script `npm test`.

## Restricciones respetadas

- Sin reconstrucción del proyecto ni eliminación de funcionalidades.
- Un solo motor (`lib/ops/*`, `lib/assistant/*`); turismo no duplicado por industria.
- Catálogos sin filas demo como «datos reales»; los tests insertan filas explícitas en memoria o almacenamiento simulado.
- Gemini no crea tablas; el registro pasa por `commitCapturedRow` / `commitAndPersist`.
- Las pruebas no leen ni afirman valores de `.env` (sin exposición de claves API).
- UI y flujo del stand sin cambios de diseño en esta fase.

## Limitación conocida

La persistencia operativa sigue siendo **`localStorage` por navegador y workspace** (`ops-crm:{id}`, `ops-chat:{id}`). Las pruebas usan `StorageLike` en memoria para simular el mismo contrato. Un backend compartido (p. ej. Supabase) sería una fase posterior sin reescribir la UI.

## Resultado esperado

Con la suite completa: **172 tests**, `typecheck` en verde.

## Plantillas del sitio (Fase 8+)

Todas las plantillas visuales (`retail`, `gastronomia`, `metalurgia`, `agroindustria`, `servicios`, `turismo`) montan el mismo **`OperationsSuite`**: Asistente + Base de datos + Dashboard sobre `sectorOpsPack`, no el chat antiguo de agenda/registro (`CatalogDemoChat` / `SolutionBlock` con acción `agenda`).

Los formularios decorativos de «reserva mesa» o «agenda cita» siguen en la página como demo visual (`#reserva-mesa`, `#agenda-demo`); el registro operativo real es el asistente en `#reservas` / `#agenda` / `#operacion` / `#operacion-hotel`.

El nombre comercial aporta pista extra (`lib/assistant/company-context.ts`, p. ej. Panadería vs Carnicería) además de industria y subactividad del Radar.
