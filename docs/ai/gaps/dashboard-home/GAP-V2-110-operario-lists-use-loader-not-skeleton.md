---
id: GAP-V2-110
title: ReceptionsListCard y DispatchesListCard usan `<Loader>` para el loading de datos en vez de Skeleton
module: dashboard-home
category: ux-ui
priority: P1
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Warehouse/ReceptionsListCard/index.tsx
  - src/components/Warehouse/DispatchesListCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-110 — Loading de listas usa `<Loader>` en vez de `Skeleton`

## Problema

Tanto `ReceptionsListCard` como `DispatchesListCard` (usados por `OperarioDashboard`,
superficie `/operator`, `/warehouse/[storeId]` y `/admin/home` para rol operario)
usan el componente de sesión `Loader` para el estado de carga de datos:

- `src/components/Warehouse/ReceptionsListCard/index.tsx:250-253`:
  ```tsx
  {loading ? (
    <div className="flex flex-1 justify-center py-8">
      <Loader />
    </div>
  ) : ( ... )}
  ```
- `src/components/Warehouse/DispatchesListCard/index.tsx:177-180` — mismo patrón.

Esto contradice explícitamente `.claude/design-context.md` § 7 "What NOT To Do":
> Never use `<Loader>` (...) for data fetching states — only for session/auth
> loading gates.

y el checklist estándar de `ui-audit-agent`: "Loading state uses Skeleton — not
Loader (unless session gate) — not spinner". `loading` aquí viene de
`isLoading` de `useReceptionsList`/`useDispatchesList` (TanStack Query), es
exactamente el caso de "data fetching state", no session gate.

## Objetivo

El loading de ambas listas debe usar `Skeleton` con la forma del contenido que
sustituye (filas de tabla en desktop, cards en mobile), no un `Loader` genérico
centrado.

## Contexto

Ninguna dependencia. El resto del dashboard (`OperatorDashboardPage`,
`WarehouseOperatorPage`) sí usa `Loader` correctamente como session gate
(`status === 'loading'`), eso está bien y no debe tocarse.

## Solución propuesta

1. Reemplazar el bloque `loading ? <Loader /> : (...)` en ambos componentes por
   un `Skeleton` que imite la tabla/lista real: filas skeleton en el `<table>`
   desktop y cards skeleton en la vista mobile (`sm:hidden`).
2. Usar `Skeleton` de `@/components/ui/skeleton`, siguiendo el patrón de
   `EntityBody` (referencia en design-context.md § 6).
3. Mantener el número de filas skeleton razonable para `PER_PAGE = 9` (p.ej. 5-6
   filas skeleton es suficiente, no hace falta llenar las 9).

## Criterios de aceptación

- [ ] Ningún `<Loader>` usado para el estado `isLoading` de datos en ambos
      componentes.
- [ ] El Skeleton respeta la altura/estructura aproximada de la tabla desktop y
      de la lista mobile.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: simular isLoading=true (React Query Devtools o throttling de red) y
# verificar visualmente el Skeleton en ambos breakpoints.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-111 (mismo par de componentes, estado de error)
