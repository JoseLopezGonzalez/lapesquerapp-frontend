# STEP 0a — Bloque Dashboard: Alcance y Mapeo de Entidades

**Fecha**: 2026-02-15  
**Bloque**: Dashboard  
**Estado**: Pendiente de confirmación del usuario

---

## 1. Entidades del bloque

El bloque **Dashboard** abarca la vista de inicio (`/admin/home`) que muestran admin y técnico, más la vista específica de **Operario** cuando accede a la misma ruta.

| Entidad | Ubicación | Descripción |
|---------|-----------|-------------|
| **HomePage** | `src/app/admin/home/page.js` | Página de entrada; según rol (operario vs admin/tecnico) renderiza Dashboard o OperarioDashboard |
| **Admin Dashboard** | `src/components/Admin/Dashboard/index.js` | Panel principal: saludo, grid de cards, masonry de gráficos |
| **OperarioDashboard** | `src/components/Warehouse/OperarioDashboard/index.js` | Panel operario: hora/fecha/día, ReceptionsListCard, DispatchesListCard |

---

## 2. Componentes del Admin Dashboard (14 cards/gráficos)

| Componente | Archivo | Data fetching | Líneas aprox. |
|------------|---------|---------------|---------------|
| CurrentStockCard | `Dashboard/CurrentStockCard/index.js` | ✅ useTotalStockStats (React Query) | ~60 |
| TotalQuantitySoldCard | `Dashboard/TotalQuantitySoldCard/index.js` | ❌ useEffect + useState + orderService | ~100 |
| TotalAmountSoldCard | `Dashboard/TotalAmountSoldCard/index.js` | ❌ useEffect + useState + orderService | ~100 |
| NewLabelingFeatureCard | `Dashboard/NewLabelingFeatureCard/index.js` | (pendiente revisar) | — |
| OrderRankingChart | `Dashboard/OrderRanking/index.js` | ❌ useEffect + useState + orderService | — |
| SalesBySalespersonPieChart | `Dashboard/SalesBySalespersonPieChart/index.js` | ❌ useEffect + useState + orderService | — |
| StockBySpeciesCard | `Dashboard/StockBySpeciesCard/index.js` | ✅ useStockBySpeciesStats (React Query) | ~90 |
| StockByProductsCard | `Dashboard/StockByProductsCard/index.js` | ✅ useStockByProductsStats (React Query) | ~135 |
| SalesChart | `Dashboard/SalesChart/index.js` | ❌ useEffect + useState + orderService | ~335 |
| ReceptionChart | `Dashboard/ReceptionChart/index.js` | ❌ useEffect + useState | — |
| DispatchChart | `Dashboard/DispatchChart/index.js` | ❌ useEffect + useState | — |
| TransportRadarChart | `Dashboard/TransportRadarChart/index.js` | ❌ useEffect + useState | — |
| WorkingEmployeesCard | `Dashboard/WorkingEmployeesCard/index.js` | ❌ useEffect + useState + punchService | ~395 |
| WorkerStatisticsCard | `Dashboard/WorkerStatisticsCard/index.js` | ❌ useEffect + useState + punchService | — |

---

## 3. Componentes del OperarioDashboard

| Componente | Archivo | Data fetching |
|------------|---------|---------------|
| OperarioDashboard | `Warehouse/OperarioDashboard/index.js` | Ninguno (hora/fecha locales) |
| ReceptionsListCard | `Warehouse/ReceptionsListCard/index.js` | ❌ useEffect + useState + rawMaterialReceptionService |
| DispatchesListCard | `Warehouse/DispatchesListCard/index.js` | ❌ useEffect + useState + ceboDispatchService |

---

## 4. Hooks utilizados

| Hook | Archivo | Uso |
|------|---------|-----|
| useTotalStockStats | `hooks/useStockStats.js` | CurrentStockCard — React Query |
| useStockBySpeciesStats | `hooks/useStockStats.js` | StockBySpeciesCard — React Query |
| useStockByProductsStats | `hooks/useStockStats.js` | StockByProductsCard — React Query |

---

## 5. Servicios utilizados

| Servicio | Función(es) | Usado por |
|----------|-------------|-----------|
| orderService | getOrdersTotalNetWeightStats, getOrdersTotalAmountStats, getSalesChartData, getSalesBySalesperson | TotalQuantitySoldCard, TotalAmountSoldCard, SalesChart, OrderRankingChart, SalesBySalespersonPieChart |
| punchService | getPunchesDashboard, getPunchesStatistics | WorkingEmployeesCard, WorkerStatisticsCard |
| storeService | getTotalStockStats, getStockBySpeciesStats, getStockByProducts | useStockStats (via services) |
| speciesService | getSpeciesOptions | SalesChart, ReceptionChart, DispatchChart, OrderRankingChart |
| productCategoryService | getProductCategoryOptions | Idem |
| productFamilyService | getProductFamilyOptions | Idem |
| rawMaterialReceptionService | list | ReceptionsListCard |
| ceboDispatchService | list | DispatchesListCard |

---

## 6. Artefactos por tipo

| Tipo | Artefactos |
|------|------------|
| **Pages** | `src/app/admin/home/page.js` |
| **Components** | Dashboard/index.js + 14 subcomponentes en Dashboard/, OperarioDashboard, ReceptionsListCard, DispatchesListCard |
| **Hooks** | useStockStats (3 hooks: useTotalStockStats, useStockBySpeciesStats, useStockByProductsStats) |
| **Services** | orderService, punchService, storeService, speciesService, productCategoryService, productFamilyService, rawMaterialReceptionService, ceboDispatchService |
| **State** | useSession (NextAuth), getCurrentTenant (useStockStats) |
| **Tests** | No hay tests específicos del Dashboard |
| **Utilities** | formatDecimalWeight, formatInteger, formatDate, formatDateHour, etc. |

---

## 7. Resumen del alcance

**Entidades totales**: 3 (HomePage, Admin Dashboard, OperarioDashboard)  
**Componentes en Dashboard Admin**: 15 (index + 14 cards/gráficos)  
**Componentes en OperarioDashboard**: 3 (OperarioDashboard + ReceptionsListCard + DispatchesListCard)  
**Hooks propios**: useStockStats (3 variantes)  
**Patrón de datos**: 3 componentes con React Query, resto con useEffect + useState

---

## 8. Pregunta de confirmación

**Bloque Dashboard incluye:**
- **Entidades**: HomePage, Admin Dashboard, OperarioDashboard
- **Artefactos**: Pages, Components (Dashboard + Operario), Hooks (useStockStats), Services relacionados
- **Tests**: Ninguno existente; evaluar gaps en STEP 1

¿Confirmas este alcance o hay que añadir/quitar algo antes de pasar a STEP 0 (comportamiento UI) y STEP 1 (análisis)?
