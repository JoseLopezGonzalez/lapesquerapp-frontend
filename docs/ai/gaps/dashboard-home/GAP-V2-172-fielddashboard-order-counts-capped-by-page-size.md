---
id: GAP-V2-172
title: Conteos de "Pedidos operativos" en FieldDashboard quedan capados por perPage fijo, no reflejan el total real
module: dashboard-home
category: ux-ui
priority: P1
risk: medium
size: M
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
  - src/hooks/useFieldOrders.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-172 — Conteos de "Pedidos operativos" quedan capados por perPage fijo

## Problema

`FieldDashboard` calcula los conteos de pedidos pendientes/finalizados filtrando en
cliente una única página de pedidos:

```js
const { data: ordersData, isLoading: loadingOrders } = useFieldOrders({ perPage: 20 });   // línea 74
const orders = ordersData?.items ?? [];                                                    // línea 77
const pendingOrders = orders.filter((order) => order.status === 'pending').length;         // línea 78
const finishedOrders = orders.filter((order) => order.status === 'finished').length;       // línea 79
```

`useFieldOrders` (`src/hooks/useFieldOrders.ts:34-38`) ya expone `meta` (la
paginación real del backend: `current_page`, `last_page`, `total`), pero
`FieldDashboard` la ignora por completo y solo cuenta sobre `data.items`, que está
limitado a un máximo de 20 registros por `perPage: 20`.

Consecuencia directa: si un repartidor tiene más de 20 pedidos operativos activos
(cualquier combinación de pendientes + finalizados por encima de 20), la card
"Pedidos operativos" — cuya `CardDescription` promete explícitamente "Conteo rápido
de pedidos pendientes y ya cerrados" — muestra un número menor al real, sin ningún
indicio visual de que está incompleto. Es un dato operativo (cuántos pedidos quedan
por servir hoy) mostrado con apariencia de conteo total cuando en realidad es un
conteo parcial silencioso.

## Objetivo

Los conteos de "Pendientes" y "Finalizados" en la card "Pedidos operativos" reflejan
el total real de pedidos del operador, no solo los de la primera página cargada.

## Contexto

Ninguna dependencia directa, pero requiere decidir el enfoque de implementación
(ver Solución propuesta) — puede necesitar coordinarse con el backend si no existe
ya un endpoint de conteos agregados por estado.

## Solución propuesta

Dos alternativas, a decidir según lo que ya soporte el backend (`field/orders`):

1. **Si el backend soporta filtrar por `status` en el listado** (ya usado en otras
   partes del proyecto vía `addFiltersToParams`): hacer dos llamadas ligeras con
   `status=pending`/`status=finished` y `perPage=1`, leyendo `meta.total` de cada
   una en vez de contar sobre `data.items`. Evita traer los 20 registros completos
   solo para contarlos.
2. **Si el backend ya expone o puede exponer un endpoint de estadísticas** (patrón
   `useOrdersStats`/`useStockStats` ya existente en el proyecto para otros
   dashboards): crear un hook equivalente `useFieldOrdersStats` que consuma ese
   endpoint directamente.

En ambos casos, evitar seguir derivando el conteo de un `perPage` fijo pensado para
otro propósito (poblar el listado, no contar).

## Criterios de aceptación

- [ ] Los conteos de "Pendientes"/"Finalizados" son correctos incluso cuando el
      operador tiene más de 20 pedidos en cualquiera de los dos estados.
- [ ] No se introduce una llamada que traiga listados completos solo para contar
      (evitar `perPage` alto como workaround).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: con un tenant/operador de prueba con >20 pedidos pendientes, confirmar
# que el conteo mostrado coincide con el total real (comparar contra /field/pedidos).
```

## Notas de implementación

{se rellena durante la implementación — aquí debe documentarse cuál de las dos
alternativas de "Solución propuesta" se usó y por qué}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
