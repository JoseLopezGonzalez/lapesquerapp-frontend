# Contrato API — Despachos de cebo (solo líneas)

**Alineado con**: Recepciones de materia prima en modo líneas.  
**Restricción**: Solo creación/edición por líneas; no se aceptan `pallets` ni `creationMode`.

---

## Base URL

`/api/v2/cebo-dispatches` (con header `X-Tenant` y `Authorization: Bearer {token}`).

---

## POST — Crear despacho

**Request body** (mismo contrato que recepciones en modo líneas):

```json
{
  "supplier": { "id": 1 },
  "date": "2026-02-17",
  "notes": "Opcional",
  "details": [
    { "product": { "id": 10 }, "netWeight": 150.5 },
    { "product": { "id": 12 }, "netWeight": 80, "price": 1.25, "lot": "OPCIONAL", "boxes": 4 }
  ]
}
```

- **Requeridos**: `supplier.id`, `date`, `details` (array con al menos un elemento). Cada detalle: `product.id`, `netWeight`.
- **Opcionales en detalle**: `price`, `lot`, `boxes` (en cebo solo se persiste `price`; `lot` y `boxes` se aceptan por contrato pero no se guardan).
- **Prohibidos**: `pallets`, `creationMode` (si se envían, respuesta 422).

**Respuesta 201**:

```json
{
  "message": "Despacho de cebo creado correctamente.",
  "data": {
    "id": 1,
    "supplier": { "id": 1, "name": "...", ... },
    "date": "2026-02-17",
    "notes": "Opcional",
    "netWeight": 230.5,
    "details": [
      { "id": 1, "product": { "id": 10, ... }, "netWeight": 150.5, "price": null },
      { "id": 2, "product": { "id": 12, ... }, "netWeight": 80, "price": 1.25 }
    ]
  }
}
```

---

## PUT — Actualizar despacho

**URL**: `PUT /api/v2/cebo-dispatches/:id`  
**Body**: Misma estructura que POST (supplier, date, notes, details). No se aceptan `pallets` ni `creationMode`.

**Respuesta 200**: Misma estructura que en create (`data` con id, supplier, date, notes, netWeight, details).

---

## GET — Listado y detalle

- **GET /api/v2/cebo-dispatches**: Listado paginado; filtros: `id`, `ids`, `suppliers`, `dates[start|end]`, `species`, `products`, `notes`, `perPage`.
- **GET /api/v2/cebo-dispatches/:id**: Un despacho con `supplier`, `details` (cada uno con `product`, `netWeight`, `price`).

Estructura de cada ítem del listado y del show igual que la de `data` en create/update (id, supplier, date, notes, netWeight, details).

---

## DELETE

- **DELETE /api/v2/cebo-dispatches/:id**: Elimina un despacho (200).
- **DELETE /api/v2/cebo-dispatches**: Body `{ "ids": [1, 2, ...] }` — elimina múltiples (200).
