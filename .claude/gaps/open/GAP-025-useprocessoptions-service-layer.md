# GAP-025 — Migrar useProcessOptions al service layer

## Metadata

- **Tipo:** Refactor
- **Módulo:** Maquiladores / Producción
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/production/useProcessOptions.ts` acumula cinco violaciones de calidad:

1. **PL-001 — fetchWithTenant directo desde el hook** (línea 7, 58): el hook importa
   `fetchWithTenant` y lo llama directamente, saltándose la capa de servicios.

2. **PL-NEW-C — Token extraído en el hook y pasado a mano** (líneas 50-51, 61):
   el hook obtiene `session?.user?.accessToken` y construye manualmente el header
   `Authorization: Bearer ${token}`. Regla: el token debe obtenerse con `getAuthToken()`
   **dentro del service**, nunca en el hook.

3. **Inline queryKey array** (línea 55): `['processes', 'options', tenantId ?? 'unknown']`
   viola la regla ESLint de queryKey factories. Debe existir una factory en `queryKeys.ts`.

4. **console.error en producción** (línea 67): violación de la regla general.

5. **Sin endpoint genérico**: el hook construye la petición HTTP completa en lugar de
   usar `fetchEntitiesGeneric` del service layer.

No existe ningún `processService.ts` — hay que crearlo.

## Solución acordada

1. Crear `src/services/domain/productions/processService.ts` con método `getOptions()`
   que usa `fetchEntitiesGeneric` + `getAuthToken()` internamente.

2. Añadir factory `processOptionKeys` a `src/lib/routes/queryKeys.ts`.

3. Actualizar `useProcessOptions.ts`:
   - Eliminar imports de `fetchWithTenant`, `useSession`
   - Reemplazar `queryFn` para llamar a `processService.getOptions()`
   - Reemplazar `queryKey` inline por `processOptionKeys.options(tenantId)`
   - Eliminar `console.error`
   - `enabled` pasa de `!!token && !!tenantId` a `!!tenantId` (el token se gestiona internamente)

La interfaz pública del hook (`useProcessOptions`) y sus tipos exportados
(`ProcessOption`, `NormalizedProcessOption`, `normalizeProcessOptionsList`) no cambian.

## Referencias e inspiración

- PL-001 / PL-NEW-C (project-learnings.md)
- `src/services/domain/customers/customerService.ts` — referencia de implementación correcta
- `src/lib/routes/queryKeys.ts` — patrón de factories existentes (`commercialRouteKeys`, etc.)
- rules/api-client.md — flujo obligatorio: hook → service → fetchEntitiesGeneric → fetchWithTenant

## Criterios de aceptación

- [ ] Existe `src/services/domain/productions/processService.ts` con `processService.getOptions(): Promise<ProcessOption[]>`
- [ ] `processService.getOptions()` llama a `getAuthToken()` internamente — sin token como parámetro
- [ ] `processService.getOptions()` usa `fetchEntitiesGeneric` — sin `fetchWithTenant` directo
- [ ] Existe factory `processOptionKeys` en `queryKeys.ts` con al menos `processOptionKeys.options(tenantId)`
- [ ] `useProcessOptions.ts` no importa `fetchWithTenant`
- [ ] `useProcessOptions.ts` no importa `useSession`
- [ ] `useProcessOptions.ts` usa `processOptionKeys.options(tenantId)` en `queryKey`
- [ ] `useProcessOptions.ts` no contiene `console.error` ni `console.log`
- [ ] La función `normalizeProcessOptionsList` se mantiene sin cambios
- [ ] Los tipos `ProcessOption` y `NormalizedProcessOption` se mantienen exportados
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Crear:**
- `src/services/domain/productions/processService.ts`

**Modificar:**
- `src/lib/routes/queryKeys.ts` — añadir `processOptionKeys` factory
- `src/hooks/production/useProcessOptions.ts` — usar service + factory, eliminar violaciones

## Restricciones

- No cambiar la interfaz pública del hook: mismos parámetros, mismo retorno `{ processes, isLoading, error }`
- No eliminar ni renombrar los tipos exportados `ProcessOption`, `NormalizedProcessOption`
- No modificar `normalizeProcessOptionsList` — lógica de negocio intocable en este GAP
- No tocar `productionService.js` (archivo legacy protegido de facto — requeriría GAP de migración propio)
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
