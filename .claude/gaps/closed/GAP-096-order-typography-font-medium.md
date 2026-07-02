# GAP-096 — Normalizar `font-semibold` a `font-medium` en el editor de pedidos

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

`.claude/design-context.md` § Typography documenta una escala cerrada de combinaciones
tamaño/peso (`text-xl font-medium`, `text-base font-medium`, `text-sm font-medium`, etc.) —
`font-semibold` no aparece en ningún punto de esa escala. Sin embargo, el peso `font-semibold`
se repite de forma recurrente en 5 archivos del editor de pedidos, tanto para identificadores
primarios como para metadatos secundarios, lo que además debilita la jerarquía visual (el
identificador primario apenas se diferencia del resto):

- `OrderSummaryMobile.jsx:46` (`text-xl font-semibold`, nombre cliente — identificador
  primario) y `:105,110,117,141,147` (`text-lg font-semibold`, Fecha/Temperatura/Palets/
  Importe — metadatos secundarios, casi al mismo peso/tamaño que el identificador primario).
- `OrderDetails/index.tsx:106,283,289,316` — títulos de sección y sub-labels en la vista móvil.
- `OrderProductDetails/index.js:84,95,101,109,117,123,131` — nombre de producto (identificador
  primario) y cada métrica usan literalmente el mismo `text-sm font-semibold`, sin
  diferenciación de peso entre ambos.
- `OrderCostAnalysis/index.jsx:52-54` (`text-2xl font-semibold`/`text-xl font-semibold` en el
  KPI principal) y `:71,76,127,132` (nombres de producto/palet en acordeón móvil).
- `OrderLabels/index.js:243,297,316,324,424` — títulos de sección móvil y nombre de producto
  en tarjetas.

Jose ha decidido normalizar hacia el patrón ya documentado (`font-medium`) en vez de
documentar `font-semibold` como una sub-escala nueva.

## Solución acordada

En los 5 archivos listados, sustituir `font-semibold` por `font-medium` manteniendo el mismo
`text-{size}` en cada caso, salvo que al hacerlo la jerarquía entre identificador primario y
metadatos secundarios quede indistinguible — en ese caso, subir un escalón de tamaño al
identificador primario en vez de mantenerlo igual que sus metadatos (ej. si el nombre de
producto y sus métricas comparten hoy `text-sm font-semibold`, el nombre de producto pasa a
`text-base font-medium` — identificador primario — y las métricas quedan en
`text-sm font-medium` o `text-sm text-muted-foreground` según corresponda a su rol).

## Referencias e inspiración

- `.claude/design-context.md` § 2 Typography — escala documentada.
- `.claude/rules/components.md` — jerarquía de identificador primario vs metadatos.

## Criterios de aceptación

- [ ] Ningún uso de `font-semibold` permanece en los 5 archivos listados.
- [ ] En cada caso, el identificador primario (nombre de cliente/producto) se distingue
      visualmente (tamaño y/o peso) de los metadatos secundarios adyacentes.
- [ ] No se introduce ningún peso/tamaño fuera de la escala documentada en
      `design-context.md`.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderSummaryMobile.jsx`
- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.js`

## Restricciones

- Cambio puramente visual — no tocar lógica de datos, cálculos ni handlers.
- No mezclar con los cambios ya cubiertos por GAP-081/083/086/090 (quick fixes de esos mismos
  archivos) — si se implementan en el mismo PR, mantener los commits separados por GAP.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/components/OrderSummaryMobile.tsx`
- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`

### Decisiones tomadas durante la implementación

- Se sustituyó `font-semibold` por `font-medium` en los cinco archivos del alcance.
- En `OrderProductDetails`, los nombres de producto pasan a `text-base font-medium` y las
  métricas quedan en `text-sm font-medium`, manteniendo una diferencia visual entre
  identificador primario y metadatos.
- En `OrderCostAnalysis`, los identificadores móviles de producto/palet pasan a
  `text-base font-medium`, mientras los importes laterales quedan en `text-sm font-medium`.
- En `OrderLabels`, los nombres de producto de tarjetas móviles pasan a `text-base font-medium`;
  los títulos de sección quedan en `text-base font-medium`.
- En `OrderDetails`, el pequeño texto `EU` de la matrícula pasa de `text-[9px] font-semibold`
  a `text-xs font-medium`, evitando mantener un tamaño arbitrario junto al peso eliminado.

### Desviaciones del plan (si las hay)

Ninguna funcional. Los archivos `OrderSummaryMobile`, `OrderProductDetails` y `OrderLabels` ya
están migrados a `.tsx` en el árbol actual, así que se implementó sobre las rutas existentes.

### Checks ejecutados

- `rg "font-semibold" ...` sobre los cinco archivos del GAP — sin coincidencias.
- `npm run type-check` — OK.
- `npx eslint` sobre los cinco archivos del GAP — OK con 0 errores y 1 warning preexistente
  (`@next/next/no-img-element` en `OrderSummaryMobile.tsx`).
- `git diff --check -- ...` sobre los cinco archivos y el GAP — OK.

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
