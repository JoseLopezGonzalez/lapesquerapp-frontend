---
id: GAP-V2-033
title: OrderCard reimplementa el badge de estado inline en mobile en vez de reusar StatusBadge
module: orders
category: code-quality
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-033 — `OrderCard` duplica la lógica de `StatusBadge` en su variante mobile

## Problema

`src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx` renderiza el
badge de estado de dos formas distintas según el breakpoint:

- **Desktop** (líneas 159-169): usa el componente compartido
  `StatusBadge` (`src/components/Admin/OrdersManager/StatusBadge.tsx`).
- **Mobile** (líneas 114-134): reimplementa un badge equivalente a mano con
  `<span>` + clases Tailwind duplicadas (`bg-orange-500/15 text-orange-700...`)
  más un indicador de punto (`h-1.5 w-1.5 rounded-full`) que `StatusBadge` no
  soporta.

Las clases de color usadas coinciden con los tokens documentados en
`.claude/design-context.md` § Status Tokens (no es un hallazgo de color
hardcodeado — esa es una excepción documentada), pero sí es duplicación de
componente: la misma decisión visual (color por estado) vive en dos
implementaciones distintas dentro del mismo archivo, en vez de extender
`StatusBadge` para soportar el indicador de punto y reusarlo en ambas variantes.
Esto viola el checklist COMPONENTS ("no duplicar componentes shadcn/compartidos —
siempre importar el compartido") y aumenta el riesgo de que un cambio de estilo
de badge se aplique solo a una de las dos variantes.

## Objetivo

`OrderCard` usa `StatusBadge` en ambas variantes (mobile y desktop) para
representar el estado del pedido, con una única fuente de verdad para el mapeo
color↔estado.

## Solución propuesta

1. Extender `StatusBadge` (`src/components/Admin/OrdersManager/StatusBadge.tsx`)
   con una prop opcional, p.ej. `showDot?: boolean`, que renderice el indicador de
   punto (`h-1.5 w-1.5 rounded-full bg-{color}-500`) delante del label cuando se
   solicite — sin cambiar el comportamiento por defecto (sin dot) para los
   consumidores actuales.
2. Sustituir el `<span>` inline de `OrderCard` (variante mobile, líneas 114-134)
   por `<StatusBadge color={...} label={statusLabel} showDot />`.
3. Verificar visualmente que el resultado es idéntico al actual (mismo tamaño de
   texto, padding, tokens de color).

## Criterios de aceptación

- [ ] `OrderCard` no contiene una implementación de badge de estado distinta de
      `StatusBadge` en ninguna de sus dos variantes (mobile/desktop).
- [ ] El resultado visual en mobile es idéntico al actual (verificación manual o
      captura antes/después).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: comparar OrderCard mobile antes/después en /admin/orders-manager,
# confirmar que el badge con punto se ve igual.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-088 (histórico, normalización de color de badges de
  estado — cerrado; este GAP es sobre duplicación de componente, no de color)
