---
id: GAP-V2-022
title: useOrderIncidents debe usar useMutation e invalidar el detalle del pedido
module: orders
category: code-quality
priority: P1
risk: medium
size: S
status: done
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderIncidents.ts
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-022 — useOrderIncidents debe usar useMutation e invalidar el detalle del pedido

## Problema

`src/hooks/orders/useOrderIncidents.ts` implementa `openOrderIncident`,
`resolveOrderIncident` y `deleteOrderIncident` con promesas manuales
`.then()/.catch()`. Tras cada escritura remota fusiona datos localmente con
`onOrderUpdate({ ...order, ... })`, lo que sobrescribe el cache del detalle desde
el cliente en vez de refrescar el estado autoritativo del backend.

El mismo módulo ya tiene el patrón correcto en `useOrderAttachments.ts`: mutaciones
con `useMutation`, `mutateAsync`, `onSuccess` invalidando queries y `onError`
centralizado.

## Objetivo

Las mutaciones de incidencias de pedido usan TanStack Query y dejan de escribir el
cache manualmente. La API pública expuesta por `useOrder.ts` se mantiene:
`openOrderIncident(description)`, `resolveOrderIncident(resolutionType,
resolutionNotes)` y `deleteOrderIncident()`.

## Contexto

Este GAP es una división de `GAP-V2-001`. Depende de `GAP-V2-002`, que ya creó
`orderKeys.detail(tenantId, orderId)` para invalidar el detalle de pedido con una
query key estable y tenant-aware.

`updateOrderCache` puede seguir existiendo en `useOrder.ts` para edición general,
estado y temperatura; este GAP solo elimina el merge manual dentro del sub-hook de
incidencias.

## Solución propuesta

- Importar `useMutation` y `useQueryClient` en `useOrderIncidents`.
- Obtener `tenantId` con `getCurrentTenant()` o recibirlo desde `useOrder.ts`,
  siguiendo el patrón ya existente del módulo.
- Crear una key de detalle con `orderKeys.detail(tenantId, order?.id)`.
- Convertir las tres operaciones a mutaciones con `mutationFn`.
- Exponer funciones wrapper que llamen a `mutation.mutateAsync(...)` para conservar
  las firmas y la propagación de errores.
- En `onSuccess`, invalidar `queryClient.invalidateQueries({ queryKey:
orderKeys.detail(tenantId, orderId) })`.
- En `onError`, llamar a `onError?.(err)` y mostrar/propagar el error siguiendo el
  patrón de notificación existente si aplica.
- Actualizar `useOrder.ts` para dejar de pasar `onOrderUpdate` a
  `useOrderIncidents`.

## Criterios de aceptación

- [ ] `useOrderIncidents.ts` usa `useMutation` para abrir, resolver y borrar incidencias.
- [ ] Las tres operaciones invalidan la query de detalle del pedido en `onSuccess`.
- [ ] `useOrderIncidents.ts` ya no llama a `onOrderUpdate` ni hace merge local del objeto `order`.
- [ ] `useOrder.ts` sigue exponiendo los mismos nombres públicos de funciones.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un pedido, crear una incidencia, resolverla y eliminarla.
# Confirmar que la UI se actualiza tras el refetch del detalle.
```

## Notas de implementación

- `useOrderIncidents` ahora usa `useMutation` para abrir, resolver y borrar incidencias.
- Cada mutación invalida `orderKeys.detail(tenantId, orderId)` en `onSuccess`.
- Se elimina `onOrderUpdate` del sub-hook y de la llamada desde `useOrder.ts`.
- Las funciones públicas siguen siendo `openOrderIncident`, `resolveOrderIncident` y
  `deleteOrderIncident`, con `mutateAsync` para conservar promesas y propagación de errores.
- No se añaden toasts en el hook porque `OrderIncidentPanel` ya usa `notify.promise`.

## Resultado

Implementación terminada. Validaciones: `npm run type-check` OK, `npm run lint`
OK con warnings legacy preexistentes, `npm run build` OK.

Comprobación extra: `npm run test:run -- src/__tests__/hooks/useOrder.test.js`
ejecuta 16 tests y todos pasan, pero Vitest devuelve código 1 por una promesa no
manejada en una expectativa de `exportDocument` no relacionada con incidencias.

## Resultado de auditoría

Veredicto: `done`.

Revisión limpia sobre `src/hooks/orders/useOrderIncidents.ts` y
`src/hooks/useOrder.ts`.

- `useOrderIncidents.ts` usa `useMutation` para abrir, resolver y borrar incidencias.
- Las tres mutaciones invalidan `orderKeys.detail(tenantId, orderId)` en `onSuccess`.
- Ya no se pasa ni se invoca `onOrderUpdate` desde el sub-hook de incidencias.
- Se elimina el merge local del objeto `order` para incidencias.
- `useOrder.ts` mantiene la API pública `openOrderIncident(description)`,
  `resolveOrderIncident(resolutionType, resolutionNotes)` y `deleteOrderIncident()`.
- El hook no añade toasts; la notificación sigue delegada en `OrderIncidentPanel`
  mediante `notify.promise`.

Validaciones reportadas por implementación: `npm run type-check` OK,
`npm run lint` OK con warnings legacy preexistentes y `npm run build` OK.

Status final: `done`.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001, GAP-V2-002
