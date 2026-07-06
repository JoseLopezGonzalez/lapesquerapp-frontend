---
id: GAP-V2-170
title: FieldDashboard no muestra estado de error de useFieldRoutes/useFieldOrders
module: dashboard-home
category: ux-ui
priority: P0
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-170 — FieldDashboard no muestra estado de error de useFieldRoutes/useFieldOrders

## Problema

`FieldDashboard` (`src/components/Field/FieldDashboard.jsx:70-86`) consume dos hooks
que ya exponen un contrato de error explícito:

```js
const { data: routesData, isLoading: loadingRoutes } = useFieldRoutes({ routeDate: today, perPage: 5 });
const { data: ordersData, isLoading: loadingOrders } = useFieldOrders({ perPage: 20 });
```

Ambos hooks (`src/hooks/useFieldRoutes.ts:39-43`, `src/hooks/useFieldOrders.ts:41-45`)
devuelven `errorMessage` junto a `data`/`isLoading`, siguiendo el patrón estándar de
hooks de listado del proyecto — pero `FieldDashboard` nunca destructura ni comprueba
ese campo. El único control de flujo es:

```js
if (loadingRoutes || loadingOrders) {
  return <FieldDashboardSkeleton />;
}
```

Si `getFieldRoutes` o `getFieldOrders` fallan (timeout, 500, pérdida de conexión en
ruta — un escenario realista para un repartidor en zonas con cobertura irregular),
`routesData`/`ordersData` quedan `undefined`. Como el código ya usa fallbacks
defensivos (`routesData?.items?.[0] ?? null`, `ordersData?.items ?? []`), el
dashboard renderiza silenciosamente:

- La card "Ruta de hoy" muestra el `EmptyState` de "Sin ruta hoy" (línea 130-136).
- La card "Pedidos operativos" muestra "0 Pendientes" y "0 Finalizados" (líneas
  158, 164).
- La card "Actividad reciente" muestra "0 completadas · 0 omitidas" (línea 192).

Es decir: un fallo de red se disfraza exactamente como "jornada sin actividad", el
peor caso posible para un repartidor que sí tiene una ruta y pedidos pendientes y
necesita saberlo antes de salir. No hay ningún `<p className="text-red-500 text-sm">`
ni equivalente, contraviniendo tanto el checklist MOBILE ("Error state implemented
and visible on mobile viewport") como el patrón de manejo de errores documentado en
`.claude/rules/components.md` § "Manejo de errores en componentes".

## Objetivo

Cuando `useFieldRoutes` o `useFieldOrders` devuelven `errorMessage`, el dashboard
muestra un estado de error visible y distinguible del estado vacío legítimo, con
opción de reintentar (`refetch`, ya expuesto por ambos hooks vía el spread de
`query`).

## Contexto

Ninguna dependencia. `refetch` ya está disponible en el objeto devuelto por ambos
hooks (vienen del spread `...query` de TanStack Query) — no requiere cambios en los
hooks, solo consumirlos en el componente.

## Solución propuesta

1. Destructurar `errorMessage` (y `refetch` si se quiere botón de reintento) de
   `useFieldRoutes` y `useFieldOrders` en `FieldDashboard`.
2. Añadir una rama de error antes o junto al chequeo de `isLoading`, siguiendo el
   patrón de error del proyecto (texto `text-red-500 text-sm` o, preferible en este
   contexto de card, un `EmptyState` con icono de error y botón "Reintentar" que
   llame a `refetch`), aplicada de forma independiente por card (la card de "Ruta de
   hoy" puede fallar sin que fallen los "Pedidos operativos", y viceversa).
3. No sustituir el `isLoading` combinado global si no es necesario — basta con que
   cada card individual muestre su propio error si su query específica falló,
   manteniendo el resto del dashboard funcional.

## Criterios de aceptación

- [ ] Si `useFieldRoutes` devuelve `errorMessage`, la card "Ruta de hoy" muestra un
      estado de error distinguible de "Sin ruta hoy", con opción de reintentar.
- [ ] Si `useFieldOrders` devuelve `errorMessage`, la card "Pedidos operativos" (y
      los conteos derivados en "Actividad reciente") muestran un estado de error en
      vez de "0".
- [ ] El estado de error es visible en un viewport de 375px sin recortes.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: mockear un 500/timeout en field/routes o field/orders (o cortar red en
# DevTools) y confirmar que el dashboard no confunde "error" con "sin ruta/pedidos".
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** este GAP absorbe GAP-V2-194 ("FieldDashboard ignora el
estado de error de useFieldRoutes/useFieldOrders", carril code-audit-agent) — mismo hallazgo
exacto confirmado independientemente por dos carriles (ui-audit-agent y code-audit-agent).
GAP-V2-194 queda `rejected` y redirige aquí.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-194 (fusionado aquí)
