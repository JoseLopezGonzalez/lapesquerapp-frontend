---
id: GAP-V2-193
title: useFieldOrders y useFieldRoutes no definen staleTime — refetch en cada mount
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/hooks/useFieldOrders.ts
  - src/hooks/useFieldRoutes.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-193 — Falta `staleTime` en los hooks de pedidos y rutas operativas

## Problema

`.claude/rules/hooks.md` documenta la convención de `staleTime` por volatilidad de dato,
incluyendo explícitamente `60 * 1000 // 1 minuto — datos cambiantes (pedidos, palets)`.
`useFieldOrders` (`src/hooks/useFieldOrders.ts:30-39`) y `useFieldRoutes`
(`src/hooks/useFieldRoutes.ts:28-37`) — el equivalente de "pedidos" y "rutas" para el rol
Field — no definen `staleTime` en ninguno de sus `useQuery`, por lo que usan el default
de TanStack Query (`0`, dato considerado obsoleto inmediatamente). Esto provoca un
refetch de red cada vez que `FieldDashboard` se monta (p. ej. al volver de `/field/rutas`
o `/field/pedidos` con back/forward), cuando el dato de rutas/pedidos del día no cambia
con esa frecuencia durante una sesión de reparto.

## Objetivo

`useFieldOrders` y `useFieldRoutes` fijan `staleTime: 60 * 1000` (1 minuto), alineado con
el resto de hooks de pedidos/palets del proyecto (`useOrder.ts`, `usePallet.ts`).

## Contexto

Cambio de una sola línea por hook, sin impacto en la forma del dato devuelto ni en las
queryKeys. Bajo riesgo.

## Solución propuesta

1. En `useFieldOrders` (dentro de `useQuery` en `useFieldOrders.ts:30`), añadir
   `staleTime: 60 * 1000`.
2. En `useFieldRoutes` (dentro de `useQuery` en `useFieldRoutes.ts:28`), añadir
   `staleTime: 60 * 1000`.
3. Verificar que `useFieldRoute` (detalle de ruta, `useFieldRoutes.ts:45-58`) y
   `useFieldOrder` (detalle de pedido, `useFieldOrders.ts:47-69`) también se benefician
   del mismo `staleTime` si se usan en pantallas donde el usuario navega ida y vuelta
   (`/field/rutas/[id]`, `/field/pedidos/[id]`).

## Criterios de aceptación

- [ ] `useFieldOrders` y `useFieldRoutes` (y opcionalmente sus variantes de detalle)
      tienen `staleTime: 60 * 1000`.
- [ ] `npm run lint` y `npm run type-check` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: /field — navegar a /field/pedidos y volver al dashboard; confirmar que no
# hay parpadeo de loading si el dato tiene menos de 1 minuto.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
