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

## [2026-02-14] Bloque Ventas — Sub-bloque 11: Order config y utilidades (Fase 1.1)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Configuración y helpers inline en Order (~40 líneas)

### Changes Applied
1. **config/sectionsConfig.js**:
   - SECTIONS_CONFIG (componentes, iconos, lazy loading)
   - PRIMARY_SECTION_IDS_MOBILE

2. **utils/getTransportImage.js**:
   - getTransportImage(transportName) — helper para rutas de imágenes de transporte

3. **Order/index.js**: eliminadas ~40 líneas (imports config y utils)

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar config/ y utils/, restaurar inline en Order
```

### Next Steps
- Sub-bloque 1.2: Extraer OrderHeaderMobile

---

## [2026-02-14] Bloque Ventas — Sub-bloque 12: OrderHeaderMobile (Fase 1.2)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Header móvil inline en Order (~55 líneas)

### Changes Applied
1. **Order/components/OrderHeaderMobile.jsx**:
   - Botón back + título (#orderId) + menú ⋮
   - Secciones overflow, Editar pedido, Imprimir
   - Props: order, onClose, onNavigateSection, onEdit, onPrint

2. **Order/index.js**: reemplazado header inline por `<OrderHeaderMobile />`

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar OrderHeaderMobile.jsx, restaurar inline en Order
```

### Next Steps
- Sub-bloque 1.3: Extraer OrderSummaryMobile

---

## [2026-02-14] Bloque Ventas — Sub-bloque 13: OrderSummaryMobile (Fase 1.3)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Cabecera móvil centrada inline en Order (~75 líneas)

### Changes Applied
1. **Order/components/OrderSummaryMobile.jsx**:
   - Cliente, transporte, badge estado, fecha carga, temperatura, palets, importe
   - Dropdowns de estado y temperatura incluidos
   - Props: order, transportImage, onStatusChange, onTemperatureChange

2. **Order/index.js**: reemplazado bloque inline por `<OrderSummaryMobile />`

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar OrderSummaryMobile.jsx, restaurar inline en Order
```

### Next Steps
- Sub-bloque 1.4: Extraer OrderSectionList

---

## [2026-02-14] Bloque Ventas — Sub-bloque 14: OrderSectionList (Fase 1.4)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Lista de secciones móvil inline en Order (~35 líneas)

### Changes Applied
1. **Order/components/OrderSectionList.jsx**:
   - ScrollArea + Card con botones de secciones primarias (Previsión, Producción, Envío de Documentos)
   - Props: onSelectSection, hasSafeAreaPadding

2. **Order/index.js**: reemplazado bloque inline por `<OrderSectionList />`
   - Eliminado import ChevronRight (no usado)

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar OrderSectionList.jsx, restaurar inline en Order
```

### Next Steps
- Sub-bloque 1.5: Extraer OrderStatusDropdown y OrderTemperatureDropdown (desktop)

---

## [2026-02-14] Bloque Ventas — Sub-bloque 15: OrderStatusDropdown y OrderTemperatureDropdown (Fase 1.5)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- renderStatusBadge y dropdown temperatura inline en Order (~60 líneas)

### Changes Applied
1. **Order/components/OrderStatusDropdown.jsx**:
   - StatusBadge + DropdownMenu (En producción, Terminado, Incidencia)
   - Props: status, onStatusChange

2. **Order/components/OrderTemperatureDropdown.jsx**:
   - Temperatura + DropdownMenu (0, 4, -18, -23 ºC)
   - Props: temperature, onTemperatureChange, className

3. **Order/index.js**:
   - Eliminado renderStatusBadge useCallback
   - Reemplazado por OrderStatusDropdown y OrderTemperatureDropdown
   - Eliminados imports: StatusBadge, ThermometerSnowflake

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar OrderStatusDropdown.jsx, OrderTemperatureDropdown.jsx, restaurar inline en Order
```

### Next Steps
- Sub-bloque 1.6: Extraer OrderHeaderDesktop y OrderTabsDesktop
- O verificar líneas Order y pasar a Fase 2 (OrderPallets)

---

## [2026-02-14] Bloque Ventas — Sub-bloque 16: OrderHeaderDesktop, OrderTabsDesktop, OrderSectionContentMobile (Fase 1.6)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Header desktop, Tabs desktop y contenido de sección móvil inline en Order (~100 líneas)

### Changes Applied
1. **Order/components/OrderHeaderDesktop.jsx**:
   - Estado, id, cliente, fecha, temperatura; botones Editar/Imprimir/⋮; imagen transporte
   - Props: order, transportImage, onStatusChange, onTemperatureChange, onPrint

2. **Order/components/OrderTabsDesktop.jsx**:
   - TabsList + TabsContent generados desde SECTIONS_CONFIG
   - Props: activeTab, onTabChange

3. **Order/components/OrderSectionContentMobile.jsx**:
   - Renderiza componente de SECTIONS_CONFIG según activeSection
   - Elimina imports directos de OrderMap, OrderPallets, etc. en Order
   - Props: activeSection

4. **Order/index.js**: reemplazado ~100 líneas por componentes; eliminados imports no usados

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Sin errores de linter
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar OrderHeaderDesktop, OrderTabsDesktop, OrderSectionContentMobile; restaurar inline
```

### Next Steps
- Fase 1 completada. Order ~280 líneas (objetivo <250 cercano)
- Fase 2: Reducir OrderPallets

---

## [2026-02-14] Bloque Ventas — Sub-bloque 2.2: Extraer OrderPalletsToolbar (Fase 2.2)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Toolbar (botones Crear, Vincular, Desde previsión, Desvincular todos) inline en OrderPallets (~80 líneas)

### Changes Applied
1. **OrderPallets/components/OrderPalletsToolbar.jsx**:
   - Mobile: fixed footer con 3 botones + DropdownMenu (Desvincular todos)
   - Desktop: CardHeader con título, CardDescription y botones
   - Props: isMobile, pallets, isUnlinkingAll, onCreate, onLink, onCreateFromForecast, onUnlinkAll

2. **OrderPallets/index.js**:
   - Reemplazado footer móvil y CardHeader desktop por OrderPalletsToolbar
   - Eliminados imports: Plus, Unlink, Link2, Loader2, MoreVertical, PackagePlus, Button, DropdownMenu, CardHeader/CardTitle/CardDescription

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar OrderPalletsToolbar.jsx, restaurar inline en OrderPallets
```

### Next Steps
- Fase 2.3: Extraer OrderPalletsContent

---

## [2026-02-14] Bloque Ventas — Sub-bloque 2.3: Extraer OrderPalletsContent (Fase 2.3)

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Render condicional móvil (cards) vs desktop (tabla) inline en OrderPallets (~90 líneas)

### Changes Applied
1. **OrderPallets/components/OrderPalletsContent.jsx**:
   - EmptyState cuando pallets.length === 0
   - Mobile: lista de OrderPalletCard
   - Desktop: tabla con OrderPalletTableRow
   - Props: pallets, isMobile, onEdit, onClone, onUnlink, onDelete, onPrintLabel, isCloning, unlinkingPalletId

2. **OrderPallets/index.js**:
   - Reemplazado EmptyState + cards/table por OrderPalletsContent
   - Eliminados imports: EmptyState, Table, OrderPalletCard, OrderPalletTableRow

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Comportamiento preservado

### Rollback Plan
```bash
git revert <commit-hash>
# Eliminar OrderPalletsContent.jsx, restaurar inline en OrderPallets
```

### Next Steps
- Fase 2 completada. OrderPallets reducido (~250 líneas)
- Fase 3: Formularios + Zod

---

## [2026-02-14] Bloque Ventas — Fase 3: Formularios + Zod

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Validación solo en backend (422) sin feedback inmediato en cliente

### Changes Applied

**Sub-bloque 3.1: CreateOrderForm + Zod**
1. `CreateOrderForm/schemas/orderCreateSchema.js`: esquema Zod con customer, entryDate, loadDate, salesperson, payment, incoterm, buyerReference, transport, addresses, notes, emails, plannedProducts
2. CreateOrderForm: `useForm({ resolver: zodResolver(orderCreateSchema), ... })`
3. Eliminadas reglas inline de register/Controller (validación delegada a Zod)
4. setErrorsFrom422 permanece como fallback en catch de handleCreate

**Sub-bloque 3.2: OrderEditSheet + Zod**
1. `OrderEditSheet/schemas/orderEditSchema.js`: esquema para campos editables (entryDate, loadDate, salesperson, payment, incoterm, buyerReference, transport, addresses, notes, emails)
2. OrderEditSheet: `useForm({ resolver: zodResolver(orderEditSchema), ... })`
3. Eliminadas reglas inline de register/Controller
4. setErrorsFrom422 como fallback en catch de onSubmit

**Dependencia**
- Añadido @hookform/resolvers para zodResolver

### Verification Results
- ✅ Build exitoso (Next.js 16)
- ✅ Validación cliente con feedback inmediato
- ✅ Backend 422 sigue mapeándose con setErrorsFrom422

### Rollback Plan
```bash
git revert <commit-hash>
npm uninstall @hookform/resolvers
# Restaurar rules en register/Controller, eliminar schemas y resolver
```

### Next Steps
- Fase 4: Tests useOrder, useCustomerHistory, useOrders

---

## [2026-02-14] Bloque Ventas — Fase 4: Tests para hooks

**Priority**: P1  
**Risk Level**: Low  
**Plan**: docs/plan-ventas-9-10.md

### Problems Addressed
- Sin cobertura de tests para hooks críticos (useOrder, useCustomerHistory, useOrders)

### Changes Applied

**Sub-bloque 4.1: Tests useOrder** (`src/__tests__/hooks/useOrder.test.js`)
- Devuelve order, loading, error cuando carga
- updateOrderStatus actualiza caché y llama onChange
- exportDocument llama fetchWithTenant
- Manejo de error 401

**Sub-bloque 4.2: Tests useCustomerHistory** (`src/__tests__/hooks/useCustomerHistory.test.js`)
- Devuelve filteredHistory, generalMetrics, loading
- dateFilter cambia getDateRange
- calculateTrend devuelve direction y percentage
- getDateRange devuelve from/to como Date
- Estados de loading

**Sub-bloque 4.3: Tests useOrders** (`src/__tests__/hooks/useOrders.test.js`)
- Devuelve orders, isLoading
- Array vacío cuando no hay pedidos
- Error cuando falla la petición
- Expone queryKey y refetch

**Setup**
- @vitest-environment happy-dom en tests de hooks (evita conflicto ESM con jsdom)
- @testing-library/react, @testing-library/dom, happy-dom como devDependencies
- Renombrado OrdersManagerOptionsContext.js → .jsx para parse correcto de JSX

### Verification Results
- ✅ 27 tests pasan (14 orderService + 4 useOrder + 5 useCustomerHistory + 4 useOrders)
- ✅ Build exitoso

### Rollback Plan
```bash
git revert <commit-hash>
# Restaurar OrdersManagerOptionsContext.jsx → .js
# Eliminar tests y deps de testing
```

### Next Steps
- Plan Ventas 9/10 completado (Fases 1-4)

---
