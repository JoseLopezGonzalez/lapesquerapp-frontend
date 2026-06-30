# GAP-040 — AlertDialog para eliminar etiqueta en LabelEditor

## Metadata

- **Tipo:** Bug / UX
- **Módulo:** Etiquetas
- **Prioridad:** Alta
- **Estado:** open
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

- [ ] Al hacer clic en "Eliminar etiqueta", se abre un `AlertDialog` (no se ejecuta la eliminación directamente)
- [ ] El `AlertDialog` muestra título, descripción con el nombre de la etiqueta y dos botones
- [ ] "Cancelar" cierra el dialog sin eliminar nada
- [ ] "Eliminar" llama a `handleDeleteLabel()` y cierra el dialog
- [ ] El botón de confirmación queda `disabled` mientras la mutación de eliminación está en progreso (`isSaving` o `isPending`)
- [ ] No se puede abrir el dialog si no hay ninguna etiqueta seleccionada (el botón ya estaba oculto en ese caso — verificar que sigue así)
- [ ] TypeScript compila sin errores en los archivos modificados

## Archivos a crear o modificar

- `src/components/Admin/LabelEditor/LabelEditorToolbar.jsx`

## Restricciones

- No modificar `src/hooks/labels/useLabelPersistence.ts` — `handleDeleteLabel()` ya está bien implementado
- No modificar `src/hooks/useLabelEditor.ts` (hook protegido)
- No refactorizar el toolbar más allá de lo necesario para el AlertDialog

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
