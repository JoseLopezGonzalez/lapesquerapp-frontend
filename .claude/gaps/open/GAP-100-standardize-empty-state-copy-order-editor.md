# GAP-100 — Estandarizar copy de estados vacíos en el editor de pedidos

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
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

- [ ] `OrderLabels/index.js:484` — título cambia de `"No hay grupos de etiquetas"` a `"No existen grupos de etiquetas"`.
- [ ] `OrderLabels/index.js:604` — título cambia de `"No hay cajas para mostrar"` a `"No existen cajas para mostrar"`.
- [ ] `OrderCostAnalysis/index.jsx:280` — título cambia de `"Sin líneas analíticas"` a `"No existen líneas analíticas"`.
- [ ] `OrderCostAnalysis/index.jsx:351` — título cambia de `"Sin palets analíticos"` a `"No existen palets analíticos"`.
- [ ] `OrderAttachments/index.tsx:628` — título cambia de `"Sin adjuntos"` a `"No existen adjuntos"`.
- [ ] `OrderProductDetails/index.js:69` (y su equivalente desktop en la línea 236 si aplica el mismo texto) — descripción cambia a `"Todavía no hay producción registrada para este pedido"`.
- [ ] Los `EmptyState` de error/no-disponible de `OrderCostAnalysis` (`"No se pudo cargar el análisis"`, `"Análisis no disponible"`) **no se modifican**.
- [ ] No se cambia ningún icono, prop `className` ni estructura de los `EmptyState` afectados — solo el texto de `title`/`description`.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderLabels/index.js` (líneas ~484, ~604)
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx` (líneas ~280, ~351)
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` (línea ~628)
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js` (líneas ~69, ~236)

## Restricciones

- No tocar los `EmptyState` de tipo error/no-disponible en `OrderCostAnalysis` (`costAnalysisError`, `"Análisis no disponible"`).
- No modificar lógica de renderizado condicional, solo las cadenas de texto.
- No introducir una nueva entrada en `design-context.md` en este GAP — eso lo gestiona `system-learner` por separado.

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
