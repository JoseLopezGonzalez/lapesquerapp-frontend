---
id: GAP-V2-075
title: ComercialDashboard y CommercialSalesSummaryCard ignoran el error expuesto por sus hooks — fallo de API se confunde con "sin datos"
module: dashboard-home
category: code-quality
priority: P1
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/components/Comercial/CRM/CommercialSalesSummaryCard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-075 — `error` de `useCrmDashboard`/`useOrdersTotalAmountStats` nunca se lee

## Problema

`useCrmDashboard()` (`src/hooks/useCrmDashboard.ts:50-54`) calcula y devuelve
`error` correctamente (mensaje del primero de los 3 `useQueries` en paralelo
que falle). Sin embargo, `ComercialDashboard/index.js:245` lo descarta:

```js
const { data: crmData, isLoading: crmLoading, refetch: refetchCrm } = useCrmDashboard();
```

`error` nunca se desestructura. Si `crm/dashboard/pending-actions`,
`crm/dashboard/customers` o `crm/dashboard/prospects` fallan (403 por
permisos, 500 del backend, error de red), `crmData` queda `null`, y las 3
cards CRM (`crm-agenda`, `crm-inactive-customers`,
`crm-prospects-without-activity`) caen en sus respectivos `EmptyWidget`
("Todo al día", "Sin alertas de clientes", "Sin prospectos parados") —
indistinguible visualmente de que realmente no hay pendientes. Para un
comercial esto es engañoso: puede asumir que no tiene seguimientos
pendientes cuando en realidad la API falló.

El mismo patrón se repite en
`src/components/Comercial/CRM/CommercialSalesSummaryCard.jsx:9`:

```js
const { data, isLoading } = useOrdersTotalAmountStats();
```

`useOrdersTotalAmountStats` (`src/hooks/useOrdersStats.ts:58-74`) también
expone `error`, pero el componente no lo lee — un fallo se renderiza como
"0,00 €" con "Sin datos suficientes para el periodo actual." (línea 34),
igual de indistinguible de un año sin ventas reales.

## Objetivo

Ambos componentes desestructuran `error` de su hook y, cuando existe,
renderizan un estado de error inline visualmente distinto (`text-destructive`
o equivalente) del estado "sin datos"/"todo al día".

## Contexto

Mismo patrón ya documentado para el dashboard de Admin en `GAP-V2-003`
("La mayoría de widgets del dashboard ignoran el error que ya exponen sus
hooks"), pero esos `target_files` no incluyen archivos del carril Comercial —
este GAP cubre la superficie que falta.

## Solución propuesta

1. En `ComercialDashboard/index.js`, añadir `error: crmError` a la
   desestructuración de `useCrmDashboard()`. Antes de la rama `if (crmLoading)`
   del `useMemo`, añadir una rama de error que sustituya las 3 cards CRM por un
   mensaje de error inline (mismo bloque de plantilla que `GAP-V2-003` usa para
   `DailyCalibersBySpeciesCard`).
2. En `CommercialSalesSummaryCard.jsx`, añadir `error` a la desestructuración
   y renderizar el estado de error antes del estado normal, siguiendo el mismo
   patrón visual.
3. No modificar los hooks — ya devuelven `error` correctamente.

## Criterios de aceptación

- [ ] `ComercialDashboard/index.js` desestructura `error` de `useCrmDashboard`
      y muestra un estado de error distinto del "todo al día" cuando existe.
- [ ] `CommercialSalesSummaryCard.jsx` desestructura `error` de
      `useOrdersTotalAmountStats` y lo muestra en vez de "Sin datos
      suficientes" cuando existe.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: simular un error 500/403 en uno de los 3 endpoints de
# crm/dashboard/* (o en orders stats) y confirmar que se muestra un mensaje de
# error, no un estado vacío/cero engañoso.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-003 (mismo hallazgo en el carril Admin del mismo módulo)
