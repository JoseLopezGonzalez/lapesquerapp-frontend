---
id: GAP-V2-004
title: Migrar src/services/domain/orders/orderService.js a TypeScript
module: orders
category: code-quality
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/services/domain/orders/orderService.js
  - src/lib/ai/tools/orderTools.js
  - src/components/Admin/Productions/ProductionView.jsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-004 — `orderService.js` sigue vivo y en uso, candidato directo de migración

## Problema

`src/services/domain/orders/orderService.js` (323 líneas) es un archivo `.js`
legacy que **sigue activo**, no es código muerto: se confirma con dos importadores
actuales fuera de `src/hooks/`:

```
src/lib/ai/tools/orderTools.js:8:import { orderService } from '@/services/domain/orders/orderService';
src/components/Admin/Productions/ProductionView.jsx:70:import { orderService } from '@/services/domain/orders/orderService';
```

Esto viola la Regla de oro 3 de `CLAUDE.md` ("NUNCA crear archivos `.js` nuevos...
Si tocas un `.js` legacy por cualquier motivo, migrarlo a `.ts` en ese mismo
commit") en su vertiente de deuda técnica documentada — es exactamente el tipo de
archivo que la sección "Deuda técnica documentada" #2 de `CLAUDE.md` señala
("servicios legacy en `.js`. Migrar al tocar cualquier archivo legacy").

El archivo es en sí mismo un wrapper de adaptación (documentado en su propio
comentario de cabecera, líneas 1-15) sobre `src/services/orderService.ts`, que ya
está en TypeScript y exporta funciones tipadas (`OrderPayload`, `Order`,
`OrderStatus`, etc.). Es decir: la migración no requiere inventar tipos nuevos —
solo tipar los parámetros/retornos de `orderService.js` reutilizando los tipos ya
exportados por `orderService.ts` (`import type { Order, OrderStatus, ... } from
'@/services/orderService'`).

Complejidad de migración: **BAJA**. El archivo:
- No tiene lógica de negocio propia compleja — cada método delega en
  `orderServiceFunctions.*` (líneas 28, 83, 96, 111, etc.) o en helpers genéricos ya
  tipados (`fetchEntitiesGeneric`, `deleteEntityGeneric`).
- Ya usa JSDoc en casi todos los métodos (líneas 36-50, 72-84, etc.), lo que reduce
  el trabajo de inferencia de tipos.
- No tiene dependencias externas sin tipos.

Nota: no confundir con `src/services/orderService.ts` (raíz, 1383 líneas) — ese
archivo ya está en TypeScript y no es objeto de este GAP.

## Objetivo

`src/services/domain/orders/orderService.js` pasa a `orderService.ts`, con todos
sus métodos tipados reutilizando los tipos exportados por
`src/services/orderService.ts`, sin romper a `orderTools.js` ni a
`ProductionView.jsx`.

## Contexto

Este archivo fue creado como capa de adaptación para que `EntityClient` pueda
tratar `orders` como una entidad más del sistema (comentario líneas 1-15 del propio
archivo), mientras la lógica de negocio específica de pedidos sigue viviendo en
`orderService.ts`. Ese diseño no cambia con esta migración — solo el lenguaje del
archivo.

## Solución propuesta

1. Renombrar `orderService.js` → `orderService.ts`.
2. Tipar cada método reutilizando tipos ya exportados por `@/services/orderService`
   (`Order`, `OrderStatus`, `OrderPayload`, `OrderCostAnalysisResponse`, etc.) y por
   `@/types/catalog` para el contrato `CatalogListResponse<Order>` en `list()`.
3. Tipar explícitamente los parámetros de filtros/paginación de `list()`
   (hoy `filters = {}`, `pagination = {}` sin anotar) siguiendo el patrón de
   `CatalogListFilters` de `.claude/rules/api-client.md`.
4. Verificar que `orderTools.js` y `ProductionView.jsx` (los dos importadores
   confirmados) siguen compilando sin cambios en su lado — si alguno de los dos
   está migrado a `.tsx`/`.ts` en paralelo por otro GAP, coordinar orden de
   ejecución para evitar el patrón de recurrencia de PL-BUILD-05 (mezclar
   migraciones no relacionadas en el mismo PR).
5. No tocar `src/services/orderService.ts` (el archivo grande de 1383 líneas) — está
   fuera de alcance de este GAP.

## Criterios de aceptación

- [ ] `src/services/domain/orders/orderService.js` ya no existe; existe
      `orderService.ts` en su lugar con el mismo export `orderService`.
- [ ] Ningún método tiene parámetros con `any` implícito.
- [ ] `orderTools.js` y `ProductionView.jsx` importan y usan `orderService` sin
      cambios funcionales.
- [ ] `npm run type-check` limpio.
- [ ] `npm run lint` limpio.
- [ ] `npm run build` compila sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
npm run test:run
# Manual: probar el flujo de AI Chat que usa orderTools.js (extracción/consulta de
# pedidos) y la vista ProductionView que usa orderService directamente.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno
