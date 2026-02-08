# Requisitos Backend: PalletCard en OrderPallets

## Endpoint: GET /api/v2/orders/{id}

### Estructura Actual de Palets en la Respuesta

Según el código actual, los palets en `order.pallets` tienen:

```json
{
  "pallets": [
    {
      "id": 1,
      "productsNames": ["Atún fresco", "Salmón"],
      "lots": ["LOT-001", "LOT-002"],
      "numberOfBoxes": 10,
      "netWeight": 250.5,
      "receptionId": 123,
      "orderId": 456
    }
  ]
}
```

### Estructura Necesaria para PalletCard

El `PalletCard` necesita:

```json
{
  "pallets": [
    {
      "id": 1,
      "status": 2,
      "receptionId": 123,
      "orderId": 456,
      "observations": "Palet en buen estado",
      "lots": ["LOT-001", "LOT-002"],
      "boxes": [
        {
          "id": 10,
          "product": {
            "id": 1,
            "name": "Atún fresco"
          },
          "lot": "LOT-001",
          "netWeight": 20.5,
          "grossWeight": 25.0,
          "isAvailable": true,
          "production": null
        },
        {
          "id": 11,
          "product": {
            "id": 1,
            "name": "Atún fresco"
          },
          "lot": "LOT-001",
          "netWeight": 20.3,
          "grossWeight": 24.8,
          "isAvailable": true,
          "production": null
        }
      ],
      "netWeight": 250.5,
      "numberOfBoxes": 10
    }
  ]
}
```

## Comparación: Qué Falta vs Qué Tiene

| Campo | Actual | Necesario | Estado |
|-------|--------|-----------|--------|
| `id` | ✅ | ✅ | OK |
| `status` | ❓ | ✅ | Opcional |
| `receptionId` | ✅ | ✅ | OK |
| `orderId` | ✅ | ✅ | OK |
| `observations` | ❓ | ✅ | **VERIFICAR** |
| `lots` | ✅ (array) | ✅ (array) | OK |
| `productsNames` | ✅ (array) | ❌ (no necesario) | OK (se puede usar como fallback) |
| `numberOfBoxes` | ✅ | ✅ | OK |
| `netWeight` | ✅ | ✅ | OK |
| `availableBoxesCount` | ❌ | ✅ | **NECESARIO** |
| `totalAvailableWeight` | ❌ | ✅ | **NECESARIO** |
| `productsSummary` | ❌ | ✅ | **NECESARIO** (resumen agregado) |

### Campos para Resúmenes (Alternativa a `boxes` completo)

**Opción 1: Resumen de Productos (RECOMENDADO)**
En lugar de devolver todas las cajas, el backend puede calcular y devolver un resumen:

```json
{
  "productsSummary": [
    {
      "product": {
        "id": 1,
        "name": "Atún fresco"
      },
      "availableBoxCount": 8,
      "availableNetWeight": 164.0,
      "totalBoxCount": 10,
      "totalNetWeight": 205.0
    },
    {
      "product": {
        "id": 2,
        "name": "Salmón"
      },
      "availableBoxCount": 5,
      "availableNetWeight": 93.5,
      "totalBoxCount": 5,
      "totalNetWeight": 93.5
    }
  ]
}
```

**Opción 2: Campos Agregados (MÁS SIMPLE)**
Si solo queremos mostrar el total, podemos usar campos agregados:

```json
{
  "availableBoxesCount": 13,  // Cajas disponibles
  "totalAvailableWeight": 257.5,  // Peso disponible
  "usedBoxesCount": 2,  // Cajas en producción (opcional)
  "totalUsedWeight": 41.0  // Peso en producción (opcional)
}
```

**Por qué NO necesitamos todas las cajas:**
- El `PalletCard` solo muestra resúmenes (productos con peso y cajas)
- Los helpers ya priorizan valores del backend (`availableBoxesCount`, `totalAvailableWeight`)
- Para el resumen de productos, podemos usar `productsSummary` pre-calculado
- Solo necesitamos los lotes (ya los tenemos como array)

## Campos Opcionales pero Recomendados

| Campo | Descripción | Uso en PalletCard |
|-------|-------------|-------------------|
| `status` | Estado del palet (1=registered, 2=stored, etc.) | Puede usarse para mostrar badge de estado |
| `observations` | Observaciones del palet | Se muestra en el card si existe |
| `storedPallet` | Información de almacenamiento | No necesario para el card básico, pero útil |

## Resumen de Cambios Necesarios en el Backend

### ✅ Ya Existe
- `id`
- `receptionId`
- `orderId`
- `lots` (array)
- `numberOfBoxes`
- `netWeight`
- `productsNames` (array) - Puede usarse como fallback

### ⚠️ Necesario Agregar (Opción Recomendada: Resúmenes)

**Opción A: Resumen de Productos (MÁS EFICIENTE)**
1. **`productsSummary`** (array) - **RECOMENDADO**
   - Resumen agregado por producto con:
     - `product` (objeto con `id` y `name`)
     - `availableBoxCount` (cajas disponibles de este producto)
     - `availableNetWeight` (peso disponible de este producto)
     - `totalBoxCount` (total de cajas de este producto, opcional)
     - `totalNetWeight` (total de peso de este producto, opcional)

2. **`availableBoxesCount`** (integer)
   - Total de cajas disponibles en el palet
   - Ya lo devuelve el backend en `available-for-order`, solo falta en `orders/{id}`

3. **`totalAvailableWeight`** (number)
   - Total de peso disponible en el palet
   - Ya lo devuelve el backend en `available-for-order`, solo falta en `orders/{id}`

4. **`observations`** (string, opcional)
   - Observaciones del palet
   - Si no existe, el card simplemente no muestra esa sección

5. **`status`** (integer, opcional)
   - Estado del palet
   - Puede ser útil para mostrar badges o estados visuales

**Opción B: Campos Agregados Simples (MÁS SIMPLE)**
Si no se puede calcular `productsSummary`, al menos agregar:
- `availableBoxesCount` (integer)
- `totalAvailableWeight` (number)

Y usar `productsNames` como fallback (aunque no mostrará peso por producto).

## Ejemplo de Respuesta Completa del Backend (Opción Recomendada)

```json
{
  "data": {
    "id": 123,
    "customer": {...},
    "pallets": [
      {
        "id": 1,
        "status": 2,
        "receptionId": 123,
        "orderId": 456,
        "observations": "Palet en buen estado",
        "lots": ["LOT-001", "LOT-002"],
        "numberOfBoxes": 10,
        "netWeight": 250.5,
        "availableBoxesCount": 8,
        "totalAvailableWeight": 205.3,
        "productsSummary": [
          {
            "product": {
              "id": 1,
              "name": "Atún fresco"
            },
            "availableBoxCount": 6,
            "availableNetWeight": 123.0,
            "totalBoxCount": 8,
            "totalNetWeight": 164.0
          },
          {
            "product": {
              "id": 2,
              "name": "Salmón"
            },
            "availableBoxCount": 2,
            "availableNetWeight": 37.4,
            "totalBoxCount": 2,
            "totalNetWeight": 37.4
          }
        ]
      }
    ]
  }
}
```

## Ejemplo Alternativo (Solo Campos Agregados)

Si no se puede calcular `productsSummary`, al menos:

```json
{
  "pallets": [
    {
      "id": 1,
      "receptionId": 123,
      "orderId": 456,
      "observations": "Palet en buen estado",
      "lots": ["LOT-001", "LOT-002"],
      "numberOfBoxes": 10,
      "netWeight": 250.5,
      "availableBoxesCount": 8,
      "totalAvailableWeight": 205.3,
      "productsNames": ["Atún fresco", "Salmón"]  // Fallback para mostrar productos
    }
  ]
}
```

**Nota**: Con esta opción, el card mostrará productos pero sin peso individual por producto.

## Notas Importantes

1. **`productsSummary` es la opción más eficiente**: 
   - El backend calcula el resumen una vez
   - El frontend solo muestra los datos sin procesar
   - Reduce significativamente el tamaño de la respuesta
   - Mantiene toda la información necesaria para el card

2. **`availableBoxesCount` y `totalAvailableWeight` son necesarios**:
   - Los helpers del frontend ya están preparados para usarlos
   - Si existen, se usan directamente (más eficiente)
   - Si no existen, se calcularían desde `boxes` (pero no tenemos `boxes`)

3. **`productsNames` como fallback**:
   - Si no hay `productsSummary`, se puede usar `productsNames`
   - Pero no mostrará peso individual por producto
   - Solo mostrará nombres de productos

4. **`observations` es opcional**: Si no existe, el card simplemente no muestra esa sección. No es crítico.

5. **Ventajas de usar resúmenes vs cajas completas**:
   - ✅ Mucho menor tamaño de respuesta
   - ✅ Mejor performance
   - ✅ Misma información visual en el card
   - ✅ El backend calcula una vez vs frontend calculando múltiples veces

## Checklist de Implementación Backend

### Opción Recomendada (Resúmenes)
- [ ] Agregar campo `productsSummary` (array) con resumen por producto
  - [ ] Cada item debe tener `product` (con `id` y `name`)
  - [ ] Cada item debe tener `availableBoxCount` y `availableNetWeight`
  - [ ] Opcional: `totalBoxCount` y `totalNetWeight`
- [ ] Agregar campo `availableBoxesCount` (integer) - total de cajas disponibles
- [ ] Agregar campo `totalAvailableWeight` (number) - total de peso disponible
- [ ] Agregar campo `observations` (string, opcional, puede ser null)
- [ ] Agregar campo `status` (integer, opcional)
- [ ] Verificar que `lots` sigue siendo un array
- [ ] Mantener `productsNames` para compatibilidad/fallback
- [ ] Mantener `numberOfBoxes` y `netWeight` para compatibilidad

### Opción Alternativa (Solo Campos Agregados)
Si no se puede calcular `productsSummary`:
- [ ] Agregar campo `availableBoxesCount` (integer)
- [ ] Agregar campo `totalAvailableWeight` (number)
- [ ] Mantener `productsNames` para mostrar productos (sin peso individual)

## Impacto en Performance

✅ **Ventaja de usar resúmenes**: 
- Mucho menor tamaño de respuesta comparado con incluir todas las cajas
- Ejemplo: Un palet con 50 cajas
  - Con `boxes`: ~50 objetos JSON
  - Con `productsSummary`: ~2-5 objetos JSON (uno por producto)
- Mejor performance tanto en backend (menos datos a serializar) como en frontend (menos datos a procesar)

**Recomendación**: Usar `productsSummary` siempre que sea posible. Es la opción más eficiente y mantiene toda la información necesaria para el card.
