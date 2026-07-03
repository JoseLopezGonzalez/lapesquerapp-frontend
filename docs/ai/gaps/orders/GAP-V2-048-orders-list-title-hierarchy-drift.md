---
id: GAP-V2-048
title: Normalizar el título de página de OrdersList al patrón documentado (text-xl font-medium)
module: orders
category: ux-ui
priority: P3
risk: low
size: XS
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/OrdersList/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-048 — Normalizar el título de página de OrdersList al patrón documentado (text-xl font-medium)

## Problema

`design-context.md` § Typography documenta el título de página/sección como
`text-xl font-medium` (patrón `EntityHeader <h2>`, referencia de todo el proyecto). El
título "Pedidos Activos" de `OrdersList/index.tsx` — el mismo texto, el mismo elemento
semántico — se renderiza con **dos tratamientos distintos entre sí y ninguno igual al
documentado**:

- Mobile (`OrdersList/index.tsx:181`): `text-xl font-normal dark:text-white`.
- Desktop (`OrdersList/index.tsx:202`): `text-lg font-semibold sm:text-xl dark:text-white`.

Ni `font-normal` (mobile) ni `font-semibold` (desktop) están en la escala documentada, y
además difieren entre sí para el mismo título — el usuario ve el título del listado de
pedidos más ligero en mobile y más pesado en desktop sin ninguna razón de jerarquía que lo
justifique.

## Objetivo

El título "Pedidos Activos" usa `text-xl font-medium` tanto en mobile como en desktop,
igual que el resto de títulos de página/sección del proyecto (`EntityHeader`).

## Contexto

Extiende `PL-024` (recurrencia de pesos fuera de escala) a la superficie de listado, no
cubierta por GAP-096 ni por GAP-V2-009/014 (que trataron copy/tildes/capitalización de este
mismo archivo, no peso tipográfico).

**Nota de `gap-normalizer` (2026-07-03):** GAP-V2-046 señalaba originalmente el mismo
`OrdersList/index.tsx:202` (`font-semibold` en desktop) como parte de su batch general de
`font-semibold`. Se fusionó aquí porque este GAP ya cubre el caso completo (ambas variantes,
mobile y desktop, no solo el `font-semibold` de escritorio) — GAP-V2-046 quedó con ese archivo
retirado de su alcance.

## Solución propuesta

- Línea 181 (mobile): `text-xl font-normal` → `text-xl font-medium`.
- Línea 202 (desktop): `text-lg font-semibold sm:text-xl` → `text-xl font-medium` (elimina
  también el escalón `text-lg → sm:text-xl`, ya que el documentado es un tamaño fijo, no una
  transición de breakpoint).

## Criterios de aceptación

- [ ] El `<h2>` mobile y el `<h2>` desktop de `OrdersList` usan idéntica clase de tipografía:
      `text-xl font-medium`.
- [ ] No cambia el layout circundante (padding, iconos, botones).

## Plan de validación

```text
npm run lint
npm run type-check
# Manual: comparar el título "Pedidos Activos" en mobile y desktop — debe verse con el mismo
# peso/tamaño que otros títulos de página del proyecto (p.ej. EntityHeader de otros módulos).
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

### Veredicto: ✅ APROBADO

Ambos `<h2>` ("Pedidos Activos") de `OrdersList/index.tsx` usan ahora
`text-xl font-medium dark:text-white` — mobile (línea 184) y desktop (línea 205).
El escalón de breakpoint `text-lg sm:text-xl` de la variante desktop se eliminó
por completo, tal como pedía la solución propuesta. El resto del layout
(padding, botones, contador `activeCount`) no se tocó.

### Checklist

- [x] `<h2>` mobile y desktop usan idéntica clase `text-xl font-medium`
- [x] Layout circundante sin cambios (verificado por diff — solo 2 líneas
      tocadas)
- [x] Sin fetch/hardcode/`.js` nuevo/`any` — cambio puramente de className

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-046 (mismo hallazgo base, otras superficies), GAP-V2-009/014
  (copy/capitalización del mismo archivo, distinto eje)
