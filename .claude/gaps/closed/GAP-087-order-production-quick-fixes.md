# GAP-087 — OrderProduction: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas / Maquiladores
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx` (350
líneas), detectados en modo heurístico:

1. **Color de badge de estado** — ver GAP-088 (normalización cruzada de 3 archivos), no
   duplicar aquí.
2. **`CardTitle` en `text-lg font-medium`** (línea 232) — mismo criterio acordado en
   GAP-084/086.
3. **Lógica de badge duplicada** — el bloque condicional de 4 ramas para determinar el color/
   label del badge de estado está repetido verbatim entre la tarjeta móvil (líneas 96-108) y
   la celda de tabla desktop (líneas 313-325) — extraer a una función/constante compartida
   dentro del propio archivo (relevante especialmente porque GAP-088 ya requiere tocar ambas
   copias).
4. **Archivo legacy `.js` con lógica de componente** — no se migra a `.tsx` en este GAP (fuera
   de alcance), solo se deja constancia de que cualquier futura migración deberá arrastrar
   también el fix de badges (GAP-088) y la consolidación de este punto 3.

## Solución acordada

- Extraer la lógica de color/label del badge de estado (las 4 ramas condicionales) a una única
  función u objeto de mapeo dentro del archivo, usado tanto por la tarjeta móvil como por la
  celda desktop. Aplicar esto en el mismo cambio que GAP-088 para evitar tocar el archivo dos
  veces por el mismo motivo.
- Aplicar el criterio de `CardTitle` acordado en GAP-084/086.

## Referencias e inspiración

- GAP-088 — normalización de color de badges (dependencia).

## Criterios de aceptación

- [ ] La lógica de color/label de estado existe en un único lugar del archivo, consumida por
      ambas variantes (móvil y desktop).
- [ ] `CardTitle` usa el mismo tamaño acordado para `OrderAuxiliaryLines`/`OrderCostAnalysis`.
- [ ] Ningún dato de producción ni cálculo de discrepancia cambia.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx`

## Restricciones

- No migrar el archivo de `.js` a `.tsx` en este GAP — fuera de alcance.
- Coordinar con GAP-088 si se implementan en el mismo PR (mismo archivo).

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx`

### Decisiones tomadas durante la implementación

- Se añadió `productionStatusBadgeConfig` y `ProductionStatusBadge` dentro del mismo archivo para
  que móvil y desktop consuman una única fuente de label/variant/className.
- Se mantuvieron exactamente los textos, variantes y clases previas de los badges; la
  normalización cromática queda para GAP-088 según restricción del GAP.
- El `CardTitle` ya usaba `text-lg font-medium`; se añadió comentario inline alineado con
  GAP-084/GAP-086 para documentar que la sub-escala es intencional.

### Desviaciones del plan (si las hay)

- El GAP mencionaba `OrderProduction/index.js`, pero el archivo ya estaba migrado a
  `OrderProduction/index.tsx` por GAP-061. Se implementó sobre el `.tsx` actual.
- No se aplicó el cambio de color de GAP-088 para mantener este GAP centrado en deduplicación y
  criterio de `CardTitle`.

### Checks ejecutados

- `npm run type-check` — OK.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx` — OK.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx .claude/gaps/in-progress/GAP-087-order-production-quick-fixes.md` — OK.
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
