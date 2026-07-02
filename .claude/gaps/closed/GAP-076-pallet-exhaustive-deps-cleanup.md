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

### Archivos creados

- `src/hooks/pallets/usePalletScannerEffects.ts` — sub-hook que encapsula los dos efectos de
  auto-submit del scanner (añadir caja por GS1-128, eliminar caja por código escaneado). Recibe
  `scannedCode`/`deleteScannedCode` (los triggers reales) y `onAddNewBox`/`onDeleteScannedCode`
  (funciones no memoizadas, recreadas en cada render de `usePalletBoxCreation`), leídas a través
  de refs para que el array de dependencias solo contenga los triggers reales.

### Archivos modificados

- `src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx`:
  - Efecto de reset de notas del lightbox (antes línea 206): ahora lee `resolvedNotes` a través
    de un ref (`resolvedNotesRef`, actualizado en su propio `useEffect` sin deps — nunca mutado
    durante el render) en vez de recalcularlo dentro del efecto con `notesOverrides`/
    `attachment.notes` sueltos. Deps: `[attachment.id]` sin disable.
  - `UploadZone.addFiles` (antes línea 481, dentro de `handleDrop`): envuelto en `useCallback([])`
    — no depende de ningún estado externo salvo setters estables. `handleDrop` pasa a depender de
    `[addFiles]`, ya estable.
  - Efecto de auto-apertura del lightbox en `initialLightboxIndex` (antes línea 619): añadido
    `initialLightboxIndex` a deps. Sigue protegido por el ref `initialIndexApplied` (solo aplica
    una vez).
  - Efecto de clamp del lightboxIndex (antes línea 629): añadido `lightboxIndex` a deps. Seguro
    porque `setLightboxIndex` solo se llama cuando el valor realmente cambia.
- `src/components/Admin/Pallets/PalletAttachments/PalletLightboxDialog.tsx`:
  - Efecto de clamp/auto-close (antes línea 60): añadidas `open`, `currentIndex`, `onOpenChange`
    a deps. Seguro porque el guard `if (!open) return` corta cualquier re-ejecución tras un
    `onOpenChange(false)`, y `setCurrentIndex` solo se llama cuando el índice realmente cambia.
- `src/components/Admin/Pallets/PalletLabelDialog/index.tsx`:
  - Extraído `MobilePalletLabelPrintTrigger` (sub-componente con props
    `{ isOpen, pallet, onPrint, onClose }`), montado solo cuando `isMobile` es `true`. El
    guard `!isMobile` que antes vivía dentro del efecto ahora es sustituido por el propio ciclo
    de montaje del sub-componente. `onPrint`/`onClose` se leen vía refs (actualizados en su
    propio efecto sin deps) porque `onClose` es una prop cuya estabilidad no está garantizada
    por los callers existentes (p.ej. `useStoreDialogs.ts`, fuera del alcance de este GAP).
    Deps del efecto de impresión: `[isOpen, pallet]`.
- `src/hooks/usePallet.ts`:
  - Efecto de carga inicial (antes línea 138): `initialPallet` se lee a través de
    `initialPalletRef` (actualizado en su propio efecto sin deps) en vez de directamente, porque
    no está garantizado que sea referencialmente estable entre renders del caller
    (`PalletDialog`/`PalletView` lo reenvían sin memoizar). Esto preserva el comportamiento
    original: el efecto solo recarga cuando cambian `id`/`reload`/`initialStoreId`/
    `initialOrderId`/`externalActor`, nunca por un cambio de referencia de `initialPallet` con
    el mismo valor lógico.
  - Los dos efectos de auto-submit del scanner (antes líneas 199 y 207) sustituidos por la
    llamada a `usePalletScannerEffects(...)`. Ningún otro export de `usePallet` fue tocado.

### Decisiones tomadas durante la implementación

- **Patrón "ref actualizado en efecto propio" en vez de mutación de ref durante render:** el
  proyecto tiene activa la regla `react-hooks/refs` del plugin ESLint de React Compiler, que
  prohíbe `ref.current = x` inline durante el render (patrón "latest ref" clásico). Los 4 casos
  que necesitaban leer un valor "más reciente" sin que disparara el efecto (`resolvedNotesRef`,
  `onPrintRef`/`onCloseRef`, `onAddNewBoxRef`/`onDeleteScannedCodeRef`, `initialPalletRef`) se
  implementaron con un `useEffect(() => { ref.current = valor; })` sin array de deps (se ejecuta
  tras cada render, antes de que el efecto consumidor —declarado después— lo lea), en vez de
  mutar el ref directamente en el cuerpo del componente/hook. Esto no estaba documentado en el
  GAP original ni en `project-learnings.md`; se detectó al correr `npm run lint` tras la primera
  pasada de implementación.
- No se tocó `useStoreDialogs.ts` (donde `closePalletLabelDialog` no está memoizada con
  `useCallback`) por estar fuera de los archivos listados en el GAP. El riesgo de inestabilidad
  de esa prop se mitigó dentro de `PalletLabelDialog` leyendo `onClose` vía ref.

### Desviaciones del plan (si las hay)

Ninguna respecto a la solución acordada en el GAP. El único ajuste no anticipado por el GAP fue
el patrón de actualización de refs vía efecto propio (en vez de mutación inline), requerido por
`react-hooks/refs`, no mencionado explícitamente en el GAP pero necesario para pasar `npm run
lint` sin warnings nuevos.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist

Criterios de aceptación del GAP:
- [x] Los 4 archivos listados no tienen `eslint-disable` para `exhaustive-deps` — CUMPLIDO
      (verificado con grep, cero instancias en los 5 archivos tocados/creados)
- [x] Lightbox: cambio de imagen resetea notas; teclado y thumbs OK — CUMPLIDO (analizado por
      trace lógico: `resolvedNotesRef` se actualiza en un `useEffect` sin deps declarado antes
      del efecto de reset; React garantiza orden de ejecución por declaración, así que el reset
      siempre lee el `resolvedNotes` ya recalculado para la nueva imagen)
- [x] Upload drag-and-drop sigue aceptando archivos — CUMPLIDO (`addFiles` estabilizado con
      `useCallback([])`, sin cambio de lógica interna)
- [x] Lightbox se abre en `initialLightboxIndex` y se cierra al borrar última imagen — CUMPLIDO
      (guard `initialIndexApplied` ref preservado; `attachments.length === 0` sigue disparando
      `setLightboxIndex(null)`)
- [x] Mobile: PalletLabelDialog dispara impresión al abrir — CUMPLIDO (sub-componente
      `MobilePalletLabelPrintTrigger` se monta solo cuando `isMobile`, mismo timing de 150ms)
- [x] Scanner: auto-submit a 42 caracteres y auto-delete por código siguen funcionando —
      CUMPLIDO (`usePalletScannerEffects` preserva `scannedCode`/`deleteScannedCode` como únicos
      triggers reales vía refs para las funciones inestables)
- [x] `npm run lint` sin nuevos warnings en archivos tocados — CUMPLIDO (0 warnings de
      `exhaustive-deps` o `react-hooks/refs`; los warnings de `set-state-in-effect` y
      `no-img-element` restantes son preexistentes, confirmados contra `git show HEAD`)
- [x] `npm run type-check` limpio — CUMPLIDO (`tsc --noEmit` sin salida, exit limpio)

Checklist técnico del proyecto:
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos (sub-hook creado en `.ts`)
- [x] Sin `any` sin justificación (los `unknown`/casts existentes son preexistentes, no
      introducidos por este GAP)
- [x] `usePallet.ts` no tocado más allá de la extracción mínima a sub-hook autorizada por el
      GAP — el `return` final expone exactamente el mismo set de claves que antes
- [x] `entitiesConfig.js` no tocado
- [x] Patrones de `.claude/rules/hooks.md` respetados: sub-hook `use[Utility]`
      (`usePalletScannerEffects`) en `src/hooks/pallets/`, no importa componentes ni otros hooks
      de dominio distintos
- [x] Nomenclatura correcta

### Observaciones para Jose

**Implementación sólida y cuidadosa con el comportamiento interactivo.** Los 4 casos no se
resolvieron con la solución "más simple" de añadir deps a ciegas — en cada uno se analizó si
añadir la dependencia real cambiaría el comportamiento observable, y donde sí lo haría (funciones
no memoizadas de `usePalletBoxCreation`, `onClose`/`onOpenChange` de callers no controlados por
este GAP, `initialPallet` no memoizado por el caller) se usó el patrón "leer última referencia
vía ref" en vez de silenciar ESLint.

Un hallazgo no anticipado por el GAP: el proyecto tiene activa la regla `react-hooks/refs` del
plugin de React Compiler, que prohíbe mutar `ref.current` inline durante el render — el patrón
"latest ref" clásico (`ref.current = valor` en el cuerpo del componente) dispara error de lint.
La implementación lo resolvió correctamente actualizando cada ref dentro de su propio
`useEffect` sin array de deps, declarado siempre antes del efecto consumidor (orden de
ejecución de efectos garantizado por React), evitando cualquier lectura de valor obsoleto. Esto
merece una entrada en `project-learnings.md` como AUDIT_RULE: cualquier fix futuro de
`exhaustive-deps` que recurra al patrón "ref para valor inestable" debe usar
`useEffect(() => { ref.current = valor })` sin deps, nunca mutación inline durante el render,
porque `react-hooks/refs` ya está activo en el proyecto y lo bloqueará.

Punto que resta 1 punto de la puntuación (no bloqueante): `onClose` en
`useStoreDialogs.ts:122-124` (`closePalletLabelDialog`) no está memoizada con `useCallback`, a
diferencia del resto de callbacks de ese mismo hook (`handleOpenPalletLabelDialog`/
`handleClosePalletLabelDialog` en `useOrderPallets.ts` sí lo están). Quedó fuera del alcance de
este GAP porque `useStoreDialogs.ts` no está en la lista de archivos a modificar, y el riesgo se
mitigó localmente en `PalletLabelDialog` vía ref — pero memoizar `closePalletLabelDialog` en
origen sería la corrección más limpia. Sugiero un GAP de seguimiento pequeño si se quiere pulir.

### Estado final de la implementación

Los 4 archivos objetivo del GAP quedaron sin ninguna suppresión de `react-hooks/exhaustive-deps`,
cada uno con un fix estructural distinto tal como pedía el GAP: lectura vía ref para el reset de
notas del lightbox, `useCallback` para estabilizar `addFiles`/`handleDrop`, deps completas
seguras por guards de `setState` condicional en los dos efectos de clamp/auto-apertura del
lightbox (tanto en `PalletImagesTab` como en `PalletLightboxDialog`), extracción de
`MobilePalletLabelPrintTrigger` como sub-componente montado condicionalmente, y extracción de
`usePalletScannerEffects.ts` como sub-hook en `src/hooks/pallets/` para los dos efectos de
auto-submit del scanner. No se tocó ningún otro export de `usePallet`, no se cambió lógica de
negocio (validación de imágenes, permisos de delete, formato de etiqueta), y `npm run lint` /
`npm run type-check` están limpios en el módulo pallets.
