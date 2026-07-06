---
id: GAP-V2-132
title: 'use client' en los 3 page.js que renderizan OperarioDashboard, en vez de delegar a un PageClient
module: dashboard-home
category: architecture-refactor
priority: P3
risk: medium
size: M
status: blocked
dependencies: []
target_files:
  - src/app/operator/page.js
  - src/app/admin/home/page.js
  - src/app/warehouse/[storeId]/page.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-132 — `'use client'` a nivel de `page.js` en las 3 rutas del dashboard operario

## Problema

Los 3 archivos `page.js` que renderizan `OperarioDashboard` tienen `'use client'` en la
primera línea, con toda la lógica (sesión, estado, efectos, navegación) inline en el propio
archivo de página:

- `src/app/operator/page.js:1`
- `src/app/admin/home/page.js:1`
- `src/app/warehouse/[storeId]/page.js:1`

Esto ya fue identificado como anti-patrón en el proyecto (`project-learnings.md` PL-014) y
corregido para las rutas de `comercial/` vía GAP-046: *"los pages de Next.js App Router deben
ser Server Components (sin directiva) que importan el `XxxPageClient`"* — el patrón canónico
usado en el resto de la app es `page.tsx` (Server Component) → `XxxPageClient.tsx` (Client
Component con `'use client'`). GAP-046 dejó fuera estas 3 rutas de warehouse/operator porque
su alcance se limitó al módulo comercial.

En estos 3 archivos la directiva es necesaria para *parte* de la lógica (`useSession`,
`useState`, `useEffect`, `useRouter`), pero está aplicada a todo el archivo de página en vez de
aislarse en un componente cliente dedicado, impidiendo cualquier optimización de Server
Component en la ruta.

## Objetivo

Los 3 archivos `page.js/tsx` de estas rutas son Server Components (sin `'use client'`) que
delegan toda la lógica interactiva a un `XxxPageClient` dedicado, siguiendo el patrón canónico
ya aplicado en el resto de la app (`components.md` § Server Component vs Client Component) y ya
usado para limpiar el módulo comercial (GAP-046).

## Contexto

`warehouse/[storeId]/page.js` es el más complejo de los 3: mezcla validación de acceso por rol,
carga de datos del almacén y el render condicional `operario` vs `Store` (rama no-operario,
fuera del alcance de esta auditoría de `dashboard-home`). Extraer un `WarehouseStorePageClient`
afecta a ambas ramas del archivo (operario y no-operario) porque `'use client'` es una
propiedad de todo el archivo, no de una rama — **requiere decisión de Jose** sobre si abordar
el refactor completo del archivo en un único GAP o si prefiere limitarlo a los 2 archivos más
simples (`operator/page.js`, `admin/home/page.js`) primero y dejar
`warehouse/[storeId]/page.js` para cuando se audite también su rama no-operario.

## Solución propuesta

1. `operator/page.js` → Server Component que importa `OperatorDashboardPageClient.tsx`
   (contiene el `useSession`, el `Loader` de sesión y el render de `OperarioDashboard`).
2. `admin/home/page.js` → Server Component que importa `HomePageClient.tsx` (contiene toda la
   lógica de rol/redirección actual).
3. `warehouse/[storeId]/page.js` → si Jose aprueba el alcance completo, Server Component que
   importa `WarehouseStorePageClient.tsx` con toda la lógica actual (validación de acceso,
   carga de almacén — ver también GAP-V2-135 para la parte de fetching); si prefiere alcance
   reducido, dejar fuera de este GAP y documentar la exclusión.
4. Renombrar los 3 archivos a `.tsx` en el mismo commit (regla CLAUDE.md — ya son JSX aunque
   con extensión `.js`).

## Criterios de aceptación

- [ ] Ningún `page.tsx` de estas 3 rutas tiene `'use client'`.
- [ ] Toda la lógica interactiva vive en un `XxxPageClient.tsx` dedicado por ruta.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Las 3 rutas funcionan igual que antes para todos los roles (operario, administrador,
      técnico, dirección).

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
# Manual: verificar /operator, /admin/home y /warehouse/[storeId] con operario, administrador
# y técnico — mismo comportamiento de redirección y render que antes del refactor.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- Referencia: GAP-046 (mismo anti-patrón corregido en módulo comercial), PL-014 en
  `project-learnings.md`
- GAPs relacionados: GAP-V2-135 (fetching de almacén dentro de `warehouse/[storeId]/page.js`)

## Pregunta abierta para Jose

`warehouse/[storeId]/page.js` mezcla la rama operario (dentro de alcance de esta auditoría) con
la rama administrador/técnico (`<Store />`, fuera de alcance). Como `'use client'` es una
propiedad de todo el archivo, ¿abordamos el refactor completo del archivo en este GAP, o lo
limitamos a `operator/page.js` y `admin/home/page.js` y dejamos este archivo para cuando se
audite también su rama no-operario?
