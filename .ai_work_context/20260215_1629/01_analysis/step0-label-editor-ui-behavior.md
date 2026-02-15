# STEP 0 — Comportamiento UI actual: Editor de etiquetas

**Bloque**: 13. Editor de etiquetas  
**Fecha**: 2026-02-15

---

## 1. Estados de la UI

| Estado | Descripción | Transición |
|--------|-------------|------------|
| **Sin etiqueta cargada** | Canvas vacío o recién abierto; selector de etiqueta puede mostrarse (Sheet). | Usuario abre selector → elige "Nueva" o una etiqueta existente. |
| **Etiqueta nueva** | `labelId === null`, nombre vacío, canvas por defecto (110×90 mm), elementos vacíos. | handleCreateNewLabel() o selección "Nueva" en selector. |
| **Etiqueta cargada** | `labelId` y nombre definidos; elementos y dimensiones de canvas desde API. | handleSelectLabel(label) desde LabelSelectorSheet. |
| **Elemento seleccionado** | Un elemento del canvas está seleccionado; panel derecho muestra propiedades (activeElementState). | Click en elemento, o en lista de elementos; Delete/Backspace deselecciona o elimina. |
| **Guardando** | `isSaving === true`; botón Guardar deshabilitado. | handleOnClickSave → createLabel/updateLabel. |
| **Diálogo manual** | Impresión con campos manuales: se muestra formulario para rellenar valores. | handlePrint cuando hay manualField → setShowManualDialog(true). |
| **Diálogo atajos teclado** | showKeyboardShortcutsDialog. | Toggle desde toolbar. |
| **Diálogo ejemplos de campos** | showFieldExamplesDialog. | Para editar fieldExampleValues. |

---

## 2. Interacciones del usuario

- **Abrir selector de etiqueta**: Botón/Sheet → elegir etiqueta existente o "Nueva".
- **Seleccionar etiqueta existente**: handleSelectLabel(label) → carga format (canvas + elements), labelName, labelId.
- **Crear nueva etiqueta**: handleCreateNewLabel() → canvas 110×90, elements=[], labelId=null.
- **Añadir elemento**: Toolbar "Añadir" por tipo (texto, campo, QR, barcode, imagen, rich paragraph, etc.) → addElement(type).
- **Seleccionar elemento**: Click en canvas o en lista de elementos → handleSelectElementCard / handleMouseDown.
- **Mover elemento**: Arrastrar en canvas (handleMouseDown → mousemove → updateElement x,y).
- **Redimensionar**: Asas en elemento seleccionado → handleResizeMouseDown → mousemove.
- **Rotar elemento**: Panel derecho o teclado.
- **Eliminar elemento**: Tecla Delete/Backspace o botón en panel.
- **Duplicar elemento**: Menú contextual o botón duplicateElement.
- **Editar propiedades**: Panel derecho (activeElementState) → updateActiveElement(updates) → updateElement(id, updates).
- **Guardar**: handleOnClickSave → validación (nombre, claves duplicadas, validación por elemento) → createLabel o updateLabel.
- **Imprimir**: handlePrint → si hay manualField abre diálogo manual; si no, onPrint (usePrintElement).
- **Importar/Exportar JSON**: fileInputRef para import; exportJSON para descarga.
- **Rotar canvas**: rotateCanvas / rotateCanvasTo(angle).
- **Zoom**: setZoom (in/out).
- **Eliminar etiqueta**: handleDeleteLabel → deleteLabel API → clearEditor.

---

## 3. Flujo de datos

- **API → UI**: getLabels (selector), getLabel (carga una etiqueta). Servicios: createLabel, updateLabel, deleteLabel, duplicateLabel; token desde useSession.
- **UI → API**: createLabel(labelName, labelFormat, token), updateLabel(labelId, labelName, labelFormat, token). labelFormat = { elements, canvas: { width, height, rotation } }.
- **Estado en hook**: useLabelEditor mantiene selectedLabel, elements, labelId, labelName, canvasWidth/Height/Rotation, selectedElement, zoom, isDragging, isResizing, manualForm, fieldExampleValues, etc.
- **Panel derecho**: activeElementState en LabelEditor (useState) se sincroniza desde selectedElementData cuando cambia selectedElement (useEffect [selectedElement]); las ediciones llaman updateElement vía updateActiveElement.

---

## 4. Reglas de validación (actuales)

- **Antes de guardar**: validateLabelName(labelName); hasDuplicateFieldKeys(elements); hasAnyElementValidationErrors(elements). Si falla → toast.error y no se envía.
- **Campos con clave**: manualField, selectField, checkboxField, dateField deben tener key único; no se permiten claves duplicadas.
- **Select**: opciones requeridas antes de guardar (hasAnyElementValidationErrors).
- **Import JSON**: validateLabelJSON (objeto, elements array, canvas.width/height numéricos).

---

## 5. Permisos y errores

- **Permisos**: Página bajo /admin; acceso controlado por layout/middleware. No hay roles específicos documentados para "solo ver" vs "editar" en este bloque.
- **Errores API**: toast.error con userMessage o message; isSaving = false en finally.
- **Errores de validación**: toast en cliente (nombre vacío, claves duplicadas, campos incompletos).

---

## 6. Comportamiento actual que se preserva

- Mensaje de guardado correcto: "Etiqueta actualizada/guardada correctamente" según labelId (ya usa labelId en código actual).
- handleSelectLabel guarda el objeto label completo (setSelectedLabel(label)) en código actual.
- Inicialización: si no hay useEffect que llame handleCreateNewLabel(), el estado inicial viene de useState; al abrir el selector y elegir "Nueva" se llama handleCreateNewLabel.

**Checkpoint**: El comportamiento actual de guardado y selección de etiqueta es coherente con la intención (uso de labelId y objeto completo). No se ha detectado inconsistencia de negocio que requiera confirmación de usuario; se procede con mejoras estructurales.
