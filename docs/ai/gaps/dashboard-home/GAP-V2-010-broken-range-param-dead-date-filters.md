---
id: GAP-V2-010
title: Selector de fechas sin efecto real en SalesBySalespersonPieChart y TransportRadarChart (parámetro `range` mal pasado al hook)
module: dashboard-home
category: code-quality
priority: P1
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js
  - src/components/Admin/Dashboard/TransportRadarChart/index.js
  - src/hooks/useOrdersStats.ts
  - src/hooks/useDashboardCharts.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-010 — Selector de fechas sin efecto real en 2 widgets (parámetro `range` mal pasado al hook)

## Problema

Dos widgets llaman a su hook de datos pasando el objeto `range` directamente como único
argumento, mientras que la firma del hook espera un objeto `{ range }`:

```js
// src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js:27
const { data: chartData = [], isLoading } = useSalesBySalesperson(range);
```

```ts
// src/hooks/useOrdersStats.ts:271-272
export function useSalesBySalesperson(params: SalesBySalespersonParams) {
  const { range } = params ?? {};
```

Como `range` (p. ej. `{ from, to }`) no tiene una propiedad `.range`, el destructuring
`const { range } = params` siempre resuelve a `undefined`, y el hook cae siempre al
`yearToDate` por defecto (`getYearToDateRange()`). El mismo bug existe en:

```js
// src/components/Admin/Dashboard/TransportRadarChart/index.js:28
const { data = [], isLoading } = useTransportChartData(range);
```

```ts
// src/hooks/useDashboardCharts.ts:152-153
export function useTransportChartData(params: { range?: { from?: Date; to?: Date } }) {
  const { range } = params ?? {};
```

Efecto observable: en ambos widgets el usuario puede mover el `DateRangePicker` libremente,
la UI del control cambia, pero los datos mostrados nunca varían — siempre corresponden al
año en curso. Es un control de UI completamente muerto, sin ningún error visible (ni en
consola ni en el tipo, porque ambos componentes son `.js` sin `checkJs`).

Todos los demás widgets del módulo (`DispatchChart`, `AuxiliaryLinesChartCard`,
`AuxiliaryLinesByProductCard`, `AuxiliaryLinesByCustomerCard`, `OrdersProfitabilityProductsCard`,
`SalesChart`, `ReceptionChart`) sí llaman correctamente con `{ range, ... }`, lo que confirma
que es un desliz de estos dos call-sites y no una ambigüedad de la API del hook.

## Objetivo

El `DateRangePicker` de `SalesBySalespersonPieChart` y `TransportRadarChart` debe afectar
realmente a los datos mostrados, igual que en el resto de widgets con selector de fechas.

## Contexto

Bug puramente funcional (no de UI), por eso lo señala el carril `code-audit-agent` y no
`ui-audit-agent` — el control se ve y se comporta bien visualmente, pero no hace nada.

## Solución propuesta

```diff
- const { data: chartData = [], isLoading } = useSalesBySalesperson(range);
+ const { data: chartData = [], isLoading } = useSalesBySalesperson({ range });
```

```diff
- const { data = [], isLoading } = useTransportChartData(range);
+ const { data = [], isLoading } = useTransportChartData({ range });
```

Ninguna otra parte del código necesita cambiar — las firmas de los hooks ya son correctas.

## Criterios de aceptación

- [ ] Cambiar el rango de fechas en `SalesBySalespersonPieChart` cambia los datos del pie chart
- [ ] Cambiar el rango de fechas en `TransportRadarChart` cambia los datos del radar chart
- [ ] `npm run type-check` y `npm run lint` limpios

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: en /admin/home, cambiar el DateRangePicker de "Ranking ventas" y de
# "Empresas de transporte" a un rango distinto al año en curso y confirmar que
# los datos cambian (o se muestra "Sin datos" si el rango elegido no tiene datos).
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
