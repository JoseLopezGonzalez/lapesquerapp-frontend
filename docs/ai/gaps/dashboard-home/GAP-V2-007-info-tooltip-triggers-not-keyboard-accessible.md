---
id: GAP-V2-007
title: Triggers de tooltip "Info" inconsistentes — algunos son `<span>` no accesibles por teclado, otros `<button>` correctos
module: dashboard-home
category: a11y-responsive
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/CurrentStockCard/index.js
  - src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx
  - src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-007 — Triggers de tooltip "Info" no accesibles por teclado (inconsistente con otros widgets del mismo módulo)

## Problema

Varios widgets de KPI muestran un icono `Info` dentro de un `TooltipTrigger asChild`
para revelar detalles adicionales (desglose de coste, comparativa año anterior,
etc.). El elemento que envuelve el icono no es consistente entre widgets:

- `src/components/Admin/Dashboard/CurrentStockCard/index.js:58-61` —
  `<span className="inline-flex cursor-pointer">` envolviendo `<Info />`. Un
  `<span>` no es focuseable por teclado (`Tab`) ni tiene rol interactivo para
  lectores de pantalla — solo funciona con hover de ratón.
- `src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx:110-114` — mismo
  patrón: `<span className="mt-1.5 shrink-0 cursor-pointer">`.
- `src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx:81-85` — mismo
  patrón: `<span className="mt-1.5 shrink-0 cursor-pointer">`.

En cambio, `OrdersProfitabilitySummaryCard`
(`src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js:73-79`) y
`WorkingEmployeesCard`
(`src/components/Admin/Dashboard/WorkingEmployeesCard/index.js:227-234`) resuelven
el mismo caso correctamente con:

```jsx
<button type="button" className="..." aria-label="...">
  <Info className="h-4 w-4" />
</button>
```

Un usuario que navegue el dashboard solo con teclado puede activar el tooltip de
`OrdersProfitabilitySummaryCard`/`WorkingEmployeesCard` pero no el de
`CurrentStockCard`, `TotalAmountSoldCard` ni `AuxiliaryLinesTotalCard` — la misma
interacción (ver desglose de un KPI) es accesible en unos widgets y no en otros
dentro de la misma pantalla.

## Objetivo

Todos los triggers de tooltip "Info" del dashboard usan `<button type="button">`
con `aria-label` descriptivo, focuseables y activables por teclado, siguiendo el
patrón ya correcto de `OrdersProfitabilitySummaryCard` y `WorkingEmployeesCard`.

## Contexto

Ninguna dependencia. Es un fix mecánico y de bajo riesgo: sustituir el elemento
contenedor sin tocar el contenido del `TooltipContent`.

## Solución propuesta

En los 3 archivos de `target_files`, sustituir:

```jsx
<span className="... cursor-pointer">
  <Info className="..." />
</span>
```

por:

```jsx
<button type="button" className="... transition-colors" aria-label="Ver detalle">
  <Info className="..." />
</button>
```

Ajustando el texto de `aria-label` al contenido específico de cada tooltip (p.ej.
"Ver desglose de coste valorado" en `CurrentStockCard`, "Ver desglose de importe"
en `TotalAmountSoldCard`/`AuxiliaryLinesTotalCard`). Mantener las clases de
Tailwind existentes para no alterar el aspecto visual.

## Criterios de aceptación

- [ ] Los 3 triggers de tooltip son `<button type="button">` con `aria-label`.
- [ ] Se pueden activar con `Tab` + `Enter`/`Space` (verificación manual con
      teclado, sin ratón).
- [ ] El aspecto visual no cambia respecto al `<span>` actual.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en /admin/home, navegar con Tab hasta cada uno de los 3 KPIs y
# confirmar que el icono Info recibe foco visible y el tooltip se puede abrir
# con Enter/Space sin usar el ratón.
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
