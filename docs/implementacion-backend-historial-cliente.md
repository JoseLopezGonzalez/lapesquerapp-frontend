# Implementación Backend - Historial de Cliente

## Resumen de la Implementación

Este documento describe cómo funciona el filtrado implementado en el backend para el endpoint de historial de cliente.

---

## Endpoint

```
GET /api/v2/customers/{customer_id}/order-history
```

---

## Cómo Funciona el Filtrado

### 1. Filtro por Rango de Fechas

```
GET /api/v2/customers/123/order-history?date_from=2025-01-01&date_to=2025-12-31
```

**Comportamiento:**
- Solo devuelve pedidos con `load_date` entre esas fechas (inclusive)
- Las líneas en `data` solo incluyen pedidos de ese rango
- Los totales (`total_boxes`, `total_net_weight`, `total_amount`, `average_unit_price`) se calculan solo de ese período

**Ejemplo:**
```
GET /api/v2/customers/123/order-history?date_from=2025-06-01&date_to=2025-06-30
```
- Devuelve solo pedidos de junio 2025
- Totales calculados solo de junio 2025

---

### 2. Filtro por Año

```
GET /api/v2/customers/123/order-history?year=2025
```

**Comportamiento:**
- Solo devuelve pedidos del año especificado
- Las líneas en `data` solo incluyen pedidos de ese año
- Los totales se calculan solo de ese año

---

### 3. Filtro por Período

```
GET /api/v2/customers/123/order-history?period=month
GET /api/v2/customers/123/order-history?period=quarter
GET /api/v2/customers/123/order-history?period=year
```

**Valores posibles:**
- `month`: Solo mes actual
- `quarter`: Solo trimestre actual
- `year`: Solo año actual

**Comportamiento:**
- Calcula el período automáticamente desde la fecha actual
- Solo devuelve pedidos del período actual
- Los totales se calculan solo del período actual

**Nota:** El frontend actualmente no usa este método porque necesita períodos específicos (mes pasado, trimestre pasado, años seleccionados), por lo que usa `date_from` y `date_to`.

---

### 4. Sin Filtros

```
GET /api/v2/customers/123/order-history
```

**Comportamiento:**
- Devuelve todos los pedidos históricos
- Los totales se calculan de todo el historial

---

## Comportamiento Importante

### `available_years`

- **Siempre se calcula desde todos los pedidos históricos** (sin aplicar filtros)
- Esto permite al frontend mostrar todos los años disponibles en los tabs/selector
- Independientemente del período que esté visualizando, el frontend puede ver qué años tienen datos

**Ejemplo:**
```
Request: GET /api/v2/customers/123/order-history?date_from=2025-06-01&date_to=2025-06-30

Response:
{
  "available_years": [2026, 2025, 2024, 2023, 2022],  // Todos los años históricos
  "data": [...]  // Solo datos de junio 2025
}
```

### `data`

- Solo contiene productos y líneas de pedidos que cumplen con los filtros enviados
- Si un producto no tiene pedidos en el período filtrado, puede omitirse o incluirse con `lines: []`

### Totales

- Se calculan **solo del período filtrado**, no de todo el historial
- Esto permite al frontend mostrar métricas precisas del período seleccionado
- Si no hay filtros, los totales son de todo el historial

---

## Ejemplo Práctico

### Request del Frontend

```
GET /api/v2/customers/123/order-history?date_from=2025-06-01&date_to=2025-06-30
```

### Response del Backend

```json
{
  "message": "Historial de pedidos del cliente obtenido correctamente.",
  "available_years": [2026, 2025, 2024, 2023, 2022],
  "data": [
    {
      "product": {
        "id": 104,
        "name": "Pulpo Fresco Rizado",
        "a3erpCode": "10039",
        "facilcomCode": null,
        "species_id": 1
      },
      "total_boxes": 200,
      "total_net_weight": 1000,
      "average_unit_price": 12.50,
      "last_order_date": "2025-06-28",
      "total_amount": 12500,
      "lines": [
        {
          "order_id": 2416,
          "formatted_id": "#02416",
          "load_date": "2025-06-28",
          "boxes": 40,
          "net_weight": 200,
          "unit_price": "12.75",
          "subtotal": 2550,
          "total": 2550
        },
        {
          "order_id": 2410,
          "formatted_id": "#02410",
          "load_date": "2025-06-15",
          "boxes": 35,
          "net_weight": 175,
          "unit_price": "12.50",
          "subtotal": 2187.5,
          "total": 2187.5
        }
        // ... más líneas de junio 2025
      ]
    }
  ]
}
```

### Lo que Permite al Frontend

1. **Mostrar todos los años disponibles** en los tabs usando `available_years`
2. **Mostrar solo los datos del período seleccionado** (junio 2025) usando `data`
3. **Calcular métricas y tendencias** comparando períodos diferentes:
   - Hacer una llamada para el período actual (junio 2025)
   - Hacer otra llamada para el período anterior (mayo 2025)
   - Comparar los totales para calcular tendencias

---

## Notas de Implementación

1. **Performance**: El filtrado en el backend reduce la cantidad de datos transferidos, mejorando el rendimiento.

2. **Cálculo de Totales**: Los totales se calculan en el backend solo del período filtrado, lo que es más eficiente que calcularlos en el frontend.

3. **Años Disponibles**: Aunque se filtren los datos, `available_years` siempre muestra todos los años históricos, permitiendo al frontend mostrar opciones de navegación completas.

4. **Compatibilidad**: El frontend actualmente usa `date_from` y `date_to` porque necesita flexibilidad para períodos específicos (mes pasado, trimestre pasado, años seleccionados). El parámetro `period` está disponible para casos de uso futuros.

---

**Última actualización**: 2026-02-06  
**Estado**: ✅ Implementado y funcionando
