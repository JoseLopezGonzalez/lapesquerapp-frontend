---
id: GAP-V2-057
title: La fila de KPIs del dashboard Comercial queda desbalanceada (2+1) en el breakpoint `md`
module: dashboard-home
category: ux-ui
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-057 — Grid de 3 KPI cards desbalanceado en tablet (`md`)

## Problema

`ComercialDashboard/index.js:635` renderiza las 3 tarjetas KPI superiores
(`TotalQuantitySoldCard`, `TotalAmountSoldCard`, `CommercialSalesSummaryCard`) en:

```jsx
<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
```

Con exactamente 3 elementos y `md:grid-cols-2`, en el rango de viewport `md` (768px–
1023px, p.ej. tablet en horizontal o ventana de escritorio a media pantalla) el grid
produce un layout 2+1: dos tarjetas en la primera fila y una tercera sola, ocupando
solo la primera columna, con un hueco vacío a su lado. Es el mismo defecto de fondo ya
documentado en GAP-V2-008 ("kpi-grid-unbalanced-five-cards") para el dashboard
Admin/Dirección — ahí con 5 tarjetas en un grid de 3 columnas produciendo 3+2; aquí
con 3 tarjetas en un grid de 2 columnas produciendo 2+1. Mismo síntoma de fondo:
número de tarjetas no múltiplo de las columnas del breakpoint intermedio.

## Objetivo

La fila de KPIs debe verse visualmente equilibrada en todos los breakpoints, sin
huecos vacíos evidentes junto a la última tarjeta.

## Contexto

Con exactamente 3 tarjetas, la solución es más simple que en GAP-V2-008 (que tiene 5
tarjetas y requiere una decisión de layout más elaborada): basta con eliminar el
breakpoint intermedio de 2 columnas y saltar directamente de 1 a 3 columnas, o hacer
que la tercera tarjeta ocupe el ancho completo en `md` con `md:col-span-2`.

## Solución propuesta

Opción recomendada (más simple): cambiar el grid a
`grid-cols-1 lg:grid-cols-3` (eliminando el breakpoint `md:grid-cols-2`), de forma que
las 3 tarjetas se apilen en una sola columna hasta el breakpoint `lg`, donde entran
las 3 a la vez sin huecos.

Alternativa: mantener `md:grid-cols-2` pero añadir `md:col-span-2 lg:col-span-1` a la
tercera tarjeta (`CommercialSalesSummaryCard`) para que ocupe el ancho completo en
`md` y vuelva a una columna normal en `lg`.

## Criterios de aceptación

- [ ] En viewport `md` (768–1023px), las 3 tarjetas KPI no dejan un hueco vacío visible
      junto a la última.
- [ ] El layout en `lg`+ y en mobile (`< md`) no cambia respecto al actual.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: revisar /comercial en un viewport de ~900px de ancho y confirmar que no
# queda un hueco vacío junto a la tercera tarjeta KPI.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-008 (mismo defecto de fondo en el dashboard Admin/Dirección)
