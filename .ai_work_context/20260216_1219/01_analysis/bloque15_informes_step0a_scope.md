# Bloque 15: Informes básicos (gráficos Dashboard) — STEP 0a: Block Scope & Entity Mapping

**Fecha**: 2026-02-16  
**Estado**: Completado

## Alcance del bloque

El bloque **Informes básicos** abarca los gráficos y cards de datos que muestran métricas en el Dashboard (Admin) y en el OperarioDashboard. Los gráficos están integrados en el Dashboard según el CORE Plan.

**Nota**: El Bloque 2 (Dashboard Admin + Operario) ya está en 9/10 con React Query. El Bloque 15 es el subconjunto específico de **componentes de informes/gráficos** para auditoría y consolidación explícita.

---

## Entidades y artefactos

### Admin Dashboard (`components/Admin/Dashboard/`)

| Componente | Hook de datos | Servicio |
|------------|---------------|----------|
| CurrentStockCard | useTotalStockStats | storeService.getTotalStockStats |
| TotalQuantitySoldCard | useOrdersTotalNetWeightStats | orderService.getOrdersTotalNetWeightStats |
| TotalAmountSoldCard | useOrdersTotalAmountStats | orderService.getOrdersTotalAmountStats |
| NewLabelingFeatureCard | (estático / feature flag) | — |
| OrderRankingChart | useOrderRankingStats | orderService.getOrderRankingStats |
| SalesBySalespersonPieChart | useSalesBySalesperson | orderService.getSalesBySalesperson |
| StockBySpeciesCard | useStockBySpeciesStats | storeService.getStockBySpeciesStats |
| StockByProductsCard | useStockByProductsStats | storeService.getStockByProducts |
| SalesChart | useSalesChartData | orderService.getSalesChartData |
| ReceptionChart | useReceptionChartData | rawMaterialReceptionService |
| DispatchChart | useDispatchChartData | ceboDispatchService |
| TransportRadarChart | useTransportChartData | orderService.getTransportChartData |
| WorkingEmployeesCard | usePunchesDashboard | punchService |
| WorkerStatisticsCard | usePunchesStatistics | punchService |

### Operario Dashboard (`components/Warehouse/`)

| Componente | Hook de datos | Servicio |
|------------|---------------|----------|
| ReceptionsListCard | useReceptionsList | rawMaterialReceptionService |
| DispatchesListCard | useDispatchesList | ceboDispatchService |

### Hooks de datos (informes)

| Hook | Archivo | Stack |
|------|---------|-------|
| useSalesChartData | useDashboardCharts.js | React Query ✅ |
| useReceptionChartData | useDashboardCharts.js | React Query ✅ |
| useDispatchChartData | useDashboardCharts.js | React Query ✅ |
| useTransportChartData | useDashboardCharts.js | React Query ✅ |
| useOrdersTotalNetWeightStats | useOrdersStats.js | React Query ✅ |
| useOrdersTotalAmountStats | useOrdersStats.js | React Query ✅ |
| useOrderRankingStats | useOrdersStats.js | React Query ✅ |
| useSalesBySalesperson | useOrdersStats.js | React Query ✅ |
| useTotalStockStats | useStockStats.js | React Query ✅ |
| useStockBySpeciesStats | useStockStats.js | React Query ✅ |
| useStockByProductsStats | useStockStats.js | React Query ✅ |
| usePunchesDashboard | usePunches.js | React Query ✅ |
| usePunchesStatistics | usePunches.js | React Query ✅ |
| useReceptionsList | useReceptionsList.js | React Query ✅ |
| useDispatchesList | useDispatchesList.js | React Query ✅ |

### Servicios que alimentan gráficos

- `orderService` (orderService.ts / domain) — ventas, ranking, transporte
- `storeService` (storeService.ts) — stock total, por especie, por producto
- `rawMaterialReception/getReceptionChartData` — gráfico recepciones
- `ceboDispatch/getDispatchChartData` — gráfico salidas cebo
- `punchService` — fichajes (empleados trabajando, estadísticas)

### Rutas y páginas

- `app/admin/home/page.js` → Dashboard (admin) o OperarioDashboard (operario)

---

## Admin/Home (opcional / legacy)

Existe `components/Admin/Home/` con SpeciesInventoryOverview, RawMaterialRadarBarChart, ProductsInventoryOverview, RawAreaChart. La ruta `admin/home` actualmente renderiza `Dashboard` (no Home). Si Home se usa en otra ruta, incluir en alcance.

---

## Resumen de alcance

**Bloque 15 incluye:**
- **14 componentes** de gráficos/cards en Admin Dashboard
- **2 componentes** en OperarioDashboard (ReceptionsListCard, DispatchesListCard)
- **Hooks**: useDashboardCharts, useOrdersStats, useStockStats, usePunches (Dashboard), useReceptionsList, useDispatchesList
- **Servicios**: orderService, storeService, rawMaterialReception, ceboDispatch, punchService
- **Stack actual**: React Query en todos los hooks de datos (migración ya realizada en Bloque 2)

**Gaps potenciales** (a validar en STEP 1):
- TypeScript: hooks y servicios en .js
- Tests: ¿hay tests para los servicios de gráficos?
- Tipos de respuestas API para datos de charts
- Accesibilidad de gráficos (Recharts, tooltips, leyendas)
