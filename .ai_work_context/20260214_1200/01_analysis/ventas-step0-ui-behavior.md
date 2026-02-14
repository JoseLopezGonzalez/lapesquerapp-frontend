# STEP 0 — Documentación del comportamiento UI actual: Ventas

**Bloque**: Ventas  
**Fecha**: 2026-02-14  
**Estado**: Completado

---

## 1. Estados de UI

### OrdersManager (lista de pedidos activos)

| Estado | Descripción | Transición |
|--------|-------------|------------|
| **loading** | Loader mientras se cargan pedidos activos | Inicial; `getActiveOrders(token)` en curso |
| **empty** | No hay pedidos según filtros | `orders.length === 0` tras filtrado |
| **error** | Error al cargar pedidos | Catch de `getActiveOrders`; toast + botón reintentar |
| **populated** | Lista de pedidos mostrada | Datos cargados y filtrados |
| **selected** | Pedido seleccionado → detalle visible | Click en OrderCard o crear nuevo |
| **creating** | Formulario de crear pedido visible | Click "Crear pedido" |
| **production** | Vista cocina (ProductionView) | Toggle vista normal ↔ producción |

### OrdersList

| Estado | Descripción |
|--------|-------------|
| loading | Spinner durante exportación xlsx |
| error | Mensaje de error + botón reintentar |
| populated | Tabs (Todos, Hoy, Mañana, En producción, Terminados) + OrderCards |
| filtered | Búsqueda por cliente/ID; categoría activa |

### Order (detalle de pedido)

| Estado | Descripción |
|--------|-------------|
| loading | OrderSkeleton o Loader mientras `getOrder(orderId)` |
| error | Mensaje de error (no hay reintento explícito en Order) |
| populated | Tabs: Información, Previsión, Detalle productos, Producción, Palets, Etiquetas, Envío documentos, Descargas, Ruta, Incidencia, Histórico |
| editing | OrderEditSheet abierto |

### CreateOrderForm

| Estado | Descripción |
|--------|-------------|
| idle | Formulario vacío |
| submitting | Envío a API `createOrder` |
| success | Redirección a pedido creado |
| error | Errores de validación (Zod) o backend 422 |

---

## 2. Interacciones del usuario

| Acción | Componente | Resultado |
|--------|------------|-----------|
| Click en OrderCard | OrdersList | Selecciona pedido; muestra Order en panel derecho (desktop) o pantalla completa (mobile) |
| Click en tab categoría | OrdersList | Filtra por Todos/Hoy/Mañana/En producción/Terminados |
| Búsqueda (input) | OrdersList | Debounce 300ms; filtra por `customer.name` o `order.id` |
| Click "Crear pedido" | OrdersManager | Muestra CreateOrderForm; oculta lista en mobile |
| Toggle vista cocina | OrdersManager | Cambia a ProductionView; cierra detalle |
| Cerrar detalle (mobile) | Order | Vuelve a lista (OrderCard) |
| Editar pedido (OrderEditSheet) | Order | Abre sheet; al guardar actualiza Order y lista vía onChange |
| Cambiar tab en Order | Order | Carga lazy de subcomponentes (OrderPallets, OrderLabels, etc.) |
| Exportar xlsx activos | OrdersList | `fetchWithTenant` directo; toast success/error |
| Vincular/desvincular palets | OrderPallets | useOrder callbacks; actualiza order; recarga lista |

---

## 3. Flujo de datos

| Origen | Destino | Mecanismo |
|--------|---------|-----------|
| `getActiveOrders(token)` | OrdersManager `orders` | useEffect + useState; sin React Query |
| `getOrder(orderId, token)` | useOrder → OrderContext | useEffect en useOrder; cache manual con Map |
| OrderContext | Order, OrderDetails, OrderPallets, etc. | useOrderContext() |
| onChange(updatedOrder) | OrdersManager | Actualiza lista local o recarga con `reloadOrders()` |
| OrdersManagerOptionsContext | useOrder, CreateOrderForm | productOptions, taxOptions (evita duplicar fetches) |
| EntityClient (orders) | Config `orders` en entitiesConfig | Fetch genérico vía EntityClient; endpoint `orders` |

---

## 4. Reglas de validación

| Formulario / Acción | Validación |
|---------------------|------------|
| CreateOrderForm | react-hook-form + zod (config en useOrderCreateFormConfig); backend 422 como fallback |
| OrderEditSheet | react-hook-form + zod; backend 422 |
| OrderDetails (editar datos) | Validación en formulario; backend 422 |
| OrderPlannedProductDetails | Validación en UI; backend al crear/actualizar/eliminar |
| Vincular palets | Comprueba `orderId`; backend valida permisos |

---

## 5. Permisos

- Middleware valida token y tenant
- Roles: `roleConfig` define qué rutas/acciones por rol
- No se ha revisado lógica de permisos por acción (crear, editar, eliminar) dentro de Ventas

---

## 6. Manejo de errores

| Componente | Comportamiento |
|------------|----------------|
| OrdersManager | Toast en error de getActiveOrders; setError; botón reintentar llama reloadOrders |
| useOrder | setError en catch; no hay UI de reintento en Order (el usuario debe navegar de nuevo) |
| CreateOrderForm | Errores Zod en campos; toast en error de API |
| OrderPallets, OrderDocuments, etc. | Toast en error; throw para que el caller maneje |
| fetchWithTenant | 401/403 → logout; apiHelpers.getErrorMessage para mensajes |

---

## Validación de checkpoint

**¿El comportamiento actual de la UI coincide con las reglas de negocio documentadas?**

- Sí, según la documentación existente (ANALISIS_OrdersManager, docs). No se han detectado inconsistencias obvias de lógica de negocio en esta fase.
- Pendiente: confirmar con usuario si hay reglas de negocio no documentadas (ej. quién puede crear/editar/eliminar).
