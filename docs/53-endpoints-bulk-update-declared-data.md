# Endpoints de Actualización Masiva de Datos Declarados

Documentación de los endpoints utilizados en el Data Extractor para validar y vincular datos declarados a recepciones de materia prima.

## Índice

- [Endpoint de Validación](#endpoint-de-validación)
- [Endpoint de Actualización](#endpoint-de-actualización)

---

## Endpoint de Validación

### URL

```
POST /api/v2/raw-material-receptions/validate-bulk-update-declared-data
```

### Descripción

Valida múltiples recepciones antes de actualizar sus datos declarados (peso neto total y monto total declarado). Este endpoint permite verificar si las recepciones existen, si tienen cambios y si están listas para actualizar, sin realizar la actualización real.

### Headers

```http
X-Tenant: {subdomain}
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body

```json
{
  "receptions": [
    {
      "supplier_id": 1,
      "date": "2024-01-15",
      "declared_total_net_weight": 1000.50,
      "declared_total_amount": 5000.00
    },
    {
      "supplier_id": 2,
      "date": "2024-01-16",
      "declared_total_net_weight": 750.25,
      "declared_total_amount": 3750.00
    }
  ]
}
```

#### Campos del Request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `receptions` | array | Sí | Array de objetos de recepción a validar |
| `receptions[].supplier_id` | integer | Sí | ID del proveedor |
| `receptions[].date` | string (YYYY-MM-DD) | Sí | Fecha de la recepción en formato ISO (YYYY-MM-DD) |
| `receptions[].declared_total_net_weight` | number | Sí | Peso neto total declarado |
| `receptions[].declared_total_amount` | number | Sí | Monto total declarado |

### Response - Éxito Total (200)

Cuando todas las recepciones son válidas:

```json
{
  "valid": 2,
  "invalid": 0,
  "ready_to_update": 2,
  "results": [
    {
      "supplier_id": 1,
      "date": "2024-01-15",
      "valid": true,
      "can_update": true,
      "has_changes": true,
      "message": "Recepción válida y lista para actualizar",
      "supplier_name": "Proveedor A"
    },
    {
      "supplier_id": 2,
      "date": "2024-01-16",
      "valid": true,
      "can_update": true,
      "has_changes": true,
      "message": "Recepción válida y lista para actualizar",
      "supplier_name": "Proveedor B"
    }
  ],
  "errors_details": []
}
```

### Response - Validación Parcial (207)

Cuando algunas recepciones son válidas y otras no:

```json
{
  "valid": 1,
  "invalid": 1,
  "ready_to_update": 1,
  "results": [
    {
      "supplier_id": 1,
      "date": "2024-01-15",
      "valid": true,
      "can_update": true,
      "has_changes": true,
      "message": "Recepción válida y lista para actualizar",
      "supplier_name": "Proveedor A"
    }
  ],
  "errors_details": [
    {
      "supplier_id": 2,
      "date": "2024-01-16",
      "error": "No existe recepción para este proveedor y fecha",
      "message": "No existe recepción para este proveedor y fecha",
      "hint": "No existen recepciones para este proveedor"
    }
  ]
}
```

### Response - Errores de Validación

Cuando una recepción no existe pero hay una recepción cercana:

```json
{
  "valid": 0,
  "invalid": 1,
  "ready_to_update": 0,
  "results": [],
  "errors_details": [
    {
      "supplier_id": 1,
      "date": "2024-01-15",
      "error": "No existe recepción para este proveedor y fecha",
      "message": "No existe recepción para este proveedor y fecha",
      "hint": "Recepción más cercana: 2024-01-14 (anterior) ID: 123 diferencia: 1"
    }
  ]
}
```

#### Campos del Response

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `valid` | integer | Número de recepciones válidas |
| `invalid` | integer | Número de recepciones inválidas |
| `ready_to_update` | integer | Número de recepciones listas para actualizar |
| `results` | array | Array de resultados de validación exitosos |
| `results[].supplier_id` | integer | ID del proveedor |
| `results[].date` | string | Fecha de la recepción |
| `results[].valid` | boolean | Indica si la recepción es válida |
| `results[].can_update` | boolean | Indica si se puede actualizar |
| `results[].has_changes` | boolean | Indica si hay cambios respecto a los datos actuales |
| `results[].message` | string | Mensaje descriptivo del resultado |
| `results[].supplier_name` | string | Nombre del proveedor |
| `errors_details` | array | Array de detalles de errores |
| `errors_details[].supplier_id` | integer | ID del proveedor con error |
| `errors_details[].date` | string | Fecha de la recepción con error |
| `errors_details[].error` | string | Tipo de error |
| `errors_details[].message` | string | Mensaje de error |
| `errors_details[].hint` | string | Pista adicional sobre el error (ej: recepción más cercana) |

### Códigos de Estado HTTP

- `200`: Todas las recepciones son válidas
- `207`: Validación parcial (algunas válidas, algunas inválidas)
- `400`: Error en el formato del request
- `401`: No autenticado
- `403`: No autorizado
- `500`: Error interno del servidor

---

## Endpoint de Actualización

### URL

```
POST /api/v2/raw-material-receptions/bulk-update-declared-data
```

### Descripción

Actualiza masivamente los datos declarados (peso neto total y monto total declarado) de múltiples recepciones de materia prima. Este endpoint realiza la actualización real de los datos.

### Headers

```http
X-Tenant: {subdomain}
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body

```json
{
  "receptions": [
    {
      "supplier_id": 1,
      "date": "2024-01-15",
      "declared_total_net_weight": 1000.50,
      "declared_total_amount": 5000.00
    },
    {
      "supplier_id": 2,
      "date": "2024-01-16",
      "declared_total_net_weight": 750.25,
      "declared_total_amount": 3750.00
    }
  ]
}
```

#### Campos del Request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `receptions` | array | Sí | Array de objetos de recepción a actualizar |
| `receptions[].supplier_id` | integer | Sí | ID del proveedor |
| `receptions[].date` | string (YYYY-MM-DD) | Sí | Fecha de la recepción en formato ISO (YYYY-MM-DD) |
| `receptions[].declared_total_net_weight` | number | Sí | Peso neto total declarado |
| `receptions[].declared_total_amount` | number | Sí | Monto total declarado |

### Response - Éxito Total (200)

Cuando todas las recepciones se actualizan correctamente:

```json
{
  "updated": 2,
  "errors": 0,
  "errors_details": []
}
```

### Response - Actualización Parcial (207)

Cuando algunas recepciones se actualizan y otras fallan:

```json
{
  "updated": 1,
  "errors": 1,
  "errors_details": [
    {
      "supplier_id": 2,
      "date": "2024-01-16",
      "error": "No existe recepción para este proveedor y fecha",
      "message": "No existe recepción para este proveedor y fecha",
      "hint": "No existen recepciones para este proveedor"
    }
  ]
}
```

### Response - Errores de Actualización

Cuando una recepción no existe pero hay una recepción cercana:

```json
{
  "updated": 0,
  "errors": 1,
  "errors_details": [
    {
      "supplier_id": 1,
      "date": "2024-01-15",
      "error": "No existe recepción para este proveedor y fecha",
      "message": "No existe recepción para este proveedor y fecha",
      "hint": "Recepción más cercana: 2024-01-14 (anterior) ID: 123 diferencia: 1"
    }
  ]
}
```

#### Campos del Response

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `updated` | integer | Número de recepciones actualizadas exitosamente |
| `errors` | integer | Número de recepciones que fallaron al actualizar |
| `errors_details` | array | Array de detalles de errores |
| `errors_details[].supplier_id` | integer | ID del proveedor con error |
| `errors_details[].date` | string | Fecha de la recepción con error |
| `errors_details[].error` | string | Tipo de error |
| `errors_details[].message` | string | Mensaje de error |
| `errors_details[].hint` | string | Pista adicional sobre el error (ej: recepción más cercana) |

### Códigos de Estado HTTP

- `200`: Todas las recepciones se actualizaron correctamente
- `207`: Actualización parcial (algunas exitosas, algunas fallaron)
- `400`: Error en el formato del request
- `401`: No autenticado
- `403`: No autorizado
- `500`: Error interno del servidor

---

## Notas de Implementación

### Uso en el Data Extractor

Estos endpoints se utilizan en el servicio `linkService.js` para:

1. **Validar antes de vincular**: Se llama primero al endpoint de validación para verificar que todas las recepciones existen y están listas para actualizar.

2. **Vincular datos declarados**: Si la validación es exitosa, se llama al endpoint de actualización para realizar la vinculación real.

### Formato de Fechas

- **Request**: Las fechas deben enviarse en formato ISO `YYYY-MM-DD` (ej: `"2024-01-15"`)
- **Conversión**: El código convierte las fechas del formato `DD/MM/YYYY` (usado en la UI) al formato ISO antes de enviarlas a la API

### Agrupación de Recepciones

El código agrupa automáticamente las recepciones por `supplier_id` y `date` antes de enviarlas a la API, combinando múltiples barcos que tengan el mismo proveedor y fecha.

### Manejo de Errores

- Los errores pueden incluir un campo `hint` con información adicional, como la recepción más cercana cuando no existe una recepción para la fecha especificada.
- El código formatea estos hints para mostrarlos de manera amigable en la UI.

### Ejemplo de Flujo Completo

```javascript
// 1. Validar recepciones
const validationResult = await validatePurchases(linkedSummaryArray);

// 2. Verificar que hay recepciones listas para actualizar
if (validationResult.readyToUpdate > 0) {
  // 3. Actualizar recepciones
  const updateResult = await linkAllPurchases(linkedSummaryArray);
  
  // 4. Procesar resultados
  console.log(`Actualizadas: ${updateResult.correctas}`);
  console.log(`Errores: ${updateResult.errores}`);
}
```

---

## Referencias

- Archivo de implementación: `src/services/export/linkService.js`
- Configuración de API: `src/configs/config.js`

