# GAP-086 — OrderCostAnalysis: quick fixes de diseño

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx` (511
líneas), detectados en modo heurístico. El de mayor prioridad es un bloqueante de tipografía;
el resto son quick fixes menores:

1. **[Bloqueante] Tipografía del KPI principal fuera de escala** — `text-2xl font-semibold` /
   `text-xl font-semibold` (líneas 39-63) para el número más prominente del tab (margen/
   ingreso), un peso (`font-semibold`) que no existe en ningún punto de la escala documentada.
   Este ítem se resuelve junto con GAP-096 (normalización de `font-semibold` en 5 archivos) —
   no duplicar el fix aquí, solo verificar que quede cubierto.
2. **Labels con `uppercase tracking-wide`** repetidos ~17 veces en grids de detalle del
   acordeón móvil (líneas 82,88,92,96,100,104,108,112,139,143,147,151,155,159,163,167,174) —
   extensión no documentada del patrón `text-xs text-muted-foreground`.
3. **Sin `TableFooter` de totales** en las tablas de líneas de producto/palets (líneas
   294-341, 363-427) pese a tener 9 columnas numéricas — a diferencia de `OrderAuxiliaryLines`,
   que sí tiene fila de totales. Los totales solo se ven en las 4 `AnalysisMetricCard` de
   arriba, nunca reconciliados visualmente contra las filas de la tabla.
4. **`CardTitle` en `text-lg font-medium`** (línea 436) — mismo criterio que GAP-084/087.

## Solución acordada

- El fix de tipografía del KPI queda cubierto por GAP-096 — este GAP no lo repite, solo lo
  referencia como dependencia.
- Quitar `uppercase tracking-wide` de los labels del acordeón, dejando el patrón documentado
  `text-xs text-muted-foreground` sin transformación de texto.
- Añadir una fila de `TableFooter` con totales a ambas tablas (líneas/palets), replicando el
  patrón ya usado en `OrderAuxiliaryLines`.
- Aplicar el mismo criterio de `CardTitle` acordado en GAP-084/087 (todos al mismo tamaño).

## Referencias e inspiración

- `OrderAuxiliaryLines/index.tsx` (`TableFooter` con totales) como referencia directa.
- GAP-096 para el fix de tipografía del KPI.

## Criterios de aceptación

- [ ] El KPI principal usa la escala tipográfica documentada (ver GAP-096; verificar aquí que
      quede aplicado si ambos GAPs se implementan por separado).
- [ ] Ningún label del acordeón móvil usa `uppercase tracking-wide`.
- [ ] Ambas tablas (líneas de producto, palets) muestran una fila de totales coherente con las
      `AnalysisMetricCard`.
- [ ] `CardTitle` usa el mismo tamaño acordado para `OrderAuxiliaryLines`/`OrderProduction`.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`

## Restricciones

- No duplicar el fix de tipografía del KPI si GAP-096 ya lo cubre — coordinar orden de
  implementación entre ambos GAPs.
- No cambiar los cálculos de margen/coste/rentabilidad.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`

### Decisiones tomadas durante la implementación

- Los footers de ambas tablas reutilizan los valores globales ya mostrados en las
  `AnalysisMetricCard` (`summary.totalRevenue`, `summary.totalCost`, `summary.grossMargin`,
  `summary.marginPercentage` y ratios del `order`) para que la reconciliación visual coincida
  con las cards superiores.
- Como `summary` no expone peso total, la columna `Cantidad` del footer se calcula sumando las
  filas visibles (`lineWeightKg` en productos y `totalWeightKg` en palets), sin cambiar ningún
  cálculo económico.
- El `CardTitle` ya estaba en la sub-escala acordada `text-lg font-medium`; se añadió comentario
  inline alineado con GAP-084 para dejar constancia de que es intencional.
- El KPI principal (`font-semibold`) queda pendiente de GAP-096 según la restricción del GAP; no
  se duplicó ese ajuste aquí.

### Desviaciones del plan (si las hay)

Ninguna.

### Checks ejecutados

- `npm run type-check` — OK.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx` — OK.
- `npm run lint` — OK con 0 errores y 269 warnings preexistentes en el repo.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx` — OK.
- `npx prettier --write src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx` —
  no ejecutable en este entorno: `npx` intentó usar una instalación temporal y no encontró
  `prettier-plugin-tailwindcss`; tampoco existe binario local en `node_modules/.bin/prettier`.
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
