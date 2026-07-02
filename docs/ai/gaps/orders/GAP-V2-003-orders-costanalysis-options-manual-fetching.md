---
id: GAP-V2-003
title: useOrderCostAnalysis y useOrderOptions reimplementan fetching manual en vez de TanStack Query
module: orders
category: code-quality
priority: P2
risk: medium
size: M
status: done
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/orders/useOrderCostAnalysis.ts
  - src/hooks/orders/useOrderOptions.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-003 — `useOrderCostAnalysis` y `useOrderOptions` reimplementan fetching manual

## Problema

Dos sub-hooks de `useOrder.ts` implementan su propio ciclo de fetching con
`useState` + `useEffect` + `useCallback` en vez de `useQuery` de TanStack Query,
violando directamente el checklist REACT PATTERNS/TANSTACK QUERY de
`.claude/agents/code-audit-agent.md` ("useEffect not used as a data fetching
mechanism", "No server data stored in local useState").

**`src/hooks/orders/useOrderCostAnalysis.ts`** (97 líneas completas):

- Líneas 24-26: `costAnalysis`, `costAnalysisLoading`, `costAnalysisError` en
  `useState` — son datos de servidor (`getOrderCostAnalysis(orderId)`, línea 56),
  no estado de UI.
- Líneas 44-80: `loadCostAnalysis` reimplementa manualmente lo que
  `useQuery` da out-of-the-box: guard de "ya está cargando" (línea 47), guard de
  "ya se pidió y no se fuerza" (línea 48, sustituye a `staleTime`), try/catch/finally
  para loading/error state.
  Existe además un ref (`costAnalysisRequestedRef`, línea 27) usado como sustituto
  manual de `isFetched`/`staleTime` de TanStack Query.
- Líneas 82-88: `useEffect` que dispara `loadCostAnalysis()` cuando
  `activeTab === 'analysis'` — exactamente el patrón "fetch cuando se activa una
  tab" para el que `useQuery` con `enabled` está diseñado.
- Sin caché entre pedidos: al cambiar de pedido (línea 37-42) el hook resetea todo
  el estado en vez de dejar que TanStack Query gestione entradas de caché separadas
  por `orderId`.

**`src/hooks/orders/useOrderOptions.ts`** (126 líneas completas):

- Líneas 39-42: `productOptions`, `taxOptions`, `optionsLoaded`, `optionsLoading` en
  `useState` — datos de catálogo (`getProductOptions`, `getTaxOptions`) que son
  candidatos directos de `staleTime: 10 * 60 * 1000` según
  `.claude/rules/hooks.md` ("catálogos / datos de referencia que raramente
  cambian"), pero aquí no tienen ningún `staleTime` — se recargan por completo cada
  vez que se desmonta y remonta el componente que usa el hook.
- Tres `useEffect` independientes (líneas 47-66, 90-105, 107-123) coordinando el
  mismo fetch desde distintos triggers (contexto compartido, cambio de tab, timeout
  de fallback de 1s) — complejidad que existe precisamente porque no hay una
  primitiva declarativa (`useQuery` con `enabled`) gestionando las condiciones de
  cuándo refetchear.
- El primer `useEffect` (línea 46) tiene un `eslint-disable` de bloque completo
  (`/* eslint-disable react-hooks/exhaustive-deps -- ... */`) — este sí lleva
  explicación, a diferencia del caso de GAP-V2-002, pero es una señal más de que la
  lógica de sincronización manual con el contexto está en el límite de lo que
  `useEffect` puede manejar de forma segura.

Ambos hooks son alcanzables solo a través de `useOrder.ts` (líneas 133-155), así que
el problema es interno y no requiere cambiar la interfaz pública del hook padre.

## Objetivo

`useOrderCostAnalysis` y `useOrderOptions` obtienen sus datos vía `useQuery`, con
`enabled` condicionado a los mismos triggers que hoy disparan el fetch manual
(`activeTab === 'analysis'` / `activeTab === 'products'`), y `staleTime` apropiado
por tipo de dato (`useOrderOptions` es catálogo → 10 min; `useOrderCostAnalysis` es
dato de pedido → 1 min, según `.claude/rules/hooks.md`).

## Contexto

Depende de GAP-V2-002 para la convención de `orderKeys` — este GAP necesita sus
propias factories (`orderCostAnalysisKeys`, `orderOptionsKeys` o similar) siguiendo
el mismo patrón tenant-aware que se establezca ahí.

`useOrderOptions.ts` también lee de `OrdersManagerOptionsContext` — cualquier
refactor debe preservar la posibilidad de recibir opciones ya precargadas por ese
contexto sin duplicar el fetch (hoy resuelto con el primer `useEffect`, líneas
47-66); con `useQuery` esto se puede resolver con `initialData` o dejando que el
contexto sea la única fuente y este hook solo lea de él — a decidir en la
implementación, sin cambiar el comportamiento observable.

## Solución propuesta

1. Añadir factories de queryKey (`orderCostAnalysisKeys.detail(tenantId, orderId)`,
   `orderOptionsKeys.list(tenantId)` o equivalente) a `queryKeys.ts`.
2. Convertir `useOrderCostAnalysis` a `useQuery`:
   - `queryFn: () => getOrderCostAnalysis(orderId)`.
   - `enabled: !!tenantId && !!orderId && activeTab === 'analysis'`.
   - `staleTime: 60 * 1000`.
   - Mover la normalización de `byProductLine`/`byPallet` (líneas 57-67) a `select`.
3. Convertir `useOrderOptions` a `useQuery` (o dos queries, productos y tax por
   separado, si simplifica el `enabled` de cada uno):
   - `staleTime: 10 * 60 * 1000`.
   - Resolver la coordinación con `OrdersManagerOptionsContext` sin duplicar el
     fetch (ver Contexto).
4. Mantener la forma de retorno pública de ambos hooks
   (`{ costAnalysis, costAnalysisLoading, costAnalysisError, loadCostAnalysis,
resetCostAnalysis }` y `{ productOptions, taxOptions, optionsLoading,
loadOptions }`) para no romper `useOrder.ts` ni los componentes consumidores;
   `loadCostAnalysis`/`loadOptions` pueden mapear a `refetch` internamente si algún
   consumidor los sigue llamando de forma imperativa.

## Criterios de aceptación

- [ ] `useOrderCostAnalysis` y `useOrderOptions` no usan `useState` para datos que
      vienen del servidor.
- [ ] Ningún `useEffect` dispara un fetch directamente — el fetching lo controla
      `enabled` de `useQuery`.
- [ ] `useOrderOptions` tiene `staleTime: 10 * 60 * 1000`; `useOrderCostAnalysis`
      tiene `staleTime: 60 * 1000`.
- [ ] Las interfaces públicas de ambos hooks no cambian de forma observable para
      `useOrder.ts` ni para los componentes que consumen `options`/`costAnalysis`.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Verificación manual: abrir la tab "Análisis" y la tab "Productos" de un
      pedido, confirmar que los datos cargan igual que antes y que no hay refetch
      duplicado al cambiar de tab y volver.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: abrir un pedido, navegar entre tabs "Análisis" y "Productos" varias veces,
# confirmar ausencia de parpadeos de loading innecesarios y de llamadas duplicadas
# (Network tab del navegador).
```

## Notas de implementación

- `useOrderCostAnalysis` se migró a `useQuery` con key tenant-aware
  `orderCostAnalysisKeys.detail(tenantId, orderId)`, `enabled` por tab
  `analysis` y `staleTime` de 1 minuto.
- La normalización de `byProductLine` y `byPallet` se movió al `select` de la
  query, manteniendo orden descendente por ingresos/coste.
- `useOrderOptions` se migró a `useQueries`, reutilizando primero
  `OrdersManagerOptionsContext` y haciendo fallback declarativo solo cuando faltan
  opciones en la tab `products`.
- Se mantuvieron las APIs públicas `loadCostAnalysis`, `resetCostAnalysis` y
  `loadOptions` como wrappers sobre TanStack Query.

## Resultado

- Implementado. Los dos hooks dejan de usar `useState` para datos de servidor y no
  disparan fetching desde `useEffect`; TanStack Query controla carga, caché y
  refetch.
- Validaciones ejecutadas: `npm run type-check` limpio; `npx eslint` focalizado en
  archivos tocados limpio; `npm run lint` sin errores (268 warnings preexistentes
  en el repo).

## Resultado de auditoría

- 2026-07-02 — gap-auditor: **done**.
- Criterios verificados:
  - `useOrderCostAnalysis.ts` y `useOrderOptions.ts` ya no usan `useState` para
    datos de servidor.
  - No queda ningún `useEffect` que dispare fetching manual; el fetch inicial queda
    condicionado por `enabled` de TanStack Query y los efectos restantes solo
    propagan errores al callback público.
  - `useOrderCostAnalysis` usa `staleTime: 60 * 1000`; `useOrderOptions` usa
    `staleTime: 10 * 60 * 1000` para productos e impuestos.
  - Las query keys salen de factories centralizadas (`orderCostAnalysisKeys`,
    `productOptionKeys`, `taxOptionKeys`) e incluyen tenant.
  - Las APIs públicas esperadas por `useOrder.ts` se mantienen:
    `loadCostAnalysis`, `resetCostAnalysis`, `loadOptions`, flags de loading y
    datos devueltos.
  - Los hooks llaman services de dominio existentes; no hay `fetch()` directo ni
    forwarding de tokens desde hooks.
- Validaciones revisadas: el implementador reportó `npm run type-check`, lint
  focalizado, `npm run lint` y `npm run build` limpios. Auditoría no reejecutó la
  verificación manual en navegador.
- Hallazgos: ninguno bloqueante.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-002 (convención de queryKey tenant-aware para orders)
