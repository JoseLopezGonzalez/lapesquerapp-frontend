# Especificación Backend - Filtro por Almacén en Palets Disponibles

## Endpoint

```
GET /api/v2/pallets/available-for-order
```

## Parámetros de Query (Opcionales)

### Parámetros Actuales (Ya Implementados)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `orderId` | integer | ID del pedido (si se proporciona, incluye palets sin pedido O del mismo pedido) |
| `id` | string | Búsqueda por ID con coincidencias parciales |
| `perPage` | integer | Elementos por página (default: 20, max: 100) |
| `page` | integer | Número de página (opcional) |

### Parámetro Nuevo Requerido

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `storeId` | integer | **NUEVO** - ID del almacén para filtrar los palets disponibles. Si se proporciona, solo devuelve palets que están almacenados en ese almacén. Si es `null` o no se envía, devuelve palets de todos los almacenes. |

## Comportamiento Esperado

### Con `storeId` proporcionado:
- Solo devolver palets que tienen `storedPallet.store_id === storeId`
- Incluir palets en estado `registered` (1) o `stored` (2)
- Excluir palets vinculados a otros pedidos (a menos que se proporcione `orderId` del mismo pedido)
- Si un palet no tiene `storedPallet` (no está almacenado), no debe aparecer en los resultados cuando se filtra por `storeId`

### Sin `storeId` (comportamiento actual):
- Devolver todos los palets disponibles sin filtrar por almacén
- Mantener el comportamiento actual existente

## Response Exitosa (200)

### Estructura Actual (Ya Implementada)

```json
{
  "data": [
    {
      "id": 1,
      "status": 2,
      "boxes": [...],
      "storedPallet": {
        "store_id": 1,
        "position": "A-1"
      },
      "order_id": null
    }
  ],
  "current_page": 1,
  "last_page": 2,
  "per_page": 20,
  "total": 35
}
```

### Campos Importantes en la Respuesta

El backend **DEBE** devolver siempre el campo `storedPallet` con la siguiente estructura:

```json
{
  "storedPallet": {
    "store_id": 1,        // ID del almacén (integer, puede ser null si no está almacenado)
    "position": "A-1"     // Posición en el almacén (string, puede ser null)
  }
}
```

**Importante:**
- Si el palet está almacenado: `storedPallet` debe existir y contener `store_id` y `position`
- Si el palet NO está almacenado (estado `registered`): `storedPallet` puede ser `null` o tener `store_id: null`
- El frontend necesita `storedPallet.store_id` para:
  1. Filtrar los resultados cuando se busca por IDs específicos
  2. Mostrar el almacén en la lista de resultados
  3. Validar que el filtro funcione correctamente

## Ejemplos de Uso

### Ejemplo 1: Filtrar por almacén específico
```
GET /api/v2/pallets/available-for-order?orderId=123&storeId=5&perPage=50&page=1
```

**Respuesta esperada:**
- Solo palets del almacén con ID 5
- Que estén disponibles para el pedido 123
- Paginados con 50 resultados por página

### Ejemplo 2: Sin filtro de almacén (comportamiento actual)
```
GET /api/v2/pallets/available-for-order?orderId=123&perPage=50&page=1
```

**Respuesta esperada:**
- Todos los palets disponibles (de todos los almacenes)
- Que estén disponibles para el pedido 123
- Paginados con 50 resultados por página

### Ejemplo 3: Filtrar por almacén sin orderId
```
GET /api/v2/pallets/available-for-order?storeId=5&perPage=50&page=1
```

**Respuesta esperada:**
- Solo palets del almacén con ID 5
- Que no estén vinculados a ningún pedido (o disponibles)
- Paginados con 50 resultados por página

## Validaciones del Backend

1. **Validación de `storeId`**:
   - Si se proporciona, debe ser un integer válido
   - Si el almacén no existe, puede devolver un array vacío o un error 404/400 (según la política del backend)
   - Si es `null` o no se envía, no aplicar filtro de almacén

2. **Validación de `storedPallet` en respuesta**:
   - Siempre incluir el campo `storedPallet` en cada palet de la respuesta
   - Si el palet no está almacenado, `storedPallet` puede ser `null` o `{store_id: null, position: null}`
   - Si el palet está almacenado, `storedPallet.store_id` debe ser un integer válido

## Compatibilidad con Frontend

El frontend ya está preparado para:
- ✅ Enviar el parámetro `storeId` en las peticiones
- ✅ Recibir y mostrar `storedPallet.store_id` en los resultados
- ✅ Filtrar manualmente por almacén cuando se busca por IDs específicos (fallback si el backend no soporta el parámetro)

## Notas de Implementación

1. **Filtrado en Backend vs Frontend**:
   - **Ideal**: El backend filtra por `storeId` directamente en la consulta SQL/Query
   - **Fallback**: Si el backend no soporta `storeId`, el frontend puede filtrar manualmente, pero es menos eficiente

2. **Palets sin almacén**:
   - Los palets en estado `registered` (1) pueden no tener `storedPallet`
   - Estos palets NO deben aparecer cuando se filtra por `storeId` (a menos que se quiera incluir un almacén especial "Sin almacén")

3. **Paginación**:
   - El filtro por `storeId` debe aplicarse ANTES de la paginación
   - Los totales (`total`, `last_page`) deben reflejar solo los palets que cumplen el filtro

## Checklist de Implementación Backend

- [ ] Agregar parámetro `storeId` a los query parameters aceptados
- [ ] Implementar filtro por `store_id` en la consulta cuando `storeId` está presente
- [ ] Asegurar que `storedPallet` siempre esté presente en la respuesta
- [ ] Validar que `storedPallet.store_id` sea un integer válido cuando el palet está almacenado
- [ ] Probar que la paginación funcione correctamente con el filtro
- [ ] Probar que el filtro funcione en combinación con `orderId` y `id`
- [ ] Actualizar la documentación de la API
