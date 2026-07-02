# GAP-090 — OrderLabels: quick fixes de diseño

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas / Etiquetas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderLabels/index.js` (670 líneas),
detectados en modo heurístico. Incluye un bloqueante real:

1. **[Bloqueante] `alert()` para errores de validación** — `handlePrintGroupedLabels` y
   `handlePrintIndividualLabels` llaman a `alert('Por favor, selecciona...')` (líneas 184, 215)
   en vez de `notify.error`. Viola la regla explícita "Nunca `alert()`" y rompe por completo la
   sensación nativa de la app con un diálogo de navegador.
2. **Falta `EmptyState` en la rama móvil** — la rama desktop usa correctamente `EmptyState`
   para `groupedBoxes`/`filteredBoxes` vacíos (líneas 481-486, 601-610), pero la rama móvil
   (líneas 285-307, 413-452) simplemente mapea el array sin ningún guard — si está vacío, no
   se renderiza nada (ni icono, ni texto).
3. **Posible bug funcional** — `<SelectItem value={null}>` en los filtros desktop (líneas 560,
   575, 590) — Radix Select espera `string`, pasar `null` como value es sospechoso frente al
   patrón correcto ya usado en la versión móvil (sentinel `'all'`, líneas 334-349).
4. **Formato numérico inconsistente entre variantes** — la tabla desktop muestra
   `box.netWeight` en crudo (línea 648) sin `formatDecimalWeight`, mientras la tarjeta móvil sí
   lo formatea (línea 443).
5. **Tipografía** — títulos de sección móvil en `text-base font-semibold` (líneas 243, 316) y
   nombre de producto en `text-sm font-semibold` (líneas 297, 424) — cubierto por GAP-096, no
   duplicar aquí.

## Solución acordada

- Sustituir ambos `alert()` por `notify.error` con el mismo mensaje.
- Añadir guard de array vacío + `EmptyState` en ambas ramas móviles (agrupado e individual).
- Corregir `<SelectItem value={null}>` al patrón sentinel `'all'` ya usado en móvil (verificar
  que el handler de `onValueChange` interprete `'all'` como "sin filtro").
- Aplicar `formatDecimalWeight` también en la tabla desktop para `box.netWeight`.
- No repetir el fix de tipografía aquí — ya cubierto por GAP-096.

## Referencias e inspiración

- `.claude/design-context.md` § Error States y § Empty States.
- Rama móvil del propio archivo como referencia del patrón sentinel `'all'` correcto.

## Criterios de aceptación

- [ ] No queda ningún `alert()` en el archivo — ambos casos usan `notify.error`.
- [ ] Ambas ramas móviles (agrupado, individual) muestran `EmptyState` cuando el array
      correspondiente está vacío.
- [ ] Los 3 `SelectItem` con `value={null}` pasan a usar el sentinel `'all'`, y el filtrado
      sigue funcionando igual que antes.
- [ ] `box.netWeight` se muestra formateado con `formatDecimalWeight` en la tabla desktop,
      igual que en la tarjeta móvil.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.js`

## Restricciones

- No repetir el fix de `font-semibold` (GAP-096) en este GAP.
- Verificar cuidadosamente el comportamiento de filtrado tras cambiar `value={null}` a
  `'all'` — es un cambio con superficie de riesgo funcional, no solo visual.

---

## Implementación

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`
- `.claude/gaps/in-progress/GAP-090-order-labels-quick-fixes.md`

### Decisiones tomadas durante la implementación

- Se cambiaron las validaciones de impresión sin selección de `notify.warning` a `notify.error`,
  alineándolo con la solución acordada.
- Se reutilizó el mismo copy de `EmptyState` que ya existía en desktop para las dos ramas móviles.
- Se mantuvo el patrón sentinel `'all'` existente en móvil y desktop; el archivo ya no tenía
  `SelectItem value={null}` al comenzar esta implementación.
- Se aplicó `formatDecimalWeight(box.netWeight)` también en la celda desktop de peso neto.

### Desviaciones del plan (si las hay)

- El GAP menciona `index.js`, pero el archivo actual del módulo es
  `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`. Se implementó en ese archivo
  porque corresponde al mismo componente y ubicación funcional.
- Al iniciar la implementación ya no quedaban `alert()` ni `SelectItem value={null}` en el archivo;
  se verificó con búsqueda textual y se completaron los criterios pendientes.

- Checks ejecutados:
  - `rg -n "alert\\(|SelectItem value=\\{null\\}|notify\\.warning|box\\.netWeight\\}" src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`
  - `npx eslint src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`
  - `npm run type-check`

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
