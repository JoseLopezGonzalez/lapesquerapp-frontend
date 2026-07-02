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

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.tsx` — las 3 ramas de `getFallback` (customer-history, export/pallets, resto) sustituyen `<Loader />` por `<Skeleton>`, alineadas con el patrón `h-64 w-full rounded-lg` ya usado en `OrderTabsDesktop.tsx`.
- `src/components/Shared/CustomerOrderHistoryView/index.jsx` (nota: el archivo referenciado en el GAP como `OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx` fue movido a `src/components/Shared/CustomerOrderHistoryView/index.jsx` en una migración posterior a la fecha del GAP) — las 4 apariciones de `<Loader />` (carga inicial mobile/desktop, recarga por filtro mobile/desktop) sustituidas por dos sub-componentes locales nuevos:
  - `HistoryCardSkeleton` — silueta de `ProductHistoryMobileCard` (título + badges + grid de 4 métricas + 2 placeholders de gráfico `h-48`), usado en mobile.
  - `HistoryRowSkeleton` — silueta de `ProductHistoryAccordionItem` colapsado (título + badges a la izquierda, grid de métricas a la derecha), usado en desktop.

### Decisiones tomadas durante la implementación

- El archivo de destino real difiere del path del GAP (`Order/OrderCustomerHistory/components/CustomerOrderHistoryView/` → `Shared/CustomerOrderHistoryView/`); se confirmó por grep de `Loader` + `import CustomerOrderHistoryView` en `OrderCustomerHistory/index.js` antes de editar.
- En el `CardContent` desktop de la recarga por filtro, se quitó `loadingData` de la condición que centraba el contenido (`flex items-center justify-center`), ya que el skeleton de filas ahora ocupa el ancho igual que el contenido real (antes solo centraba un spinner).
- No se replicaron los 2 gráficos completos en `HistoryRowSkeleton` (versión desktop/accordion) porque el accordion está colapsado por defecto (`expandedItems` inicial `[]`) — solo la fila cabecera es visible sin interacción, así que el skeleton solo representa esa fila.

### Desviaciones del plan (si las hay)

Ninguna funcional; solo el path del archivo (ver arriba), sin cambio de alcance.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

Implementación limpia y fiel al patrón de referencia (`OrderTabsDesktop.tsx`), con skeletons
bien dimensionados contra los componentes reales que sustituyen. Resto 1 punto por dos
detalles menores no bloqueantes (ver Observaciones).

### Checklist

**Criterios de aceptación del GAP:**

- [x] `OrderSectionContentMobile` (`.tsx`, ver nota de path abajo) usa `Skeleton` — no `<Loader>` — en las 3 ramas de `getFallback` (customer-history, export/pallets, resto), con `h-64 w-full rounded-lg` idéntico al patrón de `OrderTabsDesktop.tsx:87` — CUMPLIDO
- [x] `CustomerOrderHistoryView/index.jsx` usa `Skeleton` — no `<Loader>` — tanto en carga inicial como en recarga por filtro, en las 4 ramas (mobile/desktop × inicial/recarga) — CUMPLIDO
- [x] Comportamiento funcional sin cambios — verificado por diff: solo se toca el fallback visual, ninguna condición de fetching/contexto — CUMPLIDO

**Checklist técnico del proyecto:**

- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos (el archivo tocado ya era `.jsx` preexistente; no se crea ningún `.js` nuevo)
- [x] Sin `any` sin justificación
- [x] Hooks gigantes no tocados
- [x] `entitiesConfig.js` no tocado
- [x] Patrones de `.claude/rules/components.md` respetados (sub-componentes locales `HistoryCardSkeleton`/`HistoryRowSkeleton` definidos fuera del render, siguiendo el patrón de `CustomerTableSkeleton` documentado en la regla)
- [x] Nomenclatura correcta (PascalCase para los sub-componentes skeleton)
- [x] `OrderTabsDesktop.tsx` no modificado (restricción explícita del GAP) — confirmado por `git diff`, sin cambios
- [x] `npm run type-check` — limpio, exit 0, sin errores
- [x] `npm run lint` — exit 0, 271 warnings preexistentes (0 en los archivos de este GAP salvo un warning de `ShowMoreButton` creado en render, que ya existía antes del diff — no introducido por esta implementación)

### Verificación independiente de la desviación de path documentada

La sección "Implementación" del GAP afirma que `.../Order/OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx`
fue movido a `src/components/Shared/CustomerOrderHistoryView/index.jsx`. Verificado:

- El path antiguo no existe (`ls` → No such file or directory).
- `git log --follow` sobre el path nuevo muestra el historial completo del componente (commits `c9e79407`, `3abae366`), consistente con una migración real, no un archivo nuevo sin relación.
- Los dos únicos importadores activos (`OrderCustomerHistory/index.js` y `CustomerOrderHistoryView/index.jsx` (`Comercial/CRM/CustomersPageClient.jsx`) apuntan al path nuevo (`@/components/Shared/CustomerOrderHistoryView`) — sin referencias rotas al path viejo.

La documentación del GAP es precisa.

### Observaciones para Jose

1. **No bloqueante** — `src/components/Shared/CustomerOrderHistoryView/index.jsx:213` (`ShowMoreButton`) sigue siendo un componente definido dentro del render (warning de `react-hooks` sobre "Cannot create components during render"). Es deuda preexistente, no introducida por este GAP (confirmado: la línea no aparece en el diff), pero como el archivo ya está abierto y con contexto fresco, podría resolverse en un GAP de limpieza rápida moviendo `ShowMoreButton` fuera del componente principal (mismo patrón que `HistoryCardSkeleton`/`HistoryRowSkeleton`, que sí están correctamente declarados fuera).
2. **No bloqueante** — El archivo usa `useIsMobile` (línea 12) en vez de `useIsMobileSafe`, que es el hook recomendado por `design-context.md` (regla "Never use `useMediaQuery` — always `useIsMobileSafe`"). También preexistente y fuera del alcance de este GAP (no tocado en el diff), pero merece un GAP propio si hay problemas de hydration mismatch en este componente.
3. **Fidelidad de skeleton correcta**: `HistoryCardSkeleton` replica título + 2 badges + grid de 4 métricas + 2 gráficos `h-48` de `ProductHistoryMobileCard`; `HistoryRowSkeleton` replica la fila colapsada de `ProductHistoryAccordionItem` (título + badges a la izquierda, grid de 4 métricas oculto en mobile vía `hidden md:grid`, coherente con el comportamiento real del accordion colapsado). Buena decisión no simular el contenido expandido del accordion, ya que `expandedItems` inicial es `[]`.
4. El `Suspense` fallback de `OrderSectionContentMobile.tsx` para `customer-history` usa `h-24` (más bajo que las otras 2 ramas en `h-64`) — es una diferencia intencional y razonable dado que ese fallback se ve brevemente antes de que el propio `CustomerOrderHistoryView` renderice su Skeleton más detallado; no es un problema de paridad.

### UX REVIEW — LIGHT

```
GAP: GAP-078 — Loader → Skeleton parity, editor de pedidos
Mode: Light (cambio visual de loading state, restaura patrón existente)

[x] El cambio es autoexplicativo — el usuario ve una silueta de contenido en vez de un spinner+texto, sin necesidad de instrucción
[x] No introduce ninguna decisión nueva del usuario
[x] Consistente con la UI circundante — mismo patrón Skeleton que el resto de la app (h-64 w-full rounded-lg en mobile tabs, siluetas dimensionadas en el histórico)
[x] No aplica hover/focus/active — los Skeleton no son interactivos
[x] No hay cambio de texto/copy

VERDICT: ✅ APROBADO
```

### System Learner check

No se invoca. Los hallazgos (uso de `<Loader>` fuera de contexto de sesión/auth) ya estaban
cubiertos por la regla existente en `design-context.md` § Loading States § Exception —
`<Loader>`, y el propio GAP-078 nace de esa regla. Las dos observaciones no bloqueantes
(`ShowMoreButton` creado en render, `useIsMobile` vs `useIsMobileSafe`) son deuda preexistente
ya cubierta por reglas ya documentadas (`components.md`, `design-context.md`), no patrones
nuevos que requieran una entrada nueva en `project-learnings.md`.

### Estado final de la implementación

`OrderSectionContentMobile.tsx` (nota: el GAP original referenciaba `.jsx`; el archivo fue
migrado a `.tsx` en un commit posterior a la fecha del GAP — confirmado, ver sección de
verificación arriba) reemplaza `<Loader />` por `<Skeleton className="h-64 w-full rounded-lg" />`
(y `h-24` para el fallback de customer-history) en las 3 ramas de `getFallback`, alineado con
`OrderTabsDesktop.tsx` que no fue tocado. `CustomerOrderHistoryView/index.jsx` (movido de
`Order/OrderCustomerHistory/components/` a `Shared/`, confirmado por git log e imports activos)
reemplaza las 4 apariciones de `<Loader />` por dos sub-componentes skeleton nuevos,
`HistoryCardSkeleton` y `HistoryRowSkeleton`, dimensionados con fidelidad razonable contra
`ProductHistoryMobileCard` y `ProductHistoryAccordionItem` respectivamente. `type-check` y
`lint` limpios de forma independiente (271 warnings preexistentes no relacionados, 0 errores).
