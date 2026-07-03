---
id: GAP-V2-050
title: Aplicar la sub-escala documentada de CardTitle (text-lg font-medium) al tab Incidencia
module: orders
category: ux-ui
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-050 — Aplicar la sub-escala documentada de CardTitle (text-lg font-medium) al tab Incidencia

## Problema

`design-context.md` § Typography documenta una sub-escala explícita (regla GAP-084) para
`CardTitle` cuando vive dentro de una tarjeta que a su vez está dentro de un tab de un
detail view: `text-lg font-medium`, un escalón por debajo del título de página/sección. Esa
regla se aplica de forma consistente en todas las tarjetas hermanas del mismo detalle de
pedido:

- `OrderAuxiliaryLines/index.tsx:530` — `<CardTitle className="text-lg font-medium">Otros artículos</CardTitle>`
- `OrderProduction/index.tsx:270` — `<CardTitle className="text-lg font-medium">Productos del Pedido</CardTitle>`
- `OrderPallets/components/OrderPalletsToolbar.tsx:124` — `<CardTitle className="text-lg font-medium">Gestión de palets</CardTitle>`
- `OrderPlannedProductDetails/index.tsx:695` — `<CardTitle className="text-lg font-medium">Previsión de productos</CardTitle>`
- `OrderProductDetails/index.tsx:193` — `<CardTitle className="text-lg font-medium">Detalle de productos</CardTitle>`

`OrderIncident/index.tsx:301` es la única tarjeta de tab de este mismo detalle de pedido que
NO aplica el override: `<CardTitle>Incidencia</CardTitle>` sin `className`, por lo que cae al
tamaño por defecto de `CardTitle` (`text-base leading-snug font-medium`,
`src/components/ui/card.jsx:37-48`) — un escalón por debajo de sus tarjetas hermanas. El
título "Incidencia" se lee visualmente más pequeño/débil que "Otros artículos", "Productos
del Pedido", "Gestión de palets", "Previsión de productos" y "Detalle de productos", pese a
ocupar el mismo rol jerárquico dentro del mismo conjunto de tabs.

## Objetivo

`OrderIncident` usa la misma sub-escala (`text-lg font-medium`) que el resto de tarjetas de
tab del detalle de pedido, para que "Incidencia" tenga el mismo peso visual que sus tabs
hermanas.

## Contexto

Consistencia directa con la regla ya documentada y ya aplicada en 5 componentes hermanos del
mismo detalle de pedido — no introduce una regla nueva, corrige la única omisión detectada.

## Solución propuesta

`OrderIncident/index.tsx:301` — `<CardTitle>Incidencia</CardTitle>` →
`<CardTitle className="text-lg font-medium">Incidencia</CardTitle>`.

## Criterios de aceptación

- [ ] `OrderIncident/index.tsx` aplica `className="text-lg font-medium"` a su `CardTitle`,
      igual que `OrderAuxiliaryLines`, `OrderProduction`, `OrderPallets` (vía
      `OrderPalletsToolbar`), `OrderPlannedProductDetails` y `OrderProductDetails`.
- [ ] No cambia `CardDescription` ni el resto del `CardHeader`.

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: abrir el tab "Incidencia" en desktop y compararlo visualmente con el tab
# "Producción" o "Otros artículos" del mismo pedido — el título debe leerse con el mismo
# tamaño/peso.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-084 (legacy, origen de la regla de sub-escala)
