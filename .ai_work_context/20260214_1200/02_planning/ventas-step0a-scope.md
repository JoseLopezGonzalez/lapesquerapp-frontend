# STEP 0a — Block Scope & Entity Mapping: Ventas

**Bloque seleccionado**: Ventas (Pedidos)  
**Fecha**: 2026-02-14  
**Estado**: ✅ Confirmado por el usuario (2026-02-14)

**Decisiones del usuario**:
- 1. **No incluir** componentes de Dashboard (SalesChart, OrderRanking, etc.) en este bloque
- 2. **Incluir** EntityClient (orders) en el scope
- 3. Scope confirmado

---

## Entidades del bloque Ventas

| Entidad | Descripción | Componentes principales |
|---------|-------------|-------------------------|
| **OrdersManager** | Gestor de pedidos activos (lista + detalle + crear) | `OrdersManager`, `OrdersList`, `Order`, `CreateOrderForm` |
| **OrdersList** | Lista de pedidos con filtros y búsqueda | `OrdersList`, `OrderCard`, `OrdersListFiltersSheet` |
| **Order** | Vista de detalle de un pedido | `Order` + 12 subsecciones (tabs/cards) |
| **CreateOrderForm** | Formulario de creación de pedidos | `CreateOrderForm`, `CreateOrderFormMobile` |
| **EntityClient (orders)** | Lista genérica de pedidos (admin/[entity]) | `EntityClient` con config `orders` |

---

## Artefactos por tipo

### Páginas / Rutas

| Ruta | Archivo | Tipo | Componente |
|------|---------|------|------------|
| `/admin/orders-manager` | `app/admin/orders-manager/page.js` | Client | OrdersManager + OrdersManagerOptionsProvider |
| `/admin/orders` | `app/admin/[entity]/page.js` | Server | EntityClient (config: orders) |
| `/admin/orders/[id]` | `app/admin/orders/[id]/page.js` | Server | OrderClient |
| `/admin/orders/[id]` | `app/admin/orders/[id]/OrderClient.js` | Client | Order |
| `/admin/orders/create` | `app/admin/orders/create/page.js` | Client | CreateOrderForm |

### Componentes principales (Ventas)

| Componente | Archivo | Líneas | Nota |
|------------|---------|--------|------|
| OrdersManager | `OrdersManager/index.js` | 411 | P1 (>150) |
| Order | `Order/index.js` | 681 | P0 (>200) |
| OrdersList | `OrdersList/index.js` | 427 | P1 (>150) |
| OrderCard | `OrdersList/OrderCard/index.js` | — | — |
| OrdersListFiltersSheet | `OrdersList/OrdersListFiltersSheet.jsx` | — | — |
| CreateOrderForm | `CreateOrderForm/index.js` | 494 | P1 (>150) |
| CreateOrderFormMobile | `CreateOrderForm/CreateOrderFormMobile.jsx` | 613 | P1 (>150) |
| ProductionView | `ProductionView/index.js` | — | Vista alterna |

### Subcomponentes de Order (detalle)

| Componente | Archivo | Líneas | Nota |
|------------|---------|--------|------|
| OrderDetails | `Order/OrderDetails/index.js` | 408 | P1 (>150) |
| OrderEditSheet | `Order/OrderEditSheet/index.js` | 373 | P1 (>150) |
| OrderPlannedProductDetails | `Order/OrderPlannedProductDetails/index.js` | 657 | P1 (>150) |
| OrderProductDetails | `Order/OrderProductDetails/index.js` | 228 | — |
| OrderProduction | `Order/OrderProduction/index.js` | 293 | P1 (>150) |
| OrderPallets | `Order/OrderPallets/index.js` | **1475** | **P0 crítico (>200)** |
| OrderLabels | `Order/OrderLabels/index.js` | 597 | P1 (>150) |
| OrderDocuments | `Order/OrderDocuments/index.js` | 516 | P1 (>150) |
| OrderExport | `Order/OrderExport/index.js` | 154 | — |
| OrderMap | `Order/OrderMap/index.js` | 39 | — |
| OrderIncident | `Order/OrderIncident/index.js` | 279 | P1 (>150) |
| OrderCustomerHistory | `Order/OrderCustomerHistory/index.js` | **1225** | **P0 crítico (>200)** |
| OrderSkeleton | `Order/OrderSkeleton/index.js` | 84 | — |

### Hooks

| Hook | Archivo | Uso |
|------|---------|-----|
| useOrder | `hooks/useOrder.js` | Datos de pedido individual (OrderContext) |
| useOrderCreateFormConfig | `hooks/useOrderCreateFormConfig.js` | Config del formulario de creación |
| useOrderFormConfig | `hooks/useOrderFormConfig.js` | Config del formulario |
| useOrderFormOptions | `hooks/useOrderFormOptions.js` | Opciones (clientes, productos, etc.) |

### Contextos

| Contexto | Archivo | Uso |
|----------|---------|-----|
| OrderContext | `context/OrderContext.js` | Estado del pedido seleccionado (usa useOrder) |
| OrdersManagerOptionsContext | `context/gestor-options/OrdersManagerOptionsContext.js` | productOptions, taxOptions para gestor |

### Servicios

| Servicio | Archivo | Funciones principales |
|----------|---------|------------------------|
| orderService | `services/orderService.js` | getOrder, getActiveOrders, createOrder, updateOrder, setOrderStatus, incidencias, estadísticas, etc. |
| orderService (domain) | `services/domain/orders/orderService.js` | Wrapper/adapter del orderService principal |

### Tipos / Interfaces

- **Ninguno** — Proyecto en JavaScript, sin TypeScript

### Tests existentes

- **Ninguno** específico de Ventas/Orders
- Proyecto: 3 archivos de test en total (receptionCalculations, receptionTransformations, home)

### Configuración

| Archivo | Uso |
|---------|-----|
| `configs/entitiesConfig.js` | Config `orders` (endpoints, exports, emptyState, etc.) |
| `configs/navgationConfig.js` | Navegación a orders, orders-manager |

---

## Componentes de Dashboard relacionados (reportes de ventas)

*Opcional: evaluar si incluirlos en el scope o en bloque "Informes"*

| Componente | Archivo | API orderService |
|------------|---------|------------------|
| SalesChart | `Dashboard/SalesChart/index.js` | getSalesChartData |
| SalesBySalespersonPieChart | `Dashboard/SalesBySalespersonPieChart/index.js` | getSalesBySalesperson |
| OrderRanking | `Dashboard/OrderRanking/index.js` | getOrderRankingStats |
| TotalAmountSoldCard | `Dashboard/TotalAmountSoldCard/index.js` | getOrdersTotalAmountStats |
| TotalQuantitySoldCard | `Dashboard/TotalQuantitySoldCard/index.js` | getOrdersTotalNetWeightStats |
| TransportRadarChart | `Dashboard/TransportRadarChart/index.js` | getTransportChartData |

---

## Resumen de alcance propuesto

**Incluido en scope Ventas:**
- OrdersManager (lista + detalle + crear)
- Order y todas sus subsecciones
- CreateOrderForm (desktop + mobile)
- Hooks useOrder, useOrderForm*, useOrderCreateFormConfig
- Contextos OrderContext, OrdersManagerOptionsContext
- Servicios orderService
- Rutas /admin/orders-manager, /admin/orders, /admin/orders/[id], /admin/orders/create
- EntityClient con config orders (lista genérica)

**Excluido del scope Ventas (bloque Informes):**
- SalesChart, SalesBySalespersonPieChart, OrderRanking, TotalAmountSoldCard, TotalQuantitySoldCard, TransportRadarChart

---

## Puntos críticos identificados (auditoría + tamaño)

| Prioridad | Componente | Problema |
|-----------|------------|----------|
| P0 | OrderPallets | **1475 líneas** — Bloqueador crítico |
| P0 | OrderCustomerHistory | **1225 líneas** — Bloqueador crítico |
| P0 | Order | **681 líneas** — Bloqueador crítico |
| P1 | OrdersManager, OrderPlannedProductDetails, CreateOrderForm, CreateOrderFormMobile, OrderLabels, OrderDocuments, OrderDetails, OrderProduction, OrderIncident, OrderEditSheet, OrdersList | >150 líneas |
| P1 | Data fetching | useEffect + useState, sin React Query |
| P1 | TypeScript | Todo en JavaScript |
| P0 | Tests | Ningún test para servicios/hooks/componentes de Ventas |

---

## Confirmación

✅ **Confirmado por el usuario**:
- Dashboard (SalesChart, OrderRanking, etc.): **No incluir** (bloque Informes)
- EntityClient (orders): **Incluir** en el scope
