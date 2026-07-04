---
id: GAP-V2-028
title: orderService.ts duplica manualmente headers/token/parseo de error en 35 funciones
module: orders
category: architecture-refactor
priority: P2
risk: medium
size: L
status: done
dependencies: []
target_files:
  - src/services/orderService.ts
  - src/__tests__/services/orderService.test.js
created_at: 2026-07-03
updated_at: 2026-07-04
---

# GAP-V2-028 — `orderService.ts` no usa la capa de helpers genéricos; duplica boilerplate 35 veces

## Problema

`src/services/orderService.ts` (1383 líneas, ~35 funciones exportadas) llama a
`fetchWithTenant` directamente en cada función, en vez de pasar por los helpers
genéricos descritos en `.claude/rules/api-client.md`
(`fetchEntitiesGeneric`/`createEntityGeneric`/`editEntityGeneric`/`deleteEntityGeneric`/`performActionGeneric`).
Como resultado, el mismo bloque se repite literalmente:

```ts
const token = await getAuthToken();
const response = await fetchWithTenant(`${API_URL_V2}...`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'User-Agent': getUserAgent(),
  },
});
```

Conteo real en el archivo:

- `Authorization: \`Bearer ${token}\`` aparece **35 veces**.
- `getUserAgent()` aparece **35 veces**.
- `await getAuthToken()` aparece **32 veces**.
- `await response.json()` (parseo manual de error, sin pasar por
  `handleServiceResponse`) aparece **37 veces** — algunas funciones sí usan
  `handleServiceResponse` (import ya presente en el archivo, línea 9), pero
  muchas otras reimplementan el mismo `if (!response.ok) { ... throw ... }` a
  mano en su lugar (p.ej. `updateOrder` líneas 375-382, `getActiveOrders` líneas
  421-424, `createOrder` líneas 1372-1379).

Esto es arquitectura inconsistente dentro del propio archivo: unas funciones usan
`handleServiceResponse` centralizado, otras reimplementan el parseo de error
manualmente — no hay un único patrón. Cualquier cambio futuro en la construcción
de headers (por ejemplo añadir un header nuevo, o cambiar cómo se obtiene el
`User-Agent`) requiere tocar hasta 35 sitios en un único archivo, con alto riesgo
de dejar alguno desactualizado.

## Objetivo

`orderService.ts` construye la petición HTTP (headers, token, user-agent) en un
único punto interno reutilizado por todas las funciones, y usa
`handleServiceResponse` de forma consistente para el manejo de errores — sin
cambiar ningún endpoint, payload ni contrato de retorno público.

## Contexto

Este archivo nunca fue auditado directamente en la pasada anterior (`code-audit-agent`
se centró en los sub-hooks de `hooks/orders/*` y en `useOrderCostAnalysis`/
`useOrderOptions`, no en el service subyacente). El wrapper legacy
`src/services/domain/orders/orderService.js` sí se migró en GAP-V2-004, pero es
un archivo distinto (wrapper de compatibilidad, no este service principal).

## Solución propuesta

1. Crear un helper interno privado (no exportado), p.ej.
   `async function orderFetch(url: string, options: RequestInit = {})`, que:
   - obtiene el token con `getAuthToken()`,
   - construye los headers comunes (`Content-Type`, `Authorization`, `User-Agent`)
     fusionados con cualquier header específico pasado en `options`,
   - llama a `fetchWithTenant`,
   - devuelve la `Response` sin parsear (cada función decide cómo parsear según su
     tipo de retorno: JSON, blob, etc.).
2. Sustituir las 35 llamadas directas a `fetchWithTenant` por este helper.
3. Unificar el manejo de errores usando `handleServiceResponse` donde el patrón de
   retorno lo permita; documentar con un comentario los casos que no puedan
   unificarse (p.ej. descargas de blob con `content-disposition`).
4. No tocar los 3 casos de `token: AuthToken` como parámetro explícito
   (`createOrdersProfitabilityExportJob`, `getOrdersProfitabilityExportJob`,
   `downloadOrdersProfitabilityExportJob`) en este GAP — esos se cubren en
   GAP-V2-029 porque además son código muerto en producción.

## Criterios de aceptación

- [ ] No quedan más de 1-2 ocurrencias literales de
      `Authorization: \`Bearer ${token}\`` en el archivo (la del helper interno y,
      si aplica, la de los 3 casos legacy de GAP-V2-029).
- [ ] Todas las funciones migradas mantienen su firma pública y tipo de retorno
      exactamente igual (sin romper `useOrders.ts`, `useOrdersStats.ts`,
      `useComercialOrders.ts` ni ningún otro caller).
- [ ] `src/__tests__/services/orderService.test.js` sigue pasando sin modificar
      sus expectativas de negocio (puede requerir ajustar mocks si cambia la forma
      de llamar a `fetchWithTenant`, pero no el comportamiento observable).
- [ ] `npm run type-check`, `npm run lint` y `npm run test:run` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
npm run build
# Manual: revisar que listado, detalle, edición, estadísticas y exportaciones de
# pedidos siguen funcionando (smoke test de /admin/orders y /admin/orders-manager).
```

## Notas de implementación

**Desbloqueado por Jose (2026-07-03):** autorizado explícitamente el refactor de tamaño `L`
completo, sin dividir en sub-GAPs — implementar como un único GAP siguiendo exactamente la
solución propuesta (helper interno `orderFetch`, migrar las 35 llamadas, unificar
`handleServiceResponse`). Pasa a `ready`. Dado su tamaño/riesgo (L/medium), tratar como
implementación dedicada con su propio ciclo `type-check`/`lint`/`test:run`/`build` completo
y verificación de `gap-auditor` — no combinar en el mismo commit que otros GAPs.

## Resultado

Implementado exactamente según la solución propuesta:

- Se creó el helper interno privado `orderFetch(url, options)` en
  `src/services/orderService.ts`, que obtiene el token con `getAuthToken()`,
  fusiona los headers comunes (`Content-Type`, `Authorization`, `User-Agent`)
  con los headers específicos de cada llamada, y delega en `fetchWithTenant`
  devolviendo la `Response` sin parsear.
- Las 35 llamadas directas a `fetchWithTenant` se sustituyeron por `orderFetch`.
  Ahora solo queda **1** ocurrencia literal de `` Authorization: `Bearer ${token}` ``
  en todo el archivo (dentro del propio helper).
- Se unificó el manejo de errores con `handleServiceResponse` en todas las
  funciones cuyo contrato de retorno lo permitía (listados, detalle, líneas
  auxiliares, incidencias, estadísticas, rentabilidad, etc.).
- Se documentaron con comentario los 4 casos que no se unifican con
  `handleServiceResponse`, tal y como preveía el GAP:
  - `updateOrder` y `createOrder` mantienen el parseo manual con `ApiError`
    porque `OrderEditSheet` y `CreateOrderForm` dependen de
    `error.status === 422` / `error.data.errors` para mapear errores 422 a los
    campos del formulario (`handleServiceResponse` lanza un `Error` genérico
    sin esas propiedades).
  - `downloadActivePlannedProductsXls` y `downloadOrdersProfitabilityExportJob`
    son descargas de blob (una con error simple, otra con nombre de fichero
    leído de `content-disposition`) — no encajan en el contrato JSON de
    `handleServiceResponse`.
- Ningún endpoint, payload ni contrato de retorno público cambió.
- Se ajustaron 4 mocks en `src/__tests__/services/orderService.test.js`
  (`getActiveOrders` ×3, `setOrderStatus` ×1) para incluir `headers.get(...)`
  en la respuesta simulada, ya que ahora esas funciones pasan por
  `handleServiceResponse`, que lee `content-type` incluso en la rama de éxito.
  No se modificó ninguna expectativa de negocio — solo la forma del mock.

Validación:

- `npm run type-check` — limpio.
- `npm run lint` — 0 errores (warnings preexistentes en otros archivos, ninguno en `orderService.ts`).
- `npm run test:run` — mismos 22 fallos preexistentes en 11 ficheros no relacionados
  (confirmado comparando contra el baseline con `git stash`); los 20 tests de
  `orderService.test.js` pasan.
- `npm run build` — build de producción completo sin errores.

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-004 (migración del wrapper legacy, archivo distinto),
  GAP-V2-029 (token-as-parameter en 3 funciones de export de rentabilidad, mismo
  archivo)
