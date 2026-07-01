# GAP-061 — Migración JS→TSX batch del módulo orders manager

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Media
- **Estado:** open
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

## Solución acordada

Migración por lotes, en orden de complejidad creciente para minimizar errores en cascada:

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

- [ ] Todos los archivos listados existen como `.ts`/`.tsx` (sin contrapartida `.js`/`.jsx`)
- [ ] Ningún archivo migrado tiene `@ts-nocheck`
- [ ] `npm run type-check` pasa limpio tras cada lote
- [ ] `npm run lint` pasa sin warnings en los archivos migrados
- [ ] `src/components/Comercial/CRM/ComercialOrdersManager.tsx` existe y funciona

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
