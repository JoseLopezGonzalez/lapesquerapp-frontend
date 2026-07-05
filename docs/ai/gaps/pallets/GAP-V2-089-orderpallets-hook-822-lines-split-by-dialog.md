---
id: GAP-V2-089
title: OrderPallets/hooks/useOrderPallets.ts (822 líneas) mezcla 6+ diálogos sin relación — dividir por responsabilidad
module: pallets
category: architecture-refactor
priority: P2
risk: medium
size: L
status: ready
dependencies:
  - GAP-V2-088
target_files:
  - src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts
created_at: 2026-07-05
updated_at: 2026-07-06
normalized_at: 2026-07-05
---

# GAP-V2-089 — Dividir `OrderPallets/hooks/useOrderPallets.ts` por responsabilidad

## Problema

`src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`
tiene 822 líneas y mezcla el estado y los handlers de al menos 6 superficies de UI
sin relación funcional entre sí, todas devueltas desde el mismo hook (líneas
749-822, ~70 propiedades exportadas):

1. Diálogo de editar/crear palet individual (`isPalletDialogOpen`,
   `selectedPalletId`, `handleOpenEditPallet`, `handlePalletChange`,
   `handleClonePallet` — líneas 70-131, 145-162, 274-313).
2. Diálogo de selección de almacén para palet nuevo (`isStoreSelectionOpen`,
   `handleStoreSelection` — líneas 72-73, 133-143).
3. Diálogo de confirmación genérico para borrar/desvincular/desvincular-todos
   (`isConfirmDialogOpen`, `confirmAction`, `handleConfirmAction` — líneas 74-76,
   164-174, 315-358).
4. Diálogo de etiqueta de palet (`isPalletLabelDialogOpen`,
   `selectedPalletForLabel` — líneas 77-78, 176-189).
5. Diálogo de búsqueda/vinculación masiva de palets (`isLinkPalletsDialogOpen`,
   `palletIds`, `searchResults`, `paginationMeta`, `handleSearchPallets`,
   `handleLinkSelectedPallets` — líneas 80-90, 360-547; ver GAP-V2-088 para el
   problema de fondo de esta parte).
6. Diálogo de creación de palet desde previsión, incluyendo un algoritmo de
   reparto de peso y construcción de GS1-128 embebido (`isCreateFromForecastDialogOpen`,
   `handleCreatePalletFromForecast` — líneas 98-103, 558-747).
7. Impresión de etiquetas de expedición, individual y masiva
   (`handlePrintPalletExpeditionLabel`, `handlePrintSelectedPalletExpeditionLabels` —
   líneas 205-272).

Viola ARQUITECTURA del checklist ("Hooks follow single responsibility — one concern
per hook"). El propio proyecto ya tiene el patrón de referencia para este caso:
`useOrder.ts`/`usePallet.ts` fueron divididos en sub-hooks por dominio
(`hooks/orders/*`, `hooks/pallets/*`) precisamente para evitar hooks monolíticos —
este hook de componente (que vive en un árbol de feature, no en `src/hooks/`, pero
sigue el mismo antipatrón de tamaño) no ha recibido el mismo tratamiento.

Costo concreto de esta mezcla: cualquier cambio en, por ejemplo, la lógica de
impresión de etiquetas obliga a releer un archivo de 822 líneas para entender qué
otras 6 superficies de estado podrían verse afectadas por un error de dependencias
en un `useCallback` mal delimitado, y dificulta el testing aislado de cada
sub-flujo (no hay tests para este hook — ver `.claude/rules/testing.md`, hooks son
prioridad alta para tests, pero un hook de 822 líneas con 7 responsabilidades es
impracticable de testear como unidad).

## Objetivo

`useOrderPallets.ts` (componente) queda como un orquestador delgado que compone
sub-hooks por responsabilidad, sin lógica de negocio propia más allá de la
composición — mismo patrón que `useOrder.ts`/`usePallet.ts`.

## Contexto

Depende de GAP-V2-088 (la parte de búsqueda/vinculación debe migrar a TanStack Query
antes o durante la extracción a su propio sub-hook, para no dividir el archivo dos
veces). No confundir con el sub-hook `src/hooks/orders/useOrderPallets.ts` — mismo
nombre, capa distinta, ya cubierto por GAP-V2-001/025/026.

## Solución propuesta

Extraer a sub-hooks bajo un directorio nuevo
`src/components/Admin/OrdersManager/Order/OrderPallets/hooks/`:

- `usePalletEditDialog.ts` — puntos 1 y 2 (editar/crear/clonar palet + selección de
  almacén).
- `useConfirmPalletAction.ts` — punto 3 (borrar/desvincular/desvincular-todos).
- `usePalletLabelDialog.ts` — punto 4.
- `useLinkPalletsSearch.ts` — punto 5, ya con `useQuery` tras GAP-V2-088.
- `useCreatePalletFromForecast.ts` — punto 6, incluyendo la extracción de
  `buildGs1128` y el reparto de peso a utilidades puras (ver GAP-V2-090).
- `usePalletExpeditionLabels.ts` — punto 7.

`useOrderPallets.ts` pasa a componer estos sub-hooks y devolver la misma superficie
pública (mismas ~70 propiedades) para no romper `OrderPalletsContent.tsx` ni el
resto del árbol de `OrderPallets/`.

## Criterios de aceptación

- [ ] `useOrderPallets.ts` (componente) queda por debajo de ~150 líneas, delegando en
      los sub-hooks listados arriba.
- [ ] La superficie pública devuelta por `useOrderPallets()` no cambia (mismos
      nombres de propiedades y funciones) — cero cambios requeridos en
      `OrderPalletsContent.tsx` ni en el resto de componentes consumidores.
- [ ] Cada sub-hook nuevo tiene una única responsabilidad clara y es testeable de
      forma aislada.
- [ ] `npm run type-check` y `npm run lint` pasan sin errores.

## Plan de validación

```text
npm run type-check
npm run lint
wc -l src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts
# Manual: probar cada uno de los 6 diálogos (editar, seleccionar almacén, confirmar
# acción, etiqueta de palet, vincular/buscar, crear desde previsión) y la impresión
# de etiquetas de expedición, individual y masiva.
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** GAP completo (mismo patrón ya
aplicado con éxito a `useOrder`/`usePallet`/`PalletView` — precedente claro,
criterios verificables), pero tamaño `L` — marcado `blocked` únicamente por la
regla dura "no ready sin autorización explícita de Jose para L/XL", mismo
tratamiento que GAP-V2-058/062/065 en la primera pasada. Depende de GAP-V2-088
(la parte de búsqueda debe migrar a TanStack Query antes o durante la extracción a
su propio sub-hook, para no dividir el archivo dos veces). Relacionado con
GAP-V2-090 (extracción de `buildGs1128`/reparto de peso, subconjunto de este
split más amplio, verificable de forma independiente).

**Decisión de Jose (2026-07-06):** autorizado — PR aislado, implementar después
de GAP-V2-088.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-088, GAP-V2-090, GAP-V2-062 (precedente: split de
  `PalletView` monolítico por tab)
