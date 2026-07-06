---
id: GAP-V2-111
title: ReceptionsListCard y DispatchesListCard ignoran el `error` de sus hooks y lo muestran como "sin datos hoy"
module: dashboard-home
category: ux-ui
priority: P0
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/ReceptionsListCard/index.tsx
  - src/components/Warehouse/DispatchesListCard/index.tsx
  - src/hooks/useReceptionsList.js
  - src/hooks/useDispatchesList.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-111 — Error de la petición se confunde con "no hay recepciones/salidas hoy"

## Problema

`useReceptionsList` (`src/hooks/useReceptionsList.js:24-29`) y
`useDispatchesList` (`src/hooks/useDispatchesList.ts:23-28`) ya exponen `error`
en su contrato de retorno, siguiendo el patrón estándar del proyecto
(`.claude/rules/hooks.md`):

```ts
return { data: data?.data ?? [], total: ..., isLoading, error: error?.message ?? null };
```

Sin embargo, ninguno de los dos componentes que los consumen desestructura
`error`:

- `src/components/Warehouse/ReceptionsListCard/index.tsx:69`:
  `const { data, total, isLoading: loading } = useReceptionsList(page);` — sin `error`.
- `src/components/Warehouse/DispatchesListCard/index.tsx:79`: mismo patrón.

Cuando la petición falla (500 del backend, 403, timeout), `data` queda `[]` por
el default, `isLoading` pasa a `false`, y el componente renderiza directamente
la rama `rows.length === 0` → "No hay recepciones" / "No hay salidas de cebo",
indistinguible de un día real sin movimiento. Para un operario de almacén que
usa este dashboard para verificar si ya se registró la recepción del día, este
falso negativo es operacionalmente relevante (mismo patrón ya detectado y
corregido en el resto del módulo dashboard-home — ver GAP-V2-003).

## Objetivo

Ambos componentes deben desestructurar `error` de su hook y mostrar un estado
de error visualmente distinto del estado vacío legítimo, antes de evaluar
`rows.length === 0`.

## Contexto

Mismo patrón que GAP-V2-003 (widgets del dashboard admin ignorando `error`),
aplicado aquí a la superficie operario. Sin dependencias entre sí — son
árboles de componentes distintos.

## Solución propuesta

1. En ambos hooks, `error` ya está expuesto correctamente — no requiere cambios
   (pero ver GAP-V2-115 para migrar `useReceptionsList.js` a `.ts` con factory
   de queryKey, cambio que puede aprovecharse en el mismo commit si Jose lo
   aprueba).
2. En `ReceptionsListCard` y `DispatchesListCard`, desestructurar `error` del
   hook y añadir una rama de error (mensaje `text-destructive`, mismo patrón
   sugerido en GAP-V2-003) antes de la rama vacía, tanto en la vista mobile
   como en el `<table>` desktop.
3. No disparar `notify.error` adicional aquí — este es un estado inline
   persistente mientras la query esté en error, no una acción puntual.

## Criterios de aceptación

- [ ] `error` desestructurado y renderizado en ambos componentes, mobile y
      desktop.
- [ ] El estado de error se distingue visualmente del estado "sin datos".
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: forzar un error en rawMaterialReceptionService.list / ceboDispatchService.list
# (mock temporal o cortar red) y confirmar que se muestra el estado de error, no "sin datos".
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-003 (mismo patrón en dashboard admin), GAP-V2-110, GAP-V2-115
