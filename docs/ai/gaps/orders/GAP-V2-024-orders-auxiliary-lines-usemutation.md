---
id: GAP-V2-024
title: useOrderAuxiliaryLines debe usar useMutation e invalidar el detalle del pedido
module: orders
category: code-quality
priority: P1
risk: medium
size: S
status: ready
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderAuxiliaryLines.ts
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-024 — useOrderAuxiliaryLines debe usar useMutation e invalidar el detalle del pedido

## Problema

`src/hooks/orders/useOrderAuxiliaryLines.ts` implementa `update`, `delete` y
`create` de líneas auxiliares con promesas manuales y actualiza el detalle con
`onOrderUpdate({ ...order, auxiliaryLines: ... })`.

Este patrón duplica estado del backend en el cliente y evita el flujo estándar de
TanStack Query para mutaciones, retries e invalidación.

## Objetivo

Las líneas auxiliares de pedido usan `useMutation` para escrituras y refrescan el
detalle completo mediante invalidación. La API pública `auxiliaryLineActions` se
mantiene.

## Contexto

Este GAP es una división de `GAP-V2-001` y depende de `GAP-V2-002`. Es un corte
independiente de detalles planificados e incidencias.

## Solución propuesta

- Importar `useMutation` y `useQueryClient` en `useOrderAuxiliaryLines`.
- Crear mutaciones para `updateOrderAuxiliaryLine`, `deleteOrderAuxiliaryLine` y
  `createOrderAuxiliaryLine`.
- Exponer wrappers `mutateAsync` con las mismas firmas actuales.
- Invalidar `orderKeys.detail(tenantId, order?.id)` en `onSuccess`.
- Mantener `auxiliaryLines` como derivado memoizado desde `order`.
- Eliminar `onOrderUpdate` del sub-hook y de su llamada en `useOrder.ts`.

## Criterios de aceptación

- [ ] Las tres operaciones de `auxiliaryLineActions` usan `useMutation`.
- [ ] No queda ningún merge local de `auxiliaryLines` vía `onOrderUpdate`.
- [ ] `auxiliaryLineActions.update/delete/create` mantiene nombres y parámetros.
- [ ] `auxiliaryLines` sigue derivándose de `order.auxiliaryLines`.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un pedido, crear, editar y eliminar una línea auxiliar.
# Confirmar que la tabla y los totales se refrescan tras la mutación.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001, GAP-V2-002
