---
id: GAP-V2-033
title: TotalQuantitySoldCard (kg vendidos) no comunica el periodo YTD que representa
module: dashboard-home
category: domain-business
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-033 — TotalQuantitySoldCard (kg vendidos) no comunica el periodo YTD que representa

## Problema

`TotalQuantitySoldCard` (`src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js:10-75`)
usa `useOrdersTotalNetWeightStats()`, que internamente fija el rango a año en curso
(`getYearToDateRange()` en `src/hooks/useOrdersStats.ts:26-39,41-56`: 1 de enero → hoy) sin
exponer ese rango al componente. El widget muestra únicamente:

```jsx
<h1 className="text-3xl font-medium tracking-tight">{formatDecimalWeight(data.value)}</h1>
<div className="mt-1 text-xs text-neutral-500 italic dark:text-neutral-400">
  {!data?.comparisonValue ? 'No hay datos de años anteriores' : `${formatDecimalWeight(data?.comparisonValue)} el año anterior`}
</div>
```

Sin ningún tooltip ni fecha explícita. En cambio, su widget hermano en la misma fila del grid
KPI, `TotalAmountSoldCard` (`src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx:108-178`),
para el mismo tipo de cálculo (YTD con comparativa interanual) sí expone un tooltip completo
con la etiqueta "Año en curso" y el rango de fechas exacto (`formatDateRange(data.range.from,
data.range.to)`).

Para un negocio pesquero/de congelados, "kg vendidos" es habitualmente el KPI operativo más
consultado del panel (junto al importe) — es la cifra que se compara mentalmente contra
capturas, producción o cupos. Que el usuario no tenga forma de confirmar si esa cifra
corresponde al año en curso, al mes actual o a un acumulado histórico (solo puede inferirlo
indirectamente por el texto "el año anterior" de la comparativa) genera riesgo real de
malinterpretar el número más consultado del dashboard.

## Objetivo

`TotalQuantitySoldCard` comunica explícitamente el periodo que representa (año en curso, con
fechas concretas), igual que ya hace `TotalAmountSoldCard` para el mismo tipo de dato.

## Contexto

Encontrado durante la auditoría domain-business de `dashboard-home` (carril
`domain-business-auditor`), superficie Admin/Dirección. No requiere cambio de backend: el
endpoint de `useOrdersTotalNetWeightStats` ya conoce el rango (se lo pasa el propio hook), solo
falta que la respuesta lo incluya y el componente lo muestre, igual que ya ocurre en
`TotalAmountSoldCard`.

## Solución propuesta

Replicar el patrón de tooltip de `TotalAmountSoldCard` (`Tooltip` + `Calendar` + rango de
fechas) en `TotalQuantitySoldCard`, verificando primero si el endpoint
`statistics/orders/total-net-weight` ya devuelve un campo `range` análogo al de
`statistics/orders/total-amount` (usado en `TotalAmountSoldCard`). Si no lo devuelve, es
un cambio de backend menor (exponer el mismo `range` que ya usa el endpoint de importe).

## Criterios de aceptación

- [ ] `TotalQuantitySoldCard` muestra, igual que `TotalAmountSoldCard`, el rango de fechas
      exacto que representa la cifra de kg vendidos (año en curso).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Verificación manual: /admin/home, confirmar que el tooltip/info de "Cantidad Total de
# Ventas" muestra el rango de fechas exacto, igual que "Importe Total de Ventas".
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
