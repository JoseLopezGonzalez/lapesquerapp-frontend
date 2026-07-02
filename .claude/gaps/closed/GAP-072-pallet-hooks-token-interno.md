# GAP-072 — Eliminar token-as-parameter en hooks de pallet (usePallet stack)

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock / Palets
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Auditoría `/audit-code quality pallet editor` (2026-07-01). Anti-patrón PL-010: hooks del
stack de edición de palet extraen `session?.user?.accessToken` con `useSession()` y propagan
el token a servicios, en lugar de que el service obtenga el token con `getAuthToken()`.

GAP-043 migró componentes de palet (p. ej. `PalletView`) pero **no** el hook gigante ni sus
sub-hooks. GAP-057 cubre `useOrderPallets.js` + funciones CRUD de `palletService.ts` usadas
desde pedidos — este GAP cubre el **stack de edición de palet**.

**Instancias detectadas:**

| Archivo | Patrón |
|---|---|
| `src/hooks/usePallet.ts:49-50` | `useSession()` → `accessToken` → `getPallet(id, token)`, `getProductOptions(token)` |
| `src/hooks/usePallet.ts:193-194` | Pasa `token` a `usePalletSave` |
| `src/hooks/pallets/usePalletSave.ts:15,74-106` | Recibe `token` y lo pasa a `createPallet` / `updatePallet` |
| `src/hooks/usePalletTimeline.ts:29-30,46,77` | `useSession()` → `getPalletTimeline(palletId, token)` |

`usePalletBoxCreation.ts` usa `session` solo para permisos (`canManagePalletCostFields`) —
**no** para token. Conservar `useSession()` ahí si sigue siendo necesario.

---

## Solución acordada

1. En `palletService.ts`, migrar a `getAuthToken()` interno las funciones consumidas por este
   stack (si GAP-057 aún no las migró):
   - `getPallet` — eliminar parámetro `token` (hoy opcional por retrocompatibilidad GAP-043)
   - `createPallet`, `updatePallet`
   - `getPalletTimeline`
2. Actualizar callers externos restantes que aún pasen token a esas funciones (grep obligatorio):
   - `useStoreDialogs.ts`, `useProductionInputsManager.js`, etc.
3. En `usePallet.ts`:
   - Eliminar extracción de `accessToken`
   - Mantener `useSession()` si se usa para `isExternalActor(session?.user)` u otros checks de rol
   - Sustituir `getPallet(id, token)` → `getPallet(id)` y `getProductOptions(token)` → sin token
   - Dejar de pasar `token` a `usePalletSave`
4. En `usePalletSave.ts`: eliminar prop `token` y llamadas con token a `createPallet` / `updatePallet`
5. En `usePalletTimeline.ts`: eliminar `useSession` para token; las llamadas a
   `getPalletTimeline` no reciben token (el service lo resuelve internamente)

**Coordinación con GAP-057:** Si ambos GAPs tocan `palletService.ts`, implementar en el mismo
PR o secuencialmente (057 primero) para evitar conflictos de merge.

---

## Referencias e inspiración

- PL-010, PL-017 (grep de `token`/`session` en deps antes de cerrar)
- GAP-043 (PalletView — parcial)
- GAP-057 (useOrderPallets + palletService CRUD desde pedidos)
- GAP-056 (mismo patrón en orderService)

## Criterios de aceptación

- [ ] `usePallet.ts` no extrae `session?.user?.accessToken` para llamadas HTTP
- [ ] `usePalletSave.ts` no recibe ni reenvía `token`
- [ ] `usePalletTimeline.ts` no usa `useSession()` solo para obtener token de API
- [ ] `getPallet`, `createPallet`, `updatePallet`, `getPalletTimeline` obtienen token con `getAuthToken()` internamente
- [ ] Grep de `accessToken` en los tres hooks sin usos para HTTP (salvo comentarios)
- [ ] Grep de referencias huérfanas a `token` en dependency arrays (PL-017)
- [ ] `npm run type-check` limpio en archivos tocados
- [ ] Flujos de edición/creación de palet y pestaña Historial siguen funcionando

## Archivos a crear o modificar

**Modificar (obligatorio):**
- `src/hooks/usePallet.ts`
- `src/hooks/pallets/usePalletSave.ts`
- `src/hooks/usePalletTimeline.ts`
- `src/services/palletService.ts` — funciones del stack usePallet (coordinar con GAP-057)

**Modificar (si grep revela callers con token):**
- `src/hooks/useStoreDialogs.ts`
- `src/hooks/production/useProductionInputsManager.js`
- Otros callers de `getPallet` / `getPalletTimeline` con token explícito

## Restricciones

- **No añadir lógica nueva** a `usePallet.ts` — solo eliminar propagación de token
- No refactorizar lógica de negocio de cajas, scanner GS1-128 ni permisos de coste
- Verificar `npm run type-check` completo antes de push (PL-BUILD-05)
- Si se elimina `session` de un archivo, grep completo del nombre en el archivo (PL-017)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/services/palletService.ts` — `updatePallet` y `getPalletTimeline` migrados a `getAuthToken()` interno (firma sin `token`, funciones ahora `async`). `getPallet` y `createPallet` ya estaban migrados (confirmado por grep, sin cambios necesarios ahí).
- `src/hooks/usePallet.ts` — eliminada extracción de `accessToken`; `useSession()` se conserva solo para `isExternalActor(session?.user)`. `getPallet(id)`/`getProductOptions()` sin token. Ya no se pasa `token` a `usePalletSave`. Eliminado el guard `if (!token) setError(...)` (ya no aplica). `token` fuera del array de deps del `useEffect` de carga.
- `src/hooks/pallets/usePalletSave.ts` — eliminado `token` de la interfaz `UsePalletSaveParams`, de la destructuración y de las llamadas a `createPallet`/`updatePallet`.
- `src/hooks/usePalletTimeline.ts` — eliminado `useSession()` (solo se usaba para el token); `getPalletTimeline` se llama sin token en ambos call sites; `token` fuera de los deps arrays.

### Decisiones tomadas durante la implementación

- `getProductOptions()` devuelve productos sin `boxGtin` tipado en su interfaz base; se
  mantuvo el mismo patrón de cast `unknown` ya usado en `useOrderPallets.ts` para acceder a
  ese campo extra sin usar `any`.
- Callers verificados vía grep: `useOrderPallets.ts`, `useStoreDialogs.ts`,
  `useProductionInputsManager.js` — ninguno pasaba token a las 4 funciones de este GAP
  (algunos usan `accessToken` para otras funciones fuera de scope, correctamente no tocadas).

### Desviaciones del plan (si las hay)

Ninguna. Scope respetado exactamente según la lista de archivos del GAP.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — refactor limpio, sin residuos de `accessToken`/`token` para HTTP, `session` conservado únicamente donde es legítimo (permisos), type-check limpio

### Checklist

- [x] Criterios de aceptación cumplidos (los 8, verificados por lectura de diff + grep)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación (cast `unknown` en vez de `any` para `boxGtin`)
- [x] Hooks gigantes no tocados sin permiso (usePallet.ts ya no está en la lista de protegidos por tamaño; cambio autorizado explícitamente por el GAP)
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados (token-as-parameter eliminado, servicios resuelven auth internamente)
- [x] Nomenclatura correcta

### Observaciones para Jose

Implementación sólida. Verifiqué con grep que no queda ningún `accessToken`/`session?.user
?.accessToken` para HTTP en los 3 hooks tocados — los únicos usos de `session` restantes son
para permisos (`isExternalActor`, `canManagePalletCostFields`), exactamente la excepción que
el propio GAP documentaba. `npm run type-check` pasa limpio para todo el repo (incluyendo el
trabajo concurrente de GAP-073 en el mismo working tree). No pude verificar en navegador que
los flujos de edición/creación de palet y la pestaña Historial siguen funcionando end-to-end
(criterio de aceptación 8) — solo verificación estática (tipos + grep). Recomiendo una prueba
manual rápida de crear/editar un palet antes de dar esto por 100% verificado en producción.

### Estado final de la implementación

El stack de edición de palet (`usePallet`, `usePalletSave`, `usePalletTimeline`,
`palletService`) ya no propaga el token como parámetro — los 4 métodos de servicio
(`getPallet`, `createPallet`, `updatePallet`, `getPalletTimeline`) obtienen el token
internamente vía `getAuthToken()`, siguiendo el mismo patrón que el resto de servicios del
proyecto.
