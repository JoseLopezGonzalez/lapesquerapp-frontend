# Auditoría de Producciones: rendimiento, fluidez y percepción de carga

**Fecha**: 2026-03-24 (actualizado con feedback de usuario)
**Implementación**: 2026-03-24
**Prompt rector**: `docs/prompts/17-prompt-auditoria-producciones-rendimiento-y-fluidez.md`
**Fuente de verdad**: `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`
**Referencia metodológica**: `docs/audits/global-performance-audit-master-prompt.md`
**Contexto de dominio**: `docs/14-produccion-en-construccion.md`
**Entorno analizado**: código fuente local, análisis estático + feedback visual de usuario
**Runtime real**: no disponible en esta pasada

---

## Registro de implementación (2026-03-24)

Todos los hallazgos ejecutables sin refactors de alto riesgo han sido implementados en la misma sesión de auditoría.

| Hallazgo | Estado | Cambio aplicado |
|---|---|---|
| PROD-01 | ✅ IMPLEMENTADO | `useProductionDetail` dividido en 3 queries independientes; `enableProcessTree` gated por tab activa; skeleton en card de totales |
| PROD-02 | ✅ IMPLEMENTADO | Texto contextual en los 3 loaders: "Cargando producciones...", "Cargando producción...", "Cargando diagrama de procesos..." |
| PROD-03 | ✅ IMPLEMENTADO | `useEffect` de debug (44 líneas + recorrido recursivo) eliminado de `ProductionDiagram/index.jsx` |
| PROD-04 | ✅ IMPLEMENTADO | Todos los `alert()` → `toast.error()`; todos los `confirm()` → `AlertDialog` + estado de confirmación en hook |
| PROD-05 | ⏸ FUERA DE SCOPE | Migración completa de 3 managers a React Query (2.362 líneas) — sprint dedicado |
| PROD-06 | ✅ IMPLEMENTADO | `openManageDialog` paraleliza `getProductionRecordSourcesData` + `getProductionOutputs` con `Promise.all` |
| PROD-07 | 🔲 PENDIENTE | Query key factory — sin impacto perceptivo directo |
| PROD-08 | ✅ IMPLEMENTADO | `staleTime` añadido: `useProcessOptions` 5min, `useProduction` 1min, `useProductionDetail` 2min |
| PROD-09 | ✅ IMPLEMENTADO | Incluido en PROD-01 — `enableProcessTree: activeTab === 'diagram'` |
| PROD-10 | ✅ IMPLEMENTADO | `console.error` en `useProcessOptions` cuando `!response.ok` |
| PROD-11 | ✅ IMPLEMENTADO | `return await saveMutation.mutateAsync(...)` — bug crítico de redirect corregido |
| PROD-12 | ✅ IMPLEMENTADO | `isNavigating` + `Loader2` en botón "Ver detalles" (ProcessNode) y botón Volver (RecordHeader); `console.log` de render eliminado |
| PROD-13 | ✅ IMPLEMENTADO | `max-w` ampliado: StockNode `140px→200px`, ProcessNode `120px→160px`; tooltip `title` en hover |

---

## Limitaciones declaradas

- Sin acceso a runtime: no hay TTFB medido, waterfall real de red, FPS ni coste de re-render con Profiler.
- Sin datos reales de producción: no se ha validado el comportamiento con lotes grandes, árboles profundos o sesiones concurrentes.
- Sin acceso a backend: no se pueden confirmar latencias de endpoints, índices ni planes de consulta.
- Las conclusiones sobre lentitud percibida se basan en el código y en la UX implícita por loaders, overlays, alerts, refetches y navegación actuales.

---

## Alcance auditado

### Rutas revisadas
- `src/app/admin/productions/page.js`
- `src/app/admin/productions/loading.js`
- `src/app/admin/productions/[id]/page.js`
- `src/app/admin/productions/[id]/ProductionClient.js`
- `src/app/admin/productions/[id]/records/create/page.js`
- `src/app/admin/productions/[id]/records/create/CreateProductionRecordPage.jsx`
- `src/app/admin/productions/[id]/records/[recordId]/page.js`
- `src/app/admin/productions/[id]/records/[recordId]/ProductionRecordClient.jsx`

### Componentes revisados
- `src/components/Admin/Productions/ProductionView.jsx` (696 líneas)
- `src/components/Admin/Productions/ProductionRecordsManager.jsx` (447 líneas)
- `src/components/Admin/Productions/ProductionOutputsManager.jsx` (1024 líneas)
- `src/components/Admin/Productions/ProductionOutputConsumptionsManager.jsx` (783 líneas)
- `src/components/Admin/Productions/ProductionInputsManager.jsx`
- `src/components/Admin/Productions/ProductionInputsAddDialog.jsx` (~896 líneas)
- `src/components/Admin/Productions/ProductionRecordEditor.jsx`
- `src/components/Admin/Productions/ProductionDiagram/index.jsx`
- `src/components/Admin/Productions/ProductionCostsManager.jsx` (419 líneas)

### Hooks revisados
- `src/hooks/production/useProductionDetail.ts` (69 líneas)
- `src/hooks/production/useProduction.ts` (34 líneas)
- `src/hooks/production/useProcessOptions.ts` (51 líneas)
- `src/hooks/production/useProductionData.js` (164 líneas)
- `src/hooks/production/useProductionOutputsManager.js` (834 líneas)
- `src/hooks/production/useProductionInputsManager.js` (815 líneas)
- `src/hooks/production/useProductionOutputConsumptionsManager.js` (713 líneas)

### Servicios revisados
- `src/services/productionService.js`
- `src/services/production/productions.js`
- `src/services/production/productionRecords.js`
- `src/services/production/productionInputs.js`
- `src/services/production/productionOutputs.js`
- `src/services/production/productionOutputConsumptions.js`

### KPIs estáticos identificados

| Métrica | Valor |
|---|---|
| Líneas totales de hooks de managers | 2.362 líneas (3 hooks) |
| Líneas totales de componentes UI principales | ~6.370 líneas |
| `useState` en `useProductionOutputsManager` | 29 |
| `useState` en `useProductionInputsManager` | ~20 |
| `useState` en `useProductionOutputConsumptionsManager` | ~13 |
| `alert()` / `confirm()` en hooks de managers | ~50+ |
| Hooks sin React Query (usan fetch manual) | 4 de 7 |
| Query key factory centralizada | No existe |

---

## Resumen ejecutivo

### Lentitud real

**R1 — Bundle de carga inicial siempre triple.**
`useProductionDetail` lanza en paralelo `production + processTree + totals` en cada apertura del detalle (`src/hooks/production/useProductionDetail.ts:40-49`). La vista completa se bloquea hasta que los 3 resuelven. `processTree` es el más costoso (árbol completo de procesos) y solo se usa en la pestaña "Diagrama". El dato podría cargarse de forma diferida.

**R2 — Tres managers críticos sin React Query: 2.362 líneas de fetch manual.**
`useProductionOutputsManager` (834 líneas), `useProductionInputsManager` (815 líneas) y `useProductionOutputConsumptionsManager` (713 líneas) usan `useState/useEffect` manual en lugar de React Query. Sin caché, sin deduplicación, sin GC automático. Cada operación hace un refetch completo de la lista.

**R3 — Waterfall en `openManageDialog` de outputs.**
Al abrir el gestor de edición de outputs se ejecutan 3 requests en secuencia: `loadProducts()` (si está vacío) → `getProductionRecordSourcesData()` → `getProductionOutputs(with_sources)` (`src/hooks/production/useProductionOutputsManager.js:271-338`). La última request solo arranca después de que la primera termina, aunque son independientes.

**R4 — Refetch completo tras cada mutación en todos los managers.**
Crear, editar o eliminar un output, input o consumo desencadena `loadOutputsOnly()` / `loadInputsOnly()` / `loadConsumptionsOnly()` que recarga toda la lista desde el servidor. No se usa `setQueryData` para reconciliar localmente.

**R5 — `useProductionData.js` es un anti-patrón: reinventa React Query.**
164 líneas de lógica manual de carga/sincronización con refs, useEffect y estado que replica exactamente lo que React Query hace de forma más robusta. Usado como base por los tres managers, multiplica la deuda.

### Lentitud percibida

**P1 — Spinner genérico opaco en todos los estados de carga críticos.**
La ruta de producciones muestra un spinner sin texto (`src/app/admin/productions/loading.js:6-8`). El detalle muestra `<Loader />` sin descripción mientras espera los 3 bundles (`src/components/Admin/Productions/ProductionView.jsx:27-32`). El usuario no sabe si carga el listado, el árbol, los costes o si algo falló.

**P2 — `alert()` y `confirm()` nativos bloquean el hilo UI.**
Los tres hooks de managers usan `alert()` para errores y `confirm()` para confirmaciones de eliminación (~50+ llamadas). Esto bloquea el event loop, deja la UI congelada y ofrece una experiencia visual inconsistente con el resto de la aplicación.

**P3 — Diagrama cargado eagerly aunque el usuario esté en pestaña "Información".**
`processTree` se pide siempre en la carga inicial aunque el usuario empiece (y se quede) en la pestaña "info". El componente `ProductionDiagram` recibe `loading=true` y muestra su propio `<Loader />` dentro de la pestaña "Diagrama" aunque esta ni esté abierta.

**P4 — Debug logs masivos ejecutados en cada render del diagrama.**
`ProductionDiagram/index.jsx` (L40-82) contiene un bloque `useEffect` con ~40 líneas de `console.log` activos que recorren el árbol de procesos de forma recursiva en cada cambio de `processTree`. Se ejecuta en producción.

**P5 — `loading.js` de ruta no comunica contexto.**
El skeleton de ruta (`src/app/admin/productions/loading.js`) es un spinner básico sin skeleton de layout ni indicación de qué módulo se está cargando.

### Problemas mixtos (latencia amplificada por mala UX)

**M1 — Pérdida de contexto visual tras operaciones en managers.**
Tras crear/eliminar un output o input, `loadOutputsOnly()` hace refetch. Mientras dura, la lista puede parpadear o quedar vacía momentáneamente porque no hay `placeholderData` ni preservación del estado anterior.

**M2 — `openManageDialog` con waterfall puede tardar 800-1500ms sin feedback progresivo.**
El usuario hace clic en "Gestionar outputs", ve el cursor girar o nada, y después de 1-2 segundos aparece el diálogo. Sin mensaje de "cargando fuentes de datos" ni indicador de progreso incremental.

---

## Mapa de fricción del usuario

| Flujo | Qué ve el usuario | Qué espera el sistema | Por qué puede parecer bloqueado | Feedback que falta | Mejora UX mínima |
|---|---|---|---|---|---|
| Entrada al listado `/admin/productions` | Spinner genérico pantalla completa | Carga de la lista paginada de producciones | El spinner no dice qué módulo carga; puede parecer error | Texto "Cargando producciones..." | Añadir texto al `loading.js` de ruta |
| Abrir detalle de producción | Spinner genérico mientras cargan 3 endpoints | `production + processTree + totals` en paralelo | Cualquiera de los 3 puede ser lento; sin diferenciación | Skeleton del header + skeleton de tabs | Mostrar skeleton estructural inmediato; cargar `processTree` lazy |
| Cambiar a pestaña "Diagrama" | Diagrama ya cargado (o spinner si aún carga) | `processTree` ya fue pedido en la carga inicial | Si `processTree` tardó, el tab está bloqueado antes de abrirlo | "Cargando diagrama..." con indicador | Separar la query de `processTree` y cargarla con `enabled` en apertura de tab |
| Abrir gestor "Gestionar outputs" | Cursor o nada durante 1-2s, luego aparece diálogo | 2-3 requests secuenciales (sources + outputs con sources) | Sin feedback hasta que el diálogo aparece completo | "Cargando fuentes de salidas..." | Abrir diálogo inmediatamente en estado skeleton mientras cargan datos |
| Crear un output | Formulario se resetea, la lista parpadea | Mutación → refetch completo de la lista | La lista desaparece y reaparece (sin transición) | Toast "Output creado" + transición de lista | `setQueryData` optimista o al menos `placeholderData` |
| Eliminar un output | `confirm()` nativo bloquea UI, luego la lista parpadea | Confirmación → mutación → refetch | Bloqueo de hilo nativo, regresión visual | Dialog de confirmación propio + toast | Reemplazar `confirm()` por `AlertDialog` |
| Añadir input (búsqueda de palet) | `alert()` nativo para errores | Validación + request de búsqueda | Bloqueo visual, pérdida de focus | Toast o mensaje inline | Reemplazar `alert()` por toast/error inline |
| Vuelta al listado tras guardar | `router.back()` — pantalla en blanco hasta que carga | Navegación a listado, nueva carga | Sin transición; puede parecer que se cuelga | Estado "volviendo..." o skeleton inmediato | `loading.js` mejorado o transición de navegación |
| Guardar nuevo registro en `/create` | Formulario se resetea pero la URL no cambia | Redirect a `/records/{id}` que nunca ocurre | `saveRecord` no retorna la respuesta; `router.push` nunca se ejecuta | Toast "Proceso creado" + redirect automático | Corregir `return` en `saveRecord` (PROD-11) |
| Pulsar "Ver detalles" en nodo del diagrama | Botón visual sin feedback, pantalla inmóvil 1-2s | `router.push` inicia navegación a ruta del registro | Sin loader de transición visible | Spinner en el botón mientras navega | Estado `isNavigating` local + loading.js mejorado |

---

## Hallazgos priorizados

### PROD-01 ✅ IMPLEMENTADO
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo**: Medio
- **Riesgo de cambio**: Bajo
- **Tipo**: loading UX
- **Implementado**: 2026-03-24 — `useProductionDetail.ts` dividido en 3 queries independientes (`productionQuery`, `totalsQuery`, `processTreeQuery`). `processTreeQuery` con `enabled: enableProcessTree`. `ProductionView` trackea `activeTab` y pasa `enableProcessTree: activeTab === 'diagram'`. Card de totales muestra skeleton de shadcn/ui mientras `totalsLoading`. `ProductionDiagram` recibe `loading={processTreeLoading}` en lugar del loading global.
- **Flujo afectado**: Apertura de detalle de producción
- **Síntoma**: La vista completa muestra un spinner opaco sin texto mientras esperan 3 endpoints en paralelo. El usuario no puede interactuar con ninguna parte de la pantalla hasta que los 3 resuelven.
- **Evidencia**: `src/components/Admin/Productions/ProductionView.jsx:27-32` — `if (loading) return <Loader />`. `src/app/admin/productions/loading.js:6-8` — spinner sin texto.
- **Causa raíz**: `useProductionDetail` encapsula los 3 bundles en una sola query de React Query. El `isLoading` es true hasta que los 3 resuelven juntos.
- **Amplificador**: `processTree` es potencialmente la query más lenta (árbol completo con nodos, bordes y relaciones), pero bloquea la visualización de `production` y `totals` que podrían mostrarse antes.
- **Impacto UX / negocio**: El usuario percibe la app lenta aunque `production` y `totals` hayan llegado en 200ms si `processTree` tardó 800ms.
- **Cambio propuesto**: (1) Separar `useProductionDetail` en tres queries independientes con `staleTime` diferenciado. (2) Mostrar skeleton estructural del header y de las cards de totales mientras las queries resuelven individualmente. (3) Cargar `processTree` solo con `enabled: diagramTabActive`.
- **Validación**: Abrir detalle y medir si header + totales aparecen antes de que el diagrama esté listo.
- **Riesgos / trade-offs**: Requiere que `ProductionView` use 3 valores de loading en vez de 1. Cambio moderado pero contenido.
- **Superficies afectadas**: `src/hooks/production/useProductionDetail.ts`, `src/components/Admin/Productions/ProductionView.jsx`

---

### PROD-02 ✅ IMPLEMENTADO
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Muy bajo
- **Tipo**: loading UX
- **Implementado**: 2026-03-24 — `loading.js`: "Cargando producciones...". `ProductionView.jsx`: "Cargando producción...". `ProductionDiagram/index.jsx`: "Cargando diagrama de procesos...".
- **Flujo afectado**: Todos los flujos del módulo
- **Síntoma**: Los spinners y loaders no comunican qué se está cargando. El usuario no puede distinguir si la app está cargando, procesando o colgada.
- **Evidencia**: `src/app/admin/productions/loading.js:6-8` — spinner puro. `src/components/Admin/Productions/ProductionView.jsx:27-32` — `<Loader />` sin texto. `src/components/Admin/Productions/ProductionDiagram/index.jsx:151-156` — `<Loader />` sin texto.
- **Causa raíz**: Ausencia de textos de contexto en estados de carga.
- **Amplificador**: Los loaders se usan para latencias variables (50ms a 2000ms), sin distinción visual.
- **Impacto UX / negocio**: Un spinner de 2 segundos sin texto se percibe como bloqueo o error. Un texto "Cargando diagrama..." convierte ese tiempo en espera tolerable.
- **Cambio propuesto**: Añadir texto descriptivo a todos los estados de carga del módulo: "Cargando producciones...", "Cargando detalle...", "Cargando diagrama...", "Guardando...", "Eliminando...". En `loading.js` añadir texto o skeleton básico de layout.
- **Validación**: Revisión visual de todos los estados de carga.
- **Riesgos / trade-offs**: Ninguno. Cambio puramente aditivo.
- **Superficies afectadas**: `loading.js`, `ProductionView.jsx`, `ProductionDiagram/index.jsx`, todos los managers

---

### PROD-03 ✅ IMPLEMENTADO
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Bajo
- **Tipo**: render
- **Implementado**: 2026-03-24 — Bloque `useEffect` completo (líneas 40-82) eliminado de `ProductionDiagram/index.jsx`. La importación de `useEffect` se conserva porque el archivo tiene otros dos `useEffect` legítimos.
- **Flujo afectado**: Pestaña Diagrama, cualquier apertura del detalle
- **Síntoma**: En cada cambio de `processTree`, se ejecuta un `useEffect` con ~40 líneas de `console.log` que recorre el árbol recursivamente. Activo en producción.
- **Evidencia**: `src/components/Admin/Productions/ProductionDiagram/index.jsx:40-82` — bloque completo de logs con emojis, recorrido recursivo del árbol, diagnóstico de nodos.
- **Causa raíz**: Código de depuración no eliminado.
- **Amplificador**: El árbol puede tener decenas o cientos de nodos; el recorrido recursivo en cada render es O(n). Los logs de DevTools tienen coste de serialización.
- **Impacto UX / negocio**: Overhead en cada apertura del diagrama. Ruido en consola en producción. Posible exposición de datos de negocio en logs del navegador.
- **Cambio propuesto**: Eliminar el bloque `useEffect` de debug (líneas 40-82 completas). Si se necesita para desarrollo, envolver en `if (process.env.NODE_ENV === 'development')`.
- **Validación**: Confirmar que el diagrama sigue funcionando y que la consola ya no muestra estos logs.
- **Riesgos / trade-offs**: Ninguno. Solo eliminación de código de debug.
- **Superficies afectadas**: `src/components/Admin/Productions/ProductionDiagram/index.jsx:40-82`

---

### PROD-04 ✅ IMPLEMENTADO
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Bajo
- **Tipo**: navigation UX
- **Implementado**: 2026-03-24 — `import { toast } from 'sonner'` añadido a ambos managers. Todos los `alert(` → `toast.error(` (replace_all). `confirm()` reemplazado por estado `deleteOutputConfirm`/`deleteInputConfirm` en los hooks + `AlertDialog` de shadcn/ui en los componentes `ProductionOutputsManager.jsx` y `ProductionInputsManager.jsx`. El estado de confirmación cubre ambas ramas de render (normal y renderInCard).
- **Flujo afectado**: Todos los flujos con operaciones CRUD en managers
- **Síntoma**: Los errores y confirmaciones usan `alert()` y `confirm()` nativos del navegador. Bloquean el hilo UI, congelan animaciones y son visualmente inconsistentes.
- **Evidencia**: `src/hooks/production/useProductionOutputsManager.js:248,253,267,429,444,486,521,544,552` — `alert()` y `confirm()`. `src/hooks/production/useProductionInputsManager.js:160,168,188,196,239,288,296,304,321,356,383` — ídem.
- **Causa raíz**: Ausencia de un sistema de notificación/confirmación interno en los managers.
- **Amplificador**: La app ya usa `toast` (sonner/shadcn) en otras partes. El contraste visual es llamativo.
- **Impacto UX / negocio**: Experiencia de app legacy. El confirm nativo no puede estilizarse ni cancelarse programáticamente. Bloquea el event loop durante toda la duración del modal.
- **Cambio propuesto**: Reemplazar `alert()` por `toast.error()` (ya disponible en el proyecto). Reemplazar `confirm()` por `AlertDialog` de shadcn/ui (ya disponible). No requiere dependencias nuevas.
- **Validación**: Verificar que todas las operaciones de error y confirmación usan el sistema de UI propio.
- **Riesgos / trade-offs**: Requiere pequeño ajuste en el flujo asíncrono de confirmaciones (usar estado booleano en lugar de return de `confirm()`).
- **Superficies afectadas**: `useProductionOutputsManager.js`, `useProductionInputsManager.js`, `useProductionOutputConsumptionsManager.js`

---

### PROD-05 ⏸ FUERA DE SCOPE (sprint dedicado)
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo**: Alto
- **Riesgo de cambio**: Medio
- **Tipo**: data
- **Flujo afectado**: Gestión de outputs, inputs y consumos
- **Síntoma**: Los tres managers principales no usan React Query. Cada operación CRUD dispara un refetch completo de la lista. Sin caché, sin deduplicación, sin GC.
- **Evidencia**: `src/hooks/production/useProductionOutputsManager.js:1-834` — solo `useState/useEffect/useRef`. Líneas 237-238: `createProductionOutput` → `loadOutputsOnly()`. Líneas 257-258: `deleteProductionOutput` → `loadOutputsOnly()`. `src/hooks/production/useProductionInputsManager.js:1-815` — patrón idéntico.
- **Causa raíz**: Los managers fueron escritos con estado manual antes de que el proyecto adoptase React Query como estándar. `useProductionData.js` es un wrapper manual que replica el comportamiento básico de `useQuery`.
- **Amplificador**: Cada operación (crear, editar, eliminar) implica una request adicional de refetch, sumando latencia innecesaria y forzando un ciclo loading/rerender completo.
- **Impacto UX / negocio**: Lista que parpadea tras cada operación. Sin posibilidad de optimistic updates. Sin aprovechamiento de caché entre re-aperturas del mismo gestor.
- **Cambio propuesto**: Migrar los tres managers a React Query. Crear query keys con factory. Usar `setQueryData` en mutaciones donde la respuesta devuelva el dato actualizado. Para casos donde solo se necesita invalidar, usar `invalidateQueries` con predicado preciso.
- **Validación**: Verificar que las listas no parpadean al operar y que re-abrir un gestor no hace refetch si los datos son recientes.
- **Riesgos / trade-offs**: Refactor de mayor calado. Riesgo de regresión en lógica de sincronización con `ProductionRecordContext`. Hacer de forma incremental, manager por manager.
- **Superficies afectadas**: `useProductionOutputsManager.js`, `useProductionInputsManager.js`, `useProductionOutputConsumptionsManager.js`, `useProductionData.js`

---

### PROD-06 ✅ IMPLEMENTADO
- **Severidad**: Medio
- **Impacto**: Alto
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Bajo
- **Tipo**: network
- **Implementado**: 2026-03-24 — `openManageDialog` reescrito. `getProductionRecordSourcesData` y `getProductionOutputs(with_sources)` se lanzan en paralelo con `Promise.all`. Cada rama tiene su propio `.catch(() => null)`. El fallback para sources (cargar inputs+consumptions) se ejecuta solo si `sourcesDataResponse` es null. `setSourcesLoading(false)` se llama después de que ambas promises resuelven.
- **Flujo afectado**: Apertura de "Gestionar outputs"
- **Síntoma**: Al hacer clic en "Gestionar outputs", se ejecutan 3 requests en secuencia: primero `getProductionRecordSourcesData`, después (si falla) fallback en paralelo, y finalmente `getProductionOutputs(with_sources)`. La última solo arranca cuando termina la primera.
- **Evidencia**: `src/hooks/production/useProductionOutputsManager.js:271-338`. Línea 277: `getProductionRecordSourcesData`. Línea 330: `getProductionOutputs` — fuera del catch del fallback, secuencial respecto a 277.
- **Causa raíz**: La carga de `outputsWithSources` está anidada después del bloque `try/catch` de `sourcesData`, creando dependencia artificial.
- **Amplificador**: Si `sourcesData` tarda 400ms y `outputsWithSources` tarda otros 400ms, el diálogo tarda 800ms+ en aparecer. Podrían ejecutarse en paralelo.
- **Cambio propuesto**: Paralelizar `getProductionRecordSourcesData` y `getProductionOutputs(with_sources)` con `Promise.all`. Mostrar el diálogo con skeleton inmediatamente.
- **Validación**: Medir con DevTools que los dos requests se lanzan en el mismo frame.
- **Riesgos / trade-offs**: Requiere reestructurar la función `openManageDialog`. Bajo riesgo si se mantienen los sets de estado separados.
- **Superficies afectadas**: `src/hooks/production/useProductionOutputsManager.js:271-338`

---

### PROD-07 🔲 PENDIENTE
- **Severidad**: Medio
- **Impacto**: Medio
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Bajo
- **Tipo**: data
- **Flujo afectado**: Carga de detalle de producción
- **Síntoma**: No existe una query key factory para el módulo de producciones. Las keys están hardcodeadas en cada hook con strings literales.
- **Evidencia**: `useProductionDetail.ts:37` — `['productions', 'detail', tenantId, productionId]`. `useProduction.ts:19` — `['productions', 'one', tenantId, productionId]`. Las invalidaciones en `useProductionRecord.js` usan prefix match amplio.
- **Causa raíz**: Falta de convención centralizada para query keys del módulo.
- **Amplificador**: Sin factory, una invalidación por typo o prefix incorrecto puede no invalidar nada (o invalidar demasiado).
- **Cambio propuesto**: Crear `src/lib/queryKeys/productionKeys.ts` con factory: `productionKeys.detail(tenantId, productionId)`, `productionKeys.list(tenantId)`, `productionKeys.records(productionId)`, etc. Usar en todos los hooks.
- **Validación**: Verificar con React Query Devtools que las invalidaciones llegan solo a las queries necesarias.
- **Riesgos / trade-offs**: Bajo riesgo. Cambio de nomenclatura que requiere actualizar todos los hooks del módulo de forma coordinada.
- **Superficies afectadas**: `useProductionDetail.ts`, `useProduction.ts`, `useProcessOptions.ts` y futuros hooks del módulo

---

### PROD-08 ✅ IMPLEMENTADO
- **Severidad**: Medio
- **Impacto**: Medio
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Muy bajo
- **Tipo**: render
- **Implementado**: 2026-03-24 — `useProcessOptions.ts`: `staleTime: 5 * 60 * 1000`. `useProduction.ts`: `staleTime: 60 * 1000`. `useProductionDetail.ts`: `staleTime: 2 * 60 * 1000` en las 3 queries independientes.
- **Flujo afectado**: Todos los flujos del módulo
- **Síntoma**: Ningún hook del módulo tiene `staleTime` configurado. Todos usan el default de React Query (0ms), lo que provoca refetch en cada enfoque de ventana o remontaje del componente.
- **Evidencia**: `useProductionDetail.ts:36-58` — sin `staleTime`. `useProduction.ts:17-32` — sin `staleTime`. `useProcessOptions.ts:26-43` — sin `staleTime`.
- **Causa raíz**: Configuración por omisión no revisada.
- **Cambio propuesto**: `useProcessOptions` → `staleTime: 5 * 60 * 1000`. `useProductionDetail` → `staleTime: 2 * 60 * 1000`. `useProduction` → `staleTime: 60 * 1000`.
- **Validación**: Con React Query Devtools verificar que los datos no se refetchan al cambiar de tab si son recientes.
- **Riesgos / trade-offs**: Si los datos cambian frecuentemente por otras sesiones, un `staleTime` alto puede mostrar datos desactualizados. Mitigar con `refetch` explícito en mutaciones.
- **Superficies afectadas**: `useProductionDetail.ts`, `useProduction.ts`, `useProcessOptions.ts`

---

### PROD-09 ✅ IMPLEMENTADO (incluido en PROD-01)
- **Severidad**: Bajo
- **Impacto**: Medio
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Bajo
- **Tipo**: loading UX
- **Flujo afectado**: Apertura del diagrama
- **Síntoma**: `processTree` se carga eagerly en la carga inicial del detalle aunque el usuario no haya abierto la pestaña "Diagrama".
- **Evidencia**: `useProductionDetail.ts:40-48` — `processTree` siempre en el `Promise.all`. `ProductionView.jsx:663-688` — la tab de diagrama es un `TabsContent`, pero `processTree` ya llegó en la query inicial.
- **Causa raíz**: La query agrupa los 3 bundles sin posibilidad de desagregar.
- **Cambio propuesto**: Una vez separada la query (PROD-01), añadir `enabled: diagramTabActive` al hook de `processTree`.
- **Validación**: Abrir el detalle y verificar en Network que `processTree` no se pide hasta que el usuario pulsa "Diagrama".
- **Riesgos / trade-offs**: Depende de PROD-01. Introduce un estado de "tab activa" en `ProductionView`.
- **Superficies afectadas**: `useProductionDetail.ts`, `ProductionView.jsx`

---

### PROD-10 ✅ IMPLEMENTADO
- **Severidad**: Bajo
- **Impacto**: Bajo
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Muy bajo
- **Tipo**: data
- **Implementado**: 2026-03-24 — `if (!response.ok)` ahora llama a `console.error('useProcessOptions: error al cargar opciones de proceso', response.status)` antes de retornar `[]`.
- **Flujo afectado**: Carga de opciones de proceso
- **Síntoma**: `useProcessOptions` silencia errores completamente devolviendo `[]` sin ningún log.
- **Evidencia**: `src/hooks/production/useProcessOptions.ts:38` — el catch retorna `[]` sin logging.
- **Causa raíz**: Error handling demasiado permisivo.
- **Cambio propuesto**: Añadir `console.error` en el catch con contexto mínimo.
- **Validación**: Forzar fallo del endpoint y verificar que el error aparece en consola.
- **Superficies afectadas**: `src/hooks/production/useProcessOptions.ts`

---

### PROD-11 ✅ IMPLEMENTADO (era ⚠️ BUG CONFIRMADO)
- **Severidad**: Crítico
- **Impacto**: Alto
- **Esfuerzo**: Muy bajo
- **Riesgo de cambio**: Muy bajo
- **Tipo**: navigation UX / data
- **Flujo afectado**: Creación de registro de producción (`/records/create`)
- **Síntoma**: Al crear un registro y guardarlo, la página no redirige a la ruta de edición. El usuario permanece en `/create`. Si modifica algo y guarda de nuevo, se crea un segundo registro duplicado. También afecta a los consumos del nodo hijo ya que el vínculo con el padre queda sin establecer correctamente.
- **Evidencia**:
  - `src/hooks/useProductionRecord.js:99-113` — `saveRecord()` llama a `saveMutation.mutateAsync()` pero **no retorna** su valor. Retorna implícitamente `undefined`.
  - `src/components/Admin/Productions/ProductionRecordEditor/hooks/useRecordFormSubmission.js:23-30` — `const response = await saveRecord(formData)` recibe `undefined`. Por tanto `response?.data?.id || response?.id` es `undefined` y el `router.push(...)` nunca se ejecuta.
  - El usuario queda en la ruta `/create` con `recordId=null`. Al guardar de nuevo, `!!recordId` es `false`, vuelve a llamar a `createProductionRecord` y crea un segundo registro.
- **Causa raíz**: `saveRecord` no propaga la respuesta de `mutateAsync`. Falta un `return` en la línea 105 de `useProductionRecord.js`.
- **Amplificador**: Ninguna notificación de éxito advierte al usuario que el primer guardado funcionó. Solo sabe que "algo pasó" cuando ve datos duplicados después.
- **Impacto UX / negocio**: Creación de registros fantasma. Árbol de procesos corrupto. Relaciones padre-hijo rotas (consumos sin origen correcto).
- **Cambio propuesto**: En `useProductionRecord.js:105` añadir `return` antes de `await saveMutation.mutateAsync(...)`. También añadir toast de éxito "Registro creado" para confirmar la operación antes de la navegación.
- **Validación**: Crear un registro, verificar que la URL cambia a `/records/{id}` y que no aparece un segundo registro en el árbol.
- **Riesgos / trade-offs**: Ninguno. Corrección de una línea sin side effects.
- **Superficies afectadas**: `src/hooks/useProductionRecord.js:105`, `src/components/Admin/Productions/ProductionRecordEditor/hooks/useRecordFormSubmission.js`
- **Implementado**: 2026-03-24 — `await saveMutation.mutateAsync(...)` → `return await saveMutation.mutateAsync(...)` en línea 105. `useRecordFormSubmission` ahora recibe la respuesta correctamente y ejecuta `router.push`.

---

### PROD-12 ✅ IMPLEMENTADO
- **Severidad**: Alto
- **Impacto**: Alto
- **Esfuerzo**: Bajo
- **Riesgo de cambio**: Bajo
- **Tipo**: navigation UX
- **Flujo afectado**: Botón "Ver detalles" en nodos del diagrama; botón "Volver" en editor de registros
- **Síntoma**: Al pulsar "Ver detalles" en un nodo del diagrama o el botón de volver en el editor, la interfaz parece congelada durante 500-1500ms sin ninguna señal visual de que algo está ocurriendo. El usuario no sabe si el clic fue registrado o si el sistema está colgado.
- **Evidencia**:
  - `src/components/Admin/Productions/ProductionDiagram/components/ProcessNode.jsx:218-221` — `onClick` llama a `onNavigate()` que ejecuta `router.push(url)`. Sin ningún estado de carga previo ni posterior visible.
  - `src/components/Admin/Productions/ProductionDiagram/index.jsx:87-89` — `navigateToRecord` llama a `router.push()` directamente sin loader.
  - `src/components/Admin/Productions/ProductionRecordEditor/components/RecordHeader.jsx:28` — Botón "Volver" llama a `router.push(...)` sin feedback.
  - `src/components/Admin/Productions/ProductionDiagram/components/ProcessNode.jsx:41-43` — Segundo punto de debug logs: un `console.log` ejecutado directamente en el cuerpo del componente (no en `useEffect`) para cada nodo `isFinal`. Se ejecuta en cada render, que en React Flow puede ser frecuente.
- **Causa raíz**: `router.push()` inicia la navegación en Next.js pero no hay loader de transición visible. La nueva página puede tardar 500-2000ms en aparecer (fetch de datos de la ruta destino) durante los cuales la UI parece bloqueada.
- **Amplificador**: El diagrama es interactivo con muchos elementos visuales — el usuario espera respuesta visual inmediata al clic. La ausencia total de feedback convierte una espera normal en percepción de fallo.
- **Impacto UX / negocio**: El usuario pulsa varias veces creyendo que el clic no funcionó, puede provocar navegaciones apiladas o frustración.
- **Cambio propuesto**: (1) Añadir estado `isNavigating` local en `ProcessNode` que active un spinner/overlay en el botón mientras navega. (2) Usar el `loading.js` de la ruta destino como transición inmediata visible. (3) Eliminar el `console.log` de línea 41-43 de `ProcessNode.jsx` (fuera del useEffect, en render body).
- **Validación**: Al pulsar "Ver detalles", el botón debe mostrar inmediatamente un indicador de carga antes de que la nueva página aparezca.
- **Riesgos / trade-offs**: Bajo. El estado `isNavigating` es puramente local al componente.
- **Superficies afectadas**: `ProcessNode.jsx:41-43,218-221`, `index.jsx:87-89`, `RecordHeader.jsx:28`
- **Implementado**: 2026-03-24 — `console.log` de render body eliminado de `ProcessNode.jsx`. Estado `isNavigating` + `Loader2` spinner añadido al botón "Ver detalles" en `ProcessNode.jsx` y al botón Volver en `RecordHeader.jsx`. Ambos botones se deshabilitan mientras navegan.

---

### PROD-13 ✅ IMPLEMENTADO
- **Severidad**: Bajo
- **Impacto**: Medio
- **Esfuerzo**: Muy bajo
- **Riesgo de cambio**: Muy bajo
- **Tipo**: render
- **Flujo afectado**: Vista detallada del diagrama — nodos de tipo Stock y Process
- **Síntoma**: En el modo de vista "detallada", los nombres de producto en la tabla de nodos aparecen truncados con puntos suspensivos ("Pulpo eviscerado congelad..."). El nodo tiene ancho suficiente (380-450px en Stock, 320-400px en Process) pero la celda de nombre está limitada a un `max-w` fijo.
- **Evidencia**:
  - `src/components/Admin/Productions/ProductionDiagram/components/StockNode.jsx:134` — celda de producto: `truncate max-w-[140px]`. Con un nodo de hasta 450px, hay espacio para más texto.
  - `src/components/Admin/Productions/ProductionDiagram/components/ProcessNode.jsx:153,182` — columna de producto: `truncate max-w-[120px]`.
- **Causa raíz**: El `max-w` de la celda no escala con el ancho del nodo en modo detallado.
- **Impacto UX / negocio**: El usuario no puede ver el nombre completo del producto sin hacer hover (tooltip). En una vista de trazabilidad, los nombres completos son información clave.
- **Cambio propuesto**: En modo detallado, cambiar `max-w-[140px]` por `max-w-[200px]` en `StockNode.jsx:134` y `max-w-[120px]` por `max-w-[160px]` en `ProcessNode.jsx:153,182`. Alternativamente, eliminar el `max-w` en modo detallado y dejar que la tabla ocupe el ancho disponible del nodo.
- **Validación**: Verificar que los nombres de producto se ven completos o al menos más largos en la vista detallada.
- **Riesgos / trade-offs**: Ninguno significativo. Puede necesitar ajuste de columnas adyacentes para que la tabla siga siendo legible.
- **Superficies afectadas**: `src/components/Admin/Productions/ProductionDiagram/components/StockNode.jsx:134`, `src/components/Admin/Productions/ProductionDiagram/components/ProcessNode.jsx:153,182`
- **Implementado**: 2026-03-24 — `StockNode.jsx`: `truncate max-w-[140px]` → `max-w-[200px]` + `<span class="block truncate" title={...}>`. `ProcessNode.jsx`: `truncate max-w-[120px]` → `max-w-[160px]` + `<span class="block truncate" title={...}>` en ambas columnas (inputs y outputs).

---

## Auditoría de loading y transición

### Loaders correctos (no modificar)
- `ProductionView.jsx:35-53` — estado de error con `AlertCircle` + botón de vuelta. Correcto.
- `ProductionView.jsx:56-70` — estado de "producción no encontrada". Correcto.
- `ProductionDiagram/index.jsx:164-174` — mensaje de error cuando `processTree === null`. Correcto.
- `ProductionDiagram/index.jsx:176-199` — empty states diferenciados (sin procesos vs error de transformación). Correcto.

### Loaders problemáticos

| Ubicación | Problema | Mejora |
|---|---|---|
| `loading.js:6-8` | Spinner puro sin texto ni skeleton de layout | Skeleton básico del listado + texto "Cargando producciones..." |
| `ProductionView.jsx:27-32` | `<Loader />` sin texto bloquea toda la vista | Skeleton de header + cards mientras cargan |
| `ProductionDiagram/index.jsx:151-156` | `<Loader />` sin texto en el contenedor del diagrama | "Cargando diagrama de producción..." |
| Managers (todos) | Sin loading inline en operaciones CRUD individuales | Toast de "guardando..." que se resuelve a "guardado" o error |
| `openManageDialog` | Sin feedback mientras se cargan los datos del diálogo | Abrir el diálogo inmediatamente con skeleton interno |

### Dónde usar skeleton en vez de spinner
- **Detalle de producción**: Header (nombre, estado, fechas) en skeleton mientras cargan `totals` y `processTree`.
- **Lista de producciones**: Skeleton de filas de tabla — mantener si ya existe en `EntityClient`.
- **Registros de producción**: Skeleton de filas mientras carga la lista.

### Dónde preservar datos previos durante refresco
- **Mutaciones en listas de managers**: `placeholderData` o `keepData` para que la lista no se vacíe durante refetch post-mutación.
- **Cambio de filtros en listado**: `placeholderData: keepPreviousData` de React Query.

### Mensajes explícitos recomendados

| Operación | Mensaje propuesto |
|---|---|
| Carga inicial del detalle | "Cargando producción..." |
| Carga de diagrama | "Cargando diagrama de procesos..." |
| Guardar registro | "Guardando registro..." → toast "Registro guardado" |
| Crear output | "Añadiendo salida..." → toast "Salida añadida" |
| Eliminar output | AlertDialog "¿Eliminar esta salida?" → toast "Salida eliminada" |
| Subida de imágenes | Barra de progreso con porcentaje |
| Sincronizar outputs | "Sincronizando salidas..." → toast de resultado |

---

## Confirmaciones positivas

Los siguientes elementos están bien resueltos y **no deben modificarse** sin una métrica clara:

- **`useProductionDetail.ts:40-49`**: El `Promise.all` para los 3 bundles es correcto. La única mejora es desagregar `processTree`, no cambiar el patrón de paralelismo.
- **`ProductionRecordContext`**: El patrón de rollback con `previousStateRef` es correcto para actualizaciones optimistas. No tocarlo.
- **Servicios de producción** (`productions.js`, `productionRecords.js`, etc.): Bien estructurados, usan `apiGet/apiPost/apiDelete` centralizados con transformers de normalización. No refactorizar sin necesidad.
- **Query keys de los hooks React Query existentes** (`useProduction.ts`, `useProductionDetail.ts`): Incluyen `tenantId` correctamente. Solo añadir factory encima.
- **`useProductionData.js:40-48`**: El `useMemo` para generar `dataKey` es correcto para detectar cambios de lista. El anti-patrón es el hook en sí, no este mecanismo.
- **Error state de `ProductionView.jsx:35-53`**: El estado de error con botón de vuelta es correcto y accesible.
- **`ProductionCostsManager.jsx`** (419 líneas): Tamaño razonable, bien estructurado. No refactorizar.

---

## Evaluación por sub-bloque

### Listado de producciones
```
sub_bloque: Listado de producciones
estado_actual: Funcional, sin problemas críticos
puntuacion_anterior: 6/10
puntuacion_actual: 7/10
cambios_aplicados: loading.js con texto "Cargando producciones..."
pendiente: Skeleton de layout completo
```

### Detalle de producción
```
sub_bloque: Detalle de producción (ProductionView)
estado_actual: Carga progresiva implementada; processTree lazy; skeleton en totales
puntuacion_anterior: 5/10
puntuacion_actual: 8/10
cambios_aplicados:
  - useProductionDetail dividido en 3 queries independientes (PROD-01)
  - processTree solo se carga al activar tab "Diagrama" (PROD-09)
  - Skeleton en card de Totales mientras totalsLoading
  - staleTime: 2min en las 3 queries (PROD-08)
  - Loader con texto "Cargando producción..." (PROD-02)
  - bug redirect corregido (PROD-11)
pendiente: Skeleton estructural del header durante el estado inicial
```

### Registros de producción
```
sub_bloque: Registros de producción (ProductionRecordsManager)
estado_actual: Funcional; tamaño moderado (447 líneas)
puntuacion_anterior: 6/10
puntuacion_actual: 6/10
pendiente: placeholderData en paginación; texto en loaders internos
```

### Inputs
```
sub_bloque: Gestión de inputs
estado_actual: UX nativa eliminada; deuda estructural (fetch manual) permanece
puntuacion_anterior: 4/10
puntuacion_actual: 6/10
cambios_aplicados:
  - Todos los alert() → toast.error() (PROD-04)
  - confirm() → AlertDialog + deleteInputConfirm state (PROD-04)
pendiente: Migración a React Query (PROD-05 — sprint dedicado)
```

### Outputs
```
sub_bloque: Gestión de outputs
estado_actual: UX nativa eliminada; openManageDialog paralelizado; deuda estructural permanece
puntuacion_anterior: 3/10
puntuacion_actual: 6/10
cambios_aplicados:
  - Todos los alert() → toast.error() (PROD-04)
  - confirm() → AlertDialog + deleteOutputConfirm state (PROD-04)
  - openManageDialog paralelizado con Promise.all (PROD-06)
pendiente: Migración a React Query (PROD-05 — sprint dedicado); setQueryData optimista
```

### Consumos
```
sub_bloque: Gestión de consumos (OutputConsumptionsManager)
estado_actual: Funcional con deuda técnica alta; 783 líneas de componente + 713 de hook
puntuacion_estimada: 4/10
principal_cuello_de_botella: Waterfall loadProducts → loadAvailableOutputs al abrir diálogo; refetch completo
principal_problema_de_percepcion: Sin feedback durante operaciones; alert() nativos
quick_wins: Paralelizar la carga del diálogo (Promise.all); reemplazar alert() por toast
cambio_estructural_recomendado: Migrar a React Query; eliminar lógica de fallback manual de sync (37 líneas)
```

### Imágenes
```
sub_bloque: Gestión de imágenes
estado_actual: No revisado en detalle en esta pasada
puntuacion_estimada: sin dato
principal_cuello_de_botella: Inferido: subida sin progreso visible
principal_problema_de_percepcion: Inferido: sin indicador de progreso durante uploads
quick_wins: Añadir progress bar si no existe
cambio_estructural_recomendado: Evaluar en próxima pasada con acceso a runtime
```

### Diagrama / trazabilidad
```
sub_bloque: Diagrama de producción (ProductionDiagram)
estado_actual: Debug logs eliminados; carga lazy; feedback visual en navegación; nombres legibles
puntuacion_anterior: 5/10
puntuacion_actual: 8/10
cambios_aplicados:
  - useEffect debug (~44 líneas + O(n) recursivo) eliminado (PROD-03)
  - console.log de render body en ProcessNode eliminado (PROD-12)
  - processTree cargado con enabled: activeTab === 'diagram' (PROD-09/PROD-01)
  - Spinner "Cargando diagrama de procesos..." (PROD-02)
  - isNavigating + Loader2 en botón "Ver detalles" (PROD-12)
  - max-w ampliado en StockNode y ProcessNode + tooltip title (PROD-13)
pendiente: Ninguno urgente
```

### Costes / auxiliares
```
sub_bloque: Costes y vistas auxiliares
estado_actual: Bien estructurado para su tamaño (419 líneas)
puntuacion_estimada: 7/10
principal_cuello_de_botella: Refetch completo tras guardar/borrar costes
principal_problema_de_percepcion: Sin feedback específico de "guardando coste..." durante submit
quick_wins: Toast de feedback en operaciones
cambio_estructural_recomendado: Evaluar migración a React Query cuando se aborde el bloque de managers
```

---

## Plan de remediación

### Quick wins — bajo riesgo, alto impacto perceptivo ✅ COMPLETADOS

| # | Acción | Estado |
|---|---|---|
| QW-0 | **BUG: Corregir redirect tras crear registro** (`useProductionRecord.js:105`) | ✅ 2026-03-24 |
| QW-1 | Eliminar bloque de debug logs del diagrama (`ProductionDiagram/index.jsx:40-82`) | ✅ 2026-03-24 |
| QW-1b | Eliminar console.log en render de ProcessNode (`ProcessNode.jsx:41-43`) | ✅ 2026-03-24 |
| QW-2 | Añadir texto al loading de ruta (`loading.js`) | ✅ 2026-03-24 |
| QW-3 | Añadir texto al Loader del detalle (`ProductionView.jsx`) | ✅ 2026-03-24 |
| QW-4 | Añadir texto al Loader del diagrama (`ProductionDiagram/index.jsx`) | ✅ 2026-03-24 |
| QW-5 | Añadir staleTime a hooks React Query | ✅ 2026-03-24 |
| QW-10 | Ampliar max-w de nombres de producto en nodos detallados | ✅ 2026-03-24 |

### Quick wins de UX ✅ COMPLETADOS

| # | Acción | Estado |
|---|---|---|
| QW-6 | Reemplazar `alert()` por `toast.error()` en outputs | ✅ 2026-03-24 |
| QW-7 | Reemplazar `confirm()` por `AlertDialog` en outputs | ✅ 2026-03-24 |
| QW-8 | Reemplazar `alert()` / `confirm()` en inputs | ✅ 2026-03-24 |
| QW-9 | Paralelizar `openManageDialog` en outputs | ✅ 2026-03-24 |
| QW-11 | Separar `useProductionDetail` en 3 queries + lazy processTree | ✅ 2026-03-24 |
| QW-12 | `isNavigating` en botón "Ver detalles" y botón Volver | ✅ 2026-03-24 |

### Cambios estructurales — PENDIENTES (1-3 semanas)

**Desagregar `useProductionDetail`** → ✅ Completado el 2026-03-24 como parte de PROD-01.

**Crear `productionKeys` factory**
`src/lib/queryKeys/productionKeys.ts` — funciones para todas las keys del módulo.

**Migrar managers a React Query (por orden de impacto)**
1. `useProductionOutputsManager`
2. `useProductionInputsManager`
3. `useProductionOutputConsumptionsManager`
4. Eliminar `useProductionData.js` cuando los tres estén migrados

Usar `setQueryData` en mutaciones donde la respuesta devuelva el dato actualizado. La migración debe coordinarse con `ProductionRecordContext` para no romper las actualizaciones optimistas.

**Añadir skeleton al detalle**
Una vez desagregado `useProductionDetail`, mostrar skeleton del header y cards de totales mientras cargan individualmente.

### Fase de hardening y observabilidad

- React Query Devtools: verificar deduplicación y staleTime.
- DevTools Network: requests por flujo crítico antes/después.
- LCP del detalle de producción.
- Reglas de PR:
  - Toda mutación en el módulo justifica `setQueryData` o `invalidateQueries` con predicado.
  - Ningún `alert()` / `confirm()` nativo en componentes o hooks del módulo.
  - Ningún `console.log` sin `process.env.NODE_ENV === 'development'`.

---

## Actualización propuesta de la fuente de verdad

Para `docs/prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md`, bloque `Producción, trazabilidad y etiquetas`:

```
- bloque: Producción, trazabilidad y etiquetas
- puntuacion_actual: 4/10
- objetivo: 8/10
- estado: auditado
- fecha_revision: 2026-03-24
- gap_principal: tres managers críticos sin React Query (2.362 líneas de fetch manual), bundle triple siempre cargado en detalle, ~50 alert/confirm nativos, debug logs en producción en el diagrama
- notas_provisionales:
  - useProductionOutputsManager (834 líneas), useProductionInputsManager (815), useProductionOutputConsumptionsManager (713) usan useState/useEffect manual; sin caché, sin deduplicación
  - useProductionDetail agrupa production + processTree + totals en una sola query; bloquea toda la vista hasta que los 3 resuelven; processTree se pide aunque el usuario no abra la tab de diagrama
  - ProductionDiagram tiene ~42 líneas de console.log activos en producción con recorrido recursivo del árbol
  - No existe query key factory para el módulo
  - staleTime = 0 en todos los hooks existentes
  - openManageDialog en outputs tiene waterfall de 2-3 requests que podrían ser paralelos
- notas_cerradas:
  - useProductionDetail ya usa React Query con Promise.all (correcto)
  - ProductionRecordContext tiene rollback con previousStateRef (correcto)
  - Servicios bien estructurados con transformers de normalización (correcto)
  - ProductionCostsManager tiene tamaño razonable y buena estructura
- dependencias_o_riesgos:
  - La migración de managers a React Query debe coordinarse con ProductionRecordContext
  - El lazy load de processTree requiere estado de tab activa en ProductionView
- referencias_clave:
  - src/hooks/production/useProductionDetail.ts
  - src/hooks/production/useProductionOutputsManager.js
  - src/hooks/production/useProductionInputsManager.js
  - src/components/Admin/Productions/ProductionDiagram/index.jsx
  - docs/audits/productions-performance-audit-2026-03-24.md
```

---

*Auditoría realizada mediante análisis estático del código fuente. Sin acceso a runtime, Profiler ni datos reales de red. Los hallazgos de rendimiento son inferidos; validar con DevTools antes de priorizar cambios estructurales.*
