---
id: GAP-V2-013
title: Funciones de formateo "nullable" y formatDateRange duplicadas localmente en 4 widgets en vez de un helper compartido
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js
  - src/components/Admin/Dashboard/OrdersProfitabilityProductsCard/index.js
  - src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx
  - src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx
  - src/helpers/formats/numbers/formatNumbers.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-013 — Formatters "nullable" y `formatDateRange` reimplementados en cada widget

## Problema

Las mismas funciones utilitarias de formato están redefinidas de forma local e idéntica (o
casi idéntica) en varios widgets en vez de vivir una sola vez en
`src/helpers/formats/numbers/formatNumbers.ts` (o un helper de fechas equivalente):

```js
// src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js:24-30
function formatNullableCurrency(value) {
  return typeof value === 'number' ? formatDecimalCurrency(value) : '—';
}
function formatNullablePercentage(value) {
  return typeof value === 'number' ? `${formatDecimal(value)} %` : '—';
}
```

```js
// src/components/Admin/Dashboard/OrdersProfitabilityProductsCard/index.js:39-49
function formatNullableCurrency(value) { ... }           // idéntica
function formatNullableCurrencyPerKg(value) { ... }
function formatNullablePercentage(value) { ... }          // idéntica
```

Y `formatDateRange` está redefinida por separado en:

- `src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx:25-29`
- `src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx:12-16`
- `src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js:17-22` (con firma
  ligeramente distinta: maneja `!from || !to` con fallback de texto, las otras dos no)

Al estar duplicadas, cualquier corrección (p. ej. cambiar el separador `—` por otro símbolo,
o localizar el formato de fecha) requiere tocar 3-4 archivos y ya hay divergencia de
comportamiento entre copias (una maneja `from`/`to` vacíos, las otras asumen que siempre
llegan valores válidos).

## Objetivo

Un único punto de verdad para `formatNullableCurrency`, `formatNullablePercentage`,
`formatNullableCurrencyPerKg` y `formatDateRange`, importado desde
`@/helpers/formats/numbers/formatNumbers` (o un nuevo helper de fechas si corresponde),
usado por los 4 widgets.

## Contexto

Encontrado durante la auditoría de code-quality de `dashboard-home`. Bajo riesgo, tamaño
pequeño — buen candidato para resolver junto con GAP-V2-021 (migración JS→TS por lotes) si
se decide abordarlos en el mismo PR, pero no depende de él.

## Solución propuesta

1. Añadir `formatNullableCurrency`, `formatNullableCurrencyPerKg`, `formatNullablePercentage`
   a `src/helpers/formats/numbers/formatNumbers.ts` (tipados: `(value: number | null | undefined) => string`).
2. Añadir `formatDateRange(from: string, to: string): string` a un helper de fechas
   compartido (revisar si ya existe algo equivalente en `src/helpers/dates`).
3. Reemplazar las 4 definiciones locales por imports del helper compartido.

## Criterios de aceptación

- [ ] Ninguno de los 4 widgets define localmente estas funciones
- [ ] El comportamiento visual no cambia (incluyendo el caso `from`/`to` vacío)
- [ ] `npm run lint` y `npm run type-check` limpios

## Plan de validación

```text
npm run lint
npm run type-check
npm run test:run
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
