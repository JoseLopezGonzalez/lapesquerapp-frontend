# GAP-026 — Extraer getSpainAverageDieselPrice a fuelService.ts

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global (utilidad de precio combustible)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/useSpainAverageDieselPrice.ts` contiene dos violaciones:

1. **fetch() a API externa en el hook** (línea 32): la función `getSpainAverageDieselPrice()`
   vive dentro del mismo archivo del hook. La regla PL-NEW-B establece que las funciones
   que llaman a APIs externas públicas (sin auth, sin X-Tenant) deben vivir en un service
   file — nunca inline en el hook.

   Nota: el uso de `fetch()` directo aquí es **correcto** para APIs externas públicas
   (no se usa `fetchWithTenant`, que sería incorrecto). El problema es solo la ubicación
   de la función.

2. **Inline queryKey array** (línea 66): `['fuel', 'spain-average-diesel']` viola la regla
   ESLint de queryKey factories. Necesita una factory en `queryKeys.ts`.

La lógica de parseo (`parseSpanishDecimal`, `formatDieselPrice`) y los tipos
(`DieselStation`, `DieselApiResponse`) son detalles de implementación del servicio.

## Solución acordada

1. Crear `src/services/domain/fuel/fuelService.ts` con:
   - Tipos `DieselStation` y `DieselApiResponse`
   - Funciones privadas `parseSpanishDecimal` y `formatDieselPrice`
   - Función exportada `getSpainAverageDieselPrice(): Promise<{ value, label, sampleCount, sourceDate }>`

2. Añadir factory `fuelQueryKeys` a `src/lib/routes/queryKeys.ts`:
   ```ts
   export const fuelQueryKeys = {
     spainAverageDiesel: () => ['fuel', 'spain-average-diesel'] as const,
   };
   ```

3. Actualizar `useSpainAverageDieselPrice.ts`:
   - Eliminar la función `getSpainAverageDieselPrice` y los tipos del archivo
   - Importar `getSpainAverageDieselPrice` desde `fuelService`
   - Usar `fuelQueryKeys.spainAverageDiesel()` en `queryKey`

## Referencias e inspiración

- PL-NEW-B (project-learnings.md): funciones que llaman APIs externas públicas deben
  estar en service files, no en hooks.
- `src/lib/routes/queryKeys.ts` — patrón de factories.
- rules/api-client.md — separación de capas: hook → service.

## Criterios de aceptación

- [ ] Existe `src/services/domain/fuel/fuelService.ts` con `getSpainAverageDieselPrice` exportada
- [ ] `fuelService.ts` no importa `fetchWithTenant` (la API externa pública no lo usa)
- [ ] Existe factory `fuelQueryKeys.spainAverageDiesel()` en `queryKeys.ts`
- [ ] `useSpainAverageDieselPrice.ts` no contiene la función `getSpainAverageDieselPrice`
- [ ] `useSpainAverageDieselPrice.ts` usa `fuelQueryKeys.spainAverageDiesel()` en `queryKey`
- [ ] La interfaz pública del hook no cambia: mismo retorno `{ value, label, sampleCount, sourceDate, isLoading, isUnavailable }`
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Crear:**
- `src/services/domain/fuel/fuelService.ts`

**Modificar:**
- `src/lib/routes/queryKeys.ts` — añadir `fuelQueryKeys`
- `src/hooks/useSpainAverageDieselPrice.ts` — importar service, usar factory queryKey

## Restricciones

- No cambiar la lógica de parseo ni de formateo — mover sin modificar
- No usar `fetchWithTenant` en `fuelService.ts` — la API del ministerio es pública y sin tenant
- No cambiar la interfaz pública del hook
- `DIESEL_API_URL` puede moverse al service o mantenerse como constante en el mismo archivo
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
- [ ] Sin fetch() directo en hooks/componentes para APIs internas de Laravel
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
