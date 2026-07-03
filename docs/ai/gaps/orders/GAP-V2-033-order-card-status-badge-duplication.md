---
id: GAP-V2-033
title: OrderCard reimplementa el badge de estado inline en mobile en vez de reusar StatusBadge
module: orders
category: code-quality
priority: P3
risk: low
size: XS
status: done
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

### Veredicto: ⚠️ APROBADO CON OBSERVACIONES

`StatusBadge.tsx` extendido con `showDot?: boolean` (default `false`, sin cambiar
el comportamiento de los consumidores existentes) y `dotClasses` mapeado 1:1 con
`colorClasses`. `OrderCard` (variante mobile) sustituye el `<span>` inline por
`<StatusBadge color={ringColor} label={statusLabel} showDot />`; `ringColor` se
calcula igual que antes (`pending→orange`, `finished→green`, `incident→red`), y
los badges Autoventa/Desde oferta/Maquilador que siguen en el mismo `div` no se
tocaron.

### Checklist

- [x] `OrderCard` no contiene una implementación de badge de estado distinta de
      `StatusBadge` en ninguna variante — confirmado en ambas ramas del ternario.
- [x] Mapeo de color por estado idéntico al original.
- [x] Badges hermanos (Autoventa/Desde oferta/Maquilador) sin cambios.
- [~] Resultado visual "idéntico" — ver observación.
- [x] Sin `fetch()`, sin hardcode de tenant, sin `.js` nuevo, sin `any`.

### Observaciones para Jose

No bloqueante, pero el resultado no es pixel-idéntico al original: el `<span>`
inline usaba `text-[11px]` y `rounded-full`; el `Badge` compartido
(`src/components/ui/badge.jsx`) aplica `text-xs` (12px), `rounded-4xl` y `h-5`
fijo. Es 1px de diferencia de tamaño de fuente y un `height` fijo que antes no
existía — en la práctica el resultado es más consistente con el resto de badges
del proyecto (todos usan `Badge`/`text-xs`), así que no lo considero un defecto,
pero técnicamente el criterio "idéntico al actual" del GAP no se cumple al
100%. Si Jose quiere paridad exacta de píxel, sería un ajuste de `className`
puntual en el `StatusBadge` de `OrderCard`; si no, queda como está.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-088 (histórico, normalización de color de badges de
  estado — cerrado; este GAP es sobre duplicación de componente, no de color)
