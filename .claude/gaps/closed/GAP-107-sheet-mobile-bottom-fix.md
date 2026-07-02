# GAP-107 — Corregir Sheets sin bottom-sheet en móvil (LabelSelectorSheet y ProductionsControlPanel)

## Metadata

- **Tipo:** Bug
- **Módulo:** Etiquetas / Maquiladores-Producción
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía /audit-design consistency — familia `paneles-edicion`)

---

## Contexto y problema

`design-context.md` § Modals documenta que los `Sheet` deben abrir como panel lateral
(`side="right"`) en desktop y como bottom-sheet (`side="bottom"`) en mobile, alternando
según `useIsMobileSafe`. 3 de los 5 miembros de la familia `paneles-edicion`
(`OrderEditSheet`, `PositionSlideover`, `UnallocatedPositionSlideover`) siguen este
patrón correctamente con `side={isMobile ? 'bottom' : 'right'}`. 2 no lo hacen:

- `src/components/Admin/LabelEditor/LabelSelectorSheet.jsx` — siempre `side="right"`,
  sin ningún import de `useIsMobileSafe`
- `src/components/Admin/ProductionsControlPanel/index.jsx` — 2 `SheetContent`
  (detalle de producción ~línea 1294, cajas huérfanas ~línea 1767), ambos con
  `side` por defecto (derecha), tampoco usan `useIsMobileSafe`

En mobile, ambos abren como panel lateral estrecho en vez de bottom-sheet, rompiendo
el patrón táctil documentado en `design-context.md` § Mobile Patterns y § Modals.

## Solución acordada

En los 2 archivos: importar `useIsMobileSafe` (con guard `mounted`), y aplicar
`side={isMobile ? 'bottom' : 'right'}` en cada `SheetContent`, con el tratamiento de
clase ya usado por los miembros de referencia en mobile (`rounded-t-2xl`/`-3xl`,
`max-h-[85-90vh]`, overflow-y-auto).

El ancho de escritorio de ambos archivos (700px en LabelSelectorSheet, `max-w-xl` en
ProductionsControlPanel) **no se toca** — decisión explícita: puede ser intencional
dado el contenido más estrecho de esas vistas, y normalizarlo no forma parte de este
GAP.

## UI Brief

- **Vista de referencia:** `src/components/Admin/Stores/StoresManager/Store/PositionSlideover/index.tsx`
  — patrón correcto de `side={isMobile ? 'bottom' : 'right'}` con clases mobile/desktop
  diferenciadas
- **Tipo de layout:** panel lateral (Sheet) — bottom en mobile, right en desktop (sin
  cambios de layout interno, solo el contenedor)
- **Componentes clave:** `Sheet`, `SheetContent`, `useIsMobileSafe`
- **Estados requeridos:** sin cambios — loading/empty/error internos de cada sheet no
  se tocan
- **Mobile:** aplica ahora — es exactamente el bug a corregir

### Preguntas de confirmación para Jose

Ya respondidas en la ronda de clarificación previa:
1. Solo se corrige el `side` mobile — el ancho de escritorio queda igual ✅
2. Un único GAP para los 2 archivos (mismo fix, mismo patrón) ✅

## Referencias e inspiración

- `design-context.md` § Modals & Dialogs → Sheet (side panel)
- `design-context.md` § Mobile Patterns
- `PositionSlideover/index.tsx`, `UnallocatedPositionSlideover/index.tsx`,
  `OrderEditSheet/index.js` — referencia del patrón correcto

## Criterios de aceptación

- [ ] `LabelSelectorSheet.jsx` importa `useIsMobileSafe`, usa el guard `mounted`, y
      su `SheetContent` usa `side={isMobile ? 'bottom' : 'right'}`
- [ ] `ProductionsControlPanel/index.jsx` aplica el mismo patrón en sus 2
      `SheetContent` (detalle de producción y cajas huérfanas)
- [ ] En mobile (<768px) ambos abren desde abajo con esquinas redondeadas superiores y
      `max-h` acorde al contenido
- [ ] El ancho de escritorio de ambos archivos no cambia
- [ ] Desktop (≥768px) sigue abriendo `side="right"` igual que antes
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

- `src/components/Admin/LabelEditor/LabelSelectorSheet.jsx`
- `src/components/Admin/ProductionsControlPanel/index.jsx`

## Restricciones

- No modificar el ancho de escritorio de ninguno de los dos Sheets
- No tocar la lógica de datos ni el contenido interno de los sheets
- No usar `useIsMobile` sin el guard `mounted` (regla `.claude/project-learnings.md` PL-022)

---

## Implementación

Implementado por Codex el 2026-07-02.

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/LabelEditor/LabelSelectorSheet.jsx`
- `src/components/Admin/ProductionsControlPanel/index.jsx`
- `.claude/gaps/in-progress/GAP-107-sheet-mobile-bottom-fix.md`

### Decisiones tomadas durante la implementación

- Se añadió `useIsMobileSafe` en ambos archivos y se usó el guard `mounted`.
- `LabelSelectorSheet` usa `side={sheetSide}` con bottom-sheet móvil (`max-h-[85vh]`, `rounded-t-2xl`, `overflow-y-auto`) y conserva el ancho desktop `w-[400px] sm:w-[700px] sm:max-w-[700px]`.
- `ProductionSidePanel` usa bottom-sheet móvil (`max-h-[90vh]`, `rounded-t-2xl`, `overflow-y-auto`) y conserva `sm:max-w-xl` en desktop.
- El sheet de cajas huérfanas usa bottom-sheet móvil (`max-h-[90vh]`, `rounded-t-2xl`) y conserva `sm:max-w-3xl` en desktop.
- Se ejecutaron `npx eslint` sobre los dos archivos modificados y `npm run type-check`.

### Desviaciones del plan (si las hay)

- No hubo desviaciones de alcance.
- No se tocaron datos, hooks de negocio ni contenido interno de los sheets.
- ESLint mantiene un warning preexistente en `ProductionsControlPanel/index.jsx` sobre query keys literales, fuera del alcance de este GAP.

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
