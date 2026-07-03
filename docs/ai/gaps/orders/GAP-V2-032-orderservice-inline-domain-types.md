---
id: GAP-V2-032
title: Tipos de dominio de Order definidos inline en orderService.ts en vez de src/types/
module: orders
category: code-quality
priority: P3
risk: low
size: M
status: candidate
dependencies:
  - GAP-V2-028
target_files:
  - src/services/orderService.ts
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-032 — Interfaces de dominio de `orders` viven dentro del service, no en `src/types/`

## Problema

`.claude/rules/typescript.md` establece que las interfaces de shapes de API/dominio
deben vivir en archivos de tipos dedicados (patrón real del proyecto:
`src/types/catalog.ts`, `crm.ts`, `user.ts`, `product.ts`, etc.). `orderService.ts`
no sigue ese patrón: define y exporta directamente dentro del propio archivo de
servicio (líneas 16-306 aprox.) más de 15 interfaces de dominio, entre ellas:

```ts
export interface OrderPayload { ... }
export interface Order { ... }
export interface OrderPlannedProductDetailPayload { ... }
export interface AuxiliaryOrderLine { ... }
export interface AuxiliaryOrderLinePayload { ... }
export interface OrderCostAnalysisSummary { ... }
export interface OrderCostAnalysisProductLine { ... }
export interface OrderCostAnalysisPallet { ... }
// + interfaces de stats/profitability (ProfitabilitySummaryResponse,
//   ProfitabilityTimelineResponse, OrdersProfitabilityExportJob, etc.)
```

`docs/ai/modules/orders/audit.md` §5 ya señala esto como hueco conocido ("Tipos: no
localizados en un único archivo dedicado — pendiente de mapeo fino"), pero no
existía ningún GAP que lo cerrara hasta ahora. Cualquier componente/hook que
necesite el tipo `Order` debe importarlo desde el service
(`import type { Order } from '@/services/orderService'`), mezclando la capa de
tipos con la capa de acceso a datos — dificulta reusar los tipos sin arrastrar
también las funciones de fetching.

## Objetivo

Los tipos de dominio de `orders` (`Order`, `AuxiliaryOrderLine`,
`OrderCostAnalysis*`, tipos de stats/profitability) viven en
`src/types/orders.ts` (o el archivo que se acuerde), y `orderService.ts` los
importa desde ahí en vez de declararlos inline. Los consumidores externos pueden
importar los tipos sin importar el service.

## Contexto

Depende de GAP-V2-028 (refactor de boilerplate en el mismo archivo) solo en el
sentido de que ambos tocan `orderService.ts` extensamente — se recomienda
implementar GAP-V2-028 primero para evitar conflictos de merge, no porque haya
una dependencia funcional real.

## Solución propuesta

1. Crear `src/types/orders.ts` con todas las interfaces actualmente definidas en
   `orderService.ts` (dominio + payloads + respuestas de stats/profitability).
2. Re-exportar los tipos desde `orderService.ts` como `export type { Order, ... }
   from '@/types/orders'` durante una fase de transición, para no romper imports
   existentes que hagan `import type { Order } from '@/services/orderService'`.
3. Actualizar los imports internos del propio `orderService.ts` para usar
   `@/types/orders`.
4. (Opcional, fuera de alcance de este GAP si genera demasiado ruido): migrar
   gradualmente los imports externos a `@/types/orders` directamente.

## Criterios de aceptación

- [ ] `src/types/orders.ts` existe y contiene las interfaces de dominio de
      `orders` movidas desde `orderService.ts`.
- [ ] `orderService.ts` importa esos tipos desde `@/types/orders` en vez de
      declararlos inline.
- [ ] Los imports externos existentes de tipos de `orderService.ts` (si los hay)
      siguen funcionando sin cambios (re-export de transición).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md` (§5 Alcance del módulo:
  "Tipos: no localizados en un único archivo dedicado — pendiente de mapeo fino")
- GAPs relacionados: GAP-V2-028 (mismo archivo, refactor de boilerplate HTTP)
