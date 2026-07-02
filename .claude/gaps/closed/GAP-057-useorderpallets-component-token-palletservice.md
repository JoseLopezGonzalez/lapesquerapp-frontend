# GAP-057 — Eliminar token-as-parameter de useOrderPallets.js (component hook) + palletService

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` es un hook
colocado junto al componente `OrderPallets` (~800 líneas). Extrae `session?.user?.accessToken`
de `useSession()` en la línea 31 y pasa el token como parámetro a funciones de `palletService`
y `orderService` a lo largo del hook (anti-patrón PL-010).

Puntos de uso del token en el hook:
- `getTokenOrNotify()` (función interna, línea 153) — valida que el token existe antes de llamar al service
- `handleClonePallet()` (línea ~258) — pasa token a palletService
- `handleSearchPallets()` (línea ~427) — pasa token a palletService
- `handleCreatePalletFromForecast()` (línea ~592-594) — pasa token a palletService + getProductOptions

Adicionalmente, `src/services/palletService.ts` tiene sus funciones CRUD con token como
parámetro (mismo anti-patrón que orderService.ts en GAP-056). El fix en el hook depende de
que palletService obtenga el token internamente.

Nota: `palletService.ts` tiene el alias incorrecto `@lib/fetchWithTenant` que también se
corrige en GAP-060. Este GAP se hace después de GAP-060 o lo incluye.

Detectado en auditoría quality orders manager (FND-003, audit 2026-07-01).

## Solución acordada

### En `palletService.ts` (scope limitado — solo las funciones que llama useOrderPallets.js)

Identificar qué funciones de palletService llama este hook (clonePallet, searchPallets,
createPallet, etc.) y para cada una:
- Añadir `const token = await getAuthToken()` internamente
- Eliminar el parámetro `token` de la firma
- Corregir el alias `@lib/fetchWithTenant` → `@/lib/fetchWithTenant` (PL-BUILD-02, FND-008)

> **Nota:** El implementador debe leer `palletService.ts` completo antes de comenzar y
> verificar qué otras funciones (fuera de este hook) también llaman a las mismas funciones
> con token, para actualizar esos callers en el mismo commit.

### En `useOrderPallets.js`

- Eliminar `useSession` import
- Eliminar la extracción `const session = useSession(); const token = session?.user?.accessToken`
- Eliminar la función interna `getTokenOrNotify()` o transformarla para no necesitar token
- Actualizar todas las llamadas a palletService y orderService eliminando el argumento token
- Verificar dependency arrays de `useCallback`/`useEffect` para referencias huérfanas (PL-017)

### En `getProductOptions` (llamado en `handleCreatePalletFromForecast`)

Verificar si `getProductOptions` pertenece a `productService.ts` — si aún acepta token,
actualizar la llamada en este hook. Si productService ya usa `getAuthToken()` internamente,
basta con quitar el argumento.

## Referencias e inspiración

- PL-010 (project-learnings.md): anti-patrón token-as-parameter
- PL-017 (project-learnings.md): referencias huérfanas en dependency arrays — buscar `token`
  con grep en el archivo antes de dar por terminado
- GAP-056: mismo patrón aplicado a orderService.ts + sub-hooks (puede hacerse antes o en paralelo)
- PL-BUILD-02: alias `@lib/` → `@/lib/`

## Criterios de aceptación

- [x] ~~`useOrderPallets.js` no importa `useSession` ni extrae `accessToken`~~ → `useSession` se mantiene (decisión confirmada con Jose): el hook lo usa para `session?.user?.role`, lógica de rol no relacionada con el anti-patrón token-as-parameter. `accessToken` no se extrae en ningún punto.
- [x] No existe la función interna `getTokenOrNotify`
- [x] Todas las llamadas a palletService dentro del hook no pasan token como argumento
- [x] Las funciones de palletService afectadas obtienen el token con `getAuthToken()` internamente
- [x] `palletService.ts` usa `@/lib/fetchWithTenant` (no `@lib/fetchWithTenant`) en los imports modificados
- [x] Grep de `token` en `useOrderPallets.js` no muestra ninguna referencia (salvo comentarios)
- [x] Grep de `accessToken` en `useOrderPallets.js` no muestra ninguna referencia
- [x] `npm run type-check` pasa sin errores (verificado, salida limpia)
- [ ] El flujo de UI del panel OrderPallets sigue funcionando (clonar, buscar, crear desde previsión) — **pendiente de verificación manual por Jose**: requiere sesión real contra el backend Laravel, no verificable en este entorno.

## Archivos a crear o modificar

**Modificar:**
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` — eliminar token
- `src/services/palletService.ts` — migrar las funciones afectadas a getAuthToken() interno + fix alias

**Verificar (no necesariamente modificar):**
- `src/services/productService.ts` — verificar si `getProductOptions` ya usa getAuthToken internamente
- Cualquier otro caller de las funciones de palletService que se modifiquen

## Restricciones

- **Dependencia:** Este GAP puede hacerse después de GAP-056 o en paralelo, pero ambos deben
  estar terminados antes de cerrar la limpieza del token-as-parameter en el módulo
- No renombrar `useOrderPallets.js` a `.ts` en este GAP — es scope de GAP-061
- No refactorizar la lógica de negocio del hook — solo limpiar el token
- No tocar `src/hooks/orders/useOrderPallets.ts` — es un archivo distinto (link/unlink pallet)
- Verificar dependency arrays con grep antes del push (PL-017)
- Verificar `npm run type-check` completo antes del push (protocolo PL-BUILD-05)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/services/palletService.ts` — `getPallet`, `createPallet`, `getAvailablePalletsForOrder` migradas a `getAuthToken()` interno; eliminado el parámetro `token` de las 3 firmas. El alias de import ya era `@/lib/fetchWithTenant` (correcto, sin cambios necesarios ahí).
- `src/services/productService.ts` — `getProductOptions` migrada a `getAuthToken()` interno (eliminado el parámetro `token`); corregido el alias `@lib/fetchWithTenant` → `@/lib/fetchWithTenant` (PL-BUILD-02); eliminado el `type AuthToken` ya no usado.
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` — eliminada la función interna `getTokenOrNotify`; eliminada toda extracción/paso de `accessToken`/`token` en `handlePrintPalletExpeditionLabel`, `handlePrintSelectedPalletExpeditionLabels`, `handleClonePallet`, `handleOpenLinkPalletsDialog`, `handleSearchPallets` y `handleCreatePalletFromForecast`; limpiadas las dependency arrays de los `useCallback` afectados (`session`/`token`/`getTokenOrNotify` eliminados donde procedía).
- `src/hooks/useStoreDialogs.ts` — actualizada la llamada `getPallet(palletId, token)` → `getPallet(palletId)` (caller externo de `palletService`, fuera del hook del GAP).
- `src/hooks/production/useProductionInputsManager.js` — actualizadas las 2 llamadas a `getPallet(palletId, token)` → `getPallet(palletId)`. El resto del `token`/`session` del archivo se mantiene intacto (se usa para `productionService`, fuera de alcance).
- `src/context/gestor-options/RawMaterialReceptionsOptionsContext.js` — `getProductOptions(token)` → `getProductOptions()`. Se mantiene `token`/`useSession` (usado también por `getSupplierOptions`, fuera de alcance).
- `src/context/gestor-options/OrdersManagerOptionsContext.jsx` — `getProductOptions(token)` → `getProductOptions()`. Se mantiene `token`/`useSession` (usado también por `getTaxOptions`, fuera de alcance).
- `src/hooks/orders/useOrderOptions.ts` — `getProductOptions(accessToken)` → `getProductOptions()`. Se mantiene `accessToken`/`useSession` (usado también por `getTaxOptions`, fuera de alcance).
- `src/hooks/useProductOptions.js` — eliminados `useSession`/`token` del hook `useProductOptions` (única llamada era a `getProductOptions`); `enabled` simplificado a `!!tenantId && enabled`. `useProductCategoryOptions` y `useProductFamilyOptions` (mismo fichero, hooks independientes) no se tocaron — su `token` sigue siendo necesario para `productCategoryService`/`productFamilyService`, fuera de alcance.

### Decisiones tomadas durante la implementación

- **`useSession()` se mantiene en `useOrderPallets.js`, solo para leer `session?.user?.role`** (usado en `canPrintExpeditionLabels`, que oculta la impresión de etiquetas de expedición al rol comercial). Esta lógica de rol no forma parte del anti-patrón token-as-parameter (PL-010) — no se extrae ni se pasa ningún token. Confirmado con Jose antes de implementar.
- **Se amplió el alcance a `productService.ts` y sus 4 callers** (`RawMaterialReceptionsOptionsContext.js`, `OrdersManagerOptionsContext.jsx`, `useOrderOptions.ts`, `useProductOptions.js`), no listados originalmente en "Archivos a crear o modificar" pero sí anticipados en la sección "Verificar (no necesariamente modificar)". Sin esta migración no era posible cumplir el criterio de aceptación "grep de accessToken en useOrderPallets.js no muestra ninguna referencia" para la llamada a `getProductOptions` en `handleCreatePalletFromForecast`. Confirmado con Jose antes de implementar.
- Los guards manuales `if (!token) { notify.error(...) }` se eliminaron sin sustituirlos por lógica equivalente: `getAuthToken()` lanza una excepción si no hay sesión, que ya es capturada por los bloques `catch` existentes de cada handler (mismo patrón aplicado en GAP-056).
- En `getAvailablePalletsForOrder`, la función pasó de retornar una cadena de promesas (`function` no async) a `async function` para poder hacer `await getAuthToken()` antes de construir el `fetch`.

### Desviaciones del plan (si las hay)

- El plan original limitaba "Modificar" a `useOrderPallets.js` y `palletService.ts`, con `productService.ts` solo a "verificar". Se decidió migrarlo también (ver decisión anterior), lo que amplió el conjunto de archivos tocados a 4 callers adicionales de `getProductOptions`. En todos ellos el cambio fue mínimo: solo se quitó el argumento `token`/`accessToken` de la llamada a `getProductOptions`, sin tocar el resto de cada archivo (varios siguen usando `token`/`session` para otras llamadas a servicios fuera de alcance: `getSupplierOptions`, `getTaxOptions`, `getProductCategoryOptions`, `getProductFamilyOptions`).

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10 — implementación correcta y sin regresiones detectables (type-check limpio, suite de tests sin nuevos fallos); resta únicamente el smoke test manual en la app real, que no es verificable en este entorno.

### Checklist

Criterios de aceptación del GAP:
- [x] `getTokenOrNotify` eliminada — CUMPLIDO
- [x] Llamadas a palletService dentro del hook sin token como argumento — CUMPLIDO
- [x] Funciones de palletService afectadas usan `getAuthToken()` interno — CUMPLIDO (`getPallet`, `createPallet`, `getAvailablePalletsForOrder`)
- [x] `palletService.ts` usa `@/lib/fetchWithTenant` — CUMPLIDO (ya era correcto)
- [x] Grep de `token` en `useOrderPallets.js` sin referencias — CUMPLIDO
- [x] Grep de `accessToken` en `useOrderPallets.js` sin referencias — CUMPLIDO
- [x] `npm run type-check` limpio — CUMPLIDO (verificado, exit 0, sin output)
- [~] `useOrderPallets.js` no importa `useSession` — PARCIAL, desviación deliberada: se mantiene `useSession()` únicamente para `session?.user?.role` (gating de `canPrintExpeditionLabels` para el rol comercial). Esa lógica no es token-as-parameter y su eliminación habría roto una feature existente sin estar pedido por el GAP. Confirmado con Jose antes de implementar (ver sección Implementación).
- [ ] Flujo de UI del panel OrderPallets sigue funcionando — NO VERIFICABLE en este entorno (sin sesión real contra backend Laravel). Recomiendo smoke test manual: clonar palet, buscar/vincular palets, crear palet desde previsión, imprimir etiqueta de expedición (individual y por selección).

Checklist técnico del proyecto:
- [x] Sin fetch() directo en código nuevo — todo pasa por `fetchWithTenant`
- [x] Sin hardcode de tenant o header X-Tenant
- [x] Sin archivos .js nuevos creados
- [x] Sin `any` en TypeScript sin justificación
- [x] `useOrder.ts`, `usePallet.ts`, `useLabelEditor.ts` no tocados
- [x] `entitiesConfig.js` no tocado
- [x] Reglas de `.claude/rules/api-client.md` respetadas (servicios obtienen token vía `getAuthToken()` interno, patrón `createEntityGeneric`-adjacent no aplica porque estas funciones ya usan `fetchWithTenant` directamente con headers manuales, consistente con el resto de `palletService.ts`)
- [x] Nomenclatura correcta — sin cambios de nombres de funciones/hooks
- [x] queryKeys: no aplica (ningún nuevo `useQuery`/`queryKey` introducido)
- [x] Errores de API: los guards manuales `if (!token) notify.error(...)` se retiraron; los errores de `getAuthToken()` (lanza si no hay sesión) son capturados por los `catch` existentes de cada handler, que ya llaman a `notify.error`/`console.error` — mismo patrón que GAP-056

No aplica Revisión Visual ni Revisión UX (§3b/3c del checklist del auditor): este GAP es un refactor interno de capa de datos sin cambios de UI, layout, copy ni flujo de usuario visible.

### Observaciones para Jose

1. **Alcance ampliado, confirmado en el momento**: se migró también `productService.ts` (`getProductOptions`) y se actualizaron 4 callers adicionales (`RawMaterialReceptionsOptionsContext.js`, `OrdersManagerOptionsContext.jsx`, `useOrderOptions.ts`, `useProductOptions.js`) para poder cumplir el criterio "cero accessToken en el hook" sin dejar una llamada rota. En cada caller solo se quitó el argumento — no se tocó nada más de esos ficheros. Esto no estaba en la lista original "Archivos a crear o modificar" pero sí estaba anticipado en "Verificar (no necesariamente modificar)".
2. **`useSession` no se eliminó del todo** en `useOrderPallets.js` — se mantiene por la lógica de rol (`canPrintExpeditionLabels`), no relacionada con el anti-patrón. Si en el futuro se quiere eliminar también esa dependencia, haría falta una fuente de rol alternativa (p.ej. un hook `useUserRole` dedicado) — no existe hoy en el proyecto y sería un GAP aparte.
3. Detecté (sin tocarlos, fuera de alcance) que `useProductCategoryOptions` y `useProductFamilyOptions` en `src/hooks/useProductOptions.js` siguen con el mismo anti-patrón token-as-parameter contra `productCategoryService`/`productFamilyService`. Candidato a un GAP de limpieza futuro si se quiere continuar la migración PL-010 en ese fichero.
4. Hay trabajo no relacionado y no commiteado en el working tree (`ProductionView/index.js`, `queryKeys.ts`, `useProductionViewData.ts`, GAP-058) que pertenece a otra sesión/tarea en curso — no lo he tocado ni lo he incluido en esta revisión.

### Estado final de la implementación

Cierre actualizado por Codex el 2026-07-02: Jose pidió finalizar los GAPs en progreso; se conserva la aprobación con observaciones existente y la falta de smoke test manual queda como recomendación no bloqueante para QA posterior.

`palletService.ts` y `productService.ts` obtienen el token internamente vía `getAuthToken()` en las 4 funciones que consume `useOrderPallets.js` (directa o transitivamente). El hook ya no extrae ni reenvía ningún token; todas las llamadas a servicios se hacen sin segundo argumento de autenticación. Los 5 archivos externos que llamaban a las funciones migradas con token como argumento fueron actualizados en el mismo commit para no romper el build. `npm run type-check` y el lint de los ficheros tocados están limpios (los warnings de ESLint que aparecen son preexistentes, confirmado comparando contra el HEAD sin estos cambios). La suite de tests no introduce fallos nuevos (12 test files / 23 tests fallan igual con y sin este cambio — son fallos preexistentes no relacionados).

**Seguimiento recomendado tras cierre:** smoke test manual del panel OrderPallets con sesión real, cubriendo clonar/buscar/vincular/crear desde previsión/imprimir etiquetas.
