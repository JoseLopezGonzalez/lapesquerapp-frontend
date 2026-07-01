# GAP-085 — Extraer componente compartido para el diálogo "Totales" móvil

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Tres tabs del editor de pedidos reimplementan de forma casi verbatim el mismo patrón visual
de "diálogo de totales" en móvil: filas de estadística con label
`text-xs uppercase tracking-wide` + valor `text-xl font-medium` + separador `border-t pt-4`:

- `OrderPlannedProductDetails/index.js:620-651`
- `OrderProductDetails/index.js:160-219` (aprox., bloque equivalente)
- `OrderAuxiliaryLines/index.tsx:482-529` (diálogo de totales móvil)

Cada archivo mantiene su propia copia de ~30-50 líneas de JSX estructuralmente idéntico, lo
que aumenta el riesgo de que una futura corrección de estilo solo se aplique en una de las
tres copias.

## Solución acordada

Extraer un componente compartido (p.ej. `OrderTotalsSummaryDialog` o similar, ubicado junto a
las secciones que lo usan o en `src/components/Admin/OrdersManager/Order/components/`) que
reciba una lista de `{ label, value }` (o similar) y renderice el patrón de filas +
separador, reutilizándolo en los 3 archivos.

## Referencias e inspiración

- `.claude/rules/components.md` § "Cuándo crear un componente nuevo" — regla de 3+ repeticiones
  con la misma lógica ya se cumple aquí.
- Bloques JSX actuales en los 3 archivos referenciados arriba como base del diseño de props.

## Criterios de aceptación

- [ ] Existe un único componente compartido para el patrón "diálogo de totales".
- [ ] Los 3 archivos lo usan en vez de su copia local del JSX.
- [ ] El contenido y comportamiento visual de cada diálogo de totales no cambia respecto al
      actual (mismos labels, mismos valores, mismo orden).

## Archivos a crear o modificar

- Nuevo: `src/components/Admin/OrdersManager/Order/components/OrderTotalsSummaryDialog.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`

## Restricciones

- El nuevo componente debe ser `.tsx` (regla de oro 3 — nunca crear `.js` nuevos), aunque dos
  de los tres consumidores actuales sean `.js`.
- No cambiar qué datos se muestran en cada diálogo — solo extraer el shell visual compartido.

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
