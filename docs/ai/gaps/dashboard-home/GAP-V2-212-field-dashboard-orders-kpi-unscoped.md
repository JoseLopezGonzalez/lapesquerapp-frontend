---
id: GAP-V2-212
title: KPI "Pedidos operativos" del dashboard Field no está acotado a hoy/ruta activa
module: dashboard-home
category: domain-business
priority: P2
risk: medium
size: S
status: rejected
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
  - src/hooks/useFieldOrders.ts
  - src/components/Field/FieldOrdersPage.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-212 — KPI "Pedidos operativos" del dashboard Field no está acotado a hoy/ruta activa

## Problema

`FieldDashboard.jsx:74` obtiene los pedidos con
`useFieldOrders({ perPage: 20 })` — sin fecha, sin `routeId`, sin filtro de
`active` — y sobre ese conjunto arbitrario de "los últimos 20 pedidos que devuelva el
backend" calcula:

```js
// FieldDashboard.jsx:78-79
const pendingOrders = orders.filter((order) => order.status === 'pending').length;
const finishedOrders = orders.filter((order) => order.status === 'finished').length;
```

y los muestra en la card "Pedidos operativos" con la descripción "Conteo rápido de
pedidos pendientes y ya cerrados" (`FieldDashboard.jsx:146-149`) — un lenguaje que
sugiere una foto operativa del día, no una muestra de los 20 pedidos más recientes
sin acotar por fecha ni estado activo.

En cambio, la propia página dedicada `FieldOrdersPage.jsx:213` sí pasa
`{ perPage: 20, active: true }` a `useFieldOrders`, es decir, ya existe en el proyecto
el filtro correcto (`active`) para excluir pedidos no relevantes operativamente — el
dashboard simplemente no lo usa.

Además, ninguna de las dos cards del dashboard ("Ruta de hoy" y "Pedidos operativos")
cruza datos entre sí: los pedidos contados en "Pedidos operativos" no están
relacionados con `todayRoute.id`, por lo que un repartidor no puede saber si esos
"Pendientes" corresponden a la ruta que está a punto de abrir o a pedidos de otro día
u otra ruta ya cerrada.

## Por qué es un problema de negocio (no solo de código)

Un repartidor que abre la app antes de salir a ruta necesita una respuesta operativa
inmediata a "¿cuántas entregas me quedan por hacer HOY, en la ruta de hoy?" — no un
conteo de los 20 pedidos más recientes de la API sin acotar por fecha, que puede
incluir pedidos de la semana pasada aún no cerrados administrativamente, o pedidos
futuros ya creados pero no correspondientes a la jornada actual. Con perPage=20 fijo,
si el operador tiene más de 20 pedidos activos, el conteo de "Pendientes" ni siquiera
es correcto sobre el propio filtro (arbitrario) que aplica — sencillamente no ve el
resto. Para alguien que consulta este número 50 veces al día antes de salir, un KPI
que no representa "lo que tengo que hacer hoy" no ahorra la operación mental que
debería ahorrar: comprobar cuántas entregas quedan.

## Objetivo

El conteo de "Pendientes"/"Finalizados" en el dashboard Field debe reflejar de forma
fiable los pedidos operativos relevantes para el contexto que el usuario está
consultando (jornada actual y, si aplica, la ruta activa mostrada en la misma
pantalla), de forma consistente con el filtro `active` ya usado por `FieldOrdersPage`.

## Contexto

No requiere nuevo backend: el filtro `active` ya existe y ya se usa correctamente en
`FieldOrdersPage`. El problema es de scoping en `FieldDashboard`, no de disponibilidad
de datos.

## Solución propuesta

- Pasar `active: true` (y, si el backend lo soporta, un filtro de fecha/ruta) a
  `useFieldOrders` en `FieldDashboard.jsx`, igual que `FieldOrdersPage`.
- Evaluar con Jose si el conteo debe acotarse además a `routeId: todayRoute.id` cuando
  existe una ruta activa para el día, de forma que las dos cards del dashboard
  ("Ruta de hoy" y "Pedidos operativos") cuenten la misma realidad operativa — ver
  pregunta abierta.
- Si el volumen de pedidos activos puede superar 20, usar el total de `meta` en lugar
  de contar solo el array de la página actual, o solicitar un endpoint de conteo
  agregado si existe.

## Criterios de aceptación

- [ ] El conteo de pendientes/finalizados en `FieldDashboard` usa el mismo filtro
      `active: true` que `FieldOrdersPage`.
- [ ] El conteo no depende de que el número real de pedidos activos sea menor que el
      `perPage` solicitado (o se documenta explícitamente la limitación tras decisión
      de Jose).
- [ ] Confirmado con Jose si el conteo debe acotarse a la ruta activa del día o
      mantenerse como "todos los pedidos activos asignados al operador".

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: comparar el conteo de la card "Pedidos operativos" del dashboard
contra el listado real en /field/pedidos para el mismo operador.
```

## Notas de implementación

**Fusionado (gap-normalizer, 2026-07-06):** mismo síntoma que GAP-V2-172 ("Conteos de 'Pedidos
operativos' en FieldDashboard quedan capados por perPage fijo", carril code-audit-agent),
confirmado desde el ángulo de negocio (filtro `active` ausente + posible necesidad de acotar por
`routeId`). Fusionado en GAP-V2-172, que queda `blocked` pendiente de la pregunta abierta para
Jose sobre el alcance del KPI. Este archivo queda `rejected` — no se implementa por separado.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno todavía en este módulo para esta superficie.

## Pregunta abierta para Jose

¿El KPI de "Pedidos operativos" del dashboard debe representar "todos los pedidos
activos asignados al operador" (independiente de la ruta de hoy) o "los pedidos de la
ruta de hoy mostrada en la misma pantalla"? Esto cambia si hace falta cruzar por
`routeId` o solo aplicar `active: true`.
