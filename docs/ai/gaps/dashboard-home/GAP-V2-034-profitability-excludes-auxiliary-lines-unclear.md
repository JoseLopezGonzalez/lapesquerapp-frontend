---
id: GAP-V2-034
title: Los widgets de rentabilidad nunca incluyen líneas auxiliares (portes/extras) sin advertirlo
module: dashboard-home
category: domain-business
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js
  - src/components/Admin/Dashboard/OrdersProfitabilityProductsCard/index.js
  - src/components/Admin/Dashboard/OrdersProfitabilityTimelineCard/index.js
  - src/hooks/useOrdersStats.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-034 — Los widgets de rentabilidad nunca incluyen líneas auxiliares (portes/extras) sin advertirlo

## Problema

En el mismo dashboard conviven dos formas distintas de tratar las líneas auxiliares
(portes, transporte, envases retornables, tasas de gestión — todo lo que no es producto
pesquero/congelado propiamente dicho) respecto al importe total de ventas:

- `TotalAmountSoldCard` (`src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx:32,70-78`)
  expone un toggle explícito "Incluir auxiliares" (`includeAuxiliary`, por defecto `false`) que
  el usuario puede activar para que "Importe Total de Ventas" sume las líneas auxiliares.
- `useOrdersProfitabilitySummary`, `useOrdersProfitabilityProducts` y
  `useOrdersProfitabilityTimeline` (`src/hooks/useOrdersStats.ts:297-373`) — y sus endpoints
  correspondientes en `orderService.ts` (`getOrdersProfitabilitySummary`,
  `getOrdersProfitabilityProducts`, `getOrdersProfitabilityTimeline`) — **no aceptan ningún
  parámetro `includeAuxiliary`**. Los tres widgets de rentabilidad calculan margen bruto
  exclusivamente sobre líneas de producto, sin ninguna opción ni indicación de que las líneas
  auxiliares quedan fuera del cálculo.

Esto no es necesariamente un bug: si las líneas auxiliares son puro repercutido sin coste
asociado (lo que sugiere que `AuxiliaryLinesTotalCard` solo reporta importe, nunca coste ni
margen — `src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx`), excluirlas de
"Rentabilidad bruta" es correcto. Pero si la empresa aplica margen sobre el transporte u otros
conceptos auxiliares (práctica común en el sector: portes facturados con recargo sobre el coste
real de transporte), la cifra de "Rentabilidad bruta" del dashboard estaría sistemáticamente
incompleta sin ningún aviso al respecto — a diferencia de `OrdersProfitabilitySummaryCard`, que
sí avisa explícitamente cuando el margen es "orientativo" por baja cobertura de costes
(`LOW_COST_COVERAGE_THRESHOLD`, línea 15,35-40) pero no avisa nunca de esta exclusión
estructural.

## Objetivo

Confirmar con Jose si las líneas auxiliares (portes/extras) tienen coste/margen asociado en el
modelo de negocio real. Según la respuesta:

- Si NO tienen coste asociado (son repercutido puro): añadir una nota/tooltip en los tres
  widgets de rentabilidad aclarando que el cálculo de margen no incluye líneas auxiliares, para
  que quede documentado y no sea una omisión silenciosa.
- Si SÍ tienen coste/margen propio: evaluar si "Rentabilidad bruta" debería incorporarlas
  (nuevo GAP de mayor alcance, requeriría cambios de backend).

## Contexto

Encontrado durante la auditoría domain-business de `dashboard-home` (carril
`domain-business-auditor`), superficie Admin/Dirección. Relacionado con PL-candidate: esta es
exactamente el tipo de regla ("¿qué conceptos entran en el margen de un pedido en el sector
pesquero?") que no está documentada en ningún sitio del proyecto (`project-learnings.md` no
tiene entrada sobre el alcance de "rentabilidad"/"margen bruto") y previsiblemente reaparecerá
en otros módulos que también calculen rentabilidad de pedidos (p.ej. `OrderCostAnalysis` en el
editor de pedidos).

## Solución propuesta

Sujeta a confirmación de Jose (ver Objetivo). Como mínimo, si se confirma que es
intencional, añadir un texto aclaratorio visible (tooltip o nota al pie, siguiendo el patrón ya
usado para "Cobertura baja: el margen es orientativo") en los tres widgets de rentabilidad:
algo como "No incluye líneas auxiliares (portes, extras)".

## Criterios de aceptación

- [ ] Confirmación de Jose sobre si las líneas auxiliares tienen coste/margen en el modelo de
      negocio real.
- [ ] Los widgets de rentabilidad documentan visiblemente el alcance exacto de su cálculo de
      margen (qué incluye y qué no).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Verificación manual: confirmar con Jose el alcance real de "Rentabilidad bruta" antes de
# implementar cualquier cambio visual.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
- **Pendiente de confirmación de Jose**: ver sección Contexto y Objetivo.
- **PL CANDIDATE**: si Jose confirma la regla, documentar en `project-learnings.md` qué
  conceptos entran/no entran en "rentabilidad"/"margen bruto" de un pedido — regla que
  previsiblemente reaparece en otros módulos (p.ej. editor de pedidos, `OrderCostAnalysis`).
