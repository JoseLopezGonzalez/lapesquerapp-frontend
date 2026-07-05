---
id: GAP-V2-064
title: BoxesLabels/index.js — dead date-fns import, commented-out code, index-as-key, migrate to TSX
module: pallets
category: code-quality
priority: P3
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Pallets/PalletDialog/PalletView/BoxesLabels/index.js
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-064 — `BoxesLabels/index.js`: limpieza de calidad + migración a TSX

## Problema

Varios hallazgos concretos en un único archivo de 409 líneas:

**1. Import muerto que ensombrece una variable local (línea 25, 38):**

```js
import { set } from 'date-fns';
...
const productNames = useMemo(() => {
  const set = new Set();   // ← sombrea el import, que nunca se usa
  ...
```

El import `set` de `date-fns` no se usa en ningún punto del archivo (verificado:
las únicas apariciones de `set(` son `map.set(...)`, un método de `Map`, no la
función importada). Es un import muerto que además genera confusión de lectura al
compartir nombre con una variable local no relacionada.

**2. Código comentado (viola GENERAL checklist — "no commented-out code
blocks"):**
- Línea 35: `// console.log(pallet)`
- Línea 207: `// console.log('newGroupedBoxes', newGroupedBoxes);`
- Línea 367: `{/*  <TableHead>Caja ID</TableHead> */}`
- Línea 382: `{/* <TableCell>{box.id}</TableCell> */}`

**3. `key={index}` en lista dinámica (línea 319):**

```jsx
{groupedBoxes.map((group, index) => (
  <TableRow key={index}>
```

`groupedBoxes` se recalcula (`useMemo`) cada vez que cambian `productFilter` o
`lotFilter` — el orden y contenido de las filas cambia con los filtros, por lo
que usar el índice como `key` puede causar que React reutilice el DOM/estado
incorrecto de fila al filtrar. Existe una clave estable disponible: el propio
componente ya construye `key = \`${box.product.name}-${box.lot}\`` al agrupar
(línea 56) — se puede reusar como `key` de la fila.

**4. Archivo `.js` sin tipos:** props (`pallet`, `setBoxPrinted`) sin interfaz,
todos los parámetros de callback con `any` implícito.

## Objetivo

`BoxesLabels` es un `.tsx` tipado, sin imports muertos, sin código comentado, y
con `key` estable en la tabla de etiquetas agrupadas.

## Contexto

Ninguno de estos hallazgos requiere decisiones de producto — son correcciones de
calidad directas dentro del mismo archivo.

## Solución propuesta

- Eliminar el import `import { set } from 'date-fns'`.
- Eliminar las 4 líneas de código comentado.
- Cambiar `key={index}` por `key={\`${group.product.id}-${group.lot}\`}` (mismo
  criterio que la clave de agrupación).
- Migrar `index.js` → `index.tsx`, tipando `BoxesLabelsProps` (`pallet:
  PalletState`, `setBoxPrinted: (boxId: number | string) => void` — reusar tipos
  de `@/hooks/pallets/palletHelpers`).

## Criterios de aceptación

- [ ] Sin import de `date-fns` en el archivo.
- [ ] Sin bloques de código comentado.
- [ ] `key` de `groupedBoxes.map` no usa el índice.
- [ ] Archivo migrado a `.tsx` con props tipadas, `npm run type-check` limpio.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** contenido completo, sin
solapamiento con otros candidatos — marcado `ready` sin cambios de fondo.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: ninguno
