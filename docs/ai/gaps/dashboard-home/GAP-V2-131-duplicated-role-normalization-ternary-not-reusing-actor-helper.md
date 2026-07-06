---
id: GAP-V2-131
title: Ternario de normalización de rol reimplementado 4 veces en vez de exportar y reusar normalizeRole() de actor.ts
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/app/admin/home/page.js
  - src/app/warehouse/[storeId]/page.js
  - src/lib/auth/actor.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-131 — Normalización de rol duplicada en vez de reusar `normalizeRole()`

## Problema

El proyecto ya tiene una función de normalización de rol (`Array.isArray(role) ? role[0] :
role`) en `src/lib/auth/actor.ts:11-14`:

```ts
function normalizeRole(role: AuthActorLike['role']): string | null {
  if (Array.isArray(role)) return role[0] ?? null;
  return role ?? null;
}
```

Pero no está exportada, y el mismo ternario se reimplementa inline 4 veces en los archivos de
esta superficie, incluidas 3 repeticiones dentro del mismo archivo:

```js
// src/app/admin/home/page.js:14-18
session?.user?.role != null
  ? Array.isArray(session.user.role)
    ? session.user.role[0]
    : session.user.role
  : null;
```

```js
// src/app/warehouse/[storeId]/page.js:30-31 (dentro de un useEffect)
const rawRole = session.user.role;
const userRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
```

```js
// src/app/warehouse/[storeId]/page.js:70 (segunda vez, en el bloque de validación operario/almacén)
const role = Array.isArray(session.user.role) ? session.user.role[0] : session.user.role;
```

```js
// src/app/warehouse/[storeId]/page.js:153 (tercera vez, justo antes del render final)
const role = Array.isArray(session?.user?.role) ? session.user.role[0] : session?.user?.role;
```

`warehouse/[storeId]/page.js` reimplementa la misma normalización 3 veces en el mismo archivo
sin extraerla ni siquiera a una variable local reutilizada — cada bloque (efecto de guardia de
rol, validación de almacén asignado, render final) la recalcula desde cero.

## Objetivo

Todo el código que necesita el rol normalizado del usuario actual usa la misma función
compartida — cero reimplementaciones del ternario `Array.isArray(role) ? role[0] : role`.

## Contexto

`normalizeRole()` ya existe y ya es usada internamente por `canManagePalletCostFields()` y
`getDefaultAuthenticatedRoute()` en el mismo archivo (`actor.ts:37,44`) — solo falta
exportarla para que otros módulos puedan reusarla en vez de reimplementarla.

## Solución propuesta

1. Exportar `normalizeRole` desde `src/lib/auth/actor.ts` (cambiar `function normalizeRole` a
   `export function normalizeRole`).
2. En `admin/home/page.js`, sustituir el ternario anidado de las líneas 14-18 por
   `normalizeRole(session?.user?.role)`.
3. En `warehouse/[storeId]/page.js`, sustituir las 3 repeticiones (líneas 30-31, 70, 153) por
   una única llamada a `normalizeRole(session?.user?.role)`, idealmente calculada una sola vez
   y reutilizada en las 3 ramas en lugar de recalcularse en cada una.

## Criterios de aceptación

- [ ] `normalizeRole` exportada desde `actor.ts` sin cambiar su comportamiento interno.
- [ ] `admin/home/page.js` y `warehouse/[storeId]/page.js` usan `normalizeRole()` importada, sin
      ternarios inline de normalización de rol.
- [ ] `warehouse/[storeId]/page.js` calcula el rol normalizado una sola vez por render en vez de
      3 veces.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: verificar /admin/home y /warehouse/[storeId] con roles operario, administrador y
# tecnico — el comportamiento de enrutado/render debe ser idéntico al actual.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-130 (misma familia de duplicación — cálculo de storeId)
