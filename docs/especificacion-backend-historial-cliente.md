# Especificación Backend - Historial de Cliente

## Endpoint

```
GET /api/v2/customers/{customer_id}/order-history
```

### Autenticación
- Requiere token Bearer en el header `Authorization`
- Requiere header `User-Agent` (opcional pero recomendado)

### Parámetros de URL
- `customer_id` (requerido): ID del cliente

### Parámetros de Query (Opcionales)

El backend soporta múltiples formas de filtrar el período de datos:

#### Opción 1: Por rango de fechas (recomendado para el frontend)
- `date_from` (string, opcional): Fecha de inicio en formato `YYYY-MM-DD`
- `date_to` (string, opcional): Fecha de fin en formato `YYYY-MM-DD`
- Si ambos están presentes, filtra por ese rango (inclusive)
- **Comportamiento**: Solo devuelve pedidos con `load_date` entre esas fechas
- **Totales**: Se calculan solo del período filtrado

#### Opción 2: Por año específico
- `year` (integer, opcional): Año específico (ej: `2025`)
- Si se envía, devuelve todos los datos de ese año
- **Comportamiento**: Solo devuelve pedidos del año especificado
- **Totales**: Se calculan solo de ese año

#### Opción 3: Por tipo de período
- `period` (string, opcional): Tipo de período relativo a la fecha actual
  - `month`: Solo mes actual
  - `quarter`: Solo trimestre actual
  - `year`: Solo año actual
- **Comportamiento**: Calcula el período automáticamente desde la fecha actual
- **Totales**: Se calculan solo del período actual

#### Sin filtros
- Si no se envía ningún parámetro, devuelve todos los datos históricos

#### Ejemplos de URLs:
```
GET /api/v2/customers/123/order-history?date_from=2025-01-01&date_to=2025-12-31
GET /api/v2/customers/123/order-history?date_from=2025-06-01&date_to=2025-06-30
GET /api/v2/customers/123/order-history?year=2025
GET /api/v2/customers/123/order-history?period=month
GET /api/v2/customers/123/order-history?period=quarter
GET /api/v2/customers/123/order-history?period=year
GET /api/v2/customers/123/order-history  (sin filtros, devuelve todo)
```

#### Nota sobre el Frontend
El frontend actualmente usa **Opción 1 (rango de fechas)** porque necesita flexibilidad para:
- Mes pasado (no mes actual)
- Trimestre pasado (no trimestre actual)
- Años específicos seleccionados por el usuario

### Respuesta con Años Disponibles

La respuesta debe incluir también los años disponibles en el historial completo (independientemente del filtro aplicado).

**IMPORTANTE**: El campo `available_years` siempre se calcula desde **TODOS** los pedidos históricos (sin aplicar filtros), para que el frontend pueda mostrar todos los años disponibles en los tabs/selector, independientemente del período que esté visualizando.

---

## Respuesta Esperada

### Estructura de Respuesta

```json
{
  "message": "Historial de pedidos del cliente obtenido correctamente.",
  "data": [
    {
      "product": {
        "id": 104,
        "name": "Pulpo Fresco Rizado",
        "a3erpCode": "10039",
        "facilcomCode": null,
        "species_id": 1
      },
      "total_boxes": 8393,
      "total_net_weight": 41965,
      "average_unit_price": 7.46,
      "last_order_date": "2026-02-06",
      "total_amount": 312938,
      "lines": [
        {
          "order_id": 2416,
          "formatted_id": "#02416",
          "load_date": "2026-02-06",
          "boxes": 40,
          "net_weight": 200,
          "unit_price": "12.75",
          "subtotal": 2550,
          "total": 2550
        }
        // ... más líneas de pedido
      ]
    }
    // ... más productos
  ]
}
```

---

## Especificación de Campos

### Nivel Raíz
- `message` (string, requerido): Mensaje descriptivo de la operación
- `available_years` (array de integers, requerido): Array de años disponibles en el historial completo del cliente, ordenados descendente (más reciente primero)
  - Ejemplo: `[2026, 2025, 2024, 2023]`
  - Se calcula desde TODOS los pedidos históricos, no solo los del período filtrado
  - Se usa para mostrar tabs condicionalmente y el selector de años
- `data` (array, requerido): Array de objetos de producto con su historial (filtrado según parámetros de query)

### Objeto Producto (cada elemento del array `data`)

#### `product` (object, requerido)
Información del producto:
- `id` (integer, requerido): ID único del producto
- `name` (string, requerido): Nombre del producto
- `a3erpCode` (string|null, opcional): Código A3ERP del producto
- `facilcomCode` (string|null, opcional): Código Facilcom del producto
- `species_id` (integer, opcional): ID de la especie

#### `total_boxes` (integer, requerido)
Total de cajas vendidas del producto en todo el historial

#### `total_net_weight` (number, requerido)
Peso neto total vendido del producto en todo el historial (en kg)

#### `average_unit_price` (number, requerido)
Precio unitario promedio del producto (total_amount / total_net_weight)

#### `last_order_date` (string, requerido)
Fecha del último pedido del producto en formato ISO 8601: `YYYY-MM-DD`
- Ejemplo: `"2026-02-06"`

#### `total_amount` (number, requerido)
Importe total vendido del producto en todo el historial (en la moneda del sistema)

#### `lines` (array, requerido)
Array de líneas de pedido del producto, ordenadas por fecha descendente (más reciente primero)

### Objeto Línea de Pedido (cada elemento del array `lines`)

#### `order_id` (integer, requerido)
ID único del pedido

#### `formatted_id` (string, requerido)
ID del pedido formateado para mostrar (ej: "#02416", "ORD-2026-001")

#### `load_date` (string, requerido)
Fecha de carga del pedido en formato ISO 8601: `YYYY-MM-DD`
- Ejemplo: `"2026-02-06"`
- **IMPORTANTE**: Este campo se usa para:
  - Filtrar por períodos (mes, trimestre, año)
  - Calcular años disponibles para mostrar tabs
  - Ordenar cronológicamente

#### `boxes` (integer, requerido)
Número de cajas en esta línea de pedido

#### `net_weight` (number, requerido)
Peso neto en esta línea de pedido (en kg)

#### `unit_price` (string|number, requerido)
Precio unitario por kg en esta línea de pedido
- Puede ser string o number
- Ejemplo: `"12.75"` o `12.75`

#### `subtotal` (number, requerido)
Subtotal de esta línea de pedido (antes de impuestos/descuentos)

#### `total` (number, requerido)
Total de esta línea de pedido (después de impuestos/descuentos)

---

## Comportamiento del Frontend

El frontend utiliza estos datos de la siguiente manera:

1. **Años disponibles**: Usa el array `available_years` de la respuesta para:
   - Mostrar tabs condicionalmente (año actual, año pasado)
   - Mostrar selector de años más antiguos
   - **IMPORTANTE**: `available_years` debe calcularse desde TODOS los pedidos históricos, no solo los del período filtrado

2. **Datos filtrados**: El backend devuelve solo los datos del período solicitado en `data`
   - Si se envía `date_from` y `date_to`, solo devuelve líneas dentro de ese rango
   - Si se envía `year`, solo devuelve líneas de ese año
   - Si no se envía ningún parámetro, devuelve todos los datos históricos

3. **Cálculo de métricas**: El backend puede calcular los totales por producto para el período filtrado:
   - `total_boxes`: Suma de `boxes` de líneas del período
   - `total_net_weight`: Suma de `net_weight` de líneas del período
   - `total_amount`: Suma de `total` de líneas del período
   - `average_unit_price`: `total_amount / total_net_weight`

4. **Cálculo de tendencias**: El frontend compara el peso neto del período actual vs período anterior del mismo rango
   - Para esto, el frontend hace dos llamadas: una para el período actual y otra para el período anterior

---

## Requisitos Importantes

### ✅ Filtrado en Backend
- El backend debe filtrar los datos según los parámetros de query enviados
- Si se envía `date_from` y `date_to`, solo devolver líneas dentro de ese rango
- Si se envía `year`, solo devolver líneas de ese año
- Si no se envía ningún parámetro, devolver todos los datos históricos

### ✅ Años Disponibles
- El campo `available_years` debe calcularse desde **TODOS** los pedidos históricos del cliente
- No debe filtrarse por el período solicitado
- Debe incluir todos los años únicos donde el cliente tiene pedidos
- Debe estar ordenado descendente (año más reciente primero)

### ✅ Orden de Líneas
- Las líneas dentro de cada producto deben estar ordenadas por `load_date` descendente (más reciente primero)
- Esto facilita el cálculo de `last_order_date` en el frontend

### ✅ Formato de Fechas
- Todas las fechas deben estar en formato ISO 8601: `YYYY-MM-DD`
- Ejemplo correcto: `"2026-02-06"`
- Ejemplo incorrecto: `"06/02/2026"` o `"2026-2-6"`

### ✅ Valores Numéricos
- `net_weight`, `total_amount`, `unit_price` deben ser números (o strings numéricos)
- `boxes` debe ser un entero
- Los valores null/undefined deben evitarse o manejarse como 0

### ✅ Productos sin Pedidos
- Si un producto no tiene pedidos, puede omitirse del array o incluirse con `lines: []`
- El frontend filtra productos sin líneas en el período seleccionado

---

## Ejemplo de Respuesta Completa

```json
{
  "message": "Historial de pedidos del cliente obtenido correctamente.",
  "data": [
    {
      "product": {
        "id": 104,
        "name": "Pulpo Fresco Rizado",
        "a3erpCode": "10039",
        "facilcomCode": null,
        "species_id": 1
      },
      "total_boxes": 8393,
      "total_net_weight": 41965,
      "average_unit_price": 7.46,
      "last_order_date": "2026-02-06",
      "total_amount": 312938,
      "lines": [
        {
          "order_id": 2416,
          "formatted_id": "#02416",
          "load_date": "2026-02-06",
          "boxes": 40,
          "net_weight": 200,
          "unit_price": "12.75",
          "subtotal": 2550,
          "total": 2550
        },
        {
          "order_id": 2410,
          "formatted_id": "#02410",
          "load_date": "2026-01-15",
          "boxes": 35,
          "net_weight": 175,
          "unit_price": "12.50",
          "subtotal": 2187.5,
          "total": 2187.5
        },
        {
          "order_id": 2405,
          "formatted_id": "#02405",
          "load_date": "2025-12-20",
          "boxes": 50,
          "net_weight": 250,
          "unit_price": "12.00",
          "subtotal": 3000,
          "total": 3000
        }
      ]
    },
    {
      "product": {
        "id": 105,
        "name": "Calamar Fresco",
        "a3erpCode": "10040",
        "facilcomCode": null,
        "species_id": 2
      },
      "total_boxes": 5234,
      "total_net_weight": 26170,
      "average_unit_price": 6.25,
      "last_order_date": "2026-01-20",
      "total_amount": 163562.5,
      "lines": [
        {
          "order_id": 2412,
          "formatted_id": "#02412",
          "load_date": "2026-01-20",
          "boxes": 30,
          "net_weight": 150,
          "unit_price": "6.50",
          "subtotal": 975,
          "total": 975
        }
      ]
    }
  ]
}
```

---

## Códigos de Error

### 404 - Cliente no encontrado
```json
{
  "message": "Cliente no encontrado",
  "error": "Customer not found"
}
```

### 401 - No autorizado
```json
{
  "message": "No autorizado",
  "error": "Unauthorized"
}
```

### 500 - Error del servidor
```json
{
  "message": "Error al obtener historial del cliente",
  "error": "Internal server error"
}
```

---

## Notas de Implementación

1. **Performance**: Si el historial es muy grande, considera paginación en el futuro, pero por ahora el frontend maneja todos los datos del período filtrado.

2. **Cálculos en Backend**: 
   - Los campos `total_boxes`, `total_net_weight`, `average_unit_price`, `total_amount` deben calcularse en el backend **solo del período filtrado**
   - No deben incluir datos de otros períodos
   - Esto permite al frontend mostrar métricas precisas del período seleccionado

3. **Años Disponibles**: 
   - El campo `available_years` debe calcularse siempre desde **TODOS** los pedidos históricos
   - **NO debe filtrarse** por los parámetros de query enviados
   - Esto permite al frontend mostrar todos los años disponibles en los tabs/selector, independientemente del período que esté visualizando

4. **Filtrado de Líneas**:
   - Solo las líneas de pedidos que cumplen con los filtros deben incluirse en `data`
   - Si un producto no tiene pedidos en el período filtrado, puede omitirse o incluirse con `lines: []`

4. **Múltiples Tenants**: Asegúrate de filtrar los datos por tenant si la aplicación es multi-tenant.

---

**Última actualización**: 2026-02-06  
**Versión del Frontend**: Compatible con la implementación actual
