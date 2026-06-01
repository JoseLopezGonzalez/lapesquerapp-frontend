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
