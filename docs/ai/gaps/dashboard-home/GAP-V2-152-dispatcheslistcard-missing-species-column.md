---
id: GAP-V2-152
title: DispatchesListCard omite la especie pese a que la salida de cebo la captura
module: dashboard-home
category: domain-business
priority: P2
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Warehouse/DispatchesListCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-152 — Falta la columna de especie en Salidas de cebo

## Problema

`ReceptionsListCard` muestra la especie de cada recepción tanto en desktop
(`ReceptionsListCard/index.tsx:361`, columna `ESPECIE`) como en mobile
(`ReceptionsListCard/index.tsx:290`, `row.species?.name`). `DispatchesListCard`, en cambio, no
tiene columna ni campo de especie en ningún breakpoint (`DispatchesListCard/index.tsx:270-277`
desktop, `212-219` mobile) — solo proveedor, cantidad y fecha.

Sin embargo `OperarioCreateCeboForm` sí captura la especie al dar de alta una salida de cebo
(selección de `species` en el paso 0, `OperarioCreateCeboForm/index.js:66-68,245-270`): el dato
existe en el dominio, simplemente no se muestra en la lista del dashboard.

Un operario que revisa "Salidas de cebo" en su panel diario no puede saber, sin abrir el
diálogo de impresión, qué especie se despachó — un dato de vocabulario de sector tan básico
como el proveedor o la fecha, y que sí está disponible para la recepción equivalente en la
misma pantalla. Esto es inconsistencia de superficie de datos entre dos list cards hermanas
del mismo dashboard.

## Objetivo

`DispatchesListCard` muestra la especie de cada salida de cebo, igual que
`ReceptionsListCard` ya hace para las recepciones.

## Solución propuesta

Añadir la especie a `DispatchRow` (tipo y datos que ya debería incluir el endpoint
`cebo-dispatches`, verificar el shape de respuesta) y renderizarla:
- Desktop: nueva columna `ESPECIE` entre `PROVEEDOR` y `CANTIDAD`, siguiendo el mismo patrón
  de `ReceptionsListCard/index.tsx:361,386`.
- Mobile: añadir `species?.name` a la línea de metadatos secundarios, igual que
  `ReceptionsListCard/index.tsx:289-293` (`[row.species?.name, ...].filter(Boolean).join(' · ')`).

## Criterios de aceptación

- [ ] La especie aparece en la tabla desktop y en la lista mobile de `DispatchesListCard`.
- [ ] Si el backend no incluye `species` en el listado de `cebo-dispatches`, se añade
      `_requiredRelations`/`with[]` en `ceboDispatchService.list` para cargarla (verificar
      antes de implementar).

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: confirmar que una salida de cebo creada con una especie X la muestra
correctamente en el dashboard operario.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
