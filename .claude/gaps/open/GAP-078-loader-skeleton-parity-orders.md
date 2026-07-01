# GAP-078 — Sustituir `<Loader>` por `Skeleton` en carga de datos del editor de pedidos

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

El componente `<Loader>` (`src/components/Utilities/Loader/index.js`) está documentado en
`.claude/design-context.md` como aceptable **solo** para estados de carga de sesión/auth de
página completa — nunca como reemplazo de `Skeleton` para carga de datos. Este anti-patrón
aparece en dos sitios del editor de pedidos:

1. `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.jsx:10-30`
   — el fallback de `Suspense` para las secciones lazy en móvil (pallets, export,
   customer-history, y el resto por defecto) usa `<Loader />`. El equivalente desktop para
   las mismas secciones (`OrderTabsDesktop.jsx:79-84`) usa correctamente
   `<Skeleton className="h-64 w-full rounded-lg" />` — hay una divergencia directa entre
   mobile y desktop para el mismo dato.
2. `src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx:51,62`
   (carga inicial) y `:196-198,241-242` (recarga al filtrar por rango) — mismo anti-patrón,
   dos veces en el mismo archivo.

## Solución acordada

Sustituir `<Loader />` por un `Skeleton` con la forma del contenido que reemplaza, siguiendo
el patrón ya usado en `OrderTabsDesktop.jsx:79-84` para el caso (1), y un patrón de skeleton
de tarjetas/acordeón para el caso (2) (mirar `ProductHistoryAccordionItem`/
`ProductHistoryMobileCard` para dimensionar el skeleton correctamente).

## Referencias e inspiración

- `OrderTabsDesktop.jsx:79-84` — mismo Suspense fallback, ya usa `Skeleton` correctamente.
- `.claude/design-context.md` § Loading States — regla y excepción del `<Loader>`.

## Criterios de aceptación

- [ ] `OrderSectionContentMobile.jsx` usa `Skeleton` (no `<Loader>`) como fallback de
      `Suspense` para todas las secciones lazy, con una forma coherente por sección.
- [ ] `CustomerOrderHistoryView/index.jsx` usa `Skeleton` (no `<Loader>`) tanto en la carga
      inicial como en la recarga al cambiar el filtro de rango.
- [ ] El comportamiento funcional (qué se carga, cuándo) no cambia — solo el componente visual
      de loading.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.jsx`
- `src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx`

## Restricciones

- No tocar la lógica de fetching/contexto — solo el estado visual de loading.
- No modificar `OrderTabsDesktop.jsx` (ya es la referencia correcta).

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
