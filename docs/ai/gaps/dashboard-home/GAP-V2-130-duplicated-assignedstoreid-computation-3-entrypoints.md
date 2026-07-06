---
id: GAP-V2-130
title: Cálculo de storeId desde la sesión duplicado en los 3 puntos de entrada del dashboard operario
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/app/operator/page.js
  - src/app/admin/home/page.js
  - src/app/warehouse/[storeId]/page.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-130 — Lógica duplicada para obtener el `storeId` del operario desde la sesión

## Problema

`OperarioDashboard` se renderiza desde 3 rutas distintas, y dos de ellas reimplementan de
forma casi idéntica la misma lógica para derivar el `storeId` del operario a partir de
`session.user.assignedStoreId`:

```js
// src/app/operator/page.js:18-19
const storeId =
  session?.user?.assignedStoreId != null ? String(session.user.assignedStoreId) : null;
```

```js
// src/app/admin/home/page.js:35-36 (rama role === 'operario')
const assignedStoreId = session?.user?.assignedStoreId ?? null;
const storeId = assignedStoreId != null ? String(assignedStoreId) : null;
```

Son funcionalmente equivalentes (mismo resultado para los mismos inputs, solo cambia el
orden de las comprobaciones), pero están escritas dos veces de forma independiente en vez de
compartir una única fuente. Una tercera variante aparece en
`src/app/warehouse/[storeId]/page.js:71-72`, con el mismo dato pero convertido a `Number` en
vez de `String` (para comparar contra el `storeId` de la URL):

```js
// src/app/warehouse/[storeId]/page.js:71-72
const assignedId =
  session.user.assignedStoreId != null ? Number(session.user.assignedStoreId) : null;
```

El mismo patrón exacto (`assignedStoreId != null ? String(...) : null`) recurre además, fuera
del alcance estricto de esta auditoría (rutas de creación, no de dashboard), en al menos:
`src/app/operator/receptions/create/page.js:17-18`,
`src/app/admin/raw-material-receptions/create/page.js`,
`src/app/admin/cebo-dispatches/create/page.js`,
`src/app/warehouse/[storeId]/receptions/create/page.js`,
`src/app/warehouse/[storeId]/dispatches/create/page.js` — lo que confirma que no es un
duplicado aislado sino un patrón recurrente sin una única fuente de verdad.

## Objetivo

Una única función/hook expone "el storeId asignado al usuario actual" (en `string` y, si hace
falta, en `number`), y los 3 puntos de entrada del dashboard operario la usan en vez de
reimplementar la comprobación `!= null` inline.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`, específicamente señalado por
Jose como duplicación a evaluar entre los 3 `page.js` que renderizan `OperarioDashboard`. Bajo
riesgo — extracción mecánica sin cambio de comportamiento.

## Solución propuesta

1. Crear un helper puro en `src/lib/auth/` (junto a `src/lib/auth/actor.ts`, que ya expone
   utilidades similares de sesión/rol) o un hook `useAssignedStoreId()`:
   ```ts
   export function getAssignedStoreId(
     user?: { assignedStoreId?: number | string | null } | null
   ): string | null {
     return user?.assignedStoreId != null ? String(user.assignedStoreId) : null;
   }
   ```
2. Usarlo en `operator/page.js` y en la rama `role === 'operario'` de `admin/home/page.js`.
3. En `warehouse/[storeId]/page.js`, reutilizar la misma función y convertir a `Number` en el
   único punto donde se compara contra el `storeId` de la URL, en vez de reimplementar el
   `!= null` por separado.
4. Opcional (fuera del criterio de aceptación estricto, dejar como nota): aplicar el mismo
   helper en los 5 archivos de creación listados arriba en un GAP de migración por lotes, si
   Jose lo aprueba por separado.

## Criterios de aceptación

- [ ] Existe una única función/hook que deriva el `storeId` asignado desde la sesión.
- [ ] `operator/page.js`, `admin/home/page.js` y `warehouse/[storeId]/page.js` la usan en vez
      de reimplementar la comprobación inline.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] El comportamiento de las 3 rutas no cambia (mismo `storeId` resultante para los mismos
      datos de sesión).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: verificar /operator, /warehouse/[storeId propio del operario] y /admin/home con un
# usuario operario — el dashboard debe seguir mostrando el mismo storeId que antes.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-131 (misma familia de duplicación — normalización de rol)
