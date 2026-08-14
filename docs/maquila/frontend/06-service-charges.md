---
title: Portal de Maquila — Cargo de Servicio
description: Lectura del cargo que el tenant factura al cliente de maquila por el servicio de procesamiento (MaquilaServiceCharge).
updated: 2026-08-13
audience: Frontend Engineers
---

# Cargo de servicio de maquila (`MaquilaServiceCharge`)

**Estado: ❌ no implementado para este actor.** El modelo, backend interno y export A3ERP/Facilcom sí
existen (documento maestro §20/§24.2), pero `MaquilaServiceChargePolicy` hoy **no acepta
`ExternalUser` en absoluto** — cualquier cliente de maquila recibe 401/403 limpio al día de hoy si
intentara acceder (verificado con test existente).

## ⚠️ Esto revierte una decisión previa — contexto necesario

Cuando se implementó la facturación de servicios de maquila (2026-08-13, documento maestro §20.4/
§24.2), se decidió explícitamente **no** exponer `MaquilaServiceCharge` al portal en v1 — "lectura
no expuesta al portal de `ExternalUser`". Al simular el circuito completo del portal más tarde ese
mismo día, se revirtió esa decisión: el cliente de maquila **sí** debe poder ver, en modo lectura,
el cargo completo (con líneas) que le facturamos por el servicio — a diferencia del precio de venta
a sus propios clientes finales (`04-pedidos.md`), que sigue oculto sin excepción. Es una distinción
de negocio explícita: "lo que nos paga por la maquila" es su dato; "lo que él cobra a su cliente
final" no lo es.

## Qué es un `MaquilaServiceCharge`

Un cargo (potencialmente con varias líneas) que el tenant emite hacia un `TollClient` concreto, no
ligado directamente a `Order`/`Customer` (que tiene semántica de venta de mercancía, no de servicio).
Puede referenciar opcionalmente, solo a efectos de trazabilidad, la expedición que lo originó
(`chargeableType`/`chargeableId`: `Order` o `TollClientReturn`).

## Endpoints propuestos (nombres provisionales, a implementar)

```
GET /api/v2/maquila/service-charges
GET /api/v2/maquila/service-charges/{id}
```

Requiere: ampliar `MaquilaServiceChargePolicy::view()`/`viewAny()` para aceptar `ExternalUser` con
`toll_client_id` coincidente (fail-closed, mismo patrón que el resto del portal). `create`/`update`/
`delete` **no cambian** — siguen exclusivos de Administrador, nunca accesibles desde el portal.

Shape esperado (basado en `MaquilaServiceCharge::toArrayAssoc()`, verificado en el modelo real —
la ruta todavía no existe, así que esto es la forma que **debería** devolver una vez implementada la
lectura para `ExternalUser`, no algo ya probado end-to-end para este actor):

```json
{
  "id": 15,
  "tollClient": { "id": 7, "name": "Conservas del Norte S.L." },
  "chargeableType": "order",
  "chargeableId": 3301,
  "date": "2026-08-13",
  "status": "draft",
  "notes": "Servicio de fileteado agosto",
  "lines": [
    {
      "id": 40,
      "orderId": null,
      "auxiliaryProduct": null,
      "description": "Servicio de fileteado, 1200 kg",
      "effectiveDescription": "Servicio de fileteado, 1200 kg",
      "quantity": 1200,
      "unit": "kg",
      "unitPrice": 0.35,
      "tax": { "id": 1, "name": "IVA 21%", "rate": 21 },
      "subtotal": 420.0,
      "total": 508.2
    }
  ],
  "subtotal": 420.0,
  "total": 508.2
}
```

`status` es `draft` o `invoiced` (`MaquilaServiceCharge::STATUS_DRAFT`/`STATUS_INVOICED`, verificado
en el modelo).

## Pendiente de decidir antes de implementar

- **Visibilidad de cargos en `draft`**: ¿el cliente los ve igual que uno `invoiced` (es de solo
  lectura, no hay riesgo de que lo modifique), o solo cuando el tenant lo marca como definitivo
  (para no confundirlo con cifras a medio editar)? No asumido — nota abierta, documento maestro
  §25.7bis.
- Filtros del listado (por fecha, por estado) — no confirmados todavía, no asumas ninguno.

## Qué NO entra aquí

`SimulatedRawMaterialCost` (coste de materia prima simulado, para uso interno del tenant al analizar
mercado) **no** forma parte de esta reversión — sigue siendo consulta exclusiva del tenant, nunca
visible en el portal, sin excepción.

## Ramas alternativas

- Cliente intenta ver el cargo de **otro** cliente de maquila por id directo → 403 esperado
  (`toll_client_id` no coincide) — a verificar cuando se implemente.
- Cliente intenta crear/editar/borrar un cargo o una línea → 403 (exclusivo Administrador, sin
  cambios).
