---
id: GAP-V2-021
title: Patrón de null-check roto `data?.value !== null` — riesgo de crash en TotalQuantitySoldCard, inconsistente en TotalAmountSoldCard
module: dashboard-home
category: code-quality
priority: P1
risk: medium
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js
  - src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-021 — Comprobación `data?.value !== null` no protege correctamente contra `data` nulo

## Problema

`TotalQuantitySoldCard` decide qué rama renderizar con esta condición:

```js
// src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js:57-70
{data?.value !== null ? (
  <div>
    <h1 className="text-3xl font-medium tracking-tight">
      {formatDecimalWeight(data.value)}
    </h1>
    ...
```

El hook (`useOrdersTotalNetWeightStats`, en `useOrdersStats.ts:51-56`) devuelve
`data: data ?? null` — es decir, `data` puede ser `null` (no solo `data.value`). Cuando
`data` es `null`:

- `data?.value` se cortocircuita a `undefined` (por el optional chaining)
- `undefined !== null` evalúa a `true`
- La rama "hay datos" se ejecuta y accede a `data.value` **sin** optional chaining →
  `null.value` lanza `TypeError: Cannot read properties of null`

Esto puede ocurrir en la práctica: en TanStack Query v5, con `enabled: false` (p. ej.
`tenantId` momentáneamente `null` durante la hidratación SSR/CSR, algo que ya ocurre de
forma normal con `typeof window !== 'undefined' ? getCurrentTenant() : null`),
`isLoading` es `false` incluso con `data` sin resolver, porque `isLoading` en v5 requiere
`isFetching === true` además de `status === 'pending'`. El componente ya pasó el guard de
`isLoading` (línea 20) y cae directamente en esta rama con `data` todavía `null`.

`TotalAmountSoldCard` tiene la misma condición (`data?.value !== null`, línea 94) pero ahí
el acceso posterior sí usa optional chaining (`data?.subtotal`, `data?.value`), por lo que
no crashea — pero el resultado sigue siendo lógicamente incorrecto: cuando `data` es
`null`, se renderiza `formatDecimalCurrency(0)` ("0,00 €") en vez del mensaje
`"Sin datos"` que la rama `else` está pensada para mostrar.

## Objetivo

Ambos widgets distinguen correctamente entre "no hay objeto `data`" y "hay `data` pero su
campo `value` es explícitamente `null`", sin riesgo de acceder a una propiedad de `null`.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`. Prioridad P1 por el riesgo
de crash en producción (aunque de baja probabilidad — requiere una ventana de
`tenantId` transitoriamente `null` tras `isLoading` resolverse en `false`), es una
corrección de una línea con alto impacto potencial.

## Solución propuesta

```diff
- {data?.value !== null ? (
+ {data && data.value !== null ? (
    <div>
      <h1 className="text-3xl font-medium tracking-tight">
        {formatDecimalWeight(data.value)}
```

Aplicar el mismo cambio de condición en `TotalAmountSoldCard/index.tsx:94`
(`{data && data.value !== null ? (`) para que el comportamiento sea consistente y
correcto en los dos widgets.

## Criterios de aceptación

- [ ] Ninguno de los 2 widgets puede lanzar `TypeError` cuando `data` es `null`
- [ ] Cuando `data` es `null`, ambos widgets muestran el mensaje "Sin datos"
- [ ] `npm run type-check` limpio

## Plan de validación

```text
npm run type-check
npm run lint
# Manual / test: simular tenantId null transitorio o mockear el hook devolviendo
# data: null con isLoading: false y confirmar que no crashea y se muestra "Sin datos"
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
