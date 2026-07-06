---
id: GAP-V2-003
title: La mayoría de widgets del dashboard ignoran el `error` que ya exponen sus hooks y lo confunden con "sin datos"
module: dashboard-home
category: ux-ui
priority: P1
risk: low
size: L
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/CurrentStockCard/index.js
  - src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js
  - src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx
  - src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js
  - src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx
  - src/components/Admin/Dashboard/OrderRanking/index.js
  - src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js
  - src/components/Admin/Dashboard/StockBySpeciesCard/index.js
  - src/components/Admin/Dashboard/StockByProductsCard/index.js
  - src/components/Admin/Dashboard/OrdersProfitabilityProductsCard/index.js
  - src/components/Admin/Dashboard/SalesChart/index.js
  - src/components/Admin/Dashboard/AuxiliaryLinesChartCard/index.tsx
  - src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx
  - src/components/Admin/Dashboard/AuxiliaryLinesByCustomerCard/index.tsx
  - src/components/Admin/Dashboard/ReceptionChart/index.js
  - src/components/Admin/Dashboard/DispatchChart/index.js
  - src/components/Admin/Dashboard/TransportRadarChart/index.js
  - src/components/Admin/Dashboard/WorkingEmployeesCard/index.js
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-003 — Widgets ignoran el `error` de sus hooks y lo muestran como "sin datos"

## Problema

Todos los hooks de estadísticas usados por este módulo (`useStockStats.ts`,
`useOrdersStats.ts`, `useDashboardCharts.ts`, `usePunches.js`) siguen el patrón de
retorno estándar del proyecto (`.claude/rules/hooks.md`) y exponen `error` junto a
`data`/`isLoading` — verificado con grep: cada `useQuery` en esos archivos
desestructura y devuelve `error: error?.message ?? null`.

Sin embargo, de los ~18 widgets del módulo, solo **uno** (`DailyCalibersBySpeciesCard`,
`src/components/Admin/Dashboard/DailyCalibersBySpeciesCard/index.js:142-152`) lee y
renderiza ese `error`. El resto de widgets con datos tabulares/gráfico (lista en
`target_files`) hace `const { data, isLoading } = useXxxStats()` — **sin
desestructurar `error`** — y cuando la petición falla (403 por permisos, 500 del
backend, error de red), el componente entra directamente en su rama de "sin datos"
(`SearchX`/`Package`/etc. con el mensaje "No hay datos"), indistinguible visualmente
de un caso legítimo de "no hay ventas en este rango".

Ejemplos concretos:
- `src/components/Admin/Dashboard/StockBySpeciesCard/index.js:10` —
  `const { data: stockData = [], isLoading } = useStockBySpeciesStats();` — si la
  petición falla, `stockData` queda `[]` por el valor por defecto y el componente
  renderiza el empty state "No hay stock disponible" (línea 74) en vez de un error.
- `src/components/Admin/Dashboard/WorkingEmployeesCard/index.js:23` —
  `usePunchesDashboard()` expone `error` (verificado en
  `src/hooks/usePunches.js:19-29`) pero el componente no lo usa; ante un fallo el
  usuario ve "No hay trabajadores registrados" (línea 309) en vez de un aviso de
  error real.
- `WorkerStatisticsCard` (`src/components/Admin/Dashboard/WorkerStatisticsCard/index.js:40-48`)
  es el único caso intermedio: sí desestructura `isError`/`error` y dispara un
  `notify.error` (toast), pero no muestra ningún estado inline — tras el toast, la
  tarjeta sigue renderizando todos los contadores a "0" como si fueran datos reales.

## Objetivo

Todo widget de este módulo cuyo hook exponga `error` debe: (a) desestructurar ese
`error`, y (b) cuando exista, renderizar un estado de error inline visualmente
distinto del estado "sin datos" — siguiendo el patrón ya correcto de
`DailyCalibersBySpeciesCard` (mensaje en `text-destructive`, con distinción de
403/422/genérico).

## Contexto

Ninguna dependencia. Es el hallazgo de mayor alcance de esta auditoría: afecta a
prácticamente todos los widgets del dashboard salvo uno. La causa raíz no está en
los hooks (ya exponen `error` correctamente) sino en que ningún componente lo
consume — un problema puramente de la capa de presentación.

## Solución propuesta

1. Tomar como plantilla el bloque de `DailyCalibersBySpeciesCard/index.js:142-152`:

```jsx
{error && (
  <div className="flex min-h-[200px] flex-col items-center justify-center py-8">
    <p className="text-destructive px-4 text-center text-sm">
      {error.status === 403
        ? 'No tienes permiso para ver esta información.'
        : error.message || 'Error al cargar los datos.'}
    </p>
  </div>
)}
```

2. En cada widget de `target_files`, desestructurar `error` del hook
   correspondiente y añadir la rama `error &&` antes de la rama de "sin datos",
   igual que ya hace `DailyCalibersBySpeciesCard`.
3. Para `WorkerStatisticsCard`, mantener el toast existente (es útil como aviso
   inmediato) y añadir además el estado inline, para que quien no vea el toast
   (o llegue después) entienda por qué los datos están en cero.
4. No modificar los hooks — ya devuelven `error` correctamente.

## Criterios de aceptación

- [ ] Cada widget de `target_files` desestructura `error` de su hook y lo renderiza
      quondo existe, con un mensaje visualmente distinto (color `text-destructive`)
      del estado "sin datos".
- [ ] El estado de error se muestra en vez del estado "sin datos" cuando
      `error` no es `null`.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: simular un error 500/403 en uno de los endpoints de stats (o revisar
# con React Query Devtools forzando un error) y confirmar que el widget afectado
# muestra un mensaje de error, no "sin datos".
```

## Notas de implementación

{se rellena durante la implementación — dado el tamaño (18 archivos), evaluar si
conviene dividir en sub-GAPs por familia de widget (KPI cards / charts con filtro /
rankings / WorkingEmployeesCard) antes de implementar en un solo lote}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
