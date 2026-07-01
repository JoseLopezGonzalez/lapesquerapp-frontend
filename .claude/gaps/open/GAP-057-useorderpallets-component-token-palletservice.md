# GAP-057 — Eliminar token-as-parameter de useOrderPallets.js (component hook) + palletService

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
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

- [ ] `useOrderPallets.js` no importa `useSession` ni extrae `accessToken`
- [ ] No existe la función interna `getTokenOrNotify` (o fue refactorizada para no necesitar token)
- [ ] Todas las llamadas a palletService dentro del hook no pasan token como argumento
- [ ] Las funciones de palletService afectadas obtienen el token con `getAuthToken()` internamente
- [ ] `palletService.ts` usa `@/lib/fetchWithTenant` (no `@lib/fetchWithTenant`) en los imports modificados
- [ ] Grep de `token` en `useOrderPallets.js` no muestra ninguna referencia (salvo comentarios)
- [ ] Grep de `accessToken` en `useOrderPallets.js` no muestra ninguna referencia
- [ ] `npm run type-check` pasa sin errores (verificar cascada antes del push)
- [ ] El flujo de UI del panel OrderPallets sigue funcionando (clonar, buscar, crear desde previsión)

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
