---
id: GAP-V2-002
title: useOrder.ts usa un array literal como queryKey en vez de una factory
module: orders
category: code-quality
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/hooks/useOrder.ts
  - src/lib/routes/queryKeys.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-002 — `useOrder.ts` usa un array literal como queryKey

## Problema

`src/hooks/useOrder.ts:101` define:

```typescript
const queryKey = ['order', orderId];
```

Esto es un array literal usado directamente como `queryKey` de `useQuery`
(línea 109) y como key de `queryClient.setQueryData` (línea 119, dentro de
`updateOrderCache`). El proyecto tiene una regla ESLint activa que prohíbe
exactamente este patrón — `.claude/rules/hooks.md`, sección "Query Keys — regla
ESLint activa": *"El proyecto tiene una regla ESLint que prohíbe arrays literales en
`queryKey`"*. Todas las demás factories de `orders` (`orderListKeys`,
`orderAttachmentKeys`, `orderStatKeys`, `orderChartKeys`, etc.) viven en
`src/lib/routes/queryKeys.ts` — pero no existe ninguna factory para el detalle de un
único pedido (`orders/{id}`). Es el único punto de fetching de detalle de pedido en
todo el módulo que no pasa por una factory.

Consecuencias directas de no tener una key tenant-aware:
- La key `['order', orderId]` no incluye `tenantId`, a diferencia de todas las demás
  keys del módulo (`orderListKeys.active(tenantId)`,
  `orderAttachmentKeys.list(tenantId, orderId)`, etc.). En un entorno multi-tenant
  esto no es incorrecto en sí (React Query no comparte caché entre pestañas de
  distinto tenant si el `QueryClient` se resetea en el login), pero rompe la
  convención uniforme del resto del módulo y dificulta invalidaciones cruzadas
  (`invalidateQueries` con prefijo por tenant, como se necesita para GAP-V2-001).
- Bloquea GAP-V2-001: los sub-hooks de mutación no tienen una key de prefijo estable
  a la que apuntar `invalidateQueries` sin duplicar el array literal en cada archivo.

Adicionalmente, en la misma función, `src/hooks/useOrder.ts:121-124`:

```typescript
const updateOrderCache = useCallback(
  (updatedOrder: Order) => {
    if (!updatedOrder) return;
    queryClient.setQueryData(queryKey, updatedOrder);
    onChange?.(updatedOrder);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [queryClient, JSON.stringify(queryKey), onChange]
);
```

El `eslint-disable-next-line` no lleva comentario explicativo, violando el checklist
GENERAL ("No eslint-disable sin explicación") de `.claude/agents/code-audit-agent.md`.
El uso de `JSON.stringify(queryKey)` como dependencia es además un indicio adicional
de que `queryKey` no es una referencia estable — otra señal de que debería venir de
una factory memoizada con `as const` en vez de reconstruirse en cada render.

## Objetivo

`useOrder.ts` usa una factory `orderKeys` (nueva, en `queryKeys.ts`) tenant-aware
para el detalle del pedido, consistente con el resto de factories del módulo. El
`eslint-disable` (si sigue siendo necesario tras el cambio) lleva un comentario que
explique por qué.

## Contexto

Bloqueante para GAP-V2-001, que necesita invalidar la query de detalle del pedido
desde los sub-hooks de mutación.

## Solución propuesta

1. Añadir a `src/lib/routes/queryKeys.ts` (siguiendo el patrón de
   `orderAttachmentKeys` en la misma sección, líneas 303-318):

   ```typescript
   export const orderKeys = {
     detailPrefix: (tenantId: string | null | undefined) =>
       ['orders', 'detail', tenantId ?? 'unknown'] as const,
     detail: (
       tenantId: string | null | undefined,
       orderId: number | string | null | undefined
     ) => ['orders', 'detail', tenantId ?? 'unknown', orderId] as const,
   };
   ```

2. En `useOrder.ts`, obtener `tenantId` con `getCurrentTenant()` (como ya hacen
   `useOrders.ts` y `useOrderAttachments.ts` en el mismo directorio) y sustituir la
   línea 101 por `const queryKey = orderKeys.detail(tenantId, orderId);`.
3. Añadir `enabled: !!tenantId && !!orderId` a la query (hoy solo tiene
   `enabled: !!orderId`, sin condicionar al tenant — inconsistente con
   `.claude/rules/hooks.md`: *"enabled: siempre condicionar al tenant y al token"*).
4. Revisar si el `eslint-disable-next-line` de la línea 122 sigue siendo necesario
   una vez que `queryKey` viene de una factory `as const` (probablemente ya no, al
   ser una referencia derivada de valores primitivos estables); si se mantiene,
   añadir el comentario explicativo.

## Criterios de aceptación

- [ ] `useOrder.ts` no contiene ningún array literal usado como `queryKey`.
- [ ] Existe `orderKeys` en `queryKeys.ts` siguiendo el patrón `detail`/`detailPrefix`
      ya usado por `orderAttachmentKeys`.
- [ ] La query de detalle de pedido está condicionada a `!!tenantId && !!orderId`.
- [ ] Si el `eslint-disable-next-line` se mantiene, lleva comentario explicativo.
- [ ] `npm run lint` no reporta el warning de `no-inline-query-keys` en este archivo.
- [ ] `npm run type-check` limpio.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: abrir un pedido, cambiar de pestaña y volver — confirmar que no hay
# refetch innecesario y que el caché se invalida correctamente tras una edición.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-001 (depende de esta factory)
