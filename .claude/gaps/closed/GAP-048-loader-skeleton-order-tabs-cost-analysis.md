# GAP-048 — Loader → Skeleton en OrderTabsDesktop y OrderCostAnalysis

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Dos archivos del módulo Orders Manager no fueron cubiertos por GAP-033 (que corrigió `<Loader>` → `<Skeleton>` en el resto del módulo):

1. **`OrderTabsDesktop.jsx` (línea 83):** `<Loader>` se usa como fallback de `Suspense` para el contenido lazy-loaded de cada tab del pedido. El `<Loader>` (spinner + texto "Cargando") viola la regla del proyecto: este componente está reservado exclusivamente para gates de autenticación/sesión, no para carga de datos.

2. **`OrderCostAnalysis/index.jsx` (líneas 206–212):** `<Loader>` se usa como estado inicial mientras se fetcha el análisis de costes (`costAnalysisLoading && !costAnalysis`). Mismo problema.

Ambos casos muestran un spinner centered que no refleja la forma del contenido que va a aparecer, degradando la experiencia percibida de carga.

Detectado en auditoría desktop `/audit-desktop orders manager` 2026-07-01.

## Solución acordada

**`OrderTabsDesktop.jsx`:** Reemplazar el fallback de `Suspense` (`<Loader />`) por un `<Skeleton>` con forma de contenido genérico de tab. Un skeleton de altura razonable (`h-64 w-full rounded-lg`) es suficiente como placeholder.

**`OrderCostAnalysis/index.jsx`:** Reemplazar el early return con `<Loader>` por un skeleton estructurado que imite la forma del contenido real: 4 cards de métricas + placeholder de tabla. Seguir el mismo patrón de GAP-033 para los demás tabs.

## Referencias e inspiración

- `design-context.md §4 Loading States` — reglas de Skeleton vs Loader
- GAP-033 — implementación previa de Loader→Skeleton en este módulo
- `src/components/Admin/OrdersManager/shared/OrdersManagerLayout.jsx` — skeleton de referencia ya implementado

## Criterios de aceptación

- [ ] `OrderTabsDesktop.jsx`: el fallback de `Suspense` usa `<Skeleton>` en lugar de `<Loader>`
- [ ] `OrderCostAnalysis/index.jsx`: el estado de carga inicial usa skeleton estructurado en lugar de `<Loader>`
- [ ] El skeleton de `OrderCostAnalysis` tiene forma de contenido (cards + tabla), no es un spinner
- [ ] `<Loader>` no aparece en ninguno de los dos archivos tras el cambio
- [ ] No hay regresión en los estados de vacío/error de `OrderCostAnalysis` (que ya usan `EmptyState` correctamente)

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.jsx`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`

## Restricciones

- No tocar la lógica de data fetching ni el hook `useOrderCostAnalysis`
- No modificar otros archivos del módulo
- El skeleton de `OrderCostAnalysis` debe coincidir en estructura con el layout real (4 cards de métricas en la parte superior, tabla debajo)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.jsx` — `import Loader` eliminado; `import Skeleton` añadido; fallback de `Suspense` reemplazado por `<Skeleton className="h-64 w-full rounded-lg" />`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx` — `import Loader` eliminado; `import Skeleton` añadido; early return de carga reemplazado por skeleton estructurado: 4 cards `h-24` en grid `grid-cols-2 xl:grid-cols-4` + skeleton de tabs `h-8 w-48` + 5 filas de tabla `h-10`

### Decisiones tomadas durante la implementación

El skeleton de `OrderCostAnalysis` replica la estructura real del componente: 4 metric cards en grid responsive (2 columnas en móvil, 4 en xl) + placeholder de tabs + filas de tabla. El skeleton de `OrderTabsDesktop` es genérico (`h-64`) ya que el contenido lazy varía según la tab activa.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
