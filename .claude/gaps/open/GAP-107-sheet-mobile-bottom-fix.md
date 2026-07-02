# GAP-107 — Corregir Sheets sin bottom-sheet en móvil (LabelSelectorSheet y ProductionsControlPanel)

## Metadata

- **Tipo:** Bug
- **Módulo:** Etiquetas / Maquiladores-Producción
- **Prioridad:** Media
- **Estado:** open
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
