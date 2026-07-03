---
id: GAP-V2-031
title: OrderProduction y OrderLabels usan hooks de React sin la directiva 'use client'
module: orders
category: code-quality
priority: P3
risk: low
size: XS
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-031 — Inconsistencia de `'use client'` entre las pestañas de `Order`

## Problema

Las 7 pestañas de detalle de pedido en `src/components/Admin/OrdersManager/Order/`
(`OrderDetails`, `OrderProductDetails`, `OrderEditSheet`, `OrderProduction`,
`OrderExport`, `OrderMap`, `OrderLabels`) usan todas `useState`/`useMemo` y se
renderizan bajo el mismo árbol de tabs (`config/sectionsConfig.ts`). 5 de las 7
declaran `'use client'` al inicio del archivo; 2 no:

```
OrderDetails/index.tsx        → 'use client' ✓
OrderProductDetails/index.tsx → 'use client' ✓
OrderEditSheet/index.tsx      → 'use client' ✓
OrderMap/index.tsx            → 'use client' ✓
OrderExport/index.tsx         → 'use client' ✓
OrderProduction/index.tsx     → sin 'use client' — usa useMemo, useState
OrderLabels/index.tsx         → sin 'use client' — usa useMemo, useState
```

Hoy no rompe nada porque ambos se montan siempre dentro de un árbol que ya tiene
`'use client'` más arriba (el propio `Order`), pero es una inconsistencia real
frente al checklist COMPONENTS ("'use client' only when actually needed (hooks,
state, event handlers)") y frente al patrón que el resto de archivos hermanos en
la misma carpeta sí siguen. Si en el futuro alguno de estos dos componentes se
reutiliza en un árbol Server Component sin boundary previo, fallaría en build.

## Objetivo

Los 7 componentes de pestaña de `Order/` siguen el mismo patrón: `'use client'`
explícito en cualquier archivo que use hooks de React, sin excepciones
silenciosas.

## Solución propuesta

Añadir `'use client';` como primera línea de
`OrderProduction/index.tsx` y `OrderLabels/index.tsx`, igual que sus 5 hermanos.

## Criterios de aceptación

- [ ] `OrderProduction/index.tsx` y `OrderLabels/index.tsx` empiezan con
      `'use client';`.
- [ ] `npm run type-check`, `npm run lint` y `npm run build` limpios.

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

### Veredicto: ✅ APROBADO

`OrderProduction/index.tsx` y `OrderLabels/index.tsx` ahora empiezan con
`'use client';` como primera línea, igual que sus 5 hermanos en la misma carpeta.
Cambio mecánico de dos líneas, sin efectos colaterales. `npm run type-check`,
`npm run lint` y `npm run test:run` confirmados limpios/sin regresiones fuera de
esta auditoría. Sin checklist técnico o visual aplicable más allá de la directiva
en sí (no hay UI nueva, no aplica revisión UX).

### Checklist

- [x] `OrderProduction/index.tsx` empieza con `'use client';`
- [x] `OrderLabels/index.tsx` empieza con `'use client';`
- [x] Sin cambios fuera del alcance del GAP

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno
