---
id: GAP-V2-016
title: Hooks del dashboard obtienen el token vía useSession() y lo pasan al service, en vez de usar getAuthToken() dentro del service
module: dashboard-home
category: architecture-refactor
priority: P3
risk: low
size: M
status: candidate
dependencies: []
target_files:
  - src/hooks/useSpeciesOptions.js
  - src/hooks/useProductOptions.js
  - src/hooks/usePunches.js
  - src/services/speciesService.js
  - src/services/productCategoryService.js
  - src/services/productFamilyService.js
  - src/services/punchService.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-016 — Patrón de token divergente: useSession() en el hook en vez de getAuthToken() en el service

## Problema

`.claude/rules/api-client.md` documenta el patrón estándar: *"Siempre usar getAuthToken()
desde el service — nunca en el componente"*, y los servicios ya migrados a `.ts`
(`productService.ts`, `storeService.ts`, `getReceptionChartData.ts`, `getDispatchChartData.ts`)
lo siguen correctamente (`const token = await getAuthToken();` dentro del propio service).

Varios hooks de este módulo divergen de ese patrón: obtienen el token con `useSession()`
directamente en el hook y lo pasan como parámetro a funciones de servicio que lo reciben
como argumento:

```js
// src/hooks/useSpeciesOptions.js:12-19
export function useSpeciesOptions() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  ...
  queryFn: () => getSpeciesOptions(token),
```

```js
// src/services/speciesService.js:9
export function getSpeciesOptions(token) { ... }
```

El mismo patrón se repite en `useProductCategoryOptions`/`useProductFamilyOptions`
(`useProductOptions.js:57-82`) y en `usePunchesDashboard`/`usePunchesStatistics`
(`usePunches.js`), contra `productCategoryService.js`, `productFamilyService.js` y
`punchService.js` respectivamente.

Esto crea dos formas distintas y no intercambiables de resolver el token dentro del mismo
módulo, y acopla el hook a la sesión de NextAuth cuando debería ser responsabilidad
exclusiva del service.

## Objetivo

Los 4 services listados obtienen el token internamente con `getAuthToken()`, y los hooks ya
no necesitan `useSession()` únicamente para extraer el `accessToken` (pueden seguir
usándolo si necesitan otro dato de la sesión, pero no para esto).

## Contexto

Depende en la práctica de migrar estos servicios a `.ts` (`GAP-V2-017`) — ambos GAPs pueden
resolverse en el mismo PR ya que tocan los mismos archivos, pero se documentan por separado
porque son violaciones de reglas distintas (arquitectura de la capa HTTP vs. deuda de
migración de tipado).

## Solución propuesta

1. En cada service (`speciesService.js`/`.ts`, `productCategoryService.js`/`.ts`,
   `productFamilyService.js`/`.ts`, y las 2 funciones de `punchService.js` usadas por este
   módulo), añadir `const token = await getAuthToken();` al inicio de la función y quitar el
   parámetro `token`.
2. Actualizar los hooks para no pasar `token` como argumento y quitar la dependencia de
   `useSession()` si ya no se usa para nada más en ese hook.
3. Si `punchService.js` se mantiene como `.js` por su tamaño/alcance (ver GAP-V2-017), esta
   parte del fix puede hacerse igualmente sin migrar el archivo completo — es un cambio
   localizado a `getPunchesDashboard`/`getPunchesStatistics`.

## Criterios de aceptación

- [ ] `getSpeciesOptions`, `getProductCategoryOptions`, `getProductFamilyOptions`,
      `getPunchesDashboard`, `getPunchesStatistics` ya no reciben `token` como parámetro
- [ ] Los hooks correspondientes no pasan token manualmente
- [ ] `npm run type-check` y `npm run lint` limpios

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
# Manual: confirmar en /admin/home que los combos de especie/categoría/familia y las
# cards de trabajadores siguen cargando datos tras el cambio
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-017 (migración JS→TS de los mismos servicios)
