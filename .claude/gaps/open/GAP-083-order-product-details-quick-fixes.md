# GAP-083 — OrderProductDetails: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Varios hallazgos menores en
`src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js` (291 líneas),
detectados en modo heurístico:

> **Nota de corrección:** igual que en GAP-082, el hallazgo original de "falta skeleton de
> carga inicial" se descartó — este componente solo lee `order` de `useOrderContext()`, ya
> gateado por el `Skeleton` de página completa en `Order/index.tsx:148-166`.

1. **Labels desalineados entre mobile y desktop** — labels en tarjetas móviles usan
   `text-xs font-medium tracking-wide uppercase` (líneas 92,98,106,114,120,128), mientras la
   tabla desktop para los mismos campos usa `TableHead` plano sin uppercase (líneas 245-251).
2. **Alineación numérica inconsistente entre tabs hermanas** — las columnas numéricas (Cajas,
   Cantidad, Precio, Subtotal, Total) no llevan `text-right` (líneas 246-251), a diferencia de
   la tabla desktop de `OrderPlannedProductDetails` que sí alinea a la derecha sus columnas
   numéricas equivalentes (líneas 691-696 de ese archivo).
3. **Falta `tabular-nums`** en ninguna celda numérica de tabla ni tarjeta móvil (líneas
   95-131, 261-266), pese a que la regla documentada lo pide para cantidades/IDs.

## Solución acordada

- Alinear el tratamiento de labels entre mobile y desktop: decidir un único patrón (sugerido:
  `text-xs text-muted-foreground` documentado, sin uppercase forzado) y aplicarlo en ambas
  variantes.
- Añadir `text-right` a las columnas numéricas de la tabla desktop, igualando el patrón ya
  usado en `OrderPlannedProductDetails`.
- Añadir `tabular-nums` a todos los valores numéricos (cantidades, precios, totales) tanto en
  la tabla desktop como en las tarjetas móviles.

## Referencias e inspiración

- `.claude/design-context.md` § Typography — `tabular-nums` en IDs/cantidades.
- `OrderPlannedProductDetails/index.js:691-696` — tabla hermana con alineación correcta, usar
  como referencia directa.

## Criterios de aceptación

- [ ] Los labels de campo usan el mismo tratamiento tipográfico en mobile y desktop.
- [ ] Las columnas numéricas de la tabla desktop están alineadas a la derecha
      (`text-right`).
- [ ] Todos los valores numéricos (tabla y tarjetas) usan `tabular-nums`.
- [ ] Ningún dato ni cálculo cambia.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js`

## Restricciones

- No añadir un skeleton de carga inicial (ya cubierto por el componente padre).
- No mezclar con la extracción del diálogo de totales (GAP-085) en el mismo commit.

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
