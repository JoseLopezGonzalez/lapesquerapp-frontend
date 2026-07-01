# GAP-040 — AlertDialog para eliminar etiqueta en LabelEditor

## Metadata

- **Tipo:** Bug / UX
- **Módulo:** Etiquetas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

El botón "Eliminar etiqueta" en `LabelEditorToolbar.jsx` (líneas 152–159) llama directamente a `handleDeleteLabel()` sin ningún paso de confirmación. Al hacer clic, la etiqueta se elimina inmediatamente y la acción es irreversible.

Según el design system y las reglas del proyecto, toda acción destructiva e irreversible debe ir precedida por un `AlertDialog` de confirmación. Este patrón existe ya en toda la app (eliminar pedido, eliminar palet, cancelar agenda, etc.).

```jsx
// Estado actual — sin confirmación:
<Button onClick={handleDeleteLabel} variant="destructive">
  Eliminar etiqueta
</Button>
```

---

## Solución acordada

Añadir un `AlertDialog` de confirmación antes de la eliminación:

1. Añadir estado `deleteDialogOpen: boolean` en el componente (o en el hook que gestiona el toolbar).
2. El botón "Eliminar etiqueta" abre el dialog en lugar de llamar directamente a `handleDeleteLabel`.
3. El `AlertDialog` muestra: título "Eliminar etiqueta", descripción explicando que la acción es irreversible, botón de cancelar, botón de confirmar (variante destructiva).
4. Solo al confirmar se llama a `handleDeleteLabel()`.

## UI Brief

- **Vista de referencia:** cualquier `AlertDialog` existente en el proyecto — el patrón está bien establecido (ej. cancelar acción en `AgendaPageClient.jsx:1220–1251`)
- **Tipo de layout:** `AlertDialog` (modal de confirmación sobre la vista actual)
- **Componentes clave:** `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` — todos de `@/components/ui/alert-dialog`
- **Estados requeridos:** idle (botón visible) / confirming (dialog abierto) / deleting (botón de confirmación disabled mientras `isSaving`)
- **Mobile:** no aplica — LabelEditor es desktop

### Texto del AlertDialog

- **Título:** `Eliminar etiqueta`
- **Descripción:** `Esta acción es irreversible. La etiqueta "[nombre]" se eliminará permanentemente.`
- **Botón cancelar:** `Cancelar`
- **Botón confirmar:** `Eliminar` (variante destructiva)

---

## Criterios de aceptación

- [x] Al hacer clic en "Eliminar etiqueta", se abre un `AlertDialog` (no se ejecuta la eliminación directamente)
- [x] El `AlertDialog` muestra título, descripción con el nombre de la etiqueta y dos botones
- [x] "Cancelar" cierra el dialog sin eliminar nada
- [x] "Eliminar" llama a `handleDeleteLabel()` y cierra el dialog
- [x] El botón de confirmación queda `disabled` mientras la mutación de eliminación está en progreso (`isSaving`)
- [x] No se puede abrir el dialog si no hay ninguna etiqueta seleccionada (el botón ya estaba oculto en ese caso — verificar que sigue así)
- [x] TypeScript compila sin errores en los archivos modificados

## Archivos a crear o modificar

- `src/components/Admin/LabelEditor/LabelEditorToolbar.jsx`

## Restricciones

- No modificar `src/hooks/labels/useLabelPersistence.ts` — `handleDeleteLabel()` ya está bien implementado
- No modificar `src/hooks/useLabelEditor.ts` (hook protegido)
- No refactorizar el toolbar más allá de lo necesario para el AlertDialog

---

## Implementación

### Archivos modificados

- `src/components/Admin/LabelEditor/LabelEditorToolbar.jsx`

### Decisiones tomadas durante la implementación

- Añadido `useState` a los imports de React
- Importados todos los componentes `AlertDialog*` de `@/components/ui/alert-dialog`
- Estado local `deleteDialogOpen` añadido en el componente `LabelEditorToolbar` (presentacional, sin hooks de datos)
- El `DropdownMenuItem` de "Eliminar" ahora llama a `() => setDeleteDialogOpen(true)` en lugar de `handleOnClickDeleteLabel` directamente
- El `AlertDialog` se sitúa antes del bloque `{children}` para no interferir con el layout del toolbar
- Botón de confirmación usa `className` explícita con `bg-destructive` en lugar de `variant="destructive"` porque `AlertDialogAction` ya tiene su propia base CSS — verificado con el patrón del proyecto
- `isSaving` se usa para deshabilitar el botón de confirmación durante la eliminación

### Desviaciones del plan

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

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

### Estado final de la implementación

Implementado y cerrado en commit junto con GAP-039, GAP-042 y GAP-043.
