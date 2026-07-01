# GAP-076 — Eliminar eslint-disable exhaustive-deps en módulo pallets

## Metadata

- **Tipo:** Mejora
- **Módulo:** Stock / Palets
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Auditoría `/audit-code quality pallet editor` (2026-07-01). Varios archivos del módulo pallets
suprimen `react-hooks/exhaustive-deps` en lugar de corregir dependencias o extraer sub-componentes.
PL-002 documenta que `eslint-disable` no es solución permanente para violations de hooks.

**Instancias detectadas:**

| Archivo | Líneas | Contexto |
|---|---|---|
| `PalletView/PalletImagesTab/index.tsx` | 206, 481, 619, 629 | Lightbox notes, UploadZone drop, lightbox index sync |
| `PalletAttachments/PalletLightboxDialog.tsx` | 60 | Auto-close al borrar todas las imágenes |
| `PalletLabelDialog/index.tsx` | 40 | Auto-print en mobile al abrir |
| `src/hooks/usePallet.ts` | 138, 204, 212 | Carga inicial, scanner auto-submit códigos GS1 |

---

## Solución acordada

Para cada suppressión, aplicar la corrección estructural (no borrar el comentario sin fix):

### PalletImagesTab / Lightbox (línea 206)
- Sincronizar `notesValue` cuando cambia `attachment.id` o `resolvedNotes`: incluir deps
  correctas o derivar estado con key en el componente (`key={attachment.id}` en sub-tree)

### UploadZone (línea 481)
- Envolver `addFiles` en `useCallback` con deps estables, o mover lógica inline al `handleDrop`

### PalletImagesTab (619, 629)
- Incluir `initialLightboxIndex` y `lightboxIndex` en deps, o usar patrón ref para
  `initialIndexApplied` sin omitir deps necesarias

### PalletLightboxDialog (60)
- Incluir `onOpenChange`, `currentIndex`, `open` en deps del efecto de clamp/cierre

### PalletLabelDialog (40)
- Extraer sub-componente `MobilePalletLabelPrintTrigger` con props `{ isOpen, pallet, onPrint, onClose }`
  para que el efecto tenga deps explícitas sin disable

### usePallet.ts (138)
- Revisar si `initialPallet` debe estar en deps del efecto de carga; usar `useCallback` para
  handlers estables donde aplique

### usePallet.ts (204, 212)
- Extraer `ScannerAutoSubmit` o watchers como sub-hooks (`usePalletScannerEffects`) con deps
  completas de `onAddNewBox` / `onDeleteScannedCode` estabilizados con `useCallback` en el
  hook padre o sub-hook dedicado en `src/hooks/pallets/`

**Regla:** Tras cada fix, el archivo no debe contener `eslint-disable` para `exhaustive-deps`
salvo justificación documentada en comentario de una línea con razón técnica verificable.

---

## Referencias e inspiración

- PL-002 (no eslint-disable permanente para hooks)
- GAP-024 (extraer sub-componente para rules-of-hooks — mismo principio)
- GAP-005 (sub-hooks en `src/hooks/pallets/`)

## Criterios de aceptación

- [ ] Los 4 archivos listados no tienen `eslint-disable` para `react-hooks/exhaustive-deps`
- [ ] Comportamiento verificado manualmente:
  - Lightbox: cambio de imagen resetea notas; teclado y thumbs OK
  - Upload drag-and-drop sigue aceptando archivos
  - Lightbox se abre en `initialLightboxIndex` y se cierra al borrar última imagen
  - Mobile: PalletLabelDialog dispara impresión al abrir
  - Scanner: auto-submit a 42 caracteres y auto-delete por código siguen funcionando
- [ ] `npm run lint` sin nuevos warnings en archivos tocados
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

**Modificar:**
- `src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx`
- `src/components/Admin/Pallets/PalletAttachments/PalletLightboxDialog.tsx`
- `src/components/Admin/Pallets/PalletLabelDialog/index.tsx`
- `src/hooks/usePallet.ts`

**Crear (si el implementador extrae sub-hook):**
- `src/hooks/pallets/usePalletScannerEffects.ts` — opcional, preferible a más lógica en usePallet

## Restricciones

- No cambiar lógica de negocio (validación imágenes, permisos delete, formato etiqueta)
- No añadir lógica nueva a `usePallet.ts` salvo extracción mínima a sub-hook
- Si se crea sub-hook, no tocar otros exports de `usePallet`

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
