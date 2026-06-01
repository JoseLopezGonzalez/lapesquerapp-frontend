# Frontend — Ejecución de pedidos operativos por cajas (Field / Repartidor)

Este documento define el **contrato e interacción** entre frontend y backend para el rol **`repartidor_autoventa`** en el perímetro `field/*`, específicamente para:

- Ejecutar un **pedido prefijado** guardando **cajas/palets** (ejecución real).
- Añadir **productos extra** no contemplados en el pedido (creando nuevas líneas planificadas).
- Ajustar (solo) **precio** e **IVA** de líneas planificadas existentes.

La ejecución se gestiona como **estado completo**: el frontend envía “la foto final” de las cajas del pedido y el backend sincroniza.

## Principios de negocio (muy importantes)

- El endpoint operativo **NO admite** `status` (campo prohibido).
- El endpoint operativo **NO admite** `plannedProducts` (contrato legacy).
- La ejecución real se guarda en **cajas/palets** (tablas `pallets`, `boxes`, `pallet_boxes`), no en planned.
- Solo se permite:
  - crear/editar/eliminar cajas de ejecución del pedido (por sync)
  - crear nuevas líneas planned _solo_ para extras (sin borrar las existentes)
  - ajustar precio/IVA de líneas planned existentes (sin tocar cantidades)

## Perímetro y headers

- Base path: `/api/v2/field/*`
- Headers:
  - `X-Tenant: {subdomain}`
  - `Authorization: Bearer {token}`
  - `Accept: application/json`

## Endpoints implicados

### 1) IVA options (para extras)

- `GET /api/v2/field/taxes/options`
- Respuesta: array de impuestos `{ id, name, rate }`

Frontend debe usar este endpoint (NO `GET /api/v2/taxes/options`).

### 2) Pedido operativo — detalle (incluye ejecución con ids)

- `GET /api/v2/field/orders/{orderId}`
- Respuesta incluye:
  - `plannedProductDetails` (planificado)
  - `pallets[]` con `boxes[]` (ejecución) e **`boxes[].id`**

El frontend usa `boxes[].id` para sincronizar en el `PUT`.

### 3) Pedido operativo — guardar ejecución (sync estado completo)

- `PUT /api/v2/field/orders/{orderId}`

Payload admite:

- `boxes` (estado completo de ejecución)
- `plannedExtras` (opcional)
- `plannedAdjustments` (opcional)
- `items` (opcional; solo UI/resumen)

Campos prohibidos (si se envían → 422):

- `status`
- `plannedProducts`

## Contrato de `PUT /field/orders/{orderId}` (sync)

### Reglas de sincronización (estado completo)

El backend interpreta `boxes[]` como el **conjunto final** de cajas asociadas al pedido:

- **Update**: si una caja viene con `id` → se actualiza (validando que pertenece a ese pedido).
- **Create**: si una caja viene sin `id` → se crea + vínculo.
- **Delete**: toda caja existente del pedido cuyo `id` no aparezca en el payload se considera eliminada.

### 1) `boxes[]`

Cada caja puede ser:

- Existente (update): `id` obligatorio
- Nueva (create): sin `id`

Campos:

- `id` (solo update)
- `productId` (obligatorio)
- `lot` (opcional)
- `netWeight` (obligatorio)
- `grossWeight` (opcional)
- `gs1128` (opcional)

### 2) `plannedExtras[]` (productos extra no prefijados)

Usar cuando el escaneo detecta productos que no estaban en `plannedProductDetails`:

```json
{
  "plannedExtras": [{ "productId": 99, "unitPrice": 12.0, "taxId": 1 }]
}
```

Reglas:

- backend crea una nueva línea planned para ese producto (si ya existe, 422)
- `quantity` y `boxes` de esa línea se derivan del `boxes[]` actual agrupado por `productId`

### 3) `plannedAdjustments[]` (solo precio + IVA en líneas existentes)

```json
{
  "plannedAdjustments": [{ "plannedProductDetailId": 555, "unitPrice": 8.25, "taxId": 2 }]
}
```

Reglas:

- solo actualiza `unitPrice` y `taxId`
- no modifica cantidad ni cajas

### 4) `items[]` (opcional)

Puede enviarse como resumen para UI, pero **no** es la fuente de verdad: la ejecución es `boxes[]`.
