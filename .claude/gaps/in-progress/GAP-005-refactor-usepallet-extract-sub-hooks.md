# GAP-005 — Refactor usePallet.js — extraer sub-hooks en hooks/pallets/

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock
- **Prioridad:** Alta
- **Estado:** in-progress
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/usePallet.js` tiene ~48 KB — el hook más grande del proyecto. Concentra toda la lógica del módulo de stock/almacén: creación de palets, edición, movimiento entre almacenes, gestión de cajas, impresión de etiquetas, recepciones, etc.

Cualquier feature nueva del módulo de almacén (operativa warehouse) pasa por este hook. Con 48 KB, incluso leer el archivo completo para entender qué hace cada función es costoso. El riesgo de introducir regresiones es alto.

El problema es el mismo que en `useOrder.js` pero más grave por tamaño: las reglas del proyecto ya prohíben añadirle más lógica, pero tampoco hay sub-hooks en `hooks/pallets/` donde poner las nuevas features.

## Solución acordada

1. **Analizar** `usePallet.js` e identificar responsabilidades separables (creación de palet, edición, movimiento, gestión de cajas, impresión/etiquetado, filtros, etc.)
2. **Extraer** cada responsabilidad como sub-hook `.ts` en `src/hooks/pallets/`
3. **Reexportar** desde `usePallet.ts` (ya migrado desde `.js`) para mantener compatibilidad
4. Migrar `usePallet.js` → `usePallet.ts` en este mismo GAP

**Prioridad de extracción:** empezar por las responsabilidades que tienen más probabilidad de recibir nuevas features pronto (preguntar a Jose antes de implementar si no está claro).

## Referencias e inspiración

El módulo de producción ya sigue este patrón: `src/hooks/production/` tiene sub-hooks extraídos del hook principal de producción.

## Criterios de aceptación

- [ ] Existe el directorio `src/hooks/pallets/` con al menos 3 sub-hooks extraídos
- [ ] Cada sub-hook extraído está en `.ts` con tipos explícitos
- [ ] `usePallet.ts` (migrado desde `.js`) reexporta todo lo que exportaba antes
- [ ] Ningún componente que importaba de `usePallet` necesita cambios
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] Los sub-hooks siguen la nomenclatura `use[Entity][Action]` o `usePallet[Responsabilidad]`
- [ ] El archivo `usePallet.js` original se elimina (reemplazado por `usePallet.ts`)

## Archivos a crear o modificar

- **Leer primero:** `src/hooks/usePallet.js` — mapear responsabilidades antes de cualquier cambio
- `src/hooks/pallets/` — directorio nuevo con sub-hooks
- `src/hooks/usePallet.js` → `src/hooks/usePallet.ts` — orquestador que importa sub-hooks
- Archivos que importen `usePallet.js` con extensión explícita → actualizar

## Restricciones

- **No cambiar la API pública** de `usePallet` — los componentes de warehouse no deben tocarse
- No tocar `entitiesConfig.js`, `palletService`, ni ningún componente de warehouse en este GAP
- Si se detecta lógica que debería estar en el service y no en el hook, documentarlo como observación pero no moverlo aquí
- Si el hook tiene más de 5 responsabilidades claramente distintas, priorizar las 3-5 más grandes en este GAP y documentar el resto como trabajo pendiente en las observaciones

---

## Implementación

### Archivos creados

- `src/hooks/pallets/palletHelpers.ts` — tipos TypeScript (`PalletBox`, `PalletState`, `BoxCreationData`, `ProductOption`) + constantes (`STORAGE_KEYS`, `emptyPallet`) + funciones puras compartidas (`recalculatePalletStats`, `palletDataEqual`, `boxContentEqual`, `normNum`, `roundToTwoDecimals`, `generateUniqueIntId`, `getInitialBoxCreationData`, `resetBoxCreationDataPreservingDiscounts`, `saveDiscountPreferences`)
- `src/hooks/pallets/usePalletBoxOperations.ts` — operaciones CRUD sobre cajas individuales y en bloque: `addBox`, `duplicateBox`, `deleteBox`, `editBox` (4 métodos), `bulkEditBoxes` (5 métodos), `editObservations`, `editOrderId`, `setBoxPrinted`, `deleteAllBoxes`. Incluye helpers GS1-128 locales (`getGs1128`, `getGs1128WithPounds`) y lookup de producto (`getProductById`, `getBoxGtinById`).
- `src/hooks/pallets/usePalletBoxCreation.ts` — formulario de creación de cajas: `boxCreationDataChange`, `onAddNewBox` (5 métodos: manual/average/bulk/lector/gs1), `onDeleteScannedCode`, `onResetBoxCreationData`. Importa `parseGs1128Line` y `normalizeScannedCodeToGs1128` para procesado de códigos de barras.
- `src/hooks/pallets/usePalletSave.ts` — persistencia en backend: `onSavingChanges` (create vs update, con lógica de permisos de coste via `canManagePalletCostFields`).
- `src/hooks/usePallet.ts` — orquestador que declara todo el estado, efectos de carga de datos, efectos de auto-submit de escáner, computed values (`temporalProductsSummary`, `hasPalletChanges`, etc.) y ensambla la API pública. Re-exporta `saveDiscountPreferences` para compatibilidad con el componente `PalletView`.

### Archivos eliminados

- `src/hooks/usePallet.js` — reemplazado íntegramente por `src/hooks/usePallet.ts`

### Decisiones tomadas durante la implementación

1. **Estado en el orquestador**: todo el estado (`pallet`, `temporalPallet`, `boxCreationData`, etc.) vive en `usePallet.ts`. Los sub-hooks reciben estado + setters como parámetros y devuelven solo funciones. Patrón idéntico al de `useOrder.ts` (GAP-004).

2. **Helpers compartidos en `palletHelpers.ts`**: las funciones puras y los tipos se extraen a un archivo auxiliar (no un hook) accesible por todos los sub-hooks, evitando duplicación.

3. **Efectos de auto-submit del escáner en el orquestador**: los dos `useEffect` que auto-disparan `onAddNewBox({ method: 'lector' })` y `onDeleteScannedCode()` cuando el código escaneado alcanza longitud ≥42 se colocan en el orquestador, donde están disponibles tanto el estado `boxCreationData` como las funciones devueltas por los sub-hooks. Los deps arrays son intencionalmente incompletos (solo la longitud del código importa para el trigger) — suprimido con `eslint-disable-next-line`.

4. **Re-exportación de `saveDiscountPreferences`**: `PalletView/index.js` importa `{ usePallet, saveDiscountPreferences }` de `@/hooks/usePallet`. Se mantiene via `export { saveDiscountPreferences } from './pallets/palletHelpers'` en `usePallet.ts`.

5. **Casts de JS legacy**: `createPallet`, `updatePallet`, `getPallet`, `getActiveOrdersOptions`, `getProductOptions`, `canManagePalletCostFields` son funciones `.js` sin tipos exportados. Se usa `as (args) => ReturnType` donde TypeScript no puede inferir.

### Desviaciones del plan (si las hay)

- La función `onDeleteScannedCode` también modifica `temporalPallet` (filtra la caja del palet), por lo que se ubica en `usePalletBoxCreation` (no en `usePalletBoxOperations`) ya que está conceptualmente ligada al flujo de creación por escáner.
- `editObservations`, `editOrderId`, `setBoxPrinted` y `deleteAllBoxes` se incluyen en `usePalletBoxOperations` por ser operaciones sobre el estado del palet, aunque no son estrictamente "operaciones de caja".

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
