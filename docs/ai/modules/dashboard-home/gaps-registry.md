# dashboard-home — GAPs Registry

> **GENERADO por `node scripts/build-gaps-registry.mjs dashboard-home`. No editar a mano.**
> Última regeneración: 2026-07-05
> Fuente: frontmatter de `docs/ai/gaps/dashboard-home/*.md`

## Ready

| GAP | Título | Categoría | Prioridad | Riesgo | Tamaño | Dependencias | Archivos objetivo | Actualizado |
|---|---|---|---|---|---|---|---|---|
| GAP-V2-004 | CompanySetupAlert se solapa con el BottomNav en mobile y desborda el viewport | a11y-responsive | P0 | low | S | — | src/components/Admin/Dashboard/CompanySetupAlert.tsx | 2026-07-05 |
| GAP-V2-001 | Widgets de gráfico con filtros muestran spinner + "Cargando datos..." como loading primario en vez de Skeleton | ux-ui | P1 | low | M | — | src/components/Admin/Dashboard/SalesChart/index.js<br>src/components/Admin/Dashboard/ReceptionChart/index.js<br>src/components/Admin/Dashboard/DispatchChart/index.js<br>src/components/Admin/Dashboard/AuxiliaryLinesChartCard/index.tsx | 2026-07-05 |
| GAP-V2-002 | Widgets de ranking usan el componente `<Loader>` (reservado para session gates) como loading de datos | ux-ui | P1 | low | M | — | src/components/Admin/Dashboard/OrderRanking/index.js<br>src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js<br>src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx<br>src/components/Admin/Dashboard/AuxiliaryLinesByCustomerCard/index.tsx | 2026-07-05 |
| GAP-V2-003 | La mayoría de widgets del dashboard ignoran el `error` que ya exponen sus hooks y lo confunden con "sin datos" | ux-ui | P1 | low | L | — | src/components/Admin/Dashboard/CurrentStockCard/index.js<br>src/components/Admin/Dashboard/TotalQuantitySoldCard/index.js<br>src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx<br>src/components/Admin/Dashboard/OrdersProfitabilitySummaryCard/index.js<br>src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx<br>src/components/Admin/Dashboard/OrderRanking/index.js<br>src/components/Admin/Dashboard/SalesBySalespersonPieChart/index.js<br>src/components/Admin/Dashboard/StockBySpeciesCard/index.js<br>src/components/Admin/Dashboard/StockByProductsCard/index.js<br>src/components/Admin/Dashboard/OrdersProfitabilityProductsCard/index.js<br>src/components/Admin/Dashboard/SalesChart/index.js<br>src/components/Admin/Dashboard/AuxiliaryLinesChartCard/index.tsx<br>src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx<br>src/components/Admin/Dashboard/AuxiliaryLinesByCustomerCard/index.tsx<br>src/components/Admin/Dashboard/ReceptionChart/index.js<br>src/components/Admin/Dashboard/DispatchChart/index.js<br>src/components/Admin/Dashboard/TransportRadarChart/index.js<br>src/components/Admin/Dashboard/WorkingEmployeesCard/index.js | 2026-07-05 |
| GAP-V2-005 | CompanySetupAlert no tiene ninguna forma de descartarlo — persiste fijo en pantalla toda la sesión | ux-ui | P2 | low | S | — | src/components/Admin/Dashboard/CompanySetupAlert.tsx | 2026-07-05 |
| GAP-V2-007 | Triggers de tooltip "Info" inconsistentes — algunos son `<span>` no accesibles por teclado, otros `<button>` correctos | a11y-responsive | P2 | low | S | — | src/components/Admin/Dashboard/CurrentStockCard/index.js<br>src/components/Admin/Dashboard/TotalAmountSoldCard/index.tsx<br>src/components/Admin/Dashboard/AuxiliaryLinesTotalCard/index.tsx | 2026-07-05 |
| GAP-V2-009 | Integrar OrdersProfitabilityTimelineCard en el grid del Dashboard (oculto para supervisor) | ux-ui | P2 | low | S | — | src/components/Admin/Dashboard/index.tsx<br>src/components/Admin/Dashboard/OrdersProfitabilityTimelineCard/index.js | 2026-07-05 |
| GAP-V2-006 | Eliminar NewLabelingFeatureCard — tarjeta promocional de una funcionalidad que ya está en producción | ux-ui | P3 | low | XS | — | src/components/Admin/Dashboard/NewLabelingFeatureCard/index.js<br>src/components/Admin/Dashboard/index.tsx | 2026-07-05 |
| GAP-V2-008 | Fila superior de KPIs muestra 5 tarjetas en un grid de 4 columnas — última fila desequilibrada en 2xl | ux-ui | P3 | low | XS | — | src/components/Admin/Dashboard/index.tsx | 2026-07-05 |


## In progress

_ninguno_


## Blocked

_ninguno_


## Done

_ninguno_


## Later

_ninguno_


## Rejected

_ninguno_


