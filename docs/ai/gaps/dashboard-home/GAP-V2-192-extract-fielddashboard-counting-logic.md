---
id: GAP-V2-192
title: Extraer el conteo de pedidos/paradas de FieldDashboard a un hook/helper
module: dashboard-home
category: architecture-refactor
priority: P3
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-192 — Lógica de negocio (conteo) inline en el componente

## Problema

`src/components/Field/FieldDashboard.jsx:76-82` calcula directamente en el componente:

```js
const todayRoute = routesData?.items?.[0] ?? null;
const orders = ordersData?.items ?? [];
const pendingOrders = orders.filter((order) => order.status === 'pending').length;
const finishedOrders = orders.filter((order) => order.status === 'finished').length;
const routeStops = Array.isArray(todayRoute?.stops) ? todayRoute.stops : [];
const completedStops = routeStops.filter((stop) => stop.status === 'completed').length;
const skippedStops = routeStops.filter((stop) => stop.status === 'skipped').length;
```

Esto viola la regla REACT PATTERNS "No business logic in components — extracted to
hooks" de `code-audit-agent`. No es lógica de presentación: es una regla de negocio
("¿qué cuenta como pedido pendiente/finalizado?", "¿qué cuenta como parada
procesada?") que hoy solo vive en este componente, no es reutilizable ni testeable de
forma aislada, y no tiene cobertura en `src/__tests__/`.

## Objetivo

El componente solo consume un resultado ya calculado (`{ pendingOrders, finishedOrders,
completedStops, skippedStops }`), sin `.filter()` inline. La lógica de conteo es una
función pura testeable con Vitest.

## Contexto

Es un cambio de bajo riesgo, aislado, que no toca la capa de red ni las queryKeys.
Puede resolverse en el mismo PR que GAP-V2-190 (migración a `.tsx`) siempre que se separe
claramente el commit de tipado del commit de extracción, o en un PR posterior.

## Solución propuesta

1. Crear `src/helpers/field/fieldDashboardSummary.ts` (o `src/hooks/field/
   useFieldDashboardSummary.ts` si Jose prefiere un hook) con una función pura:
   ```ts
   export function getFieldDashboardSummary(orders: FieldOrder[], route: DeliveryRoute | null) {
     const stops = Array.isArray(route?.stops) ? route.stops : [];
     return {
       pendingOrders: orders.filter((o) => o.status === 'pending').length,
       finishedOrders: orders.filter((o) => o.status === 'finished').length,
       completedStops: stops.filter((s) => s.status === 'completed').length,
       skippedStops: stops.filter((s) => s.status === 'skipped').length,
       totalStops: stops.length,
     };
   }
   ```
2. `FieldDashboard` llama a esta función con `orders` y `todayRoute` y desestructura el
   resultado.
3. Añadir test en `src/__tests__/helpers/fieldDashboardSummary.test.ts` cubriendo: array
   vacío, ruta sin `stops`, mezcla de estados.

## Criterios de aceptación

- [ ] `FieldDashboard` no contiene `.filter()` de lógica de negocio inline.
- [ ] Función pura extraída y testeada en `src/__tests__/`.
- [ ] `npm run test:run` en verde.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: /field — confirmar que los contadores de "Pedidos operativos" y "Actividad
# reciente" muestran los mismos valores que antes del refactor.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-190
