---
id: GAP-V2-001
title: Sub-hooks de mutación de orders no usan TanStack Query (promesas manuales + caché ad-hoc)
module: orders
category: code-quality
priority: P1
risk: medium
size: L
status: rejected
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderIncidents.ts
  - src/hooks/orders/useOrderPlannedDetails.ts
  - src/hooks/orders/useOrderAuxiliaryLines.ts
  - src/hooks/orders/useOrderPallets.ts
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-001 — Sub-hooks de mutación de orders no usan TanStack Query

## Problema

Cuatro de los sub-hooks que `useOrder.ts` orquesta implementan sus mutaciones con
promesas manuales (`.then()/.catch()`) en vez de `useMutation` de TanStack Query, y
en lugar de invalidar queries actualizan el caché a mano fusionando el objeto `order`
completo vía un callback `onOrderUpdate` que se pasa por props entre hooks:

- `src/hooks/orders/useOrderIncidents.ts:28-75` — `openOrderIncident`,
  `resolveOrderIncident`, `deleteOrderIncident` son funciones async con
  `.then()/.catch()` manuales; ninguna usa `useMutation`.
- `src/hooks/orders/useOrderPlannedDetails.ts:82-153` — `updatePlannedProductDetail`,
  `deletePlannedProductDetail`, `createPlannedProductDetail`, mismo patrón.
- `src/hooks/orders/useOrderAuxiliaryLines.ts:41-89` — `updateAuxiliaryLine`,
  `deleteAuxiliaryLine`, `createAuxiliaryLine`, mismo patrón.
- `src/hooks/orders/useOrderPallets.ts:55-265` — seis handlers (`onEditingPallet`,
  `onCreatingPallet`, `onDeletePallet`, `onUnlinkPallet`, `onLinkPallets`,
  `onUnlinkAllPallets`), todos con try/catch manual y sin `useMutation`.

En los cuatro casos, tras la escritura remota el hook llama a
`onOrderUpdate({ ...order, campoModificado: ... })` (definido en
`src/hooks/useOrder.ts:116-124` como `updateOrderCache`, que hace
`queryClient.setQueryData(queryKey, updatedOrder)`), en vez de
`queryClient.invalidateQueries(...)` en un `onSuccess` de `useMutation`. Esto viola
directamente el checklist TANSTACK QUERY de `.claude/agents/code-audit-agent.md`
("Mutations invalidate relevant queries in onSuccess") y el patrón documentado en
`.claude/rules/hooks.md` ("Mutaciones — patrón de invalidación").

La inconsistencia es verificable dentro del mismo módulo: `useOrderAttachments.ts`
(`src/hooks/orders/useOrderAttachments.ts:44-132`) implementa las mismas operaciones
(upload/update/delete) correctamente con `useMutation` + `queryClient.invalidateQueries`

- `notify` en `onSuccess`/`onError`. Es el patrón de referencia ya existente en el
  propio módulo — no hay que importarlo de otro sitio.

Efectos concretos del patrón actual:

- No hay estado `isPending`/`isError` estandarizado por mutación — cada handler debe
  reinventar su propio manejo de loading/error (algunos usan `mutationError` global
  del hook padre, otros no).
- El caché se sobrescribe con un merge manual del objeto `order` completo en el
  cliente, en vez de traer el estado autoritativo del servidor tras la mutación —
  riesgo de que el cliente y el servidor diverjan si el backend aplica lógica
  adicional (cálculos derivados, validaciones) que el merge local no replica.
- Los reintentos, cancelación y deduplicación de requests que TanStack Query da
  gratis no aplican a estas mutaciones.

## Objetivo

Los cuatro sub-hooks usan `useMutation` de TanStack Query para sus operaciones de
escritura, con `onSuccess` invalidando la query de detalle del pedido (ver GAP-V2-002
para la factory de queryKey que falta) en vez de escribir el caché a mano, siguiendo
el mismo patrón ya usado en `useOrderAttachments.ts`.

## Contexto

Depende de GAP-V2-002 (falta una factory `orderKeys.detail(tenantId, orderId)` en
`queryKeys.ts` — hoy `useOrder.ts` usa un array literal `['order', orderId]`).
Sin esa factory, `invalidateQueries` no tiene una key estable y tenant-aware a la
que apuntar.

## Solución propuesta

1. Resolver GAP-V2-002 primero (factory `orderKeys` en `queryKeys.ts`).
2. En cada uno de los 4 sub-hooks, convertir los handlers en `useMutation` con:
   - `mutationFn` llamando al service existente (sin cambiar la capa de servicio).
   - `onSuccess`: `queryClient.invalidateQueries({ queryKey: orderKeys.detailPrefix(tenantId, orderId) })`.
   - `onError`: `notify.error(getErrorMessage(err))`, siguiendo `.claude/rules/api-client.md`.
3. Mantener la interfaz pública de retorno de cada hook (`plannedProductDetailActions`,
   `auxiliaryLineActions`, etc.) para no romper los componentes que los consumen —
   los nombres de las funciones expuestas no cambian, solo su implementación interna.
4. Evaluar si `onOrderUpdate`/`updateOrderCache` sigue siendo necesario tras el cambio;
   si ya no lo usa ningún hook, eliminarlo de `useOrder.ts` en el mismo GAP.

## Criterios de aceptación

- [ ] `useOrderIncidents`, `useOrderPlannedDetails`, `useOrderAuxiliaryLines`,
      `useOrderPallets` usan `useMutation` para todas sus operaciones de escritura.
- [ ] Ninguna mutación escribe el caché manualmente vía `setQueryData` con un merge
      local del objeto `order` — todas invalidan la query de detalle.
- [ ] Las firmas públicas de los 4 hooks no cambian (mismos nombres de función,
      mismos parámetros desde el punto de vista de los componentes consumidores).
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Verificación manual: editar/crear/eliminar una incidencia, un detalle
      planificado, una línea auxiliar y un palet desde la UI de un pedido y confirmar
      que la UI se actualiza igual que antes.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: abrir un pedido en /admin/orders/[id], probar crear/editar/eliminar
# una incidencia, un detalle planificado, una línea auxiliar y un palet.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

Reemplazado por sub-GAPs más pequeños para que `/implement-next` pueda ejecutar
la deuda de forma incremental y auditable:

- `GAP-V2-022`: incidencias de pedido.
- `GAP-V2-023`: detalles planificados.
- `GAP-V2-024`: líneas auxiliares.
- `GAP-V2-025`: palets vinculados al pedido.

El hallazgo original queda conservado como contexto, pero no debe implementarse
como lote único `size: L`.

## Resultado de auditoría

No aplica: GAP rechazado por división/superseded, sin cambios de producción.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-002 (factory de queryKey para el detalle del pedido, dependencia), GAP-V2-022, GAP-V2-023, GAP-V2-024, GAP-V2-025
