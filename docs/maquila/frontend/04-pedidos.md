---
title: Portal de Maquila — Pedidos
description: Gestor de pedidos del cliente de maquila hacia sus propios clientes finales — listado, detalle, creación, edición e incidencias.
updated: 2026-08-13
audience: Frontend Engineers
---

# Gestor de pedidos

## ⚠️ Hallazgo real (2026-08-13) — leer antes de implementar el detalle de pedido

**El backend hoy expone precio, coste y margen interno del tenant en el detalle de un pedido del
portal.** Se confirmó explícitamente (documento maestro §25.7) que el cliente de maquila **nunca**
debe ver el precio de venta a sus propios clientes finales — es una decisión comercial del tenant
sobre una venta a un tercero, no un dato operativo suyo. Pero al verificar el código
(`OrderDetailsResource`, usado por `show`/`store`/`update` del portal) y `MaquilaOrderVisibilityPolicy`
(la clase que debería recortarlo), el resultado es:

- `MaquilaOrderVisibilityPolicy::HIDDEN_FIELDS` solo oculta: `salesperson`, `fieldOperator`,
  `fieldOperatorId`, `paymentTerm`, `billingAddress`, `productionNotes`, `accountingNotes`,
  `offerId`, `routeId`, `routeStopId`, `createdByUserId`.
- `OrderDetailsResource` incluye, **sin recortar**: `plannedProductDetails`, `auxiliaryLines`,
  `auxiliarySubtotal`, `auxiliaryTotal`, `subTotalAmount`, `totalAmount`, `totalCost`, `grossMargin`,
  `marginPercentage`, `revenuePerKg`, `costPerKg`, `marginPerKg`.

Es decir: hoy, un cliente de maquila que abre el detalle de su propio pedido ve el margen y coste
interno del tenant sobre esa venta, no solo el precio. Esto es un gap real ya registrado en
`99-pendientes-y-gaps.md` (prioridad alta) — **no construyas la UI del portal asumiendo que estos
campos ya vienen ocultos.** Si implementas la pantalla de detalle de pedido antes de que se corrija
el backend, estos campos estarán presentes en la respuesta — no los muestres en la UI aunque
lleguen, y márcalo para corregir en backend antes de publicar el portal a clientes reales.

## Actor y alcance

Cliente de maquila (`ExternalUser` con `tollClientId`). Ve y gestiona **solo la cabecera** de
pedidos con `toll_client_id` = el suyo. Nunca puede vincular palets ni líneas de producción — eso es
exclusivo del tenant (decisión de negocio confirmada, documento maestro §5.6/§7 decisión #2).

## 1. Listado

```
GET /api/v2/maquila/orders
```

**Estado: 🔶 implementado, filtro solo por `status`** (verificado en código,
`MaquilaOrderController::index`). Confirmado 2026-08-13 (documento maestro §25.1 decisión #4):
ampliar con fechas + texto libre, igual que el listado interno de pedidos:

| Parámetro                       | Tipo                          | Estado                                                                             |
| ------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| `status`                        | `pending\|incident\|finished` | ✅ soportado hoy                                                                   |
| `perPage`                       | número                        | ✅ soportado hoy                                                                   |
| `dateFrom`/`dateTo`             | fecha                         | ❌ pendiente de añadir (sobre `load_date`)                                         |
| texto libre (nombre/referencia) | string                        | ❌ pendiente — debe cubrir tanto `adhocCustomerName` como `buyerReference`, ver §2 |

Shape de cada fila (`OrderResource` + `MaquilaOrderVisibilityPolicy::stripFromOrderArray()`,
verificado en código):

```json
{
  "id": 3301,
  "orderType": "standard",
  "customer": null,
  "buyerReference": "PED-CLI-0912",
  "status": "pending",
  "invoiced": false,
  "loadDate": "2026-08-20",
  "transport": { "id": 2, "name": "Transportes Rías S.L." },
  "pallets": 0,
  "totalBoxes": 0,
  "incoterm": null,
  "totalNetWeight": 0,
  "subtotalAmount": 1200.0,
  "totalAmount": 1452.0
}
```

⚠️ `customer` siempre es `null` para un pedido "cliente al vuelo" (§2) — el nombre real está en
`adhocCustomerName`, que **no aparece en `OrderResource`** (solo en `OrderDetailsResource`, ver
detalle). Si necesitas mostrar el destinatario en la fila del listado, usa el endpoint de detalle o
pide que se añada `adhocCustomerName`/`customerDisplayName` a `OrderResource` — hoy no está.
⚠️ `subtotalAmount`/`totalAmount` están presentes aquí también — mismo hallazgo de arriba, aplica
igual al listado, no solo al detalle.

## 2. Detalle

```
GET /api/v2/maquila/orders/{id}
```

**Estado: ✅ implementado** (con el hallazgo de precios de arriba). `OrderDetailsResource` recortado.
Campos relevantes para "cliente al vuelo" (verificados en el modelo `Order`, migración
`2026_08_12_100000`): `customerId` nullable, `adhocCustomerName`, `adhocCustomerAddress`
(mutuamente excluyentes con `customer` por convención de aplicación, no por constraint de BD).
`customerDisplayName` (accessor `Order::getCustomerDisplayNameAttribute()`) es el campo pensado para
mostrar "nombre del cliente" sin tener que comprobar tú mismo si hay `Customer` real o es ad-hoc —
pero **no está incluido todavía en `OrderDetailsResource`** (verificar contra el contrato real al
implementar; si falta, es un caso más para `99-pendientes-y-gaps.md`).

## 3. Crear pedido ("cliente al vuelo")

```
POST /api/v2/maquila/orders
```

**Estado: ✅ implementado.** Campos aceptados (`StoreOrderAsProcessorRequest`, whitelist derivada de
`UpdateOrderRequest::PROCESSOR_EDITABLE_FIELDS`, verificado en código):

```json
{
  "entryDate": "2026-08-15",
  "loadDate": "2026-08-20",
  "adhocCustomerName": "Pescados García S.L.",
  "adhocCustomerAddress": "Calle Mayor 12, Vigo",
  "buyerReference": "PED-CLI-0912",
  "transport": { "id": 2 },
  "transportationNotes": "Entrega antes de las 10h",
  "truckPlate": "1234ABC",
  "trailerPlate": null,
  "temperature": -18,
  "emails": ["contacto@pescadosgarcia.com"],
  "ccEmails": []
}
```

`entryDate`, `loadDate` y `adhocCustomerName` son obligatorios en creación (no en edición).
`loadDate` debe ser ≥ `entryDate` (422 con mensaje específico si no). Respuesta `201` con el mismo
shape del detalle (§2).

**Nunca envíes** `customerId`, `pallets`, `plannedProducts` ni `tollClientId` — no forman parte del
whitelist. Si los incluyes en el payload, se ignoran silenciosamente (verificado con test) —
`tollClientId` se fuerza siempre desde el usuario autenticado, nunca desde el body.

## 4. Editar cabecera

```
PUT /api/v2/maquila/orders/{id}
```

**Estado: ✅ implementado.** Mismo whitelist que creación (`UpdateOrderAsProcessorRequest`), campos
`sometimes` (no obligatorios salvo que se envíen). Mismas reglas y mismo bloqueo de campos no
permitidos.

## 5. Incidencia del pedido (lectura)

```
GET /api/v2/orders/{orderId}/incident
```

**Estado: ✅ implementado.** Ruta compartida (no bajo `/maquila/*`), lectura para tenant + cliente de
maquila propietario. 404 con `{ "message": "Incidencia no encontrada.", "userMessage": "No se
encontró incidencia para este pedido." }` si el pedido no tiene incidencia. Shape
(`Incident::toArrayAssoc()`, verificado en código):

```json
{
  "id": 77,
  "description": "Faltan 2 cajas en la entrega",
  "status": "open",
  "resolutionType": null,
  "resolutionNotes": null,
  "resolvedAt": null,
  "createdAt": "2026-08-14T10:00:00+00:00",
  "updatedAt": "2026-08-14T10:00:00+00:00"
}
```

**No hay indicador inline en el listado** (§1) de si un pedido tiene incidencia — decisión
confirmada de no añadirlo (documento maestro §25.1 decisión #4). Si el frontend necesita mostrarlo
en la tabla, tendría que hacer una llamada aparte por pedido, o pedir explícitamente que se añada —
no está en el alcance actual.

## 6. Envío de documentación (acción del tenant, no del portal)

```
POST /api/v2/orders/{orderId}/send-toll-client-documents
```

**Esto NO lo dispara el cliente de maquila** — es un botón exclusivo del panel interno del tenant,
documentado aquí solo para que el frontend del portal sepa que existe y no intente exponerlo. El
cliente de maquila solo recibe el email resultante (CMR / letreros de pedido), nunca ve ni acciona
este endpoint.

## Ramas alternativas (verificadas en código)

- Cliente intenta enviar `pallets`/`plannedProducts` con precio al crear o editar → se ignoran
  silenciosamente, el whitelist del Form Request nunca los acepta (verificado con test).
- Cliente intenta fijar `tollClientId` de otro cliente de maquila en el payload → se ignora, se
  fuerza siempre desde el usuario autenticado (verificado con test).
- Cliente intenta `DELETE` un pedido → no existe ninguna ruta de borrado bajo `actor:external` — 404
  a nivel de ruta, ni siquiera se evalúa `OrderPolicy`.
- Cliente intenta abrir, resolver o borrar una incidencia (`POST`/`PUT`/`DELETE` sobre
  `orders/{id}/incident`) → **403**, `IncidentPolicy::manage` es exclusiva del tenant y nunca acepta
  `ExternalUser`.
- Pedido pasa a `incident` (creado por el tenant) → el cliente lo ve reflejado en `status`, sin poder
  actuar.
- Tenant borra la incidencia → `Order::finalizeAfterIncident()` fuerza el pedido a `finished` y
  todos sus palets a `shipped` — el cliente lo ve reflejado en su próxima consulta, no en tiempo
  real (no hay websocket/push en este portal).
- Acceso directo a un pedido de otro cliente de maquila por id → **403**.
