---
id: GAP-V2-151
title: Recepciones y salidas de cebo del dashboard operario no se filtran por el almacén asignado (storeId)
module: dashboard-home
category: domain-business
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
  - src/services/domain/raw-material-receptions/rawMaterialReceptionService.js
  - src/services/domain/cebo-dispatches/ceboDispatchService.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-151 — `storeId` no filtra recepciones/salidas del dashboard operario

## Problema

`OperarioDashboard` recibe `storeId` (el almacén asignado al operario) desde sus 3 puntos de
entrada — `src/app/operator/page.js:23`, `src/app/admin/home/page.js:37`,
`src/app/warehouse/[storeId]/page.js:159` — y lo reenvía tal cual a
`ReceptionsListCard`/`DispatchesListCard` (`OperarioDashboard/index.tsx:162,165`), que
declaran el prop en su interfaz (`ReceptionsListCard/index.tsx:60-64`,
`DispatchesListCard/index.tsx:70-73`).

Pero ninguno de los dos componentes lo usa: `storeId` no se pasa a `useReceptionsList(page)`
(`ReceptionsListCard/index.tsx:69`) ni a `useDispatchesList(page)`
(`DispatchesListCard/index.tsx:79`) — ambas firmas de hook solo aceptan `page`
(`useReceptionsList.js:13`, `useDispatchesList.ts:10`). Los filtros que construyen ambos hooks
son solo de fecha (`{ dates: { start: today, end: today } }`), sin ningún filtro de almacén, y
ni `rawMaterialReceptionService.list`/`ceboDispatchService.list` reciben nunca un
`store_id`/`storeId` en `filters`.

Consecuencia de negocio: en un tenant con más de un almacén, el panel operativo diario que un
operario usa decenas de veces al día para ver "las recepciones y salidas de hoy" muestra las
de **todos** los almacenes del tenant mezcladas, no solo las del almacén en el que está
físicamente trabajando — pese a que la app sí sabe en qué almacén está (`storeId` llega desde
la ruta). Es además inconsistente con el lado de escritura: `OperarioCreateReceptionForm` y
`OperarioCreateCeboForm` sí reciben y usan `storeId` (`OperarioCreateReceptionForm/index.js:51`,
`OperarioCreateCeboForm/index.js:51`) para asociar la recepción/salida al almacén correcto al
crearla. El flujo de creación es store-aware; el flujo de lectura no.

## Objetivo

El operario solo debe ver, en su panel diario, las recepciones y salidas de cebo
correspondientes al almacén en el que está trabajando (`storeId`), igual que ya ocurre al
crearlas.

## Contexto

Depende de que el backend soporte un filtro de almacén en los endpoints
`raw-material-receptions` y `cebo-dispatches` (verificar contrato de API antes de implementar
— si el backend ya asocia `store_id` a estas entidades, probablemente ya expone el filtro).

## Solución propuesta

1. Propagar `storeId` desde `ReceptionsListCard`/`DispatchesListCard` a
   `useReceptionsList`/`useDispatchesList` como parámetro.
2. Añadir `storeId` a los `filters` que construyen ambos hooks y verificar que
   `addFiltersToParams` lo serializa correctamente hacia el backend.
3. Incluir `storeId` en el `queryKey` de ambos hooks (factories de `queryKeys.ts`) para que el
   caché de TanStack Query no mezcle datos de distintos almacenes.
4. Si un tenant solo tiene un almacén, verificar que el comportamiento no cambia (storeId
   `null`/`undefined` no debe filtrar en falso).

## Criterios de aceptación

- [ ] Un operario asignado al almacén A no ve recepciones/salidas creadas para el almacén B.
- [ ] El filtro de almacén se aplica en los 3 puntos de entrada (`/operator`, `/admin/home`,
      `/warehouse/[storeId]`).
- [ ] El comportamiento en tenants de un solo almacén no cambia.

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: con un tenant de 2+ almacenes, crear una recepción en el almacén A y
confirmar que no aparece en el dashboard operario del almacén B.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
