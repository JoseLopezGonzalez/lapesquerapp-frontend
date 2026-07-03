---
id: GAP-V2-028
title: orderService.ts duplica manualmente headers/token/parseo de error en 35 funciones
module: orders
category: architecture-refactor
priority: P2
risk: medium
size: L
status: blocked
dependencies: []
target_files:
  - src/services/orderService.ts
created_at: 2026-07-03
updated_at: 2026-07-03
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

**Bloqueado por `gap-normalizer` (2026-07-03):** GAP de tamaño `L` — según la
regla del skill, no puede quedar `ready` sin autorización explícita de Jose.
El contenido está completo (problema, objetivo, solución, criterios de
aceptación y plan de validación verificables) y no depende de ninguna decisión
de negocio, solo del visto bueno de Jose para acometer un cambio de este
tamaño en `orderService.ts`. Alternativa a la autorización directa: dividir en
sub-GAPs más pequeños por grupo de funciones (CRUD / estadísticas /
exportación) antes de implementar, igual que ocurrió con GAP-V2-001 →
GAP-V2-022/023/024/025 — el propio implementador puede optar por esa vía si
Jose prefiere no autorizar el GAP L completo de una sola vez.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-004 (migración del wrapper legacy, archivo distinto),
  GAP-V2-029 (token-as-parameter en 3 funciones de export de rentabilidad, mismo
  archivo)
