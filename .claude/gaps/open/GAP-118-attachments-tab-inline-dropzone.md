# GAP-118 — Zona de arrastrar y soltar en el tab Adjuntos del pedido

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-27
- **Autor:** Jose

---

## Contexto y problema

El tab "Adjuntos" del editor de pedidos (`OrderAttachments/index.tsx`) solo permite adjuntar
archivos abriendo el modal `OrderAttachmentUploadDialog` mediante un click (botón "Adjuntar
archivo", tanto en la cabecera como en el `EmptyState` cuando no hay adjuntos). El propio tab
—ni el estado vacío, ni la vista con adjuntos ya existentes— reacciona de ninguna forma si el
usuario arrastra un archivo sobre él: no hay `onDragOver`/`onDrop` en ese nivel.

El drag-and-drop hoy solo existe **dentro** del modal (`OrderAttachmentUploadDialog.tsx`,
dropzone en líneas 111-132, con estado `isDragging` y resaltado visual borde discontinuo +
`bg-primary/5`), y ese modal además solo admite un archivo por envío.

Jose quiere que el propio tab detecte cuando se está arrastrando un archivo por encima —tanto
en el estado vacío como cuando ya hay adjuntos— y reaccione a soltarlo ahí directamente, sin
tener que abrir el modal manualmente primero.

Detectado por Jose en navegación de prueba manual, 2026-07-27.

## Solución acordada (decidido con Jose vía preguntas de clarificación)

- El área completa del tab Adjuntos (tanto el `EmptyState` cuando no hay archivos, como el
  grid cuando ya hay adjuntos) detecta `dragover`/`drop` y se resalta visualmente mientras se
  arrastra un archivo encima, reutilizando el mismo lenguaje visual que ya existe en el
  dropzone del modal (borde discontinuo + `bg-primary/5` en vez de crear un estilo nuevo).
- Al soltar, se abre automáticamente `OrderAttachmentUploadDialog` con el/los archivo(s)
  soltados ya precargados — el usuario no vuelve a seleccionarlos, solo revisa/confirma
  (y puede añadir notas) antes de enviar. No se sube nada automáticamente sin paso de
  confirmación.
- Se admite soltar **varios archivos a la vez** (no solo uno) — esto obliga a extender
  `OrderAttachmentUploadDialog` para poder mostrar y gestionar una lista de archivos
  pendientes en vez de uno solo: cada archivo de la lista debe poder quitarse individualmente
  antes de confirmar el envío, y cada uno se valida por separado contra los límites ya
  existentes (PDF/Word/Excel ≤20MB, imágenes JPG/PNG/WEBP ≤10MB), marcando cuáles no cumplen.
- El flujo de click-to-browse existente (botón "Adjuntar archivo" → abre el modal vacío →
  el usuario selecciona desde el dropzone interno del modal) sigue funcionando igual que hoy;
  si ese dropzone interno del modal también pasa a admitir selección múltiple, revisar que el
  `<input type="file">` tenga el atributo `multiple`.
- Si el usuario suelta un archivo mientras el modal ya está abierto, ese caso queda cubierto
  por el dropzone interno ya existente del modal — no es parte de este GAP.

## UI Brief

- **Vista de referencia:** dropzone interno de `OrderAttachmentUploadDialog.tsx` (líneas
  111-132) para el lenguaje visual de "arrastrando encima" — mismo patrón de borde discontinuo
  y colores, no uno nuevo. Como inspiración para gestionar **varios** archivos pendientes con
  posibilidad de quitar alguno antes de confirmar, revisar `UploadZone` en
  `src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx` (cola de
  pendientes con preview) — sin necesidad de replicar su UI exacta (esa vista es inline, sin
  modal; aquí seguimos usando el modal para la confirmación).
- **Tipo de layout:** el drop-target vive inline en el tab (`EmptyState` + grid); la
  confirmación sigue ocurriendo en el modal existente (`Dialog`), ahora con soporte multi-archivo.
- **Componentes clave:** `EmptyState` existente, grid de adjuntos existente, `Dialog` /
  `OrderAttachmentUploadDialog`, `<input type="file" multiple>`
- **Estados requeridos:** reposo (sin arrastre) / arrastrando encima (resaltado visual) /
  modal abierto con N archivos precargados, cada uno válido o marcado con error de
  validación / envío en curso (loading, deshabilitar confirmar) / éxito (`notify.success`,
  refresco de la lista de adjuntos) / error total o parcial (`notify.error` por archivo que
  falle, sin bloquear los que sí se subieron)
- **Mobile:** aplica ahora en cuanto al flujo de click-to-browse (debe seguir intacto en
  mobile). El resaltado visual de "arrastrando archivo" es un comportamiento principalmente de
  desktop (drag-and-drop de archivos no es nativo en touch) — no debe romperse en mobile, pero
  no es necesario simularlo ahí.

## Referencias e inspiración

- `OrderAttachmentUploadDialog.tsx` líneas 41, 68-84, 111-132 — estado `isDragging`,
  `handleDrop`/`handleDragOver`/`handleDragLeave`, JSX del dropzone actual
- `PalletImagesTab/index.tsx` líneas 436-529 (`UploadZone`) — patrón de cola de archivos
  pendientes con preview y gestión de varios archivos a la vez
- `OrderAttachments/index.tsx` líneas 769-772 y 817-823 — botón "Adjuntar archivo" y
  `EmptyState` actuales, punto de entrada a extender

## Criterios de aceptación

- [ ] Arrastrar uno o varios archivos sobre el tab Adjuntos (estado vacío o con adjuntos ya
      existentes) resalta visualmente el área mientras el archivo está encima
- [ ] Al soltar, se abre `OrderAttachmentUploadDialog` automáticamente con los archivos
      soltados ya precargados, sin que el usuario tenga que volver a seleccionarlos
- [ ] El modal admite varios archivos precargados a la vez, mostrando una lista donde cada
      archivo puede quitarse individualmente antes de confirmar el envío
- [ ] Cada archivo de la lista se valida contra los límites de tipo/tamaño ya existentes,
      marcando visualmente los que no cumplen sin bloquear el envío de los que sí
- [ ] El botón "Adjuntar archivo" (cabecera y `EmptyState`) sigue abriendo el modal igual que
      antes, con su dropzone interno funcionando para selección manual
- [ ] Sin regresión en el guardado de notas por adjunto existente (`OrderAttachmentEditNotesDialog`)
- [ ] El comportamiento en mobile no se rompe (click-to-browse intacto)

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` (drag handlers a
  nivel de tab, estado de arrastre, pasar archivos soltados al modal)
- `src/components/Admin/OrdersManager/Order/OrderAttachments/OrderAttachmentUploadDialog.tsx`
  (soporte multi-archivo: prop de archivos iniciales precargados, `input multiple`, lista de
  archivos pendientes con opción de quitar cada uno, validación por archivo)
- Revisar el service/mutation real usado para subir adjuntos (en `src/services/domain/` o
  hook correspondiente) para confirmar si el backend admite varios archivos en una sola
  petición o hay que iterar llamando al endpoint existente una vez por archivo

## Restricciones

- No modificar `OrderAttachmentEditNotesDialog.tsx`
- No inventar un endpoint de subida bulk si el backend no lo soporta — si solo admite un
  archivo por request, iterar client-side reutilizando la lógica de subida ya existente
- Reutilizar el estilo visual ya existente del dropzone del modal (borde discontinuo,
  colores) en vez de crear un tratamiento visual nuevo
- No tocar la lógica de listado/grid de adjuntos ya existente más allá de envolverla con los
  handlers de drag-and-drop

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
