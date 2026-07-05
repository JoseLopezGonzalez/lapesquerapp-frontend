---
id: GAP-V2-096
title: PalletsListDialog no muestra estado vacío cuando la búsqueda/filtro no arroja resultados
module: pallets
category: ux-ui
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Stores/StoresManager/Store/PalletsListDialog/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-096 — Tabla/lista de `PalletsListDialog` sin estado vacío

## Problema

`PalletsListDialog/index.tsx` renderiza los palets filtrados (por especie seleccionada y texto
de búsqueda) tanto en una tabla HTML custom (desktop, `hidden sm:block`, líneas 271-400) como
en una lista de `PalletCard` (mobile, `sm:hidden`, líneas 403-419). Ninguna de las dos ramas
comprueba `filteredPallets.length === 0`: si la combinación de especie + búsqueda no produce
resultados, la tabla desktop renderiza solo la cabecera con un `<tbody>` vacío, y la lista
mobile renderiza un contenedor vacío — sin ningún mensaje, icono ni indicación de por qué no
hay filas. El componente no importa `EmptyState` en ningún punto del archivo.

Esto viola el patrón documentado en `design-context.md` § Empty States ("Icon → title →
description → optional action button. Never just text alone.") y el checklist DESKTOP del
propio auditor ("Table has empty state"). El resto de superficies de Pallets auditadas en la
primera pasada sí implementan `EmptyState` correctamente (p. ej. `EntityBody` en el listado
general, o los distintos `EmptyState` dentro de `PalletView`).

## Objetivo

`PalletsListDialog` muestra un `EmptyState` (icono + título + descripción, patrón de
`@/components/Utilities/EmptyState`) cuando `filteredPallets.length === 0`, tanto en la rama
desktop como en la mobile, distinguiendo opcionalmente entre "no hay palets en este almacén"
(sin búsqueda activa) y "sin resultados para esta búsqueda" (con búsqueda/filtro activo).

## Contexto

Ver `design-context.md` § Empty States y § Tables → Empty state. Ninguna otra vista de
Pallets auditada hasta ahora tiene este hueco — es específico de este diálogo, que usa una
tabla HTML custom en vez de `EntityBody` (por lo que no hereda automáticamente el
empty-state estándar del motor genérico).

## Solución propuesta

Añadir, antes del bloque `hidden sm:block` / `sm:hidden`, una comprobación
`filteredPallets.length === 0` que renderice `<EmptyState title=... description=... />` en
lugar de la tabla/lista vacía, reutilizando el mismo `EmptyState` en ambas ramas (desktop y
mobile) ya que el contenido es idéntico y solo cambia el layout circundante.

## Criterios de aceptación

- [ ] Cuando `filteredPallets.length === 0`, se muestra `EmptyState` (icono + título +
      descripción) en vez de una tabla/lista vacía, en desktop y en mobile.
- [ ] El mensaje distingue (o al menos no contradice) el caso "sin palets en el almacén" del
      caso "sin resultados para la búsqueda actual", si es sencillo de derivar de
      `searchText`/`selectedSpecies`.
- [ ] No hay regresión en el caso con resultados (tabla/lista se comporta igual que antes).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir el diálogo, buscar un texto que no coincida con ningún palet de la especie
# seleccionada, y confirmar que aparece un EmptyState en vez de una tabla/lista en blanco,
# tanto en viewport desktop como mobile.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: ninguno directo en esta pasada; mismo principio de
  `design-context.md` § Empty States aplicado en toda la primera pasada
