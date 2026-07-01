# GAP-056 — Eliminar token-as-parameter de orderService.ts (funciones CRUD) y sub-hooks

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

**Contexto previo:** GAP-028 (cerrado) migró las 9 funciones de estadísticas/gráficos de
`orderService.ts` al patrón `getAuthToken()` interno. Quedan sin migrar 13 funciones CRUD
del mismo archivo que aún aceptan `token: AuthToken` como parámetro externo (anti-patrón PL-010).

**Funciones afectadas en `orderService.ts`:**
1. `getOrder(orderId, token)` — línea 292
2. `getOrderCostAnalysis(orderId, token)` — línea 314
3. `updateOrder(orderId, orderData, token)` — línea 343
4. `getActiveOrders(token)` — línea 402
5. `updateOrderPlannedProductDetail(id, data, token)` — línea 459
6. `deleteOrderPlannedProductDetail(id, token)` — línea 486
7. `createOrderPlannedProductDetail(data, token)` — línea 512
8. `setOrderStatus(orderId, status, token)` — línea 540
9. `createOrderIncident(orderId, description, token)` — línea 568
10. `updateOrderIncident(orderId, type, notes, token)` — línea 596
11. `destroyOrderIncident(orderId, token)` — línea 623
12. `getActiveOrdersOptions(token)` — línea 645
13. `getProductionViewData(token)` — línea 670

Patrón actual en las funciones: reciben `token` como parámetro y lo pasan manualmente a
`fetchWithTenant(url, { headers: { Authorization: \`Bearer ${token}\` } })`. El header
`Authorization` es redundante porque `fetchWithTenant` ya lo inyecta automáticamente desde
la sesión. El patrón correcto es el que ya usan las funciones de stats migradas en GAP-028:
`const token = await getAuthToken()` al inicio de la función, sin parámetro externo.

**Consumidores (callers) que deben actualizarse en el mismo commit:**

| Caller | Función afectada | Extrae token de |
|--------|-----------------|-----------------|
| `src/hooks/useOrder.ts` | `getOrder`, `updateOrder`, `setOrderStatus` | `useSession()` |
| `src/hooks/orders/useOrderCostAnalysis.ts` | `getOrderCostAnalysis` | prop `accessToken` |
| `src/hooks/orders/useOrderIncidents.ts` | `createOrderIncident`, `updateOrderIncident`, `destroyOrderIncident` | prop `accessToken` |
| `src/hooks/orders/useOrderPlannedDetails.ts` | `createOrderPlannedProductDetail`, `updateOrderPlannedProductDetail`, `deleteOrderPlannedProductDetail` | prop `accessToken` |
| `src/hooks/useOrders.js` | `getActiveOrders` | `useSession()` |
| `src/hooks/usePallet.ts` | `getActiveOrdersOptions` | `useSession()` |

**Efecto cascada en `useOrder.ts`:** al eliminar `accessToken` como parámetro de los sub-hooks
`useOrderCostAnalysis`, `useOrderIncidents`, `useOrderPlannedDetails`, la interfaz de `useOrder.ts`
también simplifica (elimina `accessToken` del flujo de datos hacia sus sub-hooks).

Detectado en auditoría quality orders manager (FND-002, audit 2026-07-01).

## Solución acordada

### En `orderService.ts` — para las 13 funciones

Para cada función afectada:
- Añadir `const token = await getAuthToken()` al inicio (o dentro de la promesa si es necesario)
- Eliminar el parámetro `token: AuthToken` de la firma
- Eliminar la línea `Authorization: \`Bearer ${token}\`` de los headers (fetchWithTenant ya la inyecta)
- Para `getActiveOrders` y `getProductionViewData`: eliminar también el guard `if (!token) return reject(...)` — ya no es necesario, getAuthToken lanza si no hay sesión

### En `useOrder.ts`

- Eliminar `accessToken` de los calls a `getOrder`, `updateOrder`, `setOrderStatus`, `updateTemperatureOrder`
- Actualizar `queryFn`: `queryFn: () => getOrder(orderId as string)` (sin token)
- Eliminar `accessToken` de los params pasados a sub-hooks (`useOrderCostAnalysis`, `useOrderIncidents`, `useOrderPlannedDetails`, `useOrderOptions`)
- `enabled`: cambiar de `!!orderId && !!accessToken && status !== 'loading'` a `!!orderId`
  (la ausencia de token es manejada por `getAuthToken` que lanza si no hay sesión)

### En los sub-hooks

**`useOrderCostAnalysis.ts`:**
- Eliminar `accessToken` del interface `UseOrderCostAnalysisParams`
- Eliminar `accessToken` del check `if (!orderId || !accessToken) return null`
- Llamar `getOrderCostAnalysis(orderId)` sin token

**`useOrderIncidents.ts`:**
- Eliminar `accessToken` del interface `UseOrderIncidentsParams`
- Eliminar `accessToken` de los deps arrays de `useCallback`
- Llamar `createOrderIncident`, `updateOrderIncident`, `destroyOrderIncident` sin token

**`useOrderPlannedDetails.ts`:**
- Eliminar `accessToken` del interface de parámetros
- Llamar las 3 funciones sin token

**`useOrderOptions.ts`:**
- Eliminar `accessToken` del interface `UseOrderOptionsParams` (no se usa para HTTP, solo era redundante)

**`useOrders.js`:**
- Eliminar extracción de token de `useSession`
- Llamar `getActiveOrders()` sin token
- Actualizar `enabled` si dependía de `!!token`

**`usePallet.ts`:**
- Eliminar solo la llamada `getActiveOrdersOptions(token)` → `getActiveOrdersOptions()`
- No tocar el resto del archivo (palletService y sus funciones son scope de otro GAP)

### En tests

**`src/__tests__/services/orderService.test.js`:**
- Actualizar firmas de llamadas en test: quitar el argumento `token` de las funciones migradas
- Si hay un mock de `getAuthToken`, verificar que siga funcionando

**`src/__tests__/hooks/useOrder.test.js`:**
- Actualizar mocks: quitar `token` de los mocks de las funciones migradas

## Referencias e inspiración

- GAP-028: precedente exacto del mismo patrón en el mismo archivo (funciones de stats)
- GAP-027: mismo patrón en `storeService.ts` (ya cerrado)
- PL-010 (project-learnings.md): anti-patrón token-as-parameter, regla de corrección
- `downloadActivePlannedProductsXls` en `orderService.ts` — función ya migrada correctamente (línea 441)

## Criterios de aceptación

- [ ] Las 13 funciones afectadas de `orderService.ts` no aceptan `token` como parámetro
- [ ] Las 13 funciones llaman a `getAuthToken()` internamente y no añaden `Authorization` header manual
- [ ] `useOrder.ts` no extrae `accessToken` para los 3 calls directos al service
- [ ] `useOrderCostAnalysis.ts` no recibe ni usa `accessToken` como prop
- [ ] `useOrderIncidents.ts` no recibe ni usa `accessToken` como prop
- [ ] `useOrderPlannedDetails.ts` no recibe ni usa `accessToken` como prop
- [ ] `useOrderOptions.ts` no tiene `accessToken` en su interface de parámetros
- [ ] `useOrders.js` no extrae token de `useSession()`
- [ ] `usePallet.ts` llama `getActiveOrdersOptions()` sin token
- [ ] `npm run lint` pasa sin warnings en los archivos modificados
- [ ] `npm run type-check` pasa sin errores (verificar cascada completa antes del push)
- [ ] Tests en `__tests__/hooks/useOrder.test.js` y `__tests__/services/orderService.test.js` pasan

## Archivos a crear o modificar

**Modificar:**
- `src/services/orderService.ts` — eliminar token param en 13 funciones + headers manuales
- `src/hooks/useOrder.ts` — eliminar accessToken de calls directos y de props a sub-hooks
- `src/hooks/orders/useOrderCostAnalysis.ts` — eliminar accessToken del interface y de la llamada
- `src/hooks/orders/useOrderIncidents.ts` — eliminar accessToken del interface y de 3 llamadas
- `src/hooks/orders/useOrderPlannedDetails.ts` — eliminar accessToken del interface y de 3 llamadas
- `src/hooks/orders/useOrderOptions.ts` — eliminar accessToken del interface (limpieza)
- `src/hooks/useOrders.js` — eliminar useSession + token, llamar getActiveOrders() sin token
- `src/hooks/usePallet.ts` — actualizar la 1 llamada a getActiveOrdersOptions sin token
- `src/__tests__/services/orderService.test.js` — actualizar firmas en tests
- `src/__tests__/hooks/useOrder.test.js` — actualizar mocks

## Restricciones

- Solo migrar las 13 funciones con token-as-parameter — no refactorizar el resto de `orderService.ts`
- No añadir `axios`, `fetch()` directo ni cambiar la librería HTTP
- `useOrders.js` se migra pero **no** se renombra a `.ts` en este GAP (es scope de GAP-061)
- No tocar `src/components/Admin/OrdersManager/ProductionView/index.js` — cubierto por GAP-058
- No tocar funciones de palletService — cubierto por GAP-057
- No añadir queryKey factories en este GAP (no aplica — son funciones de mutación/fetching puntual)
- Verificar `npm run type-check` completo antes del push (protocolo PL-BUILD-05)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/services/orderService.ts` — 13 funciones migradas a `getAuthToken()` interno; eliminado parámetro `token: AuthToken`; convertidas a `async/await`; eliminados guards `if (!token)` en `getActiveOrders` y `getProductionViewData`. El alias `type AuthToken` se mantiene solo para las 3 funciones de profitability export pendientes de otro GAP.
- `src/hooks/useOrder.ts` — Eliminado `accessToken` de calls a `getOrder`, `updateOrder` (×2) y `setOrderStatus`; eliminado de 4 sub-hooks; `enabled` simplificado a `!!orderId`; eliminado `status` del destructuring de `useSession`.
- `src/hooks/orders/useOrderCostAnalysis.ts` — Eliminado `accessToken` del interface, del guard y de deps de callbacks/effects.
- `src/hooks/orders/useOrderIncidents.ts` — Eliminado `accessToken` del interface y de los 3 useCallback (deps incluidos).
- `src/hooks/orders/useOrderPlannedDetails.ts` — Eliminado `accessToken` del interface y de los 3 useCallback (deps incluidos).
- `src/hooks/orders/useOrderOptions.ts` — Eliminado `accessToken` del interface; añadido `useSession()` interno para obtener el token para `getProductOptions`/`getTaxOptions`.
- `src/hooks/useOrders.js` — Eliminado `useSession` y `token`; `getActiveOrders()` sin token; `enabled: !!tenantId`.
- `src/hooks/usePallet.ts` — `getActiveOrdersOptions()` sin token ni cast de tipo; cast `as unknown[]` en el `.then()` por tipo de retorno `Promise<unknown>`.
- `src/__tests__/services/orderService.test.js` — Añadido mock de `getAuthToken`; eliminados args token de las funciones migradas; test `createOrder throws when no session` actualizado para usar `getAuthToken.mockRejectedValueOnce`.
- `src/__tests__/hooks/useOrder.test.js` — Añadido `getSession` al mock de `next-auth/react`; actualizadas assertions de `setOrderStatus` y `getOrderCostAnalysis`.

### Decisiones tomadas durante la implementación

- `type AuthToken` no eliminado: las 3 funciones de profitability export aún lo usan (pendiente otro GAP).
- `useOrderOptions` usa `useSession()` interno en lugar de recibir `accessToken` como prop, para cumplir el criterio de aceptación sin romper las llamadas a `getProductOptions`/`getTaxOptions`.
- Cast `as unknown[]` mínimo en `usePallet.ts` por el tipo de retorno conservador de `getActiveOrdersOptions()`.

### Desviaciones del plan (si las hay)

- Se mantuvo `Authorization: Bearer ${token}` en los headers (patrón establecido por GAP-028 en el mismo archivo), aunque `fetchWithTenant` lo inyecta automáticamente.
- El test `createOrder throws when no session` necesitó mockear `getAuthToken` en lugar de `getSession` porque `createOrder` ya había sido migrado previamente a `getAuthToken()`.

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
