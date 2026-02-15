# STEP 0 — Bloque Dashboard: Comportamiento UI Actual

**Fecha**: 2026-02-15  
**Bloque**: Dashboard

---

## 1. UI States (por entidad)

### 1.1 HomePage (`/admin/home`)

| Estado | Condición | Resultado |
|--------|-----------|-----------|
| Loading | `status === "loading"` | Loader centrado (min-h 50vh) |
| Operario autenticado | `role === "operario"` | Renderiza OperarioDashboard con `storeId` |
| Admin/Técnico autenticado | Resto de roles | Renderiza Dashboard (Admin) |
| No autenticado | Sin sesión | Redirigido por middleware / login |

### 1.2 Admin Dashboard

| Estado | Descripción |
|--------|-------------|
| Loading por card | Cada card/gráfico tiene su propio loading (Skeleton o Loader2) |
| Error silencioso | Errores → console.error; datos → null; UI muestra "Sin datos" |
| Empty | Sin datos → mensajes específicos por card |
| Populated | Datos cargados correctamente |
| Filtros activos | SalesChart, ReceptionChart, DispatchChart, OrderRankingChart, WorkerStatisticsCard tienen DateRangePicker y selects (especie, categoría, familia, unit, groupBy) |

### 1.3 OperarioDashboard

| Estado | Descripción |
|--------|-------------|
| Hora/Fecha/Día | Actualización en tiempo real (interval 1s) |
| ReceptionsListCard | loading, empty, populated (paginado) |
| DispatchesListCard | loading, empty, populated (paginado) |

### 1.4 Cards individuales

| Card | Estados |
|------|---------|
| CurrentStockCard | loading (Skeleton), populated, error (no explícito) |
| TotalQuantitySoldCard | loading, populated, "Sin datos" |
| TotalAmountSoldCard | loading, populated, "Sin datos" |
| WorkingEmployeesCard | loading, populated, "No hay trabajadores", actualización silenciosa cada 5 min |
| WorkerStatisticsCard | loading, populated, error (toast) |
| NewLabelingFeatureCard | Estático (sin datos) |
| StockBySpeciesCard, StockByProductsCard | loading, populated, "No hay stock" / "No hay inventario" |

---

## 2. User Interactions

| Acción | Dónde | Efecto |
|--------|-------|--------|
| Cambiar rango de fechas | SalesChart, ReceptionChart, DispatchChart, OrderRankingChart, WorkerStatisticsCard | Re-fetch de datos |
| Cambiar especie/categoría/familia | Charts con filtros | Re-fetch |
| Cambiar unit (Kg/€) | SalesChart, TotalQuantitySoldCard/TotalAmountSoldCard implícito | Re-fetch / recálculo |
| Cambiar groupBy (día/semana/mes) | SalesChart, ReceptionChart, DispatchChart | Re-fetch |
| Click imagen CurrentStockCard | Navegación a /admin/stores-manager |
| Click imagen NewLabelingFeatureCard | Navegación a /admin/label-editor |
| Buscar producto | StockByProductsCard | Filtrado local (no API) |
| Exportar Excel | OrderRankingChart | Descarga XLSX |
| Toggle cantidad visible | ReceptionsListCard, DispatchesListCard | Revela/oculta cantidades |
| Paginar | ReceptionsListCard, DispatchesListCard | Re-fetch página |

---

## 3. Data Flow

| Componente | Origen datos | Patrón |
|------------|--------------|--------|
| CurrentStockCard | storeService.getTotalStockStats | useTotalStockStats → React Query |
| StockBySpeciesCard | storeService.getStockBySpeciesStats | useStockBySpeciesStats → React Query |
| StockByProductsCard | storeService.getStockByProducts | useStockByProductsStats → React Query |
| TotalQuantitySoldCard | orderService.getOrdersTotalNetWeightStats | useEffect + useState |
| TotalAmountSoldCard | orderService.getOrdersTotalAmountStats | useEffect + useState |
| OrderRankingChart | orderService.getOrderRankingStats | useEffect + useState |
| SalesBySalespersonPieChart | orderService.getSalesBySalesperson | useEffect + useState |
| SalesChart | orderService.getSalesChartData | useEffect + useState |
| ReceptionChart | orderService / receptionService | useEffect + useState |
| DispatchChart | orderService / dispatchService | useEffect + useState |
| TransportRadarChart | (pendiente verificar servicio) | useEffect + useState |
| WorkingEmployeesCard | punchService.getPunchesDashboard | useEffect + useState |
| WorkerStatisticsCard | punchService.getPunchesStatistics | useEffect + useState |
| ReceptionsListCard | rawMaterialReceptionService.list | useEffect + useState |
| DispatchesListCard | ceboDispatchService.list | useEffect + useState |

---

## 4. Validation Rules (cliente)

- **Sin formularios de entrada de datos** en el Dashboard (solo filtros y selects).
- Los selects no requieren validación especial (valores predefinidos: "all", opciones de API).
- DateRangePicker: rango lógico (from <= to) gestionado por el componente.

---

## 5. Permissions

| Rol | Vista |
|-----|-------|
| operario | OperarioDashboard (si assignedStoreId presente) |
| admin, tecnico, otros | Admin Dashboard |
| No autenticado | Redirigido a login |

- Los endpoints de API aplican permisos en backend.
- No hay controles de visibilidad por rol dentro del Admin Dashboard (todas las cards visibles para quien llegue).

---

## 6. Error Handling

| Componente | Comportamiento ante error |
|------------|---------------------------|
| Mayoría de cards | console.error; setData(null); UI muestra "Sin datos" o empty state |
| WorkerStatisticsCard | toast.error con userMessage o message |
| WorkingEmployeesCard | console.error; mantiene datos anteriores en actualización silenciosa |
| ReceptionsListCard, DispatchesListCard | setData([]); loading false |
| useStockStats (React Query) | error en return del hook (no mostrado explícitamente en CurrentStockCard) |

**Consistencia**: No hay estrategia unificada (toast vs silencioso vs ErrorBoundary).

---

## 7. Checkpoint de validación

**¿El comportamiento UI actual coincide con las reglas de negocio documentadas?**

- El Dashboard es una vista de agregación/lectura. No hay reglas de negocio críticas en el frontend más allá de:
  - Mostrar datos correctos por tenant (multi-tenant).
  - Respeta permisos de rol para mostrar Admin vs Operario.
- **Conclusión**: No se detectan incoherencias de lógica de negocio en el comportamiento actual. Proceder con mejoras estructurales.
