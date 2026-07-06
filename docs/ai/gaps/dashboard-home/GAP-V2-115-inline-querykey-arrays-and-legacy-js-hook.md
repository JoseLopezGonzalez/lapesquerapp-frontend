---
id: GAP-V2-115
title: "queryKeys inline (['receptions','list'] / ['dispatches','list']) en handleRefresh y useReceptionsList.js sin factory ni migración a TS"
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/OperarioDashboard/index.tsx
  - src/hooks/useReceptionsList.js
  - src/lib/routes/queryKeys.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-115 — Arrays literales de `queryKey` y hook de recepciones sin migrar a TS

## Problema

1. `OperarioDashboard/index.tsx:61-64` invalida queries con arrays literales:
   ```ts
   await Promise.all([
     queryClient.invalidateQueries({ queryKey: ['receptions', 'list'] }),
     queryClient.invalidateQueries({ queryKey: ['dispatches', 'list'] }),
   ]);
   ```
   Esto contradice la regla ESLint activa del proyecto y
   `.claude/design-context.md` § 7: "Never use inline arrays in TanStack Query
   `queryKey` — always use factory functions from `queryKeys.ts`".

2. `src/hooks/useReceptionsList.js:19` construye la queryKey directamente como
   array literal (`['receptions', 'list', tenantId ?? 'unknown', page, today]`)
   en vez de usar una factory — a diferencia de su hermano
   `useDispatchesList.ts`, que sí usa `dispatchQueryKeys.list(...)` desde
   `src/lib/routes/queryKeys.ts:583-587`. No existe ninguna
   `receptionListKeys`/`receptionQueryKeys.list` factory en `queryKeys.ts` (solo
   existe `receptionChartKeys.chart`, para un endpoint distinto).

3. `useReceptionsList.js` sigue siendo `.js`, no `.ts`, mientras su análogo
   `useDispatchesList.ts` ya está migrado — inconsistencia de stack dentro del
   mismo par de hooks hermanos.

## Objetivo

Toda invalidación e inicialización de queryKey de recepciones/salidas debe
pasar por una factory de `queryKeys.ts`, y `useReceptionsList` debe estar en
TypeScript al mismo nivel que `useDispatchesList.ts`.

## Contexto

`invalidateQueries({ queryKey: ['dispatches', 'list'] })` funciona hoy porque
TanStack Query hace *partial match* por prefijo — coincide con
`dispatchQueryKeys.list(...)` aunque no use la factory. Es decir, funcionalmente
no hay bug de invalidación, pero el código no sigue el patrón obligatorio y
sería fácil que un futuro cambio de forma de la queryKey real rompa esta
invalidación silenciosamente sin que el lint lo detecte.

## Solución propuesta

1. Añadir `receptionListKeys` a `queryKeys.ts` con la misma forma que
   `dispatchQueryKeys`:
   ```ts
   export const receptionListKeys = {
     listPrefix: (tenantId: string | null | undefined) =>
       ['receptions', 'list', tenantId ?? 'unknown'] as const,
     list: (tenantId: string | null | undefined, page: number, today: string) =>
       ['receptions', 'list', tenantId ?? 'unknown', page, today] as const,
   };
   ```
2. Migrar `useReceptionsList.js` → `useReceptionsList.ts`, usando
   `receptionListKeys.list(...)` en el `useQuery`.
3. En `OperarioDashboard/index.tsx`, reemplazar los arrays literales de
   `handleRefresh` por `receptionListKeys.listPrefix(tenantId)` y
   `dispatchQueryKeys.listPrefix(tenantId)` (requiere obtener `tenantId` vía
   `getCurrentTenant()` en el componente, o exponer un helper de invalidación
   desde los propios hooks).

## Criterios de aceptación

- [ ] `receptionListKeys` añadido a `queryKeys.ts`, usado por
      `useReceptionsList.ts`.
- [ ] `useReceptionsList` migrado a `.ts` sin `any` nuevo.
- [ ] `handleRefresh` en `OperarioDashboard` usa factories, no arrays literales.
- [ ] `npm run type-check` y `npm run lint` limpios (sin warnings de la regla
      ESLint de queryKey).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: pulsar "Recargar" y confirmar (React Query Devtools) que ambas
# queries se invalidan y refetchean correctamente tras el cambio.
```

## Notas de implementación

{se rellena durante la implementación — migración .js→.ts de bajo riesgo,
seguir protocolo de CLAUDE.md § migraciones .jsx→.tsx (baseline type-check
antes/después)}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-111 (mismo hook, error state)
