---
id: GAP-V2-087
title: Movimientos de posición/almacén de palets mutan una copia local del store en vez de invalidar la query
module: pallets
category: architecture-refactor
priority: P2
risk: medium
size: L
status: ready
dependencies:
  - GAP-V2-085
target_files:
  - src/hooks/useStore.ts
  - src/hooks/useStoreDialogs.ts
  - src/hooks/useStoreData.ts
created_at: 2026-07-05
updated_at: 2026-07-06
normalized_at: 2026-07-05
---

# GAP-V2-087 — El flujo de posición/movimiento de palets no usa TanStack Query para reflejar cambios

## Problema

`src/hooks/useStoreData.ts` sí carga los datos del almacén con `useQuery` (línea 18).
Pero `src/hooks/useStore.ts:26-38` copia ese resultado a un `useState` local en el
momento en que llega, vía `useEffect`:

```ts
// useStore.ts:26-38
const { store: fetchedStore, ... } = useStoreData({ storeId: String(storeId), setIsStoreLoading });
const [store, setStore] = useState<StoreData | null>(null);
useEffect(() => {
  setStore(fetchedStore ?? null);
}, [fetchedStore, storeId]);
```

A partir de ahí, **todas** las operaciones de movimiento/posición de palets escriben
directamente sobre esa copia local en vez de tocar la caché de TanStack Query:

- `updateStoreWhenOnChangePallet` (`useStoreDialogs.ts:206-238`)
- `updateStoreWhenOnMovePalletToStore` (`useStoreDialogs.ts:240-274`)
- `updateStoreWhenOnMoveMultiplePalletsToStore` (`useStoreDialogs.ts:276-315`)

Las tres reciben el resultado de una operación remota exitosa (mover/ubicar palet) y
recalculan manualmente el array `pallets` y `totalNetWeight` con `setStore(prevStore
=> ...)`, en vez de `queryClient.invalidateQueries(...)` o
`queryClient.setQueryData(...)` sobre la query real de `useStoreData`. Esto viola
TANSTACK QUERY del checklist: "No server state duplicated in local state alongside a
query" — aquí no es solo duplicado, es la única fuente de verdad tras el montaje
inicial.

Efectos concretos:

- Si la query de `useStoreData` se refetchea en background por cualquier motivo
  (foco de ventana, `staleTime` expirado, otro componente invalidándola), el
  `useEffect` de `useStore.ts:36-38` sobrescribe silenciosamente todos los cambios
  locales acumulados por las operaciones de movimiento — o al revés, los cambios
  locales quedan "vivos" en la UI mientras la query real ya tiene datos distintos,
  sin ninguna sincronización entre ambas fuentes.
- Ninguna otra vista que dependa de la misma query de almacén (si existiera) se
  entera de que un palet cambió de posición/almacén — el cambio solo es visible en
  la instancia del componente que ejecutó `setStore`.

## Objetivo

Las operaciones de movimiento/posición de palets actualizan la fuente única de
verdad (la query de `useStoreData`), de forma que cualquier consumidor de esa query
ve el cambio, y un refetch en background no puede pisar silenciosamente el estado
mostrado.

## Contexto

Este GAP es de mayor alcance que GAP-V2-085 (que cubre la capa de componente/service
para las tres operaciones remotas) — es el complemento arquitectónico: una vez las
operaciones pasen por un hook con `useMutation` (GAP-V2-085), este GAP asegura que
el `onSuccess` de esas mutaciones actualice la query real en vez de un estado local
paralelo. Acotado deliberadamente a los 3 hooks de esta lista — no se audita aquí el
resto del módulo Stores (fuera del alcance de esta pasada de `pallets`).

## Solución propuesta

- En `useStoreData.ts`, exponer `queryClient` / la `queryKey` usada para la query del
  almacén (o centralizarla en una factory si no existe ya una en
  `src/lib/routes/queryKeys.ts`).
- Sustituir las tres funciones `updateStoreWhenOnChangePallet`,
  `updateStoreWhenOnMovePalletToStore`, `updateStoreWhenOnMoveMultiplePalletsToStore`
  por `onSuccess` de las mutaciones correspondientes (una vez implementadas en
  GAP-V2-085), usando `queryClient.setQueryData(storeQueryKey, updater)` (para
  reflejar el cambio sin esperar un roundtrip) seguido de
  `queryClient.invalidateQueries({ queryKey: storeQueryKey, refetchType: 'none' })`
  para marcar stale sin refetch duplicado (mismo patrón aplicado en
  GAP-V2-026 de orders).
- Eliminar el `useState`+`useEffect` de copia local en `useStore.ts:34-38` si, tras el
  cambio, ya no hace falta una copia mutable separada de la query (evaluar caso por
  caso: si algún consumidor necesita mutar `store` de forma puramente local y
  efímera sin persistir al backend, documentar por qué esa porción de estado sigue
  siendo local).

## Criterios de aceptación

- [ ] Las tres funciones de actualización de store en `useStoreDialogs.ts` actualizan
      la query real de `useStoreData` (vía `setQueryData`/`invalidateQueries`), no un
      `useState` local desconectado de la query.
- [ ] Un refetch en background de la query de almacén no revierte silenciosamente un
      movimiento de palet recién aplicado en la UI.
- [ ] El comportamiento visible de mover/ubicar palets no cambia desde la perspectiva
      del usuario (mismas notificaciones, mismo refresco de UI).
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir un almacén en dos pestañas con el mismo storeId, mover un palet
# desde una pestaña, verificar que la otra refleja el cambio tras su próximo
# refetch/invalidación (o al menos no queda en un estado inconsistente).
# Manual: forzar un refetch en background (cambiar de pestaña y volver) justo
# después de mover un palet, confirmar que el movimiento no desaparece de la UI.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** GAP completo y técnicamente listo
(criterios de aceptación verificables, plan de validación claro), pero de tamaño
`L` — regla dura de `gap-normalizer`: "No dejar un GAP de tamaño L o XL como ready
sin autorización explícita de Jose". Marcado `blocked` únicamente por esta razón,
no por falta de información. Depende además de GAP-V2-085 (debe implementarse
primero: este GAP asume que las mutaciones ya viven en un hook, no en el
componente). Complementa (causa raíz distinta) a GAP-V2-085: 085 corrige *dónde*
se hace la llamada HTTP (componente vs. hook + token-as-parameter); 087 corrige
*qué pasa después de la llamada* (mutar una copia local en `useState` en vez de la
caché real de TanStack Query). No fusionar — son dos violaciones independientes
verificables por separado, aunque secuenciales. Desbloquear cuando Jose autorice
GAPs L/XL en este módulo (mismo criterio aplicado a GAP-V2-058/062/065 en la
primera pasada, ver `docs/ai/modules/pallets/audit.md` § 10).

**Decisión de Jose (2026-07-06):** autorizado — PR aislado, implementar después
de GAP-V2-085.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-085, GAP-V2-026 (orders, patrón de invalidación sin doble refetch)
