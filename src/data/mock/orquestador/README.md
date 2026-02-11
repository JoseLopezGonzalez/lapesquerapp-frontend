# Mock data — Vista Orquestador (maqueta)

Datos **ficticios** y **simulados** para la maqueta funcional de la vista orquestador. No se conectan a backend ni modifican lógica productiva.

**Paradigma:** Dos pantallas. **Pantalla 1 — Emisión de etiquetas:** crear cajas (producto, lote, pesos) e imprimir etiquetas; las cajas pasan a estado "Disponible". **Pantalla 2 — Preparación de pedidos:** escanear cajas disponibles, construir palet y asignar a pedido. Orden: Etiqueta → Caja → Palet → Pedido.

## Uso

- `getInitialMockState()` devuelve estado inicial: `orders`, `pallets`, `products`, `availableBoxes` (cajas pendientes de escaneo), `nextBoxId`.
- Pantalla 1: "Generar cajas" añade a `availableBoxes` y aumenta `nextBoxId`. "Imprimir etiquetas" es simulado (toast).
- Pantalla 2: "Escanear" o "Añadir al palet" quita cajas de `availableBoxes` y las agrega al palet en construcción. "Cerrar palet" crea el palet y actualiza el progreso del pedido.

## Estructuras de datos

### Productos (`products`)

| Campo | Tipo   | Descripción        |
|-------|--------|--------------------|
| `id`  | number | ID único            |
| `name`| string | Nombre del producto|

Coherente con entidad Producto real.

---

### Pedidos (`orders`)

| Campo            | Tipo   | Descripción |
|------------------|--------|-------------|
| `id`             | number | ID pedido   |
| `customer`       | object | `{ id, name }` |
| `status`         | string | `pending` \| `finished` \| `incident` |
| `loadDate`       | string | ISO (YYYY-MM-DDTHH:mm:ss.sssZ) |
| `temperature`    | number | °C (ej. 4, -18) |
| `transport`      | object | `{ name }` (opcional) |
| `productProgress`| array  | Ver abajo   |
| `palletIds`      | number[]| IDs de palets vinculados |

**productProgress[]** (progreso por producto):

| Campo             | Tipo   | Descripción |
|-------------------|--------|-------------|
| `product`         | object | `{ id, name }` |
| `plannedQuantity` | number | kg planificados |
| `plannedBoxes`    | number | cajas planificadas |
| `completedQuantity` | number | kg completados (de palets) |
| `completedBoxes`  | number | cajas completadas |
| `remainingQuantity` | number | restante (puede ser negativo si excedido) |
| `remainingBoxes`  | number | idem |
| `status`         | string | `pending` \| `completed` \| `exceeded` |

---

### Palets (`pallets`)

| Campo           | Tipo     | Descripción |
|-----------------|----------|-------------|
| `id`            | number   | ID único    |
| `orderId`       | number \| null | Pedido al que pertenece; `null` = palet libre |
| `receptionId`   | number \| null | Si viene de recepción (en mock siempre null) |
| `productsNames` | string[]| Nombres de productos en el palet |
| `lots`         | string[] | Lotes (trazabilidad) |
| `numberOfBoxes` | number  | Número de cajas |
| `netWeight`     | number  | Peso neto total (kg) |

Coherente con modelo real: palet puede existir sin pedido (`orderId` null).

---

### Cajas disponibles (`availableBoxes`)

Cajas que ya tienen etiqueta (emitidas en Pantalla 1) y están pendientes de escaneo. Al escanear en Pantalla 2 se agregan a un palet y dejan de estar "disponibles".

| Campo        | Tipo   | Descripción                          |
|-------------|--------|--------------------------------------|
| `id`        | number | ID único (código escaneable simulado)|
| `productId` | number | ID producto                          |
| `productName` | string | Nombre producto                    |
| `lot`       | string | Lote (trazabilidad)                  |
| `netWeight` | number | Peso neto (kg)                       |
| `status`    | string | `'available'`                       |

Estado inicial: semilla de 6 cajas (ids 10001–10006) para poder probar Pantalla 2 sin generar antes en Pantalla 1.

## Relaciones

- Un **pedido** tiene `palletIds` → lista de palets vinculados.
- Un **palet** tiene `orderId` → pedido al que está asignado (o null).
- El **progreso** del pedido (productProgress) se deriva de la suma de los palets vinculados; en la maqueta se actualiza al simular "Guardar palet" (se añade un palet y se recalculan completed/remaining por producto).

## Estados

- **Pedido:** `pending` (En producción), `finished` (Terminado), `incident` (Incidencia).
- **Línea producto:** `pending`, `completed`, `exceeded` (completado por encima de lo planificado).

## Valores simulados

- Productos: IDs 501–512, nombres sector pesquero (Atún, Salmón, Merluza, etc.).
- Pedidos: IDs 12345–12348; clientes y temperaturas ficticios.
- Palets: IDs desde 9001; algunos con `orderId` null (libres), otros vinculados a 12345 o 12346.
