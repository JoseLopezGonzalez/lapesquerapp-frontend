---
id: GAP-V2-025
title: useOrderPallets debe usar useMutation e invalidar el detalle del pedido
module: orders
category: code-quality
priority: P1
risk: medium
size: M
status: done
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderPallets.ts
  - src/hooks/useOrder.ts
created_at: 2026-07-02
updated_at: 2026-07-03
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

- [x] Las operaciones remotas de palets usan `useMutation`.
- [x] No se escribe `order.pallets` en cache mediante `onOrderUpdate({ ...order, pallets: ... })`.
- [x] Las firmas públicas de `onEditingPallet`, `onCreatingPallet`, `onDeletePallet`,
      `onUnlinkPallet`, `onLinkPallets` y `onUnlinkAllPallets` se mantienen.
- [x] Las notificaciones existentes de palets se conservan, incluidos resultados
      parciales de operaciones masivas.
- [x] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un pedido y probar crear/editar desde flujo de palets, borrar,
# desvincular, vincular uno/muchos y desvincular todos. Confirmar que la sección
# de palets y el resumen del pedido se refrescan.
```

## Notas de implementación

`src/hooks/orders/useOrderPallets.ts`: se crearon cuatro mutaciones (`deletePalletMutation`,
`unlinkPalletMutation`, `linkPalletsMutation`, `unlinkAllPalletsMutation`) que envuelven
las llamadas remotas existentes (`deletePallet`, `unlinkPalletFromOrder`,
`linkPalletToOrder`/`linkPalletsToOrders`, `unlinkPalletsFromOrders`), cada una invalidando
`orderKeys.detail(tenantId, order?.id)` en `onSuccess` mediante un `invalidateOrderDetail`
compartido. Se eliminó el parámetro `onOrderUpdate` de `UseOrderPalletsParams` y de la firma
del hook, junto con todas las escrituras manuales de `order.pallets` en caché.
`onEditingPallet`/`onCreatingPallet` (sin llamada remota propia en este hook) perdieron su
merge local y ahora solo llaman a `reload()` para refrescar y notificar. Las notificaciones
de éxito/info/error, incluidos los resultados parciales de `onLinkPallets`/`onUnlinkAllPallets`
(`linked`, `already_linked`, `errors`, `unlinked`, etc.), se mantuvieron igual, leyendo el
resultado desde `mutateAsync` en vez de la llamada directa al service.

Decisión deliberada: `reload()` se mantuvo tras cada mutación exitosa (además de la
invalidación de TanStack Query) porque también ejecuta `resetCostAnalysis()` (limpia la
query de análisis de costes por pallet, no enlazada a `orderKeys.detail`) y sincroniza el
listado externo vía `onChange` hacia `OrdersManager/index.tsx`. Sustituirlo por completo
habría requerido tocar `useOrderCostAnalysis` y el flujo de `onChange`, fuera del alcance
declarado del GAP.

`src/hooks/useOrder.ts`: se quitó `onOrderUpdate: updateOrderCache` de la llamada a
`useOrderPallets`; sin más cambios en el archivo.

## Resultado

Implementado y validado localmente: `npm run type-check` (0 errores), `npm run lint`
(0 errores, sin warnings nuevos en `useOrderPallets.ts`) y `npm run build` (compila
correctamente). Commit `d46687c` en `claude/orders-deep-audit-lv9qnf`.

## Resultado de auditoría

**Veredicto: APROBADO CON OBSERVACIONES** (gap-auditor, contexto limpio, 2026-07-03).

Los 5 criterios de aceptación se verificaron contra el código real y ambos consumidores
(`useOrder.ts` y el hook de componente `OrderPallets/hooks/useOrderPallets.ts`): firmas
públicas intactas, sin escritura manual de `order.pallets`, notificaciones con resultados
parciales idénticas, guard clauses conservadas donde seguían siendo necesarias.

Observación no bloqueante (queda como riesgo de rendimiento, no como bug):

- Cada mutación exitosa dispara `invalidateOrderDetail()` (que por defecto refetchea la
  query activa) y además `reload()` (que hace su propio `queryRefetch()`), resultando en
  **doble petición de red** al detalle del pedido por operación de palet. No rompe nada
  funcionalmente, pero es tráfico redundante. Fix sugerido para un GAP de seguimiento:
  usar `invalidateQueries({ queryKey: orderDetailKey, refetchType: 'none' })` ya que
  `reload()` refresca inmediatamente después de todas formas. Este patrón es específico
  de este GAP (GAP-V2-022/023/024 no llaman a `reload()` tras invalidar, por lo que no
  comparten el problema).
- UX Light Review del propio auditor: refactor interno sin superficie de UI — aprobado
  sin hallazgos.
- Sin PL candidate escalado a `system-learner`: es una única ocurrencia acotada a este
  archivo, no un patrón repetido en el resto del módulo; queda documentada aquí y en
  `docs/ai/modules/orders/audit.md` §9 como riesgo no bloqueante para una futura pasada.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001, GAP-V2-002
