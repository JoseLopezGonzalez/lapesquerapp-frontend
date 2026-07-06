---
id: GAP-V2-112
title: "storeId se pasa a ReceptionsListCard/DispatchesListCard pero nunca se usa para filtrar — verificar scoping por almacén"
module: dashboard-home
category: data-api
priority: P1
risk: medium
size: M
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/OperarioDashboard/index.tsx
  - src/components/Warehouse/ReceptionsListCard/index.tsx
  - src/components/Warehouse/DispatchesListCard/index.tsx
  - src/hooks/useReceptionsList.js
  - src/hooks/useDispatchesList.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-112 — `storeId` es una prop muerta: las listas de recepciones/salidas no se filtran por almacén

## Problema

`OperarioDashboard` recibe un `storeId` (del operario autenticado en
`/operator`, o del almacén de la URL en `/warehouse/[storeId]`) y lo propaga
explícitamente:

```tsx
// src/components/Warehouse/OperarioDashboard/index.tsx:162,165
<ReceptionsListCard storeId={storeId} />
<DispatchesListCard storeId={storeId} />
```

Ambos componentes declaran la prop en su interfaz (`ReceptionsListCardProps`,
`DispatchesListCardProps`) pero **nunca la usan** en el cuerpo del componente —
confirmado con grep, `storeId` solo aparece en la firma de la interfaz y en la
destructuración de props, en ningún otro punto de ambos archivos. Los hooks que
consultan los datos (`useReceptionsList(page)`, `useDispatchesList(page)`) no
aceptan ni reciben `storeId` como parámetro, y los filtros que construyen
(`{ dates: { start: today, end: today } }`) no incluyen ningún filtro de
almacén.

Esto significa que, para un tenant con más de un almacén (`stores`), el
operario del almacén A vería en su dashboard las recepciones/salidas de
**todos** los almacenes del tenant registradas hoy, no solo las del almacén al
que está asignado — a menos que el filtrado ya ocurra implícitamente en el
backend (p.ej. por el usuario autenticado o por un scope de sesión no visible
desde el frontend).

## Objetivo

Confirmar con el backend si `raw-material-receptions` y `cebo-dispatches` se
filtran por almacén de alguna forma implícita. Si no es así, propagar `storeId`
como filtro real en ambos hooks y servicios, para que el operario solo vea
movimiento de su propio almacén.

## Contexto

Este hallazgo puede solaparse con el carril `permissions-multitenant-auditor`
de este mismo `/deep-audit-module` (aislamiento de datos). Se deja como
candidato aquí porque el síntoma es visible directamente en el wiring de props
de este componente; si el otro carril ya lo señala, debe deduplicarse en
`gap-normalizer`.

**Pregunta abierta para Jose:** ¿el backend ya scope-a por almacén vía el
usuario autenticado (p.ej. `assignedStoreId` del JWT), o el filtro de almacén
debe añadirse explícitamente en el frontend? Sin confirmar esto no se puede
saber si es un bug real o una prop planeada para un uso futuro (p.ej. cuando
administrador/técnico visite `/warehouse/[storeId]` y sí necesite filtrar).

## Solución propuesta

1. Verificar en el backend (`raw-material-receptions`, `cebo-dispatches`
   endpoints) si existe algún filtro por `store_id`/`warehouse_id` disponible.
2. Si existe: pasar `storeId` como filtro en `useReceptionsList`/
   `useDispatchesList` → servicios → query params, e incluirlo en la queryKey
   (rompe cache compartida entre distintos storeId).
3. Si no existe soporte de backend: documentar como deuda de backend y decidir
   si mostrar temporalmente un aviso ("mostrando movimiento de todos los
   almacenes") o si se prioriza el endpoint de filtro.
4. Si se determina que la prop es completamente vestigial (nunca tuvo
   intención de filtrar), eliminarla de ambos componentes para no sugerir un
   comportamiento que no existe.

## Criterios de aceptación

- [ ] Confirmado con el backend (o con Jose) si existe scoping por almacén.
- [ ] Si aplica: `storeId` se usa como filtro real en ambos hooks/servicios y
      forma parte de la queryKey.
- [ ] Si no aplica: `storeId` se elimina de las props o se documenta
      explícitamente por qué se mantiene sin uso.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: con un tenant de prueba con 2+ almacenes, crear una recepción en el
# almacén B y verificar que el operario del almacén A no la ve en su dashboard.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: posible solape con hallazgos de `permissions-multitenant-auditor`
