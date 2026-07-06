---
id: GAP-V2-213
title: Atajo "Nueva autoventa" del dashboard no vincula la venta a la ruta activa
module: dashboard-home
category: domain-business
priority: P2
risk: low
size: XS
status: candidate
dependencies:
  - GAP-V2-210
target_files:
  - src/components/Field/FieldDashboard.jsx
  - src/components/Field/StopDetailDrawer.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-213 — Atajo "Nueva autoventa" del dashboard no vincula la venta a la ruta activa

## Problema

El acceso directo "Nueva autoventa" de la card "Actividad reciente" en
`FieldDashboard.jsx:201-206` navega sin ningún parámetro de contexto:

```jsx
<Link href="/field/autoventa">
  Nueva autoventa
  <ShoppingCart className="h-4 w-4" />
</Link>
```

En cambio, el mismo destino invocado desde dentro de una ruta en ejecución
(`StopDetailDrawer.jsx:117-132`) sí pasa el contexto operativo completo:

```jsx
<Link
  href={{
    pathname: '/field/autoventa',
    query: {
      routeId: route.id,
      routeStopId: focusedStop.id,
      ...(focusedStop.customerId ? { customerId: focusedStop.customerId } : {}),
    },
  }}
>
```

`useFieldAutoventa` (`useFieldAutoventa.js:53-62`) sí soporta y persiste `routeId`/
`routeStopId` cuando se le pasan — el problema es exclusivamente que el atajo del
dashboard nunca se los da.

## Por qué es un problema de negocio (no solo de código)

El propio texto de la card lo describe como la vía para registrar una oportunidad
"si surge... en ruta" (`FieldDashboard.jsx:196-199`) — es decir, el caso de uso
explícito es una venta oportunista mientras se ejecuta la ruta del día, no una venta
aislada sin ruta. Si el repartidor usa este atajo en vez de abrir la parada concreta
desde el mapa de ruta, la autoventa resultante queda sin `routeId`/`routeStopId`
aunque haya sucedido durante esa misma ruta. Esto rompe la trazabilidad entre "ruta
ejecutada hoy" y "ventas realizadas durante esa ruta": estadísticas de cierre de ruta,
atribución de ventas por ruta/comercial, y la propia relación pedido↔parada
(`ordersByStopId` en `FieldRouteExecutionPage.jsx:86-94`, que cruza pedidos y paradas
por `routeStopId`) no podrán asociar esa venta a ninguna parada, aunque
operativamente sí ocurrió en una.

## Objetivo

El atajo de autoventa del dashboard debe intentar heredar el contexto de la ruta
activa del día (si existe una) para no perder la trazabilidad ruta↔venta, sin exigir
al repartidor pasos adicionales.

## Contexto

Depende de GAP-V2-210 solo en el sentido de que ambos tocan el mismo wizard — no hay
dependencia funcional real, pueden implementarse en cualquier orden.

## Solución propuesta

- En `FieldDashboard.jsx`, cuando exista `todayRoute`, construir el `Link` con
  `query: { routeId: todayRoute.id }` (sin `routeStopId`, ya que el dashboard no sabe
  en qué parada concreta está el repartidor en ese momento — a diferencia del atajo
  dentro de `StopDetailDrawer`, que sí lo sabe).
- Confirmar con Jose si una autoventa sin parada asociada pero con `routeId` conocido
  es semánticamente correcta para el backend (¿debe exigir también `routeStopId`, o
  es un caso válido de "venta durante la ruta pero no en una parada planificada"?)
  antes de implementar — ver pregunta abierta.

## Criterios de aceptación

- [ ] Cuando existe una ruta activa para el día, el atajo "Nueva autoventa" del
      dashboard pasa `routeId` al wizard.
- [ ] La autoventa creada desde este atajo queda asociada a la ruta del día en el
      backend (verificable en el pedido creado).
- [ ] Comportamiento sin cambios cuando no hay ruta activa para el día (`todayRoute`
      es `null`).

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: con una ruta activa para hoy, usar el atajo del dashboard y
confirmar en el pedido creado que routeId quedó asociado.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-210 (mismo wizard, distinto problema)

## Pregunta abierta para Jose

¿Es semánticamente válido para el backend que una autoventa tenga `routeId` pero no
`routeStopId` (venta durante la ruta, pero no en una parada planificada del día)? Si
no lo es, este GAP necesitaría en su lugar crear una parada "oportunidad" ad-hoc en el
momento, lo cual es un alcance mayor.
