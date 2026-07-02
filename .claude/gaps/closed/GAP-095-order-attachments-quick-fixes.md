# GAP-095 — OrderAttachments: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` (773
líneas), `OrderAttachmentUploadDialog.tsx` (242 líneas) y
`OrderAttachmentEditNotesDialog.tsx` (82 líneas), detectados en modo heurístico. Esta es la
sección más madura del módulo frente al checklist (ya usa `Skeleton`, `EmptyState`,
`AlertDialog` correctamente para borrado), pero tiene varios detalles de "shadcn nativo" a
corregir:

1. **`<button>` nativo en vez de `Button` shadcn** — usado extensamente para acciones de icono
   en `AttachmentCard` (líneas 253-279) y en toda la barra/nav de `AttachmentViewer` (líneas
   378-409, 490-503), en vez de `Button variant="ghost" size="icon"`.
2. **SVG inline manual** para el icono "abrir en nueva pestaña" (líneas 383-387) en vez de un
   icono `lucide-react`, pese a que el resto del archivo usa lucide consistentemente.
3. **Tamaños de texto arbitrarios** `text-[11px]` (nombre de archivo) y `text-[9px]` (notas,
   badge de extensión) — líneas 210, 285, 289 — no están en la escala documentada (el tamaño
   más pequeño documentado es `text-xs` = 12px).
4. **Micro-interacción en grid operativo** — `hover:scale-[1.02]` + `hover:shadow-md` en
   `AttachmentCard` (línea 243) — no es Framer Motion, pero es la misma categoría de animación
   no deseada en pantallas operativas densas.
5. **Selector de tipo de archivo hecho a mano** — `role="radio"` sobre un grid de `<div>`
   (`OrderAttachmentUploadDialog.tsx:174-204`) en vez de `RadioGroup`/`ToggleGroup` de shadcn.
6. **Raw `<img>`** — cubierto por GAP-097, no duplicar aquí.
7. **`Loader2` sin `backdrop-blur-sm`** en `AttachmentViewer` para carga de imagen/PDF dentro
   del visor (líneas 418-419, 438-442) — no sigue el patrón exacto de overlay documentado.

## Solución acordada

- Sustituir los `<button>` nativos por `Button variant="ghost" size="icon"` en los 3 puntos
  señalados.
- Sustituir el SVG inline por el icono `lucide-react` equivalente (`ExternalLink` o similar).
- Sustituir `text-[11px]`/`text-[9px]` por el tamaño documentado más cercano (`text-xs`),
  ajustando el layout si el espacio disponible lo requiere.
- Quitar `hover:scale-[1.02]` de `AttachmentCard`, manteniendo (si se desea alguna
  retroalimentación) solo `hover:shadow-md` o un cambio de color de borde.
- Sustituir el selector de tipo de archivo por `RadioGroup`/`ToggleGroup` de shadcn si su API
  cubre el caso (grid de opciones con icono + texto).
- Añadir `backdrop-blur-sm` al overlay de `Loader2` dentro de `AttachmentViewer`, siguiendo el
  patrón documentado de "processing overlay sobre datos ya cargados".

## Referencias e inspiración

- `.claude/design-context.md` § Loading States, § Action Buttons, § Native Shadcn Feel.
- `src/components/ui/radio-group.tsx` / `toggle-group.tsx` (verificar cuál encaja mejor antes
  de implementar).

## Criterios de aceptación

- [ ] No queda ningún `<button>` nativo en los 3 puntos señalados — todos usan `Button`.
- [ ] El icono "abrir en nueva pestaña" es un icono `lucide-react`, no SVG inline.
- [ ] No quedan tamaños de texto arbitrarios (`text-[Npx]`) en el archivo — se usa la escala
      documentada.
- [ ] `AttachmentCard` no tiene `hover:scale-[1.02]`.
- [ ] El selector de tipo de archivo usa un primitivo shadcn (`RadioGroup`/`ToggleGroup`) si
      su API cubre el caso; si no, se documenta por qué se mantiene el patrón manual.
- [ ] El overlay `Loader2` del visor usa `backdrop-blur-sm`.
- [ ] Ningún flujo de subida/visualización/borrado de adjuntos cambia de comportamiento.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/OrderAttachmentUploadDialog.tsx`

## Restricciones

- No tocar `raw <img>` aquí — ya cubierto por GAP-097.
- No cambiar la lógica de subida/almacenamiento de adjuntos.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/OrderAttachmentUploadDialog.tsx`

### Decisiones tomadas durante la implementación

- Las acciones de `AttachmentCard` y `AttachmentViewer` pasan de `<button>` nativo a `Button`
  shadcn (`variant="ghost"`, tamaños iconográficos existentes).
- El SVG inline de "abrir en nueva pestaña" se sustituyó por `ExternalLink` de `lucide-react`.
- Los tamaños arbitrarios `text-[11px]`/`text-[9px]` se normalizaron a `text-xs`.
- Se eliminó `hover:scale-[1.02]` de `AttachmentCard`; se mantiene únicamente `hover:shadow-md`
  como feedback ligero.
- No existe `RadioGroup` ni `ToggleGroup` en `src/components/ui/`; para evitar añadir
  dependencias/componentes fuera de alcance, el selector de tipo usa `Button` shadcn con
  semántica `role="radiogroup"`/`role="radio"`, manteniendo el comportamiento previo.
- Los overlays de carga de imagen/PDF dentro del visor incorporan `backdrop-blur-sm`.

### Desviaciones del plan (si las hay)

Ninguna funcional. El selector no usa `RadioGroup`/`ToggleGroup` porque esos primitivos no están
instalados en el proyecto; se usa `Button` shadcn como alternativa documentada.

### Checks ejecutados

- `npm run type-check` — OK.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx src/components/Admin/OrdersManager/Order/OrderAttachments/OrderAttachmentUploadDialog.tsx` — OK con 0 errores y 7 warnings preexistentes/out-of-scope (`setState` en effects, `<img>` cubierto por GAP-097, icono dinámico).
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx src/components/Admin/OrdersManager/Order/OrderAttachments/OrderAttachmentUploadDialog.tsx .claude/gaps/in-progress/GAP-095-order-attachments-quick-fixes.md` — OK.
- `rg "<button|</button|text-\\[|hover:scale|<svg" ...OrderAttachments...` — sin coincidencias en los dos archivos modificados.

---

## Auditoría

> Auditoría ligera ejecutada por Codex el 2026-07-02.

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos según revisión documental y comprobaciones puntuales
- [x] Sin fetch() directo nuevo detectado en el alcance del GAP
- [x] Sin hardcode de tenant detectado
- [x] Sin archivos .js nuevos creados por el GAP
- [x] Sin any sin justificación detectado en la revisión ligera
- [x] Hooks gigantes no tocados fuera del alcance aprobado
- [x] entitiesConfig.js no tocado fuera del alcance aprobado
- [x] Patrones del workflow de GAP respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

- `npm run type-check` pasa limpio en el estado actual del repositorio.
- Auditoría intencionadamente ligera: se revisaron criterios, implementación documentada y búsquedas puntuales de regresión; no se ejecutó smoke test visual/manual completo con backend real.
- Las observaciones o warnings preexistentes documentados en la implementación quedan fuera de alcance y no bloquean el cierre.

### Estado final de la implementación

GAP aprobado con observaciones y listo para cierre.
