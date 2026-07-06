---
id: GAP-V2-133
title: useReceptionsList.js usa un array literal como queryKey, violando la regla ESLint activa — migrar a .ts con factory
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/hooks/useReceptionsList.js
  - src/lib/routes/queryKeys.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-133 — `useReceptionsList` con array literal en `queryKey` (sin factory) y sin migrar a `.ts`

## Problema

`src/hooks/useReceptionsList.js:19` construye el `queryKey` como array literal inline:

```js
queryKey: ['receptions', 'list', tenantId ?? 'unknown', page, today],
```

Esto viola directamente la regla ESLint activa del proyecto
(`eslint.config.mjs:8-15`, `no-restricted-syntax` sobre `Property[key.name='queryKey'] >
ArrayExpression`) y el patrón documentado en `.claude/rules/hooks.md` § Query Keys, que exige
usar siempre una factory de `src/lib/routes/queryKeys.ts`.

El contraste es directo con su hermano funcional en el mismo módulo,
`src/hooks/useDispatchesList.ts:16`, que sí usa correctamente una factory:

```ts
queryKey: dispatchQueryKeys.list(tenantId, page, today as string),
```

`useDispatchesList.ts` ya está migrado a TypeScript; `useReceptionsList.js` sigue en `.js` —
es el único hook de listado de este módulo sin migrar, pese a compartir estructura casi
idéntica con su equivalente ya migrado. Además, no existe hoy ninguna factory `reception*Keys`
en `queryKeys.ts` — solo existe `receptionChartKeys` (para un widget distinto, no para el
listado del dashboard operario).

## Objetivo

`useReceptionsList` usa una factory de `queryKeys.ts` (igual que `dispatchQueryKeys`) y está
migrado a `.ts`, siguiendo exactamente el patrón ya validado por su hermano `useDispatchesList`.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`. Bajo riesgo: cambio mecánico
de tipado y de construcción de `queryKey`, sin cambio de comportamiento funcional. Referenciado
también desde GAP-V2-111 (estado de error ignorado en `ReceptionsListCard`/`DispatchesListCard`)
como una migración recomendada a aprovechar en el mismo commit si Jose lo aprueba.

## Solución propuesta

1. Añadir a `src/lib/routes/queryKeys.ts` una factory `receptionQueryKeys` con la misma forma
   que `dispatchQueryKeys` (`listPrefix(tenantId)` y `list(tenantId, page, today)`).
2. Renombrar `useReceptionsList.js` → `useReceptionsList.ts`, tipar sus parámetros y retorno
   (mismo contrato de retorno que ya tiene: `{ data, total, isLoading, error }`).
3. Reemplazar el array literal por `receptionQueryKeys.list(tenantId, page, today)`.
4. Confirmar que `OperarioDashboard` (ver GAP-V2-134) puede usar
   `receptionQueryKeys.listPrefix(tenantId)` en su invalidación en vez de un array hardcodeado.

## Criterios de aceptación

- [ ] `useReceptionsList.ts` existe (migrado desde `.js`), usa `receptionQueryKeys.list(...)`.
- [ ] Nueva factory `receptionQueryKeys` en `queryKeys.ts`, mismo patrón que `dispatchQueryKeys`.
- [ ] `npm run lint` sin warnings de `no-restricted-syntax` para este archivo.
- [ ] `npm run type-check` limpio.
- [ ] El archivo `.js` original no existe tras el renombrado.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: recargar /operator, /warehouse/[storeId] y /admin/home (rol operario) y confirmar
# que la card de Recepciones de Materia Prima sigue cargando datos correctamente.
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** GAP-V2-115 ("queryKeys inline en handleRefresh y
useReceptionsList.js sin factory ni migración a TS", carril ui-audit-agent) cubría el mismo
hallazgo de `useReceptionsList.js` mezclado con el hallazgo de invalidación de
`OperarioDashboard` (ver GAP-V2-134). Ambos hallazgos ya estaban mejor separados por el carril
code-audit-agent en este GAP (133, hook) y en GAP-V2-134 (dashboard). GAP-V2-115 queda
`rejected`, dividido y fusionado en estos dos GAPs.

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-134 (invalidación con arrays hardcodeados en `OperarioDashboard`),
  GAP-V2-111 (estado de error ignorado en ambos list cards), GAP-V2-014 (mismo tipo de
  violación en otros hooks del dashboard, archivos distintos), GAP-V2-115 (fusionado aquí y en
  GAP-V2-134)
