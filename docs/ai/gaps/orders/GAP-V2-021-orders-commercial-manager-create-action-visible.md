---
id: GAP-V2-021
title: El manager comercial readOnly mantiene visible la creación de pedidos
module: orders
category: architecture-refactor
priority: P1
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Comercial/CRM/ComercialOrdersManager.tsx
  - src/components/Admin/OrdersManager/OrdersList/index.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-021 — El manager comercial readOnly mantiene visible la creación de pedidos

## Problema

`src/components/Comercial/CRM/ComercialOrdersManager.tsx:181-198` pasa `readOnly` a `OrdersList`, pero también entrega `onClickAddNewOrder`. `OrdersList` solo usa `readOnly` para ocultar el botón de vista de producción, no para ocultar crear:

- `src/components/Admin/OrdersManager/OrdersList/index.tsx:181-189` muestra el botón mobile "Crear nuevo pedido" siempre.
- `src/components/Admin/OrdersManager/OrdersList/index.tsx:217-226` muestra el botón desktop "Crear nuevo pedido" siempre.
- `src/components/Admin/OrdersManager/OrdersList/index.tsx:374-377` muestra el CTA vacío "Crear nuevo pedido" siempre que no hay búsqueda y la pestaña es `all`.

Al pulsarlo, `ComercialOrdersManager` activa `onCreatingNewOrder` y monta `CreateOrderForm` en `src/components/Comercial/CRM/ComercialOrdersManager.tsx:233-238`. La ruta comercial queda en la práctica protegida por backend, no por anticipación de permisos en la UI.

## Objetivo

Las rutas comerciales de pedidos en modo lectura no deben mostrar acciones de creación ni estados vacíos que inviten a crear pedidos si el rol no tiene permiso.

## Contexto

`/comercial/orders/page.tsx:11-18` sí configura `hideCreateButton`, `hideEditButton`, `isSelectable: false` y `hideBulkDelete` para el EntityClient. El manager comercial custom no replica esa restricción de forma completa.

## Solución propuesta

Hacer que `OrdersList` respete `readOnly` para todos los puntos de creación, o introducir una prop más explícita (`canCreateOrder`) y pasarla como `false` desde `ComercialOrdersManager`. El empty state en modo lectura debe usar texto neutral y sin CTA.

## Criterios de aceptación

- [ ] En `/comercial/orders-manager`, no aparece el botón de crear en desktop.
- [ ] En `/comercial/orders-manager`, no aparece el botón de crear en mobile.
- [ ] El empty state comercial no muestra CTA de creación.
- [ ] `CreateOrderForm` no puede montarse desde el flujo comercial readOnly.
- [ ] `/admin/orders-manager` conserva su flujo de creación actual.

## Plan de validación

```text
npm run lint
npm run type-check
Manual: revisar /comercial/orders-manager desktop/mobile con y sin pedidos.
Manual: revisar /admin/orders-manager desktop/mobile y confirmar que crear sigue disponible.
```

## Notas de implementación

Pendiente.

## Resultado

Pendiente.

## Resultado de auditoría

Pendiente.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno
