# Especificación Backend - Vista de Producción (ProductionView)

## Endpoint Requerido

### GET `/api/orders/production-view` o similar

**Descripción**: Endpoint que devuelve los pedidos agrupados por producto para la vista de producción.

**Filtro de fecha**: El endpoint debe devolver únicamente los pedidos del día actual (fecha de hoy).

---

## Estructura de Respuesta Esperada

### Respuesta Principal

```json
{
  "data": [
    {
      "id": 501,
      "name": "Atún fresco",
      "orders": [
        {
          "orderId": 12345,
          "quantity": 150.5,
          "boxes": 25,
          "completedQuantity": 150.5,
          "completedBoxes": 25,
          "remainingQuantity": 0,
          "remainingBoxes": 0,
          "palets": [563, 564, 565],
          "status": "completed"
        }
      ]
    }
  ]
}
```

---

## Campos Requeridos por Nivel

### 1. Nivel Producto (Agrupación)

- **`id`** (number, requerido): ID único del producto
- **`name`** (string, requerido): Nombre del producto

### 2. Nivel Pedido-Producto (Dentro de `orders[]`)

- **`orderId`** (number, requerido): ID del pedido
- **`quantity`** (number, requerido): Cantidad planificada en kg (decimal)
- **`boxes`** (number, requerido): Número de cajas planificadas (entero)
- **`completedQuantity`** (number, requerido): Cantidad completada en kg (decimal, puede ser mayor que `quantity` si se excedió)
- **`completedBoxes`** (number, requerido): Cajas completadas (entero, puede ser mayor que `boxes` si se excedió)
- **`remainingQuantity`** (number, requerido): Cantidad restante en kg (decimal, puede ser negativo si se excedió)
- **`remainingBoxes`** (number, requerido): Cajas restantes (entero, puede ser negativo si se excedió)
- **`palets`** (array<number>, requerido): Array de números de palets donde está contenido este producto en este pedido.
- **`status`** (string, requerido): Estado de la línea de producción. Valores posibles:
  - **`"completed"`**: La línea está completada (completado = planificado, o restante <= 0)
  - **`"exceeded"`**: Se ha excedido la cantidad planificada (completado > planificado)
  - **`"pending"`**: Falta por completar (completado < planificado y restante > 0)

---

## Lógica de Estados de Línea

El backend debe calcular y devolver el `status` según:

1. **`"completed"`** (Estado Verde):

   - `remainingQuantity <= 0` O
   - `Math.abs(completedQuantity - quantity) < 0.01`
2. **`"exceeded"`** (Estado Rojo):

   - `completedQuantity > quantity`
3. **`"pending"`** (Estado Naranja):

   - `completedQuantity < quantity` Y `remainingQuantity > 0`

El frontend usa este `status` para determinar los colores y el comportamiento visual de cada card.

---

## Notas Importantes

### Palets

- Solo se muestran los primeros 3 palets, pero el array puede contener más
- Si un producto está en múltiples palets del mismo pedido, todos deben estar en el array

### Cantidades

- Todas las cantidades deben estar en las mismas unidades que se planificaron
- `remainingQuantity` y `remainingBoxes` pueden ser negativos si se excedió la cantidad planificada
- El frontend calcula automáticamente el valor absoluto cuando se excedió para mostrar "Sobrante"

### Agrupación

- Los pedidos deben estar agrupados por producto
- Cada producto debe aparecer una sola vez con todos sus pedidos asociados
- Los productos deben estar ordenados alfabéticamente por nombre

### Filtros (NO nunca)

---

## Ejemplo de Respuesta Completa

```json
{
  "data": [
    {
      "id": 501,
      "name": "Atún fresco",
      "orders": [
        {
          "orderId": 12345,
          "quantity": 150.5,
          "boxes": 25,
          "completedQuantity": 150.5,
          "completedBoxes": 25,
          "remainingQuantity": 0,
          "remainingBoxes": 0,
          "palets": [563, 564, 565],
          "status": "completed"
        },
        {
          "orderId": 12346,
          "quantity": 120.0,
          "boxes": 20,
          "completedQuantity": 84.0,
          "completedBoxes": 14,
          "remainingQuantity": 36.0,
          "remainingBoxes": 6,
          "palets": [201, 202],
          "status": "pending"
        }
      ]
    },
    {
      "id": 502,
      "name": "Salmón entero",
      "orders": [
        {
          "orderId": 12345,
          "quantity": 200.0,
          "boxes": 40,
          "completedQuantity": 220.0,
          "completedBoxes": 44,
          "remainingQuantity": -20.0,
          "remainingBoxes": -4,
          "palets": [563, 564],
          "status": "exceeded"
        }
      ]
    }
  ]
}
```

---
