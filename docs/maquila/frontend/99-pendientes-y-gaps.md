---
title: Portal de Maquila — Pendientes y Gaps (changelog vivo)
description: Registro cronológico de discrepancias entre lo documentado y lo que la implementación real del frontend/backend necesitó.
updated: 2026-08-13
audience: Frontend Engineers
---

# Pendientes y gaps (changelog vivo)

Este archivo es el registro de todo lo que **no coincide** entre lo documentado en esta carpeta y la
realidad, a medida que se implementa y se prueba el frontend. Añade una entrada nueva arriba (orden
cronológico inverso, más reciente primero) cada vez que:

- El backend no manda un campo que el frontend necesita.
- El backend manda un campo que el frontend nunca usa (candidato a quitar, o a dejar documentado
  como "existe pero no se consume").
- Un comportamiento real no coincide con lo documentado en `01-*.md`-`07-*.md`.
- Se detecta un problema de seguridad/negocio (dato que no debería verse y se ve, o al revés).

Formato de cada entrada: fecha, pantalla afectada, qué se encontró, estado (abierto/decidido/
corregido), y si aplica, qué se decidió.

---

## Gaps abiertos (prioridad alta — afectan a una decisión de negocio ya confirmada)

### 2026-08-13 — Precio/margen de venta a clientes finales visible en detalle de pedido

**Pantalla:** `04-pedidos.md`. **Qué se encontró:** `MaquilaOrderVisibilityPolicy::HIDDEN_FIELDS` no
incluye ninguno de los campos de precio/coste/margen que expone `OrderDetailsResource`
(`plannedProductDetails`, `auxiliaryLines`, `subTotalAmount`, `totalAmount`, `totalCost`,
`grossMargin`, `marginPercentage`, `revenuePerKg`, `costPerKg`, `marginPerKg`). Esto contradice la
decisión de negocio confirmada el 2026-08-13 (documento maestro §25.7): el cliente de maquila nunca
debe ver el precio/margen de la venta a sus propios clientes finales. También afecta a
`OrderResource` (usado en el listado), que expone `subtotalAmount`/`totalAmount` sin recortar.
**Estado:** abierto, no corregido. **Acción pendiente:** ampliar
`MaquilaOrderVisibilityPolicy::HIDDEN_FIELDS` (o crear una lista separada para campos de
precio/margen) antes de dar por usable la pantalla de pedidos del portal en producción con clientes
reales.

---

## Gaps abiertos (prioridad media — huecos de funcionalidad, no de seguridad)

### 2026-08-13 — Dashboard no implementado

**Pantalla:** `01-dashboard.md`. Ningún endpoint existe. Ver ese archivo para el diseño de intención
completo (widgets confirmados, endpoints propuestos).

### 2026-08-13 — Panel interactivo de producciones no implementado

**Pantalla:** `03-producciones.md` §2. El precedente interno (`ProductionControlPanelService`) no es
reutilizable tal cual (expone coste, solo cubre abiertas). Ver ese archivo para el diseño de
intención.

### 2026-08-13 — Filtros de listado de producciones ausentes

**Pantalla:** `03-producciones.md` §1. Confirmados (lote, fechas, estado, especie) pero no
implementados todavía.

### 2026-08-13 — Filtros de listado de pedidos incompletos

**Pantalla:** `04-pedidos.md` §1. Solo `status` hoy; confirmados fechas + texto libre, pendientes de
implementar.

### 2026-08-13 — Lectura de `MaquilaServiceCharge` no implementada para `ExternalUser`

**Pantalla:** `06-service-charges.md`. Revierte una decisión previa (§20.4/§24.2 del documento
maestro) — ver ese archivo para el contexto completo. `MaquilaServiceChargePolicy::view/viewAny`
necesitan ampliarse.

### 2026-08-13 — `customerDisplayName` no confirmado en `OrderDetailsResource`/`OrderResource`

**Pantalla:** `04-pedidos.md` §2. El accessor `Order::getCustomerDisplayNameAttribute()` existe en el
modelo (pensado para mostrar el nombre del cliente sin distinguir `Customer` real de "cliente al
vuelo"), pero no se ha verificado si `OrderResource`/`OrderDetailsResource` lo incluyen. Verificar al
implementar la pantalla de listado/detalle de pedidos.

### 2026-08-13 — Indicador de coste sin recortar en palets de `TollClientReturn`

**Pantalla:** `07-devoluciones.md`. `TollClientReturn::toArrayAssoc()` serializa `pallets` vía
`toArrayAssocV2()` directamente, sin pasar por `PalletManualCostPolicy` (a diferencia de
`PalletResource`, que sí lo hace). Verificar si esto deja algún campo de coste visible para el
cliente de maquila al implementar/probar el flujo completo de devoluciones.

---

## Gaps abiertos (prioridad baja — a confirmar cuando se necesite, no bloquean nada)

### 2026-08-13 — Sin endpoint para resolver `slug` de branding por email

**Pantalla:** `00-index.md` §1.2. No hay forma de que el frontend sepa el `slug` de un cliente de
maquila antes de que el usuario lo escriba en la URL o se le proporcione directamente. Si se necesita
un flujo de "he olvidado mi URL de acceso", habría que diseñarlo — no existe hoy.

---

## Plantilla para nuevas entradas

```markdown
### YYYY-MM-DD — Título corto del hallazgo

**Pantalla:** `0X-nombre.md` §Y. **Qué se encontró:** ... **Estado:** abierto / decidido (qué se
decidió) / corregido (qué commit/PR). **Acción pendiente:** ...
```
