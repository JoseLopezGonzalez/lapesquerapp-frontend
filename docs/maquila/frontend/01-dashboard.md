---
title: Portal de Maquila — Dashboard
description: Pantalla de aterrizaje del portal con resumen operativo del cliente de maquila.
updated: 2026-08-13
audience: Frontend Engineers
---

# Dashboard

**Estado: ❌ no implementado.** Nada de lo que hay en este archivo existe en backend todavía — es la
especificación a implementar, con los shapes de respuesta propuestos (no generados desde código
real). Diseño acordado en el documento maestro §25.1 (decisión #1) y §25.3.

## Actor

Exclusivamente cliente de maquila (`ExternalUser` con `tollClientId`). Pantalla 100% de solo
lectura — ninguna acción se dispara desde aquí.

## Precedente a tener en cuenta (no copiar tal cual)

El dashboard admin interno (`src/components/Admin/Dashboard/`) es un masonry de ~16 widgets, cada
uno con su propio endpoint independiente bajo `statistics/*`. Ese patrón de composición (varios
endpoints pequeños, no uno agregado) es el que replica esta pantalla — pero **ninguno de esos
endpoints internos es reutilizable tal cual**: cuelgan todos del grupo de rutas
`role:tecnico,administrador,direccion,administracion,comercial,operario,supervisor` (sin acceso para
`ExternalUser`) y sus servicios (`StockStatisticsService`, `OrderStatisticsController`, etc.) son
queries tenant-wide sin ningún parámetro de propiedad (`toll_client_id`). Cada widget de abajo
necesita su propio endpoint nuevo bajo `/maquila/*`, aunque reutilice la lógica de query interna
donde sea directo.

## Widgets confirmados (2026-08-13)

| Widget                                    | Analogía interna                                                          | Dato                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Stock total + por especie                 | `statistics/stock/total`, `statistics/stock/total-by-species`             | kg del almacén virtual (§`02-almacen-interactivo.md`)                               |
| Contadores por estado                     | — (sin analogía directa)                                                  | nº producciones abiertas, nº recepciones recientes, pedidos por estado              |
| Gráficas temporales (kg)                  | `orders/sales-chart-data`, `raw-material-receptions/reception-chart-data` | evolución de recepciones/pedidos propios, en kg, **nunca en €**                     |
| Importe facturado por servicio de maquila | — (sin analogía directa, es nuevo)                                        | total de `MaquilaServiceCharge` propios en un periodo — ver `06-service-charges.md` |

**Descartados explícitamente** (no construir, ver documento maestro §25.3 para el motivo de cada
uno): rentabilidad/margen (`orders/profitability-*`), ranking de clientes/comerciales
(`orders/ranking`, `sales-by-salesperson`), transporte (`orders/transport-chart-data`), importe de
**pedidos hacia sus clientes finales** (`orders/total-amount`, `auxiliary-lines/*`), calibres diarios
por especie, despachos de cebo (`cebo-dispatches/*`), fichajes/RRHH, `settings`.

## Endpoints propuestos (nombres provisionales, a definir en STEP 2 de backend)

Ninguno de estos existe. Propuesta de forma, a validar cuando se implemente:

```
GET /api/v2/maquila/dashboard/summary
```

```json
{
  "data": {
    "openProductionsCount": 3,
    "recentReceptionsCount": 5,
    "ordersByStatus": { "pending": 2, "incident": 0, "finished": 12 },
    "stockTotalKg": 4820.5
  }
}
```

```
GET /api/v2/maquila/dashboard/stock-by-species
```

```json
{
  "data": [{ "id": 4, "name": "Merluza", "totalNetWeight": 2100.0, "percentage": 43.5 }]
}
```

```
GET /api/v2/maquila/dashboard/reception-chart-data?dateFrom=2026-07-01&dateTo=2026-08-13
GET /api/v2/maquila/dashboard/orders-chart-data?dateFrom=2026-07-01&dateTo=2026-08-13
```

Forma esperada: análoga a los charts internos equivalentes (serie temporal, eje kg), a confirmar
contra la forma real de `reception-chart-data`/`sales-chart-data` internos cuando se implemente —
**no asumas la forma exacta todavía, es una nota de intención, no un contrato.**

```
GET /api/v2/maquila/dashboard/service-charges-summary?dateFrom=...&dateTo=...
```

```json
{
  "data": {
    "totalInvoiced": 3450.0,
    "chargesCount": 6
  }
}
```

## Ramas alternativas

- Cliente de maquila recién creado, sin actividad → todos los contadores en 0 / arrays vacíos, no
  error. Ningún widget debe fallar por falta de datos previos.
- Actor sin `tollClientId` → 403 en cualquiera de estos endpoints (mismo patrón fail-closed que el
  resto del portal, ver `00-index.md` §1.3).

## Pendiente antes de implementar

Nombres de endpoint, forma exacta de las gráficas (¿un endpoint por gráfica o uno combinado?), y si
`dashboard/summary` se descompone en varias llamadas o se sirve de una — es una decisión de STEP 2
de backend, no cerrada todavía. Cuando se implemente, actualizar este archivo con la forma real
verificada en código, no antes.
