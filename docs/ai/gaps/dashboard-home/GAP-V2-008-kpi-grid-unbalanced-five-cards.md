---
id: GAP-V2-008
title: Fila superior de KPIs muestra 5 tarjetas en un grid de 4 columnas — última fila desequilibrada en 2xl
module: dashboard-home
category: ux-ui
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-008 — Fila de KPIs desequilibrada (5 tarjetas / 4 columnas)

## Problema

`src/components/Admin/Dashboard/index.tsx:71-87` define el grid de KPIs superior
como:

```jsx
<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
```

y contiene 5 tarjetas (`CurrentStockCard`, `TotalQuantitySoldCard`,
`TotalAmountSoldCard`, `OrdersProfitabilitySummaryCard`,
`AuxiliaryLinesTotalCard`). En viewport `2xl` (4 columnas), la quinta tarjeta
(`AuxiliaryLinesTotalCard`) queda sola en una segunda fila, ocupando solo 1 de las
4 columnas y dejando 3 huecos vacíos a su derecha — una asimetría visual notable
en la primera franja del dashboard, la de mayor jerarquía visual (justo debajo del
saludo).

En viewports `md`/`xl` (2 columnas) el problema es menor pero el mismo patrón se
repite: 5 tarjetas en 2 columnas deja la última fila con 1 tarjeta y 1 hueco.

## Objetivo

La fila de KPIs se ve visualmente equilibrada en todos los breakpoints
relevantes (sin huecos evidentes en la última fila), sin necesidad de añadir una
sexta tarjeta artificial.

## Contexto

Ninguna dependencia. Es puramente un ajuste de composición visual — no requiere
cambios de datos ni de hooks.

## Solución propuesta

Evaluar una de estas dos opciones (a decidir con Jose o por criterio de
`design-quality-auditor` si se solicita su revisión):

1. **Cambiar a `2xl:grid-cols-5`** para que las 5 tarjetas ocupen una sola fila
   completa en `2xl` (cada tarjeta más estrecha, pero sin huecos).
2. **Mantener 4 columnas pero hacer que la 5ª tarjeta ocupe el ancho completo**
   de la fila (`col-span-full` o similar) en vez de quedar como una tarjeta más
   estrecha aislada — por ejemplo, si `AuxiliaryLinesTotalCard` es el KPI de
   menor prioridad relativa, moverla a una posición de ancho completo con un
   layout ligeramente distinto (p.ej. franja horizontal con 2-3 métricas en
   línea) en vez de una tarjeta cuadrada más.

## Criterios de aceptación

- [ ] En viewport `2xl` (≥1536px), las 5 tarjetas de KPI no dejan una fila con
      huecos vacíos visibles.
- [ ] El comportamiento en mobile (`grid-cols-1`) no cambia.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir /admin/home en un viewport ≥1536px y confirmar que la fila de
# KPIs se ve equilibrada, sin huecos evidentes.
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
