# Auditoría de Producciones (II): navegación, editor de registros y rendimiento estructural

**Fecha**: 2026-03-24
**Entorno analizado**: código fuente local, análisis estático
**Runtime real**: no disponible en esta pasada (sin Profiler, sin waterfall de red medido)
**Módulo**: bloque de producciones — rutas `/admin/productions/*`
**Alcance**: navegación entre páginas, vista de detalle, editor de registro/nodo

---

## Limitaciones declaradas

- Sin acceso a runtime: no hay TTFB medido, waterfall real de red, FPS ni coste de re-render con React Profiler.
- Sin datos reales de producción: no se ha validado el comportamiento con lotes grandes (>500 inputs, árboles profundos de procesos, sesiones concurrentes).
- Sin acceso al backend: no se pueden confirmar latencias reales de endpoints ni planes de consulta.
- Las conclusiones sobre lentitud percibida se basan en análisis estático del código, identificación de fetches, patrones de re-render y tamaño de bundles.

---

## Resumen ejecutivo

| Área | Score | Problema principal |
|---|---|---|
| Navegación entre páginas | **4 / 10** | Middleware bloquea cada navegación con un fetch HTTP al backend |
| Vista de detalle de producción | **6 / 10** | QueryKey duplicada genera request extra; `@xyflow/react` en bundle siempre |
| Editor de registro / nodo | **4 / 10** | 6–7 requests al montar, 2 duplicadas; estado triplicado; mega-hooks sin granularidad |
| **Global del módulo** | **5 / 10** | — |

---

## Alcance auditado

### Rutas
- `src/app/admin/productions/page.js`
- `src/app/admin/productions/loading.js`
- `src/app/admin/productions/[id]/page.js`
- `src/app/admin/productions/[id]/ProductionClient.js`
- `src/app/admin/productions/[id]/records/[recordId]/page.js`
- `src/app/admin/productions/[id]/records/[recordId]/ProductionRecordClient.jsx`
- `src/app/admin/productions/[id]/records/create/page.js`

### Infraestructura transversal
- `src/middleware.ts` (227 líneas)
- `src/app/layout.js`
- `src/app/ClientLayout.js`
- `src/app/admin/layout.js`
- `src/app/admin/AdminLayoutClient.jsx`
- `src/context/SettingsContext.js`
- `next.config.mjs`

### Componentes
- `src/components/Admin/Productions/ProductionView.jsx` (720 líneas)
- `src/components/Admin/Productions/ProductionDiagram/index.jsx` (293 líneas)
- `src/components/Admin/Productions/ProductionRecordEditor.jsx` (152 líneas)
- `src/components/Admin/Productions/ProductionInputsManager.jsx` (547 líneas)
- `src/components/Admin/Productions/ProductionOutputsManager.jsx` (1053 líneas)
- `src/components/Admin/Productions/ProductionOutputConsumptionsManager.jsx` (785 líneas)
- `src/components/Admin/Entity/EntityClient/index.js` (750 líneas)

### Hooks
- `src/hooks/production/useProduction.ts` (34 líneas)
- `src/hooks/production/useProductionDetail.ts` (89 líneas)
- `src/hooks/useProductionRecord.js` (143 líneas)
- `src/hooks/production/useProductionInputsManager.js` (802 líneas)
- `src/hooks/production/useProductionOutputsManager.js` (853 líneas)
- `src/hooks/production/useProductionOutputConsumptionsManager.js` (715 líneas)

### Contextos
- `src/context/ProductionRecordContext.js` (255 líneas)

---

## Área A — Navegación entre páginas

### Arquitectura de navegación actual

Cuando el usuario hace click en cualquier link dentro de `/admin/*`, la secuencia es:

```
Click en link
  → Middleware.ts ejecuta
      → getToken() [~5ms, local]
      → ¿existe cookie __session_verified? (TTL 60s)
          NO → fetchWithTenant("/api/v2/me") [100–500ms, round-trip al backend]
          SÍ → continúa [~0ms]
  → Next.js inicia route transition
  → Server Component render
  → Client hydration
  → React Query mounts + fetches de datos
```

La espera que el usuario percibe entre el click y ver la nueva página cargando es principalmente la suma del middleware + la primera query de datos. **Si la cookie ha expirado, añade entre 100 y 500 ms completamente opacos** — el usuario solo ve el loader de navegación de Next.js, sin feedback de qué está ocurriendo.

---

### NAV-01 — Middleware: fetch HTTP bloqueante en cada navegación tras 60 segundos

**Severidad**: 🔴 CRÍTICO
**Archivo**: `src/middleware.ts` líneas ~98–157

**Descripción**:
El middleware verifica la sesión activa llamando a `fetchWithTenant("/api/v2/me")` en el Edge Runtime en cada request a rutas protegidas, cada vez que la cookie `__session_verified` (TTL 60s) ha expirado. Esto es un fetch HTTP síncrono y bloqueante: Next.js no puede iniciar el render ni el streaming de la nueva página hasta que esta llamada resuelve.

```
Impacto por sesión de uso:
- 0–60s desde última navegación: sin overhead (~0ms extra)
- >60s desde última navegación: +100ms a +500ms en CADA CLICK de navegación
- Navegación rápida (múltiples clicks): race conditions con múltiples fetches a /me simultáneos
```

**Consecuencia observable**: el usuario hace click en "Ver detalle" o "Abrir record" y la pantalla no responde durante ~300ms antes de mostrar cualquier señal de carga. Esto se siente como si el click no hubiera sido registrado.

**Solución recomendada**: ampliar el TTL de la cookie de verificación de 60s a 5–10 minutos. Si se necesita re-verificación más frecuente, hacerla de forma no bloqueante (en background tras el render, no antes). Alternativa: confiar en el JWT existente para la verificación en middleware (ya se tiene `getToken()`), y reservar el call a `/me` solo para casos donde el JWT no sea suficiente.

---

### NAV-02 — `force-dynamic` en admin layout desactiva todo caching en `/admin/*`

**Severidad**: 🟠 ALTO
**Archivo**: `src/app/admin/layout.js` línea 3

**Descripción**:
```javascript
export const dynamic = "force-dynamic";
```

Este flag desactiva ISR, SSG y el Full Route Cache de Next.js para **todas las subrutas de `/admin/`**, incluyendo producciones. Cada request genera un render completo en el servidor sin ninguna capa de caché de Next.js. En combinación con el middleware bloqueante (NAV-01), cada navegación parte de cero.

**Solución recomendada**: evaluar si `force-dynamic` es realmente necesario en el layout raíz de admin o si puede moverse solo a las páginas que lo requieren (como páginas con datos muy dinámicos o personalizados). Si la razón original es evitar errores de hidratación con Client Components, hay alternativas más quirúrgicas.

---

### NAV-03 — `window.open()` en EntityClient en lugar de `<Link>`

**Severidad**: 🟠 ALTO
**Archivo**: `src/components/Admin/Entity/EntityClient/index.js` líneas ~564–583

**Descripción**:
La lista de producciones (EntityClient) navega a detalle y a crear con `window.open()`:
```javascript
const handleOpenView = (id) => {
  const viewUrl = config.viewRoute.replace(':id', id)
  window.open(viewUrl, '_blank')  // Abre en pestaña nueva
}
```

Esto tiene dos problemas de rendimiento:
1. **Sin prefetch**: `<Link>` de Next.js hace prefetch automático de la ruta destino en hover. Con `window.open()` no hay prefetch — la carga es completamente "fría".
2. **Abre en pestaña nueva**: el estado de caché de React Query no se comparte entre pestañas, por lo que la nueva pestaña empieza desde cero aunque el usuario ya tuviera esa producción en caché.

**Solución recomendada**: usar `router.push()` para navegación dentro de la misma pestaña. Si se quiere mantener la opción de abrir en pestaña nueva, ofrecer ambos (click normal = misma pestaña con `<Link>`, ctrl+click o botón secundario = pestaña nueva).

---

### NAV-04 — `@xyflow/react` no lazy-loaded: ~300–400 KB en el bundle principal

**Severidad**: 🟠 ALTO
**Archivo**: `src/components/Admin/Productions/ProductionView.jsx` línea 14 (aprox)

**Descripción**:
```javascript
// Importación estática actual:
import ProductionDiagram from './ProductionDiagram'
// ProductionDiagram/index.jsx importa @xyflow/react y su CSS
```

`@xyflow/react` es una librería de ~300–400 KB (con dependencias y CSS). Se incluye en el bundle de `ProductionView` aunque el usuario esté en la pestaña "Info" — la más común — y nunca abra la pestaña "Diagrama". Esto aumenta el tiempo de parse y ejecución del JS en la carga inicial de cualquier detalle de producción.

**Solución recomendada**:
```javascript
import dynamic from 'next/dynamic'

const ProductionDiagram = dynamic(
  () => import('./ProductionDiagram'),
  { ssr: false, loading: () => <Loader text="Cargando diagrama..." /> }
)
```

Esto divide el bundle: el diagrama solo se descarga y parsea cuando el usuario abre la pestaña "Diagrama". Impacto estimado en TTI (Time to Interactive): −100–200ms en la carga inicial de detalle.

---

### NAV-05 — `SettingsProvider` fetcha datos en cada montaje del AdminLayout

**Severidad**: 🟡 MEDIO
**Archivo**: `src/context/SettingsContext.js` línea ~13, `src/app/admin/AdminLayoutClient.jsx`

**Descripción**:
`AdminLayoutClient` incluye `useSettings()` que hace una query al backend para obtener la configuración del tenant. Esta query se lanza en cada montaje del layout (incluyendo navegaciones SPA que no desmontarían el layout, pero sí una carga inicial o pestaña nueva). Añade una request extra que compite con las queries de datos de la página.

**Solución recomendada**: verificar si la query de settings tiene `staleTime` adecuado (mínimo 5–10 minutos, ya que la configuración del tenant cambia raramente). Si no, añadirlo para que solo se fetchee una vez por sesión.

---

## Área B — Vista de detalle de producción

### DEEP-01 — QueryKey duplicada: `useProduction` vs `useProductionDetail` para el mismo endpoint

**Severidad**: 🔴 CRÍTICO
**Archivos**: `src/hooks/production/useProduction.ts:19`, `src/hooks/production/useProductionDetail.ts:45`

**Descripción**:
Dos hooks distintos llaman al mismo endpoint `getProduction(id, token)` con queryKeys diferentes:

```typescript
// useProduction.ts
queryKey: ['productions', 'one', tenantId, productionId]

// useProductionDetail.ts
queryKey: ['productions', 'detail', tenantId, productionId]
```

React Query los trata como queries completamente separadas. Cuando el usuario tiene abierto un detalle de producción (`useProductionDetail`) y dentro abre un editor de record (`useProductionRecord` → `useProduction`), se lanzan **dos requests a la misma URL** a la misma producción, sin que ninguna aproveche la caché de la otra.

**Solución recomendada**: unificar ambos hooks a la misma queryKey: `['productions', 'detail', tenantId, productionId]`. `useProduction` puede ser un alias que llama a `useProductionDetail` internamente, o simplemente adoptar la misma key.

---

### DEEP-02 — `invalidateQueries` demasiado amplia tras guardar un record

**Severidad**: 🟠 ALTO
**Archivo**: `src/hooks/useProductionRecord.js` líneas 88–89

**Descripción**:
```javascript
queryClient.invalidateQueries({ queryKey: ['productionRecords'] })
queryClient.invalidateQueries({ queryKey: ['productions'] })
```

Tras guardar o crear un record, se invalidan **todas** las queries que empiezan por `'productionRecords'` y `'productions'`. Esto fuerza re-fetch de:
- Lista completa de producciones
- Detalle de la producción actual (incluidos totals y processTree)
- Todos los records de todas las producciones en caché

La gran mayoría de esas queries no han cambiado. Solo es necesario actualizar el record concreto y los totals de la producción afectada.

**Solución recomendada**:
```javascript
// Solo lo que realmente ha cambiado:
queryClient.invalidateQueries({ queryKey: ['productionRecords', recordId] })
queryClient.invalidateQueries({ queryKey: ['productions', 'totals', tenantId, productionId] })
queryClient.invalidateQueries({ queryKey: ['productions', 'processTree', tenantId, productionId] })
```

---

### DEEP-03 — `staleTime` ausente en `recordQuery` y `existingRecordsQuery`

**Severidad**: 🟠 ALTO
**Archivo**: `src/hooks/useProductionRecord.js` líneas 35–45

**Descripción**:
```javascript
const recordQuery = useQuery({
  queryKey: ['productionRecords', recordId],
  queryFn: () => getProductionRecord(recordId, token),
  enabled: !!token && !!recordId,
  // ← sin staleTime
})
```

Sin `staleTime`, React Query considera los datos inmediatamente obsoletos (stale = 0ms). Cada vez que el componente recupera el foco (el usuario cambia de pestaña y vuelve), React Query lanza un refetch en background. En el editor de un record, esto puede ocurrir frecuentemente (el usuario consulta otra pestaña mientras edita) y genera requests innecesarias.

**Solución recomendada**: añadir `staleTime: 30 * 1000` (30 segundos) al record y `staleTime: 2 * 60 * 1000` a existingRecords.

---

### DEEP-04 — Context invalida el árbol completo en cada actualización del record

**Severidad**: 🟠 ALTO
**Archivo**: `src/context/ProductionRecordContext.js` líneas 202–227

**Descripción**:
```javascript
const contextValue = useMemo(() => ({
  ...recordData,       // ← objeto con record, loading, saving, error
  updateRecord,
  updateInputs,
  updateOutputs,
  updateConsumptions,
  recordInputs,
  recordOutputs,
  recordConsumptions,
  hasParent
}), [recordData, updateRecord, ...])
```

`recordData` es un objeto que incluye `record` (respuesta completa del API), `loading`, `saving`, `error`. Cada vez que cualquiera de estos valores cambia — incluyendo `loading` (que alterna entre true/false en cada fetch) — el `useMemo` se invalida y **todos los consumidores del Context re-renderizan**: RecordHeader, ProcessInfoForm, ProcessSummaryCard, RecordContentSections y sus 3 managers (los componentes más pesados del editor).

En la práctica: cada vez que el usuario guarda un campo, se produce al menos un ciclo `saving: true → saving: false` que causa dos renders globales de todo el árbol.

**Solución recomendada**: separar el contexto en slices independientes (datos del record vs. estado de carga vs. datos de inputs/outputs/consumptions), o usar `useReducer` con selectors para que cada consumidor solo re-renderice cuando cambia su slice específica.

---

### DEEP-05 — `useEffect` que copia React Query data a `useState`

**Severidad**: 🟡 MEDIO
**Archivo**: `src/hooks/useProductionRecord.js` líneas 49–55

**Descripción**:
```javascript
const [record, setRecord] = useState(null)

useEffect(() => {
  if (recordId && recordQuery.data !== undefined) {
    setRecord(recordQuery.data)
  }
}, [recordId, recordQuery.data])
```

Este patrón causa un render doble en cada fetch: primero React Query actualiza `recordQuery.data` (render 1), después el `useEffect` detecta el cambio y llama a `setRecord` (render 2). El estado local `record` es una copia completamente innecesaria — podría usarse `recordQuery.data` directamente en todos los lugares donde se consume `record`.

**Solución recomendada**: eliminar el `useState(record)` y el `useEffect` asociado. Usar `recordQuery.data ?? null` directamente.

---

## Área C — Editor de registro / nodo

### DEEP-06 — 6–7 network requests al montar el editor, con duplicados

**Severidad**: 🔴 CRÍTICO
**Archivos**: `src/hooks/useProductionRecord.js`, los 3 managers hooks

**Descripción**:
Al abrir `/admin/productions/[id]/records/[recordId]`, se lanzan simultáneamente al montar:

| # | Request | Origen | Duplicado |
|---|---|---|---|
| 1 | `GET /production-records/{recordId}` | `useProductionRecord.js:35` | No |
| 2 | `GET /production-records/options?production_id={id}` | `useProductionRecord.js:41` | No |
| 3 | `GET /productions/{id}` | `useProduction` dentro del record hook | **Sí — ver DEEP-01** |
| 4 | `GET /processes` | `useProcessOptions` | No |
| 5 | `GET /production-inputs?production_record_id={recordId}` | `useProductionInputsManager.js:86` | No |
| 6 | `GET /product-options` | `useProductionOutputsManager.js:95` | No |
| 7 | `GET /product-options` | `useProductionOutputConsumptionsManager.js:85` | **Sí — duplicado del #6** |

**Requests efectivas al backend**: 6 únicas, de las cuales 2 repiten datos ya disponibles en el cliente (o que podrían estarlo con la caché correcta).

Impacto estimado en connection 3G (50ms RTT, 1Mbps): **2–4 segundos** hasta que el editor es interactivo, de los cuales ~1s es overhead evitable.

---

### DEEP-07 — Los 3 managers montan y fetchean inmediatamente, sin lazy loading

**Severidad**: 🟠 ALTO
**Archivos**: `useProductionInputsManager.js:86–101`, `useProductionOutputsManager.js:95–101`, `useProductionOutputConsumptionsManager.js:85–115`

**Descripción**:
Los tres managers (`ProductionInputsManager`, `ProductionOutputsManager`, `ProductionOutputConsumptionsManager`) se montan siempre al abrir el editor, independientemente de si el record tiene inputs, outputs o consumptions. Cada uno lanza su fetch al montar mediante `useEffect`:

```javascript
// useProductionInputsManager.js
useEffect(() => {
  if (hasInitializedRef.current) return
  loadInputs()  // ← fetch inmediato al montar
  hasInitializedRef.current = true
}, [session?.user?.accessToken, productionRecordId])
```

En un record recién creado (sin datos aún), estos fetches devuelven arrays vacíos pero consumen ancho de banda y tiempo de latencia igualmente. En un record con datos, los tres fetches se lanzan en paralelo competiendo por recursos.

**Solución recomendada**: añadir `enabled: false` a las queries hasta que el usuario interactúe con cada sección, o usar `React.lazy` + `Suspense` para montar los managers solo cuando su sección es visible.

---

### DEEP-08 — `getProductOptions` llamada 2 veces sin caché compartida

**Severidad**: 🟠 ALTO
**Archivos**: `useProductionOutputsManager.js:170`, `useProductionOutputConsumptionsManager.js:227`

**Descripción**:
Los dos hooks cargan la lista de productos con un fetch manual (no React Query):

```javascript
// useProductionOutputsManager.js
const loadProducts = async () => {
  const response = await getProductOptions(token)  // fetch directo
  setProducts(response.data || [])
}

// useProductionOutputConsumptionsManager.js
const loadProducts = async () => {
  const response = await getProductOptions(token)  // mismo fetch, mismo endpoint
  setProducts(response.data || [])
}
```

Al montar simultáneamente, lanzan dos requests en paralelo al mismo endpoint `GET /product-options`. No comparten caché porque están fuera de React Query. La respuesta se almacena por separado en el estado local de cada hook.

**Solución recomendada**: mover a un `useQuery({ queryKey: ['productOptions', tenantId] })` compartido. Ambos hooks consumirían la misma caché de React Query y solo se haría un fetch.

---

### DEEP-09 — Mega-hooks monolíticos: 800+ líneas, 20+ `useState` sin granularidad

**Severidad**: 🟠 ALTO
**Archivos**: los 3 hooks managers

**Descripción**:

| Hook | Líneas | `useState` count | Hooks totales |
|---|---|---|---|
| `useProductionInputsManager.js` | 802 | 20+ | 25+ |
| `useProductionOutputsManager.js` | 853 | 22+ | 28+ |
| `useProductionOutputConsumptionsManager.js` | 715 | 19+ | 22+ |

Cada `useState` individual comparte el mismo ciclo de render. Cuando el usuario escribe en el campo `weightTolerance` (un campo de filtro de búsqueda), se actualiza ese estado, lo que causa el re-render de **todo** el componente `ProductionInputsManager` (547 líneas de JSX), incluyendo la tabla de inputs, los dialogs, los botones, y todos los subcomponentes.

Con 20+ estados en un único hook, la probabilidad de renders innecesarios es muy alta. Cualquier interacción en cualquier parte del hook (cambiar un campo de formulario, abrir un dialog, etc.) puede desencadenar renders de partes de la UI que no han cambiado.

**Solución recomendada** (largo plazo): subdividir en hooks especializados por responsabilidad (estado de la tabla, estado del dialog de búsqueda, estado del dialog de gestión masiva, etc.). Cada sub-hook contiene solo los estados que cambian juntos. Los renders quedan confinados al sub-componente afectado.

---

### DEEP-10 — Estado triplicado: Context + Hook + Component

**Severidad**: 🟠 ALTO
**Archivos**: `ProductionRecordContext.js:40–90`, `useProductionInputsManager.js:60–100`

**Descripción**:
Los datos de `inputs`, `outputs` y `consumptions` existen simultáneamente en tres lugares:

```
1. ProductionRecordContext  ← "fuente de verdad" del provider
2. useProductionXManager    ← copia local sincronizada via useEffect
3. Componente JSX           ← desestructurado del hook
```

La sincronización entre el Context y el Hook local se realiza manualmente con dos `useEffect`, una ref `hasInitializedRef`, y una comparación de strings `inputsKey` (`.map().sort().join(',')`) para detectar cambios en el array de inputs. Esta lógica es frágil:

```javascript
// useProductionInputsManager.js líneas 60–70
const inputsKey = useMemo(() => {
  const currentInputs = contextInputs.length > 0 ? contextInputs : initialInputsProp
  if (!currentInputs || currentInputs.length === 0) return null
  return currentInputs
    .map((input) => input.id || input.boxId || JSON.stringify(input))
    .sort()
    .join(',')  // ← O(n log n), string grande, recalculado en cada render
}, [contextInputs, initialInputsProp])
```

**Problemas concretos**:
- Race condition si `contextInputs` y `initialInputsProp` cambian en el mismo ciclo
- `JSON.stringify(input)` como fallback en el key — O(n) con objetos complejos
- Si el Context actualiza los inputs mientras el hook tiene cambios pendientes, puede producirse inconsistencia

**Solución recomendada**: eliminar la copia local del estado en los hooks managers. Los managers deben leer directamente del Context (o de React Query si se migra). Single source of truth.

---

### DEEP-11 — Funciones de cálculo O(n) sin `useMemo`, recalculadas en cada render

**Severidad**: 🟡 MEDIO
**Archivo**: `src/hooks/production/useProductionInputsManager.js` líneas 396–476

**Descripción**:
Tres funciones de cálculo pesadas sin memoización:

```javascript
const calculateSummaryByPallet = () => { /* itera inputs completo: O(n) */ }
const calculateProductsBreakdown = () => { /* itera inputs completo: O(n) */ }
const calculateTotalSummary = () => { /* itera inputs completo: O(n) */ }
```

Cada una itera sobre el array `inputs` completo en cada llamada. No están envueltas en `useMemo`, lo que significa que se recalculan en **cada render del hook** — incluyendo renders causados por cambios de estado de UI completamente ajenos (abrir un dialog, cambiar un campo de texto, hover sobre un botón).

Con 1000 inputs en un record grande, cada render ejecuta O(n)×3 iteraciones. Si hay 10 renders por segundo durante una interacción, son 30.000 iteraciones de array por segundo innecesarias.

Además, `inputsKey` en línea 60–70 ejecuta `.map().sort().join(',')` — O(n log n) — en cada render para detectar si los inputs han cambiado.

**Solución recomendada**:
```javascript
const summaryByPallet = useMemo(() => calculateSummaryByPallet(inputs), [inputs])
const productsBreakdown = useMemo(() => calculateProductsBreakdown(inputs), [inputs])
const totalSummary = useMemo(() => calculateTotalSummary(inputs), [inputs])
```

---

### DEEP-12 — `localStorage` síncrono duplicado en inicializadores de `useState`

**Severidad**: 🟢 BAJO
**Archivos**: `useProductionOutputsManager.js:69–75`, `useProductionOutputConsumptionsManager.js:65–71`

**Descripción**:
```javascript
// En ambos hooks (código idéntico duplicado):
const [showBoxes, setShowBoxes] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('production_show_boxes')
    return saved !== null ? saved === 'true' : true
  }
  return true
})
```

Dos problemas:
1. **localStorage es síncrono** y bloquea el hilo principal durante la inicialización del hook. En la mayoría de casos el impacto es <1ms, pero es innecesario.
2. **Estado duplicado**: los dos hooks mantienen su propia copia de `showBoxes`. Si el usuario activa "mostrar cajas" en outputs, el estado no se comparte automáticamente con consumptions — dependiendo de cuál se monte primero, pueden quedar desincronizados.

**Solución recomendada**: extraer a un hook compartido `useShowBoxesPreference()` que lea/escriba localStorage, y usarlo en ambos managers.

---

### DEEP-13 — Handlers sin `useCallback` pasados como props

**Severidad**: 🟡 MEDIO
**Archivo**: `src/hooks/production/useProductionInputsManager.js` (múltiples)

**Descripción**:
Funciones de handler que se pasan a componentes hijos no están envueltas en `useCallback`:

```javascript
// Sin useCallback:
const handleSearchPallet = async () => { /* 80+ líneas de lógica */ }
const handleToggleBox = (boxId, palletId) => { /* lógica de selección */ }
const loadInputsOnly = async () => { /* fetch */ }
```

Estas funciones se recrean en cada render del hook. Si los componentes hijos que las reciben estuvieran envueltos en `React.memo`, no servirían de nada porque la referencia de la función cambia en cada render. Esto bloquea cualquier optimización futura de memoización en los hijos.

**Solución recomendada**: `useCallback` en todos los handlers que se pasen como props a componentes hijos, especialmente los que ejecutan lógica asíncrona o son passados a tablas/listas con muchos items.

---

## Tabla consolidada de hallazgos

| ID | Área | Título | Severidad | Impacto usuario |
|---|---|---|---|---|
| NAV-01 | Navegación | Middleware fetch bloqueante cada 60s | 🔴 CRÍTICO | Espera de 100–500ms opaca en cada navegación |
| NAV-02 | Navegación | `force-dynamic` desactiva caching en `/admin` | 🟠 ALTO | Overhead en cada page load |
| NAV-03 | Navegación | `window.open()` sin prefetch en lista | 🟠 ALTO | Carga "fría" al abrir detalle desde lista |
| NAV-04 | Navegación | `@xyflow/react` no lazy-loaded (+300KB) | 🟠 ALTO | TTI aumentado en detalle de producción |
| NAV-05 | Navegación | `SettingsProvider` fetcha en cada AdminLayout | 🟡 MEDIO | Request extra competidora al cargar |
| DEEP-01 | Vista detalle | QueryKey duplicada: doble fetch a `/productions/{id}` | 🔴 CRÍTICO | Request extra a cada apertura de record |
| DEEP-02 | Vista detalle | `invalidateQueries` demasiado amplia | 🟠 ALTO | Re-fetches masivos tras guardar un record |
| DEEP-03 | Vista detalle | `staleTime` ausente en `recordQuery` | 🟠 ALTO | Refetch en cada cambio de pestaña |
| DEEP-04 | Vista detalle | Context invalida árbol completo en cada cambio | 🟠 ALTO | Re-renders globales al guardar, al cambiar `loading` |
| DEEP-05 | Vista detalle | `useEffect` copia React Query data a `useState` | 🟡 MEDIO | Render extra en cada fetch del record |
| DEEP-06 | Editor | 6–7 requests al montar, 2 duplicadas | 🔴 CRÍTICO | 2–4s de carga inicial en conexión móvil |
| DEEP-07 | Editor | Managers fetchean sin lazy loading | 🟠 ALTO | Fetches innecesarios en records vacíos |
| DEEP-08 | Editor | `getProductOptions` llamada 2 veces sin caché | 🟠 ALTO | Request duplicada al mismo endpoint |
| DEEP-09 | Editor | Mega-hooks 800+ líneas, 20+ `useState` | 🟠 ALTO | Renders innecesarios ante cualquier interacción |
| DEEP-10 | Editor | Estado triplicado: Context + Hook + Component | 🟠 ALTO | Race conditions, inconsistencias, re-renders en cascada |
| DEEP-11 | Editor | Funciones O(n) sin `useMemo` | 🟡 MEDIO | Lag en interacciones con records grandes |
| DEEP-12 | Editor | `localStorage` síncrono duplicado | 🟢 BAJO | Overhead mínimo en init, posible desincronización |
| DEEP-13 | Editor | Handlers sin `useCallback` | 🟡 MEDIO | Bloquea optimizaciones futuras de memoización |

---

## Plan de remediación

### Sprint 1 — Impacto inmediato, bajo riesgo (1–2 días)

| Hallazgo | Cambio | Archivos |
|---|---|---|
| NAV-01 | Aumentar TTL de `__session_verified` de 60s a 5–10 minutos | `src/middleware.ts` |
| NAV-04 | `dynamic(() => import('./ProductionDiagram'), { ssr: false })` | `ProductionView.jsx` |
| DEEP-01 | Unificar queryKey de `useProduction` a `['productions', 'detail', ...]` | `src/hooks/production/useProduction.ts` |
| DEEP-02 | Acotar `invalidateQueries` a solo las keys afectadas | `src/hooks/useProductionRecord.js` |
| DEEP-03 | Añadir `staleTime: 30 * 1000` a `recordQuery` | `src/hooks/useProductionRecord.js` |
| DEEP-05 | Eliminar `useState(record)` + `useEffect` que lo sincroniza | `src/hooks/useProductionRecord.js` |
| DEEP-08 | Mover `loadProducts` a `useQuery(['productOptions', tenantId])` compartido | `useProductionOutputsManager.js`, `useProductionOutputConsumptionsManager.js` |
| DEEP-11 | Envolver `calculateSummaryByPallet`, `calculateProductsBreakdown`, `calculateTotalSummary` en `useMemo` | `useProductionInputsManager.js` |
| DEEP-12 | Extraer a hook `useShowBoxesPreference()` compartido | ambos manager hooks |

### Sprint 2 — Mejoras arquitectónicas, riesgo medio (3–5 días)

| Hallazgo | Cambio | Archivos |
|---|---|---|
| NAV-02 | Evaluar mover `force-dynamic` de layout raíz a páginas específicas | `src/app/admin/layout.js` |
| NAV-03 | Reemplazar `window.open()` por `router.push()` + `<Link>` en EntityClient | `EntityClient/index.js` |
| NAV-05 | Añadir `staleTime: 10 * 60 * 1000` a la query de settings | `src/context/SettingsContext.js` |
| DEEP-04 | Separar `ProductionRecordContext` en slices: datos / estado de carga / colecciones | `ProductionRecordContext.js` |
| DEEP-13 | Envolver handlers principales en `useCallback` | `useProductionInputsManager.js` |

### Sprint 3 — Refactors estructurales, riesgo alto (sprint dedicado)

| Hallazgo | Cambio | Archivos |
|---|---|---|
| DEEP-06 + DEEP-07 | Migrar los 3 managers a React Query para eliminar fetches manuales y lazy loading real | 3 hooks managers (~2.400 líneas) |
| DEEP-09 + DEEP-10 | Subdividir mega-hooks en hooks especializados, eliminar estado triplicado | 3 hooks managers + 3 components + Context |

---

## Notas finales

Los hallazgos de Sprint 1 son todos cambios de 1 a 10 líneas con riesgo muy bajo y sin necesidad de tests adicionales. Resuelven los dos problemas más percibidos por el usuario: la espera opaca al navegar (NAV-01) y las requests duplicadas al abrir un record (DEEP-01, DEEP-08).

Los Sprints 2 y 3 requieren más contexto sobre las decisiones originales de arquitectura (especialmente `force-dynamic` y el patrón de Context + triple estado) antes de proceder.
