---
id: GAP-V2-046
title: Normalizar recurrencia de font-semibold fuera de la escala documentada (listado, palets, líneas auxiliares/previsión)
module: orders
category: ux-ui
priority: P3
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/OrdersList/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-046 — Normalizar recurrencia de font-semibold fuera de la escala documentada (listado, palets, líneas auxiliares/previsión)

## Problema

`design-context.md` § Typography documenta una escala cerrada de pesos donde `font-semibold`
no aparece en ningún punto — solo variantes de `font-medium`. `PL-024` (project-learnings.md)
ya identificó y GAP-096 (legacy) ya corrigió 5 archivos con esta misma recurrencia
(`OrderSummaryMobile.jsx`, `OrderDetails/index.tsx`, `OrderProductDetails/index.js`,
`OrderCostAnalysis.jsx`, `OrderLabels/index.js`). Esta pasada de auditoría, ampliada a
listado/detalle/edición, encuentra la MISMA recurrencia en un conjunto de archivos que no
estaba cubierto por esa corrección:

- `OrdersList/index.tsx:202` — título de página desktop: `text-lg font-semibold sm:text-xl`.
- `OrderProduction/index.tsx:138,154,157,171,174,187` — valores de la card mobile de
  producción (`text-sm font-semibold`), mientras la tabla desktop del mismo componente usa
  peso normal/`font-medium` para las celdas equivalentes.
- `OrderPallets/OrderPalletCard/index.tsx:331,336` y
  `OrderPallets/SearchPalletCard/index.tsx:210,215` — cifras de cajas/peso disponible en el
  footer de la card de palet (`text-base font-semibold`), mientras el resto de la misma card
  usa `text-sm font-medium` para coste/almacén.
- `OrderAuxiliaryLines/index.tsx:690,693,696` — fila de totales de la tabla desktop
  (`font-semibold`).
- `OrderPlannedProductDetails/index.tsx:865,866,869` — fila de totales de la tabla desktop
  (`font-semibold`).

Además, la fila de totales de `OrderProduction` (mismo patrón de tabla, mismo tab-family)
usa `className="font-medium"` para el total (línea 359), lo que crea una tercera
inconsistencia: dos tabs hermanas (`OrderAuxiliaryLines`, `OrderPlannedProductDetails`) usan
`font-semibold` en su fila de totales y una tercera (`OrderProduction`) usa `font-medium`
para el mismo rol semántico ("fila de total de una tabla dentro de un tab").

## Objetivo

Ningún archivo de estas superficies usa `font-semibold` para texto operativo. El énfasis de
valores primarios y filas de totales se logra con la escala documentada (`font-medium` en el
tamaño correspondiente), y las tres filas de totales de tablas hermanas (`OrderProduction`,
`OrderAuxiliaryLines`, `OrderPlannedProductDetails`) usan el mismo tratamiento entre sí.

## Contexto

Recurrencia directa de `PL-024` (project-learnings.md) en archivos fuera del alcance
original de GAP-096. No reabre GAP-096 ni sus criterios ya verificados.

## Solución propuesta

- `OrdersList/index.tsx:202` → `font-medium` (mantener `text-lg sm:text-xl` o alinear con
  GAP-V2-048 si se implementa primero).
- `OrderProduction/index.tsx` → sustituir los 6 usos de `font-semibold` por `font-medium`,
  manteniendo `text-sm`.
- `OrderPalletCard/index.tsx` y `SearchPalletCard/index.tsx` → `text-base font-medium` en el
  footer de cajas/peso disponible.
- `OrderAuxiliaryLines/index.tsx` y `OrderPlannedProductDetails/index.tsx` → fila de totales
  a `font-medium`, igualando el tratamiento ya usado en `OrderProduction/index.tsx:359`.

## Criterios de aceptación

- [ ] `grep -rn "font-semibold" src/components/Admin/OrdersManager/OrdersList src/components/Admin/OrdersManager/Order/OrderProduction src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails` no devuelve resultados.
- [ ] Las filas de totales de `OrderProduction`, `OrderAuxiliaryLines` y
      `OrderPlannedProductDetails` usan el mismo peso (`font-medium`).
- [ ] Ningún cambio visual afecta al tamaño (`text-*`) declarado — solo el peso.

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: comparar visualmente listado, tab Producción, tarjetas de palet, Otros artículos
# y Previsión de productos antes/después — el énfasis de valores debe verse igual de claro
# con font-medium.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-096 (legacy, precedente directo — PL-024), GAP-V2-047 (misma
  familia de hallazgo, ámbito `OrderCustomerHistory`), GAP-V2-048 (título de `OrdersList`)
