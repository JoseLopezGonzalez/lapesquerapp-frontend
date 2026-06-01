# Servicios API v2 - Comunicación con el Backend

## 📚 Documentación Relacionada

- **[05-hooks-personalizados.md](./05-hooks-personalizados.md)** - Hooks que utilizan estos servicios
- **[06-context-api.md](./06-context-api.md)** - Contextos que utilizan estos servicios
- **[12-utilidades-helpers.md](./12-utilidades-helpers.md)** - Función `fetchWithTenant`

---

## 📋 Introducción

Todos los servicios que interactúan con la API v2 del backend están ubicados en `/src/services/`. Estos servicios utilizan la función `fetchWithTenant` para manejar automáticamente el multi-tenant y la autenticación.

**Importante**: Esta documentación cubre **exclusivamente** servicios que usan **API v2** (`/api/v2/`), que es la versión activa. Los servicios que aún usan API v1 están marcados como obsoletos.

---

## 🏗️ Patrón Común de Servicios

Todos los servicios siguen un patrón similar:

```javascript
import { fetchWithTenant } from '@lib/fetchWithTenant';
import { API_URL_V2 } from '@/configs/config';

export function serviceFunction(params, token) {
  return fetchWithTenant(`${API_URL_V2}endpoint`, {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json', // Solo en POST/PUT
      Authorization: `Bearer ${token}`,
      'User-Agent': navigator.userAgent,
    },
    body: JSON.stringify(data), // Solo en POST/PUT
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(errorData.message || 'Error...');
        });
      }
      return response.json();
    })
    .then((data) => {
      return data.data; // O data según el caso
    })
    .catch((error) => {
      throw error;
    });
}
```

**Características comunes**:

- Todos usan `fetchWithTenant` (multi-tenant automático)
- Todos usan `API_URL_V2` (versión activa)
- Todos requieren `token` como parámetro
- Manejo consistente de errores
- Headers estándar (Content-Type, Authorization, User-Agent)

---

## 📦 Servicios por Módulo

### 1. OrderService - Gestión de Pedidos

**Archivo**: `/src/services/orderService.js`

**Endpoints v2 utilizados**:

- `GET /api/v2/orders/{id}` - Obtener pedido
- `PUT /api/v2/orders/{id}` - Actualizar pedido
- `PUT /api/v2/orders/{id}/status?status={status}` - Cambiar estado
- `POST /api/v2/orders/{id}/incident` - Crear incidencia
- `PUT /api/v2/orders/{id}/incident` - Resolver incidencia
- `DELETE /api/v2/orders/{id}/incident` - Eliminar incidencia
- `GET /api/v2/active-orders/options` - Opciones de pedidos activos
- `GET /api/v2/statistics/orders/ranking` - Ranking de pedidos
- `GET /api/v2/orders/sales-by-salesperson` - Ventas por comercial
- `GET /api/v2/statistics/orders/total-net-weight` - Peso neto total
- `GET /api/v2/statistics/orders/total-amount` - Monto total
- `GET /api/v2/orders/sales-chart-data` - Datos de gráfico de ventas
- `GET /api/v2/orders/transport-chart-data` - Datos de gráfico de transportes
- `POST /api/v2/orders` - Crear pedido

**Endpoints v1 (obsoletos)**:

- `GET /api/v1/orders?active=true` - Obtener pedidos activos (usado en `getActiveOrders`)

#### Funciones Principales

##### `getOrder(orderId, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/orders/{orderId}`
- **Retorna**: `Promise<Object>` - Datos del pedido
- **Uso**: Obtener detalles completos de un pedido

##### `updateOrder(orderId, orderData, token)`

- **Método**: PUT
- **Endpoint**: `/api/v2/orders/{orderId}`
- **Parámetros**:
  - `orderData` - Objeto con datos a actualizar
- **Retorna**: `Promise<Object>` - Pedido actualizado

##### `setOrderStatus(orderId, status, token)`

- **Método**: PUT
- **Endpoint**: `/api/v2/orders/{orderId}/status?status={status}`
- **Parámetros**:
  - `status` - Estado nuevo (string)
- **Retorna**: `Promise<Object>` - Pedido con nuevo estado

##### `createOrder(orderData, token)`

- **Método**: POST
- **Endpoint**: `/api/v2/orders`
- **Parámetros**:
  - `orderData` - Datos del nuevo pedido
- **Retorna**: `Promise<Object>` - Pedido creado

#### Productos Planificados

##### `createOrderPlannedProductDetail(detailData, token)`

- **Método**: POST
- **Endpoint**: `/api/v2/order-planned-product-details`
- **Retorna**: `Promise<Object>` - Detalle creado

##### `updateOrderPlannedProductDetail(detailId, detailData, token)`

- **Método**: PUT
- **Endpoint**: `/api/v2/order-planned-product-details/{detailId}`

##### `deleteOrderPlannedProductDetail(detailId, token)`

- **Método**: DELETE
- **Endpoint**: `/api/v2/order-planned-product-details/{detailId}`

#### Incidencias

##### `createOrderIncident(orderId, description, token)`

- **Método**: POST
- **Endpoint**: `/api/v2/orders/{orderId}/incident`
- **Body**: `{ description: string }`

##### `updateOrderIncident(orderId, resolutionType, resolutionNotes, token)`

- **Método**: PUT
- **Endpoint**: `/api/v2/orders/{orderId}/incident`
- **Body**: `{ resolution_type: string, resolution_notes: string }`

##### `destroyOrderIncident(orderId, token)`

- **Método**: DELETE
- **Endpoint**: `/api/v2/orders/{orderId}/incident`

#### Estadísticas

##### `getOrderRankingStats(queryParams, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/statistics/orders/ranking?{queryParams}`
- **Query params**: Filtros de fecha, etc.

##### `getSalesBySalespersonStats(queryParams, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/orders/sales-by-salesperson?{queryParams}`

##### `getTotalNetWeightStats(queryParams, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/statistics/orders/total-net-weight?{queryParams}`

##### `getTotalAmountStats(queryParams, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/statistics/orders/total-amount?{queryParams}`

##### `getSalesChartData(queryParams, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/orders/sales-chart-data?{queryParams}`

##### `getTransportChartData(queryParams, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/orders/transport-chart-data?{queryParams}`

---

### 2. ProductionService - Gestión de Producción

**Archivo**: `/src/services/productionService.js`

**Estado**: ⚠️ Módulo en construcción

**Endpoints v2 utilizados**:

- `GET /api/v2/productions` - Lista de producciones
- `GET /api/v2/productions/{id}` - Obtener producción
- `POST /api/v2/productions` - Crear producción
- `PUT /api/v2/productions/{id}` - Actualizar producción
- `DELETE /api/v2/productions/{id}` - Eliminar producción
- `GET /api/v2/productions/{id}/diagram` - Diagrama de producción
- `GET /api/v2/productions/{id}/process-tree` - Árbol de procesos
- `GET /api/v2/productions/{id}/totals` - Totales de producción
- `GET /api/v2/productions/{id}/reconciliation` - Reconciliación

#### Registros de Producción

- `GET /api/v2/production-records` - Lista de registros
- `GET /api/v2/production-records/{id}` - Obtener registro
- `POST /api/v2/production-records` - Crear registro
- `PUT /api/v2/production-records/{id}` - Actualizar registro
- `DELETE /api/v2/production-records/{id}` - Eliminar registro
- `POST /api/v2/production-records/{id}/finish` - Finalizar registro

#### Inputs de Producción

- `GET /api/v2/production-inputs` - Lista de inputs
- `POST /api/v2/production-inputs` - Crear input
- `POST /api/v2/production-inputs/multiple` - Crear múltiples inputs
- `PUT /api/v2/production-inputs/{id}` - Actualizar input

#### Outputs de Producción

- `GET /api/v2/production-outputs` - Lista de outputs
- `POST /api/v2/production-outputs` - Crear output
- `PUT /api/v2/production-outputs/{id}` - Actualizar output
- `DELETE /api/v2/production-outputs/{id}` - Eliminar output
- `POST /api/v2/production-outputs/multiple` - Crear múltiples outputs
- `GET /api/v2/production-records/{id}/outputs` - Outputs de un registro

#### Consumos de Producción

- `GET /api/v2/production-output-consumptions` - Lista de consumos
- `GET /api/v2/production-output-consumptions/available-outputs/{productionRecordId}` - Outputs disponibles
- `POST /api/v2/production-output-consumptions` - Crear consumo
- `PUT /api/v2/production-output-consumptions/{id}` - Actualizar consumo
- `DELETE /api/v2/production-output-consumptions/{id}` - Eliminar consumo
- `POST /api/v2/production-output-consumptions/multiple` - Crear múltiples consumos
- `GET /api/v2/production-records/{id}/parent-output-consumptions` - Consumos padre

#### Imágenes de Registros

- `GET /api/v2/production-records/{id}/images` - Lista de imágenes
- `POST /api/v2/production-records/{id}/images` - Subir imagen
- `DELETE /api/v2/production-records/{id}/images/{imageId}` - Eliminar imagen

#### Funciones Principales

Todas las funciones siguen el patrón estándar:

- `getProductions(token, params)` - Con query params para filtros
- `getProduction(productionId, token)`
- `createProduction(productionData, token)`
- `updateProduction(productionId, productionData, token)`
- `deleteProduction(productionId, token)`

Y similares para records, inputs, outputs, consumptions, etc.

---

### 3. StoreService - Gestión de Almacenes

**Archivo**: `/src/services/storeService.js`

**Endpoints v2 utilizados**:

- `GET /api/v2/stores/{id}` - Obtener almacén
- `GET /api/v2/stores` - Lista de almacenes
- `GET /api/v2/stores/options` - Opciones de almacenes
- `GET /api/v2/statistics/stock/total` - Stock total
- `GET /api/v2/statistics/stock/total-by-species` - Stock por especies
- `GET /api/v2/stores/total-stock-by-products` - Stock por productos

#### Funciones

##### `getStore(id, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/stores/{id}`
- **Retorna**: `Promise<Object>` - Datos del almacén con posiciones y pallets

##### `getStores(token)`

- **Método**: GET
- **Endpoint**: `/api/v2/stores`
- **Retorna**: `Promise<Array>` - Lista de almacenes

##### `getStoreOptions(token)`

- **Método**: GET
- **Endpoint**: `/api/v2/stores/options`
- **Retorna**: `Promise<Array>` - Opciones para selects/combobox

##### `getTotalStockStats(token)`

- **Método**: GET
- **Endpoint**: `/api/v2/statistics/stock/total`
- **Retorna**: `Promise<Object>` - Estadísticas de stock total

##### `getStockBySpeciesStats(token)`

- **Método**: GET
- **Endpoint**: `/api/v2/statistics/stock/total-by-species`
- **Retorna**: `Promise<Array>` - Stock agrupado por especies

##### `getStockByProducts(token)`

- **Método**: GET
- **Endpoint**: `/api/v2/stores/total-stock-by-products`
- **Retorna**: `Promise<Array>` - Stock agrupado por productos

---

### 4. PalletService - Gestión de Pallets

**Archivo**: `/src/services/palletService.ts`

**Endpoints v2 utilizados**:

- `GET /api/v2/pallets/{id}` - Obtener pallet
- `GET /api/v2/pallets/{id}/timeline` - Obtener historial de modificaciones del palet (véase [pallet-timeline-api.md](../implementaciones/pallet-timeline-api.md))
- `PUT /api/v2/pallets/{id}` - Actualizar pallet
- `POST /api/v2/pallets` - Crear pallet
- `POST /api/v2/pallets/assign-to-position` - Asignar a posición
- `POST /api/v2/pallets/move-to-store` - Mover a almacén
- `DELETE /api/v2/pallets/{id}/unassign-position` - Quitar posición
- `PUT /api/v2/pallets/{id}` - Actualizar pallet
- `DELETE /api/v2/pallets/{id}/unlink-order` - Desvincular de pedido

#### Funciones

##### `getPallet(palletId, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/pallets/{palletId}`
- **Retorna**: `Promise<Object>` - Datos del pallet con cajas

##### `getPalletTimeline(palletId, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/pallets/{palletId}/timeline`
- **Retorna**: `Promise<PalletTimelineResponse>` - `{ timeline: PalletTimelineEntry[] }` (eventos más recientes primero). Especificación completa en [docs/implementaciones/pallet-timeline-api.md](../implementaciones/pallet-timeline-api.md).

##### `updatePallet(palletId, palletData, token)`

- **Método**: PUT
- **Endpoint**: `/api/v2/pallets/{palletId}`
- **Body**: Datos del pallet a actualizar

##### `createPallet(palletData, token)`

- **Método**: POST
- **Endpoint**: `/api/v2/pallets`
- **Body**: Datos del nuevo pallet

##### `assignPalletToPosition(palletId, positionId, token)`

- **Método**: POST
- **Endpoint**: `/api/v2/pallets/assign-to-position`
- **Body**: `{ pallet_id: number, position_id: string }`

##### `movePalletToStore(palletId, storeId, token)`

- **Método**: POST
- **Endpoint**: `/api/v2/pallets/move-to-store`
- **Body**: `{ pallet_id: number, store_id: number }`

##### `removePalletPosition(palletId, token)`

- **Método**: DELETE
- **Endpoint**: `/api/v2/pallets/{palletId}/unassign-position`

##### `unlinkPalletFromOrder(palletId, token)`

- **Método**: DELETE
- **Endpoint**: `/api/v2/pallets/{palletId}/unlink-order`

---

### 5. CustomerService - Gestión de Clientes

**Archivo**: `/src/services/customerService.js`

**Endpoints v2 utilizados**:

- `GET /api/v2/customers/options` - Opciones de clientes
- `GET /api/v2/customers/{id}` - Obtener cliente

#### Funciones

##### `getCustomersOptions(token)`

- **Método**: GET
- **Endpoint**: `/api/v2/customers/options`
- **Retorna**: `Promise<Array>` - Opciones para selects

##### `getCustomer(id, token)`

- **Método**: GET
- **Endpoint**: `/api/v2/customers/{id}`
- **Retorna**: `Promise<Object>` - Datos del cliente

---

### 6. ProductService - Gestión de Productos

**Archivo**: `/src/services/productService.js`

**Endpoints v2 utilizados**:

- `GET /api/v2/products/options` - Opciones de productos

#### Funciones

##### `getProductOptions(token)`

- **Método**: GET
- **Endpoint**: `/api/v2/products/options`
- **Retorna**: `Promise<Array>` - Opciones de productos

---

### 7. LabelService - Sistema de Etiquetas

**Archivo**: `/src/services/labelService.js`

**Endpoints v2 utilizados**:

- `GET /api/v2/labels/{id}` - Obtener etiqueta
- `GET /api/v2/labels` - Lista de etiquetas
- `POST /api/v2/labels` - Crear etiqueta
- `PUT /api/v2/labels/{id}` - Actualizar etiqueta
- `DELETE /api/v2/labels/{id}` - Eliminar etiqueta
- `GET /api/v2/labels/options` - Opciones de etiquetas

#### Funciones

##### `getLabel(labelId, token)`

- **Método**: GET
- **Retorna**: `Promise<Object>` - Datos de la etiqueta

##### `getLabels(token)`

- **Método**: GET
- **Retorna**: `Promise<Array>` - Lista de etiquetas

##### `createLabel(labelName, labelFormat, token)`

- **Método**: POST
- **Body**: `{ name: string, format: string }`

##### `updateLabel(labelId, labelName, labelFormat, token)`

- **Método**: PUT
- **Body**: `{ name: string, format: string }`

##### `deleteLabel(labelId, token)`

- **Método**: DELETE

##### `getLabelsOptions(token)`

- **Método**: GET
- **Retorna**: `Promise<Array>` - Opciones para selects

---

### 8. SettingsService - Configuraciones

**Archivo**: `/src/services/settingsService.js`

**Endpoints v2 utilizados**:

- `GET /api/v2/settings` - Obtener configuraciones
- `PUT /api/v2/settings` - Actualizar configuraciones

#### Funciones

##### `getSettings()`

- **Método**: GET
- **Endpoint**: `/api/v2/settings`
- **Nota**: Obtiene token automáticamente con `getSession()`
- **Retorna**: `Promise<Object>` - Configuraciones del sistema

##### `updateSettings(data)`

- **Método**: PUT
- **Endpoint**: `/api/v2/settings`
- **Body**: Objeto con configuraciones a actualizar
- **Nota**: Obtiene token automáticamente con `getSession()`

---

### 9. Servicios de Opciones (Selects/Combobox)

Estos servicios proporcionan opciones para componentes Select y Combobox:

#### SalespersonService

- **Archivo**: `/src/services/salespersonService.js`
- **Endpoint**: `GET /api/v2/salespeople/options`
- **Función**: `getSalespeopleOptions(token)`

#### TransportService

- **Archivo**: `/src/services/transportService.js`
- **Endpoint**: `GET /api/v2/transports/options`
- **Función**: `getTransportsOptions(token)`

#### PaymentTernService

- **Archivo**: `/src/services/paymentTernService.js`
- **Endpoint**: `GET /api/v2/payment-terms/options`
- **Función**: `getPaymentTermsOptions(token)`

#### IncotermService

- **Archivo**: `/src/services/incotermService.js`
- **Endpoint**: `GET /api/v2/incoterms/options`
- **Función**: `getIncotermsOptions(token)`

#### TaxService

- **Archivo**: `/src/services/taxService.js`
- **Endpoint**: `GET /api/v2/taxes/options`
- **Función**: `getTaxOptions(token)`

#### SpeciesService

- **Archivo**: `/src/services/speciesService.js`
- **Endpoint**: `GET /api/v2/species/options`
- **Función**: `getSpeciesOptions(token)`

#### ProductCategoryService

- **Archivo**: `/src/services/productCategoryService.js`
- **Endpoints**:
  - `GET /api/v2/product-categories/options`
  - `GET /api/v2/product-categories`
  - `POST /api/v2/product-categories`
  - `GET /api/v2/product-categories/{id}`
  - `PUT /api/v2/product-categories/{id}`
  - `DELETE /api/v2/product-categories/{id}`

#### ProductFamilyService

- **Archivo**: `/src/services/productFamilyService.js`
- **Endpoints similares a ProductCategoryService**

---

### 10. AutocompleteService - Autocompletado Genérico

**Archivo**: `/src/services/autocompleteService.js`

**Funciones**:

##### `fetchAutocompleteFilterOptions(endpoint)`

- **Método**: GET
- **Endpoint**: `/api/v2/{endpoint}` (dinámico)
- **Nota**: Obtiene token automáticamente con `getSession()`
- **Retorna**: `Promise<Array<{value: any, label: string}>>`
- **Uso**: Para filtros de autocompletado
- **Formato**: Elimina duplicados y mapea a `{value: id, label: name}`

**Nota**: La función `fetchAutocompleteInputOptions` ha sido eliminada. Se debe usar `fetchAutocompleteFilterOptions` en su lugar, que retorna el formato `{value, label}` compatible con el componente `Combobox` de Shadcn.

---

### 11. EntityService - Sistema Genérico de Entidades

**Archivo**: `/src/services/entityService.js`

**Funciones genéricas** para el sistema de entidades dinámicas:

##### `fetchEntities(url)`

- **Método**: GET
- **Endpoint**: URL completa (debe incluir `/api/v2/...`)
- **Nota**: Obtiene token automáticamente
- **Retorna**: `Promise<Object>` - Respuesta JSON completa
- **Uso**: Para listar entidades genéricas

##### `deleteEntity(url, body)`

- **Método**: DELETE
- **Endpoint**: URL completa
- **Body**: Opcional
- **Retorna**: `Promise<Response>`

##### `performAction(url, method, body)`

- **Método**: Dinámico (GET, POST, PUT, DELETE)
- **Endpoint**: URL completa
- **Body**: Opcional
- **Retorna**: `Promise<Response>`

**Archivos relacionados**:

- `createEntityService.js` - Creación genérica
- `editEntityService.js` - Edición genérica

---

### 12. Servicios de Estadísticas y Gráficos

#### Raw Material Reception

- **Archivo**: `/src/services/rawMaterialReception/getReceptionChartData.js`
- **Endpoint**: `GET /api/v2/raw-material-receptions/reception-chart-data?{queryParams}`

#### Cebo Dispatch

- **Archivo**: `/src/services/ceboDispatch/getDispatchChartData.js`
- **Endpoint**: `GET /api/v2/cebo-dispatches/dispatch-chart-data?{queryParams}`

---

## 🔄 Manejo de Errores

### Patrón Estándar

Todos los servicios siguen este patrón de manejo de errores:

```javascript
.then((response) => {
  if (!response.ok) {
    return response.json().then((errorData) => {
      throw new Error(errorData.message || 'Error genérico');
    });
  }
  return response.json();
})
.catch((error) => {
  throw error; // Re-lanza para manejo en componente
});
```

### Errores de Autenticación

Los errores de autenticación (401, 403) son interceptados por:

- `AuthErrorInterceptor` (componente)
- `fetchWithTenant` (función base)

Ambos redirigen automáticamente al login.

---

## 📊 Estructura de Respuestas

### Respuestas Exitosas

La mayoría de endpoints retornan:

```json
{
  "data": { ... } // Datos reales
}
```

Por eso los servicios hacen:

```javascript
.then((data) => {
  return data.data; // Extrae solo los datos
})
```

Algunos endpoints (como opciones) retornan directamente el array:

```javascript
.then((data) => {
  return data; // Sin extraer .data
})
```

### Respuestas de Error

```json
{
  "message": "Mensaje de error descriptivo"
}
```

---

## 🎯 Uso en Componentes

### Ejemplo Básico

```javascript
import { getOrder } from '@/services/orderService';
import { useSession } from 'next-auth/react';

function OrderComponent({ orderId }) {
  const { data: session } = useSession();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!session?.user?.accessToken) return;

    getOrder(orderId, session.user.accessToken)
      .then(setOrder)
      .catch((error) => {
        toast.error(error.message);
      });
  }, [orderId, session]);

  // ...
}
```

### Ejemplo con Hook

```javascript
// En un hook personalizado
export function useOrder(orderId) {
  const { data: session } = useSession();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!session?.user?.accessToken) return;

    getOrder(orderId, session.user.accessToken).then(setOrder).catch(setError);
  }, [orderId, session]);

  return { order, loading, error };
}
```

---

## 📈 Estadísticas

Según análisis del código:

- **~91 funciones exportadas** en servicios
- **18 archivos de servicios** principales
- **Todos usan API v2** excepto algunas funciones obsoletas en `orderService.js`

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. Uso de API v1 en orderService

- **Archivo**: `/src/services/orderService.js`
- **Línea**: 94
- **Problema**: `getActiveOrders()` usa `API_URL_V1` en lugar de v2
- **Impacto**: Inconsistencia, uso de API obsoleta
- **Recomendación**: Migrar a v2 o marcar como deprecated

### 2. Comentarios Incorrectos en Servicios

- **Archivo**: Múltiples servicios
- **Problema**: Comentarios JSDoc que dicen "pedido" en servicios de otros módulos (customerService, palletService, etc.)
- **Impacto**: Confusión al leer código
- **Recomendación**: Corregir comentarios para que reflejen el módulo correcto

### 3. Inconsistencia en Extracción de Datos

- **Archivo**: Múltiples servicios
- **Problema**: Algunos servicios retornan `data.data`, otros retornan `data` directamente
- **Impacto**: Inconsistencia, posible confusión
- **Recomendación**: Estandarizar (preferiblemente siempre extraer `data.data` si existe)

### 4. Falta de Validación de Parámetros

- **Archivo**: Todos los servicios
- **Problema**: No se valida que `token` exista antes de hacer fetch
- **Impacto**: Errores en tiempo de ejecución si token es undefined
- **Recomendación**: Validar token al inicio de cada función o usar función helper

### 5. SettingsService con getSession() Interno

- **Archivo**: `/src/services/settingsService.js`
- **Línea**: 5-6, 21-22
- **Problema**: Obtiene sesión internamente, diferente a otros servicios que reciben token
- **Impacto**: Inconsistencia en patrón
- **Recomendación**: Estandarizar (recibir token como parámetro o todos obtenerlo internamente)

### 6. AutocompleteService con getSession() Interno

- **Archivo**: `/src/services/autocompleteService.js`
- **Problema**: Similar a SettingsService, obtiene sesión internamente
- **Impacto**: Inconsistencia
- **Recomendación**: Estandarizar patrón

### 7. EntityService Lanza Response en lugar de Error

- **Archivo**: `/src/services/entityService.js`
- **Línea**: 21, 37, 50
- **Problema**: Lanza `response` directamente en lugar de `Error`
- **Impacto**: Manejo de errores inconsistente
- **Recomendación**: Lanzar Error con mensaje extraído de response

### 8. Falta de Timeout en Requests

- **Archivo**: Todos los servicios
- **Problema**: No hay timeout configurado en fetch
- **Impacto**: Requests pueden colgarse indefinidamente
- **Recomendación**: Implementar timeout (ej: AbortController con timeout)

### 9. Falta de Retry Logic

- **Archivo**: Todos los servicios
- **Problema**: No hay lógica de reintento para errores transitorios
- **Impacto**: Errores temporales de red causan fallos inmediatos
- **Recomendación**: Considerar implementar retry para errores 5xx

### 10. Headers Comentados en storeService

- **Archivo**: `/src/services/storeService.js`
- **Línea**: 14, 44
- **Problema**: `'Content-Type': 'application/json'` está comentado
- **Impacto**: Inconsistencia, posible problema si backend lo requiere
- **Recomendación**: Descomentar o documentar por qué está comentado

### 11. Falta de TypeScript

- **Archivo**: Todos los servicios
- **Problema**: Sin tipos, no hay validación de parámetros ni retornos
- **Impacto**: Errores en tiempo de ejecución, menos productividad
- **Recomendación**: Migrar a TypeScript o añadir PropTypes/JSDoc más completo

### 12. User-Agent en Todos los Requests

- **Archivo**: Todos los servicios
- **Problema**: Se envía `navigator.userAgent` en todos los requests (incluso en servidor)
- **Impacto**: Puede fallar en SSR si `navigator` no existe
- **Recomendación**: Validar que `navigator` exista antes de usarlo o usar valor por defecto
