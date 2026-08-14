---
title: Portal de Maquila — Almacén Interactivo
description: Listado y detalle de palets propios del cliente de maquila (masonry de cards).
updated: 2026-08-13
audience: Frontend Engineers
---

# Almacén interactivo (palets)

**Estado: ✅ implementado y verificado en código (2026-08-13).** Es la pieza más madura del portal —
no requiere backend nuevo.

## Actor y alcance

Cliente de maquila (`ExternalUser` con `tollClientId`). Ve **solo sus propios palets**
(`Pallet.toll_client_id` = el suyo), sin necesidad de que se le asigne ningún almacén manualmente
(`Store.external_user_id` no hace falta rellenarlo — decisión confirmada, documento maestro §18.5.3).
**El cliente nunca ve el nombre ni la estructura de nuestros almacenes físicos** — solo sus propios
palets, como una colección de tarjetas (masonry), no un plano de almacén.

## Listado (masonry)

```
GET /api/v2/pallets
```

Ruta compartida con el resto de la app (grupo `actor:internal,external`) — no hay una ruta separada
bajo `/maquila/*`. El filtrado por propiedad (`toll_client_id`) lo aplica automáticamente
`PalletListService::list()` vía `ActorScopeService::scopeOwnedPallets()`; el frontend no necesita
(ni puede) pasar ningún parámetro de propiedad — llega ya scopeado.

**Filtros disponibles** (verificados en `PalletListService::applyFilters()`), todos opcionales:

| Parámetro                                                  | Tipo                                     | Nota                                   |
| ---------------------------------------------------------- | ---------------------------------------- | -------------------------------------- |
| `state`                                                    | `registered\|stored\|shipped\|processed` | Estado del palet                       |
| `orderState`                                               | `pending\|finished\|without_order`       | Estado del pedido vinculado, si lo hay |
| `position`                                                 | `located\|unlocated`                     | Si tiene posición física asignada      |
| `dates.start`/`dates.end` o `dateFrom`/`dateTo`            | fecha                                    | Sobre `created_at`                     |
| `notes`                                                    | string                                   | Búsqueda en observaciones              |
| `lots[]`                                                   | array                                    | Por lote de caja                       |
| `products[]`                                               | array de IDs                             | Por producto                           |
| `species[]`                                                | array de IDs                             | Por especie                            |
| `weights.netWeight.min/max`, `weights.grossWeight.min/max` | número                                   | Rango de peso                          |
| `hasAvailableBoxes` / `hasUsedBoxes`                       | boolean                                  | Si tiene cajas disponibles/usadas      |
| `perPage`                                                  | número                                   | Tope 100                               |

`stores`/`store.id`/`orders`/`orderIds`/`buyerReference`/`orderDates` también existen en el servicio
pero tienen poco sentido para un cliente de maquila (no ve nuestros almacenes ni pedidos internos) —
no los expongas en la UI del portal aunque el backend los acepte sin error.

**Shape de cada palet** (`PalletResource`, verificado en código):

```json
{
  "id": 501,
  "observations": "Palet mixto merluza",
  "palletTareWeightKg": 22.5,
  "state": { "id": "stored", "name": "Almacenado" },
  "productsNames": ["Merluza HG"],
  "boxes": [
    {
      "id": 9001,
      "netWeight": 18.4,
      "...": "resto de campos de la caja — nunca incluye manualCostPerKg/traceableCostPerKg/costPerKg/totalCost para este actor"
    }
  ],
  "lots": ["L-2026-0813"],
  "netWeight": 620.5,
  "position": null,
  "store": null,
  "orderId": null,
  "numberOfBoxes": 34,
  "availableBoxesCount": 34,
  "usedBoxesCount": 0,
  "totalAvailableWeight": 620.5,
  "totalUsedWeight": 0,
  "receptionId": 88
}
```

**Coste nunca visible**: `PalletManualCostPolicy::authorized()` devuelve `false` para cualquier
`ExternalUser` (no tiene `hasAnyRole`) — los campos `manualCostPerKg`/`traceableCostPerKg`/
`costPerKg`/`totalCost` de cada caja, y `costPerKg`/`totalCost` a nivel de palet, **no aparecen en
absoluto** en la respuesta para este actor (no vienen como `null`, se omiten). No los esperes ni
los muestres condicionalmente — no van a llegar nunca por este endpoint para este actor.

## Detalle de un palet

```
GET /api/v2/pallets/{id}
```

Mismo `PalletResource`. 403 si el palet no pertenece al cliente de maquila autenticado.

## Adjuntos (imágenes/documentos)

```
GET    /api/v2/pallets/{pallet}/attachments
GET    /api/v2/pallets/{pallet}/attachments/{attachment}
GET    /api/v2/pallets/{pallet}/attachments/{attachment}/download
GET    /api/v2/pallets/{pallet}/attachments/{attachment}/thumbnail
```

Solo lectura para el cliente de maquila (`POST`/`PATCH`/`DELETE` devuelven 403). Colección única
disponible para palets: `pallet_image` (imágenes JPEG/PNG/WEBP, máx. 10 MB, máx. 20 por palet).

Shape (`AttachmentResource`, verificado en código):

```json
{
  "id": 12,
  "collection": "pallet_image",
  "originalName": "palet-501-foto1.jpg",
  "mimeType": "image/jpeg",
  "extension": "jpg",
  "size": 843221,
  "notes": null,
  "metadata": null,
  "uploadedBy": { "id": 3, "name": "Operario Juan" },
  "createdAt": "2026-08-10T09:15:00+00:00"
}
```

`thumbnail`/`download` devuelven el binario directamente (no JSON) — úsalos como `src` de `<img>` o
como link de descarga, no los parsees como JSON.

## Ramas alternativas (verificadas en código)

- Intento de `POST /pallets` o `PUT /pallets/{id}` (crear/editar) → **403**, fail-closed para
  cualquier `ExternalUser` con `toll_client_id` asignado, independientemente de si tiene o no acceso
  a algún almacén (`PalletPolicy`).
- Intento de ver un palet de **otro** cliente de maquila, o un palet propio del tenant → **403**.
- Intento de subir un adjunto (`POST .../attachments`) → **403**.
- Palet en estado `REGISTERED` (sin posición física todavía) → aparece igual en el listado, con
  `position: null` y `store: null` — no es un error, es un estado normal a representar en la UI
  (p. ej. sin badge de ubicación, no como tarjeta vacía/rota).
- Palet ya devuelto al cliente (`toll_client_return_id` informado, ver `07-devoluciones.md`) → sigue
  visible en el histórico, estado `shipped` — no desaparece del almacén virtual.
