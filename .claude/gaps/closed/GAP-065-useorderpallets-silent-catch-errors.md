# GAP-065 — Feedback de error faltante en 4 catch de useOrderPallets.js (component hook)

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-desktop order editor` (2026-07-01), auditando el editor de pedidos
(`Order/index.tsx` y su pestaña de Palets).

`src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` usa
`notify.error(...)` correctamente en más de 20 sitios del archivo, pero 4 `catch` concretos
solo hacen `console.error(...)` sin ningún `notify.error` — el usuario no recibe ningún
feedback visual cuando esas operaciones fallan. La UI se queda igual que si nada hubiera
pasado, dando la impresión de que el clic no hizo nada.

Los 4 puntos exactos:

1. **`handlePalletChange`** (línea 120) — falla al editar o crear un palet desde el diálogo
   de edición. `catch (error) { console.error('Error al actualizar palet:', error); }`
2. **`handleConfirmAction`** (línea 338) — falla al ejecutar la acción ya confirmada en el
   `AlertDialog` de confirmación (eliminar palet, desvincular palet, o desvincular todos).
   Es el caso más grave: el usuario confirmó explícitamente una acción y no se entera de que
   no se ejecutó. `catch (error) { console.error('Error al ejecutar la acción:', error); if (confirmAction === 'unlink') setUnlinkingPalletId(null); }`
3. **`handleLinkPallets`** (línea 543) — falla al vincular los palets seleccionados al
   pedido. `catch (error) { console.error('Error al vincular palets:', error); } finally { setIsLinking(false); }`
4. **`handleCreatePalletFromForecast` → carga de opciones de producto** (línea 626) — falla
   al cargar el mapa de productos usado para generar el código GS1-128 del palet creado
   desde previsión. Este caso tiene fallback (usa el `productId` crudo como GTIN si el mapa
   no se pudo construir), por lo que es de menor gravedad, pero sigue sin avisar al usuario
   de que el nombre/GTIN del producto puede no ser el correcto.

**Nota de corrección:** la auditoría inicial reportó 8 catches silenciosos; tras releer el
archivo completo se confirmó que solo 4 lo son de verdad — los otros 4 (`handleClonePallet`
línea 292, `handleOpenLinkPalletsDialog` línea 369, `handleSearchPallets` línea 497,
`handleCreatePalletFromForecast` línea 707) ya tienen su `notify.error` correspondiente justo
después del `console.error` y no requieren cambio.

## Solución acordada

Para los 3 casos de severidad alta (líneas 120, 338, 543): añadir `notify.error(...)`
inmediatamente después de cada `console.error`, con título específico reutilizando el texto
ya presente en el propio `console.error` (consistente con el resto de mensajes de error del
archivo, que ya siguen este patrón: título corto + `description` con detalle o mensaje del
backend vía `error.userMessage`/`error.message` cuando esté disponible).

Ejemplo para la línea 120:
```js
} catch (error) {
  console.error('Error al actualizar palet:', error);
  const msg = error.userMessage || error.data?.userMessage || error.message || 'No se pudo actualizar el palet. Intente de nuevo.';
  notify.error({ title: 'Error al actualizar palet', description: msg });
}
```

Aplicar el mismo patrón (título específico + fallback de mensaje) en las líneas 338 y 543.

Para el caso de menor severidad (línea 626, carga de opciones de producto): añadir
`notify.warning` (no `notify.error`, porque la operación continúa con fallback) indicando que
el nombre/GTIN de producto puede no mostrarse correctamente.

## Referencias e inspiración

- Patrón de manejo de errores ya usado 20+ veces en el mismo archivo (p.ej. líneas 299, 504, 714)
- design-context.md § Error States: "Toasts para errores de acciones — `notify.error(getErrorMessage(error))`"
- PL-017 (project-learnings.md): no aplica aquí (no se elimina ninguna variable)

## Criterios de aceptación

- [x] `handlePalletChange` (línea 120) muestra `notify.error` con título "Error al actualizar palet" cuando falla editar o crear un palet
- [x] `handleConfirmAction` (línea 338) muestra `notify.error` con título "Error al ejecutar la acción" cuando falla eliminar/desvincular/desvincular todos
- [x] `handleLinkPallets` (línea 543) muestra `notify.error` con título "Error al vincular palets" cuando falla la vinculación
- [x] La carga de opciones de producto en `handleCreatePalletFromForecast` (línea 626) muestra `notify.warning` cuando falla, sin bloquear la creación del palet (mantiene el fallback existente)
- [x] Los otros 4 catches del archivo (líneas 292, 369, 497, 707) no se modifican — ya tienen `notify.error`
- [ ] `npm run type-check` pasa sin errores — falla por errores preexistentes en `Order/index.tsx:203`, no introducidos por este GAP

## Archivos a crear o modificar

**Modificar:**
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` — añadir `notify.error`/`notify.warning` en los 4 catches identificados

## Restricciones

- **Coordinación con GAP-057 (open):** GAP-057 también modifica este mismo archivo
  (elimina el patrón token-as-parameter). Son cambios independientes y no deberían solaparse
  en las mismas líneas, pero quien implemente el segundo de los dos debe releer el archivo
  actualizado antes de empezar para evitar conflictos de merge o revertir el trabajo del otro.
- No tocar la lógica de negocio de ninguna de las 8 funciones — solo añadir el feedback de error
- No modificar los 4 catches que ya tienen `notify.error` correcto
- No renombrar el archivo a `.ts` en este GAP (scope de GAP-061)

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` — añadido `notify.error` en `handlePalletChange`, `handleConfirmAction` y `handleLinkSelectedPallets`; añadido `notify.warning` en la carga de opciones de producto dentro de `handleCreatePalletFromForecast`.

### Decisiones tomadas durante la implementación

- Se reutilizó el patrón de mensaje del archivo (`error.userMessage || error.data?.userMessage || error.message || fallback`) ya presente en `handleClonePallet` y `handleCreatePalletFromForecast`.
- Para la carga de productos se usó `notify.warning` (no `notify.error`) porque la operación continúa con el fallback de GTIN existente.
- La función de vinculación en el código se llama `handleLinkSelectedPallets` (no `handleLinkPallets` como en el GAP); el cambio se aplicó en el catch correcto.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos (scope funcional del GAP)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

- Los 4 `catch` silenciosos quedan cubiertos con el patrón acordado (`notify.error` ×3, `notify.warning` ×1). Títulos y fallbacks correctos.
- El `catch` de vinculación está en `handleLinkSelectedPallets` (nombre real en código; el GAP lo llamaba `handleLinkPallets`).
- `npm run type-check` falla por errores **preexistentes** en `Order/index.tsx:203` (no relacionados con este GAP ni con `useOrderPallets.js`).
- El working tree del mismo archivo incluye también cambios de **GAP-057** (eliminación de token-as-parameter) mezclados en el diff. No invalidan GAP-065, pero conviene commitear cada GAP por separado o en un único commit explícito si se cierran juntos.

### Estado final de la implementación

Cerrado. Feedback de error completo en los 4 puntos identificados; listo para merge del scope de GAP-065.
