---
id: GAP-V2-194
title: FieldDashboard ignora el estado de error de useFieldRoutes/useFieldOrders
module: dashboard-home
category: code-quality
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldDashboard.jsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-194 — Sin manejo de error visible cuando fallan las queries del dashboard Field

## Problema

`FieldDashboard` (`src/components/Field/FieldDashboard.jsx:70-86`) desestructura
`{ data, isLoading }` de `useFieldRoutes` y `useFieldOrders`, pero ninguno de los dos
hooks expone su `error`/`errorMessage` al render. Ambos hooks ya calculan
`errorMessage: query.error instanceof Error ? query.error.message : null` (patrón
correcto, ver `useFieldRoutes.ts:41` y `useFieldOrders.ts:43`), pero el consumidor lo
descarta.

Si `getFieldRoutes` o `getFieldOrders` fallan (p. ej. 500 del backend, timeout de red en
campo con cobertura débil — escenario realista para un repartidor), `isLoading` pasa a
`false` sin `data`, y el componente renderiza silenciosamente el estado vacío ("Sin ruta
hoy", contadores en 0) como si el repartidor no tuviera ruta ni pedidos asignados ese
día. Esto es un falso negativo operativo: el usuario puede concluir que no tiene trabajo
asignado cuando en realidad hubo un error de red, sin ningún indicio de que algo falló.

Esto viola el patrón de manejo de errores documentado en `.claude/rules/components.md`
("Manejo de errores en componentes" — mostrar `error` cuando existe) y en
`.claude/rules/api-client.md`.

## Objetivo

Cuando `useFieldRoutes` o `useFieldOrders` devuelven `errorMessage`, `FieldDashboard`
muestra un estado de error explícito (no el mismo layout que "sin ruta"/"0 pedidos"),
con opción de reintentar (`refetch`).

## Contexto

Cambio acotado al componente, no requiere tocar hooks (ya exponen `errorMessage` y
`refetch`).

## Solución propuesta

1. Desestructurar también `errorMessage` y `refetch` de ambos hooks en
   `FieldDashboard`.
2. Antes del `if (loadingRoutes || loadingOrders) return <FieldDashboardSkeleton />`,
   añadir un chequeo de error (p. ej. `if (routesError || ordersError) return
   <FieldDashboardError onRetry={...} />`) siguiendo el patrón de error display de
   `components.md` (texto + color semántico, sin inventar un componente nuevo si ya
   existe uno reutilizable en `Utilities/`).
3. Confirmar si ya existe un componente de error genérico reutilizable en
   `src/components/Utilities/` antes de crear uno nuevo (regla de "extender antes de
   crear" de `components.md`).

## Criterios de aceptación

- [ ] Un error de red en rutas u pedidos operativos muestra un estado de error visible,
      distinto del estado vacío legítimo.
- [ ] Existe una acción de reintento (`refetch`) accesible desde ese estado.
- [ ] `npm run lint` y `npm run type-check` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: simular un 500 en /field/routes o /field/orders (mock/backend local) y
# confirmar que /field muestra el estado de error, no "Sin ruta hoy" con 0 pedidos.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-190
