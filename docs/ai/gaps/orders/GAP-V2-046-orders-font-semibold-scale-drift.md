---
id: GAP-V2-046
title: Normalizar recurrencia de font-semibold fuera de la escala documentada (producción, palets, líneas auxiliares/previsión)
module: orders
category: ux-ui
priority: P3
risk: low
size: S
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-046 — Normalizar recurrencia de font-semibold fuera de la escala documentada (producción, palets, líneas auxiliares/previsión)

## Problema

`design-context.md` § Typography documenta una escala cerrada de pesos donde `font-semibold`
no aparece en ningún punto — solo variantes de `font-medium`. `PL-024` (project-learnings.md)
ya identificó y GAP-096 (legacy) ya corrigió 5 archivos con esta misma recurrencia
(`OrderSummaryMobile.jsx`, `OrderDetails/index.tsx`, `OrderProductDetails/index.js`,
`OrderCostAnalysis.jsx`, `OrderLabels/index.js`). Esta pasada de auditoría, ampliada a
listado/detalle/edición, encuentra la MISMA recurrencia en un conjunto de archivos que no
estaba cubierto por esa corrección:

**Nota de `gap-normalizer` (2026-07-03):** el hallazgo original también incluía
`OrdersList/index.tsx:202` (título de página desktop, `text-lg font-semibold sm:text-xl`).
Se retira de este GAP por duplicar exactamente el mismo archivo/línea que
GAP-V2-048, que además cubre el caso de forma más completa (unifica también el
`font-normal` de la variante mobile, no solo el `font-semibold` de desktop).
Ver GAP-V2-048 para ese caso.

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

- `OrderProduction/index.tsx` → sustituir los 6 usos de `font-semibold` por `font-medium`,
  manteniendo `text-sm`.
- `OrderPalletCard/index.tsx` y `SearchPalletCard/index.tsx` → `text-base font-medium` en el
  footer de cajas/peso disponible.
- `OrderAuxiliaryLines/index.tsx` y `OrderPlannedProductDetails/index.tsx` → fila de totales
  a `font-medium`, igualando el tratamiento ya usado en `OrderProduction/index.tsx:359`.

## Criterios de aceptación

- [ ] `grep -rn "font-semibold" src/components/Admin/OrdersManager/Order/OrderProduction src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletCard src/components/Admin/OrdersManager/Order/OrderPallets/SearchPalletCard src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails` no devuelve resultados.
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

### Resultado: ✅ APROBADO

### Checklist técnico

- [x] `grep -rn "font-semibold"` sobre los 5 directorios objetivo no devuelve resultados.
- [x] Las filas de totales de `OrderProduction` (línea 361), `OrderAuxiliaryLines` (líneas
      730-736) y `OrderPlannedProductDetails` (líneas 881-885) usan el mismo peso
      (`font-medium`).
- [x] Ningún `text-*` fue tocado — el diff solo cambia `font-semibold` → `font-medium` en
      cada línea.
- [x] Sin fetch directo / hardcode de tenant / archivos `.js` nuevos — no aplica a este GAP.

### Revisión UX — Light

- [x] Cambio autoexplicativo, sin nueva decisión de usuario.
- [x] Consistente con la UI circundante — iguala el peso ya usado en piezas hermanas.
- [x] No interactivo — N/A hover/focus/active.
- [x] Sin cambios de texto.

Verdict: ✅ APROBADO.

### Nota

El diff de `OrderProduction/index.tsx` incluye también la línea `'use client';` al inicio del
archivo. No forma parte del alcance de este GAP — pertenece a GAP-V2-031 (ya `status: done`),
que toca el mismo archivo y coincide en el mismo working tree sin commitear. No se penaliza
aquí.

### PL candidate

Ninguno — el hallazgo ya está cubierto por `PL-024`.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-096 (legacy, precedente directo — PL-024), GAP-V2-047 (misma
  familia de hallazgo, ámbito `OrderCustomerHistory`), GAP-V2-048 (título de `OrdersList` —
  el caso `OrdersList/index.tsx:202` se fusionó ahí durante la normalización, ver nota en
  Problema)
