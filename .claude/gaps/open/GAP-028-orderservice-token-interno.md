# GAP-028 — Eliminar token-as-parameter de orderService.ts (stats/charts)

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`src/services/orderService.ts` contiene **9 funciones** de estadísticas y gráficos que
aceptan `token: AuthToken` como parámetro. Los hooks que las consumen
(`useOrdersStats.ts` y `useDashboardCharts.ts`) extraen el token de `useSession()`
y lo pasan manualmente — anti-patrón PL-NEW-C.

Funciones afectadas en `orderService.ts` (token-as-parameter):
- `getOrdersTotalNetWeightStats(params, token)`
- `getOrdersTotalAmountStats(params, token)`
- `getOrderRankingStats(params, token)`
- `getSalesBySalesperson(params, token)`
- `getOrdersProfitabilitySummary(params, token)`
- `getOrdersProfitabilityTimeline(params, token)`
- `getOrdersProfitabilityProducts(params, token)`
- `getSalesChartData({ token, speciesId, ...params })` — token dentro del objeto de params
- `getTransportChartData({ token, from, to })` — token dentro del objeto de params

Hooks afectados:
- `useOrdersStats.ts`: 7 hooks — todos con `useSession`, `token as string`, queryKeys inline
  - `useOrdersTotalNetWeightStats`, `useOrdersTotalAmountStats`, `useOrderRankingStats`
  - `useSalesBySalesperson`, `useOrdersProfitabilitySummary`
  - `useOrdersProfitabilityTimeline`, `useOrdersProfitabilityProducts`
- `useDashboardCharts.ts`: 2 hooks afectados (`useSalesChartData`, `useTransportChartData`)

Bug adicional detectado: `status` (string de sesión: `'loading'|'authenticated'|'unauthenticated'`)
está incluido en los `queryKey` de varios hooks, lo que causa refetch innecesario en
transiciones de auth. `status` solo debe estar en `enabled`, nunca en `queryKey`.

Nota: `orderService.ts` ya importa `getAuthToken` (línea 8) y algunas funciones lo
usan correctamente. Solo se migran las 9 funciones con el patrón antiguo.

Nota: `useReceptionChartData` y `useDispatchChartData` en `useDashboardCharts.ts`
tienen el mismo patrón pero afectan servicios distintos — fuera de scope de este GAP.

## Solución acordada

1. En `orderService.ts` — para cada una de las 9 funciones:
   - Eliminar `token` del parámetro o del objeto de params
   - Añadir `const token = await getAuthToken()` al inicio de la función
   - Para `getSalesChartData` y `getTransportChartData`: eliminar el campo `token`
     de la interfaz `SalesChartParams` y del objeto de parámetros

2. Añadir factories `orderStatKeys` y `orderChartKeys` a `queryKeys.ts`:
   ```ts
   export const orderStatKeys = {
     totalNetWeight: (tenantId, dateFrom, dateTo) =>
       ['orders', 'totalNetWeight', tenantId ?? 'unknown', dateFrom, dateTo] as const,
     totalAmount: (tenantId, dateFrom, dateTo) =>
       ['orders', 'totalAmount', tenantId ?? 'unknown', dateFrom, dateTo] as const,
     ranking: (tenantId, dateFrom, dateTo, groupBy, valueType, speciesId) =>
       ['orders', 'ranking', tenantId ?? 'unknown', dateFrom, dateTo, groupBy, valueType, speciesId] as const,
     salesBySalesperson: (tenantId, dateFrom, dateTo) =>
       ['orders', 'salesBySalesperson', tenantId ?? 'unknown', dateFrom, dateTo] as const,
     profitabilitySummary: (tenantId, dateFrom, dateTo, productId) =>
       ['orders', 'profitabilitySummary', tenantId ?? 'unknown', dateFrom, dateTo, productId] as const,
     profitabilityTimeline: (tenantId, dateFrom, dateTo, granularity, productId) =>
       ['orders', 'profitabilityTimeline', tenantId ?? 'unknown', dateFrom, dateTo, granularity, productId] as const,
     profitabilityProducts: (tenantId, dateFrom, dateTo) =>
       ['orders', 'profitabilityProducts', tenantId ?? 'unknown', dateFrom, dateTo] as const,
   };

   export const orderChartKeys = {
     sales: (tenantId, from, to, speciesId, categoryId, familyId, unit, groupBy) =>
       ['sales', 'chart', tenantId ?? 'unknown', from, to, speciesId, categoryId, familyId, unit, groupBy] as const,
     transport: (tenantId, from, to) =>
       ['transport', 'chart', tenantId ?? 'unknown', from, to] as const,
   };
   ```

3. En `useOrdersStats.ts` — para los 7 hooks:
   - Eliminar `useSession` import y bloques `const token = ...`
   - Reemplazar `queryKey` inline por factories `orderStatKeys.*`
   - Eliminar `status` de los `queryKey` — solo debe estar en `enabled`
   - Actualizar `enabled` de `!!token && !!tenantId` a `!!tenantId`

4. En `useDashboardCharts.ts` — para `useSalesChartData` y `useTransportChartData`:
   - Eliminar extracción de token de `useSession`
   - Actualizar llamadas a `getSalesChartData` y `getTransportChartData` (sin `token`)
   - Reemplazar `queryKey` inline por `orderChartKeys.*`
   - Eliminar `status` de los `queryKey` en `useTransportChartData`

## Referencias e inspiración

- PL-NEW-C (project-learnings.md): tokens NUNCA se pasan como parámetros desde hooks a services.
- IMPORTANT finding de auditoría: `status` en queryKey causa refetch extra en auth transitions.
- rules/hooks.md: `enabled: !!tenantId && enabled` — el token no forma parte de `enabled`.
- GAP-027 como precedente exacto (mismo patrón aplicado a storeService.ts).

## Criterios de aceptación

- [ ] Las 9 funciones afectadas de `orderService.ts` no aceptan `token` como parámetro ni en objeto de params
- [ ] Las 9 funciones llaman a `getAuthToken()` internamente
- [ ] `SalesChartParams` interface no contiene el campo `token`
- [ ] Existen factories `orderStatKeys` y `orderChartKeys` en `queryKeys.ts`
- [ ] `useOrdersStats.ts` no importa `useSession`
- [ ] `useOrdersStats.ts` no incluye `status` en ningún `queryKey`
- [ ] `useDashboardCharts.ts` — `useSalesChartData` y `useTransportChartData` no extraen token
- [ ] `useDashboardCharts.ts` — `useTransportChartData` no incluye `status` en `queryKey`
- [ ] `enabled` en los 7 hooks de `useOrdersStats.ts` no depende de `!!token`
- [ ] Las interfaces públicas de los hooks no cambian
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Modificar:**
- `src/services/orderService.ts` — eliminar token-as-parameter en 9 funciones
- `src/lib/routes/queryKeys.ts` — añadir `orderStatKeys` y `orderChartKeys`
- `src/hooks/useOrdersStats.ts` — usar service sin token, factories queryKey, eliminar status de keys
- `src/hooks/useDashboardCharts.ts` — usar service sin token en useSalesChartData y useTransportChartData

## Restricciones

- Solo tocar las 9 funciones con token-as-parameter — no refactorizar todo `orderService.ts`
- `useReceptionChartData` y `useDispatchChartData` en `useDashboardCharts.ts` fuera de scope
- No cambiar las interfaces públicas de retorno de los hooks
- No tocar `src/hooks/useOrder.js` ni `src/services/domain/orders/orderService.js` (archivos protegidos/legacy)
- No añadir tests en este GAP

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
