# GAP-088 — Normalizar colores de badges de estado al patrón `/15` documentado

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** in-progress
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`.claude/design-context.md` § Status Colors documenta un patrón único y ya aceptado para
badges de estado inline: `bg-{color}-500/15 text-{color}-700 dark:text-{color}-300`. Tres
archivos del editor de pedidos no siguen este patrón, cada uno con un tratamiento distinto:

- `OrderProduction/index.tsx:97,101,314,318` — `<Badge variant="success" className="text-foreground-50 bg-green-500">` y `<Badge variant="warning" className="bg-orange-500">` — fondo sólido en vez de opacidad `/15`, y la lógica de color está duplicada verbatim entre la tarjeta móvil (97-101) y la celda de tabla desktop (314-318).
- `OrderCostAnalysis/index.jsx:441-445` — `variant="outline"` con `text-amber-700 dark:text-amber-300` pero sin el tratamiento de fondo `/15`.
- `OrderIncident/index.js:117-131,290-304` — `border-amber-500/50 bg-amber-50 text-amber-700` / `border-emerald-500/50 bg-emerald-50 text-emerald-700` (par opacidad `/50`+fondo `-50`, distinto del par `/15` documentado), y el bloque JSX está duplicado casi verbatim entre la vista móvil y la cabecera desktop.

## Solución acordada

Normalizar los 3 archivos al patrón documentado `bg-{color}-500/15 text-{color}-700
dark:text-{color}-300`, reutilizando el componente `StatusBadge`
(`src/components/Admin/OrdersManager/StatusBadge.tsx`) donde el estado representado coincida
con los colores que ya soporta (`green`/`orange`/`red`), o extendiendo `StatusBadge` con los
colores adicionales que falten (`amber`/`emerald`) si el estado no mapea a los 3 existentes.
De paso, consolidar la lógica de color duplicada (mobile/desktop) en cada archivo en una
única función o constante compartida dentro del propio archivo, ya que el propio hallazgo de
duplicación aumenta el riesgo de que una futura corrección de color solo se aplique en una de
las dos copias.

## Referencias e inspiración

- `.claude/design-context.md` § Status Colors y § Status Tokens.
- `src/components/Admin/OrdersManager/StatusBadge.tsx` — componente ya usado en el shell del
  editor (`OrderHeaderDesktop`, `OrderSummaryMobile`, `OrderStatusDropdown`) con el patrón
  correcto.

## Criterios de aceptación

- [ ] `OrderProduction/index.tsx` usa el patrón `/15` (vía `StatusBadge` o Badge con las clases
      correctas) en ambas ubicaciones (tarjeta móvil y celda desktop), sin duplicar la lógica
      de color.
- [ ] `OrderCostAnalysis/index.jsx:441-445` usa el mismo patrón `/15` con el tratamiento de
      fondo correspondiente.
- [ ] `OrderIncident/index.js` usa el patrón `/15` en ambas ubicaciones (móvil y desktop), sin
      duplicar el bloque JSX de color.
- [ ] Ningún estado visual (qué badge se muestra para qué status) cambia — solo el
      tratamiento de color.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderIncident/index.js`
- `src/components/Admin/OrdersManager/StatusBadge.tsx` (solo si hace falta extender colores)

## Restricciones

- No modificar la lógica de negocio que determina qué estado se muestra — solo el color.
- Si se extiende `StatusBadge`, mantener retrocompatibilidad con sus usos actuales en el shell.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/StatusBadge.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx`

### Decisiones tomadas durante la implementación

- Se extendió `StatusBadge` con colores `amber` y `emerald`, manteniendo `green`/`orange`/`red`
  y sus usos existentes.
- `StatusBadge` acepta ahora `children`; el comportamiento anterior con `label` se mantiene,
  lo que permite badges con icono en `OrderIncident` sin duplicar clases.
- `OrderProduction` reutiliza la función `ProductionStatusBadge` introducida en GAP-087:
  `success`, `difference` y `noPlanned` usan `StatusBadge` con patrón `/15`; `pending` conserva
  el `<Badge>` por defecto anterior para no introducir un cambio visual no solicitado.
- `OrderCostAnalysis` usa `StatusBadge color="amber"` para la alerta de recarga con incidencias.
- `OrderIncident` usa un único `IncidentStatusBadge` para la zona de contenido y la cabecera
  compacta, con `amber` para abierta y `emerald` para resuelta.

### Desviaciones del plan (si las hay)

- El GAP mencionaba `OrderProduction/index.js` y `OrderIncident/index.js`, pero ambos archivos
  ya están migrados a `.tsx`; se implementó sobre los archivos actuales.
- No se usó `StatusBadge` para el estado `pending` de producción porque el estado previo usaba
  el badge por defecto sin color específico y el criterio pide no cambiar qué estado visual se
  muestra para cada status.

### Checks ejecutados

- `npm run type-check` — OK.
- `npx eslint src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx src/components/Admin/OrdersManager/StatusBadge.tsx` — OK.
- `git diff --check -- src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx src/components/Admin/OrdersManager/StatusBadge.tsx` — OK.
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
