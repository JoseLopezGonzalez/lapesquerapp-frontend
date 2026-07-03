---
id: GAP-V2-034
title: Sin cobertura de tests para useComercialOrders, useOrderFormConfig y useOrderCreateFormConfig
module: orders
category: code-quality
priority: P3
risk: low
size: M
status: ready
dependencies: []
target_files:
  - src/hooks/useComercialOrders.ts
  - src/hooks/useOrderFormConfig.ts
  - src/hooks/useOrderCreateFormConfig.ts
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-034 — Tres hooks de `orders` sin ningún test, pese a ser el tipo de archivo priorizado por `testing.md`

## Problema

`.claude/rules/testing.md` prioriza explícitamente tests de `hooks/` como área de
alta prioridad ya cubierta por el proyecto. Dentro del alcance de esta pasada
(`src/hooks/useOrders.ts`, `useOrdersStats.ts`, `useComercialOrders.ts`,
`useOrderFormConfig.ts`, `useOrderCreateFormConfig.ts`), la cobertura real es
desigual:

```
src/__tests__/hooks/useOrder.test.js                    → cubre useOrder
src/__tests__/hooks/useOrders.test.js                    → cubre useOrders ✓
src/__tests__/hooks/useOrdersProfitabilityStats.test.ts  → cubre 3 de ~12 hooks
                                                             de useOrdersStats.ts
                                                             (profitability
                                                             summary/timeline/
                                                             products)
src/__tests__/hooks/useOrderPlannedDetails.test.ts       → fuera de este alcance

useComercialOrders.ts        → 0 tests
useOrderFormConfig.ts        → 0 tests
useOrderCreateFormConfig.ts  → 0 tests
```

`useOrderFormConfig` y `useOrderCreateFormConfig` en particular tienen lógica no
trivial (mapeo de `orderData` a valores por defecto, inyección de opciones en
`formGroups`, normalización de IDs a string) sin ningún test que verifique casos
como: pedido con `externalProcessor` inactivo (líneas 471-481 de
`useOrderFormConfig.ts`, lógica de "inyectar procesador actual si no está en la
lista de opciones"), o pedido `autoventa` vs `standard`.

## Objetivo

`useComercialOrders`, `useOrderFormConfig` y `useOrderCreateFormConfig` tienen
tests unitarios que cubren al menos sus casos de mapeo/normalización de datos más
específicos del dominio (no solo el happy path genérico).

## Contexto

No depende funcionalmente de GAP-V2-030 (que cambia `useOrderFormConfig` de
`useState`+`useEffect` a derivación directa) — se recomienda por orden de
implementación escribir los tests después de ese refactor para no tener que
reescribirlos, pero puede implementarse antes si se prefiere tener regresión
cubierta primero; ninguno de los dos órdenes bloquea al otro.

## Solución propuesta

1. `src/__tests__/hooks/useComercialOrders.test.ts`: cubrir el `select` que
   normaliza `offerId`/`offer_id` y el fallback de `meta` cuando la respuesta no
   trae paginación.
2. `src/__tests__/hooks/useOrderFormConfig.test.ts`: cubrir el mapeo de
   `orderData` a `defaultValues` (fechas, tipo de pedido, IDs a string) y la
   inyección de `externalProcessor` inactivo no presente en `options`.
3. `src/__tests__/hooks/useOrderCreateFormConfig.test.ts`: cubrir la inyección de
   opciones de `customers`/`salespeople`/etc. en `formGroups`.
4. Seguir el patrón de mocking de `.claude/rules/testing.md` (mockear el service
   de dominio completo, no `fetchWithTenant`).

## Criterios de aceptación

- [ ] Los 3 archivos de test existen en `src/__tests__/hooks/` y pasan.
- [ ] Cubren al menos un caso de normalización específico del dominio por hook
      (no solo "devuelve datos cuando la query tiene éxito").
- [ ] `npm run test:run` limpio.

## Plan de validación

```text
npm run test:run
npm run type-check
npm run lint
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-030 (refactor previo recomendado de
  `useOrderFormConfig`)
