---
id: GAP-V2-065
title: PalletView calls domain services directly instead of through a hook (deletePalletTimeline, downloadPalletExpeditionLabel, getProductionByLot)
module: pallets
category: architecture-refactor
priority: P3
risk: medium
size: M
status: ready
dependencies:
  - GAP-V2-062
target_files:
  - src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-065 — `PalletView` importa y llama services directamente, saltándose la capa de hooks

## Problema

El flujo de datos obligatorio del proyecto es
`Componente → hook → service → helper genérico → fetchWithTenant` (CLAUDE.md
§ "Flujo de datos"). `PalletView/index.tsx` rompe este flujo para tres acciones,
importando funciones de service directamente en el componente
(`index.tsx:99-100`):

```ts
import { deletePalletTimeline, downloadPalletExpeditionLabel } from '@/services/palletService';
import { getProductionByLot } from '@/services/productionService';
```

Y llamándolas desde handlers definidos en el propio componente:

- `handleOnClickDownloadExpeditionLabel` (línea 226) — llama
  `downloadPalletExpeditionLabel` directamente.
- `handleOpenProductionByLot` (línea 278) — llama `getProductionByLot`
  directamente, con su propio `useState` (`resolvingProductionLot`, línea 168)
  para el estado de carga.
- `handleConfirmDeleteTimeline` (línea 309) — llama `deletePalletTimeline`
  directamente, con su propio `useState` (`deletingTimeline`, línea 167).

Cada uno de estos tres handlers reimplementa manualmente el patrón
try/catch + `setLoading(true/false)` + `notify.success`/`notify.error` que
normalmente encapsularía una mutación de TanStack Query dentro de un hook — no
hay invalidación de caché ni reuso posible desde otro componente.

## Objetivo

Estas tres acciones se disparan desde hooks (ya sea un nuevo hook dedicado o
añadidos a `hooks/pallets/*`), no desde imports de service ni estado de carga
manual en el componente. `PalletView` solo consume el resultado del hook.

## Contexto

Este GAP es de ámbito menor comparado con GAP-V2-062 (división completa del
archivo) pero puede resolverse como parte de la misma extracción: al mover el
contenido de la pestaña "Etiqueta" y "Historial" a sus propios sub-componentes
(GAP-V2-062), estos tres handlers deberían migrar junto con la lógica a un hook
dedicado en vez de quedar en el componente contenedor.

## Solución propuesta

- Crear (o extender) un hook, p.ej. `hooks/pallets/usePalletViewActions.ts`, que
  exponga `downloadExpeditionLabel`, `openProductionByLot`,
  `deleteTimeline` como mutaciones (`useMutation` de TanStack Query), cada una
  con su propio `isPending` en vez de `useState` manual, y `onSuccess`/`onError`
  con `notify.success`/`notify.error` centralizados.
- `deleteTimeline` debe invalidar la queryKey de `usePalletTimeline`
  (`palletTimelineKeys`) en `onSuccess` en vez de llamar `refetchTimeline()`
  manualmente desde el componente.
- `PalletView` importa el hook, no los services.

## Criterios de aceptación

- [ ] `PalletView/index.tsx` no importa funciones de `@/services/palletService`
      ni `@/services/productionService` directamente.
- [ ] Las tres acciones (descargar etiqueta de expedición, abrir producción por
      lote, borrar historial) se disparan desde un hook.
- [ ] El borrado de historial invalida la queryKey correspondiente en vez de
      llamar `refetch()` manualmente.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: descargar etiqueta de expedición, abrir producción desde un lote,
# borrar historial — confirmar mismo comportamiento que antes.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** marcado `blocked` — depende de
GAP-V2-062 (división de `PalletView/index.tsx`), que a su vez está `blocked` por
tamaño XL pendiente de autorización de Jose. Este GAP hereda el bloqueo en
cascada; no tiene sentido implementarlo antes de que se decida si/cuándo se
divide el archivo contenedor.

**Decisión de Jose (2026-07-05):** autorizado junto con GAP-V2-062. Implementar
después de GAP-V2-062 (dependencia real de orden, no solo de tamaño).

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-058, GAP-V2-062
