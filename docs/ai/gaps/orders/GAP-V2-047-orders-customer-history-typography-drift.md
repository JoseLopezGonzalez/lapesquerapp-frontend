---
id: GAP-V2-047
title: Unificar escala tipográfica de OrderCustomerHistory (font-bold/font-semibold y drift mobile↔desktop)
module: orders
category: ux-ui
priority: P2
risk: low
size: M
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/GeneralMetricsGrid.jsx
  - src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/ProductHistoryMobileCard.jsx
  - src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/ProductHistoryAccordionItem.jsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-047 — Unificar escala tipográfica de OrderCustomerHistory (font-bold/font-semibold y drift mobile↔desktop)

## Problema

La familia de componentes de `OrderCustomerHistory` (histórico de pedidos de cliente,
dentro del detalle de pedido) concentra la recurrencia más densa de desviación de la escala
tipográfica documentada (`design-context.md` § Typography, `PL-024`) encontrada en esta
pasada — con el agravante de que la inconsistencia ocurre **dentro del mismo componente**,
entre su propia variante mobile y desktop, no solo entre archivos distintos:

- `GeneralMetricsGrid.jsx:17-18` — el valor de cada métrica usa **`font-bold`** en mobile
  (`text-base font-bold`) y **`font-semibold`** en desktop (`text-xl font-semibold` /
  `text-base font-semibold` para el último ítem). Ni `font-bold` ni `font-semibold` existen
  en la escala documentada. Además la etiqueta de la métrica (`labelClass`, línea 14-16) usa
  `font-medium` en mobile pero **ningún peso** en desktop para el mismo texto ("Total
  Pedidos", "Valor Total"...) — la misma etiqueta cambia de énfasis solo por el viewport.
- `ProductHistoryMobileCard.jsx:44,81,85,91,97,107,141` — título de producto
  (`text-lg font-semibold`) y valores de métricas (`text-base font-semibold`) — 7 usos.
- `ProductHistoryAccordionItem.jsx:45,53,58,238,256` — la variable `titleClass` alterna
  explícitamente `'font-semibold text-lg'` (mobile) vs `'font-medium text-base'` (desktop)
  para el **mismo** nombre de producto; `metricsValueClass` alterna
  `'font-semibold text-base'` (mobile) vs `'font-medium text-sm'` (desktop) para el mismo
  dato. Es decir: el propio código documenta la intención de dar distinto peso a mobile y
  desktop para el mismo elemento, sin que exista ninguna razón de escala que lo justifique
  (design-context.md no define una sub-escala mobile con pesos más pesados).

## Objetivo

`OrderCustomerHistory` (mobile y desktop) usa `font-medium` de forma exclusiva para todo
texto de énfasis, y el mismo dato semántico (título de producto, valor de métrica, etiqueta
de métrica) recibe el mismo peso tipográfico en ambas variantes — solo el tamaño (`text-*`)
puede variar entre mobile/desktop cuando esté justificado por densidad de espacio, nunca el
peso.

## Contexto

Extiende `PL-024`/GAP-096 a un sub-árbol (`OrderCustomerHistory`) fuera del alcance de esa
corrección. A diferencia de GAP-V2-046 (drift entre archivos), aquí el propio componente
codifica intencionalmente dos pesos distintos para el mismo dato vía la misma variable
(`titleClass`, `metricsValueClass`, `valueClass`), lo que lo hace un GAP más profundo y
aislado — se agrupa aparte para no diluirlo en el batch general de GAP-V2-046.

## Solución propuesta

- `GeneralMetricsGrid.jsx`: `valueClass`/`lastValueClass` → `font-medium` en ambas variantes
  (mantener el `text-*` size actual: `text-base` mobile, `text-xl`/`text-base` desktop).
  `labelClass` → aplicar `text-xs text-muted-foreground` sin variación de peso entre mobile
  y desktop (o `font-medium` en ambas si se decide mantener el énfasis).
- `ProductHistoryMobileCard.jsx`: sustituir los 7 usos de `font-semibold` por `font-medium`.
- `ProductHistoryAccordionItem.jsx`: unificar `titleClass` y `metricsValueClass` para que
  mobile y desktop compartan el mismo peso (`font-medium`), conservando la diferencia de
  tamaño (`text-lg`/`text-base` mobile vs `text-base`/`text-sm` desktop) si se considera
  deliberada por densidad.

## Criterios de aceptación

- [ ] `grep -rn "font-semibold\|font-bold" src/components/Admin/OrdersManager/Order/OrderCustomerHistory` no devuelve resultados.
- [ ] El nombre de producto, el valor de cada métrica y la etiqueta de cada métrica reciben
      el mismo peso tipográfico en la variante mobile y en la variante desktop del mismo
      componente.
- [ ] No se modifica ninguna lógica de datos, solo clases Tailwind de tipografía.

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: abrir el tab "Histórico" del detalle de pedido en mobile y desktop, comparar
# GeneralMetricsGrid, ProductHistoryMobileCard/AccordionItem — el peso visual debe ser
# consistente entre ambos viewports para el mismo dato.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-096 (legacy, precedente — PL-024), GAP-V2-046 (mismo hallazgo base,
  otras superficies del módulo)
