# GAP-100 — Estandarizar copy de estados vacíos en el editor de pedidos

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy order editor`. El título de `EmptyState` para listas vacías usa tres patrones léxicos distintos para el mismo estado semántico (lista sin elementos) dentro del mismo editor de pedidos:

- **"No existen [X]"** — patrón mayoritario, usado en 5 secciones: `OrderAuxiliaryLines`, `OrderProduction`, `OrderPlannedProductDetails`, `OrderProductDetails`, `OrderPallets`.
- **"No hay [X]"** — usado solo en `OrderLabels` (2 sitios).
- **"Sin [X]"** — usado en `OrderCostAnalysis` (2 sitios) y `OrderAttachments` (1 sitio).

Jose confirmó mantener el patrón mayoritario **"No existen [X]"** como estándar (no se inventa un estilo nuevo, se defiende el ya dominante en el módulo).

Adicionalmente, la descripción del estado vacío de `OrderProductDetails/index.js:69` — *"No se ha producido actualmente nada para este pedido"* — tiene un orden de palabras poco natural en español (lee como traducción automática).

## Solución acordada

1. Convergir el título de `EmptyState` de `OrderLabels` y `OrderCostAnalysis`/`OrderAttachments` (donde aplique a listas, no a estados de error) al patrón **"No existen [X]"**.
2. Reescribir la descripción de `OrderProductDetails/index.js:69` a una redacción natural: **"Todavía no hay producción registrada para este pedido"**.

No se tocan los `EmptyState` de `OrderCostAnalysis` que representan un estado de **error/no disponible** (`"No se pudo cargar el análisis"`, `"Análisis no disponible"`) — esos no son el mismo caso semántico (lista vacía) y quedan fuera de este GAP.

## Referencias e inspiración

- Patrón mayoritario ya existente: `OrderAuxiliaryLines/index.tsx:334,549` — `"No existen líneas auxiliares"`.
- `design-context.md` § Empty States — Icon → title → description, sin fijar léxico; este GAP fija el léxico como aclaración institucional.

## Criterios de aceptación

- [ ] `OrderLabels/index.tsx` — título cambia de `"No hay grupos de etiquetas"` a `"No existen grupos de etiquetas"`.
- [ ] `OrderLabels/index.tsx` — título cambia de `"No hay cajas para mostrar"` a `"No existen cajas para mostrar"`.
- [ ] `OrderCostAnalysis/index.jsx:280` — título cambia de `"Sin líneas analíticas"` a `"No existen líneas analíticas"`.
- [ ] `OrderCostAnalysis/index.jsx:351` — título cambia de `"Sin palets analíticos"` a `"No existen palets analíticos"`.
- [ ] `OrderAttachments/index.tsx:628` — título cambia de `"Sin adjuntos"` a `"No existen adjuntos"`.
- [ ] `OrderProductDetails/index.tsx` — descripción cambia a `"Todavía no hay producción registrada para este pedido"`.
- [ ] Los `EmptyState` de error/no-disponible de `OrderCostAnalysis` (`"No se pudo cargar el análisis"`, `"Análisis no disponible"`) **no se modifican**.
- [ ] No se cambia ningún icono, prop `className` ni estructura de los `EmptyState` afectados — solo el texto de `title`/`description`.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx` (ocurrencias móvil/desktop)
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx` (líneas ~280, ~351)
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` (línea ~628)
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx` (ocurrencias móvil/desktop)

## Restricciones

- No tocar los `EmptyState` de tipo error/no-disponible en `OrderCostAnalysis` (`costAnalysisError`, `"Análisis no disponible"`).
- No modificar lógica de renderizado condicional, solo las cadenas de texto.
- No introducir una nueva entrada en `design-context.md` en este GAP — eso lo gestiona `system-learner` por separado.

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx`
- `.claude/gaps/in-progress/GAP-100-standardize-empty-state-copy-order-editor.md`

### Decisiones tomadas durante la implementación

- Se aplicó el patrón `"No existen [X]"` solo a estados vacíos de listas.
- Se conservaron sin cambios los estados de error/no-disponible de `OrderCostAnalysis`: `"No se pudo cargar el análisis"` y `"Análisis no disponible"`.
- En `OrderLabels/index.tsx` había cuatro ocurrencias por vistas móvil/desktop; se actualizaron todas para evitar divergencia de copy dentro del mismo componente.

### Desviaciones del plan (si las hay)

- Las rutas reales actuales son `.tsx` para `OrderLabels` y `OrderProductDetails`, no `.js`.
- Los archivos ya tenían cambios previos en el worktree; se conservaron y solo se tocaron las cadenas de texto de este GAP.

### Checks ejecutados

- `rg -n 'No hay grupos de etiquetas|No hay cajas para mostrar|Sin líneas analíticas|Sin palets analíticos|Sin adjuntos|No se ha producido actualmente nada|No existen grupos de etiquetas|No existen cajas para mostrar|No existen líneas analíticas|No existen palets analíticos|No existen adjuntos|Todavía no hay producción registrada|No se pudo cargar el análisis|Análisis no disponible' ...` — copies antiguos ausentes, copies nuevos presentes y estados excluidos de `OrderCostAnalysis` conservados.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx` — sin errores; mantiene 4 warnings preexistentes en `OrderAttachments/index.tsx` (`react-hooks/set-state-in-effect` y `react-hooks/static-components`) fuera del alcance de este GAP.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx .claude/gaps/in-progress/GAP-100-standardize-empty-state-copy-order-editor.md` — correcto.

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
