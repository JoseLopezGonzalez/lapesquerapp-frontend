---
id: GAP-V2-024
title: useOrderAuxiliaryLines debe usar useMutation e invalidar el detalle del pedido
module: orders
category: code-quality
priority: P1
risk: medium
size: S
status: done
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderAuxiliaryLines.ts
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-03
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

- [x] Las tres operaciones de `auxiliaryLineActions` usan `useMutation`.
- [x] No queda ningún merge local de `auxiliaryLines` vía `onOrderUpdate`.
- [x] `auxiliaryLineActions.update/delete/create` mantiene nombres y parámetros.
- [x] `auxiliaryLines` sigue derivándose de `order.auxiliaryLines`.
- [x] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un pedido, crear, editar y eliminar una línea auxiliar.
# Confirmar que la tabla y los totales se refrescan tras la mutación.
```

## Notas de implementación

`src/hooks/orders/useOrderAuxiliaryLines.ts`: se sustituyeron las tres promesas
manuales por `useMutation` (`updateLine`, `deleteLine`, `createLine`), cada una
invalidando `orderKeys.detail(tenantId, order?.id)` en `onSuccess` mediante un
`invalidateOrderDetail` compartido (mismo patrón que `useOrderIncidents.ts`). Se
eliminó el parámetro `onOrderUpdate` de `UseOrderAuxiliaryLinesParams` y de la
firma del hook. `auxiliaryLines` sigue derivándose de `order?.auxiliaryLines` vía
`useMemo`, sin tocar su lógica.

`src/hooks/useOrder.ts`: se quitó `onOrderUpdate: updateOrderCache` de la llamada
a `useOrderAuxiliaryLines`; sin más cambios en el archivo.

## Resultado

Implementado y validado localmente: `npm run type-check` (0 errores), `npm run
lint` (0 errores, solo warnings preexistentes no relacionados) y `npm run build`
(compila correctamente). Commit `19cd8f2` en `claude/orders-deep-audit-lv9qnf`
(rama recreada desde `origin/main` porque el PR anterior de esa rama ya estaba
mergeado).

## Resultado de auditoría

**Veredicto: DONE** (gap-auditor, contexto limpio, 2026-07-03).

Los 5 criterios de aceptación se verificaron contra el código real y el
consumidor `OrderAuxiliaryLines/index.tsx`: firmas públicas intactas, sin merge
local restante vía `onOrderUpdate`, queryKey de invalidación idéntica a la del
`useQuery` principal de `useOrder.ts`, manejo de errores equivalente al previo.

Observaciones no bloqueantes registradas por el auditor:

- El toast de éxito y el cierre de `editIndex` en `OrderAuxiliaryLines/index.tsx`
  ahora esperan al refetch del detalle (porque `onSuccess` se await antes de que
  `mutateAsync` resuelva) — latencia percibida ligeramente mayor pero UI con
  datos garantizados frescos. Pendiente de probar manualmente en red lenta.
- No se añadió test dedicado para `useOrderAuxiliaryLines` — consistente con el
  precedente de GAP-V2-023 (`useOrderPlannedDetails`), que tampoco añadió test
  de mutación. Queda como deuda de test coverage, no bloqueante.
- Sin PL candidate: el patrón ya está documentado en `.claude/rules/hooks.md` y
  reforzado por el precedente de `useOrderPlannedDetails.ts`.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001, GAP-V2-002
