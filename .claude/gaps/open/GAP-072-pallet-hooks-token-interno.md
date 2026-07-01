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
