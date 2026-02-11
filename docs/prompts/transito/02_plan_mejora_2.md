# Plan implementación – Mejora Nº 2

## Objetivo

1. **Replicar el cambio de nombre** de un campo en el editor de etiquetas a todos los elementos que lo referencian (QR, párrafo rico, código de barras): al editar "Nombre del campo" en un manualField/selectField/checkboxField/dateField, reemplazar `{{nombreAntiguo}}` por `{{nombreNuevo}}` en `qrContent`, `html` y `barcodeContent` del resto de elementos.
2. **Al duplicar** un elemento que tiene `key` (mismo tipos), asignar un nombre único al duplicado (ej. "Lote copia" o "Lote 2") para evitar dos campos con el mismo nombre y que hasDuplicateKey no bloquee guardar.

---

## Archivos a modificar

| Archivo | Cambios |
|---------|--------|
| `src/hooks/useLabelEditor.js` | (1) En `updateElement`: si `updates.key` existe y el elemento es de tipo key (manualField, selectField, checkboxField, dateField), leer `oldKey` del elemento actual; si `oldKey !== newKey` y ambos no vacíos, en el mismo `setElements` actualizar ese elemento y, en todos los demás elementos, reemplazar en `qrContent`, `html` y `barcodeContent` el token `{{oldKey}}` por `{{newKey}}`. (2) En `duplicateElement`: si el elemento duplicado es de tipo key, calcular un `key` único (usando misma normalización que el panel) y asignarlo al copy. |

No se modifican componentes de UI (LabelEditor/index, QRConfigPanel, etc.) salvo que se quiera un mensaje opcional tipo "Se actualizarán las referencias en QR, párrafos y códigos de barras".

---

## Estrategia

### 1. Reemplazo de referencias al cambiar el nombre

- **Dónde**: Dentro de `updateElement(id, updates)` en `useLabelEditor.js`.
- **Condición**: El elemento a actualizar (`prev.find(el => el.id === id)`) es uno de `KEY_FIELD_TYPES` y `updates.key` está definido.
- **Valores**: `oldKey` = `String(el.key || '').trim()` antes del merge. `newKey` = valor ya normalizado que viene en `updates.key` (el panel ya llama a `normalizeFieldKey` antes de `updateActiveElement`, por lo que en `updates.key` llega el valor normalizado).
- **Si `oldKey !== newKey` y ambos no vacíos**:
  - En el mismo `setElements(prev => { ... })`:
    - Construir el array actualizado: para el elemento con `id`, aplicar merge y normalizar (como ahora).
    - Para **todos** los elementos del array (incluido el actual si tiene contenido, por consistencia), para cada uno:
      - Si tiene `qrContent`, reemplazar en string `{{oldKey}}` → `{{newKey}}` (todas las ocurrencias). Usar replace con el token exacto para no tocar subcadenas (ej. oldKey "Lote" no debe cambiar "LoteExtra"). Forma segura: `content.replace(new RegExp(`\\{\\{${escapeRegex(oldKey)}\\}\\}`, 'g'), `{{${newKey}}}`).
      - Si tiene `html`, mismo reemplazo.
      - Si tiene `barcodeContent`, mismo reemplazo.
  - Crear una función helper interna `replacePlaceholderInContent(content, oldKey, newKey)` que devuelva el string con el reemplazo (o el mismo si content es null/undefined), escapando `oldKey` para regex.
- **Escapado**: Para que nombres con caracteres especiales (ej. paréntesis) no rompan el regex, escapar con una función tipo `oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

### 2. Nombre único al duplicar

- **Dónde**: `duplicateElement(id)` en `useLabelEditor.js`.
- **Condición**: El elemento a duplicar tiene `type` en `KEY_FIELD_TYPES` y tiene `key` no vacío.
- **Lógica**:
  - Recoger el conjunto de `key` actuales de todos los elementos de tipo key (igual que en `hasDuplicateFieldKeys`): `const existingKeys = new Set(prev.filter(e => KEY_FIELD_TYPES.includes(e.type)).map(e => String(e.key || '').trim()).filter(Boolean))`.
  - Base: `baseKey = String(el.key || '').trim()`.
  - Normalización: aplicar la misma regla que en el panel (solo [a-zA-Z0-9 ], primera letra mayúscula). Añadir en el hook una función `normalizeKeyForStorage(raw)` con la misma lógica que `normalizeFieldKey` del LabelEditor (o extraer a un util compartido si se prefiere).
  - Probar candidatos: `baseKey + ' copia'`, luego `baseKey + ' 2'`, `baseKey + ' 3'`, … hasta encontrar uno que no esté en `existingKeys` (y normalizar cada candidato antes de comprobar). Asignar al copy: `key: normalizeKeyForStorage(candidato)`.
  - Si el elemento duplicado no es de tipo key, no tocar `key` (dejar el que tenga el elemento).

### 3. Qué NO tocar

- Import JSON: se carga el formato completo; no hay que replicar nombres ahí.
- QRConfigPanel, BarcodeConfigPanel, RichParagraphConfigPanel: siguen mostrando/guardando con los keys actuales; el reemplazo en `updateElement` ya deja el contenido consistente.
- LabelEditor/index.js: `normalizeFieldKey` se sigue usando en el input; el valor que llega a `updateElement` es ya el normalizado.

---

## Qué NO tocar

- Flujo de importación JSON.
- Componentes de configuración QR/Barcode/RichParagraph (solo reciben value/onChange).
- `LabelElement` (solo consume los valores ya guardados en elements).

---

## Protección Desktop/Mobile

- Cambios solo en lógica del hook; sin cambios de layout ni breakpoints.

---

## Estrategia anti-regresiones

- Reemplazo solo del token completo `{{oldKey}}`, nunca subcadenas.
- Una sola actualización atómica en `setElements` para el cambio de nombre + reemplazos.
- Duplicar: el nuevo key es único por construcción; no se modifica el elemento original.

---

## Checklist de validación

- [ ] Crear formato con un manualField "Lote", un QR con contenido "{{Lote}}", un párrafo rico con "{{Lote}}". Cambiar nombre del campo a "NumeroLote". Guardar. Comprobar que QR y párrafo muestran el valor de "NumeroLote" en vista previa.
- [ ] Duplicar un manualField "Lote": el duplicado debe tener key distinto (ej. "Lote copia" o "Lote 2") y no debe aparecer "Ya hay otro campo con el mismo nombre" al guardar.
- [ ] Cambiar nombre a uno que contenga caracteres que se normalizan (ej. "Lote (1)" → "Lote 1"): las referencias se actualizan con el valor normalizado.
- [ ] Duplicar un elemento que no es de tipo key (ej. texto o QR): comportamiento igual que antes; no se asigna key nuevo.
