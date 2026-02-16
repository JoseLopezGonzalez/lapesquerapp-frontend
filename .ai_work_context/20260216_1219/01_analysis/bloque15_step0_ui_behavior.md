# Bloque 15: Informes básicos — STEP 0: Document Current UI Behavior

**Fecha**: 2026-02-16  
**Estado**: Completado

## UI States

| Componente | Estados |
|------------|---------|
| CurrentStockCard | loading (Skeleton), populated (totalNetWeight, totalPallets, totalBoxes, totalStores) |
| TotalQuantitySoldCard | loading, populated (año en curso) |
| TotalAmountSoldCard | loading, populated (año en curso) |
| OrderRankingChart | loading, populated, empty (SearchX icon) |
| SalesBySalespersonPieChart | loading, populated, empty |
| StockBySpeciesCard | loading, populated, search filter |
| StockByProductsCard | loading, populated, search filter |
| SalesChart, ReceptionChart, DispatchChart | loading, populated, empty (range picker, filtros especie/categoría/familia) |
| TransportRadarChart | loading, populated, empty |
| WorkingEmployeesCard | loading, populated |
| WorkerStatisticsCard | loading, populated (date range picker) |
| ReceptionsListCard | loading, paginated list, print dialog |
| DispatchesListCard | loading, paginated list |

## User Interactions

- **Date range**: SalesChart, ReceptionChart, DispatchChart, TransportRadarChart, OrderRankingChart, WorkerStatisticsCard — DateRangePicker
- **Filters**: speciesId, categoryId, familyId, unit, groupBy en charts
- **Export**: OrderRankingChart → Excel (xlsx)
- **Print**: ReceptionsListCard → ReceptionPrintDialog
- **Navigation**: CurrentStockCard img → /admin/stores-manager

## Data Flow

API → services (orderService, storeService, rawMaterialReception, ceboDispatch, punchService) → React Query hooks → components.

## Validation Rules

- Rango de fechas requerido para charts habilitados
- Token y tenantId requeridos para queries (enabled)

## Error Handling

- Loading states con Skeleton o Loader
- Charts muestran SearchX cuando no hay datos
- Toast en errores (ReceptionsListCard print)
