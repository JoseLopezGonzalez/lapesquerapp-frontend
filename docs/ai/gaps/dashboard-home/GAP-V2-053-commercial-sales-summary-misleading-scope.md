---
id: GAP-V2-053
title: "CommercialSalesSummaryCard etiqueta como \"Tus ventas\" un dato que es en realidad la venta total de la empresa, e ignora el error del hook"
module: dashboard-home
category: ux-ui
priority: P1
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Comercial/CRM/CommercialSalesSummaryCard.jsx
  - src/hooks/useOrdersStats.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-053 — Copy engañoso en `CommercialSalesSummaryCard` + error de hook ignorado

## Problema

`CommercialSalesSummaryCard.jsx:9,25` usa `useOrdersTotalAmountStats()` (el mismo hook
que ya usa `TotalAmountSoldCard` en el dashboard Admin/Dirección) y etiqueta el
resultado como:

```jsx
<CardDescription>Tus ventas este año</CardDescription>
```

`useOrdersTotalAmountStats` (`src/hooks/useOrdersStats.ts:58-74`) llama a
`getOrdersTotalAmountStats({ dateFrom, dateTo, includeAuxiliary })`
(`src/services/orderService.ts:554-573`), que solo envía `dateFrom`/`dateTo`/
`includeAuxiliary` al endpoint `statistics/orders/total-amount` — **no existe ningún
parámetro de comercial/vendedor** en la firma del hook, del servicio, ni de la query
string construida. Es exactamente el mismo dato agregado de toda la empresa que
`TotalAmountSoldCard` muestra en el dashboard Admin bajo el título correcto y neutro
"Importe Total de Ventas". Etiquetarlo "Tus ventas este año" en el dashboard Comercial
sugiere al usuario que está viendo su propia cifra de ventas personal, cuando en
realidad ve el total de la empresa — puede llevar a decisiones o expectativas
incorrectas (p.ej. un comercial creyendo que ha vendido mucho más de lo que realmente
vendió él).

Adicionalmente, el componente ignora el estado de error del hook:

```jsx
const { data, isLoading } = useOrdersTotalAmountStats();
```

Si la petición falla, `data` queda `undefined`/`null` y el componente cae directamente
en "Sin datos suficientes para el periodo actual." (línea 34), indistinguible de un
error real — mismo anti-patrón que GAP-V2-052 y GAP-V2-003.

## Objetivo

El texto de la tarjeta debe describir con precisión el alcance real del dato (total de
empresa, no personal) — o, si el negocio requiere una cifra realmente scoped al
comercial logueado, el backend/hook deben aceptar y aplicar un filtro de
vendedor/comercial antes de mostrarla como "Tus ventas". Además, el componente debe
distinguir error de "sin datos".

## Contexto

Este hallazgo tiene un componente de corrección de dominio (¿debería existir un
filtro por comercial en el backend?) fuera del alcance de esta auditoría de UI —
se deja constancia aquí porque afecta directamente a la honestidad del copy mostrado,
pero la decisión de si se implementa el filtrado por vendedor o simplemente se corrige
el texto debe tomarla Jose (posible consulta a `domain-business-auditor`).

## Solución propuesta

**Este GAP implementa la Opción A (mínima, sin cambios de backend, ejecutable ahora sin esperar
confirmación de Jose):** cambiar el título a algo neutro y preciso, p.ej. "Ventas totales de la
empresa este año" o reusar el título ya usado en `TotalAmountSoldCard` ("Importe Total de
Ventas"), evitando el posesivo "Tus".

La Opción B (filtrar de verdad por comercial/vendedor, con cambio de backend) es de mayor
alcance y requiere confirmación de Jose — se gestiona en **GAP-V2-090** (`blocked`, pendiente de
esa confirmación), no en este GAP. Este GAP no debe esperar a que se resuelva GAP-V2-090: es la
mitigación honesta inmediata mientras esa decisión de negocio no llega.

Además, incorporando el hallazgo fusionado desde GAP-V2-075 (mismo componente, mismo hook):
1. Desestructurar `error` de `useOrdersTotalAmountStats()`.
2. Renderizar un estado de error (`text-destructive`) distinto del estado
   "Sin datos suficientes" cuando `error` no es `null`.

## Criterios de aceptación

- [ ] El texto de la tarjeta no implica un alcance personal si el dato mostrado es
      agregado de empresa (o el dato pasa a estar realmente scoped, según decisión de
      Jose).
- [ ] El componente distingue error de "sin datos".
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en /comercial, confirmar que la tarjeta ya no usa el posesivo "Tus ventas" y
# que un error simulado en useOrdersTotalAmountStats se muestra distinto de "Sin datos
# suficientes".
```

## Notas de implementación

**Fusión (gap-normalizer, 2026-07-06):** este GAP absorbe la parte de GAP-V2-075
("ComercialDashboard y CommercialSalesSummaryCard ignoran el error expuesto por sus hooks")
relativa a `CommercialSalesSummaryCard`/`useOrdersTotalAmountStats` — mismo hallazgo exacto. La
parte de GAP-V2-075 relativa a `ComercialDashboard`/`useCrmDashboard` se fusiona en GAP-V2-052
en su lugar. GAP-V2-075 queda `rejected` (dividido y fusionado en estos dos GAPs).

El alcance de este GAP se limita a la Opción A (copy neutro + manejo de error) — no espera a
GAP-V2-090 para implementarse.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-052, GAP-V2-003, GAP-V2-090 (filtrado real por comercial, `blocked`,
  mayor alcance), GAP-V2-075 (fusionado aquí parcialmente)
