---
id: GAP-V2-052
title: Los 3 widgets CRM del dashboard Comercial muestran "todo al día" cuando en realidad la petición ha fallado
module: dashboard-home
category: ux-ui
priority: P0
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/hooks/useCrmDashboard.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-052 — El dashboard Comercial confunde error de red/servidor con "sin pendientes"

## Problema

`useCrmDashboard()` (`src/hooks/useCrmDashboard.ts:50-71`) ya calcula y devuelve
`error` correctamente (agregando el primer error de las 3 queries en paralelo:
`pendingActionsQuery`, `customersQuery`, `prospectsQuery`). Sin embargo,
`ComercialDashboard/index.js:245` lo ignora por completo:

```js
const { data: crmData, isLoading: crmLoading, refetch: refetchCrm } = useCrmDashboard();
```

`error` nunca se desestructura ni se renderiza en ningún punto del componente. El
efecto concreto: si las 3 queries fallan (403, 500, error de red...),
`mergedData` en el hook queda `null` (línea 33-48), `crmLoading` pasa a `false`, y en
`masonryItems` (líneas 361-367) `reminders`, `sortedInactiveCustomers` y
`crmData.prospects_without_activity` se evalúan todos como arrays vacíos gracias a los
`?? []` — lo que hace que los tres widgets ("Agenda del día", "Clientes inactivos",
"Prospectos sin actividad") caigan en su rama `EmptyWidget`, mostrando mensajes como
"Todo al día" / "No tienes acciones pendientes para hoy" y "Sin alertas de clientes" /
"Todos tus clientes tienen actividad reciente" — indistinguibles visualmente de un
verdadero estado sin pendientes.

Para un comercial, esto es más grave que en un dashboard de solo lectura: puede creer
que no tiene seguimientos vencidos ni clientes inactivos cuando en realidad la API
falló, y perder seguimientos comerciales reales sin ninguna señal de que algo salió
mal. Este es el mismo anti-patrón ya documentado en GAP-V2-003 para los widgets del
dashboard Admin/Dirección (`docs/ai/gaps/dashboard-home/GAP-V2-003-...md`), pero
`GAP-V2-003` no incluye estos 3 widgets del dashboard Comercial en su `target_files`
porque viven en un componente y hook distintos (`useCrmDashboard`, no
`useStockStats`/`useOrdersStats`/`useDashboardCharts`).

`CommercialSalesSummaryCard` tiene el mismo problema con su propio hook — ver
GAP-V2-053, que lo trata por separado al ser un componente distinto con su propio
hook (`useOrdersTotalAmountStats`).

## Objetivo

Cuando `useCrmDashboard()` devuelve un `error` no nulo, el dashboard Comercial debe
mostrar un estado de error visualmente distinto del estado "sin pendientes" en los
3 widgets afectados (Agenda del día, Clientes inactivos, Prospectos sin actividad),
con opción de reintentar (`refetchCrm`).

## Contexto

Sigue el mismo patrón de solución ya validado en GAP-V2-003 para el dashboard
Admin/Dirección (mensaje `text-destructive`, distinción de 403/genérico). No depende
de esa GAP para implementarse, pero comparte la misma plantilla de solución.

## Solución propuesta

1. Desestructurar `error` de `useCrmDashboard()` en `ComercialDashboard`.
2. Antes de construir `reminders`/`sortedInactiveCustomers` en `masonryItems`, si
   `error` no es `null`, empujar una única tarjeta de error (o repetir el bloque de
   error en cada una de las 3 tarjetas CRM) con un mensaje tipo:
   ```jsx
   <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 py-8">
     <p className="text-destructive px-4 text-center text-sm">{error}</p>
     <Button variant="outline" size="sm" onClick={refetchCrm}>Reintentar</Button>
   </div>
   ```
3. No confundir con el caso `crmLoading` (ya cubierto con `LoadingWidget`) — el orden
   de comprobación debe ser: loading → error → empty → data.

## Criterios de aceptación

- [ ] Cuando `useCrmDashboard().error` no es `null`, los 3 widgets CRM muestran un
      estado de error distinguible del estado vacío, con botón de reintentar.
- [ ] El estado vacío legítimo ("Todo al día", "Sin alertas de clientes", "Sin
      prospectos parados") solo se muestra cuando `error` es `null` y los arrays
      están realmente vacíos.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: forzar un error en una de las 3 queries de useCrmDashboard (p.ej. con
# React Query Devtools o simulando un 500 en el endpoint) y confirmar que el
# widget correspondiente muestra el error, no "Todo al día".
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** este GAP absorbe la parte de GAP-V2-075 ("ComercialDashboard
y CommercialSalesSummaryCard ignoran el error expuesto por sus hooks") relativa a
`ComercialDashboard`/`useCrmDashboard` — mismo hallazgo exacto, mismo bloque de código. La parte
de GAP-V2-075 relativa a `CommercialSalesSummaryCard`/`useOrdersTotalAmountStats` se fusiona en
GAP-V2-053 en su lugar. GAP-V2-075 queda `rejected` (dividido y fusionado en estos dos GAPs).

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-003 (mismo anti-patrón en dashboard Admin/Dirección), GAP-V2-053, GAP-V2-075 (fusionado aquí parcialmente)
