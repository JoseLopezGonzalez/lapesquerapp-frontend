---
id: GAP-V2-019
title: useOrder cachea el detalle de pedido sin tenantId en la queryKey
module: orders
category: data-api
priority: P1
risk: medium
size: S
status: rejected
dependencies:
  - GAP-V2-002
target_files:
  - src/hooks/useOrder.ts
  - src/lib/routes/queryKeys.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-019 — useOrder cachea el detalle de pedido sin tenantId en la queryKey

## Problema

`src/hooks/useOrder.ts:101` define `const queryKey = ['order', orderId]` para un dato tenant-scoped. La llamada real (`getOrder`) va por `fetchWithTenant`, pero la caché de TanStack Query no distingue tenant para el detalle. En una sesión donde cambie el tenant efectivo antes de que se limpie la caché, el mismo `orderId` podría reutilizar datos de otro tenant hasta que haya refetch.

El propio módulo ya tiene patrón tenant-aware en listados y estadísticas: `src/hooks/useOrders.ts:14-15`, `src/hooks/useComercialOrders.ts:15-19`, `src/hooks/useOrdersStats.ts:42-46`.

## Objetivo

El detalle de pedido debe usar una queryKey canónica con `tenantId`, igual que el resto de server-state tenant-scoped del módulo.

## Contexto

GAP-V2-002 ya detecta este punto como problema de factory/code-quality. Este GAP lo eleva desde el carril permissions/multitenant porque el riesgo no es solo estilo: la identidad de tenant debe formar parte de la clave de caché.

Normalización 2026-07-02: este candidato queda rechazado como GAP independiente
porque duplica exactamente el cambio de `GAP-V2-002`. La señal multitenant se
fusionó en `GAP-V2-002`, que pasa a P1 y explicita la ausencia de `tenantId`.

## Solución propuesta

Crear o reutilizar una factory en `src/lib/routes/queryKeys.ts`, por ejemplo `orderKeys.detail(tenantId, orderId)`, y usar `getCurrentTenant()` en `useOrder` para construir la clave. Mantener `enabled` condicionado a `tenantId` y `orderId`.

## Criterios de aceptación

- [ ] `useOrder` ya no declara arrays inline ni claves sin tenant para el detalle.
- [ ] La query del detalle usa una factory importada desde `src/lib/routes/queryKeys.ts`.
- [ ] El `queryKey` contiene `tenantId` antes de `orderId` o de forma equivalente y estable.
- [ ] `setQueryData` y cualquier invalidación asociada usan la misma clave tenant-aware.

## Plan de validación

```text
npm run lint
npm run type-check
Verificación manual: cambiar entre dos tenants/sesiones y confirmar que el detalle no muestra datos cacheados de otro tenant con el mismo orderId.
```

## Notas de implementación

Pendiente.

## Resultado

Rechazado por duplicado/merge en `GAP-V2-002`.

## Resultado de auditoría

Pendiente.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: `GAP-V2-002`
