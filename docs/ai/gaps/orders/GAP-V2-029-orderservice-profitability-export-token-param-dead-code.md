---
id: GAP-V2-029
title: Recurrencia de PL-010 (token-as-parameter) + código muerto en 3 funciones de export de rentabilidad
module: orders
category: code-quality
priority: P2
risk: low
size: S
status: done
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

**Acción por defecto (no requiere esperar a Jose — resuelve el hallazgo de
código-calidad de forma segura y de bajo riesgo):**

1. Quitar el parámetro `token: AuthToken` de las 3 firmas, sustituir por
   `const token = await getAuthToken();` interno, igual que el resto del
   archivo.
2. Actualizar `src/__tests__/services/orderService.test.js` para dejar de pasar
   `token` como argumento en estas 3 llamadas.
3. Eliminar el tipo `AuthToken` si ya no lo usa ninguna función tras el cambio.

**Seguimiento opcional (no bloquea este GAP):** preguntar a Jose si existe un
plan de UI pendiente para la exportación asíncrona de rentabilidad (job +
polling). Si confirma que no hay plan, las 3 funciones y sus tipos
`OrdersProfitabilityExportJob*` pueden eliminarse como código muerto en un GAP
de seguimiento separado — no es necesario resolver esa pregunta para cerrar
este GAP, que se limita a corregir el patrón token-as-parameter.

## Criterios de aceptación

- [ ] Ninguna función de `orderService.ts` recibe el token como parámetro
      explícito — las 3 funciones de exportación de rentabilidad usan
      `getAuthToken()` internamente igual que el resto del archivo.
- [ ] `src/__tests__/services/orderService.test.js` actualizado y pasando.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
```

## Notas de implementación

Se internalizó `getAuthToken()` en las 3 funciones de exportación de
rentabilidad (`createOrdersProfitabilityExportJob`,
`getOrdersProfitabilityExportJob`, `downloadOrdersProfitabilityExportJob`),
igual que el resto del archivo. Se eliminó el tipo `AuthToken` (ya sin uso) y
se actualizaron las 3 llamadas correspondientes en
`src/__tests__/services/orderService.test.js` para dejar de pasar `token`
como argumento explícito (el mock de `getAuthToken` ya cubre el valor
esperado en las aserciones de `Authorization`). No se eliminó código muerto:
sigue pendiente la pregunta a Jose sobre si hay plan de UI para la
exportación asíncrona de rentabilidad (fuera de alcance de este GAP).

## Resultado

`npm run type-check` y `npm run lint` limpios (0 errores). Test suite de
`orderService.test.js` en verde (20/20). Sin cambios de comportamiento en
runtime — las 3 funciones siguen requiriendo un token válido, solo cambia de
dónde lo obtienen.

## Resultado de auditoría

Veredicto: `done`.

Auditoría con contexto limpio confirma: las 3 funciones
(`createOrdersProfitabilityExportJob`, `getOrdersProfitabilityExportJob`,
`downloadOrdersProfitabilityExportJob`, `src/services/orderService.ts:1117-1187`)
ya no reciben `token` como parámetro — internamente hacen
`const token = await getAuthToken();` igual que las 32 funciones restantes del
archivo (verificado con grep, no queda ningún caller pasando `token`
explícito). El tipo `AuthToken` fue eliminado (`grep -n AuthToken` no devuelve
resultados). `src/__tests__/services/orderService.test.js` ya no pasa `token`
en las 3 llamadas (líneas 247, 293, 324) y sigue usando `token` solo como
valor esperado en las aserciones de `Authorization`. Re-ejecutado
`npx vitest run src/__tests__/services/orderService.test.js`: 20/20 en verde.
`npm run type-check` limpio. Sin desviación entre notas de implementación y
código real.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-005 (misma recurrencia de PL-010 en hooks de
  formulario), GAP-028 (histórico, cobertura parcial del mismo archivo),
  GAP-V2-028 (duplicación de boilerplate en el resto del archivo)
