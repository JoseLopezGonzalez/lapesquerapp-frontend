---
id: GAP-V2-076
title: useCrmDashboard no define staleTime — refetch en cada montaje del dashboard Comercial
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/hooks/useCrmDashboard.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-076 — Las 3 queries de `useCrmDashboard` usan `staleTime` por defecto (0)

## Problema

`useCrmDashboard.ts:13-30` define 3 queries en paralelo vía `useQueries` sin
`staleTime` en ninguna:

```ts
const [pendingActionsQuery, customersQuery, prospectsQuery] = useQueries({
  queries: [
    { queryKey: crmDashboardKeys.pendingActions(tenantId), queryFn: ..., enabled },
    { queryKey: crmDashboardKeys.customers(tenantId), queryFn: ..., enabled },
    { queryKey: crmDashboardKeys.prospects(tenantId), queryFn: ..., enabled },
  ],
});
```

Según `.claude/rules/hooks.md` § TanStack Query, `staleTime: undefined`
(default) está documentado como válido para "datos muy volátiles" — pero los
datos de este dashboard (agenda del día, clientes sin pedido en 30+ días,
prospectos sin actividad en 7+ días) no cambian con esa frecuencia; son más
parecidos a "pedidos, palets" (categoría documentada con `staleTime: 60 * 1000`)
que a datos que cambian segundo a segundo. Sin `staleTime`, cada vez que el
comercial navega fuera de `/comercial` y vuelve (o cambia de pestaña y vuelve,
con `refetchOnWindowFocus` activo por defecto en TanStack Query), las 3
queries se revalidan contra el backend aunque los datos no hayan cambiado
realmente.

## Objetivo

Las 3 queries de `useCrmDashboard` usan `staleTime: 60 * 1000` (1 minuto),
consistente con la convención de "datos cambiantes" ya aplicada a
`useOrdersStats.ts`/`useStockStats.ts` en este mismo módulo.

## Contexto

Hallazgo de tipo `IMPROVEMENT` — no bloquea nada, no genera datos incorrectos
(TanStack Query con `staleTime: 0` sigue sirviendo datos cacheados
inmediatamente mientras revalida en segundo plano), pero genera tráfico de red
evitable en una vista que un comercial probablemente visita varias veces por
turno.

## Solución propuesta

Añadir `staleTime: 60 * 1000` a cada una de las 3 queries en
`useCrmDashboard.ts:13-30`.

## Criterios de aceptación

- [ ] Las 3 queries de `useCrmDashboard` tienen `staleTime: 60 * 1000`.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: navegar a /comercial, salir y volver dentro de 1 minuto — confirmar
# que no se dispara una petición de red nueva a crm/dashboard/* (React Query
# Devtools o pestaña Network).
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
