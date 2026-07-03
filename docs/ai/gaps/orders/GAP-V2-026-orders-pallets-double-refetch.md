---
id: GAP-V2-026
title: useOrderPallets dispara doble refetch del detalle del pedido tras cada mutación
module: orders
category: code-quality
priority: P3
risk: low
size: XS
status: done
dependencies:
  - GAP-V2-025
target_files:
  - src/hooks/orders/useOrderPallets.ts
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-026 — useOrderPallets dispara doble refetch del detalle del pedido tras cada mutación

## Problema

En `src/hooks/orders/useOrderPallets.ts:61-96`, las cuatro mutaciones de palets
(`deletePalletMutation`, `unlinkPalletMutation`, `linkPalletsMutation`,
`unlinkAllPalletsMutation`) invalidan `orderKeys.detail(tenantId, order?.id)` en
`onSuccess` mediante `invalidateOrderDetail()`. Como la query de detalle está
activa (montada por el `useQuery` de `useOrder.ts`), `invalidateQueries` con su
comportamiento por defecto (`refetchType: 'active'`) dispara automáticamente un
refetch en background.

Inmediatamente después, cada wrapper (`onDeletePallet`, `onUnlinkPallet`,
`onLinkPallets`, `onUnlinkAllPallets`) también llama a `await reload()`
(`src/hooks/useOrder.ts:175-184`), que ejecuta su propio `queryRefetch()` sobre
esa misma query. El resultado es **dos peticiones de red** al detalle del
pedido por cada operación de palet, en vez de una.

Hallazgo no bloqueante señalado por `gap-auditor` al verificar GAP-V2-025
(2026-07-03): no rompe nada funcionalmente, pero es tráfico redundante.

## Objetivo

Cada operación de palet (borrar, desvincular, vincular, desvincular todos)
provoca un único refetch real del detalle del pedido, conservando el reseteo
de la query de análisis de costes (`resetCostAnalysis()`) y la sincronización
externa vía `onChange` hacia `OrdersManager/index.tsx` que hoy dependen de
`reload()`.

## Contexto

`reload()` se mantuvo deliberadamente en GAP-V2-025 (no se sustituyó por
completo por `invalidateQueries`) porque hace dos cosas que la invalidación de
TanStack Query no cubre: resetea `useOrderCostAnalysis` (query no enlazada a
`orderKeys.detail`) y propaga el `order` fresco a `onChange`. Ese razonamiento
sigue siendo válido — este GAP no busca eliminar `reload()`, solo evitar que
`invalidateOrderDetail()` dispare un refetch automático que `reload()` va a
repetir de inmediato.

Este GAP es acotado a `useOrderPallets.ts`: los sub-hooks hermanos
(`useOrderIncidents.ts`, `useOrderPlannedDetails.ts`,
`useOrderAuxiliaryLines.ts`, GAP-V2-022/023/024) no llaman a `reload()` tras
invalidar, por lo que no comparten este problema.

## Solución propuesta

- En `invalidateOrderDetail` (`src/hooks/orders/useOrderPallets.ts:61-63`),
  pasar `refetchType: 'none'` a `queryClient.invalidateQueries(...)` para que
  la invalidación solo marque la query como stale (para que el próximo
  `reload()`/mount la refresque) sin disparar un refetch automático inmediato:

  ```typescript
  const invalidateOrderDetail = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: orderDetailKey, refetchType: 'none' });
  }, [queryClient, orderDetailKey]);
  ```

- No tocar `reload()` en `useOrder.ts` ni el flujo de `onChange`/`resetCostAnalysis`.
- No tocar los sub-hooks hermanos (`useOrderIncidents`, `useOrderPlannedDetails`,
  `useOrderAuxiliaryLines`) — no llaman a `reload()` tras invalidar, así que su
  `refetchType` por defecto sigue siendo el comportamiento correcto para ellos.

## Criterios de aceptación

- [ ] `invalidateOrderDetail` en `useOrderPallets.ts` usa `refetchType: 'none'`.
- [ ] Cada una de las cuatro operaciones remotas de palets sigue refrescando el
      detalle del pedido correctamente (verificado manualmente: la sección de
      palets y el resumen del pedido reflejan el cambio tras la operación).
- [ ] `resetCostAnalysis()` y `onChange` siguen invocándose igual que antes
      (sin cambios en `useOrder.ts` ni en el flujo de `reload()`).
- [ ] No se introduce ningún caso donde el detalle quede desactualizado por
      quedarse solo con la marca de "stale" sin refetch real.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un pedido, borrar/desvincular/vincular/desvincular-todos palets.
# Confirmar en Network (DevTools) que cada operación genera una sola petición
# GET al detalle del pedido tras la mutación, no dos.
# Confirmar que la sección de palets, el resumen y (si estaba abierta) la
# pestaña de análisis de costes se refrescan correctamente.
```

## Notas de implementación

Cambio de una línea: `invalidateOrderDetail` en `useOrderPallets.ts:61-63` pasa
ahora `refetchType: 'none'` a `queryClient.invalidateQueries(...)`. No se tocó
`reload()` en `useOrder.ts` ni los sub-hooks hermanos, tal como especifica el
GAP.

## Resultado

`npm run type-check` y `npx eslint src/hooks/orders/useOrderPallets.ts`
limpios (0 errores). No hay test dedicado a `useOrderPallets`. Se ejecutó la
suite completa (`npx vitest run`) y se comparó contra el árbol limpio antes
del lote (via `git stash`): mismos 11 archivos / 22 tests en fallo antes y
después del cambio — son fallos preexistentes no relacionados (mocking de
`getAuthToken`, fechas, etc.), sin regresión introducida por este GAP.
Verificación manual pendiente para Jose: confirmar en Network (DevTools) que
cada operación de palet genera una sola petición GET al detalle del pedido.

## Resultado de auditoría

Veredicto: `done`.

Auditoría con contexto limpio confirma: `invalidateOrderDetail`
(`src/hooks/orders/useOrderPallets.ts:61-63`) pasa ahora
`refetchType: 'none'` a `queryClient.invalidateQueries(...)`, exactamente el
cambio de una línea descrito en las notas de implementación (`git diff`
confirma que es el único cambio del archivo). `reload()` en
`src/hooks/useOrder.ts` y los sub-hooks hermanos
(`useOrderIncidents.ts`, `useOrderPlannedDetails.ts`,
`useOrderAuxiliaryLines.ts`) no muestran ningún cambio en `git diff --stat` —
quedaron intactos tal como exige el GAP. Las cuatro mutaciones
(`deletePalletMutation`, `unlinkPalletMutation`, `linkPalletsMutation`,
`unlinkAllPalletsMutation`) siguen usando `invalidateOrderDetail` como
`onSuccess` y cada wrapper sigue llamando a `reload()` después, por lo que el
único refetch real de red pasa a ser el de `reload()` (la invalidación ahora
solo marca stale, sin disparar refetch automático) — resuelve el doble
refetch sin tocar `resetCostAnalysis()` ni la propagación de `onChange`.
`npm run type-check` limpio. `npx eslint` sobre el archivo: 0 errores. No hay
test dedicado a `useOrderPallets`; la verificación manual en Network
(DevTools) sigue pendiente para Jose como señala la nota de implementación.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001, GAP-V2-025
