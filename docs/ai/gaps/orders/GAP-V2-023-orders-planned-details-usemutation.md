---
id: GAP-V2-023
title: useOrderPlannedDetails debe usar useMutation e invalidar el detalle del pedido
module: orders
category: code-quality
priority: P1
risk: medium
size: M
status: ready
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderPlannedDetails.ts
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-023 — useOrderPlannedDetails debe usar useMutation e invalidar el detalle del pedido

## Problema

`src/hooks/orders/useOrderPlannedDetails.ts` implementa `update`, `delete` y
`create` de detalles planificados con `.then()/.catch()` manual. Tras cada operación
construye arrays locales con `normalizePlannedProductDetail(...)` y llama a
`onOrderUpdate({ ...order, plannedProductDetails: ... })`.

Ese merge local puede divergir del backend si el servidor normaliza impuestos,
productos, cantidades, importes o campos derivados. Además, deja este sub-hook fuera
del patrón TanStack Query que ya usa `useOrderAttachments.ts`.

## Objetivo

Las operaciones de escritura de detalles planificados usan `useMutation` y refrescan
el detalle completo del pedido mediante invalidación. La API pública
`plannedProductDetailActions.update/delete/create` se mantiene.

## Contexto

Este GAP es una división de `GAP-V2-001`. Depende de `GAP-V2-002` porque necesita
`orderKeys.detail(tenantId, orderId)` para invalidar el detalle. Las funciones de
normalización y `plannedProductDetails` derivado pueden seguir existiendo para
presentar datos al componente, pero no deben usarse para escribir cache manual tras
mutaciones.

## Solución propuesta

- Importar `useMutation` y `useQueryClient` en `useOrderPlannedDetails`.
- Crear mutaciones para `updateOrderPlannedProductDetail`,
  `deleteOrderPlannedProductDetail` y `createOrderPlannedProductDetail`.
- Usar wrappers `mutateAsync` para mantener las firmas actuales de
  `plannedProductDetailActions`.
- En `onSuccess`, invalidar el detalle con `orderKeys.detail(tenantId, order?.id)`.
- En `onError`, conservar la integración con `onError?.(err)` y la propagación de
  errores.
- Eliminar `onOrderUpdate` de los parámetros de este sub-hook y de la llamada en
  `useOrder.ts`.
- Mantener `normalizePlannedProductDetail` solo para el valor derivado
  `plannedProductDetails`.

## Criterios de aceptación

- [ ] `update`, `delete` y `create` usan `useMutation`.
- [ ] Ninguna operación de escritura hace `onOrderUpdate({ ...order, plannedProductDetails: ... })`.
- [ ] `plannedProductDetailActions` mantiene los mismos nombres y parámetros públicos.
- [ ] `plannedProductDetails` sigue devolviendo datos normalizados para la UI.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un pedido, crear, editar y eliminar una línea planificada.
# Confirmar que producto, IVA, cajas y cantidad se refrescan correctamente.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001, GAP-V2-002, GAP-V2-012
