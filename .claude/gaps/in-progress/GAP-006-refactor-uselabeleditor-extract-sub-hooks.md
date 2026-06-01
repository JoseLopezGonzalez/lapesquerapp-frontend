# GAP-006 — Refactor useLabelEditor.ts — extraer sub-hooks en hooks/labels/

## Metadata

- **Tipo:** Refactor
- **Módulo:** Etiquetas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/useLabelEditor.ts` tiene ~52 KB — el hook más grande del proyecto en términos absolutos. Gestiona el estado completo del editor visual de etiquetas: canvas, elementos, propiedades de cada elemento, validación, preview, guardado, historial de cambios, etc.

A diferencia de `useOrder` y `usePallet`, este hook ya está en `.ts`. Pero su tamaño lo hace igual de problemático: es difícil encontrar una función específica, los tests son imposibles de escribir en granularidad útil, y cualquier bug nuevo requiere recorrer decenas de funciones para entender el flujo.

El módulo de etiquetas está activo. Cuando llegan nuevas features (nuevos tipos de campo, nuevas opciones de impresión, integración con datos de lonja), no hay dónde ponerlas sin engordar el hook aún más.

## Solución acordada

1. **Analizar** `useLabelEditor.ts` e identificar responsabilidades separables. Las candidatas más probables son: gestión del canvas (posicionamiento, resize, drag), gestión de elementos/campos, validación del label, persistencia (guardar/cargar), historial de cambios (undo/redo).
2. **Extraer** como sub-hooks `.ts` en `src/hooks/labels/`
3. **Reexportar** desde `useLabelEditor.ts` para mantener la API pública intacta

**Nota:** Este hook ya está en `.ts`, así que no hay migración de extensión. Solo extracción.

## Referencias e inspiración

La validación del label editor ya está parcialmente extraída en `src/hooks/labelEditorValidation.js` — migrarla a `src/hooks/labels/useLabelValidation.ts` como parte de este GAP si aplica.

## Criterios de aceptación

- [ ] Existe el directorio `src/hooks/labels/` con al menos 3 sub-hooks extraídos
- [ ] Cada sub-hook está en `.ts` con tipos explícitos importados de `src/types/labelEditor.ts`
- [ ] `useLabelEditor.ts` reexporta todo lo que exportaba antes — API pública inalterada
- [ ] Ningún componente del módulo de etiquetas (`src/components/Admin/LabelEditor/`) necesita cambios
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] Si `labelEditorValidation.js` se migra, su test `labelEditorValidation.test.js` también se actualiza con el nuevo path

## Archivos a crear o modificar

- **Leer primero:** `src/hooks/useLabelEditor.ts` y `src/hooks/labelEditorValidation.js`
- `src/hooks/labels/` — directorio nuevo con sub-hooks extraídos
- `src/hooks/useLabelEditor.ts` — convertir en orquestador que importa sub-hooks (mantener el nombre)
- Si se migra `labelEditorValidation.js` → `src/hooks/labels/useLabelValidation.ts`
- `src/__tests__/` — actualizar paths de los tests afectados si se mueven archivos

## Restricciones

- **No cambiar el comportamiento del editor** — este GAP es pura reorganización de código
- No tocar ningún componente de `src/components/Admin/LabelEditor/`
- No añadir nuevas funcionalidades al editor en este GAP — solo extraer lo existente
- Si hay estado compartido entre las responsabilidades que dificulta la extracción limpia, documentarlo como observación y extraer solo las partes que sean claramente independientes

---

## Implementación

### Archivos creados

- `src/hooks/labels/labelValidation.ts` — migración TypeScript de `labelEditorValidation.js`: `validateLabelName`, `hasDuplicateFieldKeys`, `hasElementValidationError`, `getElementValidationErrorReason`, `hasAnyElementValidationErrors`, `KEY_FIELD_TYPES`
- `src/hooks/labels/labelEditorHelpers.ts` — utilidades de normalización compartidas: `normalizeElement`, `normalizeElements`
- `src/hooks/labels/useLabelCanvasInteraction.ts` — extrae drag/resize del canvas: estado interno `isDragging/isResizing/dragOffset/resizeStart`, refs, `handleMouseDown`, `handleResizeMouseDown`, `handleMouseMove`, `handleMouseUp`, `canvasRef`, `useEffect` de event listeners
- `src/hooks/labels/useLabelPersistence.ts` — extrae persistencia: `saveMutation` (createLabel/updateLabel), `deleteMutation`, `handleSave`, `handleOnClickSave`, `handleDeleteLabel`, `handleSelectLabel`, `handleCreateNewLabel`, `exportJSON`, `importJSON`, `validateLabelJSON`, `handleImportJSON`, `fileInputRef`, `isSaving`
- `src/hooks/labels/useLabelPrint.ts` — extrae lógica de impresión: `manualValues` (estado local), `showManualDialog`, `manualForm`, `usePrintElement`, `handlePrint`, `handleConfirmManual`
- `src/__tests__/hooks/labels/labelValidation.test.ts` — test migrado desde `labelEditorValidation.test.js`, import actualizado a `@/hooks/labels/labelValidation`

### Archivos modificados

- `src/hooks/useLabelEditor.ts` — reescrito como orquestador: 1376 → 816 líneas. Importa los 3 sub-hooks, elimina estados/funciones extraídas, mantiene API pública idéntica. Import de validación cambiado de `@/hooks/labelEditorValidation` a `@/hooks/labels/labelValidation`. Import de `normalizeElement` desde `@/hooks/labels/labelEditorHelpers`.

### Archivos eliminados

- `src/hooks/labelEditorValidation.js` — migrado a `src/hooks/labels/labelValidation.ts`
- `src/hooks/labelEditorValidation.test.js` — migrado a `src/__tests__/hooks/labels/labelValidation.test.ts`

### Decisiones tomadas durante la implementación

1. **`clearEditor` en el orquestador:** `deleteMutation.onSuccess` llama a `clearEditor`. Como `clearEditor` modifica estado del orquestador, se define ahí y se pasa como parámetro a `useLabelPersistence`.

2. **`updateElement` antes de `useLabelCanvasInteraction`:** El hook de canvas necesita `updateElement` para las operaciones de drag/resize. `updateElement` se define en el orquestador antes de la llamada al sub-hook.

3. **`normalizeElement` vs `normalizeElements`:** `normalizeElement` se importa en el orquestador (para `addElement`, `updateElement`, `selectedElementData`). `normalizeElements` solo la necesita `useLabelPersistence` — la importa directamente desde `labelEditorHelpers`.

4. **`useLabelPrint` recibe `elements` como param:** `handlePrint` necesita filtrar `manualField` del array de elementos, que vive en el orquestador. Se pasa como parámetro al sub-hook.

5. **Nombre del archivo de validación:** El GAP sugería `useLabelValidation.ts` pero se usó `labelValidation.ts` (sin prefijo `use`) porque el módulo no es un hook React, son funciones puras. Consistente con el patrón `labelEditorHelpers.ts`.

### Desviaciones del plan (si las hay)

- `labelEditorValidation.js` se migró a `labelValidation.ts` (sin prefijo `use`) en lugar de `useLabelValidation.ts`, porque contiene funciones puras, no hooks.
- `handleCanvasRotationChange` (función interna de `useLabelEditor.ts`) no se añadió al retorno público — no estaba en la API pública original y se mantiene como función interna de `rotateCanvasTo`.

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
