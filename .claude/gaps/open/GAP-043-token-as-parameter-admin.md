# GAP-043 — Eliminar token-as-parameter en OrdersManager, PalletView, Receptions y Stores

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Stock / Maquiladores
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

Anti-patrón PL-010 documentado en `project-learnings.md`: hooks y componentes extraen `session?.user?.accessToken` mediante `useSession()` y pasan el token como parámetro a funciones de service. El token debe obtenerse **internamente** en el service mediante `getAuthToken()`.

Los servicios afectados ya han sido parcialmente migrados (GAP-027 storeService, GAP-028 orderService) pero los componentes y hooks que los llaman aún siguen pasando el token como argumento.

**Instancias detectadas:**

| Archivo | Líneas | Patrón |
|---|---|---|
| `OrdersManager/OrdersList/index.js` | 53, 102 | `session?.user?.accessToken` → pasado a funciones de pedido |
| `OrdersManager/CreateOrderForm/index.tsx` | 185–190 | `token` extraído de `useSession()` → pasado a `getCustomer()` |
| `Pallets/PalletDialog/PalletView/index.tsx` | 231, 279, 313, 318, 321 | `token` extraído de `useSession()` → pasado a funciones de palet (×5) |
| `Admin/ProductionsControlPanel/index.jsx` | 1479–1480 | `token` extraído → pasado a service de producción |
| `RawMaterialReceptions/EditReceptionForm/index.js` | 373, 388, 666, 2132, 2142 | `token` → pasado a service de recepciones (×5) |
| `Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx` | 54–55 | `token` → pasado a service de almacén |

---

## Solución acordada

Para cada archivo:
1. Eliminar la extracción de `session?.user?.accessToken` de `useSession()` (si ya no se necesita para otra cosa).
2. Eliminar el parámetro `token` de las llamadas a service.
3. Verificar que los services correspondientes ya llaman a `getAuthToken()` internamente (GAP-027 y GAP-028 ya lo hicieron para store y order). Para los otros services, verificar antes de tocar el componente.

Si algún service aún no tiene `getAuthToken()` interno → añadirlo al service correspondiente en este mismo GAP.

**Servicios a verificar (si ya tienen getAuthToken interno):**
- `orderService.ts` → ya migrado en GAP-028
- `storeService.ts` → ya migrado en GAP-027
- Service de producción → verificar antes de implementar
- Service de recepciones → verificar antes de implementar
- `labelService.ts` o similar para PalletView → verificar antes de implementar

---

## Criterios de aceptación

- [ ] Ninguno de los archivos listados llama a `useSession()` para extraer el `accessToken`
- [ ] Ninguna llamada a service recibe `token` como argumento donde antes se pasaba manualmente
- [ ] Los services afectados obtienen el token internamente mediante `getAuthToken()`
- [ ] Si `useSession()` se elimina de un archivo, el import también se elimina (si no tiene otros usos)
- [ ] El comportamiento funcional de todas las operaciones (crear pedido, mover palets, etc.) no cambia
- [ ] TypeScript compila sin errores en los archivos modificados
- [ ] `npm run type-check` limpio tras todos los cambios

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/OrdersList/index.js`
- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`
- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx`
- `src/components/Admin/ProductionsControlPanel/index.jsx`
- `src/components/Admin/RawMaterialReceptions/EditReceptionForm/index.js`
- `src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx`
- Posiblemente: service files que aún no tengan `getAuthToken()` (determinar durante implementación)

## Restricciones

- No refactorizar la lógica de negocio de ningún componente
- No tocar `src/hooks/useOrder.js` ni `src/hooks/usePallet.ts` (protegidos)
- Este GAP NO aborda el `@ts-nocheck` de PalletView (ver GAP-039) — los dos pueden implementarse en cualquier orden

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
