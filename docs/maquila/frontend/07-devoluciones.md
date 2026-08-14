---
title: Portal de Maquila — Devoluciones
description: Lectura de las devoluciones de mercancía al cliente de maquila (TollClientReturn).
updated: 2026-08-13
audience: Frontend Engineers
---

# Devoluciones (`TollClientReturn`)

**Estado: ✅ implementado y verificado en código (2026-08-13).**

## Qué es

Cubre la devolución de mercancía (terminada o sin procesar) al propio cliente de maquila — la otra
vía de expedición además de vender a sus clientes finales (`04-pedidos.md`). No es una venta: no
tiene `Customer`, no tiene precio. FK directa `pallets.toll_client_return_id` (no tabla pivote).

## Actor y alcance

Lectura compartida: tenant + cliente de maquila propietario. **Escritura exclusiva del tenant** —
el cliente de maquila nunca crea ni edita una devolución desde el portal.

## Listado

```
GET /api/v2/toll-client-returns
```

Ruta compartida (no bajo `/maquila/*`), grupo `actor:internal,external`. Para un `ExternalUser`, el
filtro por `toll_client_id` se aplica automáticamente en el controller (no hace falta, ni sirve,
pasar ningún parámetro de cliente).

Shape (`TollClientReturn::toArrayAssoc()`, verificado en código):

```json
{
  "id": 9,
  "tollClientId": 7,
  "tollClient": { "id": 7, "name": "Conservas del Norte S.L." },
  "transportId": 2,
  "transport": { "id": 2, "name": "Transportes Rías S.L." },
  "date": "2026-08-12",
  "documentReference": "ALB-DEV-0034",
  "reason": "Devolución de excedente sin procesar",
  "notes": null,
  "pallets": ["... palets afectados, mismo shape que 02-almacen-interactivo.md ..."],
  "createdAt": "2026-08-12T11:00:00+00:00",
  "updatedAt": "2026-08-12T11:00:00+00:00"
}
```

Nota: `pallets[]` usa `toArrayAssocV2()` directamente (no pasa por `PalletManualCostPolicy`) — a
verificar si eso deja algún campo de coste sin recortar para este actor cuando se implemente/pruebe
el flujo completo; si es así, regístralo en `99-pendientes-y-gaps.md`.

## Detalle

```
GET /api/v2/toll-client-returns/{id}
```

Mismo shape, con `pallets.boxes.box.product` cargado. 403 si la devolución no pertenece al cliente
autenticado.

## Ramas alternativas

- Cliente intenta crear una devolución (`POST /toll-client-returns`) → **403** — esa ruta está en el
  grupo interno (`role:*`), ni siquiera está expuesta bajo `actor:external`.
- Al ejecutarse (por el tenant), cada palet incluido pasa a `SHIPPED` vía `Pallet::changeToShipped()`
  — el cliente lo verá reflejado en el almacén interactivo (`02-almacen-interactivo.md`) en su
  próxima consulta, no en tiempo real.
- Acceso directo a una devolución de otro cliente de maquila → **403**.
