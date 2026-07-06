---
id: GAP-V2-009
title: Integrar OrdersProfitabilityTimelineCard en el grid del Dashboard (oculto para supervisor)
module: dashboard-home
category: ux-ui
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/index.tsx
  - src/components/Admin/Dashboard/OrdersProfitabilityTimelineCard/index.js
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-009 — Integrar OrdersProfitabilityTimelineCard en el grid del Dashboard

## Problema

`src/components/Admin/Dashboard/OrdersProfitabilityTimelineCard/index.js` es un
widget completo (240 líneas) que consume `useOrdersProfitabilityTimeline`
(`src/hooks/useOrdersStats.ts`) y `useProductOptions` — ambos hooks activos y en
uso por otros componentes — pero nunca se importa en
`src/components/Admin/Dashboard/index.tsx`. No es un ocultamiento condicional por
rol (el único condicional por rol en `index.tsx` es `!isSupervisor` sobre
`OrderRankingChart`, líneas 97-101): el widget simplemente nunca se añadió al
grid para ningún rol.

## Objetivo

`OrdersProfitabilityTimelineCard` se renderiza en el `Masonry` de `Dashboard`
junto a los otros widgets de rentabilidad (`OrdersProfitabilitySummaryCard`,
`OrdersProfitabilityProductsCard`), oculto para el rol `supervisor` siguiendo el
mismo criterio ya aplicado a `OrderRankingChart` (datos de rentabilidad/cliente
que ese rol no debe ver).

## Contexto

Decisión confirmada por Jose (2026-07-05): integrar. El widget hereda el mismo
problema de loading state que GAP-V2-001 (spinner `Loader2` + texto en vez de
`Skeleton`) — aplicar ese mismo fix aquí ya que se toca el archivo de todas formas.

## Solución propuesta

En `src/components/Admin/Dashboard/index.tsx`:
1. Importar `OrdersProfitabilityTimelineCard` desde `./OrdersProfitabilityTimelineCard`.
2. Añadirlo al `Masonry` junto a `OrdersProfitabilityProductsCard` (línea ~113),
   envuelto igual que sus hermanos: `<div className="box-border w-full max-w-full min-w-0 overflow-hidden">`.
3. Condicionarlo con `{!isSupervisor && (...)}` igual que `OrderRankingChart`.

En `OrdersProfitabilityTimelineCard/index.js`: aplicar el mismo fix de loading
state que GAP-V2-001 (reemplazar `Loader2` + "Cargando datos..." por `Skeleton`
siguiendo el patrón de `TransportRadarChart`/`DailyCalibersBySpeciesCard`).

## Criterios de aceptación

- [ ] `OrdersProfitabilityTimelineCard` se renderiza en el Dashboard para roles
      administrador/dirección/técnico, y no se renderiza para `supervisor`.
- [ ] El loading state del widget usa `Skeleton` en vez de `Loader2` + texto.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Verificación manual: cargar /admin/home con un usuario administrador y con uno
# supervisor, confirmar visibilidad condicional del widget.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-001 (mismo fix de loading state), GAP-V2-006 (split del hallazgo original de widgets huérfanos)
