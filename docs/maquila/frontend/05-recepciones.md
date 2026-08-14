---
title: Portal de Maquila — Recepciones
description: Listado, detalle y adjuntos de las recepciones de materia prima propias del cliente de maquila.
updated: 2026-08-13
audience: Frontend Engineers
---

# Recepciones

**Estado: ✅ implementado y verificado en código (2026-08-13).**

## Actor y alcance

Cliente de maquila (`ExternalUser` con `tollClientId`), solo lectura. Ve recepciones con
`toll_client_id` = el suyo.

## 1. Listado

```
GET /api/v2/maquila/receptions
```

Filtros: solo `perPage` hoy (mismo patrón que producciones, sin filtros adicionales todavía — no se
confirmaron explícitamente para esta pantalla en la sesión de diseño; si hacen falta, regístralo en
`99-pendientes-y-gaps.md` en vez de asumir cuáles).

Shape (`RawMaterialReceptionResource` + `MaquilaReceptionVisibilityPolicy::stripFromReceptionArray()`,
verificado en código — requiere serialización completa vía `json_decode(json_encode(...))` en el
backend antes del recorte, porque el Resource anida otras `JsonResource`):

```json
{
  "id": 88,
  "date": "2026-08-08",
  "notes": "",
  "declaredTotalNetWeight": 1250.0,
  "creationMode": "pallets",
  "netWeight": 1248.5,
  "species": ["Merluza"],
  "details": [
    { "productId": 4, "lot": "L-2026-0808", "...": "resto de campos — nunca incluye 'price'" }
  ],
  "pallets": ["... PalletResource, ver 02-almacen-interactivo.md ..."],
  "canEdit": false,
  "cannotEditReason": null,
  "lockedPalletIds": []
}
```

**Campos eliminados por completo** (no vienen ni como `null`): `supplier`, `prices`,
`declaredTotalAmount`, `totalAmount`, `supplier_liquidation_id`, y `price` dentro de cada elemento
de `details[]`. Es coste/dato financiero interno del tenant — la recepción cuelga siempre de un
`supplier_id` real internamente, pero eso nunca se expone al cliente de maquila.

`canEdit` siempre debe ser `false` para este actor en la práctica (el portal no expone ningún
endpoint de escritura sobre recepciones) — no lo uses para mostrar un botón de editar, no existe.

## 2. Detalle

```
GET /api/v2/maquila/receptions/{id}
```

Mismo shape recortado, un único objeto en `data`. 403 si la recepción no pertenece al cliente
autenticado.

## 3. Adjuntos

```
GET /api/v2/raw-material-receptions/{rawMaterialReception}/attachments
GET /api/v2/raw-material-receptions/{rawMaterialReception}/attachments/{attachment}
GET /api/v2/raw-material-receptions/{rawMaterialReception}/attachments/{attachment}/download
GET /api/v2/raw-material-receptions/{rawMaterialReception}/attachments/{attachment}/thumbnail
```

Solo lectura. Colecciones disponibles: `supplier_document`, `weighing_ticket`,
`invoice_or_delivery_note`, `reception_photo`, `pallet_photo`, `quality_control`,
`damage_or_discrepancy` (documentos PDF/Office máx. 20 MB; imágenes/control máx. 10-20 MB según
colección — ver `config/attachments.php` para el detalle exacto por colección si lo necesitas).
Mismo `AttachmentResource` que en `02-almacen-interactivo.md`.

⚠️ Aunque la colección se llama `supplier_document`, el cliente de maquila **sí** puede leerla
(`ReceptionAttachmentController` está bajo el grupo `actor:internal,external`, sin distinción de
colección) — el nombre es heredado del caso general de recepciones propias del tenant, no implica
que exponga datos de proveedor real. Si algún documento subido a esa colección sí contuviera datos
de proveedor sensibles (p. ej. un albarán con precio), sería responsabilidad de quien lo suba, no
un filtro automático del sistema — anótalo en `99-pendientes-y-gaps.md` si se detecta como problema
real en producción.

## Ramas alternativas

- Cliente intenta editar la recepción o subir un adjunto → **403** (no hay ninguna ruta de escritura
  expuesta al portal).
- Acceso directo a una recepción de otro cliente de maquila, o propia del tenant (materia prima no
  relacionada con maquila) → **403**.
