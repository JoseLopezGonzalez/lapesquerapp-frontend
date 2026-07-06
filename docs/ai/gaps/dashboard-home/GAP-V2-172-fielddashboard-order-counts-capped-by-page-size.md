---
id: GAP-V2-172
title: Conteos de "Pedidos operativos" en FieldDashboard quedan capados por perPage fijo, no reflejan el total real
module: dashboard-home
category: ux-ui
priority: P1
risk: medium
size: M
status: blocked
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
  - src/hooks/useFieldOrders.ts
  - src/components/Field/FieldOrdersPage.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-172 — Conteos de "Pedidos operativos" quedan capados por perPage fijo

## Problema

**Fusionado desde GAP-V2-212 (carril domain-business, mismo síntoma, ángulo complementario):**
además del problema de paginación descrito abajo, el conteo tampoco aplica el filtro `active`
que sí usa `FieldOrdersPage.jsx:213` (`{ perPage: 20, active: true }`) para excluir pedidos no
relevantes operativamente — el dashboard llama a `useFieldOrders({ perPage: 20 })` sin ese
filtro. Un repartidor que abre la app antes de salir a ruta necesita una respuesta operativa
inmediata a "¿cuántas entregas me quedan por hacer HOY?" — no un conteo de "los últimos 20
pedidos que devuelva la API" sin acotar por fecha/estado activo, que puede incluir pedidos de la
semana pasada aún no cerrados administrativamente.

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

Además, pasar `active: true` a `useFieldOrders` en `FieldDashboard`, igual que ya hace
`FieldOrdersPage`, para no contar pedidos no relevantes operativamente.

## Criterios de aceptación

- [ ] Los conteos de "Pendientes"/"Finalizados" son correctos incluso cuando el
      operador tiene más de 20 pedidos en cualquiera de los dos estados.
- [ ] No se introduce una llamada que traiga listados completos solo para contar
      (evitar `perPage` alto como workaround).
- [ ] El conteo usa el mismo filtro `active: true` que `FieldOrdersPage`.
- [ ] Confirmado con Jose si el conteo debe acotarse además a la ruta activa del día
      (`routeId: todayRoute.id`) o mantenerse como "todos los pedidos activos del operador".
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: con un tenant/operador de prueba con >20 pedidos pendientes, confirmar
# que el conteo mostrado coincide con el total real (comparar contra /field/pedidos).
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** este GAP absorbe GAP-V2-212 ("KPI 'Pedidos operativos'
del dashboard Field no está acotado a hoy/ruta activa", carril domain-business) — mismo síntoma
(conteo incorrecto en la card "Pedidos operativos"), causas complementarias (paginación +
filtro `active` ausente). GAP-V2-212 queda `rejected` y redirige aquí.

**Bloqueado (gap-normalizer, 2026-07-06):** GAP-V2-212 señala una pregunta abierta para Jose sin
resolver — si el KPI debe representar "todos los pedidos activos del operador" o "solo los de la
ruta activa del día" (cruce por `routeId`). El fix de `active: true` + `meta.total` puede
implementarse sin esa respuesta, pero uno de los criterios de aceptación exige la confirmación
explícita, por lo que el GAP completo queda `blocked` hasta entonces. Aquí se documentará cuál de
las alternativas de "Solución propuesta" se usó y por qué.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-212 (fusionado aquí)
