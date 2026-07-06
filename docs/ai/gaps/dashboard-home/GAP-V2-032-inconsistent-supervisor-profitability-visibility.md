---
id: GAP-V2-032
title: Visibilidad de rentabilidad para el rol supervisor inconsistente entre widgets del mismo dashboard
module: dashboard-home
category: domain-business
priority: P1
risk: medium
size: S
status: blocked
dependencies: []
target_files:
  - src/components/Admin/Dashboard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-032 — Visibilidad de rentabilidad para el rol supervisor inconsistente entre widgets del mismo dashboard

## Problema

`src/components/Admin/Dashboard/index.tsx:55,97-101` calcula `isSupervisor` y lo usa para
ocultar **un único** widget del grid: `OrderRankingChart` (ranking de pedidos por
cliente/país/producto).

```tsx
const isSupervisor = userRole === 'supervisor';
...
{!isSupervisor && (
  <div>
    <OrderRankingChart />
  </div>
)}
```

Sin embargo, en el mismo dashboard, `OrdersProfitabilitySummaryCard` (línea 82) y
`OrdersProfitabilityProductsCard` (línea 112) se renderizan **sin ninguna condición de rol**
y exponen a un `supervisor`:

- Margen bruto en euros y en % (`OrdersProfitabilitySummaryCard`: `grossMargin`,
  `marginPercentage`, `totalRevenue`, `totalCost`).
- Margen por kg y coste por kg desglosado por producto (`OrdersProfitabilityProductsCard`:
  `marginPerKg`, `costPerKg`, `revenuePerKg` por cada producto expedido).

Es decir: el sistema ya asume (con `OrderRankingChart` oculto) que hay una categoría de dato
— rentabilidad/cliente — que el rol `supervisor` no debería ver, pero dos widgets que exponen
un dato objetivamente más sensible (margen bruto real en €, coste por kg por producto) quedan
visibles para ese mismo rol sin ninguna restricción. Además, GAP-V2-009 (ya `ready`) añadirá
`OrdersProfitabilityTimelineCard` al grid ocultándolo específicamente para `supervisor` "siguiendo
el mismo criterio ya aplicado a `OrderRankingChart`" — lo que agravará la inconsistencia: tres
widgets de rentabilidad en el mismo dashboard, dos ocultos para supervisor y uno (el que ya
está en producción) visible.

## Objetivo

Que la visibilidad de datos de rentabilidad/margen para el rol `supervisor` sea consistente
en todo el dashboard: o bien ningún widget de rentabilidad se oculta para ese rol, o bien
todos los que expongan margen/coste (`OrdersProfitabilitySummaryCard`,
`OrdersProfitabilityProductsCard`, y el futuro `OrdersProfitabilityTimelineCard` de
GAP-V2-009) siguen el mismo criterio que `OrderRankingChart`.

## Contexto

Encontrado durante la auditoría domain-business de `dashboard-home` (carril
`domain-business-auditor`), superficie Admin/Dirección. **Requiere confirmación de Jose**:
¿cuál es la regla de negocio real? Posibles lecturas:
1. El rol `supervisor` no debe ver ningún dato de margen/rentabilidad (en cuyo caso
   `OrdersProfitabilitySummaryCard` y `OrdersProfitabilityProductsCard` llevan expuestos desde
   que se integraron sin la restricción correcta — sería el hallazgo más severo).
2. El rol `supervisor` sí puede ver rentabilidad agregada/por producto, pero no el ranking
   nominal por cliente concreto (dato más "personal"/comercial que "financiero") — en cuyo
   caso GAP-V2-009 debería revisarse para NO ocultar `OrdersProfitabilityTimelineCard` a
   supervisor, ya que sería coherente con el resto.

Sin esta confirmación no es posible determinar si el fix es "ocultar más" o "mostrar más".

## Solución propuesta

Sujeta a confirmación de Jose sobre la lectura correcta (ver Contexto). Una vez confirmada,
aplicar la misma condición `{!isSupervisor && (...)}` (o su ausencia) de forma uniforme a los
tres widgets de rentabilidad en `src/components/Admin/Dashboard/index.tsx`.

## Criterios de aceptación

- [ ] Confirmación de Jose sobre la regla de negocio real para el rol `supervisor` respecto a
      datos de rentabilidad/margen.
- [ ] Los tres widgets de rentabilidad (`OrdersProfitabilitySummaryCard`,
      `OrdersProfitabilityProductsCard`, `OrdersProfitabilityTimelineCard`) aplican el mismo
      criterio de visibilidad por rol.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Verificación manual: cargar /admin/home con un usuario de rol supervisor y confirmar que
# los tres widgets de rentabilidad se comportan igual entre sí (todos visibles u todos ocultos).
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-009 (integra `OrdersProfitabilityTimelineCard` oculto para
  supervisor — la resolución de este GAP puede requerir revisar esa decisión)
- **Pendiente de confirmación de Jose**: ver sección Contexto.
