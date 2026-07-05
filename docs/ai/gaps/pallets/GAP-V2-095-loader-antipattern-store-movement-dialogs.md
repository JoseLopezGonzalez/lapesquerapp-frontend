---
id: GAP-V2-095
title: "<Loader/> usado como estado de carga de datos en 3 diálogos de movimiento/vinculación de palets (PL-023 recurrence)"
module: pallets
category: ux-ui
priority: P1
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Stores/StoresManager/Store/MovePalletToStoreDialog/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/MoveMultiplePalletsToStoreDialog/index.tsx
  - src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/LinkPalletsDialog.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-095 — `<Loader/>` en vez de `Skeleton` para cargar listas de almacenes/palets

## Problema

Recurrencia de PL-023 (ya documentada en `project-learnings.md` para el editor de pedidos, y
ya flaggeada una vez en la primera pasada de esta misma auditoría de Pallets —
`GAP-V2-063`, `PalletTimeline`). El componente `<Loader>`
(`src/components/Utilities/Loader/index.js`), documentado en `design-context.md` § Loading
States como exclusivo para gates de sesión/auth de página completa, se usa en 3 diálogos
distintos de esta segunda pasada como sustituto de `Skeleton` para cargar **listas de datos**:

- `MovePalletToStoreDialog/index.tsx:119-122` — mientras `loading` (lista de almacenes vía
  `useStoresOptions`).
- `MoveMultiplePalletsToStoreDialog/index.tsx:457-460` — mismo caso, `storesLoading`, dentro de
  `StoreSection`.
- `OrderPallets/dialogs/LinkPalletsDialog.tsx:110-113` — `isInitialLoading` antes de mostrar el
  grid `Masonry` de palets encontrados para vincular.

En los 3 casos el contenido que reemplaza tiene una forma conocida y repetible (filas de
almacén con icono + texto, o tarjetas de palet en grid) — exactamente el escenario que
`design-context.md` § Loading States describe como el caso de uso correcto para `Skeleton`
("Loading states match the shape of the content they replace").

## Objetivo

Los 3 diálogos muestran `Skeleton` con la forma del contenido real (filas de almacén /
tarjetas de palet) mientras cargan, en vez de un spinner centrado genérico.

## Contexto

Ver PL-023 en `.claude/project-learnings.md` y GAP-V2-063 (mismo anti-patrón, mismo módulo,
archivo distinto, primera pasada). Esta es ya la tercera-quinta recurrencia documentada del
mismo patrón en distintas superficies del proyecto.

## Solución propuesta

Sustituir el bloque `<Loader />` por un `Skeleton` con la forma de 3-5 filas de almacén (para
`MovePalletToStoreDialog` y `MoveMultiplePalletsToStoreDialog`) o de 2-4 tarjetas de palet en
grid (para `LinkPalletsDialog`), siguiendo el patrón de "Card lists" ya documentado en
`design-context.md` § Loading States (`<Skeleton className="h-10 w-full rounded-md" />`
repetido, adaptado a la altura real de una fila de almacén / tarjeta de palet).

## Criterios de aceptación

- [ ] Los 3 archivos usan `Skeleton` en vez de `<Loader />` para su estado de carga de datos.
- [ ] El `Skeleton` usado aproxima la altura/forma real del contenido que sustituye (fila de
      almacén o tarjeta de palet), no un placeholder genérico de tamaño arbitrario.
- [ ] `grep -rn "<Loader" src/components/Admin/Stores/StoresManager/Store src/components/Admin/OrdersManager/Order/OrderPallets`
      no devuelve resultados de uso como loading de datos (solo, si aplica, gates de
      sesión/auth).

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "<Loader" src/components/Admin/Stores/StoresManager/Store src/components/Admin/OrdersManager/Order/OrderPallets
# Manual: abrir los 3 diálogos con throttling de red (DevTools "Slow 3G") y confirmar que se
# ve un Skeleton con forma reconocible, no un spinner centrado.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-063 (misma recurrencia, `PalletTimeline`, primera pasada), PL-023
  en `.claude/project-learnings.md`
