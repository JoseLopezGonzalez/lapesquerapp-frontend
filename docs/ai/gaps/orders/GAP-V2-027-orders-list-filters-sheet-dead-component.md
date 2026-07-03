---
id: GAP-V2-027
title: OrdersListFiltersSheet.tsx es un componente muerto — nunca importado
module: orders
category: code-quality
priority: P3
risk: low
size: XS
status: done
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

**Bloqueado por `gap-normalizer` (2026-07-03):** el paso 1 de la solución
propuesta ("Confirmar con Jose si `docs/mobile-app/implementacion/02-PLAN-LISTA-PEDIDOS-MOBILE.md`
Fase 3 sigue vigente") es una decisión de roadmap que solo Jose puede tomar —
determina si el archivo se elimina (plan descartado) o se conecta al flujo real
(plan vigente). No hay información disponible en el código o en `audit.md` para
inferir cuál de las dos opciones aplica. Pasa a `ready` en cuanto Jose confirme
el estado del plan de Fase 3.

Decisión de Jose (2026-07-03): el plan de Fase 3 (`docs/mobile-app/implementacion/02-plan-lista-pedidos-mobile.md`)
ya no está vigente — `OrdersList/index.tsx` resolvió búsqueda/filtros mobile de otra forma
(inline en el header). Eliminar el archivo.

## Resultado

Eliminado `src/components/Admin/OrdersManager/OrdersList/OrdersListFiltersSheet.tsx` (154
líneas). Confirmado por `grep -rn "OrdersListFiltersSheet" src/` antes de borrar: cero
importadores reales, solo el propio archivo y referencias en docs (`docs/mobile-app/**`,
`docs/audits/orders-block/**`) — no se tocan, quedan como rastro histórico del plan
descartado, no bloquean nada. `npm run type-check` limpio tras el borrado (no había ningún
import roto). Nota: `docs/mobile-app/implementacion/02-plan-lista-pedidos-mobile.md:253`
afirma "Implementado: Fases 1–7" incluyendo este archivo — es documentación desactualizada
de una iteración anterior, no se corrige aquí (fuera de `target_files` de este GAP).

## Resultado de auditoría

No aplica — GAP de tamaño XS/riesgo low con decisión explícita de Jose (eliminar), sin
lógica de negocio ni superficie de UI que verificar (el componente no se renderizaba en
ningún flujo real). `npm run type-check` limpio confirma que no queda ninguna referencia
rota.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno
