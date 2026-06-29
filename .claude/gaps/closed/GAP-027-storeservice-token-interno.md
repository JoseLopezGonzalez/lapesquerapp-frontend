# GAP-027 — Eliminar token-as-parameter de storeService.ts y useStockStats.ts

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock / Almacén
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`src/services/storeService.ts` expone **7 funciones** que aceptan `token: AuthToken`
como parámetro. Los hooks que las consumen (`useStockStats.ts`) extraen el token de
`useSession()` y lo pasan manualmente a cada función. Esto es el anti-patrón PL-NEW-C:

```ts
// useStockStats.ts — patrón PL-NEW-C activo
const { data: session } = useSession();
const token = session?.user?.accessToken;
// ...
queryFn: () => getTotalStockStats(token as string),  // ← token como parámetro
```

Regla violada: el token debe obtenerse con `getAuthToken()` **dentro del service**,
nunca viajando desde el hook.

Funciones afectadas en `storeService.ts`:
- `getStore(id, token)`
- `getStores(token, page)`
- `getStoreOptions(token)`
- `getTotalStockStats(token)`
- `getStockBySpeciesStats(token)`
- `getStockByProducts(token)`
- `getRegisteredPallets(token)`

Hooks afectados en `useStockStats.ts`:
- `useTotalStockStats()` — queryKey inline + `token as string` cast
- `useStockBySpeciesStats()` — queryKey inline + `token as string` cast
- `useStockByProductsStats()` — queryKey inline + `token as string` cast

Adicionalmente, `storeService.ts` usa el path alias `@lib/fetchWithTenant` (línea 6)
en lugar del canónico `@/lib/fetchWithTenant` — violación TypeScript bloqueante.

Nota: `orderService.ts` tiene el mismo patrón en sus funciones de estadísticas y charts
pero es un archivo de mucho mayor complejidad — se cubre en un GAP separado.

## Solución acordada

1. En `storeService.ts`:
   - Eliminar el parámetro `token: AuthToken` de las 7 funciones
   - Añadir `const token = await getAuthToken()` al inicio de cada función
   - Corregir el path alias `@lib/fetchWithTenant` → `@/lib/fetchWithTenant`
   - Eliminar el tipo `AuthToken` (ya no es necesario)
   - Eliminar el header `Authorization` manual de cada `fetchWithTenant` call
     (fetchWithTenant lo inyecta automáticamente)

2. Añadir factory `storeQueryKeys` a `src/lib/routes/queryKeys.ts`:
   ```ts
   export const storeQueryKeys = {
     totalStock: (tenantId: string | null | undefined) =>
       ['stock', 'total', tenantId ?? 'unknown'] as const,
     stockBySpecies: (tenantId: string | null | undefined) =>
       ['stock', 'by-species', tenantId ?? 'unknown'] as const,
     stockByProducts: (tenantId: string | null | undefined) =>
       ['stock', 'by-products', tenantId ?? 'unknown'] as const,
   };
   ```

3. En `useStockStats.ts`:
   - Eliminar `useSession` import y el bloque `const token = ...`
   - Reemplazar `queryKey` inline por factories `storeQueryKeys.*`
   - Actualizar `enabled` de `!!token && !!tenantId` a `!!tenantId`
   - Eliminar los casts `token as string`

## Referencias e inspiración

- PL-NEW-C (project-learnings.md): tokens NUNCA se pasan como parámetros entre hook y service.
- `src/services/domain/customers/customerService.ts` — implementación correcta de referencia.
- rules/api-client.md: el token lo obtiene el service internamente con `getAuthToken()`.
- La firma de `fetchWithTenant` ya inyecta `Authorization` automáticamente — no hay que añadir el header manualmente.

## Criterios de aceptación

- [ ] Ninguna función de `storeService.ts` acepta `token` como parámetro
- [ ] Cada función de `storeService.ts` llama a `getAuthToken()` internamente
- [ ] `storeService.ts` no tiene el tipo `AuthToken` local
- [ ] `storeService.ts` usa path alias `@/lib/fetchWithTenant` (no `@lib/`)
- [ ] Las llamadas a `fetchWithTenant` en `storeService.ts` no pasan header `Authorization` manualmente
- [ ] Existe `storeQueryKeys` factory en `queryKeys.ts` con `totalStock`, `stockBySpecies`, `stockByProducts`
- [ ] `useStockStats.ts` no importa `useSession`
- [ ] `useStockStats.ts` usa `storeQueryKeys.*` en todos los `queryKey`
- [ ] `enabled` en los 3 hooks de `useStockStats.ts` es `!!tenantId` (sin `!!token`)
- [ ] Los 3 hooks de `useStockStats.ts` retornan la misma interfaz pública
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Modificar:**
- `src/services/storeService.ts` — eliminar token-as-parameter en 7 funciones
- `src/lib/routes/queryKeys.ts` — añadir `storeQueryKeys`
- `src/hooks/useStockStats.ts` — usar service sin token, factories queryKey

## Restricciones

- No cambiar las signaturas de retorno de las funciones de `storeService.ts`
- No cambiar la interfaz pública de los 3 hooks de `useStockStats.ts`
- No tocar `src/services/domain/stores/storeService.js` (archivo legacy — requiere GAP propio)
- `orderService.ts` y sus hooks asociados (`useOrdersStats.ts`, `useDashboardCharts.ts`)
  tienen el mismo patrón pero quedan fuera de scope — se tratan en GAP separado
- No añadir tests en este GAP

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
