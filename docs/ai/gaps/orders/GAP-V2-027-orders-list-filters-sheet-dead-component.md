---
id: GAP-V2-027
title: OrdersListFiltersSheet.tsx es un componente muerto — nunca importado
module: orders
category: code-quality
priority: P3
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/OrdersList/OrdersListFiltersSheet.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-027 — `OrdersListFiltersSheet.tsx` nunca se importa desde ningún archivo

## Problema

`src/components/Admin/OrdersManager/OrdersList/OrdersListFiltersSheet.tsx` (154
líneas) implementa un `Sheet` inferior mobile con búsqueda, filtro por estado y
acciones secundarias (exportar, vista de producción). Su comentario interno dice:

```tsx
/**
 * Sheet inferior (mobile) con búsqueda, filtros por estado y acciones secundarias.
 * Plan: docs/mobile-app/implementacion/02-PLAN-LISTA-PEDIDOS-MOBILE.md (Fase 3)
 */
```

Una búsqueda del identificador `OrdersListFiltersSheet` en todo `src/` solo
devuelve el propio archivo — ningún otro componente lo importa ni lo renderiza.
`OrdersList/index.tsx` (el listado real que sí se usa en producción) implementa su
propia búsqueda/tabs inline en el header, sin usar este Sheet.

Es código muerto: compila, pero no forma parte de ningún flujo real. Si el plan
mobile de Fase 3 referenciado en el comentario nunca se completó, el archivo
debería eliminarse; si el plan sigue vigente, debería quedar explícitamente
marcado como en construcción o conectarse al flujo real.

## Objetivo

El árbol de componentes de `OrdersManager/OrdersList` no contiene componentes sin
importadores reales, o el componente queda conectado al flujo mobile si el plan
de Fase 3 sigue vigente.

## Contexto

Encontrado durante la revisión de código-calidad de `OrdersManager/OrdersList` en
`/deep-audit-module module=orders`. No hay GAP previo sobre este archivo.

## Solución propuesta

1. Confirmar con Jose si `docs/mobile-app/implementacion/02-PLAN-LISTA-PEDIDOS-MOBILE.md`
   Fase 3 sigue vigente.
2. Si no sigue vigente: eliminar `OrdersListFiltersSheet.tsx`.
3. Si sigue vigente: conectar el componente al flujo real de `OrdersList` (mobile)
   o documentar explícitamente en el propio archivo que está pendiente de
   integración, con referencia al GAP de seguimiento.

## Criterios de aceptación

- [ ] `OrdersListFiltersSheet.tsx` se elimina, o queda importado y renderizado
      desde al menos un punto real del árbol de `OrdersList`.
- [ ] `npm run type-check` y `npm run lint` limpios tras el cambio.

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno
