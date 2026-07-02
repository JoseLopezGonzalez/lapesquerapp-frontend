---
id: GAP-V2-025
title: useOrderPallets debe usar useMutation e invalidar el detalle del pedido
module: orders
category: code-quality
priority: P1
risk: medium
size: M
status: ready
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderPallets.ts
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-025 — useOrderPallets debe usar useMutation e invalidar el detalle del pedido

## Problema

`src/hooks/orders/useOrderPallets.ts` concentra seis handlers relacionados con
palets (`onEditingPallet`, `onCreatingPallet`, `onDeletePallet`, `onUnlinkPallet`,
`onLinkPallets`, `onUnlinkAllPallets`). Mezcla actualizaciones optimistas locales
con `onOrderUpdate`, llamadas manuales a `reload()` y acciones remotas con try/catch.

El resultado es más frágil que el patrón TanStack Query: algunas operaciones escriben
el cache del pedido a mano, otras dependen de `reload()`, y todas quedan fuera del
modelo estándar de `useMutation`.

## Objetivo

Las operaciones de palets vinculadas al pedido usan `useMutation` y refrescan el
detalle del pedido mediante invalidación o refetch controlado desde TanStack Query,
manteniendo los nombres públicos que consumen los componentes.

## Contexto

Este GAP es una división de `GAP-V2-001`. Es el corte más grande porque palets ya
incluye notificaciones con resultados parciales (`linked`, `already_linked`,
`errors`, `unlinked`, etc.) y porque `useOrder.ts` todavía pasa `accessToken` a
este hook. No cambiar la capa de servicios ni resolver deuda de token-as-parameter
salvo que sea estrictamente necesario para compilar; el alcance principal es
mutaciones + invalidación.

## Solución propuesta

- Importar `useMutation` y `useQueryClient` en `useOrderPallets`.
- Crear mutaciones para borrar, desvincular, vincular uno/muchos y desvincular todos
  los palets.
- Mantener `onEditingPallet` y `onCreatingPallet` como wrappers compatibles con el
  flujo actual de edición/creación local si no hay llamada remota directa en este
  hook, pero sustituir el merge local por invalidación/refetch del detalle cuando
  corresponda.
- En operaciones remotas, usar `mutateAsync` para conservar las firmas públicas:
  `onDeletePallet`, `onUnlinkPallet`, `onLinkPallets`, `onUnlinkAllPallets`.
- En `onSuccess`, invalidar `orderKeys.detail(tenantId, order?.id)` y conservar las
  notificaciones de éxito/info/error por resultados parciales.
- En `onError`, conservar los mensajes amigables con `extractErrorMessage(...)` y
  seguir propagando errores a los consumidores.
- Actualizar `useOrder.ts` solo si cambian parámetros internos del hook; los nombres
  devueltos por `useOrder` no cambian.

## Criterios de aceptación

- [ ] Las operaciones remotas de palets usan `useMutation`.
- [ ] No se escribe `order.pallets` en cache mediante `onOrderUpdate({ ...order, pallets: ... })`.
- [ ] Las firmas públicas de `onEditingPallet`, `onCreatingPallet`, `onDeletePallet`,
      `onUnlinkPallet`, `onLinkPallets` y `onUnlinkAllPallets` se mantienen.
- [ ] Las notificaciones existentes de palets se conservan, incluidos resultados
      parciales de operaciones masivas.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un pedido y probar crear/editar desde flujo de palets, borrar,
# desvincular, vincular uno/muchos y desvincular todos. Confirmar que la sección
# de palets y el resumen del pedido se refrescan.
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
