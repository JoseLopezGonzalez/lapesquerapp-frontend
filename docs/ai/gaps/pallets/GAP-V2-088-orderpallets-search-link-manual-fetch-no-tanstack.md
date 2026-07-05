---
id: GAP-V2-088
title: Búsqueda y vinculación masiva de palets desde el pedido reimplementa fetch manual en vez de TanStack Query
module: pallets
category: architecture-refactor
priority: P2
risk: medium
size: M
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-088 — Flujo de búsqueda/vinculación de palets reimplementa fetch manual

## Problema

`src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`
(822 líneas — el hook "grande" de componente, distinto del sub-hook
`src/hooks/orders/useOrderPallets.ts` ya cubierto por GAP-V2-025/026) implementa el
buscador de palets disponibles para vincular al pedido con estado manual en vez de
`useQuery`:

```ts
// líneas 83-90
const [searchResults, setSearchResults] = useState<SearchPalletCardData[]>([]);
const [isSearching, setIsSearching] = useState(false);
const [isInitialLoading, setIsInitialLoading] = useState(false);
const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
const [currentPage, setCurrentPage] = useState(1);
```

Estos cuatro estados son datos de servidor (resultado de
`getAvailablePalletsForOrder`) modelados con `useState` y poblados manualmente:

- `handleOpenLinkPalletsDialog` (líneas 360-388) — al abrir el diálogo, llama a
  `getAvailablePalletsForOrder(...)` manualmente con `try/finally` y
  `setIsInitialLoading`/`setSearchResults`/`setPaginationMeta`.
- `handleSearchPallets` (líneas 435-508) — al cambiar de página o buscar por
  IDs/almacén, repite el mismo patrón con `isSearching` en vez de reutilizar una
  query cacheada.

Esto es exactamente lo que TANSTACK QUERY del checklist prohíbe ("No server data
stored in local useState — TanStack Query manages server state") y no está cubierto
por GAP-V2-001/025/026 (esos tres GAPs son sobre `src/hooks/orders/useOrderPallets.ts`,
el sub-hook de `useOrder.ts` que maneja las mutaciones de vinculación/desvinculación
ya delegadas al contexto — este hook de componente es el que maneja el *buscador* de
palets disponibles antes de vincularlos, un flujo de lectura completamente distinto).

Consecuencias concretas del patrón actual:

- Sin `queryKey`, sin caché: cada vez que se abre el diálogo de vincular palets se
  repite la petición de red aunque los resultados no hayan cambiado desde la última
  apertura en la misma sesión.
- Sin `staleTime`/invalidación: tras vincular un palet con éxito
  (`handleLinkSelectedPallets`, línea 524), no hay ninguna invalidación de una query
  de "palets disponibles" porque no existe tal query — el usuario debe volver a
  buscar manualmente si reabre el diálogo.
- Manejo de errores y loading duplicado a mano en dos sitios casi idénticos
  (`handleOpenLinkPalletsDialog` y `handleSearchPallets` repiten el mismo bloque
  try/catch/finally con los mismos tres setters).

## Objetivo

La búsqueda de palets disponibles para vincular usa `useQuery` con una `queryKey`
factory (dependiente de `orderId`, IDs buscados, almacén filtrado y página), en vez
de estado manual poblado por llamadas directas al service.

## Contexto

Acotado explícitamente al hook de componente `OrderPallets/hooks/useOrderPallets.ts`
para evitar duplicar GAP-V2-025/026 (que cubren el sub-hook de `useOrder.ts` con
las mutaciones ya migradas a `useMutation`). Este GAP es sobre el flujo de *lectura*
(búsqueda/paginación), no sobre las mutaciones de vincular/desvincular en sí (esas
siguen delegando correctamente a `onLinkPallets`/`onUnlinkAllPallets` del contexto,
ya cubiertas).

## Solución propuesta

- Crear un hook dedicado (p. ej. `useAvailablePalletsForOrder`) que envuelva
  `getAvailablePalletsForOrder` en `useQuery`, con una queryKey factory nueva en
  `src/lib/routes/queryKeys.ts` dependiente de `tenantId`, `orderId`, `ids`,
  `storeId`, `page`.
- `enabled: false` por defecto (o gateado a un flag `isSearchDialogOpen`), disparando
  la query manualmente con `refetch()` al abrir el diálogo o cambiar de filtro/página,
  en vez de `try/catch` manual duplicado en dos funciones distintas.
- Sustituir `searchResults`, `paginationMeta`, `isSearching`, `isInitialLoading` por
  los campos estándar de `useQuery` (`data`, `isFetching`, `isLoading`).
- Tras `onLinkPallets` exitoso, invalidar la queryKey de disponibilidad si el diálogo
  permanece abierto (aunque hoy se cierra tras vincular, línea 532 — documentar la
  decisión si se mantiene ese comportamiento).

## Criterios de aceptación

- [ ] La búsqueda de palets disponibles usa `useQuery` con una queryKey factory, no
      `useState` + llamadas manuales al service.
- [ ] No hay duplicación de try/catch/finally entre apertura del diálogo y cambio de
      página/filtro — ambos casos disparan la misma query.
- [ ] El comportamiento visible (resultados, paginación, mensajes de error) no
      cambia para el usuario.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir el diálogo de vincular palets, buscar por ID, por almacén, paginar,
# vincular uno o varios. Confirmar que el comportamiento y los mensajes de error
# son idénticos al actual.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** tamaño M — no requiere
autorización de Jose (la regla de autorización explícita solo aplica a L/XL).
Independiente del antipatrón ya `ready` de la primera pasada GAP-V2-058
(`usePallet` sin TanStack Query): son hooks distintos (`usePallet.ts` vs. este
hook de componente de `OrderPallets`), sin solapamiento de archivos ni de query
keys — confirmado, no fusionable. GAP-V2-089 (split del mismo hook de 822 líneas)
depende de este GAP.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-025, GAP-V2-026 (orders, sub-hook distinto — sin
  solapamiento), GAP-V2-089 (split del mismo hook por responsabilidad)
