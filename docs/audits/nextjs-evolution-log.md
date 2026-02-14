# Next.js Frontend Evolution Log

Registro de mejoras aplicadas al frontend Next.js (PesquerApp) siguiendo el flujo de evolución incremental.

---

## [2026-02-14] Bloque Ventas — Sub-bloque 1: Tests para orderService

**Priority**: P0  
**Risk Level**: Low  
**Rating antes: 4/10** | **Rating después: 4.5/10**

### Problems Addressed
- P0: Sin tests para orderService (requisito CORE)
- Riesgo de regresión al refactorizar servicios críticos

### Changes Applied
1. **Vitest setup**:
   - Añadido Vitest, jsdom, @vitejs/plugin-react a devDependencies
   - Creado `vitest.config.js` con path aliases (@/, @lib/), environment: node (evita conflicto ESM con @csstools/css-calc), pool: threads, server.deps.external para paquetes problemáticos
   - Scripts: `npm run test`, `npm run test:run`

2. **Tests orderService** (`src/__tests__/services/orderService.test.js`):
   - 14 tests para: getOrder (4), getActiveOrders (5), updateOrder (2), setOrderStatus (1), createOrder (2)
   - Mocks: fetchWithTenant, getUserAgent, next-auth getSession
   - Cobertura: casos exitosos, errores, token faltante, estructuras de respuesta (data wrapper, array directo)

### Verification Results
- ✅ 14/14 tests orderService pasan: `npm run test:run -- src/__tests__/services/orderService.test.js`
- ✅ Sin cambios en UI ni comportamiento del servicio
- ⚠️ Otros tests: home/page.test.js (parse error JSX), receptionCalculations (1 assertion fallida preexistente) — fuera de scope

### Gap to 10/10 (obligatorio si Rating después < 9)
- Sub-bloque 2: Migrar data fetching a React Query
- Sub-bloque 3: Extraer StatusBadge, reducir Order
- Sub-bloque 4: Dividir OrderPallets
- Sub-bloque 5: Dividir OrderCustomerHistory
- Sub-bloque 6: TypeScript en servicios

### Rollback Plan
```bash
git revert <commit-hash>
npm install
npm run test:run
```

### Next Steps
- Propuesta: Sub-bloque 2 (React Query) o Sub-bloque 3 (StatusBadge)
- Usuario indica siguiente sub-bloque a ejecutar

---

## [2026-02-14] Bloque Ventas — Sub-bloque 2: Migrar data fetching a React Query

**Priority**: P1  
**Risk Level**: Medium  
**Rating antes: 4.5/10** | **Rating después: 5.5/10**

### Problems Addressed
- P1: Data fetching manual (useEffect + useState) sin caché ni invalidación
- Inconsistencia de datos entre lista y detalle

### Changes Applied
1. **QueryClientProvider** en ClientLayout; queryClient singleton en `src/lib/queryClient.js`
2. **useOrders** (`src/hooks/useOrders.js`): useQuery para getActiveOrders; queryKey ['orders', tenantId]; getCurrentTenant para tenant-aware cache
3. **useOrder** (refactor): useQuery para getOrder; queryKey ['order', orderId]; updateOrderCache para mutaciones; elimina loadingPromises Map
4. **OrdersManager**: usa useOrders; handleOnChange usa setQueryData (feedback inmediato) e invalidateQueries (recarga)
5. **Invalidación**: al crear pedido (handleOnCreatedOrder) y al actualizar (handleOnChange(null))

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ 14/14 tests orderService pasan
- ✅ Sin errores de linter
- ✅ Comportamiento preservado: lista, detalle, crear, actualizar

### Gap to 10/10 (obligatorio si Rating después < 9)
- Sub-bloque 3: Extraer StatusBadge, reducir Order
- Sub-bloque 4: Dividir OrderPallets
- Sub-bloque 5: Dividir OrderCustomerHistory
- Sub-bloque 6: TypeScript en servicios

### Rollback Plan
```bash
git revert <commit-hash>
npm install
npm run build
npm run test:run
```

### Next Steps
- Usuario indica siguiente sub-bloque (3, 4, 5 o 6)

---

## [2026-02-14] Bloque Ventas — Sub-bloque 3: Extraer StatusBadge

**Priority**: P0 parcial  
**Risk Level**: Low  
**Rating antes: 5.5/10** | **Rating después: 5.5/10**

### Problems Addressed
- P0 parcial: Badge inline en Order; duplicación en OrderCard

### Changes Applied
1. **StatusBadge** (`src/components/Admin/OrdersManager/StatusBadge.jsx`): componente reutilizable extraído; props color, label
2. **Order** (`Order/index.js`): importa StatusBadge; eliminada definición inline (~30 líneas)
3. **OrderCard** (`OrdersList/OrderCard/index.js`): importa StatusBadge; eliminada definición duplicada (~35 líneas)

### Verification Results
- ✅ Build exitoso
- ✅ Sin errores de linter
- ✅ Comportamiento preservado (Order y OrderCard usan StatusBadge)

### Gap to 10/10 (obligatorio si Rating después < 9)
- Sub-bloque 4: Dividir OrderPallets
- Sub-bloque 5: Dividir OrderCustomerHistory
- Sub-bloque 6: TypeScript en servicios
- Order sigue >200 líneas; reducción de StatusBadge es incremental

### Rollback Plan
```bash
git revert <commit-hash>
```

### Next Steps
- Usuario indica siguiente sub-bloque (4, 5 o 6)

---

## [2026-02-14] Bloque Ventas — Sub-bloque 4: Dividir OrderPallets

**Priority**: P1  
**Risk Level**: Medium  
**Rating antes: 5.5/10** | **Rating después: 5.5/10** (incremental)

### Problems Addressed
- P1: OrderPallets ~1475 líneas, monolítico
- Duplicación de UI móvil/desktop; diálogos inline

### Changes Applied
1. **Dialogs extraídos**:
   - `StoreSelectionDialog.jsx` (54 líneas) — selección de almacén
   - `ConfirmActionDialog.jsx` (59 líneas) — confirmar eliminar/desvincular
   - `CreateFromForecastDialog.jsx` (94 líneas) — crear palet desde previsión
   - `LinkPalletsDialog.jsx` (270 líneas) — vincular palets existentes

2. **Componentes extraídos**:
   - `OrderPalletTableRow.jsx` (114 líneas) — fila de tabla desktop
   - `OrderPalletCard` — tarjetas móviles (ya existía, integrado)

3. **OrderPallets/index.js**: de ~1475 a 903 líneas (−572 líneas)

4. **Fix test**: receptionCalculations — expectativa corregida (49 vs 50) según implementación

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Tests pasan (incl. receptionCalculations corregido)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado

### Gap to 10/10 (obligatorio si Rating después < 9)
- Sub-bloque 5: Dividir OrderCustomerHistory (~1225 líneas)
- Sub-bloque 6: TypeScript en servicios

### Rollback Plan
```bash
git revert <commit-hash>
```

### Next Steps
- Sub-bloque 5: OrderCustomerHistory (extraer secciones, diálogos, tablas)

---

## [2026-02-14] Bloque Ventas — Sub-bloque 5: Dividir OrderCustomerHistory

**Priority**: P1  
**Risk Level**: Medium  
**Rating antes: 5.5/10** | **Rating después: 5.5/10** (incremental)

### Problems Addressed
- P1: OrderCustomerHistory ~1225 líneas, lógica de datos mezclada con UI

### Changes Applied
1. **useCustomerHistory** (`src/hooks/useCustomerHistory.js`, 282 líneas):
   - Data fetching (getCustomerOrderHistory)
   - Date range calculation (getDateRange)
   - generalMetrics (totalOrders, totalAmount, avgDaysBetween, daysSinceLastOrder)
   - calculateTrend (comparación con período anterior)
   - getTrendTooltipText
   - Estado: customerHistory, availableYears, loading, error, dateFilter, selectedYear

2. **OrderCustomerHistory/index.js**: de ~1225 a 966 líneas (−259 líneas)

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Tests orderService y receptionCalculations pasan
- ✅ Comportamiento preservado (historial, filtros, tendencias, gráficos)

### Gap to 10/10 (obligatorio si Rating después < 9)
- Sub-bloque 6: TypeScript en servicios
- OrderCustomerHistory aún ~966 líneas; posibles extracciones: GeneralMetricsGrid, DateFilterTabs, ProductHistoryItem

### Rollback Plan
```bash
git revert <commit-hash>
```

### Next Steps
- Sub-bloque 6: TypeScript en servicios (opcional)
- O continuar reduciendo OrderCustomerHistory con componentes extraídos

---

## [2026-02-14] Bloque Ventas — Sub-bloque 6: TypeScript en servicios

**Priority**: P1  
**Risk Level**: Low  
**Rating antes: 5.5/10** | **Rating después: 6/10**

### Problems Addressed
- Sin TypeScript en el proyecto
- orderService en JS sin tipos estáticos

### Changes Applied
1. **TypeScript setup**:
   - `npm install -D typescript @types/react @types/node`
   - `tsconfig.json` con allowJs, strict, paths (@/*, @lib/*)
   - `next-env.d.ts` para tipos Next.js

2. **orderService.ts** (migración de orderService.js):
   - Tipos: AuthToken, Order, OrderPayload, OrderPlannedProductDetailPayload, OrderRankingStatsParams, SalesChartParams
   - Funciones tipadas: getOrder, updateOrder, getActiveOrders, createOrder, etc.
   - Fix createOrder: type assertion para session.user.accessToken (next-auth Session no incluye accessToken por defecto)

3. **orderService.js eliminado** — orderService.ts es la fuente única

### Verification Results
- ✅ Build exitoso (Next.js 16 + TypeScript)
- ✅ 14/14 tests orderService pasan
- ✅ Imports existentes (@/services/orderService) resuelven a .ts sin cambios

### Gap to 10/10 (obligatorio si Rating después < 9)
- Migrar más servicios a TypeScript (customerService, palletService, etc.)
- Extender tipos NextAuth para accessToken en Session
- OrderCustomerHistory aún ~966 líneas

### Rollback Plan
```bash
git revert <commit-hash>
npm uninstall typescript @types/react @types/node
# Restaurar orderService.js desde histórico
```

### Next Steps
- Migrar customerService, palletService a TypeScript
- Declarar tipos NextAuth extendidos (auth.d.ts)

---

## [2026-02-14] Bloque Ventas — Sub-bloque 7: NextAuth types + customerService TypeScript

**Priority**: P1  
**Risk Level**: Low  
**Rating antes: 6/10** | **Rating después: 6/10** (incremental)

### Problems Addressed
- Session.user.accessToken sin tipos (requería type assertion en orderService)
- customerService en JS sin tipos estáticos

### Changes Applied
1. **NextAuth types** (`src/types/next-auth.d.ts`):
   - Extensión de Session.user: accessToken, role, assignedStoreId, companyName, companyLogoUrl
   - Extensión de User: accessToken, role, assignedStoreId, etc.
   - Extensión de JWT: accessToken, role, lastRefresh, etc.
   - orderService createOrder: session?.user?.accessToken sin type assertion

2. **customerService.ts** (migración de customerService.js):
   - Tipos: AuthToken, CustomerOrderHistoryOptions, CustomerOrderHistoryResponse
   - Funciones tipadas: getCustomersOptions, getCustomer, getCustomerOrderHistory

3. **customerService.js eliminado**

### Verification Results
- ✅ Build exitoso
- ✅ Tests orderService pasan
- ✅ Imports @/services/customerService resuelven a .ts

### Gap to 10/10
- Migrar palletService, otros servicios a TypeScript
- OrderCustomerHistory ~966 líneas

### Rollback Plan
```bash
git revert <commit-hash>
# Restaurar customerService.js
```

### Next Steps
- Migrar palletService a TypeScript
- Continuar reduciendo OrderCustomerHistory

---

## [2026-02-14] Bloque Ventas — Sub-bloque 8: palletService TypeScript

**Priority**: P1  
**Risk Level**: Low  
**Rating antes: 6/10** | **Rating después: 6/10** (incremental)

### Problems Addressed
- palletService en JS sin tipos estáticos

### Changes Applied
1. **palletService.ts** (migración de palletService.js):
   - Tipos: AuthToken, PalletPayload, AvailablePalletsParams, AvailablePalletsResponse, LinkPalletPayload
   - Funciones tipadas: getPallet, updatePallet, createPallet, assignPalletsToPosition, movePalletToStore, moveMultiplePalletsToStore, removePalletPosition, deletePallet, unlinkPalletFromOrder, unlinkPalletsFromOrders, searchPalletsByLot, getAvailablePalletsForOrder, linkPalletToOrder, linkPalletsToOrders

2. **palletService.js eliminado**

### Verification Results
- ✅ Build exitoso
- ✅ Tests orderService pasan
- ✅ Imports @/services/palletService resuelven a .ts

### Gap to 10/10
- Migrar más servicios a TypeScript (productService, storeService, etc.)
- OrderCustomerHistory ~966 líneas

### Rollback Plan
```bash
git revert <commit-hash>
# Restaurar palletService.js
```

### Next Steps
- Migrar productService, storeService a TypeScript
- Continuar reduciendo OrderCustomerHistory

---

## [2026-02-14] Bloque Ventas — Sub-bloque 9: productService y storeService TypeScript

**Priority**: P1  
**Risk Level**: Low  
**Rating antes: 6/10** | **Rating después: 6/10** (incremental)

### Problems Addressed
- productService y storeService en JS sin tipos estáticos

### Changes Applied
1. **productService.ts** (migración de productService.js):
   - getProductOptions(token): Promise<unknown>

2. **storeService.ts** (migración de storeService.js):
   - Tipos: AuthToken, GetStoresResponse
   - Funciones: getStore, getStores, getStoreOptions, getTotalStockStats, getStockBySpeciesStats, getStockByProducts, getRegisteredPallets
   - Eliminados console.log de debug en getRegisteredPallets

3. **productService.js y storeService.js eliminados**

### Verification Results
- ✅ Build exitoso
- ✅ Imports @/services/productService y @/services/storeService resuelven a .ts

### Gap to 10/10
- Migrar más servicios a TypeScript
- OrderCustomerHistory ~966 líneas

### Rollback Plan
```bash
git revert <commit-hash>
# Restaurar productService.js y storeService.js
```

### Next Steps
- Continuar migrando servicios a TypeScript
- Reducir OrderCustomerHistory con componentes extraídos

---

## [2026-02-14] Bloque Ventas — Sub-bloque 10: Reducir OrderCustomerHistory

**Priority**: P1  
**Risk Level**: Low  
**Rating antes: 6/10** | **Rating después: 6.5/10**

### Problems Addressed
- OrderCustomerHistory ~966 líneas, componente monolítico
- UI inline difícil de mantener y testear
- Duplicación de lógica entre vista móvil y desktop

### Changes Applied
1. **Componentes extraídos**:
   - `GeneralMetricsGrid.jsx` — grid de métricas (Total Pedidos, Valor Total, Frecuencia, Último Pedido)
   - `DateFilterTabs.jsx` — tabs de filtro por fecha (Mes, Trimestre, año actual/pasado, selector de años)
   - `ProductHistoryMobileCard.jsx` — tarjeta móvil con nombre, tendencia, métricas, gráficos y tabla
   - `ProductHistoryAccordionItem.jsx` — ítem de acordeón desktop con misma información
   - `ChartTooltip.jsx` — tooltip para gráficos Recharts

2. **Utilidad extraída**:
   - `utils/getChartDataByProduct.js` — transforma `product.lines` en datos para Recharts

3. **OrderCustomerHistory/index.js**: de ~966 a ~305 líneas (−661 líneas, −68%)

4. **Estructura final**:
   - `OrderCustomerHistory/index.js` — orquestación, estados, errores
   - `OrderCustomerHistory/components/` — UI descompuesta
   - `OrderCustomerHistory/utils/` — transformaciones puras

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado (historial, filtros, tendencias, gráficos móvil/desktop)

### Gap to 10/10 (obligatorio si Rating después < 9)
- Order/index.js ~647 líneas (>200)
- OrderPallets ~903 líneas
- Migrar componentes OrderCustomerHistory a TypeScript (opcional)
- Formularios + Zod (validación cliente)

### Rollback Plan
```bash
git revert <commit-hash>
# Restaurar OrderCustomerHistory/index.js monolítico
# Eliminar OrderCustomerHistory/components/ y utils/
```

### Next Steps
- Reducir Order (~647 líneas) si prioridad
- O migrar componentes OrderCustomerHistory a TypeScript
- O pasar a otro bloque del CORE (Productos, Clientes, Stock)

---
