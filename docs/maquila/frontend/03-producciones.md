---
title: Portal de Maquila — Producciones
description: Listado, panel interactivo, detalle, trazabilidad y adjuntos de los lotes de producción propios del cliente de maquila.
updated: 2026-08-13
audience: Frontend Engineers
---

# Producciones

## Actor y alcance

Cliente de maquila (`ExternalUser` con `tollClientId`), solo lectura en todo este archivo. Ve
**lotes completos** (`Production`) cuyo propietario único es él —
`Production::hasOwnershipEstablished() && resolveOwnerTollClientId() === tollClientId` (propiedad a
nivel de **lote completo**, no de proceso individual — un `Production` no puede mezclar propietarios
distintos entre sus `ProductionRecord`, decisión de negocio confirmada explícitamente incluso para
el caso de eficiencia de carga en túnel/autoclave compartido). Un lote **sin propiedad establecida
todavía** (recién creado, sin inputs) no es visible para ningún cliente de maquila — fail-closed, no
aparece ni en listado ni en detalle, no es un bug.

## 1. Listado (tabla)

```
GET /api/v2/maquila/productions
```

**Estado: 🔶 implementado sin ningún filtro** (verificado en código,
`MaquilaProductionController::index` — solo pagina, `perPage`, tope no forzado explícitamente en el
controller pero sí en la query general). Filtros pendientes de añadir (confirmados 2026-08-13:
lote, rango de fechas, estado, especie):

| Parámetro           | Tipo   | Estado                                                                                |
| ------------------- | ------ | ------------------------------------------------------------------------------------- |
| `perPage`           | número | ✅ soportado hoy                                                                      |
| `lot`               | string | ❌ pendiente de añadir (`like` sobre `Production.lot`)                                |
| `dateFrom`/`dateTo` | fecha  | ❌ pendiente (sobre `Production.date`)                                                |
| `speciesId`         | número | ❌ pendiente                                                                          |
| `status`            | string | ❌ pendiente — ver §2 para qué valores de estado tiene sentido compartir con el panel |

Shape de cada fila (`ProductionResource` + `MaquilaProductionVisibilityPolicy::stripFromProductionArray()`,
verificado en código — `closedBy`/`closedByUser`/`reopenedBy`/`reopenedByUser` se eliminan, el resto
se mantiene tal cual):

```json
{
  "id": 210,
  "lot": "L-2026-0810-A",
  "speciesId": 4,
  "species": { "id": 4, "name": "Merluza" },
  "captureZoneId": 12,
  "captureZone": { "id": 12, "name": "FAO 27" },
  "notes": "Lote maquila cliente 7",
  "openedAt": "2026-08-10T07:30:00+00:00",
  "closedAt": null,
  "isOpen": true,
  "isClosed": false,
  "date": "2026-08-10",
  "totalInputWeight": 1200.0,
  "totalOutputWeight": 1140.5,
  "totalInputBoxes": 40,
  "totalOutputBoxes": 38,
  "waste": 59.5,
  "wastePercentage": 4.96,
  "yield": 0,
  "yieldPercentage": 0,
  "records": [
    { "id": 501, "processId": 3, "startedAt": "2026-08-10T07:35:00+00:00", "finishedAt": null }
  ],
  "closureReason": null,
  "reopenedAt": null,
  "reopenReason": null,
  "createdAt": "2026-08-10T07:30:00+00:00",
  "updatedAt": "2026-08-10T09:00:00+00:00"
}
```

`records[]` solo trae `id`/`processId`/`startedAt`/`finishedAt` en el listado — el detalle
(`diagramData`) solo se sirve con `?include_diagram=1` en el endpoint de detalle o vía el endpoint de
trazabilidad dedicado (§3).

## 2. Panel interactivo (en curso / terminadas / por estado)

**Estado: ❌ no implementado.** El precedente interno (`ProductionControlPanelService`, usado hoy por
`ProductionControlPanelController` para el tenant) es el más maduro para este concepto, pero **no es
reutilizable tal cual**:

1. Filtra siempre `whereNull('closed_at')` — el portal necesita ver también las cerradas.
2. No filtra por `toll_client_id` — es una vista 100% interna sobre todo el tenant.
3. Expone coste manual por caja (`costs.missingCostBoxesSample[].manualCostPerKg`) y alertas
   `missing_cost` — dato que el cliente de maquila no debe ver.

**Diseño de intención** (documento maestro §25.5.2): adaptar el mismo concepto — resumen + tabla con
estado derivado (`open`/`not_reconciled`/`ready_to_close`/`not_closeable`/`closed`) + alertas de
reconciliación de **cantidades** (nunca de coste) — filtrado por propiedad, incluyendo cerradas.
Endpoint y forma exacta a definir en STEP 2 de backend; no asumas todavía nombres de campo para
`status`/`alerts` distintos de los del panel interno (que sirven de referencia de intención, no de
contrato).

Ejemplo de referencia (**forma del panel interno, no del portal — usar solo como guía de intención,
sin el bloque `costs`**):

```json
{
  "summary": { "openProductions": 3 },
  "productions": [
    {
      "id": 210,
      "lot": "L-2026-0810-A",
      "date": "2026-08-10",
      "status": "not_reconciled",
      "species": { "id": 4, "name": "Merluza" },
      "metrics": {
        "inputWeightKg": 1200.0,
        "producedWeightKg": 1140.5,
        "salesWeightKg": 0,
        "stockWeightKg": 1140.5,
        "reprocessedWeightKg": 0,
        "balanceWeightKg": 59.5
      },
      "reconciliation": {
        "status": "warning",
        "productsOk": 2,
        "productsWarning": 1,
        "productsError": 0
      },
      "closure": { "canClose": false, "blockingReasons": ["reconciliation_not_ok"] },
      "alerts": [
        {
          "severity": "warning",
          "code": "reconciliation_not_ok",
          "message": "Faltan 59.5 kg por contabilizar."
        }
      ]
    }
  ]
}
```

**Nunca debe aparecer un bloque `costs` ni una alerta `missing_cost` en la versión de portal.**

## 3. Detalle de un lote

```
GET /api/v2/maquila/productions/{id}
```

**Estado: ✅ implementado.** Mismo `ProductionResource` recortado, un único objeto en `data`. 403 si
el lote no es propiedad del cliente autenticado, o si no tiene propiedad establecida todavía.

## 4. Trazabilidad (diagrama)

```
GET /api/v2/maquila/productions/{production}/traceability
```

**Estado: ✅ implementado.** Devuelve `{ "data": <árbol> }`, resultado de
`Production::buildOwnershipFilteredProcessTree($tollClientId)` — recorre todos los nodos del lote y
filtra por propiedad. La forma exacta del árbol (nodos, hijos, tipos `sales`/`stock`/`reprocessed`/
`balance`) es la misma estructura ya documentada para trazabilidad interna en
`docs/produccion/frontend/` — no se repite aquí; la única diferencia es que este endpoint ya viene
pre-filtrado por `toll_client_id` y sin necesidad de pasar ningún parámetro de cliente/pedido.

## 5. Adjuntos

```
GET /api/v2/productions/{production}/attachments
GET /api/v2/productions/{production}/attachments/{attachment}
GET /api/v2/productions/{production}/attachments/{attachment}/download
GET /api/v2/productions/{production}/attachments/{attachment}/thumbnail
```

**Estado: ✅ implementado.** Solo lectura para el cliente de maquila. Colecciones disponibles:
`production_photo`, `production_quality_control`, `production_document`,
`production_damage_or_discrepancy` (mimes/tamaños: fotos JPEG/PNG/WEBP máx. 10 MB; control de
calidad y documento PDF/Office máx. 20 MB; daño/discrepancia PDF/imagen máx. 10 MB). Mismo
`AttachmentResource` que en `02-almacen-interactivo.md`.

## Ramas alternativas (verificadas en código)

- Cliente intenta cerrar/reabrir el lote, o crear/editar cualquier `ProductionRecord`/input/output →
  **403** explícito para `ExternalUser` en todos esos métodos de `ProductionPolicy`; no hay ninguna
  ruta de escritura expuesta bajo `actor:external` para producción.
- Cliente intenta subir un adjunto → **403**.
- Lote con propiedad mezclada entre tenant y cliente, o entre dos clientes de maquila → no puede
  ocurrir (bloqueado en el momento de crear el `ProductionInput`/`ProductionOutputConsumption`, ver
  documento maestro §23.2) — si alguna vez apareciera un dato inconsistente heredado, el árbol de
  trazabilidad seguiría filtrando correctamente nodo a nodo (es una red de seguridad de solo
  lectura), pero no debería ocurrir con datos creados después del 2026-08-13.
- Acceso directo por id a un lote de otro cliente de maquila, del tenant, o sin propiedad establecida
  → **403** en los tres casos, sin distinción en el código de error entre ellos.
