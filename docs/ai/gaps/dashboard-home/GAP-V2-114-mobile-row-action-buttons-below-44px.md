---
id: GAP-V2-114
title: Botones de acción por fila (mobile) en Recepciones/Salidas por debajo de 44x44px, agrupados con poco espaciado
module: dashboard-home
category: a11y-responsive
priority: P1
risk: low
size: M
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/ReceptionsListCard/index.tsx
  - src/components/Warehouse/DispatchesListCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-114 — Touch targets de 32px agrupados con `gap-0.5` en las filas mobile

## Problema

En la vista mobile (`sm:hidden`) de ambos componentes, cada fila tiene 2-3
botones de icono consecutivos con tamaño `h-8 w-8` (32×32px) y un espaciado de
solo `gap-0.5` (2px) entre ellos:

- `src/components/Warehouse/ReceptionsListCard/index.tsx:295-340` — botón
  mostrar/ocultar cantidad, botón imprimir recibo, botón imprimir etiquetas de
  lote (3 botones de 32px, `gap-0.5`).
- `src/components/Warehouse/DispatchesListCard/index.tsx:220-253` — botón
  mostrar/ocultar cantidad, botón imprimir (2 botones de 32px, `gap-0.5`).

El checklist mobile de `ui-audit-agent` exige "Touch targets minimum 44x44px".
Este es precisamente el tipo de vista (uso en almacén, posiblemente con
guantes, en tablet) donde la precisión táctil es más crítica y el margen de
error más alto (recepción/salida de materia prima, error al tocar el botón
equivocado puede disparar una impresión no deseada).

## Objetivo

Los botones de acción por fila en la vista mobile deben cumplir el mínimo de
44×44px de área táctil, o al menos tener suficiente espaciado entre ellos para
compensar un tamaño visual menor (área de toque ampliada vía padding
invisible, sin agrandar el icono visualmente si el espacio de la fila es
limitado).

## Contexto

Mismo patrón replicado en los dos componentes de listado de esta superficie.
No se ha verificado si este tamaño de botón (`h-8 w-8` icon buttons) es
consistente con el resto de la app fuera de este módulo — si es un patrón
global, este GAP debería señalarse también como PL candidate para
`system-learner` (regla de tamaño mínimo de icon-button en filas de lista
mobile).

## Solución propuesta

1. Aumentar el área táctil de los tres/dos botones por fila a mínimo 44×44px
   (p.ej. `h-11 w-11`, o mantener el icono visual pequeño con
   `min-h-[44px] min-w-[44px]` en el `Button` y icono interior a `h-4 w-4`).
2. Aumentar el `gap` entre botones de `gap-0.5` a al menos `gap-1.5`/`gap-2`
   para reducir toques accidentales al botón vecino.
3. Si el ancho de fila no permite 44px × 3 botones cómodamente, evaluar
   colapsar las acciones secundarias (imprimir recibo / imprimir etiquetas)
   detrás de un menú (`DropdownMenu`) en mobile, dejando solo el toggle de
   cantidad visible directamente.

## Criterios de aceptación

- [ ] Cada botón de acción en la vista mobile de ambos componentes tiene un
      área táctil ≥ 44×44px.
- [ ] Espaciado suficiente entre botones para evitar toques accidentales.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: probar en viewport de tablet (768px) y móvil (375px) que los tres
# botones son fácilmente distinguibles al tacto sin activar el vecino.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno — posible PL candidate para `system-learner`
