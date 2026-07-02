---
id: GAP-V2-013
title: Un pedido puede marcarse "finished" sin validar que la producción cubre lo planificado
module: orders
category: domain-business
priority: P1
risk: medium
size: M
status: ready
dependencies:
  - GAP-V2-011
target_files:
  - src/hooks/useOrder.ts
  - src/components/Admin/OrdersManager/Order/index.tsx
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-013 — Un pedido puede marcarse "finished" sin validar que la producción cubre lo planificado

## Problema

El pedido tiene dos vocabularios de estado independientes que no se cruzan entre sí:

1. **Estado global del pedido** (`OrderStatus` en `src/services/orderService.ts:637`):
   `'pending' | 'finished' | 'incident'`. Se cambia vía `updateOrderStatus` →
   `setOrderStatus(orderId, status)` (`src/hooks/useOrder.ts:188-198`).
2. **Estado por línea de producto** calculado en `mergeOrderDetails`
   (`src/hooks/useOrder.ts:35-88`): `'success' | 'difference' | 'pending' | 'noPlanned'` —
   compara lo planificado contra lo realmente producido, línea a línea.

`handleStatusChange` en `src/components/Admin/OrdersManager/Order/index.tsx:92-108` invoca
`updateOrderStatus(newStatus)` directamente, sin ninguna comprobación previa contra
`mergedProductDetails`. Esto significa que un pedido se puede marcar como `finished` aunque
todas (o parte de) sus líneas de producto sigan en estado `pending` (nada producido aún) o
`noPlanned` (se produjo algo no planificado, sin línea de pedido asociada).

Para una pesquera/congelados, "pedido finalizado" es una transición operativa crítica:
dispara documentación de salida (nota de carga, CMR, packing list — ver
`useOrderDocuments.ts`) y habitualmente factura al cliente. Cerrar un pedido cuyo producto
aún no se ha producido/empaquetado es un error que hoy el frontend no previene ni advierte
en el momento — solo sería visible si el usuario revisa manualmente la pestaña "Producción"
antes de cambiar el estado.

## Objetivo

Antes de permitir la transición a `finished`, el flujo debe advertir (idealmente bloquear o
pedir confirmación explícita) cuando existan líneas de `mergedProductDetails` en estado
distinto de `success` — dando al operario la oportunidad de corregir antes de cerrar el
pedido, no después.

## Contexto

Depende de GAP-V2-011 porque la clasificación `pending`/`difference`/`success` que esta
validación usaría como fuente de verdad debe primero tener un umbral de tolerancia correcto
— de lo contrario esta guarda heredaría el mismo problema de falsos positivos/negativos.

## Solución propuesta

Regla confirmada por Jose el 2026-07-02: no debe ser bloqueo duro. Si quedan líneas fuera
de cobertura/tolerancia, el sistema debe mostrar advertencia y pedir confirmación explícita
antes de marcar el pedido como `finished`.

Una vez implementada:

1. En `Order/index.tsx`, antes de invocar `updateOrderStatus('finished')`, comprobar
   `mergedProductDetails` (ya disponible vía `useOrder`) y si hay líneas `pending` o
   `noPlanned`, mostrar un diálogo de confirmación (patrón ya usado en el proyecto para
   acciones sensibles) con el detalle de qué líneas están incompletas.
2. Si el usuario confirma, continuar con `updateOrderStatus('finished')`; si cancela, no
   enviar la transición al backend.

## Criterios de aceptación

- [ ] Intentar marcar un pedido como `finished` con líneas de producto en estado `pending` o
      `noPlanned` dispara la advertencia/bloqueo acordado con Jose — no ocurre en silencio.
- [ ] Un pedido con todas las líneas en `success` (o `difference` dentro de tolerancia) se
      puede finalizar sin fricción añadida.
- [ ] La regla queda documentada en el código y en `project-learnings.md` si aplica.

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: en un pedido con al menos una línea planificada sin producción
asociada, intentar cambiar el estado a "Finalizado" desde la UI y confirmar que aparece la
advertencia/bloqueo antes de que la transición se confirme contra el backend.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-011
- Evidencia: `src/hooks/useOrder.ts:35-88,188-198`, `src/components/Admin/OrdersManager/Order/index.tsx:92-108`
