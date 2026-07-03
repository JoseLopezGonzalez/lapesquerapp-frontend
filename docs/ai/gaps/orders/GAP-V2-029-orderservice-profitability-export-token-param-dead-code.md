---
id: GAP-V2-029
title: Recurrencia de PL-010 (token-as-parameter) + código muerto en 3 funciones de export de rentabilidad
module: orders
category: code-quality
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/services/orderService.ts
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-029 — Token-as-parameter recurrente y sin caller real en 3 funciones de `orderService.ts`

## Problema

`src/services/orderService.ts` obtiene el token internamente con
`await getAuthToken()` en 32 de sus ~35 funciones — el patrón correcto según
`.claude/rules/api-client.md`. Las 3 excepciones son:

- `createOrdersProfitabilityExportJob(params, token: AuthToken)` (línea 1120-1123)
- `getOrdersProfitabilityExportJob(id, token: AuthToken)` (línea 1150-1153)
- `downloadOrdersProfitabilityExportJob(downloadUrl, token: AuthToken)` (línea
  1179-1182)

Estas tres reciben el token como parámetro explícito en vez de llamarlo
internamente — la recurrencia exacta de PL-010 (`.claude/project-learnings.md`)
que ya se corrigió en este mismo módulo para otros hooks (GAP-V2-005) y en el
propio `orderService.ts` para otras funciones (GAP-028 histórico,
`.claude/gaps/closed/GAP-028-orderservice-token-interno.md`). El tipo `AuthToken`
(línea 13) incluso lo documenta con un comentario explícito:

```ts
/** Auth token for API requests — used by profitability export functions still pending migration */
type AuthToken = string;
```

Es decir, es deuda ya conocida por quien escribió el código, pero sin GAP de
seguimiento hasta ahora.

Además, una búsqueda de estas 3 funciones en todo `src/` (excluyendo tests) no
encuentra ningún caller real:

```
$ grep -rln "createOrdersProfitabilityExportJob|getOrdersProfitabilityExportJob|downloadOrdersProfitabilityExportJob" src --include=*.tsx --include=*.ts --include=*.jsx --include=*.js
src/services/orderService.ts
src/__tests__/services/orderService.test.js
```

Solo `src/__tests__/services/orderService.test.js` las ejercita — ningún
componente ni hook de producción las invoca hoy. Son una API de exportación
asíncrona (job + polling + descarga) construida pero no conectada a ninguna UI.

## Objetivo

Las 3 funciones obtienen el token internamente con `getAuthToken()` igual que el
resto del archivo, y se confirma explícitamente si siguen siendo necesarias sin
caller (feature pendiente de UI) o si deben eliminarse como código muerto.

## Contexto

No confundir con GAP-V2-028 (que cubre la duplicación de boilerplate de headers
en las 32 funciones restantes) — este GAP es específico de las 3 funciones con
token-as-parameter y su ausencia de caller real.

## Solución propuesta

1. Confirmar con Jose si existe un plan de UI pendiente para la exportación
   asíncrona de rentabilidad (job + polling). Si sí, mantener las funciones y
   continuar con el paso 2. Si no, evaluar eliminarlas junto con el tipo
   `AuthToken` y los tipos `OrdersProfitabilityExportJob*` asociados.
2. Si se mantienen: quitar el parámetro `token: AuthToken` de las 3 firmas,
   sustituir por `const token = await getAuthToken();` interno, igual que el
   resto del archivo.
3. Actualizar `src/__tests__/services/orderService.test.js` para dejar de pasar
   `token` como argumento en estas 3 llamadas.
4. Eliminar el tipo `AuthToken` si ya no lo usa ninguna función tras el cambio.

## Criterios de aceptación

- [ ] Ninguna función de `orderService.ts` recibe el token como parámetro
      explícito (todas usan `getAuthToken()` internamente), o las 3 funciones se
      eliminan junto con sus tipos si se confirma que son código muerto.
- [ ] `src/__tests__/services/orderService.test.js` actualizado y pasando.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
```

## Notas de implementación

{se rellena durante la implementación — la decisión de "mantener vs. eliminar"
debe registrarse aquí antes de implementar el resto.}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-005 (misma recurrencia de PL-010 en hooks de
  formulario), GAP-028 (histórico, cobertura parcial del mismo archivo),
  GAP-V2-028 (duplicación de boilerplate en el resto del archivo)
