# STEP 2 — Cambios propuestos: Editor de etiquetas

**Fecha**: 2026-02-15  
**Rating antes**: 3/10  
**Objetivo**: 9/10 por sub-bloques reversibles.

---

## Sub-bloque 1 — Estructura y tamaño (P0)

**Objetivo**: Reducir LabelEditor e useLabelEditor por debajo de umbrales P0/P1.

### 1.1 Componente LabelEditor

- **Extraer** de `index.js`:
  - `LabelEditorToolbar.jsx` (o .tsx): barra superior (nombre etiqueta, botones Añadir elemento, Guardar, Imprimir, Importar/Exportar, Zoom, Rotar canvas, atajos, etc.). Recibe props/handlers del padre.
  - `LabelEditorMainArea.jsx`: zona central (canvas + lista de elementos + preview). Recibe elements, selectedElement, zoom, canvasRef, handlers (mouse, select, add, delete, etc.).
  - `LabelEditorPropertyPanel.jsx`: panel derecho (propiedades del elemento seleccionado: activeElementState, updateActiveElement, paneles por tipo QR/Barcode/RichParagraph, etc.).
- **Mantener** en `index.js`: composición, estado local activeElementState y showKeyboardShortcutsDialog, llamada a useLabelEditor, layout general. Meta: index.js < 300 líneas en primera pasada; segundo paso si hace falta para < 200.

### 1.2 Hook useLabelEditor

- **Extraer** módulos/helpers (sin cambiar API pública del hook):
  - `labelEditorValidation.js`: validateLabelName, hasDuplicateFieldKeys, hasAnyElementValidationErrors, getElementValidationErrorReason.
  - `labelEditorElementDefaults.js`: default element factory por tipo (objeto newElement por type), normalizeElement(s), constants (KEY_FIELD_TYPES, etc.).
- **Extraer** hook secundario (uso interno de useLabelEditor):
  - `useLabelEditorCanvas.js`: estado y lógica de canvas (canvasWidth, canvasHeight, canvasRotation, setCanvasWidth, setCanvasHeight, rotateCanvas, zoom, setZoom, canvasRef). Opcional: drag/resize si se puede desacoplar sin romper.
- **Mantener** en useLabelEditor: estado de elementos, selectedLabel, labelId, labelName, persistencia (handleSave, handleSelectLabel, handleCreateNewLabel, clearEditor, handleDeleteLabel), addElement, updateElement, deleteElement, duplicateElement, getFieldValue, export/import, handlePrint, validaciones que llamen a labelEditorValidation. Meta: useLabelEditor < 500 líneas; el resto en helpers + useLabelEditorCanvas.

### 1.3 Verificación sub-bloque 1

- Build correcto; sin cambios de comportamiento observable.
- LabelEditor/index.js y useLabelEditor.js por debajo de 250 L (ideal) o al menos < 400 L.
- Contratos de LabelRender y useLabel intactos.

---

## Sub-bloque 2 — TypeScript y tipos (P1)

- Añadir `src/types/labelEditor.ts` (o .d.ts): interfaces para Label, LabelFormat, Canvas, Element (por tipo), respuesta API.
- Migrar `labelService.js` → `labelService.ts` con tipos en request/response.
- Nuevos componentes extraídos en sub-bloque 1 pasan a .tsx con props tipadas (o se renombran en este sub-bloque).
- useLabelEditor.js puede seguir en .js con JSDoc usando tipos de labelEditor.ts para no romper imports masivamente; o migrar a useLabelEditor.ts en este sub-bloque.

---

## Sub-bloque 3 — React Query (P1)

- useQuery para listado de etiquetas (getLabels) donde se use (LabelSelectorSheet).
- useMutation para createLabel, updateLabel, deleteLabel, duplicateLabel; invalidación de listado tras mutación.
- useLabelEditor usa mutations en lugar de llamadas directas a labelService; token desde session.

---

## Sub-bloque 4 — Tests (P0)

- Tests unitarios para labelService (getLabels, getLabel, createLabel, updateLabel, deleteLabel) con mocks de fetchWithTenant.
- Tests para validación (labelEditorValidation): validateLabelName, hasDuplicateFieldKeys, hasAnyElementValidationErrors.
- Tests de integración o unit para useLabelEditor: estado inicial, addElement, updateElement, deleteElement, handleCreateNewLabel, handleSelectLabel (con mock de label).

---

## Sub-bloque 5 — Cierre a 9/10 (P2)

- useFieldEditor para paneles QR/Barcode/RichParagraph (reducir duplicación).
- Revisión sanitización RichParagraph (dangerouslySetInnerHTML).
- Revisión a11y (teclado, ARIA).
- Documentación breve en 01_analysis o 05_outputs.

---

## Orden de ejecución

1. **Sub-bloque 1** (este turno): Extracción de componentes y de lógica (helpers + useLabelEditorCanvas) para bajar líneas. Sin cambios de API pública.
2. Sub-bloque 2: Tipos y migración TypeScript.
3. Sub-bloque 3: React Query.
4. Sub-bloque 4: Tests.
5. Sub-bloque 5: Refino hasta 9/10.

**Riesgo sub-bloque 1**: Bajo. Solo extracción y reordenación; comportamiento idéntico. Rollback: revert commits.
