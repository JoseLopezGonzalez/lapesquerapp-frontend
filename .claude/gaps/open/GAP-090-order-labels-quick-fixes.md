# GAP-090 — OrderLabels: quick fixes de diseño

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas / Etiquetas
- **Prioridad:** Alta
- **Estado:** open
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

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

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
