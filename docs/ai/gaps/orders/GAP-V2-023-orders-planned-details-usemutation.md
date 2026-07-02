---
id: GAP-V2-023
title: useOrderPlannedDetails debe usar useMutation e invalidar el detalle del pedido
module: orders
category: code-quality
priority: P1
risk: medium
size: M
status: done
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderPlannedDetails.ts
  - src/hooks/useOrder.ts
  - src/__tests__/hooks/useOrderPlannedDetails.test.ts
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

- `useOrderPlannedDetails` ahora crea mutaciones TanStack Query para `update`,
  `delete` y `create`, usando `mutateAsync` para mantener la API pública de
  `plannedProductDetailActions`.
- Las mutaciones invalidan `orderKeys.detail(tenantId, order?.id)` en `onSuccess`
  y conservan la integración `onError?.(err)`; `mutateAsync` mantiene la
  propagación del error al llamador.
- Se elimina `onOrderUpdate` del contrato del sub-hook y de la llamada desde
  `useOrder.ts`.
- `normalizePlannedProductDetail` queda limitado al valor derivado
  `plannedProductDetails`.
- Desviación acotada: se actualizó el test existente
  `src/__tests__/hooks/useOrderPlannedDetails.test.ts` para envolver el hook con
  `QueryClientProvider` tras introducir `useQueryClient`.

## Resultado

Implementado. Las escrituras de detalles planificados ya no hacen merge local de
`plannedProductDetails`; refrescan el detalle completo del pedido mediante
invalidación de TanStack Query.

Validaciones ejecutadas:

```text
npx vitest run src/__tests__/hooks/useOrderPlannedDetails.test.ts
npm run type-check
npm run lint
npm run build
```

`lint` pasa con 0 errores y mantiene warnings globales preexistentes. Vitest muestra
un warning preexistente por clave duplicada `type-check` en `package.json`, no
relacionado con este GAP.

## Resultado de auditoría

Auditoría con contexto limpio: `done`.

Primer pase: `needs_fix` porque el test unitario del hook no tenía
`QueryClientProvider` tras introducir `useQueryClient`. Se corrigió el test y se
reauditó.

Veredicto final: criterios cumplidos, sin riesgos bloqueantes.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001, GAP-V2-002, GAP-V2-012
