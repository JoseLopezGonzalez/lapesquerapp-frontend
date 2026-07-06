---
id: GAP-V2-197
title: "'use client' en src/app/field/page.js — debería ser Server Component + FieldDashboardPageClient"
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/app/field/page.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-197 — `'use client'` directamente en el `page.js` de `/field`

## Problema

`src/app/field/page.js` completo:

```js
'use client';

import FieldDashboard from '@/components/Field/FieldDashboard';

export default function FieldHomePage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-6">
      <FieldDashboard />
    </div>
  );
}
```

Esto es exactamente el anti-patrón documentado en `project-learnings.md` **PL-014**
(confianza HIGH, encontrado ya en `src/app/comercial/ofertas/page.js` y
`src/app/comercial/orders-manager/page.js`, con seguimiento GAP-046): los `page.js/tsx`
de App Router deben ser Server Components sin directiva, que importan un
`XxxPageClient` donde vive `'use client'`. Añadir `'use client'` al page convierte toda
la ruta en Client Component e impide cualquier optimización RSC en ese segmento.

`FieldDashboard` en sí ya es (y debe seguir siendo) un Client Component (usa
`useSession`, `useState`, hooks de TanStack Query) — el problema no es la directiva en
sí, sino su ubicación: debería estar en un wrapper `FieldDashboardPageClient`, no en el
`page.js`.

**Nota de alcance:** el mismo patrón se repite en `src/app/comercial/page.js`,
`src/app/operator/page.js` y `src/app/admin/home/page.js` (los 4 landing pages de rol
del módulo dashboard-home tienen `'use client'` en el `page.js`). Este GAP se limita a
`src/app/field/page.js` por ser la única superficie en el alcance de esta pasada de
auditoría; los otros 3 quedan como hallazgo para una pasada posterior o para
`system-learner` (recurrencia de PL-014 más allá del alcance original de GAP-046).

## Objetivo

`src/app/field/page.js` es un Server Component (sin `'use client'`) que importa
`FieldDashboardPageClient` (nuevo, con la directiva) o, alternativamente, importa
directamente `FieldDashboard` si este ya tiene su propia `'use client'` en su propio
archivo (ver `components.md`: "Los pages de App Router son Server Components que
importan un `XxxPageClient.tsx` que es el Client Component real").

## Contexto

`FieldDashboard.jsx` (GAP-V2-190) ya tiene su propia `'use client'` como primera línea
del archivo — por lo que, en la práctica, la forma más simple de resolver esto es quitar
`'use client'` del `page.js` y dejar que `FieldDashboard` siga siendo el único límite
Client/Server, sin necesidad de crear un wrapper `FieldDashboardPageClient` adicional
(el propio `FieldDashboard` ya cumple ese rol). Confirmar contra el patrón usado en el
resto del proyecto antes de decidir si se necesita el wrapper explícito o basta con
quitar la directiva del page.

## Solución propuesta

1. Quitar `'use client'` de `src/app/field/page.js`.
2. Confirmar que `FieldHomePage` sigue siendo un Server Component válido (sin hooks,
   sin estado, solo renderiza `<FieldDashboard />` dentro de un `div`).
3. Ejecutar `npm run build` para confirmar que Next.js no marca el segmento como
   necesitando `'use client'` en el page (debería compilar sin error, ya que
   `FieldDashboard` es el límite Client Component real).

## Criterios de aceptación

- [ ] `src/app/field/page.js` no tiene `'use client'`.
- [ ] `npm run build` compila sin error relacionado con Server/Client boundaries.
- [ ] `/field` renderiza igual que antes del cambio (verificación manual).

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
# Manual: /field — confirmar que el dashboard carga igual que antes.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-046 (mismo anti-patrón, alcance Comercial), PL-014 en
  `project-learnings.md`
