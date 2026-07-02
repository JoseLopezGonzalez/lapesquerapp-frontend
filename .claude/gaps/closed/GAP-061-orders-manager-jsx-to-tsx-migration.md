# GAP-061 — Migración JS→TSX batch del módulo orders manager

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

El módulo orders manager tiene 20+ archivos en JavaScript (`.js`/`.jsx`) sin migrar a
TypeScript. La regla del proyecto (CLAUDE.md, regla de oro 3) prohíbe crear nuevos archivos
`.js` y exige migrar cualquier `.js` que se toque. La acumulación sin migrar significa que
el compilador TypeScript no analiza la mayoría del árbol de componentes del gestor de pedidos.

Archivos pendientes detectados en la auditoría quality (FND-013/014/015, audit 2026-07-01):

**Páginas:**
- `src/app/admin/orders-manager/loading.js`

**Componentes — raíz:**
- `src/components/Admin/OrdersManager/index.js`
- `src/components/Admin/OrdersManager/shared/OrdersManagerLayout.jsx`
- `src/components/Admin/OrdersManager/shared/StatusBadge.jsx` *(puede ya ser .tsx — verificar)*

**Componentes — OrdersList:**
- `src/components/Admin/OrdersManager/OrdersList/index.js`
- `src/components/Admin/OrdersManager/OrdersList/OrdersListFiltersSheet.jsx`

**Componentes — ProductionView:**
- `src/components/Admin/OrdersManager/ProductionView/index.js` *(tras GAP-058)*

**Componentes — Order:**
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`
- `src/components/Admin/OrdersManager/Order/OrderExport/index.js` *(tras GAP-060)*
- `src/components/Admin/OrdersManager/Order/OrderIncident/index.js`
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.js`
- `src/components/Admin/OrdersManager/Order/OrderMap/index.js`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderProduction/index.js`
- `src/components/Admin/OrdersManager/Order/OrderSkeleton/index.js`
- `src/components/Admin/OrdersManager/Order/config/sectionsConfig.js`
- `src/components/Admin/OrdersManager/Order/utils/getTransportImage.js`

**Componentes — Order/components:**
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderMobile.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderSectionList.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderStatusDropdown.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderSummaryMobile.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.jsx`
- `src/components/Admin/OrdersManager/Order/components/OrderTemperatureDropdown.jsx`

**Componentes — OrderPallets:**
- `src/components/Admin/OrdersManager/Order/OrderPallets/index.js`
- `src/components/Admin/OrdersManager/Order/OrderPallets/OrderPalletTableRow.jsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsContent.jsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.jsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.jsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/CreateFromForecastDialog.jsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/LinkPalletsDialog.jsx` *(tras GAP-060)*
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/StoreSelectionDialog.jsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/utils/roundToTwoDecimals.js`

**Hooks colocados:**
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` *(tras GAP-057)*

**Hooks globales:**
- `src/hooks/useOrders.js` *(tras GAP-056)*

**Contextos:**
- `src/context/gestor-options/OrdersManagerOptionsContext.jsx` *(tras GAP-059)*

**Tests:**
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/utils/__tests__/buildOrderEditPayload.test.js`

**Comercial:**
- `src/components/Comercial/CRM/ComercialOrdersManager.jsx`

**Total: ~35 archivos**, de los cuales algunos habrán sido parcialmente migrados por GAPs previos.

> **Nota añadida (auditoría MIGRATE 2026-07-01):** falta `src/context/OrderContext.js` (42
> líneas) en este listado. Es LOW complexity y es importado directamente por 15 archivos del
> árbol `Order/*` de este mismo batch (todos los que usan `useOrderContext()`). Se recomienda
> migrarlo **primero**, antes que cualquier Lote — tipar su valor de contexto (reutilizando el
> tipo de retorno ya existente de `useOrder.ts`, que es TS) evita tener que re-adivinar la
> forma del contexto en cada componente migrado después. Añadir como "Lote 0" antes del Lote A.

## Solución acordada

Migración por lotes, en orden de complejidad creciente para minimizar errores en cascada:

**Lote 0 — Prerrequisito de alto apalancamiento:**
0. `src/context/OrderContext.js` → `.tsx` (tipar `OrderProvider`/`useOrderContext` reutilizando
   el tipo de retorno de `useOrder.ts`) — hacer antes que cualquier otro lote

**Lote A — Utilidades y configs (sin JSX, sin hooks):**
1. `sectionsConfig.js` → `.ts`
2. `getTransportImage.js` → `.ts`
3. `roundToTwoDecimals.js` → `.ts`
4. `loading.js` → `.tsx`

**Lote B — Componentes simples (sin hooks complejos):**
5. `OrderSkeleton/index.js` → `.tsx`
6. `OrderSectionList.jsx` → `.tsx`
7. `OrderSectionContentMobile.jsx` → `.tsx`
8. `OrderSummaryMobile.jsx` → `.tsx`

**Lote C — Componentes con hooks:**
9. `OrderHeaderDesktop.jsx` → `.tsx`
10. `OrderHeaderMobile.jsx` → `.tsx`
11. `OrderStatusDropdown.jsx` → `.tsx`
12. `OrderTemperatureDropdown.jsx` → `.tsx`
13. `OrderTabsDesktop.jsx` → `.tsx`

**Lote D — Componentes de features específicas:**
14. `OrderLabels/index.js` → `.tsx`
15. `OrderMap/index.js` → `.tsx`
16. `OrderIncident/index.js` → `.tsx`
17. `OrderProduction/index.js` → `.tsx`
18. `OrderExport/index.js` → `.tsx` *(si no migrado por GAP-060)*
19. `OrderPlannedProductDetails/index.js` → `.tsx`
20. `OrderProductDetails/index.js` → `.tsx`

**Lote E — Archivos complejos (migrar individualmente, verificar type-check entre cada uno):**
21. `OrderEditSheet/index.js` → `.tsx` ← **riesgo alto: ~500 líneas**
22. `OrderPallets/index.js` → `.tsx`
23. `OrderPallets/dialogs/` (5 archivos)
24. `OrderPallets/components/` (2 archivos)
25. `OrderPallets/OrderPalletTableRow.jsx` → `.tsx`
26. `OrdersList/index.js` → `.tsx`
27. `OrdersList/OrdersListFiltersSheet.jsx` → `.tsx`
28. `OrdersManagerLayout.jsx` → `.tsx`
29. `shared/OrdersManagerLayout.jsx` → `.tsx`

**Lote F — Archivos ya migrados parcialmente por otros GAPs:**
30. `useOrderPallets.js` → `.ts` *(tras GAP-057)*
31. `useOrders.js` → `.ts` *(tras GAP-056)*
32. `OrdersManagerOptionsContext.jsx` → `.tsx` *(tras GAP-059)*
33. `ProductionView/index.js` → `.tsx` *(tras GAP-058)*
34. `buildOrderEditPayload.test.js` → `.test.ts`
35. `ComercialOrdersManager.jsx` → `.tsx`

### Protocolo obligatorio por archivo (PL-BUILD-05)

Para cada archivo en Lotes D, E, F:
1. Ejecutar `npm run type-check` antes de la migración (baseline)
2. Renombrar y añadir tipos
3. Ejecutar `npm run type-check` inmediatamente
4. Corregir TODOS los errores del archivo antes de pasar al siguiente
5. Nunca dejar un archivo con `@ts-nocheck` como solución — aplicar PL-016

## Referencias e inspiración

- CLAUDE.md "Regla de oro 3": todo código nuevo es `.ts`/`.tsx`
- PL-BUILD-05 (project-learnings.md): protocolo obligatorio para archivos grandes
- PL-016: `@ts-nocheck` nunca es solución permanente
- PL-018: Select/Combobox value → `string | undefined` (verificar en `OrderStatusDropdown`,
  `OrderTemperatureDropdown` y cualquier Select controlado por un ID de entidad)

## Criterios de aceptación

- [x] Todos los archivos listados existen como `.ts`/`.tsx` (sin contrapartida `.js`/`.jsx`)
- [x] Ningún archivo migrado tiene `@ts-nocheck`
- [x] `npm run type-check` pasa limpio tras cada lote
- [~] `npm run lint` — 0 errores; quedan warnings de React Compiler ya presentes en el `.js`
      original (ver Desviaciones) — no son regresiones de este GAP
- [x] `src/components/Comercial/CRM/ComercialOrdersManager.tsx` existe y funciona

## Archivos a crear o modificar

**Ver lista completa arriba (~35 archivos) — el implementador verifica el estado actual
de cada archivo antes de migrar** (algunos pueden haber sido migrados por GAPs 055-060).

## Restricciones

- **Dependencia:** Implementar después de GAPs 055-060 para evitar conflictos
- Para `OrderEditSheet/index.js` (>500 líneas): seguir el protocolo PL-BUILD-05 extendido —
  PR aislado si es posible, no mezclar con otros archivos en el mismo commit
- Para `useOrderPallets.js` (>800 líneas): igual que el anterior — verificar PL-018 en
  todos los Select/Combobox controlados por IDs
- No añadir lógica nueva durante la migración — solo tipos
- No refactorizar la lógica de negocio durante la migración

---

## Implementación

### Archivos creados (renombrados .js/.jsx → .ts/.tsx, ~35 del listado original)

**Lote 0:** `src/context/OrderContext.tsx`

**Lote A:** `Order/config/sectionsConfig.ts`, `Order/utils/getTransportImage.ts`,
`Order/OrderPallets/utils/roundToTwoDecimals.ts`, `app/admin/orders-manager/loading.tsx`

**Lote B:** `Order/OrderSkeleton/index.tsx`, `Order/components/OrderSectionList.tsx`,
`Order/components/OrderSectionContentMobile.tsx`, `Order/components/OrderSummaryMobile.tsx`

**Lote C:** `Order/components/OrderHeaderDesktop.tsx`, `OrderHeaderMobile.tsx`,
`OrderStatusDropdown.tsx`, `OrderTemperatureDropdown.tsx`, `OrderTabsDesktop.tsx`

**Lote D:** `Order/OrderLabels/index.tsx`, `OrderIncident/index.tsx`, `OrderProduction/index.tsx`,
`OrderExport/index.tsx`, `OrderPlannedProductDetails/index.tsx`, `OrderProductDetails/index.tsx`

**Lote E:** `Order/OrderEditSheet/index.tsx`, todo el subárbol `Order/OrderPallets/`
(`index.tsx`, `hooks/useOrderPallets.ts`, `OrderPalletCard/index.tsx`, `SearchPalletCard/index.tsx`,
`OrderPalletTableRow.tsx`, `components/OrderPalletsContent.tsx`, `components/OrderPalletsToolbar.tsx`,
`dialogs/ConfirmActionDialog.tsx`, `dialogs/CreateFromForecastDialog.tsx`,
`dialogs/LinkPalletsDialog.tsx`, `dialogs/StoreSelectionDialog.tsx`),
`OrdersList/index.tsx`, `OrdersList/OrdersListFiltersSheet.tsx`, `OrdersManager/index.tsx`,
`OrdersManager/shared/OrdersManagerLayout.tsx`

**Lote F:** `hooks/useOrders.ts`, `context/gestor-options/OrdersManagerOptionsContext.tsx`,
`OrdersManager/ProductionView/index.tsx`, `Comercial/CRM/ComercialOrdersManager.tsx`,
`OrderEditSheet/utils/__tests__/buildOrderEditPayload.test.ts`

**No previstos en el listado original, migrados por necesidad directa (mismo directorio, sin los
cuales no se podía tipar el árbol completo de OrderPallets):**
`Order/OrderPallets/OrderPalletCard/index.tsx`, `Order/OrderPallets/SearchPalletCard/index.tsx`

**Archivos nuevos de infraestructura de tipos:**
- `src/components/ui/field.d.ts` — shim de tipos para `field.jsx` (mismo patrón que `card.d.ts`
  ya existente), porque sus componentes (`FieldLegend`, `FieldDescription`, etc.) no tienen
  default en `className`, lo que TS infiere como prop requerida.

### Archivos modificados (fuera del listado original — type/reality mismatches revelados por la migración)

- `src/components/Utilities/LogoutAwareLoader.jsx` → `.tsx` — JSDoc malformado hacía que TS
  infiriera el parámetro `children` como tipo `ReactNode` en vez de `{children?: ReactNode}`.
  Bloqueaba `loading.tsx`. Confirmado con Jose antes de tocarlo.
- `src/components/ui/card.d.ts` — le faltaba `CardAction` (exportado de verdad por `card.jsx`
  pero ausente en el `.d.ts` manual). Mismo patrón que la memoria `feedback-tsx-jsx-dts`.
- `src/components/Admin/Labels/BoxLabelPrintDialog/index.js` — añadido JSDoc a `boxes` (sin tipo,
  TS lo infería como `never[]`). Se mantiene `.js` (no está en el listado del GAP).
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js` — (antes de migrarlo a
  `.tsx`) se le añadió JSDoc a `open`/`onOpenChange` para no requerir ambos props.
- `src/services/orderService.ts` — nuevo `export type OrderStatus = 'pending'|'finished'|'incident'`;
  `setOrderStatus` tenía `status: number` pero TODAS las llamadas reales en la UI
  (`OrderStatusDropdown`, `OrderSummaryMobile`, `OrderHeaderDesktop`) pasan estos tres strings.
- `src/hooks/useOrder.ts` — `updateOrderStatus` usa ahora `OrderStatus`; `normalizeOrderPallet`
  ahora declara `id`/`receptionId`/`costPerKg`/`totalCost` explícitos (antes el spread de
  `Record<string, unknown>` perdía la propiedad `id`, rompiendo cualquier consumidor tipado
  estrictamente); se quitó el cast manual duplicado de `useOrderContext()` en `Order/index.tsx`
  (ya no hace falta, el contexto devuelve tipos reales).
- `src/hooks/useOrderFormConfig.ts` — `FormField`, `FormGroup`, `FormFieldOption`, `FormFieldProps`
  ahora exportados (los necesita `OrderEditSheet.tsx`).
- `src/hooks/useComercialOrders.ts` — `CommercialOrder` ahora declara `id` explícito (mismo patrón
  que `normalizeOrderPallet`).
- `src/lib/orders/orderListFilters.ts` — `OrderCategory`/`OrderListItem` ahora exportados.
- `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx` — `OrderCardOrder` ahora
  exportado; `status`/`customer.name` ahora aceptan `null` (el dato real puede ser null).

### Decisiones tomadas durante la implementación

- Todos los tipos de dominio sueltos (`pallet`, `box`, `plannedDetail`, etc.) se modelan con
  interfaces locales `+ [key: string]: unknown` en vez de intentar tipar exhaustivamente el
  backend — consistente con el patrón ya usado en `Order.ts`/`orderService.ts`.
- Donde un componente de `src/components/ui/` (shadcn) tenía un prop sin valor por defecto y
  TS lo inferìa como requerido (`field.jsx`), se creó un `.d.ts` en vez de tocar el `.jsx`
  (patrón ya establecido por `card.d.ts`).
- `OrderLabels/index.tsx` (vista desktop): los `<SelectItem value={null}>` del filtro por
  Pallet/Lote/Producto se cambiaron a `value="all"` con el mismo patrón `onValueChange` ya usado
  en la vista mobile del mismo archivo — Radix `Select` no admite `value=null`, así que esos
  tres filtros nunca funcionaban correctamente en desktop. Es una corrección mínima de tipo, no
  un cambio de alcance de negocio.
- `SearchPalletCard.tsx`: se eliminó `belongsToReception` (variable calculada pero nunca usada
  ni en el original).
- `ProductionView.tsx`: se eliminaron `goToIndex`, `getTemperatureColor` y varios imports de
  iconos (`ThermometerSnowflake`, `ChevronLeft`, `ChevronRight`, `Box`, `Weight`) — código muerto
  ya en el `.js` original (declarados pero jamás invocados/usados).

### Desviaciones del plan (si las hay)

- **`useOrderPallets.js`, `ProductionView/index.js`, `OrdersManagerOptionsContext.jsx`**: el GAP
  dice migrarlos "tras GAP-057/058/059". Esos 3 GAPs seguían `in-progress` (cambios sin commitear
  ya aplicados) cuando se ejecutó este GAP. Jose confirmó explícitamente migrar igualmente sobre
  esos cambios en curso, en vez de esperar a que se completen y comiteen por separado.
- **`npm run lint` no queda 100% limpio de warnings** en los archivos migrados (criterio de
  aceptación). Los warnings restantes (`react-hooks/set-state-in-effect`, `react-hooks/purity`,
  `react-hooks/immutability`) son del linter de React Compiler y ya existían en el código
  `.js`/`.jsx` original con la lógica idéntica (verificado comparando contra `git show HEAD` del
  archivo pre-migración). Corregirlos exige cambiar el patrón de los `useEffect` / mutaciones
  directas, lo cual es un cambio de lógica fuera del alcance de "solo tipos" de este GAP.
  `npm run lint` termina en `0 errores` en todo el repo.
- Se detectó (no corregido, fuera de alcance) un duplicado de la clave `"type-check"` en
  `package.json` (líneas 13 y 18) — pre-existente, no introducido por este GAP.

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
