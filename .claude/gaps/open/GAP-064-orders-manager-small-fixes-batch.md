# GAP-064 — Batch: token-as-parameter en useCustomerOrderHistoryRanges, queryKey inline en useOrders, import muerto

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Batch de 3 findings de baja/media complejidad detectados en la auditoría MIGRATE del módulo
orders manager (2026-07-01), no cubiertos por los GAPs 056-061 ya existentes de la auditoría
previa del mismo día.

### FND-A — Token-as-parameter en useCustomerOrderHistoryRanges.js (PL-010)

`src/hooks/useCustomerOrderHistoryRanges.js:69-70` extrae `session?.user?.accessToken` vía
`useSession()` y lo pasa como parámetro a `getCustomerOrderHistory` (línea 211) y
`getCustomerOrderHistoryRanges` (línea 129), ambas en `src/services/customerService.ts`.

Las dos funciones de `customerService.ts` afectadas:
```ts
export async function getCustomerOrderHistory(
  customerId: string | number,
  token: AuthToken,
  options: CustomerOrderHistoryOptions = {}
): Promise<CustomerOrderHistoryResponse> { /* ... */ }

export async function getCustomerOrderHistoryRanges(
  customerId: string | number,
  token: AuthToken
): Promise<CustomerOrderHistoryRangesResponse> { /* ... */ }
```

Ningún otro archivo del proyecto llama a estas dos funciones (único caller: este hook, más
`src/__tests__/hooks/useCustomerHistory.test.js` que las mockea) — cambio contenido.

### FND-B — queryKey inline en useOrders.js

`src/hooks/useOrders.js:15`:
```js
const queryKey = ['orders', tenantId ?? 'unknown'];
```
Array literal como queryKey — viola la regla ESLint `no-inline-query-keys` (rules/hooks.md).
No existe todavía una factory para "pedidos activos" en `src/lib/routes/queryKeys.ts`.
(Nota: GAP-056 ya corrigió el token-as-parameter de este mismo archivo, pero no tocó el
queryKey — son problemas independientes.)

### FND-C — Import muerto en admin/orders/[id]/page.js

`src/app/admin/orders/[id]/page.js:1`:
```js
import Order from '@/components/Admin/OrdersManager/Order';
import OrderClient from './OrderClient';

export default async function OrderPage({ params }) {
  const { id } = await params;
  return <OrderClient orderId={id} />;
}
```
`Order` se importa pero nunca se usa — solo se renderiza `OrderClient`. GAP-050 verificó
este archivo (confirmó que ya era Server Component correcto) pero no detectó este import
muerto.

## Solución acordada

### FND-A

1. En `customerService.ts`: aplicar el mismo patrón que GAP-056/057 — añadir
   `const token = await getAuthToken()` internamente en `getCustomerOrderHistory` y
   `getCustomerOrderHistoryRanges`, eliminar el parámetro `token` de ambas firmas.
2. En `useCustomerOrderHistoryRanges.js`: eliminar `useSession` import y la extracción de
   `token`; actualizar las 2 llamadas eliminando el argumento `token`.
3. Actualizar `src/__tests__/hooks/useCustomerHistory.test.js` — los mocks ya no reciben
   `token` como segundo/tercer argumento; ajustar aserciones de argumentos si las hay.

### FND-B

1. Añadir factory a `src/lib/routes/queryKeys.ts`:
   ```ts
   export const orderListKeys = {
     active: (tenantId: string | null | undefined) =>
       ['orders', 'active', tenantId ?? 'unknown'] as const,
   };
   ```
2. En `useOrders.js`: reemplazar el array literal por `orderListKeys.active(tenantId)`.

### FND-C

Eliminar la línea `import Order from '@/components/Admin/OrdersManager/Order';` de
`src/app/admin/orders/[id]/page.js`.

## Referencias e inspiración

- PL-010 (project-learnings.md): patrón token-as-parameter, mismo fix aplicado en GAP-056/057
- PL-017: verificar dependency arrays huérfanos tras eliminar `token`/`session`
- rules/hooks.md: regla ESLint `no-inline-query-keys`
- GAP-050: precedente de verificación de este mismo archivo (admin/orders/[id]/page.js)

## Criterios de aceptación

- [ ] `customerService.ts`: `getCustomerOrderHistory` y `getCustomerOrderHistoryRanges` no
      reciben `token` como parámetro — lo obtienen internamente con `getAuthToken()`
- [ ] `useCustomerOrderHistoryRanges.js` no importa `useSession` ni extrae `accessToken`
- [ ] `src/__tests__/hooks/useCustomerHistory.test.js` actualizado y en verde
- [ ] `orderListKeys.active` existe en `src/lib/routes/queryKeys.ts`
- [ ] `useOrders.js` usa `orderListKeys.active(tenantId)` — sin array literal inline
- [ ] `src/app/admin/orders/[id]/page.js` no importa `Order` sin usarlo
- [ ] `npm run type-check` y `npm run lint` pasan sin errores
- [ ] El historial de pedidos de cliente (CRM) y el listado de pedidos activos siguen
      funcionando igual

## Archivos a crear o modificar

**Modificar:**
- `src/services/customerService.ts` — `getCustomerOrderHistory` y `getCustomerOrderHistoryRanges` a `getAuthToken()` interno
- `src/hooks/useCustomerOrderHistoryRanges.js` — eliminar `useSession`/token
- `src/__tests__/hooks/useCustomerHistory.test.js` — ajustar mocks/aserciones
- `src/lib/routes/queryKeys.ts` — añadir `orderListKeys`
- `src/hooks/useOrders.js` — usar `orderListKeys.active(tenantId)`
- `src/app/admin/orders/[id]/page.js` — eliminar import muerto de `Order`

## Restricciones

- No renombrar `useCustomerOrderHistoryRanges.js` ni `useOrders.js` a `.ts` en este GAP
  (scope de GAP-061)
- No modificar la lógica de negocio de filtrado de fechas/rangos en
  `useCustomerOrderHistoryRanges.js` — solo el manejo del token
- No cambiar el nombre `queryKey` ['orders', ...] a otro dominio distinto de "active orders"
  sin confirmar — mantener compatibilidad con cualquier invalidación existente que dependa de él
- Verificar dependency arrays con grep tras eliminar `token`/`session` (PL-017)

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
