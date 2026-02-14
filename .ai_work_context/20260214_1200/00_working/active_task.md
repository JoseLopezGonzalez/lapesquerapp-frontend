# Tarea activa

**Estado**: En ejecución

**Fase actual**: Sub-bloque 3 completado — StatusBadge

**Próximo paso**: Usuario indica siguiente sub-bloque (4, 5 o 6)

**Bloque seleccionado**: Ventas

**Scope propuesto**:
- OrdersManager, OrdersList, Order, CreateOrderForm
- Order + 12 subsecciones (OrderPallets, OrderCustomerHistory, OrderDetails, etc.)
- Hooks: useOrder, useOrderForm*, useOrderCreateFormConfig
- Contextos: OrderContext, OrdersManagerOptionsContext
- Servicios: orderService
- Rutas: /admin/orders-manager, /admin/orders, /admin/orders/[id], /admin/orders/create
- EntityClient (orders): incluido
- Dashboard sales: excluido (bloque Informes)
