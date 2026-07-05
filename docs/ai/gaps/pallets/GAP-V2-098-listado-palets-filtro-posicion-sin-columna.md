---
id: GAP-V2-098
title: Filtro "Posición" (ubicado/no ubicado) en el listado de palets sin columna que confirme el resultado
module: pallets
category: ux-ui
priority: P3
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/configs/entities/entitiesConfig.stock.ts
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-098 — Listado de palets: filtro de posición sin columna visible

## Problema

La config de `pallets` en `entitiesConfig.stock.ts` define un filtro `position`
(`pairSelectBoxes` "Ubicado" / "No ubicado", líneas 482-491) pensado explícitamente para que
un operario de almacén encuentre palets sin posición física asignada dentro de un almacén.
Sin embargo, `table.headers` (líneas 577-637) no incluye ninguna columna que muestre esa
posición/slot: la única columna relacionada con ubicación es `store` (`path: 'store.name'`,
línea 587), que refleja el **almacén** al que pertenece el palet, no la **posición/slot**
dentro de ese almacén — un palet puede pertenecer a un almacén y aun así estar "no ubicado"
(sin slot asignado, ver `UnallocatedPositionSlideover` en la superficie de movimientos
auditada en esta misma pasada).

Resultado: un operario que filtra por "No ubicado" ve una tabla de resultados en la que no
hay ninguna columna que confirme visualmente por qué esos palets aparecen ahí — la columna
`store` puede seguir mostrando un nombre de almacén, lo cual puede leerse como contradictorio
con el filtro aplicado si el usuario no conoce la distinción interna entre "almacén" y
"posición dentro del almacén".

## Objetivo

El listado de palets incluye una columna (o un indicador visual claro) que refleje la
posición/slot dentro del almacén, de forma que el resultado del filtro "Ubicado/No ubicado"
sea verificable directamente en la tabla sin tener que abrir el detalle de cada palet.

## Contexto

Esta es una de las 3 superficies encargadas a esta segunda pasada de auditoría (listado de
palets). La ausencia de columna de posición es específica de la configuración de `pallets`,
no del motor genérico `EntityClient` (otras entidades no tienen este filtro).

## Solución propuesta

Añadir un header de tipo `text` con `path: 'position'` (o el campo equivalente que devuelva
el backend para la posición/slot dentro del almacén) a `table.headers` de la config de
`pallets`, mostrando `'-'` cuando el palet no tiene posición asignada (comportamiento ya
estándar de `renderByType` para valores nulos). Confirmar primero con el backend el nombre
exacto del campo que expone la posición/slot en el payload de listado de palets (puede no
coincidir con el campo `position` usado en el contexto de `StoreContext`).

## Criterios de aceptación

- [ ] La tabla de palets (`/admin/pallets`) muestra una columna con la posición/slot dentro
      del almacén (o `'-'` si no tiene).
- [ ] Filtrar por "No ubicado" muestra resultados cuya columna de posición es consistentemente
      `'-'`; filtrar por "Ubicado" muestra resultados con un valor de posición.
- [ ] Sin regresión en el resto de columnas/filtros existentes de la config de `pallets`.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: aplicar el filtro "No ubicado" en /admin/pallets y confirmar que la nueva columna
# de posición está vacía/'-' en todos los resultados; aplicar "Ubicado" y confirmar que todos
# tienen un valor.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: ninguno directo; superficie nueva en esta pasada (listado de palets)
