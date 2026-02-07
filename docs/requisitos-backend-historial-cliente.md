# Requisitos Backend - Historial de Cliente

## Endpoint: `GET /api/v2/customers/{customer}/order-history`

### Respuesta Actual (Funcional)

El endpoint actual devuelve el historial completo del cliente con todos los pedidos históricos. El frontend calcula y filtra los datos según los períodos seleccionados.

### Estructura de Respuesta Actual

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
        // ... más líneas
      ]
    }
    // ... más productos
  ]
}
```

### Comportamiento Actual del Frontend

El frontend:
1. **Calcula años disponibles** desde los datos recibidos (extrae años de `lines[].load_date`)
2. **Muestra tabs condicionalmente**:
   - Tab "Mes" - siempre visible
   - Tab "Trimestre" - siempre visible
   - Tab "[Año Actual]" - solo si hay datos del año actual (ej: 2026)
   - Tab "[Año Pasado]" - solo si hay datos del año pasado (ej: 2025)
3. **Muestra selector "Más años..."** con todos los años disponibles que sean anteriores al año pasado
   - Solo se muestra si hay años disponibles para el selector
   - Muestra todos los años que el backend indique que tienen registros
4. **Filtra datos en frontend** según el período seleccionado

### Notas Importantes

- ✅ **Funciona correctamente** con la respuesta actual
- ✅ El frontend calcula todo dinámicamente desde los datos
- ⚠️ **Optimización futura**: El backend podría enviar solo los datos del período solicitado para mejorar rendimiento

### Posibles Mejoras Futuras (Opcional)

Si en el futuro se quiere optimizar, el backend podría aceptar parámetros de filtro:

```
GET /api/v2/customers/{customer}/order-history?period=month
GET /api/v2/customers/{customer}/order-history?period=quarter
GET /api/v2/customers/{customer}/order-history?year=2024
GET /api/v2/customers/{customer}/order-history?date_from=2024-01-01&date_to=2024-12-31
```

Pero **NO es necesario** implementar esto ahora, ya que el frontend funciona correctamente con la respuesta completa.

---

**Última actualización**: 2026-02-06
**Estado**: ✅ Funcional con respuesta actual del backend
