# Plan implementación – Mejora Nº 3

## Objetivo

1. **Restricciones al guardar**: En el Label Editor, no permitir guardar el formato si hay campos críticos sin rellenar. Validar: (a) nombre del formato (ya existe), (b) sin nombres de campo duplicados (ya existe), (c) todo elemento de tipo manualField/selectField/checkboxField/dateField debe tener **nombre de campo (key) no vacío**, (d) todo selectField debe tener **al menos una opción no vacía** en `options`. Mensaje **único** por tipo de error (genérico). Permitir guardar con **canvas vacío** (0 elementos).
2. **Indicador en cards**: En el listado de elementos del panel izquierdo, mostrar en cada card algo que indique claramente que ese elemento tiene un error de validación (ej. borde rojo + icono o badge “Sin nombre” / “Sin opciones”), para que el usuario sepa qué corregir.

---

## Archivos a modificar

| Archivo | Cambios |
|---------|--------|
| `src/hooks/useLabelEditor.js` | (1) Añadir función interna que compruebe si un elemento tiene error: key vacío (para KEY_FIELD_TYPES) o selectField sin opciones válidas. (2) Añadir validación en `handleSave`: antes de guardar, comprobar que no haya elementos con key vacío; que no haya selectField sin al menos una opción no vacía. Si hay error, toast con mensaje único (ej. “Completa el nombre de todos los campos y las opciones de los campos tipo select antes de guardar”) y return. (3) Exponer en el return del hook una función o valor que permita a la UI saber si un elemento tiene error: p. ej. `hasElementValidationError(element)` o `getElementsWithValidationErrors()` que devuelva un Set de ids (o similar) para que el panel izquierdo pueda marcar los cards. |
| `src/components/Admin/LabelEditor/index.js` | En el listado de elementos (donde se hace `elements.map` y se renderiza el div por cada elemento), para cada elemento: si el hook indica que ese elemento tiene error de validación, añadir clase visual (ej. `border-destructive` o `ring-2 ring-destructive`) y un indicador claro (icono AlertTriangle o badge pequeño “Sin nombre” / “Sin opciones” según el tipo de error). |

---

## Estrategia

### 1. Validación en handleSave (useLabelEditor)

- **Orden**: Mantener primero `validateLabelName(labelName)`, luego `hasDuplicateFieldKeys(elements)`. A continuación:
  - **Campos con key vacío**: Recorrer `elements`; si hay algún elemento con `type` en KEY_FIELD_TYPES y `String(el.key || '').trim() === ''`, no permitir guardar. Toast único: p. ej. “Completa el nombre de todos los campos (manual, select, checkbox, fecha) antes de guardar.”
  - **SelectField sin opciones**: Si hay algún elemento con `type === 'selectField'` y `(!Array.isArray(el.options) || !el.options.some(o => String(o || '').trim() !== ''))`, no permitir guardar. Toast único: p. ej. “Añade al menos una opción a todos los campos tipo select antes de guardar.”
  - Se puede unificar en un solo mensaje si hay varios tipos de error: “Completa el nombre de todos los campos y las opciones de los campos tipo select antes de guardar.” y hacer una sola pasada: primero comprobar keys vacíos, luego select sin opciones; si hay alguno, mostrar ese mensaje único y return.
- **Canvas vacío**: No añadir validación de “al menos un elemento”; permitir guardar con `elements.length === 0`.

### 2. Función “este elemento tiene error” en el hook

- Definir `hasElementValidationError(el)` (interna o exportada conceptualmente vía return):
  - Si `el.type` está en KEY_FIELD_TYPES y `String(el.key || '').trim() === ''` → true (error: sin nombre).
  - Si `el.type === 'selectField'` y no tiene al menos una opción no vacía → true (error: sin opciones).
  - Resto → false.
- Exponer en el return del hook algo que la UI pueda usar, por ejemplo:
  - `hasElementValidationError: (element) => boolean`, para que el LabelEditor pueda llamar `hasElementValidationError(element)` al renderizar cada card.
- Así el panel izquierdo no necesita recibir un Set de ids; solo invoca la función por elemento.

### 3. Indicador en los cards (LabelEditor/index.js)

- Donde se renderiza cada card (el `div` con `key={element.id}` que tiene `onClick={() => handleOnClickElementCard(element.id)}`):
  - Llamar a `hasElementValidationError(element)` (o el nombre que se exporte).
  - Si es true: añadir al `className` del div algo visible, por ejemplo `border-destructive` o `ring-2 ring-destructive/50`, y dentro del card un pequeño indicador: icono `AlertTriangle` (lucide-react) y/o un texto breve “Sin nombre” o “Sin opciones” según el tipo de error (opcional: si se quiere un solo mensaje genérico en el card, poner “Revisar campo” o “Completa este campo”).
- Mantener el resto del diseño del card (iconos por tipo, preview, etc.).

### 4. Mensajes de toast (único por validación)

- Un solo mensaje cuando falle por “campos sin nombre”: “Completa el nombre de todos los campos antes de guardar.”
- Un solo mensaje cuando falle por “select sin opciones”: “Añade al menos una opción a todos los campos tipo select antes de guardar.”
- O un único mensaje combinado si se validan ambas cosas y se muestra un solo toast: “Completa el nombre de todos los campos y las opciones de los campos tipo select antes de guardar.”

---

## Qué NO tocar

- LabelSelectorSheet, labelService, flujo de carga de formatos.
- Permitir guardar con 0 elementos (no validar “al menos un elemento”).
- No cambiar la estructura de datos de elements ni de los tipos de elemento.

---

## Protección Desktop/Mobile

- Solo lógica de validación y clase/indicador en el card; sin cambios de breakpoints. El panel izquierdo ya existe en el layout; el indicador debe verse en ambos.

---

## Estrategia anti-regresiones

- Validaciones solo añadidas en handleSave; no modificar create/update API.
- La función de “tiene error” es pura (elemento → boolean); no tiene efectos secundarios.

---

## Checklist de validación

- [ ] Con un manualField sin nombre (key vacío), el botón Guardar muestra toast y no guarda; el card de ese elemento muestra indicador de error (borde/icono o texto).
- [ ] Con un selectField sin opciones (o todas vacías), Guardar muestra toast y no guarda; el card muestra indicador.
- [ ] Con formato sin elementos (canvas vacío), se puede guardar.
- [ ] Corregir nombre y opciones: los indicadores desaparecen y se puede guardar.
- [ ] Mensaje de toast es único (no lista de elementos).
