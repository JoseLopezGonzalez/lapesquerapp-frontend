---
id: GAP-V2-094
title: "\"Quitar de posición\" se ejecuta sin ninguna confirmación desde 3 puntos de entrada distintos"
module: pallets
category: ux-ui
priority: P1
risk: medium
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/MapContainer/Map/Position/PositionPopover/index.js
  - src/hooks/useStorePositions.ts
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-094 — "Quitar de posición" ejecuta sin confirmación previa

## Problema

La acción "Quitar de posición" (que desasocia un palet de su posición física dentro de un
almacén — impacto físico real: un operario de almacén puede dejar de saber dónde está el
palet en el mapa) se dispara con un único clic, sin ningún `AlertDialog` de confirmación, desde
**3 puntos de entrada distintos** que llaman al mismo `removePalletFromPosition`:

1. `PositionSlideover/PalletCard/index.tsx:320` — `DropdownMenuItem` (vista desktop de la
   tarjeta, dentro del `Sheet` de detalle de posición).
2. `PositionSlideover/PalletCard/index.tsx:502` — botón en la cara trasera de la tarjeta (vista
   mobile "flip card").
3. `MapContainer/Map/Position/PositionPopover/index.js:48-50,174-181` — botón de icono
   (`MapPinX`, `text-destructive`) dentro del popover del mapa de almacén.

`src/hooks/useStorePositions.ts:216-234` ejecuta la llamada al servicio
(`removePalletPosition`) directamente al invocar la función — no hay ningún estado
intermedio de confirmación en el hook tampoco.

Esto contrasta con el patrón ya establecido en el propio módulo Pallets en la primera pasada
de esta auditoría: GAP-V2-068 ("Eliminar todas las cajas" sin confirmación en desktop) y
GAP-V2-069 ("Deshacer cambios" sin confirmación en desktop) — ambos flaggeados como P0/P1
precisamente por la falta de `AlertDialog` en acciones con consecuencia real. "Quitar de
posición" tiene el mismo perfil de riesgo pero en una superficie que la primera pasada no
cubrió (movimientos de almacén).

## Objetivo

"Quitar de posición" solicita confirmación explícita vía `AlertDialog` (patrón documentado en
`design-context.md` § Modals → Destructive confirmation pattern) antes de ejecutar la
desasociación, en los 3 puntos de entrada, reutilizando un único componente/hook de
confirmación para no triplicar la lógica.

## Contexto

Ver `design-context.md` § 8 UX Principles Inferred, punto 1: "Destructive actions always
require confirmation. Every delete, close, or irreversible operation triggers an
AlertDialog — never a direct `onClick` action." `ConfirmActionDialog` (usado en
`OrderPallets`, Superficie C de esta misma pasada) es un ejemplo ya implementado de patrón de
confirmación reutilizable con estado de `isSubmitting` que puede servir de referencia directa
para esta implementación.

## Solución propuesta

Introducir un `AlertDialog` de confirmación (nuevo componente compartido o extensión ligera de
`useStorePositions`/`StoreContext`) que se dispare antes de invocar
`removePalletFromPosition`, con el mismo patrón que `ConfirmActionDialog` de `OrderPallets`
(título, descripción con el impacto — "el palet dejará de estar asignado a esta posición" —,
botón de confirmación deshabilitado durante el envío). Cablear los 3 puntos de entrada al
mismo diálogo/estado de confirmación en `StoreContext` para evitar triplicar el componente.

## Criterios de aceptación

- [ ] "Quitar de posición" desde `PositionSlideover/PalletCard` (desktop dropdown y mobile
      flip-card) y desde `PositionPopover` (mapa) muestran un `AlertDialog` de confirmación
      antes de ejecutar.
- [ ] El botón de confirmación se deshabilita mientras la petición está en curso.
- [ ] Cancelar el diálogo no ejecuta ningún cambio.
- [ ] `removePalletFromPosition` en `useStorePositions.ts` no se invoca directamente desde el
      `onClick` de ningún botón sin pasar antes por el paso de confirmación.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: quitar un palet de su posición desde los 3 puntos de entrada (dropdown desktop,
# flip-card mobile, popover del mapa) y confirmar que en los 3 aparece el AlertDialog antes
# de ejecutar la acción, y que "Cancelar" no produce ningún cambio.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-068, GAP-V2-069 (mismo patrón de confirmación ausente, primera
  pasada, superficie de creación/edición)
