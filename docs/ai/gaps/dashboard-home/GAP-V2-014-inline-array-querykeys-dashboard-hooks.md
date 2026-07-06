---
id: GAP-V2-014
title: queryKey con arrays literales en 3 hooks del dashboard — viola la regla ESLint activa de factories
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/hooks/useSpeciesOptions.js
  - src/hooks/useDailyCalibersBySpecies.js
  - src/hooks/usePunches.js
  - src/lib/routes/queryKeys.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-014 — queryKeys con arrays literales en hooks del dashboard

## Problema

El proyecto tiene una regla ESLint activa (`eslint.config.mjs:8-15`) que prohíbe arrays
literales como `queryKey`, exigiendo el uso de factories de `src/lib/routes/queryKeys.ts`
(documentado también en `.claude/rules/hooks.md`). Está configurada como `'warn'`, por lo
que no bloquea el build, y estos 3 hooks del módulo dashboard-home la incumplen sin que
nadie lo haya corregido:

```js
// src/hooks/useSpeciesOptions.js:18
queryKey: ['species', 'options', tenantId ?? 'unknown'],
```

```js
// src/hooks/useDailyCalibersBySpecies.js:19-24
queryKey: [
  'raw-material-receptions',
  'daily-calibers-by-species',
  date,
  isAll ? 'all' : numericSpeciesId,
],
```

```js
// src/hooks/usePunches.js:20 y :46
queryKey: ['punches', 'dashboard', tenantId ?? 'unknown'],
queryKey: ['punches', 'statistics', tenantId ?? 'unknown', date_start, date_end],
```

Por contraste, todos los demás hooks de este mismo módulo (`useOrdersStats.ts`,
`useStockStats.ts`, `useDashboardCharts.ts`, `useProductOptions.js` para category/family)
sí usan factories correctamente (`orderStatKeys`, `storeQueryKeys`, `auxiliaryLineStatKeys`,
`productCategoryOptionKeys`, etc.), lo que confirma que es una omisión puntual y no una
limitación de la regla.

No existe hoy ninguna factory para `species options`, `daily-calibers-by-species` ni
`punches` en `queryKeys.ts` — hay que crearlas.

## Objetivo

Los 3 hooks usan factories de `queryKeys.ts`, sin warnings de ESLint restantes en este
módulo para la regla `no-restricted-syntax` de `queryKey`.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`. Bajo riesgo — cambio
mecánico de queryKey, sin impacto funcional (las keys generadas deben ser equivalentes en
estructura para no invalidar cachés existentes de forma inesperada, aunque al ser un cambio
de key el cache simplemente se refetch una vez, lo cual es aceptable).

## Solución propuesta

1. Añadir a `src/lib/routes/queryKeys.ts`:
   - `speciesOptionKeys.list(tenantId)`
   - `dailyCalibersBySpeciesKeys.detail(tenantId, date, speciesId)`
   - `punchKeys.dashboard(tenantId)` y `punchKeys.statistics(tenantId, dateStart, dateEnd)`
2. Reemplazar los arrays literales en los 3 hooks por las factories nuevas.
3. Confirmar que `npm run lint` no reporta más warnings de `no-restricted-syntax` para estos
   archivos.

## Criterios de aceptación

- [ ] `useSpeciesOptions.js`, `useDailyCalibersBySpecies.js` y `usePunches.js` usan factories
- [ ] Nuevas factories añadidas siguiendo el patrón existente en `queryKeys.ts`
- [ ] `npm run lint` sin warnings de `no-restricted-syntax` en estos 3 archivos

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: recargar /admin/home y confirmar que las cards de especies, calibres diarios
# y trabajadores siguen cargando datos correctamente (para descartar problemas de cache)
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
