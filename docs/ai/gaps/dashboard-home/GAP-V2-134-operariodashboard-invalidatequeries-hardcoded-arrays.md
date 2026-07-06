---
id: GAP-V2-134
title: OperarioDashboard invalida queries con arrays literales hardcodeados en vez de las factories existentes
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: XS
status: candidate
dependencies:
  - GAP-V2-133
target_files:
  - src/components/Warehouse/OperarioDashboard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-134 — `handleRefresh` de `OperarioDashboard` invalida queries con arrays hardcodeados

## Problema

`OperarioDashboard/index.tsx:61-64` invalida manualmente las queries de recepciones y salidas
al pulsar "Recargar":

```tsx
await Promise.all([
  queryClient.invalidateQueries({ queryKey: ['receptions', 'list'] }),
  queryClient.invalidateQueries({ queryKey: ['dispatches', 'list'] }),
]);
```

Ambos son arrays literales inline, lo que viola la misma regla ESLint activa que prohíbe
arrays literales en cualquier posición `queryKey:` (`eslint.config.mjs:8-15`) — el selector no
distingue entre `useQuery({ queryKey: [...] })` e `invalidateQueries({ queryKey: [...] })`,
ambos son `Property[key.name='queryKey'] > ArrayExpression`.

Además, ya existe una factory exacta para este propósito para salidas de cebo —
`dispatchQueryKeys.listPrefix(tenantId)` (`queryKeys.ts:584-585`) — que no se usa aquí. El
array hardcodeado tampoco incluye `tenantId`, lo que en la práctica funciona igual (TanStack
Query hace *prefix matching*, así que `['dispatches', 'list']` invalida cualquier query cuya key
empiece igual, incluida la que sí lleva `tenantId`), pero es inconsistente con el patrón del
resto del proyecto y frágil si la forma de la key cambia en el futuro.

## Objetivo

`handleRefresh` invalida ambas queries usando las factories `listPrefix` de
`queryKeys.ts`, sin arrays literales.

## Contexto

Depende de GAP-V2-133 para que exista `receptionQueryKeys.listPrefix(tenantId)` (hoy no existe
ninguna factory para el listado de recepciones). `dispatchQueryKeys.listPrefix` ya existe y
puede usarse de inmediato.

## Solución propuesta

```tsx
import { dispatchQueryKeys, receptionQueryKeys } from '@/lib/routes/queryKeys';
// ...
const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;
// ...
await Promise.all([
  queryClient.invalidateQueries({ queryKey: receptionQueryKeys.listPrefix(tenantId) }),
  queryClient.invalidateQueries({ queryKey: dispatchQueryKeys.listPrefix(tenantId) }),
]);
```

## Criterios de aceptación

- [ ] `handleRefresh` usa `receptionQueryKeys.listPrefix(tenantId)` y
      `dispatchQueryKeys.listPrefix(tenantId)`, sin arrays literales.
- [ ] `npm run lint` sin warnings de `no-restricted-syntax` en este archivo.
- [ ] El botón "Recargar" sigue refrescando ambas listas correctamente.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: pulsar "Recargar" en /operator y confirmar que ambas listas (recepciones y salidas)
# se refrescan.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-133 (factory de recepciones necesaria como prerequisito)
