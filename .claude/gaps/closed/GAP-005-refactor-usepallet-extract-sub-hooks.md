# GAP-005 — Refactor usePallet.js — extraer sub-hooks en hooks/pallets/

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock
- **Prioridad:** Alta
- **Estado:** closed
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

> Auditado por el Agente Auditor — 2026-06-01

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

**Lo que está bien:**

1. **Estructura correcta**: `src/hooks/pallets/` contiene 4 archivos (3 sub-hooks + helpers), todos en `.ts`. El criterio de "al menos 3 sub-hooks" se cumple holgadamente.

2. **API pública intacta**: `PalletDialog/index.js` importa `{ usePallet }` y `PalletView/index.js` importa `{ usePallet, saveDiscountPreferences }` — ambos siguen funcionando sin ningún cambio. La re-exportación vía `export { saveDiscountPreferences } from './pallets/palletHelpers'` es elegante y correcta.

3. **TypeScript limpio**: `npx tsc --noEmit` produce cero salida (cero errores, cero warnings). Strict mode respetado en todos los archivos nuevos. Ningún `any` sin justificación — se usa `unknown` + casting con tipo concreto donde el legacy JS no exporta tipos.

4. **ESLint sin errores nuevos**: `npm run lint` finaliza con 0 errors / 309 warnings — todos los warnings son pre-existentes en otras partes del proyecto. Los nuevos archivos no añaden ni un warning nuevo.

5. **Patrón de orquestador correcto**: Idéntico al de GAP-004 (`useOrder.ts`). Estado en el orquestador, sub-hooks reciben state + setters como parámetros y devuelven solo funciones. Limpio y predecible.

6. **Responsabilidades bien separadas**: La elección de colocar `onDeleteScannedCode` en `usePalletBoxCreation` (en lugar de `usePalletBoxOperations`) está bien justificada en las decisiones de implementación — es conceptualmente parte del flujo de creación por escáner.

7. **`usePallet.js` eliminado**: Confirmado. Solo existe `usePallet.ts`.

8. **Casts de JS legacy documentados**: Los casts `as (args) => ReturnType` sobre `createPallet`, `updatePallet`, `getPallet` etc. son la única forma de tipar llamadas a servicios `.js` sin tipos exportados. Anotados en las decisiones.

**Observaciones menores (no bloqueantes):**

- `React.Dispatch` se usa como tipo en `usePalletBoxOperations.ts` y `usePalletBoxCreation.ts` sin `import React` explícito. Funciona correctamente con `jsx: "react-jsx"` (React en scope automático desde `@types/react`), y tsc lo confirma. No es un error, pero añadir `import type { Dispatch, SetStateAction } from 'react'` haría el código más explícito y portable.

- `console.warn` en `usePalletBoxCreation.ts` (línea 297) para códigos GS1 fallidos, y `console.error` en `usePallet.ts` para errores de carga de opciones. Son debug logs no críticos, presentes también en el `.js` original. No es un problema del refactor, pero podrían migrarse a `notify.warning` en una iteración futura.

- La función `onAddNewBox` con su `setBoxCreationData` final fuera del `if/else` (línea 308) hace que el método `gs1` ejecute el reset dos veces (una dentro del bloque `gs1` y otra en la línea 308). No es un bug visible para el usuario, pero es una pequeña inconsistencia. Documentado por si se revisa en una limpieza posterior.

**Por qué 9/10 y no 10/10:** El punto del `React.Dispatch` sin import explícito y el doble reset en `gs1` son detalles que en un proyecto strict merecen atención, aunque no son bloqueantes ni producen errores.

### Estado final de la implementación

- **`src/hooks/pallets/palletHelpers.ts`** — creado ✅
- **`src/hooks/pallets/usePalletBoxOperations.ts`** — creado ✅
- **`src/hooks/pallets/usePalletBoxCreation.ts`** — creado ✅
- **`src/hooks/pallets/usePalletSave.ts`** — creado ✅
- **`src/hooks/usePallet.ts`** — creado (orquestador) ✅
- **`src/hooks/usePallet.js`** — eliminado ✅
- Componentes consumidores sin cambios ✅
- `tsc --noEmit` sin errores ✅
- `npm run lint` sin errores nuevos ✅
