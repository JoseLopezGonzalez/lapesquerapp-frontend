# GAP-081 — OrderDetails: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Varios hallazgos menores en `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
(628 líneas), detectados en modo heurístico (sin captura de pantalla):

1. **Duplicación de contenido** — "Coste total" y "Margen bruto" se muestran dos veces en la
   vista móvil: una vez bajo "Rentabilidad" (líneas 187-203) y otra vez, verbatim, bajo
   "Resumen" (líneas 244-253).
2. **Drift de peso de label entre mobile y desktop** — el label de un mismo dato usa
   `text-sm font-medium` en móvil (línea 110) pero `text-muted-foreground text-sm` (sin
   `font-medium`) en desktop (línea 362), para el mismo campo.
3. **Empty state informal** — la ausencia de dirección de envío para el mapa se muestra con un
   `<div>` con texto plano ("No hay dirección de envío", líneas 339, 617) en vez del patrón
   `EmptyState` documentado.
4. **Balance de la tarjeta "Envío"** — en desktop, la tarjeta "Envío" ocupa `md:col-span-2`
   mientras sus tarjetas hermanas ("Comercial"/"Rentabilidad"/"Resumen") ocupan
   `md:col-span-1` (línea 352, 505) — verificar visualmente si el resultado queda descompensado
   antes de decidir si amerita cambio.

Nota: el widget de matrícula de camión con `style={{ fontFamily: 'OCR A Std, monospace',
fontWeight: 600 }}` (líneas 572, 587) es un efecto visual deliberado (matrícula estilo
placa) — **no se toca en este GAP**, se documenta como excepción intencional.

## Solución acordada

- Eliminar la duplicación de "Coste total"/"Margen bruto", dejando el dato en una única
  sección ("Rentabilidad" o "Resumen", a decidir por cuál agrupa mejor el resto de su
  contexto).
- Igualar el peso del label entre mobile y desktop (usar `text-sm text-muted-foreground` sin
  `font-medium` en ambos, o `font-medium` en ambos — alinear al patrón que use el resto de la
  vista de detalles predominantemente).
- Sustituir el `<div>` de texto plano por el patrón `EmptyState` (o una versión ligera del
  mismo si el contexto de tarjeta de mapa es demasiado pequeño para el `EmptyState` completo —
  a criterio del implementador, manteniendo icono + texto como mínimo).
- Revisar visualmente el balance de la tarjeta "Envío" tras los cambios anteriores; solo
  ajustar el `col-span` si el resultado se ve claramente descompensado.

## Referencias e inspiración

- `.claude/design-context.md` § Empty States.
- Resto de tarjetas de la misma vista como referencia de peso de label.

## Criterios de aceptación

- [ ] "Coste total" y "Margen bruto" aparecen una única vez en la vista móvil.
- [ ] El peso del label es consistente entre la variante mobile y desktop para el mismo dato.
- [ ] La ausencia de dirección de envío usa un patrón de empty state con icono, no solo texto.
- [ ] Ningún dato ni cálculo cambia — solo presentación.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`

## Restricciones

- No tocar el widget de matrícula (líneas 571-596) — es un efecto visual intencional.
- No modificar los cálculos de coste/margen/rentabilidad.

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
