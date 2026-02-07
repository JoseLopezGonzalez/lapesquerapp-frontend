# Mensaje para el Backend - Implementación de Trend

## Implementar campo `trend` en el endpoint de historial de cliente

Hola, necesitamos agregar un campo `trend` en la respuesta del endpoint `GET /api/v2/customers/{customer_id}/order-history` para cada producto.

### Campo a agregar

En cada objeto de producto dentro del array `data`, agregar:

```json
"trend": {
  "direction": "up",  // o "down" o "stable"
  "percentage": 15.5  // número (valor absoluto, sin signo)
}
```

### Cálculo del trend

El `trend` compara el **peso neto total** del período actual (el que se está filtrando) vs el **período anterior del mismo rango**.

#### Período anterior según el filtro:

- **Si el filtro es un rango de fechas** (`date_from` y `date_to`):
  - Calcular el período anterior del mismo rango
  - Ejemplo: Si filtro es `2025-06-01` a `2025-06-30` (junio), comparar con `2025-05-01` a `2025-05-31` (mayo)
  
- **Si el filtro es un año** (`year=2025`):
  - Comparar con el año anterior (2024)
  
- **Si el filtro es un período** (`period=month`, `period=quarter`, `period=year`):
  - `month`: comparar con el mes anterior
  - `quarter`: comparar con el trimestre anterior
  - `year`: comparar con el año anterior

#### Fórmula:

```
porcentaje = ((peso_neto_periodo_actual - peso_neto_periodo_anterior) / peso_neto_periodo_anterior) * 100
```

#### Valores de `direction`:

- `"up"`: Si el porcentaje es **positivo** (aumento)
- `"down"`: Si el porcentaje es **negativo** (disminución)
- `"stable"`: Si el valor absoluto del porcentaje es **menor a 5%** (sin cambio significativo)

#### Valores de `percentage`:

- Valor absoluto del porcentaje (sin signo)
- Ejemplo: Si aumentó 25%, `percentage: 25.0`
- Ejemplo: Si disminuyó 15%, `percentage: 15.0`
- Si es `stable`, `percentage: 0`

### Casos especiales

- Si no hay datos del período anterior: `direction: "stable"`, `percentage: 0`
- Si el peso neto del período anterior es 0: `direction: "stable"`, `percentage: 0`
- Si no hay datos del período actual: puede omitirse el campo `trend` o devolver `stable`

### Ejemplo de respuesta

```json
{
  "message": "Historial de pedidos del cliente obtenido correctamente.",
  "available_years": [2026, 2025, 2024],
  "data": [
    {
      "product": {
        "id": 104,
        "name": "Pulpo Fresco Rizado"
      },
      "total_boxes": 200,
      "total_net_weight": 1000,
      "average_unit_price": 12.50,
      "last_order_date": "2025-06-28",
      "total_amount": 12500,
      "trend": {
        "direction": "up",
        "percentage": 15.5
      },
      "lines": [...]
    }
  ]
}
```

### Nota importante

El campo `trend` es **opcional**. Si por alguna razón no se puede calcular, puede omitirse y el frontend calculará el trend localmente como fallback.

---

**Prioridad**: Media  
**Tiempo estimado**: 2-3 horas  
**Documentación completa**: Ver `docs/especificacion-backend-historial-cliente.md` sección "trend"
